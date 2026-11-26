/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE GESTIÓN Y CICLO DE VIDA DE RFCS
 * Archivo: backend/test/rfcs.spec.ts
 * Hito: DB-01 / DB-01.1 / INIT-H02-VF — Requisito H-04, DA-02, DA-06
 * 
 * [CLASIFICACIÓN: UNITARIAS / REPOSITORIOS EN MEMORIA]
 * Valida reglas de solicitud de cambio (CU-04, SoD, Ownership, hashing SHA-256),
 * autorización SCM obligatoria, revocación por suspensión y consulta histórica.
 * ============================================================================
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { RfcsRepository } from '../src/modules/rfcs/rfcs.repository.js';
import { RfcsService } from '../src/modules/rfcs/rfcs.service.js';
import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import type { AuthenticatedUser } from '../src/common/types/index.js';

describe('Backend RFCs Management (CU-04, SoD, Ownership & Audit)', () => {
  let rfcsService: RfcsService;
  let auditService: AuditService;
  let projectsRepo: ProjectsRepository;
  let rfcsRepo: RfcsRepository;
  let orgsRepo: OrganizationsRepository;
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService('mock');
    auditService = new AuditService(db);
    const authRepo = new AuthRepository(db);
    projectsRepo = new ProjectsRepository(db);
    orgsRepo = new OrganizationsRepository(db, authRepo);
    rfcsRepo = new RfcsRepository(db);
    rfcsService = new RfcsService(rfcsRepo, projectsRepo, auditService, orgsRepo, db);
  });

  const solicitanteUser: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000001',
    code: 'USR-001',
    username: 'jmedina',
    email: 'jmedina@exodo.pe',
    fullName: 'Joan Cristian Medina Quispe',
    organization: 'ÉXODO S.A.C.',
    position: 'Director de Calidad',
    activeRoleId: 'PU-01', // Solicitante
    allowedRoleIds: ['PU-01', 'PU-02'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  };

  const gestorUser: AuthenticatedUser = {
    ...solicitanteUser,
    activeRoleId: 'PU-02', // Gestor
  };

  it('debe permitir crear una RFC formalmente con PU-01 y emitir auditoría SHA-256', async () => {
    const rfc = await rfcsService.createRfc(
      {
        projectId: 'PRJ-001',
        targetEcsId: 'SRC-AUTH-JWT.ts',
        title: 'Actualización de Algoritmo de Hashing a Argon2id',
        description: 'Reemplazo del mecanismo de derivación de claves para cumplir directiva de seguridad.',
        justification: 'Exigencia SBS para mitigación de ataques de fuerza bruta y GPU.',
        priority: 'ALTA',
      },
      solicitanteUser
    );

    expect(rfc.code).toBeDefined();
    expect(rfc.status).toBe('REGISTRADA');
    expect(rfc.requested_by).toBe('USR-001');

    // Comprobar que se emitió el evento de auditoría
    const chain = auditService.getAuditChain();
    expect(chain.length).toBeGreaterThan(0);
    const lastEvent = chain[chain.length - 1];
    expect(lastEvent.operation).toBe('REGISTRAR_RFC_CU04');
    expect(lastEvent.currLogHash).toBeDefined();
    expect(auditService.verifyChainIntegrity()).toBe(true);
  });

  it('PRUEBA NEGATIVA: Debe bloquear creación de RFC por usuario con rol distinto a PU-01 (SoD CU-04)', async () => {
    await expect(
      rfcsService.createRfc(
        {
          projectId: 'PRJ-001',
          targetEcsId: 'SRC-AUTH-JWT.ts',
          title: 'Intento de registro inválido por Gestor',
          description: 'Descripción de prueba con longitud suficiente para validación.',
          justification: 'Justificación de prueba con longitud suficiente para validación.',
          priority: 'MEDIA',
        },
        gestorUser
      )
    ).rejects.toThrow('Solo el Solicitante (PU-01) está facultado para emitir solicitudes de cambio');
  });

  it('PRUEBA NEGATIVA: Debe rechazar RFC sobre ECS que pertenece a otro proyecto', async () => {
    // SRC-UI-CLAIM-FORM.tsx pertenece a PRJ-002. Si se envía con projectId: 'PRJ-001', debe rechazarse
    await expect(
      rfcsService.createRfc(
        {
          projectId: 'PRJ-001',
          targetEcsId: 'SRC-UI-CLAIM-FORM.tsx',
          title: 'Intento de contaminación cruzada entre proyectos',
          description: 'Descripción técnica válida con longitud superior a 20 caracteres.',
          justification: 'Justificación válida con longitud superior a 20 caracteres.',
          priority: 'BAJA',
        },
        solicitanteUser
      )
    ).rejects.toThrow('pertenece a un proyecto distinto');
  });

  it('PRUEBA NEGATIVA: Restricción de Ownership para PU-01 al consultar expedientes ajenos', async () => {
    // Usuario solicitante USR-999
    const otherSolicitante: AuthenticatedUser = {
      id: 'a0000001-0000-0000-0000-000000000999',
      code: 'USR-999',
      username: 'other',
      email: 'other@exodo.pe',
      fullName: 'Otro Solicitante',
      organization: 'ÉXODO S.A.C.',
      position: 'Operador',
      activeRoleId: 'PU-01',
      allowedRoleIds: ['PU-01'],
      assignedProjectIds: ['PRJ-001'],
    };

    // Asegurar que USR-999 sea miembro activo de ÉXODO S.A.C. para que supere la comprobación DA-06
    // y la prueba evalúe específicamente el control de Ownership SoD
    await orgsRepo.addMember({
      organization_id: 'c0000001-0000-0000-0000-000000000001',
      user_id: otherSolicitante.id,
      role_in_org: 'MEMBER',
      status: 'ACTIVE',
    });

    // RFC-2026-0001 fue creada por USR-001. USR-999 debe ser denegado con 403 Forbidden
    await expect(rfcsService.getRfcById('RFC-2026-0001', otherSolicitante)).rejects.toThrow(
      'Ownership SoD'
    );
  });

  // ==========================================================================
  // BLOQUE DE PRUEBAS DE SEGURIDAD SCM OBLIGATORIA (INIT-H02-VF)
  // ==========================================================================
  describe('Autorización SCM Obligatoria y Restricciones por Estado (INIT-H02-VF)', () => {
    it('PRUEBA NEGATIVA: Debe rechazar creación de RFC si el usuario está suspendido en la organización (DA-06)', async () => {
      // Mock de repositorio de organizaciones con miembro SUSPENDED
      const mockOrgRepoSuspended = {
        findOrganizationsForUser: async () => [],
        findMember: async () => ({
          id: 'mem-1',
          organization_id: 'c0000001-0000-0000-0000-000000000001',
          user_id: solicitanteUser.id,
          role_in_org: 'MEMBER',
          status: 'SUSPENDED',
          joined_at: new Date().toISOString(),
        }),
      } as unknown as OrganizationsRepository;

      const rfcsServiceSuspended = new RfcsService(
        rfcsRepo,
        projectsRepo,
        auditService,
        mockOrgRepoSuspended,
        db
      );

      await expect(
        rfcsServiceSuspended.createRfc(
          {
            projectId: 'PRJ-001',
            targetEcsId: 'SRC-AUTH-JWT.ts',
            title: 'Intento de RFC por usuario suspendido',
            description: 'Descripción técnica con longitud requerida para validación.',
            justification: 'Justificación con longitud requerida para validación.',
            priority: 'ALTA',
          },
          solicitanteUser
        )
      ).rejects.toThrow(/no es miembro activo de la organización propietaria/i);
    });

    it('PRUEBA NEGATIVA: Debe denegar lectura de RFC (getRfcById) si el usuario fue suspendido (sesión antigua)', async () => {
      // Usuario con asignación histórica en assignedProjectIds pero suspendido en la BD
      const mockOrgRepoSuspended = {
        findOrganizationsForUser: async () => [],
        findMember: async () => ({
          id: 'mem-1',
          organization_id: 'c0000001-0000-0000-0000-000000000001',
          user_id: solicitanteUser.id,
          role_in_org: 'MEMBER',
          status: 'SUSPENDED',
          joined_at: new Date().toISOString(),
        }),
      } as unknown as OrganizationsRepository;

      const rfcsServiceSuspended = new RfcsService(
        rfcsRepo,
        projectsRepo,
        auditService,
        mockOrgRepoSuspended,
        db
      );

      await expect(
        rfcsServiceSuspended.getRfcById('RFC-2026-0001', solicitanteUser)
      ).rejects.toThrow(/no es miembro activo de la organización/i);
    });

    it('PRUEBA NEGATIVA: Debe denegar creación de RFC en proyectos que no estén en estado ACTIVO (RN-12 / RN-13)', async () => {
      // Modificar temporalmente el estado de PRJ-001 a HISTORICO_PENDIENTE_GITHUB
      const prj = await projectsRepo.findByIdOrCode('PRJ-001');
      const originalStatus = prj!.status;
      prj!.status = 'HISTORICO_PENDIENTE_GITHUB' as any;

      try {
        await expect(
          rfcsService.createRfc(
            {
              projectId: 'PRJ-001',
              targetEcsId: 'SRC-AUTH-JWT.ts',
              title: 'Intento de RFC en proyecto pendiente GitHub',
              description: 'Descripción técnica válida con longitud superior a 20 caracteres.',
              justification: 'Justificación válida con longitud superior a 20 caracteres.',
              priority: 'ALTA',
            },
            solicitanteUser
          )
        ).rejects.toThrow(/No se pueden crear solicitudes de cambio en proyectos con estado 'HISTORICO_PENDIENTE_GITHUB'/);
      } finally {
        prj!.status = originalStatus;
      }
    });

    it('PRUEBA POSITIVA: Debe permitir la consulta histórica de RFCs para miembros activos en proyectos no activos', async () => {
      // Proyecto en estado HISTORICO_PENDIENTE_GITHUB
      const prj = await projectsRepo.findByIdOrCode('PRJ-001');
      const originalStatus = prj!.status;
      prj!.status = 'HISTORICO_PENDIENTE_GITHUB' as any;

      try {
        // La lectura por un usuario activo autorizado debe ser exitosa
        const rfc = await rfcsService.getRfcById('RFC-2026-0001', solicitanteUser);
        expect(rfc).toBeDefined();
        expect(rfc.code).toBe('RFC-2026-0001');

        // getRfcsForUser también debe devolver los expedientes históricos autorizados
        const rfcs = await rfcsService.getRfcsForUser(solicitanteUser, 'PRJ-001');
        expect(rfcs.length).toBeGreaterThan(0);
      } finally {
        prj!.status = originalStatus;
      }
    });

    it('PRUEBA NEGATIVA: En modo PostgreSQL debe fallar con 503 si falta la dependencia de autorización', async () => {
      const originalMode = process.env.DATABASE_MODE;
      process.env.DATABASE_MODE = 'postgres';

      try {
        // rfcsService sin orgRepo inyectado
        const rfcsServiceNoAuth = new RfcsService(
          rfcsRepo,
          projectsRepo,
          auditService,
          undefined, // orgRepo faltante
          undefined
        );

        await expect(
          rfcsServiceNoAuth.createRfc(
            {
              projectId: 'PRJ-001',
              targetEcsId: 'SRC-AUTH-JWT.ts',
              title: 'Prueba de falla por dependencia faltante',
              description: 'Descripción técnica válida con longitud superior a 20 caracteres.',
              justification: 'Justificación válida con longitud superior a 20 caracteres.',
              priority: 'ALTA',
            },
            solicitanteUser
          )
        ).rejects.toThrow(ServiceUnavailableException);

        await expect(
          rfcsServiceNoAuth.getRfcById('RFC-2026-0001', solicitanteUser)
        ).rejects.toThrow(ServiceUnavailableException);

        await expect(
          rfcsServiceNoAuth.getRfcsForUser(solicitanteUser)
        ).rejects.toThrow(ServiceUnavailableException);
      } finally {
        process.env.DATABASE_MODE = originalMode;
      }
    });

    it('PRUEBA NEGATIVA: En modo PostgreSQL debe rechazar proyectos sin organización válida asignada (DA-02)', async () => {
      // Simular que PRJ-001 no tiene organization_id
      const prj = await projectsRepo.findByIdOrCode('PRJ-001');
      const originalOrgId = prj!.organization_id;
      prj!.organization_id = undefined as any;

      // Crear servicio configurado explícitamente en modo PostgreSQL
      const pgDb = new DatabaseService('postgres');
      const rfcsServicePg = new RfcsService(rfcsRepo, projectsRepo, auditService, orgsRepo, pgDb);

      try {
        await expect(
          rfcsServicePg.createRfc(
            {
              projectId: 'PRJ-001',
              targetEcsId: 'SRC-AUTH-JWT.ts',
              title: 'Prueba de proyecto sin organización',
              description: 'Descripción técnica válida con longitud superior a 20 caracteres.',
              justification: 'Justificación válida con longitud superior a 20 caracteres.',
              priority: 'ALTA',
            },
            solicitanteUser
          )
        ).rejects.toThrow(/no tiene una organización válida asignada/);

        await expect(
          rfcsServicePg.getRfcById('RFC-2026-0001', solicitanteUser)
        ).rejects.toThrow(/no cuenta con una organización válida asignada/);
      } finally {
        prj!.organization_id = originalOrgId;
      }
    });
  });
});
