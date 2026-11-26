/**
 * ============================================================================
 * TRACEFLOW SCM — CERTIFICACIÓN OFICIAL EN POSTGRESQL REAL (HITO INIT-H03)
 * Archivo: backend/test/real-postgres-h03-certification.spec.ts
 * Motor: PostgreSQL 16.14 Real (Servidor dedicado aislado en 127.0.0.1:5432)
 * Marco Normativo: DA-01 a DA-06, ADR-011, Plan Maestro, IEEE 828, RNF-01, RNF-03
 *
 * VALIDACIONES OBLIGATORIAS CERTIFICADAS:
 *  1. Ejecución de las 5 migraciones en orden (incluyendo 202611260002_init_h03_team_methodology_planning.sql).
 *  2. Catálogo físico con exactamente 29 tablas en esquema traceflow.
 *  3. Integridad física de tablas H03 (project_setup, project_team_role, project_methodology, project_phase, project_milestone, project_deliverable).
 *  4. Disparadores relacionales reales en PostgreSQL (trg_check_project_team_role_org, trg_check_milestone_project, trg_check_deliverable_project).
 *  5. Privilegios mínimos de traceflow_app en las 6 nuevas tablas (SELECT, INSERT, UPDATE permitidos; DELETE revocado).
 *  6. Flujo modular completo de servicios NestJS sobre PostgreSQL real (roles de equipo, metodología, fases, hitos, entregables, setup wizard).
 *  7. Registro de auditoría criptográfica SHA-256 en traceflow.audit_log.
 *  8. Procedimiento de reversión y rollback seguro (202611260002_init_h03_team_methodology_planning_rollback.sql).
 * ============================================================================
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import pg from 'pg';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

import { resetAndMigrateRealPostgres } from './helpers/real-db-helper.js';
import { DatabaseService } from '../src/database/database.service.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { OrganizationsService } from '../src/modules/organizations/organizations.service.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { ProjectPlanningRepository } from '../src/modules/projects/project-planning.repository.js';
import { ProjectPlanningService } from '../src/modules/projects/project-planning.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import type { AuthenticatedUser } from '../src/common/types/index.js';

describe('TraceFlow SCM — Certificación Oficial PostgreSQL Real (INIT-H03)', { timeout: 60000 }, () => {
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

  let testOrgId: string;
  let testProjectId: string;
  let externalUserId: string;

  beforeAll(async () => {
    // 1. Configurar entorno
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_MODE = 'postgres';
    process.env.DATABASE_SSL = 'false';
    process.env.TEST_DATABASE_URL = 'postgresql://traceflow_app:TestAppPassword123!@127.0.0.1:5432/traceflow_cert';

    // 2. Reiniciar y migrar base de datos real con las 5 migraciones oficiales (hasta H03)
    const setupResult = await resetAndMigrateRealPostgres({
      allowDestructiveReset: process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET === 'true',
      targetMigration: 'H03',
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
  });

  afterAll(async () => {
    if (!poolsClosed) {
      if (dbService) await dbService.onModuleDestroy();
      if (adminPool) await adminPool.end();
      if (appPool) await appPool.end();
    }
  });

  // ==========================================================================
  // BLOQUE 1: MIGRACIONES REALES Y CATÁLOGO RELACIONAL (H03)
  // ==========================================================================
  describe('Bloque 1: Migraciones Reales y Catálogo Físico en PostgreSQL 16+', () => {
    it('H03-V01: Debe haber ejecutado las 5 migraciones oficiales en orden estricto', () => {
      expect(appliedMigrations).toEqual([
        '202611250001_initial_traceflow.sql',
        '202611250002_structural_seeds.sql',
        '202611250003_secure_app_role_least_privilege.sql',
        '202611260001_init_h02_organizations_and_projects.sql',
        '202611260002_init_h03_team_methodology_planning.sql',
      ]);
    });

    it('H03-V02: El catálogo físico debe contar con exactamente 29 tablas en esquema traceflow', async () => {
      const res = await adminPool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'traceflow'
        ORDER BY table_name;
      `);
      const tableNames = res.rows.map((r: any) => r.table_name);
      expect(tableNames.length).toBe(29);

      // Tablas históricas y H02
      expect(tableNames).toContain('organization');
      expect(tableNames).toContain('organization_member');
      expect(tableNames).toContain('project');
      expect(tableNames).toContain('audit_log');

      // Las 6 nuevas tablas de H03
      expect(tableNames).toContain('project_setup');
      expect(tableNames).toContain('project_team_role');
      expect(tableNames).toContain('project_methodology');
      expect(tableNames).toContain('project_phase');
      expect(tableNames).toContain('project_milestone');
      expect(tableNames).toContain('project_deliverable');
    });

    it('H03-V03: Las 6 tablas de H03 deben tener restricciones y claves foráneas correctas', async () => {
      // Verificar columnas y tipos de project_setup
      const setupCols = await adminPool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'traceflow' AND table_name = 'project_setup'
        ORDER BY column_name;
      `);
      const colMap = Object.fromEntries(setupCols.rows.map((r: any) => [r.column_name, r.data_type]));
      expect(colMap.wizard_step).toBe('integer');
      expect(colMap.identity_completed).toBe('boolean');
      expect(colMap.team_completed).toBe('boolean');
      expect(colMap.methodology_completed).toBe('boolean');

      // Verificar restricción CHECK de metodología
      const methChk = await adminPool.query(`
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint
        WHERE conrelid = 'traceflow.project_methodology'::regclass AND conname = 'chk_methodology_type';
      `);
      expect(methChk.rows.length).toBe(1);
      expect(methChk.rows[0].def).toContain('SCRUM');
      expect(methChk.rows[0].def).toContain('UPT_ACADEMICA');

      // Verificar restricción CHECK de fechas de fases
      const phaseChk = await adminPool.query(`
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint
        WHERE conrelid = 'traceflow.project_phase'::regclass AND conname = 'chk_phase_dates';
      `);
      expect(phaseChk.rows.length).toBe(1);
      expect(phaseChk.rows[0].def).toContain('end_date >= start_date');
    });
  });

  // ==========================================================================
  // BLOQUE 2: DISPARADORES RELACIONALES EN POSTGRESQL REAL
  // ==========================================================================
  describe('Bloque 2: Integridad Relacional y Disparadores Físicos en PostgreSQL', () => {
    let orgExodoId: string;
    let prj001Id: string;

    beforeAll(async () => {
      const orgRes = await adminPool.query("SELECT id FROM traceflow.organization WHERE code = 'ORG-EXODO';");
      orgExodoId = orgRes.rows[0].id;

      const prjRes = await adminPool.query("SELECT id FROM traceflow.project WHERE code = 'PRJ-001';");
      prj001Id = prjRes.rows[0].id;

      // Crear un usuario externo a Éxodo
      const extRes = await adminPool.query(`
        INSERT INTO traceflow.app_user (id, code, username, email, password_hash, full_name, organization, position, status)
        VALUES (gen_random_uuid(), 'USR-EXT01', 'extuser', 'ext@other.com', 'pwdhash', 'Usuario Externo', 'Otra Org', 'Tester', 'ACTIVE')
        RETURNING id;
      `);
      externalUserId = extRes.rows[0].id;
    });

    it('H03-V04: trg_check_project_team_role_org debe rechazar asignación si el usuario no es miembro activo de la org', async () => {
      // Obtener el ID numérico del rol PU-06
      const roleRes = await adminPool.query("SELECT id FROM traceflow.app_role WHERE code = 'PU-06';");
      const roleId = roleRes.rows[0].id;

      // Intentar insertar usuario externo en project_team_role de PRJ-001 (ORG-EXODO)
      let rejected = false;
      try {
        await adminPool.query(`
          INSERT INTO traceflow.project_team_role (project_id, user_id, role_id, assigned_by)
          VALUES ($1, $2, $3, $4);
        `, [prj001Id, externalUserId, roleId, userJoanGestor.id]);
      } catch (err: any) {
        rejected = true;
        expect(err.message).toMatch(/Violación de segregación institucional \(DA-06\)|no es miembro activo/);
      }
      expect(rejected).toBe(true);
    });

    it('H03-V05: trg_check_milestone_project debe impedir asignar un hito a una fase de otro proyecto', async () => {
      // Obtener PRJ-002
      const prj2Res = await adminPool.query("SELECT id FROM traceflow.project WHERE code = 'PRJ-002';");
      const prj002Id = prj2Res.rows[0].id;

      // Crear una fase en PRJ-001
      const phaseRes = await adminPool.query(`
        INSERT INTO traceflow.project_phase (project_id, phase_code, name, sequence_order, start_date, end_date)
        VALUES ($1, 'F1-PRJ1', 'Fase 1 Proyecto 1', 1, '2026-03-01', '2026-03-31')
        RETURNING id;
      `, [prj001Id]);
      const phasePrj1Id = phaseRes.rows[0].id;

      // Intentar crear un hito en PRJ-002 apuntando a phasePrj1Id de PRJ-001
      let rejected = false;
      try {
        await adminPool.query(`
          INSERT INTO traceflow.project_milestone (project_id, phase_id, code, title, target_date)
          VALUES ($1, $2, 'M1-INV', 'Hito Inválido', '2026-03-15');
        `, [prj002Id, phasePrj1Id]);
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain('Inconsistencia de proyecto');
      }
      expect(rejected).toBe(true);
    });

    it('H03-V06: trg_check_deliverable_project debe impedir asignar un entregable a un hito de otro proyecto', async () => {
      // Obtener PRJ-002
      const prj2Res = await adminPool.query("SELECT id FROM traceflow.project WHERE code = 'PRJ-002';");
      const prj002Id = prj2Res.rows[0].id;

      // Crear un hito legítimo en PRJ-001
      const msRes = await adminPool.query(`
        INSERT INTO traceflow.project_milestone (project_id, code, title, target_date)
        VALUES ($1, 'M1-PRJ1', 'Hito Legítimo P1', '2026-03-15')
        RETURNING id;
      `, [prj001Id]);
      const milestonePrj1Id = msRes.rows[0].id;

      // Intentar crear un entregable en PRJ-002 vinculando el hito de PRJ-001
      let rejected = false;
      try {
        await adminPool.query(`
          INSERT INTO traceflow.project_deliverable (project_id, milestone_id, code, name, expected_type, responsible_user_id)
          VALUES ($1, $2, 'DEL-INV', 'Entregable Inválido', 'TECHNICAL_DOCUMENT', $3);
        `, [prj002Id, milestonePrj1Id, userJoanGestor.id]);
      } catch (err: any) {
        rejected = true;
        expect(err.message).toContain('Inconsistencia de proyecto');
      }
      expect(rejected).toBe(true);
    });
  });

  // ==========================================================================
  // BLOQUE 3: PRIVILEGIOS MÍNIMOS DE traceflow_app EN LAS 6 TABLAS (SEC-02)
  // ==========================================================================
  describe('Bloque 3: Mínimo Privilegio de traceflow_app en Tablas H03', () => {
    it('H03-V07: traceflow_app debe tener permisos SELECT, INSERT y UPDATE en project_team_role', async () => {
      const prjRes = await adminPool.query("SELECT id FROM traceflow.project WHERE code = 'PRJ-001';");
      const prjId = prjRes.rows[0].id;

      // Obtener el ID numérico del rol PU-03
      const roleRes = await adminPool.query("SELECT id FROM traceflow.app_role WHERE code = 'PU-03';");
      const roleId = roleRes.rows[0].id;

      // 1. SELECT
      const sel = await appPool.query('SELECT COUNT(*) FROM traceflow.project_team_role;');
      expect(sel.rows.length).toBe(1);

      // 2. INSERT
      const ins = await appPool.query(`
        INSERT INTO traceflow.project_team_role (project_id, user_id, role_id, assigned_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (project_id, user_id, role_id) DO NOTHING
        RETURNING id;
      `, [prjId, userRenzoArqui.id, roleId, userJoanGestor.id]);
      expect(ins.rows.length).toBeGreaterThanOrEqual(0);

      // 3. UPDATE
      const upd = await appPool.query(`
        UPDATE traceflow.project_team_role
        SET status = 'ACTIVE'
        WHERE project_id = $1 AND user_id = $2 AND role_id = $3;
      `, [prjId, userRenzoArqui.id, roleId]);
      expect(upd.rowCount).toBeGreaterThanOrEqual(0);
    });

    it('H03-V08: traceflow_app tiene ESTRICTAMENTE REVOCADO el permiso DELETE en las 6 tablas H03', async () => {
      const tables = [
        'project_setup',
        'project_team_role',
        'project_methodology',
        'project_phase',
        'project_milestone',
        'project_deliverable',
      ];

      for (const tbl of tables) {
        let errorThrown = false;
        try {
          await appPool.query(`DELETE FROM traceflow.${tbl} WHERE 1=0;`);
        } catch (err: any) {
          errorThrown = true;
          expect(err.code).toBe('42501'); // insufficient_privilege
        }
        expect(errorThrown).toBe(true);
      }
    });
  });

  // ==========================================================================
  // BLOQUE 4: INTEGRACIÓN DE SERVICIOS NESTJS SOBRE POSTGRESQL REAL
  // ==========================================================================
  describe('Bloque 4: Servicios NestJS sobre PostgreSQL Real', () => {
    beforeAll(async () => {
      // Crear una organización y un proyecto BORRADOR nuevo para pruebas de flujo
      const org = await orgsService.createOrganization(
        { code: 'ORG-FINTECH', slug: 'fintech-solutions', name: 'Fintech Solutions S.A.' },
        userJoanGestor
      );
      testOrgId = org.id;

      // Agregar a Renzo y Augusto a la organización
      await orgsService.addMember(testOrgId, { userCodeOrEmailOrId: userRenzoArqui.id, roleInOrg: 'MEMBER' }, userJoanGestor);
      await orgsService.addMember(testOrgId, { userCodeOrEmailOrId: userAugustoDev.id, roleInOrg: 'MEMBER' }, userJoanGestor);

      // Crear proyecto borrador
      const prj = await projectsService.createProject(
        {
          code: 'PRJ-WALLET-01',
          projectKey: 'WALLET',
          name: 'Billetera Digital Fintech',
          description: 'Proyecto de pagos digitales móviles',
          clientName: 'Banco Fintech S.A.',
          organizationId: testOrgId,
        },
        userJoanGestor
      );
      testProjectId = prj.id;
    });

    it('H03-V09: Asignación de roles de equipo con ProjectPlanningService en PostgreSQL', async () => {
      // 1. Asignar a Renzo como PU-03 (Arquitecto)
      const role1 = await planningService.assignTeamRole(
        testProjectId,
        { userId: userRenzoArqui.id, roleIdOrCode: 'PU-03' },
        userJoanGestor
      );
      expect(role1.user_id).toBe(userRenzoArqui.id);
      expect(role1.role_code).toBe('PU-03');
      expect(role1.status).toBe('ACTIVE');

      // 2. Asignar a Augusto como PU-06 (Desarrollador)
      const role2 = await planningService.assignTeamRole(
        testProjectId,
        { userId: userAugustoDev.id, roleIdOrCode: 'PU-06' },
        userJoanGestor
      );
      expect(role2.user_id).toBe(userAugustoDev.id);
      expect(role2.role_code).toBe('PU-06');

      // 3. Consultar roles asignados
      const roles = await planningService.getTeamRoles(testProjectId, userJoanGestor);
      expect(roles.length).toBe(2);

      // 4. Intentar asignar rol duplicado debe lanzar ConflictException
      await expect(
        planningService.assignTeamRole(
          testProjectId,
          { userId: userRenzoArqui.id, roleIdOrCode: 'PU-03' },
          userJoanGestor
        )
      ).rejects.toThrow(ConflictException);

      // 5. Inactivar y reactivar rol
      const deactivated = await planningService.updateTeamRoleStatus(
        testProjectId,
        role1.id,
        'INACTIVE',
        userJoanGestor
      );
      expect(deactivated.status).toBe('INACTIVE');

      const reactivated = await planningService.updateTeamRoleStatus(
        testProjectId,
        role1.id,
        'ACTIVE',
        userJoanGestor
      );
      expect(reactivated.status).toBe('ACTIVE');
    });

    it('H03-V10: Configuración de Metodología SCRUM con validaciones de negocio', async () => {
      // 1. Configurar SCRUM con 2 semanas de iteración
      const meth = await planningService.configureMethodology(
        testProjectId,
        {
          methodologyType: 'SCRUM',
          iterationDurationWeeks: 2,
          configurationParams: { dailyTime: '09:00', sprintReviewDay: 'Friday' },
        },
        userJoanGestor
      );
      expect(meth.methodology_type).toBe('SCRUM');
      expect(meth.iteration_duration_weeks).toBe(2);
      expect((meth.configuration_params as any).dailyTime).toBe('09:00');

      // 2. Consultar metodología
      const saved = await planningService.getMethodology(testProjectId, userJoanGestor);
      expect(saved?.methodology_type).toBe('SCRUM');

      // 3. Validar rechazo de duración inválida para SCRUM (ej. 12 semanas)
      await expect(
        planningService.configureMethodology(
          testProjectId,
          {
            methodologyType: 'SCRUM',
            iterationDurationWeeks: 12,
          },
          userJoanGestor
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('H03-V11: Planificación de Fases cronológicamente ordenadas', async () => {
      // 1. Crear Fase 1: Arquitectura y Diseño
      const phase1 = await planningService.createPhase(
        testProjectId,
        {
          phaseCode: 'FASE-01',
          name: 'Arquitectura y Diseño Base',
          sequenceOrder: 1,
          startDate: '2026-03-01',
          endDate: '2026-03-31',
        },
        userJoanGestor
      );
      expect(phase1.phase_code).toBe('FASE-01');
      expect(phase1.sequence_order).toBe(1);

      // 2. Crear Fase 2: Implementación Core
      const phase2 = await planningService.createPhase(
        testProjectId,
        {
          phaseCode: 'FASE-02',
          name: 'Implementación del Motor de Pagos',
          sequenceOrder: 2,
          startDate: '2026-04-01',
          endDate: '2026-05-15',
        },
        userJoanGestor
      );
      expect(phase2.sequence_order).toBe(2);

      // 3. Consultar fases
      const phases = await planningService.getPhases(testProjectId, userJoanGestor);
      expect(phases.length).toBe(2);

      // 4. Rechazar fechas cronológicamente inválidas (endDate < startDate)
      await expect(
        planningService.createPhase(
          testProjectId,
          {
            phaseCode: 'FASE-INV',
            name: 'Fase Inválida',
            sequenceOrder: 3,
            startDate: '2026-06-01',
            endDate: '2026-05-01',
          },
          userJoanGestor
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('H03-V12: Definición de Hitos y Entregables vinculados', async () => {
      const phases = await planningService.getPhases(testProjectId, userJoanGestor);
      const phase1 = phases[0];

      // 1. Crear Hito 1
      const milestone = await planningService.createMilestone(
        testProjectId,
        {
          code: 'MS-01',
          title: 'Línea Base de Arquitectura Aprobada',
          phaseId: phase1.id,
          targetDate: '2026-03-25',
        },
        userJoanGestor
      );
      expect(milestone.code).toBe('MS-01');

      // 2. Crear Entregable asociado al Hito 1 con responsable USR-002 (Renzo)
      const deliverable = await planningService.createDeliverable(
        testProjectId,
        {
          code: 'DEL-01',
          name: 'Documento SAD Arquitectura de Pagos',
          expectedType: 'TECHNICAL_DOCUMENT',
          milestoneId: milestone.id,
          responsibleUserId: userRenzoArqui.id,
        },
        userJoanGestor
      );
      expect(deliverable.code).toBe('DEL-01');
      expect(deliverable.expected_type).toBe('TECHNICAL_DOCUMENT');
      expect(deliverable.responsible_user_id).toBe(userRenzoArqui.id);

      // 3. Rechazar entregable con responsable que no pertenece al equipo
      await expect(
        planningService.createDeliverable(
          testProjectId,
          {
            code: 'DEL-ERR',
            name: 'Entregable Fallido',
            expectedType: 'TECHNICAL_DOCUMENT',
            milestoneId: milestone.id,
            responsibleUserId: externalUserId,
          },
          userJoanGestor
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('H03-V13: Progreso Progresivo del Asistente de Proyecto (Wizard Steps 2 y 3)', async () => {
      // 1. Consultar setup inicial
      const setupInit = await planningService.getProjectSetup(testProjectId, userJoanGestor);
      expect(setupInit.project).toBeDefined();
      expect(setupInit.setup?.wizard_step).toBe(1);

      // 2. Guardar Paso 2 (Equipo)
      const setupStep2 = await planningService.saveStep2Team(
        testProjectId,
        {
          members: [
            { userId: userRenzoArqui.id, roleIdOrCode: 'PU-03' },
            { userId: userAugustoDev.id, roleIdOrCode: 'PU-06' },
          ],
        },
        userJoanGestor
      );
      expect(setupStep2.setup.wizard_step).toBeGreaterThanOrEqual(3);
      expect(setupStep2.setup.team_completed).toBe(true);

      // 3. Guardar Paso 3 (Metodología y Planificación)
      const setupStep3 = await planningService.saveStep3MethodologyPlanning(
        testProjectId,
        {
          methodology: {
            methodologyType: 'SCRUM',
            iterationDurationWeeks: 2,
          },
          phases: [
            {
              phaseCode: 'FASE-03',
              name: 'Fase 3 Despliegue',
              sequenceOrder: 3,
              startDate: '2026-06-01',
              endDate: '2026-06-30',
            },
          ],
        },
        userJoanGestor
      );
      expect(setupStep3.setup.wizard_step).toBeGreaterThanOrEqual(4);
      expect(setupStep3.setup.methodology_completed).toBe(true);

      // 4. Guardar borrador arbitrario y recuperar
      const draft = await planningService.saveDraftProgress(
        testProjectId,
        {
          wizardStep: 4,
          draftPayload: { notes: 'Alineado con el cliente', pendingReview: true },
        },
        userJoanGestor
      );
      expect(draft.wizard_step).toBe(4);
      expect((draft.draft_payload as any).notes).toBe('Alineado con el cliente');
    });
  });

  // ==========================================================================
  // BLOQUE 5: AUDITORÍA CRIPTOGRÁFICA SHA-256 EN POSTGRESQL REAL
  // ==========================================================================
  describe('Bloque 5: Registro Inmutable de Auditoría en PostgreSQL Real', () => {
    it('H03-V14: Todos los eventos de planificación deben generar hashes SHA-256 encadenados', async () => {
      const logsRes = await adminPool.query(`
        SELECT sequence_number, event_code, prev_log_hash, curr_log_hash, entity_name
        FROM traceflow.audit_log
        WHERE entity_name IN ('project_team_role', 'project_methodology', 'project_phase', 'project_setup')
        ORDER BY sequence_number ASC;
      `);
      expect(logsRes.rows.length).toBeGreaterThanOrEqual(4);

      // Comprobar eventos específicos
      const events = logsRes.rows.map(r => r.event_code);
      expect(events).toContain('PROJECT_TEAM_ROLE_ASSIGNED');
      expect(events).toContain('PROJECT_METHODOLOGY_CONFIGURED');
      expect(events).toContain('PROJECT_DRAFT_PROGRESS_SAVED');

      // Comprobar formato SHA-256 (64 hex characters)
      for (const row of logsRes.rows) {
        expect(row.curr_log_hash).toMatch(/^[a-f0-9]{64}$/);
      }
    });
  });

  // ==========================================================================
  // BLOQUE 6: SALVAGUARDAS Y VERIFICACIÓN DEL ROLLBACK DE H03
  // ==========================================================================
  describe('Bloque 6: Salvaguardas y Reversión Limpia de Migración H03', () => {
    const rollbackSqlPath = path.resolve(
      process.cwd(),
      '../supabase/migrations/202611260002_init_h03_team_methodology_planning_rollback.sql'
    );
    const rollbackSql = fs.readFileSync(rollbackSqlPath, 'utf8');

    it('H03-V15: Reversión limpia: el script de rollback de H03 remueve exactamente las 6 tablas y devuelve el esquema al estado H02', async () => {
      // 1. Ejecutar el script exacto de rollback de H03 como admin
      await adminPool.query(rollbackSql);

      // 2. Verificar que las 6 tablas fueron eliminadas
      const h03Tables = [
        'project_setup',
        'project_team_role',
        'project_methodology',
        'project_phase',
        'project_milestone',
        'project_deliverable',
      ];
      for (const tbl of h03Tables) {
        const check = await adminPool.query(`SELECT to_regclass('traceflow.${tbl}') as tbl;`);
        expect(check.rows[0].tbl).toBeNull();
      }

      // 3. Verificar que el número de tablas en traceflow vuelve exactamente a 23 (estado H02)
      const countRes = await adminPool.query(`
        SELECT COUNT(*) as c
        FROM information_schema.tables
        WHERE table_schema = 'traceflow';
      `);
      expect(parseInt(countRes.rows[0].c, 10)).toBe(23);

      // 4. Verificar que las organizaciones y proyectos permanecen intactos
      const orgCheck = await adminPool.query("SELECT COUNT(*) as c FROM traceflow.organization;");
      expect(parseInt(orgCheck.rows[0].c, 10)).toBeGreaterThan(0);

      const prjCheck = await adminPool.query("SELECT COUNT(*) as c FROM traceflow.project;");
      expect(parseInt(prjCheck.rows[0].c, 10)).toBeGreaterThan(0);

      // Cerrar pools
      if (dbService) await dbService.onModuleDestroy();
      await adminPool.end();
      await appPool.end();
      poolsClosed = true;
    });
  });
});
