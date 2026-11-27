import { Injectable, Inject, forwardRef } from '@nestjs/common';
import * as crypto from 'node:crypto';
import pg from 'pg';
import { DatabaseService } from '../../database/database.service.js';
import { AuthRepository, type UserAccountEntity } from '../auth/auth.repository.js';
import type {
  CanonicalRoleId,
  GitHubIdentityStatus,
  InvitationChannel,
  InvitationStatus,
  UserAccountStatus,
} from '../../common/types/index.js';

export interface UserInvitationEntity {
  id: string;
  channel: InvitationChannel;
  email?: string | null;
  github_username?: string | null;
  organization_id?: string | null;
  organization_code?: string | null;
  organization_name?: string | null;
  project_id?: string | null;
  intended_role_id: number;
  intended_role_code?: CanonicalRoleId;
  intended_role_name?: string;
  status: InvitationStatus;
  invited_by: string;
  invited_by_code?: string;
  invited_by_name?: string;
  cancelled_by?: string | null;
  cancelled_at?: string | Date | null;
  accepted_user_id?: string | null;
  accepted_at?: string | Date | null;
  notes?: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  expires_at?: string | Date | null;
}

@Injectable()
export class UsersRepository {
  private mockInvitations: UserInvitationEntity[] = [];

  constructor(
    @Inject(DatabaseService) private readonly db: DatabaseService,
    @Inject(forwardRef(() => AuthRepository)) private readonly authRepo: AuthRepository
  ) {}

  private getRunner(client?: pg.PoolClient | null): { query: DatabaseService["query"] } { return (client || this.db) as unknown as { query: DatabaseService["query"] }; }

  private buildListSelectQuery(whereClause = ''): string {
    return `
      SELECT
        u.id, u.code, u.username, u.email, u.full_name,
        u.organization, u.position, u.status,
        u.can_create_projects, u.project_creation_authorized_by, u.project_creation_authorized_at,
        u.github_username, u.github_user_id, u.github_identity_status,
        u.created_at, u.updated_at,
        COALESCE((
          SELECT r.code
          FROM traceflow.user_role_assignment ura
          JOIN traceflow.app_role r ON ura.role_id = r.id
          WHERE ura.user_id = u.id AND ura.status = 'ACTIVE'
          ORDER BY ura.is_primary DESC, ura.role_id ASC
          LIMIT 1
        ), 'PU-01') as primary_role_code,
        COALESCE((
          SELECT array_agg(r.code ORDER BY ura.is_primary DESC, r.id ASC)
          FROM traceflow.user_role_assignment ura
          JOIN traceflow.app_role r ON ura.role_id = r.id
          WHERE ura.user_id = u.id AND ura.status = 'ACTIVE'
        ), ARRAY[]::varchar[]) as assigned_role_codes,
        COALESCE((
          SELECT array_agg(DISTINCT pval)
          FROM traceflow.user_project_assignment upa
          JOIN traceflow.project p ON upa.project_id = p.id,
          LATERAL (VALUES (p.code), (p.id::text)) AS val(pval)
          WHERE upa.user_id = u.id
        ), ARRAY[]::varchar[]) as assigned_project_codes
      FROM traceflow.app_user u
      ${whereClause}
      ORDER BY u.code ASC;
    `;
  }

