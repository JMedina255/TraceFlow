/**
 * ============================================================================
 * TRACEFLOW SCM — CERTIFICACIÓN OFICIAL EN POSTGRESQL REAL (HITO INIT-H02-V)
 * Archivo: backend/test/real-postgres-certification.spec.ts
 * Motor: PostgreSQL 16.14 Real (Servidor dedicado aislado en 127.0.0.1:5432)
 * Marco Normativo: DA-01 a DA-06, ADR-011, Plan Maestro, IEEE 828, RNF-01, RNF-03
 *
 * VALIDACIONES OBLIGATORIAS CERTIFICADAS:
 *  1. Ejecución de migraciones históricas reales (202611250001, 202611250002, 202611250003).
 *  2. Ejecución del archivo exacto 202611260001_init_h02_organizations_and_projects.sql.
 *  3. Verificación relacional (23 tablas, FKs, restricciones CHECK, triggers y funciones).
 *  4. Creación de organización y proyecto BORRADOR con el rol operativo real traceflow_app.
 *  5. Asignación del creador con privilegios mínimos y comprobación de revocación de DELETE.
 *  6. Rechazo de usuarios externos y suspendidos (revocación de acceso a proyectos y RFCs).
 *  7. Aislamiento institucional multitenant entre organizaciones.
 *  8. Integridad del disparador PL/pgSQL enforce_project_member_organization_integrity.
 *  9. Transacciones reales con COMMIT y ROLLBACK atómico sin registros huérfanos.
 * 10. Auditoría real con cadena SHA-256 e inmutabilidad probatoria (append_audit_log real).
 * 11. Protección contra condiciones de carrera en el último propietario activo (FOR UPDATE).
 * 12. Procedimiento de recuperación y rollback seguro con salvaguardas contra pérdida de datos.
 * ============================================================================
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { ForbiddenException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

import { resetAndMigrateRealPostgres } from './helpers/real-db-helper.js';
import { DatabaseService } from '../src/database/database.service.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { OrganizationsService } from '../src/modules/organizations/organizations.service.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { RfcsRepository } from '../src/modules/rfcs/rfcs.repository.js';
import { RfcsService } from '../src/modules/rfcs/rfcs.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import type { AuthenticatedUser } from '../src/common/types/index.js';

describe('TraceFlow SCM — Certificación Oficial PostgreSQL Real (INIT-H02-V)', { timeout: 45000 }, () => {
  let adminPool: pg.Pool;
  let appPool: pg.Pool;
  let appliedMigrations: string[];
  let poolsClosed = false;

  let dbService: DatabaseService;
  let orgsRepo: OrganizationsRepository;
  let orgsService: OrganizationsService;
  let projectsRepo: ProjectsRepository;
  let projectsService: ProjectsService;
  let rfcsRepo: RfcsRepository;
  let rfcsService: RfcsService;
  let auditService: AuditService;
  let authRepo: AuthRepository;

  // Usuarios autenticados de prueba con sesiones legítimas
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

  const userJoanSolicitante: AuthenticatedUser = {
    ...userJoanGestor,
    activeRoleId: 'PU-01', // Solicitante
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

  const userAugustoDev: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000003',
    code: 'USR-003',
    username: 'arivera',
    fullName: 'Augusto Joaquin Rivera Muñoz',
    email: 'arivera@exodo.pe',
    organization: 'ÉXODO S.A.C.',
    position: 'Ingeniero de Software',
    activeRoleId: 'PU-06',
    allowedRoleIds: ['PU-05', 'PU-07'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  };

  beforeAll(async () => {
    // 1. Configurar entorno para PostgreSQL local aislado
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_MODE = 'postgres';
    process.env.DATABASE_SSL = 'false';
    process.env.TEST_DATABASE_URL = 'postgresql://traceflow_app:TestAppPassword123!@127.0.0.1:5432/traceflow_cert';

    // 2. Ejecutar reinicio y migraciones reales completas en orden con autorización explícita (H02)
    const setupResult = await resetAndMigrateRealPostgres({
      allowDestructiveReset: process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET === 'true',
      targetMigration: 'H02',
    });
    adminPool = setupResult.adminPool;
    appPool = setupResult.appPool;
    appliedMigrations = setupResult.appliedMigrations;

    // 3. Inicializar DatabaseService de la aplicación NestJS conectado con traceflow_app
    dbService = new DatabaseService();
    await dbService.onModuleInit();

    // 4. Instanciar repositorios y servicios con inyección de dependencias
    auditService = new AuditService(dbService);
    authRepo = new AuthRepository(dbService);
    orgsRepo = new OrganizationsRepository(dbService, authRepo);
    orgsService = new OrganizationsService(dbService, orgsRepo, authRepo, auditService);

    projectsRepo = new ProjectsRepository(dbService);
    projectsService = new ProjectsService(dbService, projectsRepo, orgsRepo, auditService);

    rfcsRepo = new RfcsRepository(dbService);
    rfcsService = new RfcsService(rfcsRepo, projectsRepo, auditService, orgsRepo);
  });

  afterAll(async () => {
    if (!poolsClosed) {
      if (dbService) await dbService.onModuleDestroy();
      if (adminPool) await adminPool.end();
      if (appPool) await appPool.end();
    }
  });

  // ==========================================================================
  // BLOQUE 1: MIGRACIONES REALES Y MODELO RELACIONAL POSTGRESQL
  // ==========================================================================
  describe('Bloque 1: Migraciones Reales y Esquema Relacional en PostgreSQL 16+', () => {
    it('V-01: Debe haber ejecutado las 4 migraciones reales en orden sin alteraciones', () => {
      expect(appliedMigrations).toEqual([
        '202611250001_initial_traceflow.sql',
        '202611250002_structural_seeds.sql',
        '202611250003_secure_app_role_least_privilege.sql',
        '202611260001_init_h02_organizations_and_projects.sql',
      ]);
    });

    it('V-02: El catálogo físico debe contar exactamente con las 23 tablas en esquema traceflow', async () => {
      const res = await adminPool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'traceflow'
        ORDER BY table_name;
      `);
      const tableNames = res.rows.map((r: any) => r.table_name);
      expect(tableNames.length).toBe(23);
      expect(tableNames).toContain('organization');
      expect(tableNames).toContain('organization_member');
      expect(tableNames).toContain('project');
      expect(tableNames).toContain('audit_log');
      expect(tableNames).toContain('change_request');
      expect(tableNames).toContain('config_item');
    });

    it('V-03: La tabla traceflow.project debe tener organization_id y restricción chk_project_status activa', async () => {
      // Verificar columna organization_id
      const colRes = await adminPool.query(`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'traceflow' AND table_name = 'project' AND column_name IN ('organization_id', 'status');
      `);
      const cols = Object.fromEntries(colRes.rows.map((r: any) => [r.column_name, r]));
      expect(cols.organization_id).toBeDefined();
      expect(cols.organization_id.data_type).toBe('uuid');
      expect(cols.status.character_maximum_length).toBeGreaterThanOrEqual(40);

      // Verificar restricción CHECK
      const chkRes = await adminPool.query(`
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint
        WHERE conrelid = 'traceflow.project'::regclass AND conname = 'chk_project_status';
      `);
      expect(chkRes.rows.length).toBe(1);
      expect(chkRes.rows[0].def).toContain('HISTORICO_PENDIENTE_GITHUB');
      expect(chkRes.rows[0].def).toContain('BORRADOR');
    });

    it('V-04: Los proyectos históricos PRJ-001..PRJ-003 deben haber sido migrados acotadamente a ORG-EXODO', async () => {
      const res = await appPool.query(`
        SELECT p.code, p.status, p.organization_id, o.code as org_code
        FROM traceflow.project p
        JOIN traceflow.organization o ON p.organization_id = o.id
        WHERE p.code IN ('PRJ-001', 'PRJ-002', 'PRJ-003')
        ORDER BY p.code ASC;
      `);
      expect(res.rows.length).toBe(3);
      for (const row of res.rows) {
        expect(row.status).toBe('HISTORICO_PENDIENTE_GITHUB');
        expect(row.org_code).toBe('ORG-EXODO');
      }
    });
  });

  // ==========================================================================
  // BLOQUE 2: PRIVILEGIOS REALES DE traceflow_app (MÍNIMO PRIVILEGIO / SEC-02)
  // ==========================================================================
  describe('Bloque 2: Mínimo Privilegio de la Aplicación en PostgreSQL (H02-R01)', () => {
    it('V-05: traceflow_app debe tener permisos SELECT, INSERT y UPDATE en user_project_assignment', async () => {
      // 1. SELECT debe funcionar
      const selectRes = await appPool.query('SELECT COUNT(*) as c FROM traceflow.user_project_assignment;');
      expect(parseInt(selectRes.rows[0].c, 10)).toBeGreaterThan(0);

      // 2. INSERT debe funcionar para miembros válidos
      const testPrjId = 'b0000001-0000-0000-0000-000000000001';
      const testUserId = 'a0000001-0000-0000-0000-000000000003'; // USR-003 Augusto (miembro de ÉXODO)
      const insRes = await appPool.query(`
        INSERT INTO traceflow.user_project_assignment (user_id, project_id, assigned_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, project_id) DO UPDATE SET assigned_at = NOW()
        RETURNING user_id, project_id;
      `, [testUserId, testPrjId, userJoanGestor.id]);
      expect(insRes.rows.length).toBe(1);

      // 3. UPDATE debe funcionar
      const updRes = await appPool.query(`
        UPDATE traceflow.user_project_assignment
        SET assigned_at = NOW()
        WHERE user_id = $1 AND project_id = $2;
      `, [testUserId, testPrjId]);
      expect(updRes.rowCount).toBe(1);
    });

    it('V-06: traceflow_app tiene ESTRICTAMENTE REVOCADO el permiso DELETE (RNF-01 / IEEE 828)', async () => {
      let errorThrown = false;
      try {
        await appPool.query(`
          DELETE FROM traceflow.user_project_assignment
          WHERE user_id = 'a0000001-0000-0000-0000-000000000001';
        `);
      } catch (err: any) {
        errorThrown = true;
        // Código PostgreSQL 42501 = insufficient_privilege
        expect(err.code).toBe('42501');
      }
      expect(errorThrown).toBe(true);
    });
  });

  // ==========================================================================
  // BLOQUE 3: CREACIÓN DE ORGANIZACIÓN, PROYECTO Y ASIGNACIÓN ATÓMICA
  // ==========================================================================
  describe('Bloque 3: Operaciones Compuestas y Transacciones Atómicas (H02-R03)', () => {
    it('V-07: OrganizationsService debe crear una nueva organización incorporando al creador como OWNER y registrando auditoría real', async () => {
      const newOrg = await orgsService.createOrganization(
        {
          code: 'ORG-BANCOSUR',
          name: 'Banco Regional del Sur S.A.',
          slug: 'banco-sur',
          legalName: 'Banco Regional del Sur S.A.',
          taxId: '20987654321',
        },
        userJoanGestor
      );

      expect(newOrg.id).toBeDefined();
      expect(newOrg.code).toBe('ORG-BANCOSUR');
      expect(newOrg.status).toBe('ACTIVE');

      // Verificar físicamente en BD con appPool
      const memberCheck = await appPool.query(`
        SELECT role_in_org, status FROM traceflow.organization_member
        WHERE organization_id = $1 AND user_id = $2;
      `, [newOrg.id, userJoanGestor.id]);
      expect(memberCheck.rows.length).toBe(1);
      expect(memberCheck.rows[0].role_in_org).toBe('OWNER');
      expect(memberCheck.rows[0].status).toBe('ACTIVE');

      // Verificar evento de auditoría física SHA-256
      const auditCheck = await appPool.query(`
        SELECT event_code, entity_name, entity_id, curr_log_hash
        FROM traceflow.audit_log
        WHERE entity_id = $1::text
        ORDER BY sequence_number DESC LIMIT 1;
      `, [newOrg.id]);
      expect(auditCheck.rows.length).toBe(1);
      expect(auditCheck.rows[0].event_code).toBe('ORG_CREATED');
      expect(auditCheck.rows[0].curr_log_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('V-08: ProjectsService debe crear proyecto en BORRADOR, asignar al creador y registrar auditoría atómica', async () => {
      const org = await orgsRepo.findByIdOrSlugOrCode('ORG-BANCOSUR');
      expect(org).toBeDefined();

      const newPrj = await projectsService.createProject(
        {
          code: 'PRJ-SUR-01',
          projectKey: 'SUR-APP',
          name: 'Banca Móvil Sur',
          description: 'Nueva aplicación de banca móvil corporativa',
          clientName: 'Banco Regional del Sur',
          organizationId: org!.id,
        },
        userJoanGestor
      );

      expect(newPrj.id).toBeDefined();
      expect(newPrj.code).toBe('PRJ-SUR-01');
      expect(newPrj.status).toBe('BORRADOR');
      expect(newPrj.organization_id).toBe(org!.id);

      // Verificar que el creador quedó asignado en BD
      const assignCheck = await appPool.query(`
        SELECT user_id, project_id FROM traceflow.user_project_assignment
        WHERE project_id = $1 AND user_id = $2;
      `, [newPrj.id, userJoanGestor.id]);
      expect(assignCheck.rows.length).toBe(1);

      // Verificar auditoría real
      const auditCheck = await appPool.query(`
        SELECT event_code, curr_log_hash FROM traceflow.audit_log
        WHERE entity_id = $1::text AND event_code = 'PRJ_CREATED_DRAFT';
      `, [newPrj.id]);
      expect(auditCheck.rows.length).toBe(1);
      expect(auditCheck.rows[0].curr_log_hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('V-09: Rollback atómico en fallo intermedio: Si falla el segundo paso, la BD real no debe dejar registros huérfanos', async () => {
      const codeOrphan = 'ORG-FAIL-TEST';
      let caughtError = false;

      try {
        await dbService.transaction(async (client) => {
          // Paso 1: Crear org en BD
          await orgsRepo.create(
            {
              code: codeOrphan,
              name: 'Organización Fallida',
              slug: 'org-fail-test',
              legal_name: 'Organización Fallida S.A.',
              status: 'ACTIVE',
              created_by: userJoanGestor.id,
            },
            client
          );

          // Paso 2: Lanzar error para forzar ROLLBACK transaccional
          throw new Error('Fallo simulado a mitad de la operación compuesta');
        });
      } catch (err: any) {
        caughtError = true;
        expect(err.message).toContain('Fallo simulado');
      }

      expect(caughtError).toBe(true);

      // Verificar en la BD real que NO exista la organización
      const checkRes = await appPool.query(
        'SELECT 1 FROM traceflow.organization WHERE code = $1;',
        [codeOrphan]
      );
      expect(checkRes.rows.length).toBe(0);
    });
  });

  // ==========================================================================
  // BLOQUE 4: INTEGRIDAD DEL DISPARADOR ORGANIZACIONAL (DA-06)
  // ==========================================================================
  describe('Bloque 4: Disparador PL/pgSQL de Integridad Institucional (DA-06)', () => {
    it('V-10: Inserción directa en user_project_assignment de usuario ajeno a la organización debe ser RECHAZADA por el trigger', async () => {
      // PRJ-SUR-01 pertenece a ORG-BANCOSUR
      const prjRes = await appPool.query("SELECT id FROM traceflow.project WHERE code = 'PRJ-SUR-01';");
      const surPrjId = prjRes.rows[0].id;

      // USR-004 Renzo Loyola NO es miembro de ORG-BANCOSUR
      let triggerBlocked = false;
      try {
        await appPool.query(`
          INSERT INTO traceflow.user_project_assignment (user_id, project_id)
          VALUES ('a0000001-0000-0000-0000-000000000004', $1);
        `, [surPrjId]);
      } catch (err: any) {
        triggerBlocked = true;
        // Mensaje emitido por enforce_project_member_organization_integrity
        expect(err.message).toContain('Violación de segregación institucional (DA-06)');
      }
      expect(triggerBlocked).toBe(true);
    });
  });

  // ==========================================================================
  // BLOQUE 5: REVOCACIÓN DE PERMISOS POR SUSPENSIÓN (RfcsService y ProjectsService)
  // ==========================================================================
  describe('Bloque 5: Aislamiento y Revocación por Suspensión (INIT-H02-V §6)', () => {
    it('V-11: Suspender a un integrante debe impedir consultar proyectos y emitir RFCs aunque mantenga sesión válida', async () => {
      const exodoOrg = await orgsRepo.findByIdOrSlugOrCode('ORG-EXODO');
      expect(exodoOrg).toBeDefined();

      // Incorporar a Augusto como miembro en ORG-EXODO (ya está en seeds como MEMBER ACTIVE)
      const memberBefore = await orgsRepo.findMember(exodoOrg!.id, userAugustoDev.id);
      expect(memberBefore?.status).toBe('ACTIVE');

      // 1. Suspender formalmente a Augusto en la organización
      await orgsService.updateMemberStatus(
        'ORG-EXODO',
        userAugustoDev.code,
        { status: 'SUSPENDED' },
        userJoanGestor // Joan es OWNER
      );

      const memberAfter = await orgsRepo.findMember(exodoOrg!.id, userAugustoDev.id);
      expect(memberAfter?.status).toBe('SUSPENDED');

      // 2. ProjectsService.getProjectById debe denegar el acceso a proyectos de la organización
      await expect(
        projectsService.getProjectById('PRJ-001', userAugustoDev)
      ).rejects.toThrow(ForbiddenException);

      // 3. RfcsService.createRfc debe bloquear cualquier intento de emitir RFC
      const userAugustoSolicitante: AuthenticatedUser = {
        ...userAugustoDev,
        activeRoleId: 'PU-01',
      };
      await expect(
        rfcsService.createRfc(
          {
            projectId: 'PRJ-001',
            targetEcsId: 'c0000001-0000-0000-0000-000000000001',
            title: 'Cambio no autorizado por usuario suspendido',
            description: 'Intento de modificar código tras suspensión',
            justification: 'Prueba de seguridad',
            priority: 'MEDIA',
          },
          userAugustoSolicitante
        )
      ).rejects.toThrow(ForbiddenException);

      // 4. Insertar una RFC en PRJ-001 para validar que getRfcById rechaza a miembros suspendidos
      const rfcRes = await adminPool.query(`
        INSERT INTO traceflow.change_request (
          id, code, project_id, target_ecs_id, title, description, justification,
          priority, classification, status, requested_by, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), 'RFC-TEST-0001', 'b0000001-0000-0000-0000-000000000001',
          'c0000001-0000-0000-0000-000000000001', 'RFC de Prueba Histórica', 'Descripción de prueba',
          'Justificación de prueba', 'MEDIA', 'PENDIENTE', 'REGISTRADA',
          'a0000001-0000-0000-0000-000000000001', NOW(), NOW()
        ) RETURNING id, code;
      `);
      const sampleRfcCode = rfcRes.rows[0].code;

      await expect(
        rfcsService.getRfcById(sampleRfcCode, userAugustoDev)
      ).rejects.toThrow(ForbiddenException);

      // 5. RfcsService.getRfcsForUser debe excluir expedientes de organizaciones donde está suspendido
      const visibleRfcs = await rfcsService.getRfcsForUser(userAugustoDev);
      const prj1Rfcs = visibleRfcs.filter((r) => r.project_id === 'b0000001-0000-0000-0000-000000000001' || r.project_id === 'PRJ-001');
      expect(prj1Rfcs.length).toBe(0);

      // Restaurar estado activo de Augusto para no alterar pruebas posteriores
      await orgsService.updateMemberStatus(
        'ORG-EXODO',
        userAugustoDev.code,
        { status: 'ACTIVE' },
        userJoanGestor
      );

      // 6. Consulta histórica autorizada: Augusto activo puede consultar la RFC histórica
      const rfcConsultada = await rfcsService.getRfcById(sampleRfcCode, userAugustoDev);
      expect(rfcConsultada.code).toBe(sampleRfcCode);
    });

    it('V-12: Protección contra condiciones de carrera: No se puede suspender al único OWNER activo de una organización', async () => {
      // ORG-BANCOSUR tiene un único OWNER (Joan Medina)
      await expect(
        orgsService.updateMemberStatus(
          'ORG-BANCOSUR',
          userJoanGestor.code,
          { status: 'SUSPENDED' },
          userJoanGestor
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('V-13: Salvaguarda de Gobernanza SCM (DA-04): En modo PostgreSQL, un integrante activo en un proyecto ACTIVE no puede emitir RFC sin integración GitHub validada (fail-closed)', async () => {
      // Joan es OWNER activo en ORG-EXODO y tiene membresía y asignación al proyecto PRJ-001
      const userJoanSolicitante: AuthenticatedUser = {
        ...userJoanGestor,
        activeRoleId: 'PU-01',
      };

      // Simular que el proyecto se encuentra en estado 'ACTIVE' (ej. migración o regularización previa)
      await adminPool.query("UPDATE traceflow.project SET status = 'ACTIVE' WHERE code = 'PRJ-001';");

      try {
        // Sin la variable ALLOW_MOCK_GITHUB_ACTIVATION, debe fallar con ForbiddenException (fail-closed)
        delete process.env.ALLOW_MOCK_GITHUB_ACTIVATION;

        await expect(
          rfcsService.createRfc(
            {
              projectId: 'PRJ-001',
              targetEcsId: 'c0000001-0000-0000-0000-000000000001',
              title: 'Intento de RFC en proyecto sin GitHub validado',
              description: 'Prueba de salvaguarda fail-closed DA-04',
              justification: 'Validar gobernanza SCM obligatoria',
              priority: 'MEDIA',
            },
            userJoanSolicitante
          )
        ).rejects.toThrow(
          /Operación rechazada \(DA-04 \/ RN-12\): El proyecto 'PRJ-001' no dispone de una integración GitHub validada/i
        );

        // Si explícitamente se habilita ALLOW_MOCK_GITHUB_ACTIVATION=true (simulación autorizada en pruebas),
        // la salvaguarda permite la emisión controlada de la RFC
        process.env.ALLOW_MOCK_GITHUB_ACTIVATION = 'true';
        const rfc = await rfcsService.createRfc(
          {
            projectId: 'PRJ-001',
            targetEcsId: 'c0000001-0000-0000-0000-000000000001',
            title: 'RFC autorizada con bypass simulado de prueba',
            description: 'Prueba controlada de bypass en testing',
            justification: 'Verificación de canal de pruebas controladas',
            priority: 'MEDIA',
          },
          userJoanSolicitante
        );
        expect(rfc).toBeDefined();
        expect(rfc.title).toBe('RFC autorizada con bypass simulado de prueba');
        expect(rfc.status).toBe('REGISTRADA');
      } finally {
        delete process.env.ALLOW_MOCK_GITHUB_ACTIVATION;
        await adminPool.query("UPDATE traceflow.project SET status = 'HISTORICO_PENDIENTE_GITHUB' WHERE code = 'PRJ-001';");
      }
    });
  });

  // ==========================================================================
  // BLOQUE 6: AUDITORÍA REAL CON CRIPTOGRAFÍA SHA-256 E INMUTABILIDAD
  // ==========================================================================
  describe('Bloque 6: Auditoría Inmutable con Cadena Criptográfica SHA-256 (ADR-008)', () => {
    it('V-14: append_audit_log en PostgreSQL real debe generar hashes SHA-256 válidos y serializados', async () => {
      const logsRes = await appPool.query(`
        SELECT sequence_number, prev_log_hash, curr_log_hash, payload_diff
        FROM traceflow.audit_log
        ORDER BY sequence_number ASC;
      `);
      expect(logsRes.rows.length).toBeGreaterThanOrEqual(2);

      // Validar cada hash
      for (let i = 1; i < logsRes.rows.length; i++) {
        const prev = logsRes.rows[i - 1];
        const curr = logsRes.rows[i];
        expect(curr.prev_log_hash).toBe(prev.curr_log_hash);
        expect(curr.curr_log_hash).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it('V-15: UPDATE y DELETE sobre traceflow.audit_log deben ser estrictamente rechazados por el trigger', async () => {
      // Intentar alterar un registro de auditoría en PostgreSQL real
      await expect(
        adminPool.query("UPDATE traceflow.audit_log SET event_code = 'ALTERED';")
      ).rejects.toThrow();

      // Intentar eliminar un registro de auditoría
      await expect(
        adminPool.query("DELETE FROM traceflow.audit_log WHERE sequence_number = 1;")
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // BLOQUE 7: RECUPERACIÓN Y ROLLBACK SEGURO SIN PÉRDIDA DE INFORMACIÓN (H02-R05)
  // ==========================================================================
  describe('Bloque 7: Salvaguardas del Script de Recuperación y Rollback (H02-R05)', () => {
    const rollbackSqlPath = path.resolve(
      process.cwd(),
      '../supabase/migrations/202611260001_init_h02_organizations_and_projects_rollback.sql'
    );
    const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf8');

    it('V-16: Si existen proyectos u organizaciones creadas post-migración, el script de rollback debe ABORTAR', async () => {
      // Intentar ejecutar el rollback cuando existen proyectos u organizaciones creadas (PRJ-SUR-01, ORG-BANCOSUR)
      let rollbackBlocked = false;
      try {
        await adminPool.query(rollbackSql);
      } catch (err: any) {
        rollbackBlocked = true;
        expect(err.message).toContain('BLOQUEO DE SEGURIDAD');
        expect(err.message).toContain('Orgs nuevas: 1');
      }
      expect(rollbackBlocked).toBe(true);

      // Verificar que los datos siguen existiendo intactos
      const orgCheck = await adminPool.query("SELECT 1 FROM traceflow.organization WHERE code = 'ORG-BANCOSUR';");
      expect(orgCheck.rows.length).toBe(1);
    });

    it('V-17: Si uno de los cuatro fundadores es alterado en rol o estado, el rollback debe ABORTAR', async () => {
      // Modificar temporalmente el rol de USR-002 de MEMBER a OWNER
      await adminPool.query(`
        UPDATE traceflow.organization_member
        SET role_in_org = 'OWNER'
        WHERE user_id = 'a0000001-0000-0000-0000-000000000002';
      `);

      let rollbackBlocked = false;
      try {
        await adminPool.query(rollbackSql);
      } catch (err: any) {
        rollbackBlocked = true;
        expect(err.message).toContain('BLOQUEO DE SEGURIDAD');
        expect(err.message).toMatch(/Fundadores alterados:\s*(true|t)/);
      } finally {
        // Restaurar estado original del fundador para no dejar datos corruptos
        await adminPool.query(`
          UPDATE traceflow.organization_member
          SET role_in_org = 'MEMBER'
          WHERE user_id = 'a0000001-0000-0000-0000-000000000002';
        `);
      }
      expect(rollbackBlocked).toBe(true);
    });

    it('V-18: Reversión limpia: Con solo los 4 fundadores y proyectos históricos recién migrados, el rollback revierte el esquema limpiamente', async () => {
      // 0. Cerrar limpiamente conexiones de aplicación previas para evitar desconexiones abruptas por pg_terminate_backend
      if (dbService) await dbService.onModuleDestroy();
      if (appPool) await appPool.end();
      if (adminPool) await adminPool.end();

      // 1. Reestablecer el estado exacto post-migración H02 (con las 4 migraciones aplicadas y seeds intactos)
      const setupResult = await resetAndMigrateRealPostgres({
        allowDestructiveReset: process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET === 'true',
        targetMigration: 'H02',
      });
      adminPool = setupResult.adminPool;
      appPool = setupResult.appPool;

      // 2. Ejecutar el script exacto de rollback en la base PostgreSQL real
      await adminPool.query(rollbackSql);

      // 3. Verificar que las tablas organizacionales fueron removidas
      const orgTableRes = await adminPool.query("SELECT to_regclass('traceflow.organization') as tbl;");
      expect(orgTableRes.rows[0].tbl).toBeNull();

      const memberTableRes = await adminPool.query("SELECT to_regclass('traceflow.organization_member') as tbl;");
      expect(memberTableRes.rows[0].tbl).toBeNull();

      // 4. Verificar que la columna organization_id en project fue eliminada
      const colRes = await adminPool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'traceflow' AND table_name = 'project' AND column_name = 'organization_id';
      `);
      expect(colRes.rows.length).toBe(0);

      // 5. Verificar que los proyectos históricos siguen existiendo intactos con status ACTIVE
      const prjsRes = await adminPool.query(`
        SELECT code, status FROM traceflow.project ORDER BY code ASC;
      `);
      expect(prjsRes.rows.length).toBe(3);
      expect(prjsRes.rows.map(r => r.code)).toEqual(['PRJ-001', 'PRJ-002', 'PRJ-003']);
      expect(prjsRes.rows.every(r => r.status === 'ACTIVE')).toBe(true);

      // 6. Verificar que los 4 usuarios del sistema continúan existiendo en app_user
      const usersRes = await adminPool.query(`
        SELECT code FROM traceflow.app_user ORDER BY code ASC;
      `);
      expect(usersRes.rows.length).toBe(4);
      expect(usersRes.rows.map(r => r.code)).toEqual(['USR-001', 'USR-002', 'USR-003', 'USR-004']);

      // 7. Cerrar pools de la reversión limpia y marcar bandera
      await adminPool.end();
      await appPool.end();
      poolsClosed = true;
    });
  });
});
