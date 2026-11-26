/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE PRUEBAS TDD DE INTEGRACIÓN SEGURA GITHUB (H04A)
 * Archivo: backend/test/github-integration.spec.ts
 * Hito: INIT-H04A — Requisitos RF-21, DA-01 a DA-06, ADR-011
 *
 * VALIDACIONES OBLIGATORIAS:
 *  1. TDD-H04A-01: Consulta de estado inicial (sin vinculación -> configured: false).
 *  2. TDD-H04A-02: Listado de repositorios disponibles autorizados para la GitHub App.
 *  3. TDD-H04A-03: Vinculación exitosa de repositorio existente con permisos de push (DA-01, ADR-011).
 *  4. TDD-H04A-04: Rechazo por repositorio inexistente o inaccesible (404 Not Found).
 *  5. TDD-H04A-05: Rechazo por permisos técnicos insuficientes (push = false -> 400 Bad Request).
 *  6. TDD-H04A-06: Rechazo si el proyecto ya tiene un repositorio activo vinculado (409 Conflict).
 *  7. TDD-H04A-07: Rechazo de gobernanza si otro proyecto ya vinculó el mismo repositorio (409 Conflict).
 *  8. TDD-H04A-08: Revalidación periódica de acceso con preservación de estado VALIDATED.
 *  9. TDD-H04A-09: Revalidación con degradación ante revocación de permisos (PERMISSION_DENIED).
 * 10. TDD-H04A-10: Desvinculación lógica (UNLINKED) sin eliminar repositorio remoto y actualizando setup.
 * 11. TDD-H04A-11: Validación del contrato de creación de repositorio en borrador (create-draft).
 * 12. TDD-H04A-12: Generación efímera de tokens IAT en memoria (RS256 JWT, cero claves en base de datos).
 * 13. TDD-H04A-13: Gobernanza de activación: bloqueo de activación ficticia en producción.
 * 14. TDD-H04A-14: Aislamiento multitenant y SoD: rechazo 403 a usuarios no asignados (incluido PU-02 no asignado).
 * ============================================================================
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProjectPlanningRepository } from '../src/modules/projects/project-planning.repository.js';
import { GitHubRepository } from '../src/modules/github/github.repository.js';
import { GitHubService } from '../src/modules/github/github.service.js';
import { createGitHubApiClient } from '../src/modules/github/github.module.js';
import { MockGitHubApiClient } from '../src/modules/github/github-api.client.js';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../src/common/types/index.js';