  async findAllUsers(
    filters?: {
      search?: string;
      status?: UserAccountStatus;
      role?: CanonicalRoleId;
      canCreateProjects?: boolean;
    },
    client?: pg.PoolClient | null
  ): Promise<UserAccountEntity[]> {
    let list: UserAccountEntity[];

    if (this.db.getDatabaseMode() === 'postgres') {
            const res = await this.getRunner(client).query<UserAccountEntity>(this.buildListSelectQuery());
      list = res.rows;
    } else {
      list = [...this.authRepo.getMockUsersRef()];
    }

    return list.filter((u) => {
      if (filters?.status && u.status !== filters.status) {
        return false;
      }
      if (filters?.role && !u.assigned_role_codes.includes(filters.role)) {
        return false;
      }
      if (
        filters?.canCreateProjects !== undefined &&
        Boolean(u.can_create_projects) !== filters.canCreateProjects
      ) {
        return false;
      }
      if (filters?.search && filters.search.trim() !== '') {
        const q = filters.search.trim().toLowerCase();
        const matches =
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.code.toLowerCase().includes(q) ||
          (u.github_username && u.github_username.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }

  async findByIdForUpdate(
    idOrCode: string,
    client?: pg.PoolClient | null
  ): Promise<UserAccountEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
            await this.getRunner(client).query(
        `SELECT id FROM traceflow.app_user WHERE id::text = $1 OR code = $1 FOR UPDATE`,
        [idOrCode]
      );
      return this.authRepo.findById(idOrCode, client);
    }
    return this.authRepo.findById(idOrCode);
  }

  async findByUsername(username: string, client?: pg.PoolClient | null): Promise<UserAccountEntity | null> {
    const normalized = username.trim().toLowerCase();
    if (this.db.getDatabaseMode() === 'postgres') {
            const res = await this.getRunner(client).query<UserAccountEntity>(
        this.buildListSelectQuery('WHERE LOWER(u.username) = $1'),
        [normalized]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    return this.authRepo.getMockUsersRef().find((u) => u.username.toLowerCase() === normalized) || null;
  }

  async getNextUserCode(client?: pg.PoolClient | null): Promise<string> {
    let codes: string[] = [];
    if (this.db.getDatabaseMode() === 'postgres') {
            const res = await this.getRunner(client).query<{ code: string }>(
        `SELECT code FROM traceflow.app_user WHERE code ~ '^USR-[0-9]+$'`
      );
      codes = res.rows.map((r) => r.code);
    } else {
      codes = this.authRepo.getMockUsersRef().map((u) => u.code);
    }

    let maxNum = 0;
    for (const c of codes) {
      const match = /^USR-(\d+)$/.exec(c);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    return `USR-${String(maxNum + 1).padStart(3, '0')}`;
  }

  async createUser(
    data: {
      id: string;
      code: string;
      username: string;
      email: string;
      passwordHash: string;
      fullName: string;
      organization: string;
      position: string;
      status: UserAccountStatus;
      githubUsername?: string | null;
      githubIdentityStatus: GitHubIdentityStatus;
    },
    client?: pg.PoolClient | null
  ): Promise<UserAccountEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
            await this.getRunner(client).query(
        `INSERT INTO traceflow.app_user
          (id, code, username, email, password_hash, full_name, organization, position, status,
           can_create_projects, github_username, github_identity_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, $10, $11, NOW(), NOW())`,
        [
          data.id,
          data.code,
          data.username,
          data.email,
          data.passwordHash,
          data.fullName,
          data.organization,
          data.position,
          data.status,
          data.githubUsername || null,
          data.githubIdentityStatus,
        ]
      );
      return (await this.authRepo.findById(data.id, client))!;
    }

    const now = new Date().toISOString();
    const entity: UserAccountEntity = {
      id: data.id,
      code: data.code,
      username: data.username,
      email: data.email,
      password_hash: data.passwordHash,
      full_name: data.fullName,
      organization: data.organization,
      position: data.position,
      status: data.status,
      primary_role_code: 'PU-01',
      assigned_role_codes: [],
      assigned_project_codes: [],
      can_create_projects: false,
      project_creation_authorized_by: null,
      project_creation_authorized_at: null,
      github_username: data.githubUsername || null,
      github_user_id: null,
      github_identity_status: data.githubIdentityStatus,
      created_at: now,
      updated_at: now,
    };
    this.authRepo.getMockUsersRef().push(entity);
    return entity;
  }

  async updateUserBasicInfo(
    userId: string,
    updates: {
      fullName?: string;
      position?: string;
      organization?: string;
      githubUsername?: string | null;
      githubIdentityStatus?: GitHubIdentityStatus;
    },
    client?: pg.PoolClient | null
  ): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
            const setClauses: string[] = ['updated_at = NOW()'];
      const values: any[] = [userId];
      let idx = 2;

      if (updates.fullName !== undefined) {
        setClauses.push(`full_name = $${idx++}`);
        values.push(updates.fullName);
      }
      if (updates.position !== undefined) {
        setClauses.push(`position = $${idx++}`);
        values.push(updates.position);
      }
      if (updates.organization !== undefined) {
        setClauses.push(`organization = $${idx++}`);
        values.push(updates.organization);
      }
      if (updates.githubUsername !== undefined) {
        setClauses.push(`github_username = $${idx++}`);
        values.push(updates.githubUsername);
      }
      if (updates.githubIdentityStatus !== undefined) {
        setClauses.push(`github_identity_status = $${idx++}`);
        values.push(updates.githubIdentityStatus);
      }

      await this.getRunner(client).query(
        `UPDATE traceflow.app_user SET ${setClauses.join(', ')} WHERE id = $1`,
        values
      );
      return;
    }

    const mock = this.authRepo.getMockUsersRef().find((u) => u.id === userId);
    if (mock) {
      if (updates.fullName !== undefined) mock.full_name = updates.fullName;
      if (updates.position !== undefined) mock.position = updates.position;
      if (updates.organization !== undefined) mock.organization = updates.organization;
      if (updates.githubUsername !== undefined) mock.github_username = updates.githubUsername;
      if (updates.githubIdentityStatus !== undefined) mock.github_identity_status = updates.githubIdentityStatus;
      mock.updated_at = new Date().toISOString();
    }
  }

  async updateUserStatus(
    userId: string,
    status: UserAccountStatus,
    client?: pg.PoolClient | null
  ): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
            await this.getRunner(client).query(
        `UPDATE traceflow.app_user SET status = $2, updated_at = NOW() WHERE id = $1`,
        [userId, status]
      );
      return;
    }

