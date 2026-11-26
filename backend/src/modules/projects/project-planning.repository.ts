import { Injectable, Inject } from '@nestjs/common';
import pg from 'pg';
import { DatabaseService } from '../../database/database.service.js';

export interface ProjectTeamRoleEntity {
  id: string;
  project_id: string;
  user_id: string;
  role_id: number;
  role_code?: string;
  role_name?: string;
  functional_title?: string;
  is_lead: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  assigned_at: string;
  assigned_by?: string | null;
  updated_at: string;
  user_code?: string;
  user_full_name?: string;
  user_email?: string;
}

export type MethodologyType = 'SCRUM' | 'KANBAN' | 'CASCADA' | 'HIBRIDA' | 'UPT_ACADEMICA';

export interface ProjectMethodologyEntity {
  id: string;
  project_id: string;
  methodology_type: MethodologyType;
  iteration_duration_weeks?: number | null;
  active_phase_code?: string | null;
  configuration_params: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhaseEntity {
  id: string;
  project_id: string;
  phase_code: string;
  name: string;
  sequence_order: number;
  start_date: string;
  end_date: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestoneEntity {
  id: string;
  project_id: string;
  phase_id?: string | null;
  code: string;
  title: string;
  target_date: string;
  completion_date?: string | null;
  status: 'PENDING' | 'ACHIEVED' | 'DELAYED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export type DeliverableExpectedType =
  | 'SOFTWARE_RELEASE'
  | 'TECHNICAL_DOCUMENT'
  | 'SOURCE_BRANCH'
  | 'TEST_REPORT'
  | 'DB_MIGRATION';

export interface ProjectDeliverableEntity {
  id: string;
  project_id: string;
  phase_id?: string | null;
  milestone_id?: string | null;
  code: string;
  name: string;
  description?: string | null;
  expected_type: DeliverableExpectedType;
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  responsible_user_id?: string | null;
  target_date?: string | null;
  associated_ecs_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSetupEntity {
  id: string;
  project_id: string;
  wizard_step: number;
  wizard_completed: boolean;
  identity_completed: boolean;
  team_completed: boolean;
  methodology_completed: boolean;
  github_completed: boolean;
  validation_completed: boolean;
  draft_payload: Record<string, any>;
  last_saved_by?: string | null;
  created_at: string;
  updated_at: string;
}

export const CANONICAL_APP_ROLES = [
  { id: 1, code: 'PU-01', name: 'Solicitante' },
  { id: 2, code: 'PU-02', name: 'Analista / Gestor de Configuración' },
  { id: 3, code: 'PU-03', name: 'Arquitecto / Especialista Técnico' },
  { id: 4, code: 'PU-04', name: 'Comité de Control de Cambios (CCB)' },
  { id: 5, code: 'PU-05', name: 'Bibliotecario / Administrador SCM' },
  { id: 6, code: 'PU-06', name: 'Desarrollador / Ingeniero de Software' },
  { id: 7, code: 'PU-07', name: 'Calidad / Equipo de Testing (QA)' },
];

@Injectable()
export class ProjectPlanningRepository {
  private mockTeamRoles: ProjectTeamRoleEntity[] = [
    {
      id: 'd0000001-0000-0000-0000-000000000001',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      user_id: 'a0000001-0000-0000-0000-000000000001',
      role_id: 2,
      role_code: 'PU-02',
      role_name: 'Analista / Gestor de Configuración',
      functional_title: 'Gestor de Configuración Principal',
      is_lead: true,
      status: 'ACTIVE',
      assigned_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-01T08:00:00Z',
      user_code: 'USR-001',
      user_full_name: 'Joan Cristian Medina Quispe',
      user_email: 'jmedina@exodo.pe',
    },
    {
      id: 'd0000001-0000-0000-0000-000000000002',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      user_id: 'a0000001-0000-0000-0000-000000000002',
      role_id: 3,
      role_code: 'PU-03',
      role_name: 'Arquitecto / Especialista Técnico',
      functional_title: 'Arquitecto de Soluciones',
      is_lead: true,
      status: 'ACTIVE',
      assigned_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-01T08:00:00Z',
      user_code: 'USR-002',
      user_full_name: 'Renzo Antonio Antayhua Mamani',
      user_email: 'rantayhua@exodo.pe',
    },
  ];

  private mockMethodologies: ProjectMethodologyEntity[] = [
    {
      id: 'e0000001-0000-0000-0000-000000000001',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      methodology_type: 'SCRUM',
      iteration_duration_weeks: 2,
      active_phase_code: 'FASE-01',
      configuration_params: { sprintDurationDays: 14, dailyStandupTime: '09:00' },
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-01T08:00:00Z',
    },
  ];

  private mockPhases: ProjectPhaseEntity[] = [
    {
      id: 'f0000001-0000-0000-0000-000000000001',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      phase_code: 'FASE-01',
      name: 'Diseño y Arquitectura Base',
      sequence_order: 1,
      start_date: '2026-08-01',
      end_date: '2026-08-31',
      status: 'COMPLETED',
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-31T18:00:00Z',
    },
    {
      id: 'f0000001-0000-0000-0000-000000000002',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      phase_code: 'FASE-02',
      name: 'Construcción e Integración',
      sequence_order: 2,
      start_date: '2026-09-01',
      end_date: '2026-11-30',
      status: 'IN_PROGRESS',
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-09-01T08:00:00Z',
    },
  ];

  private mockMilestones: ProjectMilestoneEntity[] = [
    {
      id: 'g0000001-0000-0000-0000-000000000001',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      phase_id: 'f0000001-0000-0000-0000-000000000001',
      code: 'HITO-01',
      title: 'Aprobación de Arquitectura de Seguridad SBS',
      target_date: '2026-08-31',
      completion_date: '2026-08-30',
      status: 'ACHIEVED',
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-30T17:00:00Z',
    },
  ];

  private mockDeliverables: ProjectDeliverableEntity[] = [
    {
      id: 'h0000001-0000-0000-0000-000000000001',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      phase_id: 'f0000001-0000-0000-0000-000000000001',
      milestone_id: 'g0000001-0000-0000-0000-000000000001',
      code: 'ENT-01',
      name: 'Documento de Arquitectura de Software (SAD)',
      description: 'Especificación detallada de topología y microservicios.',
      expected_type: 'TECHNICAL_DOCUMENT',
      status: 'ACCEPTED',
      responsible_user_id: 'a0000001-0000-0000-0000-000000000002',
      target_date: '2026-08-25',
      associated_ecs_id: null,
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-25T14:00:00Z',
    },
  ];

  private mockSetups: ProjectSetupEntity[] = [
    {
      id: 'i0000001-0000-0000-0000-000000000001',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      wizard_step: 4,
      wizard_completed: false,
      identity_completed: true,
      team_completed: true,
      methodology_completed: true,
      github_completed: false,
      validation_completed: false,
      draft_payload: {},
      last_saved_by: 'a0000001-0000-0000-0000-000000000001',
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-08-01T08:00:00Z',
    },
  ];

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  // ==========================================================================
  // ROLES DE SEGURIDAD
  // ==========================================================================
  async resolveRole(roleIdOrCode: number | string): Promise<{ id: number; code: string; name: string } | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      let query = 'SELECT id, code, name FROM traceflow.app_role WHERE ';
      const params: any[] = [];
      if (typeof roleIdOrCode === 'number' || !isNaN(Number(roleIdOrCode))) {
        query += 'id = $1';
        params.push(Number(roleIdOrCode));
      } else {
        query += 'UPPER(code) = UPPER($1)';
        params.push(roleIdOrCode);
      }
      const res = await this.db.query<{ id: number; code: string; name: string }>(query, params);
      return res.rows[0] || null;
    } else {
      if (typeof roleIdOrCode === 'number' || !isNaN(Number(roleIdOrCode))) {
        return CANONICAL_APP_ROLES.find((r) => r.id === Number(roleIdOrCode)) || null;
      }
      return CANONICAL_APP_ROLES.find((r) => r.code.toUpperCase() === String(roleIdOrCode).toUpperCase()) || null;
    }
  }

  // ==========================================================================
  // EQUIPO Y ROLES DE PROYECTO (project_team_role)
  // ==========================================================================
  async findTeamRolesByProjectId(projectId: string): Promise<ProjectTeamRoleEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT ptr.*,
               ar.code as role_code, ar.name as role_name,
               u.code as user_code, u.full_name as user_full_name, u.email as user_email
        FROM traceflow.project_team_role ptr
        JOIN traceflow.app_role ar ON ar.id = ptr.role_id
        JOIN traceflow.app_user u ON u.id = ptr.user_id
        WHERE ptr.project_id = $1
        ORDER BY ptr.assigned_at ASC;
      `;
      const res = await this.db.query<ProjectTeamRoleEntity>(sql, [projectId]);
      return res.rows;
    }
    return this.mockTeamRoles.filter((tr) => tr.project_id === projectId);
  }

  async findTeamRole(projectId: string, userId: string, roleId: number): Promise<ProjectTeamRoleEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT ptr.*,
               ar.code as role_code, ar.name as role_name,
               u.code as user_code, u.full_name as user_full_name, u.email as user_email
        FROM traceflow.project_team_role ptr
        JOIN traceflow.app_role ar ON ar.id = ptr.role_id
        JOIN traceflow.app_user u ON u.id = ptr.user_id
        WHERE ptr.project_id = $1 AND ptr.user_id = $2 AND ptr.role_id = $3;
      `;
      const res = await this.db.query<ProjectTeamRoleEntity>(sql, [projectId, userId, roleId]);
      return res.rows[0] || null;
    }
    return this.mockTeamRoles.find(
      (tr) => tr.project_id === projectId && tr.user_id === userId && tr.role_id === roleId
    ) || null;
  }

