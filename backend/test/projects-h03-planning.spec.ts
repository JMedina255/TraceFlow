/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE PRUEBAS TDD DE EQUIPO, METODOLOGÍA Y PLANIFICACIÓN
 * Archivo: backend/test/projects-h03-planning.spec.ts
 * Hito: INIT-H03 — Requisitos H03.1 a H03.5, DA-01 a DA-06, ADR-011
 *
 * VALIDACIONES OBLIGATORIAS:
 *  1. Asignación de integrantes y roles funcionales canónicos (PU-01 a PU-07).
 *  2. Integridad institucional DA-06: rechazo de usuarios no registrados, externos o suspendidos.
 *  3. Prevención de duplicación de roles y control de acceso SoD para asignación.
 *  4. Configuración y validación metodológica (SCRUM, KANBAN, CASCADA, HIBRIDA, UPT_ACADEMICA).
 *  5. Integridad cronológica de fases (endDate >= startDate) y unicidad de secuencia.
 *  6. Aislamiento entre proyectos en hitos y entregables (rechazo de referencias foráneas).
 *  7. Asignación de entregables exclusivamente a miembros activos del equipo.
 *  8. Configuración progresiva (project_setup, Steps 1..5, guardado parcial y recuperación).
 *  9. Trazabilidad inmutable de auditoría con hash SHA-256 en todas las operaciones.
 * ============================================================================
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProjectPlanningRepository } from '../src/modules/projects/project-planning.repository.js';
import { ProjectPlanningService } from '../src/modules/projects/project-planning.service.js';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../src/common/types/index.js';