    const mock = this.authRepo.getMockUsersRef().find((u) => u.id === userId);
    if (mock) {
      mock.status = status;
      mock.updated_at = new Date().toISOString();
    }
  }

  async countActiveGlobalAdmins(
    client?: pg.PoolClient | null,
    forUpdate = false
  ): Promise<number> {
    if (this.db.getDatabaseMode() === 'postgres') {
            const lockClause = forUpdate ? 'FOR UPDATE OF u' : '';
      const res = await this.getRunner(client).query<{ id: string }>(
        `SELECT u.id
         FROM traceflow.app_user u
         JOIN traceflow.user_role_assignment ura ON u.id = ura.user_id
         JOIN traceflow.app_role r ON ura.role_id = r.id
         WHERE u.status = 'ACTIVE' AND ura.status = 'ACTIVE' AND r.code = 'PU-08'
         ${lockClause}`
      );
      return res.rows.length;
    }

    return this.authRepo
      .getMockUsersRef()
      .filter((u) => u.status === 'ACTIVE' && u.assigned_role_codes.includes('PU-08')).length;
  }

  async upsertUserRole(
    userId: string,
    roleId: number,
    roleCode: CanonicalRoleId,
    isPrimary: boolean,
    actorUserId: string,
    client?: pg.PoolClient | null
  ): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
            await this.getRunner(client).query(
        `INSERT INTO traceflow.user_role_assignment
          (user_id, role_id, is_primary, assigned_at, assigned_by, status, revoked_at, revoked_by, updated_at)
         VALUES ($1, $2, $3, NOW(), $4, 'ACTIVE', NULL, NULL, NOW())
         ON CONFLICT (user_id, role_id) DO UPDATE SET
           status = 'ACTIVE',
           is_primary = EXCLUDED.is_primary,
           assigned_by = EXCLUDED.assigned_by,
           revoked_at = NULL,
           revoked_by = NULL,
           updated_at = NOW()`,
        [userId, roleId, isPrimary, actorUserId]
      );
      return;
    }

    const mock = this.authRepo.getMockUsersRef().find((u) => u.id === userId);
    if (mock) {
      if (!mock.assigned_role_codes.includes(roleCode)) {
        mock.assigned_role_codes.push(roleCode);
      }
      if (isPrimary) {
        mock.primary_role_code = roleCode;
      }
      mock.updated_at = new Date().toISOString();
    }
  }

  async revokeUserRole(
    userId: string,
    roleId: number,
    roleCode: CanonicalRoleId,
    actorUserId: string,
    client?: pg.PoolClient | null
  ): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
            await this.getRunner(client).query(
        `UPDATE traceflow.user_role_assignment
         SET status = 'REVOKED', is_primary = FALSE, revoked_at = NOW(), revoked_by = $3, updated_at = NOW()
         WHERE user_id = $1 AND role_id = $2 AND status = 'ACTIVE'`,
        [userId, roleId, actorUserId]
      );
      return;
    }

    const mock = this.authRepo.getMockUsersRef().find((u) => u.id === userId);
    if (mock) {
      mock.assigned_role_codes = mock.assigned_role_codes.filter((c) => c !== roleCode);
      if (mock.primary_role_code === roleCode) {
        mock.primary_role_code =
          mock.assigned_role_codes.length > 0 ? mock.assigned_role_codes[0] : 'PU-01';
      }
      mock.updated_at = new Date().toISOString();
    }
  }

  async setProjectCreationAuthorization(
    userId: string,
    authorized: boolean,
    actorUserId: string,
    client?: pg.PoolClient | null
  ): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
            if (authorized) {
        await this.getRunner(client).query(
          `UPDATE traceflow.app_user
           SET can_create_projects = TRUE,
               project_creation_authorized_by = $2,
               project_creation_authorized_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [userId, actorUserId]
        );
      } else {
        await this.getRunner(client).query(
          `UPDATE traceflow.app_user
           SET can_create_projects = FALSE,
               updated_at = NOW()
           WHERE id = $1`,
          [userId]
        );
      }
      return;
    }

    const mock = this.authRepo.getMockUsersRef().find((u) => u.id === userId);
    if (mock) {
      mock.can_create_projects = authorized;
      if (authorized) {
        mock.project_creation_authorized_by = actorUserId;
        mock.project_creation_authorized_at = new Date().toISOString();
      }
      mock.updated_at = new Date().toISOString();
    }
  }

  // ==========================================================================
  // INVITACIONES PERSISTENTES (traceflow.user_invitation)
  // ==========================================================================
  async findInvitations(
    filters?: { status?: InvitationStatus; channel?: InvitationChannel; organizationId?: string },
    client?: pg.PoolClient | null
  ): Promise<UserInvitationEntity[]> {
    let rows: UserInvitationEntity[];
    if (this.db.getDatabaseMode() === 'postgres') {
            const res = await this.getRunner(client).query<UserInvitationEntity>(
        `SELECT i.*,
                o.code as organization_code, o.name as organization_name,
                r.code as intended_role_code, r.name as intended_role_name,
                u.code as invited_by_code, u.full_name as invited_by_name
         FROM traceflow.user_invitation i
         LEFT JOIN traceflow.organization o ON i.organization_id = o.id
         JOIN traceflow.app_role r ON i.intended_role_id = r.id
         JOIN traceflow.app_user u ON i.invited_by = u.id
         ORDER BY i.created_at DESC`
      );
      rows = res.rows;
    } else {
      rows = [...this.mockInvitations];
    }

    return rows.filter((inv) => {
      if (filters?.status && inv.status !== filters.status) return false;
      if (filters?.channel && inv.channel !== filters.channel) return false;
      if (filters?.organizationId && inv.organization_id !== filters.organizationId) return false;
      return true;
    });
  }

  async findInvitationById(
    id: string,
    client?: pg.PoolClient | null
  ): Promise<UserInvitationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
            const res = await this.getRunner(client).query<UserInvitationEntity>(
        `SELECT i.*,
                o.code as organization_code, o.name as organization_name,
                r.code as intended_role_code, r.name as intended_role_name,
                u.code as invited_by_code, u.full_name as invited_by_name
         FROM traceflow.user_invitation i
         LEFT JOIN traceflow.organization o ON i.organization_id = o.id
         JOIN traceflow.app_role r ON i.intended_role_id = r.id
         JOIN traceflow.app_user u ON i.invited_by = u.id
         WHERE i.id::text = $1
         LIMIT 1`,
        [id]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }

    return this.mockInvitations.find((i) => i.id === id) || null;
  }

  async findDuplicatePendingInvitation(
    params: {
      channel: InvitationChannel;
      recipient: string;
      organizationId?: string | null;
      projectId?: string | null;
      intendedRoleId: number;
    },
    client?: pg.PoolClient | null
  ): Promise<UserInvitationEntity | null> {
    const normalizedRecipient = params.recipient.trim().toLowerCase();
    const orgId = params.organizationId || null;
    const prjId = params.projectId || null;

    if (this.db.getDatabaseMode() === 'postgres') {
            const col = params.channel === 'EMAIL' ? 'LOWER(email)' : 'LOWER(github_username)';
      const res = await this.getRunner(client).query<UserInvitationEntity>(
        `SELECT *
         FROM traceflow.user_invitation
         WHERE status = 'PENDING'
           AND channel = $1
           AND ${col} = $2
           AND COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE($3::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
           AND COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE($4::uuid, '00000000-0000-0000-0000-000000000000'::uuid)
           AND intended_role_id = $5
         LIMIT 1`,
        [params.channel, normalizedRecipient, orgId, prjId, params.intendedRoleId]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }

    return (
      this.mockInvitations.find((inv) => {
        if (inv.status !== 'PENDING' || inv.channel !== params.channel) return false;
        const target =
          params.channel === 'EMAIL'
            ? (inv.email || '').toLowerCase()
            : (inv.github_username || '').toLowerCase();
        return (
          target === normalizedRecipient &&
          (inv.organization_id || null) === orgId &&
          (inv.project_id || null) === prjId &&
          inv.intended_role_id === params.intendedRoleId
        );
      }) || null
    );
  }

  async createInvitation(
    data: {
      channel: InvitationChannel;
      email?: string | null;
      githubUsername?: string | null;
      organizationId?: string | null;
      organizationCode?: string | null;
      organizationName?: string | null;
      projectId?: string | null;
      intendedRoleId: number;
      intendedRoleCode: CanonicalRoleId;
      intendedRoleName: string;
      invitedBy: string;
      invitedByCode: string;
      invitedByName: string;
      notes?: string | null;
      expiresAt?: string | null;
    },
    client?: pg.PoolClient | null
  ): Promise<UserInvitationEntity> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    if (this.db.getDatabaseMode() === 'postgres') {
            await this.getRunner(client).query(
        `INSERT INTO traceflow.user_invitation
          (id, channel, email, github_username, organization_id, project_id, intended_role_id,
           status, invited_by, notes, created_at, updated_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9, NOW(), NOW(), $10)`,
        [
          id,
          data.channel,
          data.email || null,
          data.githubUsername || null,
          data.organizationId || null,
          data.projectId || null,
          data.intendedRoleId,
          data.invitedBy,
          data.notes || null,
          data.expiresAt || null,
        ]
      );
      return (await this.findInvitationById(id, client))!;
    }

    const entity: UserInvitationEntity = {
      id,
      channel: data.channel,
      email: data.email || null,
      github_username: data.githubUsername || null,
      organization_id: data.organizationId || null,
      organization_code: data.organizationCode || null,
      organization_name: data.organizationName || null,
      project_id: data.projectId || null,
      intended_role_id: data.intendedRoleId,
      intended_role_code: data.intendedRoleCode,
      intended_role_name: data.intendedRoleName,
      status: 'PENDING',
      invited_by: data.invitedBy,
      invited_by_code: data.invitedByCode,
      invited_by_name: data.invitedByName,
      notes: data.notes || null,
      created_at: now,
      updated_at: now,
      expires_at: data.expiresAt || null,
    };
    this.mockInvitations.unshift(entity);
    return entity;
  }

  async updateInvitationStatus(
    id: string,
    status: InvitationStatus,
    actorUserId: string,
    client?: pg.PoolClient | null
  ): Promise<UserInvitationEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
            await this.getRunner(client).query(
        `UPDATE traceflow.user_invitation
         SET status = $2,
             cancelled_by = CASE WHEN $2 = 'CANCELLED' THEN $3 ELSE cancelled_by END,
             cancelled_at = CASE WHEN $2 = 'CANCELLED' THEN NOW() ELSE cancelled_at END,
             updated_at = NOW()
         WHERE id = $1`,
        [id, status, actorUserId]
      );
      return (await this.findInvitationById(id, client))!;
    }

    const found = this.mockInvitations.find((i) => i.id === id);
    if (found) {
      found.status = status;
      if (status === 'CANCELLED') {
        found.cancelled_by = actorUserId;
        found.cancelled_at = new Date().toISOString();
      }
      found.updated_at = new Date().toISOString();
    }
    return found!;
  }
}
