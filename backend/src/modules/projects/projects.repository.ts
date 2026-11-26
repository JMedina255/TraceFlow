import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import type { CanonicalProjectStatus } from '../../common/types/index.js';

export interface ProjectEntity {
  id: string;
  code: string;
  project_key: string;
  name: string;
  description: string;
  client_name: string;
  status: CanonicalProjectStatus | string;
  active_baseline_version?: string | null;
  organization_id?: string | null;
  manager_id?: string | null;
  architect_id?: string | null;
  librarian_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  ecs?: any[];
}

export interface UserProjectAssignmentEntity {
  user_id: string;
  project_id: string;
  assigned_at: string;
  assigned_by?: string | null;
}

@Injectable()
export class ProjectsRepository {
  private readonly defaultProjects: ProjectEntity[] = [
    {
      id: 'b0000001-0000-0000-0000-000000000001',
      code: 'PRJ-001',
      project_key: 'EXO-CORE',
      name: 'Pasarela de Pagos Core',
      description: 'Plataforma central transaccional, enrutamiento bancario, tokenización y conciliación financiera en tiempo real.',
      client_name: 'Banco Regional del Sur',
      status: 'ACTIVO',
      active_baseline_version: 'v1.2.0',
      organization_id: 'c0000001-0000-0000-0000-000000000001',
      manager_id: 'a0000001-0000-0000-0000-000000000001',
      architect_id: 'a0000001-0000-0000-0000-000000000002',
      librarian_id: 'a0000001-0000-0000-0000-000000000003',
      created_by: 'a0000001-0000-0000-0000-000000000001',
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-10-01T15:30:00Z',
    },
    {
      id: 'b0000001-0000-0000-0000-000000000002',
      code: 'PRJ-002',
      project_key: 'EXO-PORTAL',
      name: 'Portal Autoservicio Clientes',
      description: 'Aplicación web interactiva SPA para consulta de pólizas, descarga de estados de cuenta y registro de reclamos.',
      client_name: 'Financiera CrediSur',
      status: 'ACTIVO',
      active_baseline_version: 'v2.0.1',
      organization_id: 'c0000001-0000-0000-0000-000000000001',
      manager_id: 'a0000001-0000-0000-0000-000000000001',
      architect_id: 'a0000001-0000-0000-0000-000000000002',
      librarian_id: 'a0000001-0000-0000-0000-000000000003',
      created_by: 'a0000001-0000-0000-0000-000000000001',
      created_at: '2026-08-15T09:00:00Z',
      updated_at: '2026-09-28T11:20:00Z',
    },
    {
      id: 'b0000001-0000-0000-0000-000000000003',
      code: 'PRJ-003',
      project_key: 'EXO-SUNAT',
      name: 'Módulo de Facturación Electrónica',
      description: 'Servicio de integración para emisión de comprobantes de pago electrónicos en formato XML UBL 2.1 con certificación OSE.',
      client_name: 'Corporación Minera Andina',
      status: 'ACTIVO',
      active_baseline_version: 'v1.0.0',
      organization_id: 'c0000001-0000-0000-0000-000000000001',
      manager_id: 'a0000001-0000-0000-0000-000000000001',
      architect_id: 'a0000001-0000-0000-0000-000000000002',
      librarian_id: 'a0000001-0000-0000-0000-000000000003',
      created_by: 'a0000001-0000-0000-0000-000000000001',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-10-05T14:10:00Z',
    },
  ];