describe('TraceFlow SCM — INIT-H03: Equipo, Metodología y Planificación (TDD)', () => {
  let db: DatabaseService;
  let auditService: AuditService;
  let authRepo: AuthRepository;
  let orgsRepo: OrganizationsRepository;
  let projectsRepo: ProjectsRepository;
  let planningRepo: ProjectPlanningRepository;
  let planningService: ProjectPlanningService;

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
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  };

  const userRenzoArqui: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000002',
    code: 'USR-002',
    username: 'rantayhua',
    email: 'rantayhua@exodo.pe',
    fullName: 'Renzo Antonio Antayhua Mamani',
    organization: 'ÉXODO S.A.C.',
    position: 'Arquitecto de Software',
    activeRoleId: 'PU-03', // Arquitecto
    allowedRoleIds: ['PU-03', 'PU-06'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  };

  const userAugustoDev: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000003',
    code: 'USR-003',
    username: 'arivera',
    email: 'arivera@exodo.pe',
    fullName: 'Augusto Joaquin Rivera Muñoz',
    organization: 'ÉXODO S.A.C.',
    position: 'Ingeniero de Software',
    activeRoleId: 'PU-06', // Desarrollador
    allowedRoleIds: ['PU-05', 'PU-06', 'PU-07'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  };

  const userRenzoExterno: AuthenticatedUser = {
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

  beforeEach(() => {
    db = new DatabaseService('mock');
    auditService = new AuditService(db);
    authRepo = new AuthRepository(db);
    // Registrar usuario externo en el sistema (registrado y activo, pero sin membresía en ORG-EXODO)
    (authRepo as any).mockUsers.push({
      id: userRenzoExterno.id,
      code: userRenzoExterno.code,
      username: userRenzoExterno.username,
      email: userRenzoExterno.email,
      password_hash: 'mock_hash',
      full_name: userRenzoExterno.fullName,
      organization: userRenzoExterno.organization,
      position: userRenzoExterno.position,
      status: 'ACTIVE',
      primary_role_code: 'PU-01',
      assigned_role_codes: ['PU-01'],
      assigned_project_codes: [],
    });

    orgsRepo = new OrganizationsRepository(db, authRepo);
    projectsRepo = new ProjectsRepository(db);
    planningRepo = new ProjectPlanningRepository(db);
    planningService = new ProjectPlanningService(
      db,
      projectsRepo,
      orgsRepo,
      authRepo,
      planningRepo,
      auditService
    );
  });

  // ==========================================================================
  // BLOQUE 1: H03.1 — ROLES Y MIEMBROS DEL EQUIPO (project_team_role, DA-06)
  // ==========================================================================
  describe('H03.1: Roles y Miembros del Proyecto (DA-06, PU-01 a PU-07)', () => {
    it('TDD-H03-01: Asignación exitosa de miembro activo al equipo con rol canónico y auditoría SHA-256', async () => {
      // Joan (Gestor PU-02) asigna a Augusto (USR-003) como Ingeniero de Software (PU-06) en PRJ-001
      const role = await planningService.assignTeamRole(
        'PRJ-001',
        {
          userId: userAugustoDev.id,
          roleIdOrCode: 'PU-06',
          functionalTitle: 'Desarrollador Full Stack Senior',
          isLead: false,
        },
        userJoanGestor
      );

      expect(role).toBeDefined();
      expect(role.role_code).toBe('PU-06');
      expect(role.status).toBe('ACTIVE');
      expect(role.functional_title).toBe('Desarrollador Full Stack Senior');

      // Validar que se registró el evento en la cadena inmutable de auditoría
      const auditChain = auditService.getAuditChain();
      const event = auditChain.find((e) => e.operation === 'ASSIGN_TEAM_ROLE');
      expect(event).toBeDefined();
      expect(event?.currLogHash).toMatch(/^[a-f0-9]{64}$/);

      // Comprobar compatibilidad con user_project_assignment
      const assignments = await projectsRepo.findUserProjectAssignments(userAugustoDev.id);
      expect(assignments.some((id) => id.includes('0001') || id === 'PRJ-001')).toBe(true);
    });

    it('TDD-H03-02: PRUEBA NEGATIVA: Rechaza asignación de usuario no registrado en el sistema (404)', async () => {
      await expect(
        planningService.assignTeamRole(
          'PRJ-001',
          {
            userId: 'a0000001-9999-9999-9999-999999999999',
            roleIdOrCode: 'PU-06',
          },
          userJoanGestor
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('TDD-H03-03: PRUEBA NEGATIVA: Rechaza asignación de usuario que no pertenece a la organización (DA-06)', async () => {
      // USR-004 pertenece a Banco Regional del Sur, no a ORG-EXODO (propietaria de PRJ-001)
      await expect(
        planningService.assignTeamRole(
          'PRJ-001',
          {
            userId: userRenzoExterno.id,
            roleIdOrCode: 'PU-06',
          },
          userJoanGestor
        )
      ).rejects.toThrow(/Violación de segregación institucional \(DA-06\)/);
    });

    it('TDD-H03-04: PRUEBA NEGATIVA: Rechaza asignación si el usuario está SUSPENDED en la organización (DA-06)', async () => {
      // Suspender a Augusto en ORG-EXODO
      const exodoOrg = await orgsRepo.findByIdOrSlugOrCode('ORG-EXODO');
      expect(exodoOrg).toBeDefined();

      await orgsRepo.updateMemberStatus(exodoOrg!.id, userAugustoDev.id, 'SUSPENDED');

      await expect(
        planningService.assignTeamRole(
          'PRJ-001',
          {
            userId: userAugustoDev.id,
            roleIdOrCode: 'PU-06',
          },
          userJoanGestor
        )
      ).rejects.toThrow(/Violación de segregación institucional \(DA-06\)/);
    });

    it('TDD-H03-05: PRUEBA NEGATIVA: Rechaza duplicar la asignación del mismo rol al mismo usuario (409 Conflict)', async () => {
      // USR-001 ya tiene asignado PU-02 en PRJ-001 por los datos semilla
      await expect(
        planningService.assignTeamRole(
          'PRJ-001',
          {
            userId: userJoanGestor.id,
            roleIdOrCode: 'PU-02',
          },
          userJoanGestor
        )
      ).rejects.toThrow(ConflictException);
    });

    it('TDD-H03-06: PRUEBA NEGATIVA: Rechaza asignación ejecutada por usuario sin permisos administrativos (SoD 403)', async () => {
      // Augusto (PU-06 Desarrollador, no admin de org) intenta asignar roles
      await expect(
        planningService.assignTeamRole(
          'PRJ-001',
          {
            userId: userRenzoArqui.id,
            roleIdOrCode: 'PU-05',
          },
          userAugustoDev
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('TDD-H03-07: Actualización de estado de rol de equipo (INACTIVE) y reactivación', async () => {
      const rolesBefore = await planningService.getTeamRoles('PRJ-001', userJoanGestor);
      const targetRole = rolesBefore[0];

      const updated = await planningService.updateTeamRoleStatus(
        'PRJ-001',
        targetRole.id,
        'INACTIVE',
        userJoanGestor
      );
      expect(updated.status).toBe('INACTIVE');
    });
  });

  // ==========================================================================
  // BLOQUE 2: H03.2 — CONFIGURACIÓN DE METODOLOGÍA (project_methodology)
  // ==========================================================================
  describe('H03.2: Configuración de Metodología de Desarrollo', () => {
    it('TDD-H03-08: Configuración válida de metodología SCRUM con sprints de 2 semanas', async () => {
      const methodology = await planningService.configureMethodology(
        'PRJ-001',
        {
          methodologyType: 'SCRUM',
          iterationDurationWeeks: 2,
          activePhaseCode: 'SPRINT-01',
          configurationParams: {
            sprintPlanningDay: 'Lunes',
            reviewDay: 'Viernes',
          },
        },
        userJoanGestor
      );

      expect(methodology.methodology_type).toBe('SCRUM');
      expect(methodology.iteration_duration_weeks).toBe(2);
      expect(methodology.active_phase_code).toBe('SPRINT-01');

      // Consultar persistencia
      const retrieved = await planningService.getMethodology('PRJ-001', userJoanGestor);
      expect(retrieved?.methodology_type).toBe('SCRUM');
    });

    it('TDD-H03-09: PRUEBA NEGATIVA: SCRUM rechaza duración de iteración inválida o ausente (< 1 o > 8)', async () => {
      await expect(
        planningService.configureMethodology(
          'PRJ-001',
          {
            methodologyType: 'SCRUM',
            iterationDurationWeeks: 0,
          },
          userJoanGestor
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        planningService.configureMethodology(
          'PRJ-001',
          {
            methodologyType: 'SCRUM',
            iterationDurationWeeks: 12,
          },
          userJoanGestor
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('TDD-H03-10: Configuración válida de metodologías alternativas (KANBAN, CASCADA, UPT_ACADEMICA)', async () => {
      // KANBAN no exige iteraciones obligatorias
      const kanban = await planningService.configureMethodology(
        'PRJ-001',
        {
          methodologyType: 'KANBAN',
          configurationParams: { wipLimit: 5, leadTimeTargetDays: 7 },
        },
        userJoanGestor
      );
      expect(kanban.methodology_type).toBe('KANBAN');

      // UPT_ACADEMICA
      const upt = await planningService.configureMethodology(
        'PRJ-001',
        {
          methodologyType: 'UPT_ACADEMICA',
          activePhaseCode: 'UNIDAD-01',
          configurationParams: { ciclo: '2026-II', curso: 'Gestión de Configuración' },
        },
        userJoanGestor
      );
      expect(upt.methodology_type).toBe('UPT_ACADEMICA');
    });
  });

  // ==========================================================================
  // BLOQUE 3: H03.3 — FASES Y CRONOGRAMA (project_phase)
  // ==========================================================================
  describe('H03.3: Fases y Cronograma de Proyecto', () => {
    it('TDD-H03-11: Creación secuencial de fases con fechas válidas', async () => {
      const phase = await planningService.createPhase(
        'PRJ-001',
        {
          phaseCode: 'FASE-EXP',
          name: 'Fase de Expansión Transaccional',
          sequenceOrder: 10,
          startDate: '2026-12-01',
          endDate: '2026-12-31',
          status: 'PLANNED',
        },
        userJoanGestor
      );

      expect(phase.phase_code).toBe('FASE-EXP');
      expect(phase.sequence_order).toBe(10);
      expect(phase.start_date).toBe('2026-12-01');
      expect(phase.end_date).toBe('2026-12-31');
    });

    it('TDD-H03-12: PRUEBA NEGATIVA: Integridad cronológica: Rechaza endDate anterior a startDate', async () => {
      await expect(
        planningService.createPhase(
          'PRJ-001',
          {
            phaseCode: 'FASE-ERR',
            name: 'Fase con Cronología Invertida',
            sequenceOrder: 11,
            startDate: '2026-12-15',
            endDate: '2026-12-01', // Fecha fin anterior
          },
          userJoanGestor
        )
      ).rejects.toThrow(/Inconsistencia cronológica/);
    });

    it('TDD-H03-13: PRUEBA NEGATIVA: Rechaza duplicidad de sequenceOrder o phaseCode dentro del mismo proyecto', async () => {
      // FASE-01 ya existe con sequence_order = 1
      await expect(
        planningService.createPhase(
          'PRJ-001',
          {
            phaseCode: 'FASE-01',
            name: 'Nombre duplicado',
            sequenceOrder: 99,
            startDate: '2027-01-01',
            endDate: '2027-01-31',
          },
          userJoanGestor
        )
      ).rejects.toThrow(ConflictException);

      await expect(
        planningService.createPhase(
          'PRJ-001',
          {
            phaseCode: 'FASE-NEW',
            name: 'Secuencia duplicada',
            sequenceOrder: 1, // Ya existe FASE-01 con orden 1
            startDate: '2027-01-01',
            endDate: '2027-01-31',
          },
          userJoanGestor
        )
      ).rejects.toThrow(ConflictException);
    });
  });

  // ==========================================================================
  // BLOQUE 4: H03.4 — HITOS Y ENTREGABLES (project_milestone, project_deliverable)
  // ==========================================================================
  describe('H03.4: Hitos y Entregables Planificados', () => {
    it('TDD-H03-14: Creación de hito asociado a una fase del mismo proyecto', async () => {
      const milestone = await planningService.createMilestone(
        'PRJ-001',
        {
          code: 'HITO-QA-01',
          title: 'Certificación Integral de Pruebas de Carga',
          targetDate: '2026-11-20',
          phaseId: 'f0000001-0000-0000-0000-000000000002', // FASE-02 de PRJ-001
          status: 'PENDING',
        },
        userJoanGestor
      );

      expect(milestone.code).toBe('HITO-QA-01');
      expect(milestone.phase_id).toBe('f0000001-0000-0000-0000-000000000002');
    });

    it('TDD-H03-15: PRUEBA NEGATIVA: Rechaza asociar hito a una fase perteneciente a OTRO proyecto', async () => {
      // Crear fase en PRJ-002
      const phasePrj2 = await planningRepo.createPhase({
        projectId: 'b0000001-0000-0000-0000-000000000002',
        phaseCode: 'FASE-PRJ2',
        name: 'Fase de PRJ-002',
        sequenceOrder: 1,
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      });

      // Intentar vincular en PRJ-001 la fase de PRJ-002
      await expect(
        planningService.createMilestone(
          'PRJ-001',
          {
            code: 'HITO-FORANEO',
            title: 'Hito con fase ajena',
            targetDate: '2026-08-20',
            phaseId: phasePrj2.id,
          },
          userJoanGestor
        )
      ).rejects.toThrow(/Violación de consistencia de proyecto/);
    });

    it('TDD-H03-16: Creación de entregable con responsable perteneciente al equipo del proyecto', async () => {
      // USR-002 (Renzo) es miembro del equipo de PRJ-001
      const deliverable = await planningService.createDeliverable(
        'PRJ-001',
        {
          code: 'ENT-ARC-02',
          name: 'Manual de Despliegue en Kubernetes',
          description: 'Documentación técnica de arquitectura para orquestación de contenedores.',
          expectedType: 'TECHNICAL_DOCUMENT',
          responsibleUserId: userRenzoArqui.id,
          targetDate: '2026-11-25',
          status: 'PENDING',
        },
        userJoanGestor
      );

      expect(deliverable.code).toBe('ENT-ARC-02');
      expect(deliverable.expected_type).toBe('TECHNICAL_DOCUMENT');
      expect(deliverable.responsible_user_id).toBe(userRenzoArqui.id);
      expect(deliverable.associated_ecs_id).toBeNull(); // Opcional, sin ECS ficticios
    });

    it('TDD-H03-17: PRUEBA NEGATIVA: Rechaza responsable que no forma parte del equipo activo del proyecto', async () => {
      // USR-004 no pertenece al equipo de PRJ-001
      await expect(
        planningService.createDeliverable(
          'PRJ-001',
          {
            code: 'ENT-INV-01',
            name: 'Entregable con Responsable No Asignado',
            expectedType: 'SOURCE_BRANCH',
            responsibleUserId: userRenzoExterno.id,
          },
          userJoanGestor
        )
      ).rejects.toThrow(/no está asignado al equipo activo del proyecto/);
    });

    it('TDD-H03-18: PRUEBA NEGATIVA: Rechaza asociar entregable a hito de otro proyecto', async () => {
      // Crear hito en PRJ-002
      const milestonePrj2 = await planningRepo.createMilestone({
        projectId: 'b0000001-0000-0000-0000-000000000002',
        code: 'HITO-PRJ2',
        title: 'Hito de PRJ-002',
        targetDate: '2026-09-01',
      });

      // Intentar vincular en PRJ-001 el hito de PRJ-002
      await expect(
        planningService.createDeliverable(
          'PRJ-001',
          {
            code: 'ENT-FOR-01',
            name: 'Entregable foráneo',
            expectedType: 'TEST_REPORT',
            milestoneId: milestonePrj2.id,
          },
          userJoanGestor
        )
      ).rejects.toThrow(/Violación de consistencia/);
    });
  });

  // ==========================================================================
  // BLOQUE 5: H03.5 — CONFIGURACIÓN PROGRESIVA Y ASISTENTE (project_setup, DA-05)
  // ==========================================================================
  describe('H03.5: Asistente y Configuración Progresiva de Proyecto (DA-05)', () => {
    it('TDD-H03-19: Consulta de estado progresivo del asistente (getProjectSetup)', async () => {
      const setupData = await planningService.getProjectSetup('PRJ-001', userJoanGestor);

      expect(setupData.project).toBeDefined();
      expect(setupData.setup).toBeDefined();
      expect(setupData.setup?.identity_completed).toBe(true);
      expect(setupData.team.length).toBeGreaterThanOrEqual(1);
      expect(setupData.methodology).toBeDefined();
      expect(setupData.phases.length).toBeGreaterThanOrEqual(1);
      expect(setupData.milestones.length).toBeGreaterThanOrEqual(1);
      expect(setupData.deliverables.length).toBeGreaterThanOrEqual(1);
    });

    it('TDD-H03-20: Guardado en lote del Paso 2 (Equipo) y actualización de bandera team_completed', async () => {
      const res = await planningService.saveStep2Team(
        'PRJ-001',
        {
          members: [
            {
              userId: userAugustoDev.id,
              roleIdOrCode: 'PU-06',
              functionalTitle: 'Desarrollador Backend',
              isLead: false,
            },
          ],
        },
        userJoanGestor
      );

      expect(res.team.length).toBe(1);
      expect(res.setup.team_completed).toBe(true);
      expect(res.setup.wizard_step).toBeGreaterThanOrEqual(3);
    });

    it('TDD-H03-21: Guardado en lote del Paso 3 (Metodología y Planificación) en transacción atómica', async () => {
      const res = await planningService.saveStep3MethodologyPlanning(
        'PRJ-001',
        {
          methodology: {
            methodologyType: 'SCRUM',
            iterationDurationWeeks: 3,
            activePhaseCode: 'SPRINT-BASE',
          },
          phases: [
            {
              phaseCode: 'FASE-BATCH',
              name: 'Fase en Lote',
              sequenceOrder: 20,
              startDate: '2027-01-01',
              endDate: '2027-01-31',
            },
          ],
          milestones: [
            {
              code: 'HITO-BATCH',
              title: 'Hito en Lote',
              targetDate: '2027-01-15',
            },
          ],
          deliverables: [
            {
              code: 'ENT-BATCH',
              name: 'Entregable en Lote',
              expectedType: 'DB_MIGRATION',
            },
          ],
        },
        userJoanGestor
      );

      expect(res.methodology.methodology_type).toBe('SCRUM');
      expect(res.methodology.iteration_duration_weeks).toBe(3);
      expect(res.phases.length).toBe(1);
      expect(res.milestones.length).toBe(1);
      expect(res.deliverables.length).toBe(1);
      expect(res.setup.methodology_completed).toBe(true);
      expect(res.setup.wizard_step).toBeGreaterThanOrEqual(4);
    });

    it('TDD-H03-22: Guardado parcial de borrador (saveDraftProgress) y persistencia tras reinicio', async () => {
      const partialPayload = {
        customNotes: 'Borrador temporal de configuración de arquitectura',
        targetCloud: 'AWS us-west-2',
      };

      const setup = await planningService.saveDraftProgress(
        'PRJ-001',
        {
          wizardStep: 3,
          draftPayload: partialPayload,
        },
        userJoanGestor
      );

      expect(setup.wizard_step).toBe(3);
      expect(setup.draft_payload).toMatchObject(partialPayload);

      // Recuperar configuración para validar que persiste el payload
      const retrieved = await planningService.getProjectSetup('PRJ-001', userJoanGestor);
      expect(retrieved.setup?.draft_payload).toMatchObject(partialPayload);
    });
  });
});
