import { Injectable, Inject, forwardRef, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import { AuthRepository } from '../auth/auth.repository.js';
import type { OrganizationRole, OrganizationStatus, MemberStatus } from '../../common/types/index.js';

export interface OrganizationEntity {
  id: string;
  code: string;
  name: string;
  slug: string;
  legal_name?: string | null;
  tax_id?: string | null;
  status: OrganizationStatus;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMemberEntity {
  id: string;
  organization_id: string;
  user_id: string;
  role_in_org: OrganizationRole;
  status: MemberStatus;
  joined_at: string;
  added_by?: string | null;
  user_code?: string;
  user_full_name?: string;
  user_email?: string;
}

@Injectable()
export class OrganizationsRepository {
  private async runQuery<T>(queryText: string, params?: any[], client?: any): Promise<{ rows: T[] }> {
    try {
      const runner = client || this.db;
      return await runner.query(queryText, params);
    } catch (err: any) {
      if (err.code === '42P01') {
        // H02-R02: Error controlado que bloquea la operación sin fallback a datos simulados
        throw new ServiceUnavailableException(
          'Esquema organizacional no inicializado en PostgreSQL (tabla no encontrada). Operación bloqueada (H02-R02).'
        );
      }
      throw err;
    }
  }
  private organizations: OrganizationEntity[] = [
    {
      id: 'c0000001-0000-0000-0000-000000000001',
      code: 'ORG-EXODO',
      name: 'ÉXODO S.A.C.',
      slug: 'exodo-sac',
      legal_name: 'Éxodo Soluciones Informáticas S.A.C.',
      tax_id: null,
      status: 'ACTIVE',
      created_by: 'a0000001-0000-0000-0000-000000000001',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
    },
  ];

  private members: OrganizationMemberEntity[] = [
    {
      id: 'd0000001-0000-0000-0000-000000000001',
      organization_id: 'c0000001-0000-0000-0000-000000000001',
      user_id: 'a0000001-0000-0000-0000-000000000001', // USR-001 Joan Medina
      role_in_org: 'OWNER',
      status: 'ACTIVE',
      joined_at: '2026-08-01T00:00:00Z',
      added_by: 'a0000001-0000-0000-0000-000000000001',
      user_code: 'USR-001',
      user_full_name: 'Joan Cristian Medina Quispe',
      user_email: 'jmedina@exodo.pe',
    },
    {
      id: 'd0000001-0000-0000-0000-000000000002',
      organization_id: 'c0000001-0000-0000-0000-000000000001',
      user_id: 'a0000001-0000-0000-0000-000000000002', // USR-002 Renzo Antayhua
      role_in_org: 'MEMBER',
      status: 'ACTIVE',
      joined_at: '2026-08-01T00:00:00Z',
      added_by: 'a0000001-0000-0000-0000-000000000001',
      user_code: 'USR-002',
      user_full_name: 'Renzo Antonio Antayhua Mamani',
      user_email: 'rantayhua@exodo.pe',
    },
    {
      id: 'd0000001-0000-0000-0000-000000000003',
      organization_id: 'c0000001-0000-0000-0000-000000000001',
      user_id: 'a0000001-0000-0000-0000-000000000003', // USR-003 Augusto Rivera
      role_in_org: 'MEMBER',
      status: 'ACTIVE',
      joined_at: '2026-08-01T00:00:00Z',
      added_by: 'a0000001-0000-0000-0000-000000000001',
      user_code: 'USR-003',
      user_full_name: 'Augusto Joaquin Rivera Muñoz',
      user_email: 'arivera@exodo.pe',
    },
    {
      id: 'd0000001-0000-0000-0000-000000000004',
      organization_id: 'c0000001-0000-0000-0000-000000000001',
      user_id: 'a0000001-0000-0000-0000-000000000004', // USR-004 Renzo Loyola
      role_in_org: 'MEMBER',
      status: 'ACTIVE',
      joined_at: '2026-08-01T00:00:00Z',
      added_by: 'a0000001-0000-0000-0000-000000000001',
      user_code: 'USR-004',
      user_full_name: 'Renzo Fernando Loyola Vilca Choque',
      user_email: 'rloyola@exodo.pe',
    },
  ];

  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(forwardRef(() => AuthRepository)) private readonly authRepo: AuthRepository
  ) {}

  async count(): Promise<number> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<{ count: string }>('SELECT COUNT(*)::text as count FROM traceflow.organization');
      return parseInt(res.rows[0].count, 10);
    }
    return this.organizations.length;
  }

  async create(data: Partial<OrganizationEntity>, client?: any): Promise<OrganizationEntity> {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const entity: OrganizationEntity = {
      id,
      code: data.code!.toUpperCase(),
      name: data.name!,
      slug: data.slug!.toLowerCase(),
      legal_name: data.legal_name || null,
      tax_id: data.tax_id || null,
      status: data.status || 'ACTIVE',
      created_by: data.created_by || null,
      created_at: now,
      updated_at: now,
    };

    if (this.db.getDatabaseMode() === 'postgres') {
      await this.runQuery(
        `INSERT INTO traceflow.organization
          (id, code, name, slug, legal_name, tax_id, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          entity.id,
          entity.code,
          entity.name,
          entity.slug,
          entity.legal_name,
          entity.tax_id,
          entity.status,
          entity.created_by,
          entity.created_at,
          entity.updated_at,
        ],
        client
      );
      return entity;
    }

    this.organizations.push(entity);
    return entity;
  }

  async findById(id: string): Promise<OrganizationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<OrganizationEntity>(
        'SELECT * FROM traceflow.organization WHERE id = $1 LIMIT 1',
        [id]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    return this.organizations.find((o) => o.id === id) || null;
  }

  async findByCode(code: string): Promise<OrganizationEntity | null> {
    const normalized = code.trim().toUpperCase();
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<OrganizationEntity>(
        'SELECT * FROM traceflow.organization WHERE UPPER(code) = $1 LIMIT 1',
        [normalized]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    return this.organizations.find((o) => o.code.toUpperCase() === normalized) || null;
  }

  async findBySlug(slug: string): Promise<OrganizationEntity | null> {
    const normalized = slug.trim().toLowerCase();
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<OrganizationEntity>(
        'SELECT * FROM traceflow.organization WHERE LOWER(slug) = $1 LIMIT 1',
        [normalized]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    return this.organizations.find((o) => o.slug.toLowerCase() === normalized) || null;
  }

  async findByIdOrSlugOrCode(val: string): Promise<OrganizationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<OrganizationEntity>(
        `SELECT * FROM traceflow.organization
         WHERE id::text = $1 OR LOWER(slug) = LOWER($1) OR UPPER(code) = UPPER($1)
         LIMIT 1`,
        [val]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    const lower = val.toLowerCase();
    const upper = val.toUpperCase();
    return (
      this.organizations.find(
        (o) => o.id === val || o.slug.toLowerCase() === lower || o.code.toUpperCase() === upper
      ) || null
    );
  }

  async findAll(): Promise<OrganizationEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<OrganizationEntity>(
        'SELECT * FROM traceflow.organization ORDER BY code ASC'
      );
      return res.rows;
    }
    return [...this.organizations];
  }

  async findOrganizationsForUser(userId: string): Promise<OrganizationEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      // Sin fallback inseguro (H02-R02): el error debe propagarse si falla la consulta
      const res = await this.runQuery<OrganizationEntity>(
        `SELECT o.*
         FROM traceflow.organization o
         JOIN traceflow.organization_member m ON o.id = m.organization_id
         WHERE m.user_id = $1 AND m.status = 'ACTIVE' AND o.status = 'ACTIVE'
         ORDER BY o.code ASC`,
        [userId]
      );
      return res.rows;
    }

    const memberOrgIds = this.members
      .filter((m) => m.user_id === userId && m.status === 'ACTIVE')
      .map((m) => m.organization_id);
    return this.organizations.filter(
      (o) => memberOrgIds.includes(o.id) && o.status === 'ACTIVE'
    );
  }

  async addMember(data: Partial<OrganizationMemberEntity>, client?: any): Promise<OrganizationMemberEntity> {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const entity: OrganizationMemberEntity = {
      id,
      organization_id: data.organization_id!,
      user_id: data.user_id!,
      role_in_org: data.role_in_org || 'MEMBER',
      status: data.status || 'ACTIVE',
      joined_at: now,
      added_by: data.added_by || null,
      user_code: data.user_code,
      user_full_name: data.user_full_name,
      user_email: data.user_email,
    };

    if (this.db.getDatabaseMode() === 'postgres') {
      await this.runQuery(
        `INSERT INTO traceflow.organization_member
          (id, organization_id, user_id, role_in_org, status, joined_at, added_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entity.id,
          entity.organization_id,
          entity.user_id,
          entity.role_in_org,
          entity.status,
          entity.joined_at,
          entity.added_by,
        ],
        client
      );
      return entity;
    }

    this.members.push(entity);
    return entity;
  }

  async findMember(orgId: string, userId: string): Promise<OrganizationMemberEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<OrganizationMemberEntity>(
        `SELECT m.*, u.code as user_code, u.full_name as user_full_name, u.email as user_email
         FROM traceflow.organization_member m
         JOIN traceflow.app_user u ON m.user_id = u.id
         WHERE m.organization_id = $1 AND m.user_id = $2
         LIMIT 1`,
        [orgId, userId]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }

    return (
      this.members.find(
        (m) => m.organization_id === orgId && m.user_id === userId
      ) || null
    );
  }

  async findMembersByOrgId(orgId: string): Promise<OrganizationMemberEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<OrganizationMemberEntity>(
        `SELECT m.*, u.code as user_code, u.full_name as user_full_name, u.email as user_email
         FROM traceflow.organization_member m
         JOIN traceflow.app_user u ON m.user_id = u.id
         WHERE m.organization_id = $1
         ORDER BY m.joined_at ASC`,
        [orgId]
      );
      return res.rows;
    }

    return this.members.filter((m) => m.organization_id === orgId);
  }

  async updateMemberStatus(
    orgId: string,
    userId: string,
    status: MemberStatus,
    client?: any
  ): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
      await this.runQuery(
        `UPDATE traceflow.organization_member
         SET status = $1
         WHERE organization_id = $2 AND user_id = $3`,
        [status, orgId, userId],
        client
      );
      return;
    }

    const member = this.members.find(
      (m) => m.organization_id === orgId && m.user_id === userId
    );
    if (member) {
      member.status = status;
    }
  }

  resetMockState(): void {
    this.organizations = [
      {
        id: 'c0000001-0000-0000-0000-000000000001',
        code: 'ORG-EXODO',
        name: 'ÉXODO S.A.C.',
        slug: 'exodo-sac',
        legal_name: 'Éxodo Soluciones Informáticas S.A.C.',
        tax_id: null,
        status: 'ACTIVE',
        created_by: 'a0000001-0000-0000-0000-000000000001',
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-08-01T00:00:00Z',
      },
    ];
    this.members = [
      {
        id: 'd0000001-0000-0000-0000-000000000001',
        organization_id: 'c0000001-0000-0000-0000-000000000001',
        user_id: 'a0000001-0000-0000-0000-000000000001',
        role_in_org: 'OWNER',
        status: 'ACTIVE',
        joined_at: '2026-08-01T00:00:00Z',
        added_by: 'a0000001-0000-0000-0000-000000000001',
        user_code: 'USR-001',
        user_full_name: 'Joan Cristian Medina Quispe',
        user_email: 'jmedina@exodo.pe',
      },
      {
        id: 'd0000001-0000-0000-0000-000000000002',
        organization_id: 'c0000001-0000-0000-0000-000000000001',
        user_id: 'a0000001-0000-0000-0000-000000000002',
        role_in_org: 'MEMBER',
        status: 'ACTIVE',
        joined_at: '2026-08-01T00:00:00Z',
        added_by: 'a0000001-0000-0000-0000-000000000001',
        user_code: 'USR-002',
        user_full_name: 'Renzo Antonio Antayhua Mamani',
        user_email: 'rantayhua@exodo.pe',
      },
      {
        id: 'd0000001-0000-0000-0000-000000000003',
        organization_id: 'c0000001-0000-0000-0000-000000000001',
        user_id: 'a0000001-0000-0000-0000-000000000003',
        role_in_org: 'MEMBER',
        status: 'ACTIVE',
        joined_at: '2026-08-01T00:00:00Z',
        added_by: 'a0000001-0000-0000-0000-000000000001',
        user_code: 'USR-003',
        user_full_name: 'Augusto Joaquin Rivera Muñoz',
        user_email: 'arivera@exodo.pe',
      },
      {
        id: 'd0000001-0000-0000-0000-000000000004',
        organization_id: 'c0000001-0000-0000-0000-000000000001',
        user_id: 'a0000001-0000-0000-0000-000000000004',
        role_in_org: 'MEMBER',
        status: 'ACTIVE',
        joined_at: '2026-08-01T00:00:00Z',
        added_by: 'a0000001-0000-0000-0000-000000000001',
        user_code: 'USR-004',
        user_full_name: 'Renzo Fernando Loyola Vilca Choque',
        user_email: 'rloyola@exodo.pe',
      },
    ];
  }

  clearAllMockForBootstrap(): void {
    this.organizations = [];
    this.members = [];
  }
}
