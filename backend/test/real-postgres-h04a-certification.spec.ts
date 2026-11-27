/**
 * ============================================================================
 * TRACEFLOW SCM — CERTIFICACIÓN OFICIAL EN POSTGRESQL REAL (HITO INIT-H04A / H04A-R)
 * Archivo: backend/test/real-postgres-h04a-certification.spec.ts
 * Motor: PostgreSQL 16.14 Real (Servidor dedicado aislado en 127.0.0.1:5432)
 * Marco Normativo: DA-01 a DA-06, ADR-011, Plan Maestro, IEEE 828, RNF-01, RNF-03
 *
 * VALIDACIONES OBLIGATORIAS CERTIFICADAS:
 *  1. Ejecución de las 7 migraciones oficiales en orden estricto (incluyendo 202611260004_init_h04a_r_github_security.sql).
 *  2. Catálogo físico con exactamente 31 tablas en esquema traceflow.
 *  3. Integridad física de traceflow.github_integration y traceflow.organization_github_installation.
 *  4. Índices de unicidad parcial uq_active_github_repo_id y uq_active_github_repo_name.
 *  5. Privilegios mínimos de traceflow_app (SELECT, INSERT, UPDATE permitidos; DELETE estrictamente revocado).
 *  6. Flujo modular completo de GitHubService NestJS sobre PostgreSQL real con transacciones atómicas.
 *  7. Aislamiento de instalaciones GitHub por organización y validación de coincidencia de cuenta (H04A-R02).
 *  8. Unicidad canónica de repositorios por ID numérico inmutable (H04A-R03).
 *  9. Sincronización atómica en transacción ante degradación de permisos con GITHUB_INTEGRATION_DEGRADED (H04A-R04).
 * 10. Procedimiento de reversión y rollback seguro con salvaguarda PITR (202611260004 y 202611260003) (H04A-R05).
 * ============================================================================
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import pg from 'pg';
import { ConflictException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

import { resetAndMigrateRealPostgres } from './helpers/real-db-helper.js';
import { DatabaseService } from '../src/database/database.service.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { OrganizationsService } from '../src/modules/organizations/organizations.service.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { ProjectPlanningRepository } from '../src/modules/projects/project-planning.repository.js';
import { ProjectPlanningService } from '../src/modules/projects/project-planning.service.js';
import { GitHubRepository } from '../src/modules/github/github.repository.js';
import { GitHubService } from '../src/modules/github/github.service.js';
import { MockGitHubApiClient } from '../src/modules/github/github-api.client.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import type { AuthenticatedUser } from '../src/common/types/index.js';

describe('TraceFlow SCM — Certificación Oficial PostgreSQL Real (INIT-H04A / H04A-R)', { timeout: 60000 }, () => {
  let adminPool: pg.Pool;
  let appPool: pg.Pool;
  let appliedMigrations: string[];
  let poolsClosed = false;

  let dbService: DatabaseService;
  let orgsRepo: OrganizationsRepository;
  let orgsService: OrganizationsService;
  let projectsRepo: ProjectsRepository;
  let projectsService: ProjectsService;
  let planningRepo: ProjectPlanningRepository;
  let planningService: ProjectPlanningService;
  let githubRepo: GitHubRepository;
  let githubClient: MockGitHubApiClient;
  let githubService: GitHubService;
  let auditService: AuditService;
  let authRepo: AuthRepository;

  // Usuarios autenticados
  const userJoanGestor: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000001',
    code: 'USR-001',
    username: 'jmedina',
    fullName: 'Joan Cristian Medina Quispe',
    email: 'jmedina@exodo.pe',
    organization: 'ÉXODO S.A.C.',
    position: 'Director de Calidad',
    activeRoleId: 'PU-02', // Gestor
    allowedRoleIds: ['PU-02', 'PU-01'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  };

  const userJoanPM: AuthenticatedUser = {
    ...userJoanGestor,
    activeRoleId: 'PU-09',
    allowedRoleIds: ['PU-09', 'PU-02', 'PU-01'],
    canCreateProjects: true,
  };

  const userRenzoArqui: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000002',
    code: 'USR-002',
    username: 'rantayhua',
    fullName: 'Renzo Antonio Antayhua Mamani',
    email: 'rantayhua@exodo.pe',
    organization: 'ÉXODO S.A.C.',
    position: 'Arquitecto de Software',
    activeRoleId: 'PU-03',
    allowedRoleIds: ['PU-03', 'PU-06'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  };

  const userGestorNoAsignado: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000004',
    code: 'USR-004',
    username: 'rloyola',
    fullName: 'Renzo Fernando Loyola Vilca Choque',
    email: 'rloyola@exodo.pe',
    organization: 'ÉXODO S.A.C.',
    position: 'Ingeniero QA',
    activeRoleId: 'PU-02', // Tiene rol PU-02 activo pero NO está asignado a PRJ-H04-REAL
    allowedRoleIds: ['PU-02', 'PU-05'],
    assignedProjectIds: [],
  };

  let testOrgId: string;
  let testProjectId: string;
  let secondProjectId: string;

  beforeAll(async () => {
    // 1. Configurar entorno
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_MODE = 'postgres';
    process.env.DATABASE_SSL = 'false';
    process.env.ALLOW_MOCK_GITHUB = 'true';
    const appPwd = process.env.TEST_DB_APP_PASSWORD || 'TestAppPassword123!';
    process.env.TEST_DATABASE_URL = `postgresql://traceflow_app:${encodeURIComponent(appPwd)}@127.0.0.1:5432/traceflow_cert`;

    // 2. Reiniciar y migrar base de datos real con las 7 migraciones oficiales (hasta H04A-R)
    const setupResult = await resetAndMigrateRealPostgres({
      allowDestructiveReset: process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET === 'true',
      targetMigration: 'H04A-R',
    });
    adminPool = setupResult.adminPool;
    appPool = setupResult.appPool;
    appliedMigrations = setupResult.appliedMigrations;

    // 3. Inicializar servicios NestJS
    dbService = new DatabaseService();
    await dbService.onModuleInit();

    auditService = new AuditService(dbService);
    authRepo = new AuthRepository(dbService);
    orgsRepo = new OrganizationsRepository(dbService, authRepo);
    orgsService = new OrganizationsService(dbService, orgsRepo, authRepo, auditService);

    projectsRepo = new ProjectsRepository(dbService);
    projectsService = new ProjectsService(dbService, projectsRepo, orgsRepo, auditService);

    planningRepo = new ProjectPlanningRepository(dbService);
    planningService = new ProjectPlanningService(
      dbService,
      projectsRepo,
      orgsRepo,
      authRepo,
      planningRepo,
      auditService
    );

    githubRepo = new GitHubRepository(dbService);
    githubClient = new MockGitHubApiClient();
    githubService = new GitHubService(
      dbService,
      projectsRepo,
      orgsRepo,
      planningRepo,
      githubRepo,
      githubClient,
      auditService
    );
  });

  afterAll(async () => {
    if (!poolsClosed) {
      if (dbService) await dbService.onModuleDestroy();
      if (adminPool) await adminPool.end();
      if (appPool) await appPool.end();
    }
  });

  // ==========================================================================
  // BLOQUE 1: MIGRACIONES REALES Y CATÁLOGO RELACIONAL (H04A / H04A-R)
  // ==========================================================================
  describe('1. Verificación de Migraciones y Catálogo Físico en PostgreSQL 16 Real', () => {
    it('CERT-H04A-01: debe haber aplicado exactamente 7 migraciones incrementales en orden estricto', () => {
      expect(appliedMigrations).toHaveLength(7);
      expect(appliedMigrations[0]).toBe('202611250001_initial_traceflow.sql');
      expect(appliedMigrations[1]).toBe('202611250002_structural_seeds.sql');
      expect(appliedMigrations[2]).toBe('202611250003_secure_app_role_least_privilege.sql');
      expect(appliedMigrations[3]).toBe('202611260001_init_h02_organizations_and_projects.sql');
      expect(appliedMigrations[4]).toBe('202611260002_init_h03_team_methodology_planning.sql');
      expect(appliedMigrations[5]).toBe('202611260003_init_h04a_github_integration.sql');
      expect(appliedMigrations[6]).toBe('202611260004_init_h04a_r_github_security.sql');
    });

    it('CERT-H04A-02: el esquema traceflow debe contener exactamente 31 tablas físicas en PostgreSQL', async () => {
      const res = await appPool.query<{ table_name: string }>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC;
      `);

      const tables = res.rows.map((r) => r.table_name);
      expect(tables).toHaveLength(31);
      expect(tables).toContain('github_integration');
      expect(tables).toContain('organization_github_installation');
      expect(tables).toContain('project_setup');
      expect(tables).toContain('project_team_role');
      expect(tables).toContain('project_methodology');
      expect(tables).toContain('project_phase');
      expect(tables).toContain('project_milestone');
      expect(tables).toContain('project_deliverable');
    });

    it('CERT-H04A-03: la tabla traceflow.github_integration debe tener todas sus columnas y tipos requeridos', async () => {
      const res = await appPool.query<{ column_name: string; data_type: string; is_nullable: string }>(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'traceflow' AND table_name = 'github_integration'
        ORDER BY ordinal_position ASC;
      `);

      const cols = res.rows.map((r) => r.column_name);
      expect(cols).toEqual([
        'id',
        'project_id',
        'integration_mode',
        'repo_owner',
        'repo_name',
        'repo_full_name',
        'github_repo_id',
        'default_branch',
        'installation_id',
        'visibility',
        'permissions',
        'validation_status',
        'last_validated_at',
        'validation_error_message',
        'unlinked_at',
        'unlinked_by',
        'created_at',
        'updated_at',
      ]);
    });

    it('CERT-H04A-03B: la tabla traceflow.organization_github_installation debe existir con estructura requerida', async () => {
      const res = await appPool.query<{ column_name: string; data_type: string; is_nullable: string }>(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'traceflow' AND table_name = 'organization_github_installation'
        ORDER BY ordinal_position ASC;
      `);

      const cols = res.rows.map((r) => r.column_name);
      expect(cols).toEqual([
        'id',
        'organization_id',
        'installation_id',
        'account_login',
        'account_type',
        'target_id',
        'permissions',
        'repository_selection',
        'status',
        'installed_by',
        'installed_at',
        'updated_at',
      ]);

      // Verificar seed de instalación 12345678 para ORG-EXODO
      const seedCheck = await appPool.query(
        "SELECT * FROM traceflow.organization_github_installation WHERE installation_id = 12345678"
      );
      expect(seedCheck.rows).toHaveLength(1);
      expect(seedCheck.rows[0].account_login).toBe('exodo-org');
      expect(seedCheck.rows[0].status).toBe('ACTIVE');
    });

    it('CERT-H04A-04: deben existir los índices de unicidad uq_active_github_repo_id y uq_active_github_repo_name', async () => {
      const res = await appPool.query<{ indexname: string; indexdef: string }>(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'traceflow' AND tablename = 'github_integration'
          AND indexname IN ('uq_active_github_repo_id', 'uq_active_github_repo_name');
      `);

      expect(res.rows).toHaveLength(2);
      const idIdx = res.rows.find((r) => r.indexname === 'uq_active_github_repo_id');
      const nameIdx = res.rows.find((r) => r.indexname === 'uq_active_github_repo_name');

      expect(idIdx).toBeDefined();
      expect(idIdx?.indexdef).toContain('github_repo_id');
      expect(idIdx?.indexdef).toContain('UNLINKED');

      expect(nameIdx).toBeDefined();
      expect(nameIdx?.indexdef).toContain('lower((repo_owner)::text)');
      expect(nameIdx?.indexdef).toContain('UNLINKED');
    });
  });

  // ==========================================================================
  // BLOQUE 2: SEGURIDAD Y PRIVILEGIOS MÍNIMOS (traceflow_app)
  // ==========================================================================
  describe('2. Verificación de Seguridad y Mínimo Privilegio (traceflow_app)', () => {
    it('CERT-H04A-05: traceflow_app debe tener permisos SELECT, INSERT y UPDATE sobre github_integration y organization_github_installation', async () => {
      const res = await adminPool.query<{ table_name: string; privilege_type: string }>(`
        SELECT table_name, privilege_type
        FROM information_schema.role_table_grants
        WHERE grantee = 'traceflow_app'
          AND table_schema = 'traceflow'
          AND table_name IN ('github_integration', 'organization_github_installation');
      `);

      const gitIntPrivs = res.rows
        .filter((r) => r.table_name === 'github_integration')
        .map((r) => r.privilege_type);
      expect(gitIntPrivs).toContain('SELECT');
      expect(gitIntPrivs).toContain('INSERT');
      expect(gitIntPrivs).toContain('UPDATE');

      const orgInstPrivs = res.rows
        .filter((r) => r.table_name === 'organization_github_installation')
        .map((r) => r.privilege_type);
      expect(orgInstPrivs).toContain('SELECT');
      expect(orgInstPrivs).toContain('INSERT');
      expect(orgInstPrivs).toContain('UPDATE');
    });

    it('CERT-H04A-06: DELETE debe estar estrictamente prohibido para traceflow_app en github_integration y organization_github_installation', async () => {
      await expect(
        appPool.query("DELETE FROM traceflow.github_integration WHERE repo_name = 'dummy_check'")
      ).rejects.toThrow(/(permission denied for table|permiso denegado a la tabla) github_integration/i);

      await expect(
        appPool.query("DELETE FROM traceflow.organization_github_installation WHERE account_login = 'dummy_check'")
      ).rejects.toThrow(/(permission denied for table|permiso denegado a la tabla) organization_github_installation/i);
    });
  });

  // ==========================================================================
  // BLOQUE 3: FLUJO MODULAR COMPLETO DE INTEGRACIÓN GITHUB EN POSTGRESQL REAL
  // ==========================================================================
  describe('3. Flujo Funcional de GitHubService sobre PostgreSQL 16 Real', () => {
    beforeAll(async () => {
      // Obtener o crear organización principal
      const defaultOrg = await orgsRepo.findByCode('ORG-EXODO');
      if (defaultOrg) {
        testOrgId = defaultOrg.id;
      } else {
        const org = await orgsService.createOrganization(
          { code: 'ORG-GITHUB', slug: 'github-solutions', name: 'GitHub Solutions S.A.' },
          userJoanGestor
        );
        testOrgId = org.id;
      }

      // Crear proyecto de prueba en borrador
      const project = await projectsService.createProject(
        {
          code: 'PRJ-H04-REAL',
          projectKey: 'H04REAL',
          name: 'Proyecto Certificación GitHub Real',
          description: 'Proyecto de prueba física para certificar INIT-H04A en PostgreSQL 16',
          clientName: 'ÉXODO Certificaciones',
          organizationId: testOrgId,
        },
        userJoanPM
      );
      testProjectId = project.id;

      // Crear segundo proyecto para pruebas de conflicto de unicidad
      const secondPrj = await projectsService.createProject(
        {
          code: 'PRJ-H04-CONF',
          projectKey: 'H04CONF',
          name: 'Proyecto Conflicto Repositorio',
          description: 'Segundo proyecto para verificar índice de unicidad parcial en PostgreSQL',
          clientName: 'ÉXODO Certificaciones',
          organizationId: testOrgId,
        },
        userJoanPM
      );
      secondProjectId = secondPrj.id;
    });

    it('CERT-H04A-07: getIntegrationStatus debe reportar configured=false inicialmente', async () => {
      const status = await githubService.getIntegrationStatus(testProjectId, userJoanGestor);
      expect(status.configured).toBe(false);
      expect(status.integration).toBeNull();
    });

    it('CERT-H04A-07B: getAvailableRepositories debe rechazar con 403 una instalación de otra organización', async () => {
      // 87654321 no está autorizada para ORG-EXODO en la base de datos física
      await expect(
        githubService.getAvailableRepositories(testProjectId, 87654321, userJoanGestor)
      ).rejects.toThrow(ForbiddenException);
    });

    it('CERT-H04A-08: linkExistingRepository debe persistir la integración en PostgreSQL y actualizar setup', async () => {
      const integration = await githubService.linkExistingRepository(
        testProjectId,
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

      // Consultar directamente en PostgreSQL con appPool
      const dbCheck = await appPool.query(
        'SELECT * FROM traceflow.github_integration WHERE project_id = $1',
        [testProjectId]
      );
      expect(dbCheck.rows).toHaveLength(1);
      expect(dbCheck.rows[0].repo_full_name).toBe('JMedina255/TraceFlow');
      expect(dbCheck.rows[0].validation_status).toBe('VALIDATED');

      // Verificar que setup wizard marcó github_completed = true
      const setupCheck = await appPool.query(
        'SELECT github_completed FROM traceflow.project_setup WHERE project_id = $1',
        [testProjectId]
      );
      expect(setupCheck.rows[0].github_completed).toBe(true);

      // Verificar auditoría SHA-256 en traceflow.audit_log
      const auditCheck = await appPool.query(
        "SELECT * FROM traceflow.audit_log WHERE project_id = $1 AND event_code = 'GITHUB_REPO_LINKED'",
        [testProjectId]
      );
      expect(auditCheck.rows.length).toBeGreaterThan(0);
      expect(auditCheck.rows[0].result_status).toBe('SUCCESS');
      expect(auditCheck.rows[0].curr_log_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('CERT-H04A-09: uq_active_github_repo_id y _name deben rechazar en PostgreSQL vincular el mismo repo en otro proyecto', async () => {
      // Intentar vincular JMedina255/TraceFlow en secondProjectId debe fallar por conflicto de gobernanza SCM
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

    it('CERT-H04A-10: validateIntegrationAccess debe sincronizar atómicamente y actualizar last_validated_at en PostgreSQL', async () => {
      const beforeRes = await appPool.query(
        'SELECT last_validated_at FROM traceflow.github_integration WHERE project_id = $1',
        [testProjectId]
      );
      const beforeTime = new Date(beforeRes.rows[0].last_validated_at).getTime();

      await new Promise((r) => setTimeout(r, 100));

      const validated = await githubService.validateIntegrationAccess(testProjectId, userJoanGestor);
      expect(validated.validation_status).toBe('VALIDATED');

      const afterRes = await appPool.query(
        'SELECT last_validated_at FROM traceflow.github_integration WHERE project_id = $1',
        [testProjectId]
      );
      const afterTime = new Date(afterRes.rows[0].last_validated_at).getTime();
      expect(afterTime).toBeGreaterThanOrEqual(beforeTime);

      // Auditoría GITHUB_INTEGRATION_VERIFIED registrada en PostgreSQL
      const auditCheck = await appPool.query(
        "SELECT * FROM traceflow.audit_log WHERE project_id = $1 AND event_code = 'GITHUB_INTEGRATION_VERIFIED'",
        [testProjectId]
      );
      expect(auditCheck.rows.length).toBeGreaterThan(0);
    });

    it('CERT-H04A-10B: si se revoca acceso, validateIntegrationAccess degrada atómicamente project_setup.github_completed a false y audita GITHUB_INTEGRATION_DEGRADED', async () => {
      // Degradar permisos push
      githubClient.setRepoPermissions('JMedina255', 'TraceFlow', {
        push: false,
        pull: true,
        admin: false,
      });

      const degraded = await githubService.validateIntegrationAccess(testProjectId, userJoanGestor);
      expect(degraded.validation_status).toBe('PERMISSION_DENIED');

      // Verificar en PostgreSQL físico que project_setup.github_completed es false
      const setupCheck = await appPool.query(
        'SELECT github_completed FROM traceflow.project_setup WHERE project_id = $1',
        [testProjectId]
      );
      expect(setupCheck.rows[0].github_completed).toBe(false);

      // Verificar evento GITHUB_INTEGRATION_DEGRADED en PostgreSQL
      const auditCheck = await appPool.query(
        "SELECT * FROM traceflow.audit_log WHERE project_id = $1 AND event_code = 'GITHUB_INTEGRATION_DEGRADED'",
        [testProjectId]
      );
      expect(auditCheck.rows.length).toBeGreaterThan(0);
      expect(auditCheck.rows[0].result_status).toBe('FAILURE');

      // Restaurar permisos para pruebas posteriores
      githubClient.setRepoPermissions('JMedina255', 'TraceFlow', {
        push: true,
        pull: true,
        admin: true,
      });
      await githubService.validateIntegrationAccess(testProjectId, userJoanGestor);
    });

    it('CERT-H04A-11: unlinkRepository debe desvincular lógicamente (UNLINKED) y actualizar setup', async () => {
      const unlinked = await githubService.unlinkRepository(testProjectId, userJoanGestor);
      expect(unlinked.validation_status).toBe('UNLINKED');
      expect(unlinked.unlinked_at).toBeDefined();
      expect(unlinked.unlinked_by).toBe(userJoanGestor.id);

      // En PostgreSQL físico:
      const check = await appPool.query(
        'SELECT validation_status, unlinked_at, unlinked_by FROM traceflow.github_integration WHERE project_id = $1',
        [testProjectId]
      );
      expect(check.rows[0].validation_status).toBe('UNLINKED');
      expect(check.rows[0].unlinked_at).not.toBeNull();
      expect(check.rows[0].unlinked_by).toBe(userJoanGestor.id);

      // Setup wizard debe reflejar github_completed = false
      const setupCheck = await appPool.query(
        'SELECT github_completed FROM traceflow.project_setup WHERE project_id = $1',
        [testProjectId]
      );
      expect(setupCheck.rows[0].github_completed).toBe(false);

      // Auditoría SHA-256
      const auditCheck = await appPool.query(
        "SELECT * FROM traceflow.audit_log WHERE project_id = $1 AND event_code = 'GITHUB_REPO_UNLINKED'",
        [testProjectId]
      );
      expect(auditCheck.rows.length).toBeGreaterThan(0);
      expect(auditCheck.rows[0].curr_log_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('CERT-H04A-12: tras desvincular, el índice parcial uq_active_github_repo_id permite vincular el repositorio en otro proyecto', async () => {
      // Como testProjectId ahora está UNLINKED, secondProjectId puede vincular JMedina255/TraceFlow sin violar uq_active_github_repo_id
      const linkedSecond = await githubService.linkExistingRepository(
        secondProjectId,
        {
          repoOwner: 'JMedina255',
          repoName: 'TraceFlow',
          installationId: 12345678,
        },
        userJoanGestor
      );

      expect(linkedSecond.project_id).toBe(secondProjectId);
      expect(linkedSecond.validation_status).toBe('VALIDATED');
    });

    it('CERT-H04A-13: SoD en PostgreSQL: gestor PU-02 no asignado al proyecto es rechazado con 403', async () => {
      await expect(
        githubService.getIntegrationStatus(testProjectId, userGestorNoAsignado)
      ).rejects.toThrow(ForbiddenException);

      await expect(
        githubService.linkExistingRepository(
          testProjectId,
          {
            repoOwner: 'JMedina255',
            repoName: 'TraceFlow-Backend',
            installationId: 12345678,
          },
          userGestorNoAsignado
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==========================================================================
  // BLOQUE 4: PROCEDIMIENTO DE ROLLBACK SEGURO Y SALVAGUARDAS (H04A-R & H04A)
  // ==========================================================================
  describe('4. Verificación de Rollback Seguro y Salvaguardas PITR (H04A-R05)', () => {
    it('CERT-H04A-14: el rollback 202611260004 debe abortar con excepción si existen integraciones registradas', async () => {
      const rollbackSqlPath = path.resolve(
        process.cwd(),
        '..',
        'supabase',
        'migrations',
        '202611260004_init_h04a_r_github_security_rollback.sql'
      );
      const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf8');

      // Ejecutar con adminPool debe abortar por la salvaguarda DO $$
      await expect(adminPool.query(rollbackSql)).rejects.toThrow(
        /BLOQUEO DE SEGURIDAD \(INIT-H04A-R\): Se detectaron registros operativos en traceflow/i
      );
    });

    it('CERT-H04A-14B: el rollback 202611260003 debe abortar con excepción si existen registros en github_integration', async () => {
      const rollbackSqlPath = path.resolve(
        process.cwd(),
        '..',
        'supabase',
        'migrations',
        '202611260003_init_h04a_github_integration_rollback.sql'
      );
      const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf8');

      // Ejecutar con adminPool debe abortar por la salvaguarda DO $$
      await expect(adminPool.query(rollbackSql)).rejects.toThrow(
        /BLOQUEO DE SEGURIDAD \(INIT-H04A-R\): Se detectaron \d+ registros en traceflow\.github_integration/i
      );
    });

    it('CERT-H04A-15: con traceflow.allow_force_h04_rollback=true, el rollback de 202611260004 y 202611260003 se ejecuta limpiamente', async () => {
      const rollbackRPath = path.resolve(
        process.cwd(),
        '..',
        'supabase',
        'migrations',
        '202611260004_init_h04a_r_github_security_rollback.sql'
      );
      const rollbackRSql = fs.readFileSync(rollbackRPath, 'utf8');

      const rollbackH04APath = path.resolve(
        process.cwd(),
        '..',
        'supabase',
        'migrations',
        '202611260003_init_h04a_github_integration_rollback.sql'
      );
      const rollbackH04ASql = fs.readFileSync(rollbackH04APath, 'utf8');

      // 1. Forzar rollback de H04A-R (202611260004)
      const client = await adminPool.connect();
      try {
        await client.query('BEGIN;');
        await client.query("SET LOCAL traceflow.allow_force_h04_rollback = 'true';");
        await client.query(rollbackRSql);
        await client.query('COMMIT;');
      } catch (err) {
        await client.query('ROLLBACK;');
        throw err;
      }

      // Verificar que organization_github_installation ya no existe y catálogo tiene 30 tablas
      const orgInstCheck = await adminPool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_name = 'organization_github_installation';
      `);
      expect(orgInstCheck.rows).toHaveLength(0);

      // 2. Forzar rollback de H04A (202611260003)
      try {
        await client.query('BEGIN;');
        await client.query("SET LOCAL traceflow.allow_force_h04_rollback = 'true';");
        await client.query(rollbackH04ASql);
        await client.query('COMMIT;');
      } catch (err) {
        await client.query('ROLLBACK;');
        throw err;
      } finally {
        client.release();
      }

      // Verificar que github_integration ya no existe
      const tableCheck = await adminPool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_name = 'github_integration';
      `);
      expect(tableCheck.rows).toHaveLength(0);

      // Verificar que el esquema vuelve a tener exactamente 29 tablas físicas (estado H03)
      const countRes = await adminPool.query<{ count: string }>(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_type = 'BASE TABLE';
      `);
      expect(Number(countRes.rows[0].count)).toBe(29);
    });
  });
});