  async addTeamRole(
    data: {
      projectId: string;
      userId: string;
      roleId: number;
      functionalTitle?: string;
      isLead?: boolean;
      assignedBy?: string;
    },
    client?: pg.PoolClient | null
  ): Promise<ProjectTeamRoleEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.project_team_role (
          project_id, user_id, role_id, functional_title, is_lead, assigned_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const params = [
        data.projectId,
        data.userId,
        data.roleId,
        data.functionalTitle || null,
        data.isLead ?? false,
        data.assignedBy || null,
      ];
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<ProjectTeamRoleEntity>(sql, params);
      return res.rows[0];
    }

    const roleInfo = CANONICAL_APP_ROLES.find((r) => r.id === data.roleId);
    const newRole: ProjectTeamRoleEntity = {
      id: `d0000001-${Date.now().toString(16).padStart(12, '0')}`,
      project_id: data.projectId,
      user_id: data.userId,
      role_id: data.roleId,
      role_code: roleInfo?.code,
      role_name: roleInfo?.name,
      functional_title: data.functionalTitle,
      is_lead: data.isLead ?? false,
      status: 'ACTIVE',
      assigned_at: new Date().toISOString(),
      assigned_by: data.assignedBy,
      updated_at: new Date().toISOString(),
    };
    this.mockTeamRoles.push(newRole);
    return newRole;
  }

  async updateTeamRole(
    id: string,
    updates: Partial<Pick<ProjectTeamRoleEntity, 'status' | 'functional_title' | 'is_lead'>>,
    client?: pg.PoolClient | null
  ): Promise<ProjectTeamRoleEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sets: string[] = ['updated_at = NOW()'];
      const params: any[] = [id];
      let pIdx = 2;
      if (updates.status !== undefined) {
        sets.push(`status = $${pIdx++}`);
        params.push(updates.status);
      }
      if (updates.functional_title !== undefined) {
        sets.push(`functional_title = $${pIdx++}`);
        params.push(updates.functional_title);
      }
      if (updates.is_lead !== undefined) {
        sets.push(`is_lead = $${pIdx++}`);
        params.push(updates.is_lead);
      }
      const sql = `UPDATE traceflow.project_team_role SET ${sets.join(', ')} WHERE id = $1 RETURNING *;`;
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<ProjectTeamRoleEntity>(sql, params);
      return res.rows[0] || null;
    }

    const item = this.mockTeamRoles.find((tr) => tr.id === id);
    if (!item) return null;
    if (updates.status !== undefined) item.status = updates.status;
    if (updates.functional_title !== undefined) item.functional_title = updates.functional_title;
    if (updates.is_lead !== undefined) item.is_lead = updates.is_lead;
    item.updated_at = new Date().toISOString();
    return item;
  }

  // ==========================================================================
  // METODOLOGÍA (project_methodology)
  // ==========================================================================
  async findMethodologyByProjectId(projectId: string): Promise<ProjectMethodologyEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_methodology WHERE project_id = $1;';
      const res = await this.db.query<ProjectMethodologyEntity>(sql, [projectId]);
      return res.rows[0] || null;
    }
    return this.mockMethodologies.find((m) => m.project_id === projectId) || null;
  }

  async saveMethodology(
    data: {
      projectId: string;
      methodologyType: MethodologyType;
      iterationDurationWeeks?: number | null;
      activePhaseCode?: string | null;
      configurationParams?: Record<string, any>;
    },
    client?: pg.PoolClient | null
  ): Promise<ProjectMethodologyEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.project_methodology (
          project_id, methodology_type, iteration_duration_weeks, active_phase_code, configuration_params
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (project_id) DO UPDATE SET
          methodology_type = EXCLUDED.methodology_type,
          iteration_duration_weeks = EXCLUDED.iteration_duration_weeks,
          active_phase_code = EXCLUDED.active_phase_code,
          configuration_params = EXCLUDED.configuration_params,
          updated_at = NOW()
        RETURNING *;
      `;
      const params = [
        data.projectId,
        data.methodologyType,
        data.iterationDurationWeeks ?? null,
        data.activePhaseCode || null,
        JSON.stringify(data.configurationParams || {}),
      ];
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<ProjectMethodologyEntity>(sql, params);
      return res.rows[0];
    }

    let existing = this.mockMethodologies.find((m) => m.project_id === data.projectId);
    if (existing) {
      existing.methodology_type = data.methodologyType;
      existing.iteration_duration_weeks = data.iterationDurationWeeks;
      existing.active_phase_code = data.activePhaseCode;
      existing.configuration_params = data.configurationParams || {};
      existing.updated_at = new Date().toISOString();
      return existing;
    }

    const created: ProjectMethodologyEntity = {
      id: `e0000001-${Date.now().toString(16).padStart(12, '0')}`,
      project_id: data.projectId,
      methodology_type: data.methodologyType,
      iteration_duration_weeks: data.iterationDurationWeeks,
      active_phase_code: data.activePhaseCode,
      configuration_params: data.configurationParams || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.mockMethodologies.push(created);
    return created;
  }

  // ==========================================================================
  // FASES (project_phase)
  // ==========================================================================
  async findPhasesByProjectId(projectId: string): Promise<ProjectPhaseEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_phase WHERE project_id = $1 ORDER BY sequence_order ASC;';
      const res = await this.db.query<ProjectPhaseEntity>(sql, [projectId]);
      return res.rows;
    }
    return this.mockPhases.filter((p) => p.project_id === projectId).sort((a, b) => a.sequence_order - b.sequence_order);
  }

  async findPhaseById(id: string): Promise<ProjectPhaseEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_phase WHERE id = $1;';
      const res = await this.db.query<ProjectPhaseEntity>(sql, [id]);
      return res.rows[0] || null;
    }
    return this.mockPhases.find((p) => p.id === id) || null;
  }

  async findPhaseByCode(projectId: string, phaseCode: string): Promise<ProjectPhaseEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_phase WHERE project_id = $1 AND UPPER(phase_code) = UPPER($2);';
      const res = await this.db.query<ProjectPhaseEntity>(sql, [projectId, phaseCode]);
      return res.rows[0] || null;
    }
    return this.mockPhases.find((p) => p.project_id === projectId && p.phase_code.toUpperCase() === phaseCode.toUpperCase()) || null;
  }

  async createPhase(
    data: {
      projectId: string;
      phaseCode: string;
      name: string;
      sequenceOrder: number;
      startDate: string;
      endDate: string;
      status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
    },
    client?: pg.PoolClient | null
  ): Promise<ProjectPhaseEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.project_phase (
          project_id, phase_code, name, sequence_order, start_date, end_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const params = [
        data.projectId,
        data.phaseCode,
        data.name,
        data.sequenceOrder,
        data.startDate,
        data.endDate,
        data.status || 'PLANNED',
      ];
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<ProjectPhaseEntity>(sql, params);
      return res.rows[0];
    }

    const created: ProjectPhaseEntity = {
      id: `f0000001-${Date.now().toString(16).padStart(12, '0')}`,
      project_id: data.projectId,
      phase_code: data.phaseCode,
      name: data.name,
      sequence_order: data.sequenceOrder,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status || 'PLANNED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.mockPhases.push(created);
    return created;
  }

  // ==========================================================================
  // HITOS (project_milestone)
  // ==========================================================================
  async findMilestonesByProjectId(projectId: string): Promise<ProjectMilestoneEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_milestone WHERE project_id = $1 ORDER BY target_date ASC;';
      const res = await this.db.query<ProjectMilestoneEntity>(sql, [projectId]);
      return res.rows;
    }
    return this.mockMilestones.filter((m) => m.project_id === projectId).sort((a, b) => a.target_date.localeCompare(b.target_date));
  }

  async findMilestoneById(id: string): Promise<ProjectMilestoneEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_milestone WHERE id = $1;';
      const res = await this.db.query<ProjectMilestoneEntity>(sql, [id]);
      return res.rows[0] || null;
    }
    return this.mockMilestones.find((m) => m.id === id) || null;
  }

  async findMilestoneByCode(projectId: string, code: string): Promise<ProjectMilestoneEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_milestone WHERE project_id = $1 AND UPPER(code) = UPPER($2);';
      const res = await this.db.query<ProjectMilestoneEntity>(sql, [projectId, code]);
      return res.rows[0] || null;
    }
    return this.mockMilestones.find((m) => m.project_id === projectId && m.code.toUpperCase() === code.toUpperCase()) || null;
  }

  async createMilestone(
    data: {
      projectId: string;
      phaseId?: string | null;
      code: string;
      title: string;
      targetDate: string;
      completionDate?: string | null;
      status?: 'PENDING' | 'ACHIEVED' | 'DELAYED' | 'CANCELLED';
    },
    client?: pg.PoolClient | null
  ): Promise<ProjectMilestoneEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.project_milestone (
          project_id, phase_id, code, title, target_date, completion_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const params = [
        data.projectId,
        data.phaseId || null,
        data.code,
        data.title,
        data.targetDate,
        data.completionDate || null,
        data.status || 'PENDING',
      ];
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<ProjectMilestoneEntity>(sql, params);
      return res.rows[0];
    }

    const created: ProjectMilestoneEntity = {
      id: `g0000001-${Date.now().toString(16).padStart(12, '0')}`,
      project_id: data.projectId,
      phase_id: data.phaseId,
      code: data.code,
      title: data.title,
      target_date: data.targetDate,
      completion_date: data.completionDate,
      status: data.status || 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.mockMilestones.push(created);
    return created;
  }

  // ==========================================================================
  // ENTREGABLES (project_deliverable)
  // ==========================================================================
  async findDeliverablesByProjectId(projectId: string): Promise<ProjectDeliverableEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_deliverable WHERE project_id = $1 ORDER BY code ASC;';
      const res = await this.db.query<ProjectDeliverableEntity>(sql, [projectId]);
      return res.rows;
    }
    return this.mockDeliverables.filter((d) => d.project_id === projectId);
  }

  async findDeliverableById(id: string): Promise<ProjectDeliverableEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_deliverable WHERE id = $1;';
      const res = await this.db.query<ProjectDeliverableEntity>(sql, [id]);
      return res.rows[0] || null;
    }
    return this.mockDeliverables.find((d) => d.id === id) || null;
  }

  async findDeliverableByCode(projectId: string, code: string): Promise<ProjectDeliverableEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_deliverable WHERE project_id = $1 AND UPPER(code) = UPPER($2);';
      const res = await this.db.query<ProjectDeliverableEntity>(sql, [projectId, code]);
      return res.rows[0] || null;
    }
    return this.mockDeliverables.find((d) => d.project_id === projectId && d.code.toUpperCase() === code.toUpperCase()) || null;
  }

  async createDeliverable(
    data: {
      projectId: string;
      phaseId?: string | null;
      milestoneId?: string | null;
      code: string;
      name: string;
      description?: string | null;
      expectedType: DeliverableExpectedType;
      status?: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
      responsibleUserId?: string | null;
      targetDate?: string | null;
      associatedEcsId?: string | null;
    },
    client?: pg.PoolClient | null
  ): Promise<ProjectDeliverableEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.project_deliverable (
          project_id, phase_id, milestone_id, code, name, description,
          expected_type, status, responsible_user_id, target_date, associated_ecs_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;
      const params = [
        data.projectId,
        data.phaseId || null,
        data.milestoneId || null,
        data.code,
        data.name,
        data.description || null,
        data.expectedType,
        data.status || 'PENDING',
        data.responsibleUserId || null,
        data.targetDate || null,
        data.associatedEcsId || null,
      ];
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<ProjectDeliverableEntity>(sql, params);
      return res.rows[0];
    }

    const created: ProjectDeliverableEntity = {
      id: `h0000001-${Date.now().toString(16).padStart(12, '0')}`,
      project_id: data.projectId,
      phase_id: data.phaseId,
      milestone_id: data.milestoneId,
      code: data.code,
      name: data.name,
      description: data.description,
      expected_type: data.expectedType,
      status: data.status || 'PENDING',
      responsible_user_id: data.responsibleUserId,
      target_date: data.targetDate,
      associated_ecs_id: data.associatedEcsId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.mockDeliverables.push(created);
    return created;
  }

  // ==========================================================================
  // CONFIGURACIÓN PROGRESIVA DEL ASISTENTE (project_setup)
  // ==========================================================================
  async findSetupByProjectId(projectId: string): Promise<ProjectSetupEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.project_setup WHERE project_id = $1;';
      const res = await this.db.query<ProjectSetupEntity>(sql, [projectId]);
      return res.rows[0] || null;
    }
    return this.mockSetups.find((s) => s.project_id === projectId) || null;
  }

  async saveSetup(
    projectId: string,
    data: Partial<Omit<ProjectSetupEntity, 'id' | 'project_id' | 'created_at' | 'updated_at'>>,
    client?: pg.PoolClient | null
  ): Promise<ProjectSetupEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.project_setup (
          project_id, wizard_step, wizard_completed, identity_completed, team_completed,
          methodology_completed, github_completed, validation_completed, draft_payload, last_saved_by
        ) VALUES (
          $1,
          COALESCE($2, 1),
          COALESCE($3, false),
          COALESCE($4, true),
          COALESCE($5, false),
          COALESCE($6, false),
          COALESCE($7, false),
          COALESCE($8, false),
          COALESCE($9, '{}'::jsonb),
          $10
        )
        ON CONFLICT (project_id) DO UPDATE SET
          wizard_step = COALESCE(EXCLUDED.wizard_step, traceflow.project_setup.wizard_step),
          wizard_completed = COALESCE(EXCLUDED.wizard_completed, traceflow.project_setup.wizard_completed),
          identity_completed = COALESCE(EXCLUDED.identity_completed, traceflow.project_setup.identity_completed),
          team_completed = COALESCE(EXCLUDED.team_completed, traceflow.project_setup.team_completed),
          methodology_completed = COALESCE(EXCLUDED.methodology_completed, traceflow.project_setup.methodology_completed),
          github_completed = COALESCE(EXCLUDED.github_completed, traceflow.project_setup.github_completed),
          validation_completed = COALESCE(EXCLUDED.validation_completed, traceflow.project_setup.validation_completed),
          draft_payload = COALESCE(EXCLUDED.draft_payload, traceflow.project_setup.draft_payload),
          last_saved_by = COALESCE(EXCLUDED.last_saved_by, traceflow.project_setup.last_saved_by),
          updated_at = NOW()
        RETURNING *;
      `;
      const params = [
        projectId,
        data.wizard_step ?? null,
        data.wizard_completed ?? null,
        data.identity_completed ?? null,
        data.team_completed ?? null,
        data.methodology_completed ?? null,
        data.github_completed ?? null,
        data.validation_completed ?? null,
        data.draft_payload ? JSON.stringify(data.draft_payload) : null,
        data.last_saved_by || null,
      ];
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<ProjectSetupEntity>(sql, params);
      return res.rows[0];
    }

    let existing = this.mockSetups.find((s) => s.project_id === projectId);
    if (existing) {
      if (data.wizard_step !== undefined) existing.wizard_step = data.wizard_step;
      if (data.wizard_completed !== undefined) existing.wizard_completed = data.wizard_completed;
      if (data.identity_completed !== undefined) existing.identity_completed = data.identity_completed;
      if (data.team_completed !== undefined) existing.team_completed = data.team_completed;
      if (data.methodology_completed !== undefined) existing.methodology_completed = data.methodology_completed;
      if (data.github_completed !== undefined) existing.github_completed = data.github_completed;
      if (data.validation_completed !== undefined) existing.validation_completed = data.validation_completed;
      if (data.draft_payload !== undefined) existing.draft_payload = { ...existing.draft_payload, ...data.draft_payload };
      if (data.last_saved_by !== undefined) existing.last_saved_by = data.last_saved_by;
      existing.updated_at = new Date().toISOString();
      return existing;
    }

    const created: ProjectSetupEntity = {
      id: `i0000001-${Date.now().toString(16).padStart(12, '0')}`,
      project_id: projectId,
      wizard_step: data.wizard_step ?? 1,
      wizard_completed: data.wizard_completed ?? false,
      identity_completed: data.identity_completed ?? true,
      team_completed: data.team_completed ?? false,
      methodology_completed: data.methodology_completed ?? false,
      github_completed: data.github_completed ?? false,
      validation_completed: data.validation_completed ?? false,
      draft_payload: data.draft_payload || {},
      last_saved_by: data.last_saved_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.mockSetups.push(created);
    return created;
  }
}