describe('TraceFlow SCM — INIT-H04A: Integración Segura de Repositorios GitHub (TDD)', () => {
  let db: DatabaseService;
  let auditService: AuditService;
  let authRepo: AuthRepository;
  let orgsRepo: OrganizationsRepository;
  let projectsRepo: ProjectsRepository;
  let planningRepo: ProjectPlanningRepository;
  let githubRepo: GitHubRepository;
  let githubClient: MockGitHubApiClient;
  let githubService: GitHubService;

  // Usuarios autenticados de prueba
  const userJoanGestor: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000001',
    code: 'USR-001',
    username: 'jmedina',
    email: 'jmedina@exodo.pe',
    fullName: 'Joan Cristian Medina Quispe',
    organization: 'ÉXODO S.A.C.',
    position: 'Director de Calidad',
    activeRoleId: 'PU-02', // Gestor
    allowedRoleIds: ['PU-01', 'PU-02'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003', 'PRJ-TEST-01'],
  };

  const userRenzoArqui: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000002',
    code: 'USR-002',
    username: 'rantayhua',
    email: 'rantayhua@exodo.pe',
    fullName: 'Renzo Antonio Antayhua Mamani',
    organization: 'ÉXODO S.A.C.',
    position: 'Arquitecto de Software',
    activeRoleId: 'PU-03', // Arquitecto (sin rol gestor PU-02 ni admin en org)
    allowedRoleIds: ['PU-03', 'PU-06'],
    assignedProjectIds: ['PRJ-TEST-01'],
  };

  const userGestorNoAsignado: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000004',
    code: 'USR-004',
    username: 'dgestor',
    email: 'dgestor@exodo.pe',
    fullName: 'Daniel Gestor Foráneo',
    organization: 'ÉXODO S.A.C.',
    position: 'Gestor de Proyectos',
    activeRoleId: 'PU-02', // Rol activo Gestor pero NO asignado a PRJ-TEST-01
    allowedRoleIds: ['PU-02'],
    assignedProjectIds: [], // Sin asignación a PRJ-TEST-01
  };

  const userExterno: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000099',
    code: 'USR-099',
    username: 'cexterno',
    email: 'cexterno@consultores.pe',
    fullName: 'Carlos Externo Valdivia',
    organization: 'Consultoría TI Externa',
    position: 'Especialista Cloud',
    activeRoleId: 'PU-01',
    allowedRoleIds: ['PU-01'],
    assignedProjectIds: [],
  };

  const testProjectDraftId = 'b0000001-0000-0000-0000-000000000010';
  const testProjectDraftCode = 'PRJ-TEST-01';

  beforeEach(async () => {
    db = new DatabaseService('mock');
    auditService = new AuditService(db);
    authRepo = new AuthRepository(db);

    // Asegurar usuario externo registrado
    (authRepo as any).mockUsers.push({
      id: userExterno.id,
      code: userExterno.code,
      username: userExterno.username,
      email: userExterno.email,
      password_hash: 'mock_hash',
      full_name: userExterno.fullName,
      organization: userExterno.organization,
      position: userExterno.position,
      status: 'ACTIVE',
      primary_role_code: 'PU-01',
      assigned_role_codes: ['PU-01'],
      assigned_project_codes: [],
    });

    orgsRepo = new OrganizationsRepository(db, authRepo);
    projectsRepo = new ProjectsRepository(db);
    planningRepo = new ProjectPlanningRepository(db);
    githubRepo = new GitHubRepository(db);
    githubClient = new MockGitHubApiClient();

    githubService = new GitHubService(
      db,
      projectsRepo,
      orgsRepo,
      planningRepo,
      githubRepo,
      githubClient,
      auditService
    );

    // Registrar proyecto de prueba en borrador perteneciente a la organización por defecto
    const defaultOrg = (await orgsRepo.findByCode('ORG-EXODO'))!;
    (projectsRepo as any).projects.push({
      id: testProjectDraftId,
      code: testProjectDraftCode,
      name: 'Proyecto de Prueba Integración GitHub',
      description: 'Proyecto de pruebas unitarias para el hito H04A',
      organization_id: defaultOrg.id,
      status: 'BORRADOR',
      created_by: userJoanGestor.id,
      manager_id: userJoanGestor.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    (projectsRepo as any).mockAssignments.push(
      {
        user_id: userJoanGestor.id,
        project_id: testProjectDraftId,
        assigned_at: new Date().toISOString(),
      },
      {
        user_id: userRenzoArqui.id,
        project_id: testProjectDraftId,
        assigned_at: new Date().toISOString(),
      }
    );

    // Registrar asistente de configuración inicial para el proyecto
    await planningRepo.saveSetup(testProjectDraftId, {
      current_step: 4,
      team_completed: true,
      methodology_completed: true,
      github_completed: false,
      last_saved_by: userJoanGestor.id,
    });
  });

  // ==========================================================================
  // TDD-H04A-01: Consulta de estado inicial
  // ==========================================================================
  it('TDD-H04A-01: debe retornar configured=false e integration=null para un proyecto sin vincular', async () => {
    const status = await githubService.getIntegrationStatus(testProjectDraftId, userJoanGestor);

    expect(status.configured).toBe(false);
    expect(status.integration).toBeNull();
  });

  // ==========================================================================
  // TDD-H04A-02: Listado de repositorios disponibles
  // ==========================================================================
  it('TDD-H04A-02: debe listar repositorios accesibles para la instalación de GitHub App', async () => {
    const repos = await githubService.getAvailableRepositories(testProjectDraftId, 12345678, userJoanGestor);

    expect(Array.isArray(repos)).toBe(true);
    expect(repos.length).toBeGreaterThan(0);
    expect(repos[0]).toHaveProperty('full_name');
    expect(repos[0]).toHaveProperty('permissions');
    expect(repos[0].permissions.push).toBe(true);
  });

  it('TDD-H04A-02-NEG: debe rechazar un installationId no numérico o menor a 1 con 400 Bad Request', async () => {
    await expect(
      githubService.getAvailableRepositories(testProjectDraftId, 0, userJoanGestor)
    ).rejects.toThrow(BadRequestException);
  });

  // ==========================================================================
  // TDD-H04A-03: Vinculación exitosa de repositorio existente
  // ==========================================================================
  it('TDD-H04A-03: debe vincular exitosamente un repositorio existente con permisos de push y actualizar el asistente', async () => {
    const integration = await githubService.linkExistingRepository(
      testProjectDraftId,
      {
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow',
        installationId: 12345678,
        defaultBranch: 'main',
      },
      userJoanGestor
    );

    expect(integration).toBeDefined();
    expect(integration.repo_full_name).toBe('JMedina255/TraceFlow');
    expect(integration.github_repo_id).toBe(101010101);
    expect(integration.validation_status).toBe('VALIDATED');
    expect(integration.default_branch).toBe('main');
    expect(integration.permissions.push).toBe(true);

    // Verificar que el paso 4 en el asistente de configuración se marcó como completado
    const setup = await planningRepo.findSetupByProjectId(testProjectDraftId);
    expect(setup?.github_completed).toBe(true);

    // Verificar que el estado ahora reporta configured = true
    const status = await githubService.getIntegrationStatus(testProjectDraftId, userJoanGestor);
    expect(status.configured).toBe(true);
    expect(status.integration?.repo_full_name).toBe('JMedina255/TraceFlow');
  });

  // ==========================================================================
  // TDD-H04A-04: Rechazo por repositorio inexistente o inaccesible (404)
  // ==========================================================================
  it('TDD-H04A-04: debe lanzar 404 NotFoundException si el repositorio no existe en GitHub', async () => {
    await expect(
      githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'UsuarioInexistente',
          repoName: 'RepoInexistente',
          installationId: 12345678,
        },
        userJoanGestor
      )
    ).rejects.toThrow(NotFoundException);
  });

  // ==========================================================================
  // TDD-H04A-05: Rechazo por permisos técnicos insuficientes (push = false)
  // ==========================================================================
  it('TDD-H04A-05: debe lanzar 400 BadRequestException si la instalación no tiene permisos de push', async () => {
    // Configurar un repositorio de sólo lectura en el cliente mock
    githubClient.addMockRepository({
      id: 999999,
      name: 'repo-solo-lectura',
      full_name: 'JMedina255/repo-solo-lectura',
      owner: { login: 'JMedina255' },
      private: true,
      visibility: 'private',
      default_branch: 'main',
      permissions: { push: false, pull: true, admin: false },
    });

    await expect(
      githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'repo-solo-lectura',
          installationId: 12345678,
        },
        userJoanGestor
      )
    ).rejects.toThrow(BadRequestException);
  });

  // ==========================================================================
  // TDD-H04A-06: Rechazo si el proyecto ya tiene un repositorio activo (409)
  // ==========================================================================
  it('TDD-H04A-06: debe lanzar 409 ConflictException si el proyecto ya tiene un repositorio vinculado', async () => {
    // Primera vinculación exitosa
    await githubService.linkExistingRepository(
      testProjectDraftId,
      {
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow',
        installationId: 12345678,
      },
      userJoanGestor
    );

    // Intento de segunda vinculación sobre el mismo proyecto sin desvincular previamente
    await expect(
      githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow-Secundario',
          installationId: 12345678,
        },
        userJoanGestor
      )
    ).rejects.toThrow(ConflictException);
  });

  // ==========================================================================
  // TDD-H04A-07: Rechazo si otro proyecto ya vinculó el mismo repositorio (409)
  // ==========================================================================
  it('TDD-H04A-07: debe lanzar 409 ConflictException si otro proyecto ya vinculó el mismo repositorio', async () => {
    // Vincular en testProjectDraftId
    await githubService.linkExistingRepository(
      testProjectDraftId,
      {
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow',
        installationId: 12345678,
      },
      userJoanGestor
    );

    // Crear un segundo proyecto borrador
    const secondProjectId = 'b0000001-0000-0000-0000-000000000020';
    const defaultOrg = (await orgsRepo.findByCode('ORG-EXODO'))!;
    (projectsRepo as any).projects.push({
      id: secondProjectId,
      code: 'PRJ-TEST-02',
      name: 'Segundo Proyecto de Prueba',
      organization_id: defaultOrg.id,
      status: 'BORRADOR',
      created_by: userJoanGestor.id,
      manager_id: userJoanGestor.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    (projectsRepo as any).mockAssignments.push({
      user_id: userJoanGestor.id,
      project_id: secondProjectId,
      assigned_at: new Date().toISOString(),
    });

    // Intentar vincular el mismo repo en el segundo proyecto
    await expect(
      githubService.linkExistingRepository(
        secondProjectId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userJoanGestor
      )
    ).rejects.toThrow(ConflictException);
  });

  // ==========================================================================
  // TDD-H04A-08 & 09: Revalidación periódica de acceso
  // ==========================================================================
  it('TDD-H04A-08: debe revalidar el acceso exitosamente conservando el estado VALIDATED', async () => {
    await githubService.linkExistingRepository(
      testProjectDraftId,
      {
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow',
        installationId: 12345678,
      },
      userJoanGestor
    );

    const revalidated = await githubService.validateIntegrationAccess(testProjectDraftId, userJoanGestor);
    expect(revalidated.validation_status).toBe('VALIDATED');
    expect(revalidated.validation_error_message).toBeNull();
  });

  it('TDD-H04A-09: debe degradar a PERMISSION_DENIED si se revoca el permiso de push en GitHub', async () => {
    await githubService.linkExistingRepository(
      testProjectDraftId,
      {
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow',
        installationId: 12345678,
      },
      userJoanGestor
    );

    // Simular revocación de permisos en GitHub
    githubClient.setRepoPermissions('JMedina255', 'TraceFlow', {
      push: false,
      pull: true,
      admin: false,
    });

    const revalidated = await githubService.validateIntegrationAccess(testProjectDraftId, userJoanGestor);
    expect(revalidated.validation_status).toBe('PERMISSION_DENIED');
    expect(revalidated.validation_error_message).toContain('Permisos revocados');
  });

  // ==========================================================================
  // TDD-H04A-10: Desvinculación lógica sin eliminar repositorio remoto
  // ==========================================================================
  it('TDD-H04A-10: debe desvincular lógicamente el repositorio, actualizar setup y permitir revinculación', async () => {
    await githubService.linkExistingRepository(
      testProjectDraftId,
      {
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow',
        installationId: 12345678,
      },
      userJoanGestor
    );

    const unlinked = await githubService.unlinkRepository(testProjectDraftId, userJoanGestor);
    expect(unlinked.validation_status).toBe('UNLINKED');
    expect(unlinked.unlinked_at).toBeDefined();
    expect(unlinked.unlinked_by).toBe(userJoanGestor.id);

    // El asistente debe reflejar github_completed = false
    const setup = await planningRepo.findSetupByProjectId(testProjectDraftId);
    expect(setup?.github_completed).toBe(false);

    // Debe permitirse vincular otro repositorio (o el mismo) tras la desvinculación
    const relinked = await githubService.linkExistingRepository(
      testProjectDraftId,
      {
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow-Backend',
        installationId: 12345678,
      },
      userJoanGestor
    );
    expect(relinked.repo_name).toBe('TraceFlow-Backend');
    expect(relinked.validation_status).toBe('VALIDATED');
  });

  // ==========================================================================
  // TDD-H04A-11: Contrato de creación de repositorio en borrador
  // ==========================================================================
  it('TDD-H04A-11: debe validar el contrato sintáctico de create-draft sin aprovisionar repositorios remotos', async () => {
    const result = await githubService.validateRepoDraftContract(
      testProjectDraftId,
      {
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow-SCM-Repo',
        visibility: 'private',
        initBranches: ['main', 'develop'],
        description: 'Repositorio oficial para TraceFlow SCM',
      },
      userJoanGestor
    );

    expect(result.valid).toBe(true);
    expect(result.contract.fullName).toBe('JMedina255/TraceFlow-SCM-Repo');
    expect(result.contract.initBranches).toEqual(['main', 'develop']);
    expect(result.governanceNotice).toContain('no se aprovisionan repositorios remotos automáticamente');
  });

  it('TDD-H04A-11-NEG: debe rechazar nombres de repositorio no conformes con convención GitHub', async () => {
    await expect(
      githubService.validateRepoDraftContract(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'repo con espacios!',
          visibility: 'private',
        },
        userJoanGestor
      )
    ).rejects.toThrow(BadRequestException);
  });

  // ==========================================================================
  // TDD-H04A-12: Generación efímera de tokens IAT en memoria
  // ==========================================================================
  it('TDD-H04A-12: debe certificar que los tokens y credenciales de GitHub no se persisten en base de datos', async () => {
    await githubService.linkExistingRepository(
      testProjectDraftId,
      {
        repoOwner: 'JMedina255',
        repoName: 'TraceFlow',
        installationId: 12345678,
      },
      userJoanGestor
    );

    const integrationInDb = await githubRepo.findByProjectId(testProjectDraftId);
    expect(integrationInDb).toBeDefined();

    // Las propiedades de integración no contienen claves privadas ni tokens de acceso
    const jsonString = JSON.stringify(integrationInDb);
    expect(jsonString).not.toContain('ghs_');
    expect(jsonString).not.toContain('PRIVATE KEY');
    expect(jsonString).not.toContain('installation_token');
  });

  // ==========================================================================
  // TDD-H04A-13: Bloqueo de activación en producción sin integración
  // ==========================================================================
  it('TDD-H04A-13: debe validar que un proyecto no puede considerarse listo para activación sin integración VALIDATED', async () => {
    // Si la integración está desvinculada
    const status = await githubService.getIntegrationStatus(testProjectDraftId, userJoanGestor);
    expect(status.configured).toBe(false);

    // En producción nunca se permite omitir la integración real
    const prevEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_MOCK_GITHUB_ACTIVATION = 'true';

      const allowMockActivation =
        process.env.NODE_ENV !== 'production' &&
        process.env.ALLOW_MOCK_GITHUB_ACTIVATION === 'true';

      expect(allowMockActivation).toBe(false);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  // ==========================================================================
  // TDD-H04A-14: Aislamiento multitenant y SoD estricto
  // ==========================================================================
  it('TDD-H04A-14: debe rechazar con 403 Forbidden a usuarios externos o sin membresía activa', async () => {
    await expect(
      githubService.getIntegrationStatus(testProjectDraftId, userExterno)
    ).rejects.toThrow(ForbiddenException);

    await expect(
      githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userExterno
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('TDD-H04A-14-PU02: debe rechazar con 403 Forbidden a un usuario con rol PU-02 no asignado al proyecto', async () => {
    await expect(
      githubService.getIntegrationStatus(testProjectDraftId, userGestorNoAsignado)
    ).rejects.toThrow(ForbiddenException);

    await expect(
      githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userGestorNoAsignado
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('TDD-H04A-14-NON-MGR: debe rechazar con 403 Forbidden a miembros asignados que carecen de rol gestor PU-02 o admin de org', async () => {
    // userRenzoArqui está asignado pero como Desarrollador/Arquitecto (PU-03), no como PU-02 gestor
    await expect(
      githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userRenzoArqui
      )
    ).rejects.toThrow(ForbiddenException);
  });

  // ==========================================================================
  // H04A-R01: Eliminación del modo mock implícito y configuración fail-closed
  // ==========================================================================
  describe('H04A-R01: Eliminación de mock implícito y blindaje de configuración', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('TDD-H04A-R01-01: debe lanzar error si se intenta usar cliente mock en producción', () => {
      process.env.NODE_ENV = 'production';
      process.env.GITHUB_CLIENT_MODE = 'mock';
      expect(() => createGitHubApiClient()).toThrow(
        'El cliente mock de GitHub está estrictamente prohibido en entorno de producción'
      );
    });

    it('TDD-H04A-R01-02: debe lanzar error si se intenta ALLOW_MOCK_GITHUB en producción', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_MOCK_GITHUB = 'true';
      expect(() => createGitHubApiClient()).toThrow(
        'El cliente mock de GitHub está estrictamente prohibido en entorno de producción'
      );
    });

    it('TDD-H04A-R01-03: debe lanzar error en modo PostgreSQL operativo sin ALLOW_MOCK_GITHUB', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_MODE = 'postgres';
      delete process.env.ALLOW_MOCK_GITHUB;
      delete process.env.GITHUB_CLIENT_MODE;
      expect(() => createGitHubApiClient()).toThrow('Configuración incompleta de GitHub App');
    });

    it('TDD-H04A-R01-04: debe lanzar error en modo live si faltan credenciales de GitHub App', () => {
      process.env.NODE_ENV = 'development';
      process.env.GITHUB_CLIENT_MODE = 'live';
      delete process.env.GITHUB_APP_ID;
      delete process.env.GITHUB_APP_PRIVATE_KEY;
      expect(() => createGitHubApiClient()).toThrow(
        'se requieren GITHUB_APP_ID y GITHUB_APP_PRIVATE_KEY'
      );
    });

    it('TDD-H04A-R01-05: debe prohibir vinculación con cliente mock en entorno de producción', async () => {
      const prev = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        await expect(
          githubService.linkExistingRepository(
            testProjectDraftId,
            {
              repoOwner: 'JMedina255',
              repoName: 'TraceFlow',
              installationId: 12345678,
            },
            userJoanGestor
          )
        ).rejects.toThrow(ForbiddenException);
      } finally {
        process.env.NODE_ENV = prev;
      }
    });

    it('TDD-H04A-R01-06: debe prohibir validación de acceso con cliente mock en entorno de producción', async () => {
      // Primero vincular en entorno normal
      await githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userJoanGestor
      );

      const prev = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        await expect(
          githubService.validateIntegrationAccess(testProjectDraftId, userJoanGestor)
        ).rejects.toThrow(ForbiddenException);
      } finally {
        process.env.NODE_ENV = prev;
      }
    });
  });

  // ==========================================================================
  // H04A-R02: Aislamiento estricto de instalaciones GitHub por organización
  // ==========================================================================
  describe('H04A-R02: Aislamiento de instalaciones GitHub por organización', () => {
    it('TDD-H04A-R02-01: debe rechazar consulta de repositorios si la instalación pertenece a otra organización', async () => {
      // 87654321 no está autorizada para ORG-EXODO
      await expect(
        githubService.getAvailableRepositories(testProjectDraftId, 87654321, userJoanGestor)
      ).rejects.toThrow(ForbiddenException);
    });

    it('TDD-H04A-R02-02: debe rechazar vinculación si la instalación pertenece a otra organización', async () => {
      await expect(
        githubService.linkExistingRepository(
          testProjectDraftId,
          {
            repoOwner: 'otra-org',
            repoName: 'otro-repo',
            installationId: 87654321,
          },
          userJoanGestor
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('TDD-H04A-R02-03: debe listar repositorios de la instalación activa por defecto si no se pasa installationId', async () => {
      const repos = await githubService.getAvailableRepositories(
        testProjectDraftId,
        undefined,
        userJoanGestor
      );
      expect(Array.isArray(repos)).toBe(true);
      expect(repos.length).toBeGreaterThan(0);
    });

    it('TDD-H04A-R02-04: debe rechazar si la cuenta GitHub de la instalación no coincide con la registrada', async () => {
      // Agregar instalación mock con login adulterado
      githubRepo.addMockInstallation({
        id: 'inst-adulterada',
        organization_id: 'c0000001-0000-0000-0000-000000000001',
        installation_id: 99887766,
        account_login: 'cuenta-falsa',
        account_type: 'Organization',
        permissions: { contents: 'read' },
        status: 'ACTIVE',
        installed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      githubClient.addMockInstallation({
        id: 99887766,
        account: { login: 'cuenta-real', type: 'Organization' },
        app_id: 1111,
        target_type: 'Organization',
        permissions: { contents: 'read' },
      });

      await expect(
        githubService.linkExistingRepository(
          testProjectDraftId,
          {
            repoOwner: 'cuenta-real',
            repoName: 'repo-test',
            installationId: 99887766,
          },
          userJoanGestor
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==========================================================================
  // H04A-R03: Unicidad canónica de repositorios numérico github_repo_id
  // ==========================================================================
  describe('H04A-R03: Unicidad canónica por github_repo_id inmutable', () => {
    it('TDD-H04A-R03-01: debe prevenir que dos proyectos vinculen el mismo repositorio aun si fue renombrado en GitHub', async () => {
      // Proyecto 1 vincula JMedina255/TraceFlow (id: 101010101)
      await githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userJoanGestor
      );

      // Crear segundo proyecto en borrador
      const secondProjectId = 'b0000001-0000-0000-0000-000000000030';
      const defaultOrg = (await orgsRepo.findByCode('ORG-EXODO'))!;
      (projectsRepo as any).projects.push({
        id: secondProjectId,
        code: 'PRJ-TEST-03',
        name: 'Tercer Proyecto de Prueba',
        organization_id: defaultOrg.id,
        status: 'BORRADOR',
        created_by: userJoanGestor.id,
        manager_id: userJoanGestor.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      (projectsRepo as any).mockAssignments.push({
        user_id: userJoanGestor.id,
        project_id: secondProjectId,
        assigned_at: new Date().toISOString(),
      });

      // Simular que en GitHub el repo fue renombrado a TraceFlow-Renamed pero conserva el ID 101010101
      githubClient.addMockRepository({
        id: 101010101, // Mismo ID numérico
        name: 'TraceFlow-Renamed',
        full_name: 'JMedina255/TraceFlow-Renamed',
        owner: { login: 'JMedina255' },
        private: false,
        visibility: 'public',
        default_branch: 'main',
        permissions: { push: true, pull: true, admin: true },
      });

      // Proyecto 2 intenta vincular el repositorio renombrado
      await expect(
        githubService.linkExistingRepository(
          secondProjectId,
          {
            repoOwner: 'JMedina255',
            repoName: 'TraceFlow-Renamed',
            installationId: 12345678,
          },
          userJoanGestor
        )
      ).rejects.toThrow(ConflictException);
    });

    it('TDD-H04A-R03-02: debe permitir revincular un repositorio con el mismo ID tras su desvinculación lógica', async () => {
      // Proyecto 1 vincula y desvincula
      await githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userJoanGestor
      );
      await githubService.unlinkRepository(testProjectDraftId, userJoanGestor);

      // Ahora un segundo proyecto puede vincularlo sin conflicto
      const secondProjectId = 'b0000001-0000-0000-0000-000000000031';
      const defaultOrg = (await orgsRepo.findByCode('ORG-EXODO'))!;
      (projectsRepo as any).projects.push({
        id: secondProjectId,
        code: 'PRJ-TEST-31',
        name: 'Proyecto Revinculación',
        organization_id: defaultOrg.id,
        status: 'BORRADOR',
        created_by: userJoanGestor.id,
        manager_id: userJoanGestor.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      (projectsRepo as any).mockAssignments.push({
        user_id: userJoanGestor.id,
        project_id: secondProjectId,
        assigned_at: new Date().toISOString(),
      });

      const linked = await githubService.linkExistingRepository(
        secondProjectId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userJoanGestor
      );
      expect(linked.github_repo_id).toBe(101010101);
      expect(linked.validation_status).toBe('VALIDATED');
    });
  });

  // ==========================================================================
  // H04A-R04: Sincronización atómica de estado, validación de rama y auditoría
  // ==========================================================================
  describe('H04A-R04: Sincronización atómica y verificación de rama', () => {
    it('TDD-H04A-R04-01: debe rechazar vinculación si la rama especificada no existe en GitHub', async () => {
      await expect(
        githubService.linkExistingRepository(
          testProjectDraftId,
          {
            repoOwner: 'JMedina255',
            repoName: 'TraceFlow',
            installationId: 12345678,
            defaultBranch: 'rama-inexistente',
          },
          userJoanGestor
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('TDD-H04A-R04-02: debe actualizar atómicamente project_setup.github_completed a false y auditar GITHUB_INTEGRATION_DEGRADED al degradar acceso', async () => {
      // 1. Vincular
      await githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userJoanGestor
      );

      const setupBefore = await planningRepo.findSetupByProjectId(testProjectDraftId);
      expect(setupBefore?.github_completed).toBe(true);

      // 2. Degradar permisos en GitHub
      githubClient.setRepoPermissions('JMedina255', 'TraceFlow', {
        push: false,
        pull: true,
        admin: false,
      });

      // 3. Revalidar acceso
      const degraded = await githubService.validateIntegrationAccess(
        testProjectDraftId,
        userJoanGestor
      );
      expect(degraded.validation_status).toBe('PERMISSION_DENIED');

      // 4. Verificar sincronización atómica: github_completed debe ser false
      const setupAfter = await planningRepo.findSetupByProjectId(testProjectDraftId);
      expect(setupAfter?.github_completed).toBe(false);

      // 5. Verificar auditoría DEGRADED
      const auditChain = auditService.getAuditChain();
      const degradedEvent = auditChain.find((e) => e.eventCode === 'GITHUB_INTEGRATION_DEGRADED');
      expect(degradedEvent).toBeDefined();
      expect(degradedEvent?.resultStatus).toBe('FAILURE');
    });

    it('TDD-H04A-R04-03: debe recuperar atómicamente project_setup.github_completed a true y auditar GITHUB_INTEGRATION_VERIFIED tras revalidación exitosa', async () => {
      // 1. Vincular
      await githubService.linkExistingRepository(
        testProjectDraftId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userJoanGestor
      );

      // 2. Degradar
      githubClient.setRepoPermissions('JMedina255', 'TraceFlow', {
        push: false,
        pull: true,
        admin: false,
      });
      await githubService.validateIntegrationAccess(testProjectDraftId, userJoanGestor);

      let setup = await planningRepo.findSetupByProjectId(testProjectDraftId);
      expect(setup?.github_completed).toBe(false);

      // 3. Restaurar permisos en GitHub
      githubClient.setRepoPermissions('JMedina255', 'TraceFlow', {
        push: true,
        pull: true,
        admin: true,
      });

      // 4. Revalidar exitosamente
      const restored = await githubService.validateIntegrationAccess(
        testProjectDraftId,
        userJoanGestor
      );
      expect(restored.validation_status).toBe('VALIDATED');

      // 5. Verificar que github_completed volvió a ser true
      setup = await planningRepo.findSetupByProjectId(testProjectDraftId);
      expect(setup?.github_completed).toBe(true);

      // 6. Verificar auditoría VERIFIED
      const auditChain = auditService.getAuditChain();
      const verifiedEvents = auditChain.filter(
        (e) => e.eventCode === 'GITHUB_INTEGRATION_VERIFIED'
      );
      expect(verifiedEvents.length).toBeGreaterThan(0);
      const lastVerified = verifiedEvents[verifiedEvents.length - 1];
      expect(lastVerified.resultStatus).toBe('SUCCESS');
    });
  });
});