  private projects: ProjectEntity[] = [...this.defaultProjects];
  private mockAssignments: UserProjectAssignmentEntity[] = [
    { user_id: 'a0000001-0000-0000-0000-000000000001', project_id: 'b0000001-0000-0000-0000-000000000001', assigned_at: '2026-08-01T08:00:00Z' },
    { user_id: 'a0000001-0000-0000-0000-000000000001', project_id: 'b0000001-0000-0000-0000-000000000002', assigned_at: '2026-08-15T09:00:00Z' },
    { user_id: 'a0000001-0000-0000-0000-000000000001', project_id: 'b0000001-0000-0000-0000-000000000003', assigned_at: '2026-09-01T10:00:00Z' },
    { user_id: 'a0000001-0000-0000-0000-000000000004', project_id: 'b0000001-0000-0000-0000-000000000001', assigned_at: '2026-08-01T08:00:00Z' },
    { user_id: 'a0000001-0000-0000-0000-000000000004', project_id: 'b0000001-0000-0000-0000-000000000002', assigned_at: '2026-08-15T09:00:00Z' },
  ];

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async findAll(): Promise<ProjectEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query<ProjectEntity>('SELECT * FROM traceflow.project ORDER BY code ASC');
      return res.rows;
    }
    return [...this.projects];
  }

  async findByIdOrCode(idOrCode: string): Promise<ProjectEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query<ProjectEntity>(
        'SELECT * FROM traceflow.project WHERE id::text = $1 OR code = $1 LIMIT 1',
        [idOrCode]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    return this.projects.find((p) => p.id === idOrCode || p.code === idOrCode) || null;
  }

  async findByCode(code: string): Promise<ProjectEntity | null> {
    const normalized = code.trim().toUpperCase();
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query<ProjectEntity>(
        'SELECT * FROM traceflow.project WHERE UPPER(code) = $1 LIMIT 1',
        [normalized]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    return this.projects.find((p) => p.code.toUpperCase() === normalized) || null;
  }

  async findByKey(projectKey: string): Promise<ProjectEntity | null> {
    const normalized = projectKey.trim().toUpperCase();
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query<ProjectEntity>(
        'SELECT * FROM traceflow.project WHERE UPPER(project_key) = $1 LIMIT 1',
        [normalized]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    return this.projects.find((p) => p.project_key.toUpperCase() === normalized) || null;
  }

  async findByOrganization(orgId: string): Promise<ProjectEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query<ProjectEntity>(
        'SELECT * FROM traceflow.project WHERE organization_id = $1 ORDER BY code ASC',
        [orgId]
      );
      return res.rows;
    }
    return this.projects.filter((p) => p.organization_id === orgId);
  }

  async create(data: Partial<ProjectEntity>, client?: any): Promise<ProjectEntity> {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const entity: ProjectEntity = {
      id,
      code: data.code!.toUpperCase(),
      project_key: data.project_key!.toUpperCase(),
      name: data.name!,
      description: data.description || '',
      client_name: data.client_name!,
      status: data.status || 'BORRADOR',
      active_baseline_version: data.active_baseline_version || null,
      organization_id: data.organization_id || null,
      manager_id: data.manager_id || null,
      architect_id: data.architect_id || null,
      librarian_id: data.librarian_id || null,
      created_by: data.created_by || null,
      created_at: now,
      updated_at: now,
    };

    if (this.db.getDatabaseMode() === 'postgres') {
      const runner = client || this.db;
      await runner.query(
        `INSERT INTO traceflow.project
          (id, code, project_key, name, description, client_name, status, active_baseline_version, organization_id, manager_id, architect_id, librarian_id, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          entity.id,
          entity.code,
          entity.project_key,
          entity.name,
          entity.description,
          entity.client_name,
          entity.status,
          entity.active_baseline_version,
          entity.organization_id,
          entity.manager_id,
          entity.architect_id,
          entity.librarian_id,
          entity.created_by,
          entity.created_at,
          entity.updated_at,
        ]
      );
      return entity;
    }

    this.projects.push(entity);
    return entity;
  }

  async assignUserToProject(userId: string, projectId: string, assignedBy?: string, client?: any): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const runner = client || this.db;
      await runner.query(
        `INSERT INTO traceflow.user_project_assignment (user_id, project_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, project_id) DO NOTHING`,
        [userId, projectId, assignedBy || null]
      );
      return;
    }

    const exists = this.mockAssignments.some(
      (a) => a.user_id === userId && a.project_id === projectId
    );
    if (!exists) {
      this.mockAssignments.push({
        user_id: userId,
        project_id: projectId,
        assigned_at: new Date().toISOString(),
        assigned_by: assignedBy || null,
      });
    }
  }

  async findUserProjectAssignments(userId: string): Promise<string[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query<{ project_id: string }>(
        'SELECT project_id FROM traceflow.user_project_assignment WHERE user_id = $1',
        [userId]
      );
      return res.rows.map((r) => r.project_id);
    }
    return this.mockAssignments
      .filter((a) => a.user_id === userId)
      .map((a) => a.project_id);
  }

  async findEcsByProjectId(projectIdOrCode: string): Promise<any[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query(
        `SELECT c.* 
         FROM traceflow.config_item c
         JOIN traceflow.project p ON c.project_id = p.id
         WHERE c.project_id::text = $1 OR p.code = $1
         ORDER BY c.code ASC`,
        [projectIdOrCode]
      );
      return res.rows;
    }
    return [];
  }

  resetMockState(): void {
    this.projects = [...this.defaultProjects];
    this.mockAssignments = [
      { user_id: 'a0000001-0000-0000-0000-000000000001', project_id: 'b0000001-0000-0000-0000-000000000001', assigned_at: '2026-08-01T08:00:00Z' },
      { user_id: 'a0000001-0000-0000-0000-000000000001', project_id: 'b0000001-0000-0000-0000-000000000002', assigned_at: '2026-08-15T09:00:00Z' },
      { user_id: 'a0000001-0000-0000-0000-000000000001', project_id: 'b0000001-0000-0000-0000-000000000003', assigned_at: '2026-09-01T10:00:00Z' },
      { user_id: 'a0000001-0000-0000-0000-000000000004', project_id: 'b0000001-0000-0000-0000-000000000001', assigned_at: '2026-08-01T08:00:00Z' },
      { user_id: 'a0000001-0000-0000-0000-000000000002', project_id: 'b0000001-0000-0000-0000-000000000002', assigned_at: '2026-08-15T09:00:00Z' },
    ];
  }

  snapshotMockAssignments(): any[] {
    return JSON.parse(JSON.stringify(this.mockAssignments));
  }

  restoreMockAssignments(snapshot: any[]): void {
    this.mockAssignments = snapshot;
  }
}
