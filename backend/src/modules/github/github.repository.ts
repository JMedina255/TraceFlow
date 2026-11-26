import { Injectable, Inject } from '@nestjs/common';
import pg from 'pg';
import { DatabaseService } from '../../database/database.service.js';
import type {
  GitHubIntegrationEntity,
  GitHubValidationStatus,
  OrganizationGitHubInstallationEntity,
  GitHubEventEntity,
  GitHubEventProcessingStatus,
  GitHubEventCorrelationStatus,
  ConfigItemPathHistoryEntity,
  ConfigItemPathHistoryChangeType,
  ConfigItemPathHistoryStatus,
} from './github.entity.js';

@Injectable()
export class GitHubRepository {
  private mockIntegrations: GitHubIntegrationEntity[] = [];
  private mockEvents: GitHubEventEntity[] = [];
  private mockPathHistories: ConfigItemPathHistoryEntity[] = [];
  private mockConfigItems: any[] = [];
  private mockUsers: any[] = [
    {
      id: 'a0000001-0000-0000-0000-000000000001',
      code: 'USR-001',
      username: 'jmedina',
      email: 'jmedina@exodo.pe',
      status: 'ACTIVE',
      assigned_role_codes: ['PU-02', 'PU-01', 'PU-06'],
      projectRoles: {
        'b0000001-0000-0000-0000-000000000001': ['PU-02', 'PU-06'],
        'PRJ-001': ['PU-02', 'PU-06'],
      },
    },
    {
      id: 'a0000001-0000-0000-0000-000000000002',
      code: 'USR-002',
      username: 'mrodriguez',
      email: 'mrodriguez@exodo.pe',
      status: 'ACTIVE',
      assigned_role_codes: ['PU-06'],
      projectRoles: {
        'b0000001-0000-0000-0000-000000000001': ['PU-06'],
        'PRJ-001': ['PU-06'],
      },
    },
  ];
  private mockRfcs: any[] = [
    {
      id: 'd0000001-0000-0000-0000-000000000001',
      code: 'RFC-2026-0001',
      project_id: 'PRJ-001',
      status: 'AUTORIZADA',
      target_ecs_id: 'c0000001-0000-0000-0000-000000000001',
      requested_by: 'a0000001-0000-0000-0000-000000000001',
    },
    {
      id: 'd0000001-0000-0000-0000-000000000002',
      code: 'RFC-2026-0002',
      project_id: 'PRJ-001',
      status: 'REGISTRADA', // No aprobada
      target_ecs_id: 'c0000001-0000-0000-0000-000000000001',
      requested_by: 'a0000001-0000-0000-0000-000000000001',
    },
    {
      id: 'd0000001-0000-0000-0000-000000000003',
      code: 'RFC-2026-0003',
      project_id: 'PRJ-002', // Proyecto ajeno
      status: 'AUTORIZADA',
      target_ecs_id: 'c0000001-0000-0000-0000-000000000005',
      requested_by: 'a0000001-0000-0000-0000-000000000004',
    },
  ];
  private mockChangeOrders: any[] = [
    {
      id: 'e0000001-0000-0000-0000-000000000001',
      code: 'ECN-2026-0001',
      rfc_id: 'd0000001-0000-0000-0000-000000000001',
      ecs_id: 'c0000001-0000-0000-0000-000000000001',
      status: 'EMITIDA',
      issued_by: 'a0000001-0000-0000-0000-000000000001',
      assigned_developer_id: 'a0000001-0000-0000-0000-000000000002',
    },
  ];
  private mockSyncLocks: any[] = [
    {
      id: 'f0000001-0000-0000-0000-000000000001',
      ecs_id: 'c0000001-0000-0000-0000-000000000001',
      change_order_id: 'e0000001-0000-0000-0000-000000000001',
      locked_by: 'a0000001-0000-0000-0000-000000000002',
      status: 'ACTIVE',
    },
  ];
  private mockInstallations: OrganizationGitHubInstallationEntity[] = [
    {
      id: 'inst0001-0000-0000-0000-000000000001',
      organization_id: 'c0000001-0000-0000-0000-000000000001', // ORG-EXODO
      installation_id: 12345678,
      account_login: 'exodo-org',
      account_type: 'Organization',
      permissions: { contents: 'read', metadata: 'read', pull_requests: 'write' },
      status: 'ACTIVE',
      installed_at: '2026-11-26T00:00:00.000Z',
      updated_at: '2026-11-26T00:00:00.000Z',
    },
  ];

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  private mapRow(row: any): GitHubIntegrationEntity {
    return {
      ...row,
      github_repo_id: Number(row.github_repo_id),
      installation_id: Number(row.installation_id),
    };
  }

  private mapInstallationRow(row: any): OrganizationGitHubInstallationEntity {
    return {
      ...row,
      installation_id: Number(row.installation_id),
      target_id: row.target_id !== null && row.target_id !== undefined ? Number(row.target_id) : null,
    };
  }

  // ==========================================================================
  // GESTIÓN DE INSTALACIONES GITHUB POR ORGANIZACIÓN (H04A-R02)
  // ==========================================================================
  async findInstallationByOrgAndId(
    organizationId: string,
    installationId: number,
    client?: pg.PoolClient | null
  ): Promise<OrganizationGitHubInstallationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT * FROM traceflow.organization_github_installation
        WHERE organization_id = $1 AND installation_id = $2
        LIMIT 1;
      `;
      const res = client
        ? await client.query(sql, [organizationId, installationId])
        : await this.db.query<OrganizationGitHubInstallationEntity>(sql, [
            organizationId,
            installationId,
          ]);
      return res.rows[0] ? this.mapInstallationRow(res.rows[0]) : null;
    }

    return (
      this.mockInstallations.find(
        (inst) =>
          inst.organization_id === organizationId && inst.installation_id === installationId
      ) || null
    );
  }

  async findActiveInstallationsByOrg(
    organizationId: string,
    client?: pg.PoolClient | null
  ): Promise<OrganizationGitHubInstallationEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT * FROM traceflow.organization_github_installation
        WHERE organization_id = $1 AND status = 'ACTIVE'
        ORDER BY installed_at DESC;
      `;
      const res = client
        ? await client.query(sql, [organizationId])
        : await this.db.query<OrganizationGitHubInstallationEntity>(sql, [organizationId]);
      return res.rows.map((r) => this.mapInstallationRow(r));
    }

    return this.mockInstallations.filter(
      (inst) => inst.organization_id === organizationId && inst.status === 'ACTIVE'
    );
  }

  async saveOrganizationInstallation(
    data: {
      organizationId: string;
      installationId: number;
      accountLogin: string;
      accountType: 'Organization' | 'User';
      targetId?: number | null;
      permissions?: Record<string, string>;
      repositorySelection?: 'all' | 'selected';
      status?: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
      installedBy?: string | null;
    },
    client?: pg.PoolClient | null
  ): Promise<OrganizationGitHubInstallationEntity> {
    const status = data.status || 'ACTIVE';
    const permissions = data.permissions || {
      contents: 'read',
      metadata: 'read',
      pull_requests: 'write',
    };
    const targetId = data.targetId || null;
    const repoSelection = data.repositorySelection || 'selected';
    const installedBy = data.installedBy || null;

    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.organization_github_installation (
          organization_id, installation_id, account_login, account_type, target_id, permissions, repository_selection, status, installed_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9
        )
        ON CONFLICT (organization_id, installation_id) DO UPDATE SET
          account_login = EXCLUDED.account_login,
          account_type = EXCLUDED.account_type,
          target_id = COALESCE(EXCLUDED.target_id, organization_github_installation.target_id),
          permissions = EXCLUDED.permissions,
          repository_selection = EXCLUDED.repository_selection,
          status = EXCLUDED.status,
          installed_by = COALESCE(EXCLUDED.installed_by, organization_github_installation.installed_by),
          updated_at = NOW()
        RETURNING *;
      `;
      const params = [
        data.organizationId,
        data.installationId,
        data.accountLogin,
        data.accountType,
        targetId,
        JSON.stringify(permissions),
        repoSelection,
        status,
        installedBy,
      ];
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<OrganizationGitHubInstallationEntity>(sql, params);
      return this.mapInstallationRow(res.rows[0]);
    }

    const existingIndex = this.mockInstallations.findIndex(
      (inst) =>
        inst.organization_id === data.organizationId &&
        inst.installation_id === data.installationId
    );

    const entity: OrganizationGitHubInstallationEntity = {
      id:
        existingIndex >= 0
          ? this.mockInstallations[existingIndex].id
          : `inst0001-${Date.now().toString(16).padStart(12, '0')}`,
      organization_id: data.organizationId,
      installation_id: data.installationId,
      account_login: data.accountLogin,
      account_type: data.accountType,
      target_id: targetId,
      permissions,
      repository_selection: repoSelection,
      status,
      installed_by: installedBy,
      installed_at:
        existingIndex >= 0
          ? this.mockInstallations[existingIndex].installed_at
          : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.mockInstallations[existingIndex] = entity;
    } else {
      this.mockInstallations.push(entity);
    }

    return entity;
  }

  // ==========================================================================
  // GESTIÓN DE INTEGRACIONES GITHUB (H04A / H04A-R)
  // ==========================================================================
  async findByProjectId(
    projectId: string,
    client?: pg.PoolClient | null
  ): Promise<GitHubIntegrationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.github_integration WHERE project_id = $1;';
      const res = client
        ? await client.query(sql, [projectId])
        : await this.db.query<GitHubIntegrationEntity>(sql, [projectId]);
      return res.rows[0] ? this.mapRow(res.rows[0]) : null;
    }

    return this.mockIntegrations.find((i) => i.project_id === projectId) || null;
  }

  async findActiveByRepoId(
    repoId: number,
    client?: pg.PoolClient | null
  ): Promise<GitHubIntegrationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT * FROM traceflow.github_integration
        WHERE github_repo_id = $1
          AND validation_status != 'UNLINKED'
        LIMIT 1;
      `;
      const res = client
        ? await client.query(sql, [repoId])
        : await this.db.query<GitHubIntegrationEntity>(sql, [repoId]);
      return res.rows[0] ? this.mapRow(res.rows[0]) : null;
    }

    return (
      this.mockIntegrations.find(
        (i) => i.github_repo_id === repoId && i.validation_status !== 'UNLINKED'
      ) || null
    );
  }

  async findActiveByRepo(
    owner: string,
    repo: string,
    client?: pg.PoolClient | null
  ): Promise<GitHubIntegrationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT * FROM traceflow.github_integration
        WHERE LOWER(repo_owner) = LOWER($1)
          AND LOWER(repo_name) = LOWER($2)
          AND validation_status != 'UNLINKED'
        LIMIT 1;
      `;
      const res = client
        ? await client.query(sql, [owner, repo])
        : await this.db.query<GitHubIntegrationEntity>(sql, [owner, repo]);
      return res.rows[0] ? this.mapRow(res.rows[0]) : null;
    }

    return (
      this.mockIntegrations.find(
        (i) =>
          i.repo_owner.toLowerCase() === owner.toLowerCase() &&
          i.repo_name.toLowerCase() === repo.toLowerCase() &&
          i.validation_status !== 'UNLINKED'
      ) || null
    );
  }

  async saveIntegration(
    data: {
      projectId: string;
      integrationMode: 'LINK_EXISTING' | 'CREATE_NEW';
      repoOwner: string;
      repoName: string;
      repoFullName: string;
      githubRepoId: number;
      defaultBranch: string;
      installationId: number;
      visibility: 'public' | 'private' | 'internal';
      permissions: { push: boolean; pull: boolean; admin: boolean };
      validationStatus: GitHubValidationStatus;
      errorMessage?: string | null;
    },
    client?: pg.PoolClient | null
  ): Promise<GitHubIntegrationEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.github_integration (
          project_id, integration_mode, repo_owner, repo_name, repo_full_name,
          github_repo_id, default_branch, installation_id, visibility, permissions,
          validation_status, last_validated_at, validation_error_message, unlinked_at, unlinked_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, NOW(), $12, NULL, NULL
        )
        ON CONFLICT (project_id) DO UPDATE SET
          integration_mode = EXCLUDED.integration_mode,
          repo_owner = EXCLUDED.repo_owner,
          repo_name = EXCLUDED.repo_name,
          repo_full_name = EXCLUDED.repo_full_name,
          github_repo_id = EXCLUDED.github_repo_id,
          default_branch = EXCLUDED.default_branch,
          installation_id = EXCLUDED.installation_id,
          visibility = EXCLUDED.visibility,
          permissions = EXCLUDED.permissions,
          validation_status = EXCLUDED.validation_status,
          last_validated_at = NOW(),
          validation_error_message = EXCLUDED.validation_error_message,
          unlinked_at = NULL,
          unlinked_by = NULL,
          updated_at = NOW()
        RETURNING *;
      `;
      const params = [
        data.projectId,
        data.integrationMode,
        data.repoOwner,
        data.repoName,
        data.repoFullName,
        data.githubRepoId,
        data.defaultBranch || 'main',
        data.installationId,
        data.visibility,
        JSON.stringify(data.permissions),
        data.validationStatus,
        data.errorMessage || null,
      ];

      const res = client
        ? await client.query(sql, params)
        : await this.db.query<GitHubIntegrationEntity>(sql, params);
      return this.mapRow(res.rows[0]);
    }

    const existingIndex = this.mockIntegrations.findIndex((i) => i.project_id === data.projectId);
    const entity: GitHubIntegrationEntity = {
      id:
        existingIndex >= 0
          ? this.mockIntegrations[existingIndex].id
          : `git00001-${Date.now().toString(16).padStart(12, '0')}`,
      project_id: data.projectId,
      integration_mode: data.integrationMode,
      repo_owner: data.repoOwner,
      repo_name: data.repoName,
      repo_full_name: data.repoFullName,
      github_repo_id: data.githubRepoId,
      default_branch: data.defaultBranch || 'main',
      installation_id: data.installationId,
      visibility: data.visibility,
      permissions: data.permissions,
      validation_status: data.validationStatus,
      last_validated_at: new Date().toISOString(),
      validation_error_message: data.errorMessage || null,
      unlinked_at: null,
      unlinked_by: null,
      created_at:
        existingIndex >= 0
          ? this.mockIntegrations[existingIndex].created_at
          : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.mockIntegrations[existingIndex] = entity;
    } else {
      this.mockIntegrations.push(entity);
    }

    return entity;
  }

  async updateValidationStatus(
    id: string,
    status: GitHubValidationStatus,
    errorMessage?: string | null,
    client?: pg.PoolClient | null
  ): Promise<GitHubIntegrationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        UPDATE traceflow.github_integration
        SET validation_status = $2,
            last_validated_at = NOW(),
            validation_error_message = $3,
            updated_at = NOW()
        WHERE id = $1
        RETURNING *;
      `;
      const res = client
        ? await client.query(sql, [id, status, errorMessage || null])
        : await this.db.query<GitHubIntegrationEntity>(sql, [id, status, errorMessage || null]);
      return res.rows[0] ? this.mapRow(res.rows[0]) : null;
    }

    const item = this.mockIntegrations.find((i) => i.id === id);
    if (!item) return null;
    item.validation_status = status;
    item.last_validated_at = new Date().toISOString();
    item.validation_error_message = errorMessage || null;
    item.updated_at = new Date().toISOString();
    return item;
  }

  async unlinkIntegration(
    projectId: string,
    unlinkedBy: string,
    client?: pg.PoolClient | null
  ): Promise<GitHubIntegrationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        UPDATE traceflow.github_integration
        SET validation_status = 'UNLINKED',
            unlinked_at = NOW(),
            unlinked_by = $2,
            updated_at = NOW()
        WHERE project_id = $1
        RETURNING *;
      `;
      const res = client
        ? await client.query(sql, [projectId, unlinkedBy])
        : await this.db.query<GitHubIntegrationEntity>(sql, [projectId, unlinkedBy]);
      return res.rows[0] ? this.mapRow(res.rows[0]) : null;
    }

    const item = this.mockIntegrations.find((i) => i.project_id === projectId);
    if (!item) return null;
    item.validation_status = 'UNLINKED';
    item.unlinked_at = new Date().toISOString();
    item.unlinked_by = unlinkedBy;
    item.updated_at = new Date().toISOString();
    return item;
  }

  resetMockIntegrations(): void {
    this.mockIntegrations = [];
  }

  addMockInstallation(inst: OrganizationGitHubInstallationEntity): void {
    this.mockInstallations.push(inst);
  }

  resetMockInstallations(): void {
    this.mockInstallations = [
      {
        id: 'inst0001-0000-0000-0000-000000000001',
        organization_id: 'c0000001-0000-0000-0000-000000000001', // ORG-EXODO
        installation_id: 12345678,
        account_login: 'exodo-org',
        account_type: 'Organization',
        permissions: { contents: 'read', metadata: 'read', pull_requests: 'write' },
        status: 'ACTIVE',
        installed_at: '2026-11-26T00:00:00.000Z',
        updated_at: '2026-11-26T00:00:00.000Z',
      },
    ];
  }

  private mapEventRow(row: any): GitHubEventEntity {
    return {
      ...row,
      installation_id: Number(row.installation_id),
      github_repo_id: row.github_repo_id ? Number(row.github_repo_id) : null,
      attempts: Number(row.attempts),
      max_attempts: Number(row.max_attempts),
      correlation_status: row.correlation_status || 'NONE',
      locked_by: row.locked_by || null,
      claim_token: row.claim_token || null,
      locked_at: row.locked_at ? new Date(row.locked_at).toISOString() : null,
      lease_expires_at: row.lease_expires_at ? new Date(row.lease_expires_at).toISOString() : null,
    };
  }

  private mapPathHistoryRow(row: any): ConfigItemPathHistoryEntity {
    return {
      ...row,
      applied_to_ecs: Boolean(row.applied_to_ecs),
      status: row.status || 'PENDING',
    };
  }

  // ==========================================================================
  // H04B / H04B-R — GESTIÓN DE EVENTOS DE WEBHOOKS (traceflow.github_event)
  // ==========================================================================
  async saveEvent(
    data: {
      deliveryId: string;
      eventType: string;
      action?: string | null;
      installationId: number;
      githubRepoId?: number | null;
      projectId?: string | null;
      payload: any;
      status?: GitHubEventProcessingStatus;
      correlationStatus?: GitHubEventCorrelationStatus;
    },
    client?: pg.PoolClient | null
  ): Promise<GitHubEventEntity> {
    const status = data.status || 'PENDING';
    const correlationStatus = data.correlationStatus || 'NONE';
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.github_event (
          delivery_id, event_type, action, installation_id, github_repo_id, project_id, payload, processing_status, correlation_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9
        )
        ON CONFLICT (delivery_id) DO UPDATE SET
          last_attempt_at = NOW()
        RETURNING *;
      `;
      const params = [
        data.deliveryId,
        data.eventType,
        data.action || null,
        data.installationId,
        data.githubRepoId || null,
        data.projectId || null,
        JSON.stringify(data.payload),
        status,
        correlationStatus,
      ];
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<GitHubEventEntity>(sql, params);
      return this.mapEventRow(res.rows[0]);
    }

    const existing = this.mockEvents.find((e) => e.delivery_id === data.deliveryId);
    if (existing) {
      existing.last_attempt_at = new Date().toISOString();
      return existing;
    }

    const entity: GitHubEventEntity = {
      id: crypto.randomUUID(),
      delivery_id: data.deliveryId,
      event_type: data.eventType,
      action: data.action || null,
      installation_id: data.installationId,
      github_repo_id: data.githubRepoId || null,
      project_id: data.projectId || null,
      payload: data.payload,
      processing_status: status,
      correlation_status: correlationStatus,
      attempts: 0,
      max_attempts: 3,
      locked_by: null,
      locked_at: null,
      lease_expires_at: null,
      last_attempt_at: null,
      processed_at: null,
      error_message: null,
      created_at: new Date().toISOString(),
    };
    this.mockEvents.push(entity);
    return entity;
  }

  async findEventByDeliveryId(
    deliveryId: string,
    client?: pg.PoolClient | null
  ): Promise<GitHubEventEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.github_event WHERE delivery_id = $1 LIMIT 1;';
      const res = client
        ? await client.query(sql, [deliveryId])
        : await this.db.query<GitHubEventEntity>(sql, [deliveryId]);
      return res.rows[0] ? this.mapEventRow(res.rows[0]) : null;
    }

    return this.mockEvents.find((e) => e.delivery_id === deliveryId) || null;
  }

  async findEventById(
    id: string,
    client?: pg.PoolClient | null
  ): Promise<GitHubEventEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.github_event WHERE id = $1 LIMIT 1;';
      const res = client
        ? await client.query(sql, [id])
        : await this.db.query<GitHubEventEntity>(sql, [id]);
      return res.rows[0] ? this.mapEventRow(res.rows[0]) : null;
    }

    return this.mockEvents.find((e) => e.id === id) || null;
  }

  /**
   * H04B-R04 / H04B-C: Reclamo transaccional seguro de eventos utilizando FOR UPDATE SKIP LOCKED
   * con claim_token criptográfico, control de lease y concurrencia garantizada.
   */
  async claimEvents(
    workerId: string,
    limit: number = 10,
    leaseDurationSeconds: number = 30,
    client?: pg.PoolClient | null
  ): Promise<GitHubEventEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        WITH claimable AS (
          SELECT id
          FROM traceflow.github_event
          WHERE (processing_status = 'PENDING' AND attempts < max_attempts)
             OR (processing_status = 'PROCESSING' AND lease_expires_at < NOW() AND attempts < max_attempts)
          ORDER BY created_at ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        UPDATE traceflow.github_event e
        SET processing_status = 'PROCESSING',
            locked_by = $2,
            claim_token = gen_random_uuid(),
            locked_at = NOW(),
            lease_expires_at = NOW() + ($3 || ' seconds')::interval,
            attempts = e.attempts + 1,
            last_attempt_at = NOW()
        FROM claimable
        WHERE e.id = claimable.id
        RETURNING e.*;
      `;
      const res = client
        ? await client.query(sql, [limit, workerId, leaseDurationSeconds])
        : await this.db.query<GitHubEventEntity>(sql, [limit, workerId, leaseDurationSeconds]);
      return res.rows.map((r) => this.mapEventRow(r));
    }

    const now = Date.now();
    const claimable = this.mockEvents
      .filter((e) => {
        const isPending = e.processing_status === 'PENDING' && e.attempts < e.max_attempts && !e.locked_by;
        const isAbandoned =
          e.processing_status === 'PROCESSING' &&
          Boolean(e.lease_expires_at) &&
          new Date(e.lease_expires_at!).getTime() < now &&
          e.attempts < e.max_attempts;
        return isPending || isAbandoned;
      })
      .slice(0, limit);

    const leaseExpiry = new Date(now + leaseDurationSeconds * 1000).toISOString();
    for (const e of claimable) {
      e.processing_status = 'PROCESSING';
      e.locked_by = workerId;
      e.claim_token = crypto.randomUUID();
      e.locked_at = new Date(now).toISOString();
      e.lease_expires_at = leaseExpiry;
      e.attempts += 1;
      e.last_attempt_at = new Date(now).toISOString();
    }
    return claimable;
  }

  /**
   * H04B-R04 / H04B-C: Liberación atómica segura del evento con verificación estricta de propiedad
   * del lease (locked_by + claim_token). Si el lease expiró o fue transferido a otro trabajador,
   * la operación falla de manera segura retornando null.
   */
  async releaseEvent(
    id: string,
    status: GitHubEventProcessingStatus,
    workerId?: string | null,
    claimToken?: string | null,
    errorMessage?: string | null,
    correlationStatus?: GitHubEventCorrelationStatus,
    client?: pg.PoolClient | null
  ): Promise<GitHubEventEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const processedAtClause = status === 'PROCESSED' ? ', processed_at = NOW()' : '';
      const sql = `
        UPDATE traceflow.github_event
        SET processing_status = $2,
            error_message = $3,
            correlation_status = COALESCE($4, correlation_status),
            locked_by = NULL,
            claim_token = NULL,
            lease_expires_at = NULL
            ${processedAtClause}
        WHERE id = $1
          AND ($5::text IS NULL OR locked_by IS NULL OR locked_by = $5)
          AND ($6::uuid IS NULL OR claim_token IS NULL OR claim_token = $6)
        RETURNING *;
      `;
      const res = client
        ? await client.query(sql, [id, status, errorMessage || null, correlationStatus || null, workerId || null, claimToken || null])
        : await this.db.query<GitHubEventEntity>(sql, [id, status, errorMessage || null, correlationStatus || null, workerId || null, claimToken || null]);
      return res.rows[0] ? this.mapEventRow(res.rows[0]) : null;
    }

    const item = this.mockEvents.find((e) => e.id === id);
    if (!item) return null;
    if (workerId && item.locked_by && item.locked_by !== workerId) {
      return null;
    }
    if (claimToken && item.claim_token && item.claim_token !== claimToken) {
      return null;
    }
    item.processing_status = status;
    item.error_message = errorMessage || null;
    if (correlationStatus) {
      item.correlation_status = correlationStatus;
    }
    item.locked_by = null;
    item.claim_token = null;
    item.lease_expires_at = null;
    if (status === 'PROCESSED') {
      item.processed_at = new Date().toISOString();
    }
    return item;
  }

  /**
   * H04B-C: Libera todos los leases retenidos por un trabajador específico (graceful shutdown).
   */
  async releaseWorkerLeases(
    workerId: string,
    client?: pg.PoolClient | null
  ): Promise<number> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        UPDATE traceflow.github_event
        SET locked_by = NULL,
            claim_token = NULL,
            lease_expires_at = NULL,
            processing_status = 'PENDING'
        WHERE locked_by = $1 AND processing_status = 'PROCESSING';
      `;
      const res = client
        ? await client.query(sql, [workerId])
        : await this.db.query(sql, [workerId]);
      return res.rowCount || 0;
    }

    let count = 0;
    for (const item of this.mockEvents) {
      if (item.locked_by === workerId && item.processing_status === 'PROCESSING') {
        item.locked_by = null;
        item.claim_token = null;
        item.lease_expires_at = null;
        item.processing_status = 'PENDING';
        count++;
      }
    }
    return count;
  }

  async findPendingEvents(
    limit: number = 10,
    client?: pg.PoolClient | null
  ): Promise<GitHubEventEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT * FROM traceflow.github_event
        WHERE processing_status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT $1;
      `;
      const res = client
        ? await client.query(sql, [limit])
        : await this.db.query<GitHubEventEntity>(sql, [limit]);
      return res.rows.map((r) => this.mapEventRow(r));
    }

    return this.mockEvents
      .filter((e) => e.processing_status === 'PENDING')
      .slice(0, limit);
  }

  async updateEventStatus(
    id: string,
    status: GitHubEventProcessingStatus,
    errorMessage?: string | null,
    client?: pg.PoolClient | null
  ): Promise<GitHubEventEntity | null> {
    return this.releaseEvent(id, status, null, null, errorMessage, undefined, client);
  }

  async incrementEventAttempts(
    id: string,
    errorMessage?: string | null,
    client?: pg.PoolClient | null
  ): Promise<GitHubEventEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        UPDATE traceflow.github_event
        SET attempts = attempts + 1,
            last_attempt_at = NOW(),
            error_message = $2,
            locked_by = NULL,
            lease_expires_at = NULL,
            processing_status = CASE WHEN attempts + 1 >= max_attempts THEN 'FAILED' ELSE 'PENDING' END
        WHERE id = $1
        RETURNING *;
      `;
      const res = client
        ? await client.query(sql, [id, errorMessage || null])
        : await this.db.query<GitHubEventEntity>(sql, [id, errorMessage || null]);
      return res.rows[0] ? this.mapEventRow(res.rows[0]) : null;
    }

    const item = this.mockEvents.find((e) => e.id === id);
    if (!item) return null;
    item.attempts += 1;
    item.last_attempt_at = new Date().toISOString();
    item.error_message = errorMessage || null;
    item.locked_by = null;
    item.lease_expires_at = null;
    if (item.attempts >= item.max_attempts) {
      item.processing_status = 'FAILED';
    } else {
      item.processing_status = 'PENDING';
    }
    return item;
  }

  // ==========================================================================
  // H04B / H04B-R — HISTORIAL DE RUTAS DE ECS (traceflow.config_item_path_history)
  // ==========================================================================
  async recordPathChange(
    data: {
      configItemId: string;
      projectId: string;
      oldPath: string;
      newPath: string;
      changeType: ConfigItemPathHistoryChangeType;
      gitCommitSha: string;
      appliedToEcs?: boolean;
      status?: ConfigItemPathHistoryStatus;
    },
    client?: pg.PoolClient | null
  ): Promise<ConfigItemPathHistoryEntity> {
    const applied = Boolean(data.appliedToEcs);
    const status = data.status || (applied ? 'APPLIED' : 'PENDING');
    const appliedAt = applied ? new Date().toISOString() : null;

    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.config_item_path_history (
          config_item_id, project_id, old_path, new_path, change_type, git_commit_sha,
          applied_to_ecs, applied_at, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        ON CONFLICT (config_item_id, git_commit_sha, change_type) DO UPDATE SET
          applied_to_ecs = EXCLUDED.applied_to_ecs,
          applied_at = COALESCE(EXCLUDED.applied_at, traceflow.config_item_path_history.applied_at),
          status = EXCLUDED.status
        RETURNING *;
      `;
      const params = [
        data.configItemId,
        data.projectId,
        data.oldPath,
        data.newPath,
        data.changeType,
        data.gitCommitSha,
        applied,
        appliedAt,
        status,
      ];
      const res = client
        ? await client.query(sql, params)
        : await this.db.query<ConfigItemPathHistoryEntity>(sql, params);
      return this.mapPathHistoryRow(res.rows[0]);
    }

    const existing = this.mockPathHistories.find(
      (h) =>
        h.config_item_id === data.configItemId &&
        h.git_commit_sha === data.gitCommitSha &&
        h.change_type === data.changeType
    );
    if (existing) {
      existing.applied_to_ecs = applied;
      existing.applied_at = appliedAt || existing.applied_at;
      existing.status = status;
      return existing;
    }

    const entity: ConfigItemPathHistoryEntity = {
      id: crypto.randomUUID(),
      config_item_id: data.configItemId,
      project_id: data.projectId,
      old_path: data.oldPath,
      new_path: data.newPath,
      change_type: data.changeType,
      git_commit_sha: data.gitCommitSha,
      applied_to_ecs: applied,
      applied_at: appliedAt,
      status,
      detected_at: new Date().toISOString(),
    };
    this.mockPathHistories.push(entity);
    return entity;
  }

  async findPathHistoryByConfigItemId(
    configItemId: string,
    client?: pg.PoolClient | null
  ): Promise<ConfigItemPathHistoryEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT * FROM traceflow.config_item_path_history
        WHERE config_item_id = $1
        ORDER BY detected_at DESC;
      `;
      const res = client
        ? await client.query(sql, [configItemId])
        : await this.db.query<ConfigItemPathHistoryEntity>(sql, [configItemId]);
      return res.rows.map((r) => this.mapPathHistoryRow(r));
    }

    return this.mockPathHistories.filter((h) => h.config_item_id === configItemId);
  }

  async findPathHistoryByProjectId(
    projectId: string,
    client?: pg.PoolClient | null
  ): Promise<ConfigItemPathHistoryEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT * FROM traceflow.config_item_path_history
        WHERE project_id = $1
        ORDER BY detected_at DESC;
      `;
      const res = client
        ? await client.query(sql, [projectId])
        : await this.db.query<ConfigItemPathHistoryEntity>(sql, [projectId]);
      return res.rows.map((r) => this.mapPathHistoryRow(r));
    }

    return this.mockPathHistories.filter((h) => h.project_id === projectId);
  }

  // ==========================================================================
  // H04B — INTEGRACIÓN CON ELEMENTOS DE CONFIGURACIÓN (traceflow.config_item)
  // ==========================================================================
  async findConfigItemByPath(
    projectId: string,
    filePath: string,
    client?: pg.PoolClient | null
  ): Promise<any | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT * FROM traceflow.config_item
        WHERE project_id = $1 AND file_path = $2
        LIMIT 1;
      `;
      const res = client
        ? await client.query(sql, [projectId, filePath])
        : await this.db.query(sql, [projectId, filePath]);
      return res.rows[0] || null;
    }

    return (
      this.mockConfigItems.find(
        (c) => c.project_id === projectId && c.file_path === filePath
      ) || null
    );
  }

  async findConfigItemsByProject(
    projectId: string,
    client?: pg.PoolClient | null
  ): Promise<any[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT * FROM traceflow.config_item
        WHERE project_id = $1
        ORDER BY code ASC;
      `;
      const res = client
        ? await client.query(sql, [projectId])
        : await this.db.query(sql, [projectId]);
      return res.rows;
    }

    return this.mockConfigItems.filter((c) => c.project_id === projectId);
  }

  async createConfigItem(
    data: any,
    client?: pg.PoolClient | null
  ): Promise<any> {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const item = {
      id,
      project_id: data.project_id,
      code: data.code,
      name: data.name,
      description: data.description || null,
      item_type: data.item_type || 'SOURCE_CODE',
      current_library: data.current_library || 'TRABAJO',
      current_version: data.current_version || '1.0.0',
      file_path: data.file_path,
      sha256_checksum: data.sha256_checksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      is_locked: data.is_locked ?? false,
      author_id: data.author_id || null,
      created_at: now,
      updated_at: now,
    };

    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.config_item (
          id, project_id, code, name, description, item_type, current_library,
          current_version, file_path, sha256_checksum, is_locked, author_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        RETURNING *;
      `;
      const res = client
        ? await client.query(sql, [
            item.id,
            item.project_id,
            item.code,
            item.name,
            item.description,
            item.item_type,
            item.current_library,
            item.current_version,
            item.file_path,
            item.sha256_checksum,
            item.is_locked,
            item.author_id,
          ])
        : await this.db.query(sql, [
            item.id,
            item.project_id,
            item.code,
            item.name,
            item.description,
            item.item_type,
            item.current_library,
            item.current_version,
            item.file_path,
            item.sha256_checksum,
            item.is_locked,
            item.author_id,
          ]);
      return res.rows[0];
    }

    this.mockConfigItems.push(item);
    return item;
  }

  async updateConfigItemPath(
    configItemId: string,
    newPath: string,
    client?: pg.PoolClient | null
  ): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        UPDATE traceflow.config_item
        SET file_path = $2,
            updated_at = NOW()
        WHERE id = $1;
      `;
      if (client) {
        await client.query(sql, [configItemId, newPath]);
      } else {
        await this.db.query(sql, [configItemId, newPath]);
      }
      return;
    }

    const item = this.mockConfigItems.find((c) => c.id === configItemId);
    if (item) {
      item.file_path = newPath;
      item.updated_at = new Date().toISOString();
    }
  }

  // ==========================================================================
  // H04B-R01 / H04B-R02 — VERIFICACIÓN FORMAL DE GOBERNANZA SCM
  // ==========================================================================
  async verifyScmChangeAuthorization(
    projectId: string,
    commitSha: string,
    commitMessage: string,
    changedFilePaths: string[],
    authorEmail?: string,
    client?: pg.PoolClient | null
  ): Promise<{
    authorized: boolean;
    rfcId?: string;
    rfcCode?: string;
    changeOrderId?: string;
    configItemId?: string;
    reason: string;
    status: GitHubEventCorrelationStatus;
  }> {
    const rfcMatch = commitMessage.match(/\b(RFC-\d{4}-\d{4}|RFC-\d+)\b/i);
    const ecnMatch = commitMessage.match(/\b(ECN-\d{4}-\d{4}|ECN-\d+)\b/i);
    const code = (rfcMatch?.[1] || ecnMatch?.[1] || '').toUpperCase();

    if (!code) {
      return {
        authorized: false,
        reason: 'El commit no contiene ninguna referencia identificable a RFC o ECN en su mensaje o metadatos.',
        status: 'OUT_OF_BAND',
      };
    }

    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        SELECT
          r.id AS rfc_id,
          r.code AS rfc_code,
          r.project_id AS rfc_project_id,
          p.code AS project_code,
          r.status AS rfc_status,
          r.requested_by,
          r.target_ecs_id,
          co.id AS change_order_id,
          co.code AS change_order_code,
          co.status AS change_order_status,
          co.assigned_developer_id,
          ci.id AS config_item_id,
          ci.code AS config_item_code,
          ci.file_path AS config_item_file_path,
          sl.id AS sync_lock_id,
          sl.status AS sync_lock_status
        FROM traceflow.change_request r
        JOIN traceflow.project p ON p.id = r.project_id
        LEFT JOIN traceflow.change_order co ON co.rfc_id = r.id AND co.status IN ('EMITIDA', 'EN_EJECUCION')
        LEFT JOIN traceflow.config_item ci ON ci.id = r.target_ecs_id
        LEFT JOIN traceflow.sync_lock sl ON sl.change_order_id = co.id AND sl.status = 'ACTIVE'
        WHERE (UPPER(r.code) = $1 OR UPPER(co.code) = $1)
        LIMIT 1;
      `;
      const res = client
        ? await client.query(sql, [code])
        : await this.db.query(sql, [code]);

      if (res.rows.length === 0) {
        return {
          authorized: false,
          reason: `La solicitud o expediente SCM referenciado ('${code}') no existe en el sistema.`,
          status: 'OUT_OF_BAND',
        };
      }

      const row = res.rows[0];

      // Comprobar pertenencia al proyecto
      if (row.rfc_project_id !== projectId && row.project_code !== projectId) {
        return {
          authorized: false,
          rfcId: row.rfc_id,
          rfcCode: row.rfc_code,
          reason: `Violación de aislamiento interproyecto: La RFC '${row.rfc_code}' pertenece al proyecto '${row.project_code || row.rfc_project_id}', no al proyecto '${projectId}'.`,
          status: 'RECHAZADO',
        };
      }

      // Comprobar estado formal de aprobación
      const validStatuses = ['AUTORIZADA', 'ORDEN_EMITIDA', 'EN_EJECUCION', 'EN_IMPLEMENTACION'];
      if (!validStatuses.includes(row.rfc_status)) {
        return {
          authorized: false,
          rfcId: row.rfc_id,
          rfcCode: row.rfc_code,
          reason: `La RFC '${row.rfc_code}' se encuentra en estado '${row.rfc_status}' y no cuenta con aprobación formal para implementación.`,
          status: 'RECHAZADO',
        };
      }

      // Comprobar existencia de Orden de Cambio activa
      if (!row.change_order_id) {
        return {
          authorized: false,
          rfcId: row.rfc_id,
          rfcCode: row.rfc_code,
          reason: `La RFC '${row.rfc_code}' no dispone de una Orden de Cambio (ECN) válida en ejecución para habilitar cambios en el repositorio.`,
          status: 'PENDIENTE_DE_CORRELACION',
        };
      }

      // H04B-C: Comprobar bloqueo sync_lock activo coherente con la ECN y el ECS
      if (!row.sync_lock_id || row.sync_lock_status !== 'ACTIVE') {
        return {
          authorized: false,
          rfcId: row.rfc_id,
          rfcCode: row.rfc_code,
          changeOrderId: row.change_order_id,
          configItemId: row.config_item_id,
          reason: `La RFC '${row.rfc_code}' y Orden de Cambio '${row.change_order_code || row.change_order_id}' no disponen de un bloqueo sync_lock activo para el ECS.`,
          status: 'PENDIENTE_DE_CORRELACION',
        };
      }

      // H04B-C: Comprobar identidad del ejecutor y rol activo en el proyecto
      if (authorEmail) {
        const userSql = `
          SELECT u.id, u.email, u.username, u.status,
            (SELECT COUNT(*) FROM traceflow.project_team_role ptr
             JOIN traceflow.app_role ar ON ar.id = ptr.role_id
             WHERE ptr.user_id = u.id
               AND (ptr.project_id::text = $2::text OR ptr.project_id::text = (SELECT id::text FROM traceflow.project WHERE code = $2::text OR id::text = $2::text LIMIT 1))
               AND ptr.status = 'ACTIVE'
               AND ar.code IN ('PU-06', 'PU-02', 'PU-03', 'PU-05')) AS team_role_count
          FROM traceflow.app_user u
          WHERE (LOWER(u.email) = LOWER($1) OR LOWER(u.username) = LOWER($1))
            AND u.status = 'ACTIVE'
          LIMIT 1;
        `;
        const userRes = client
          ? await client.query(userSql, [authorEmail, projectId])
          : await this.db.query(userSql, [authorEmail, projectId]);

        if (userRes.rows.length === 0) {
          return {
            authorized: false,
            rfcId: row.rfc_id,
            rfcCode: row.rfc_code,
            reason: `El autor del commit ('${authorEmail}') no corresponde a ningún usuario activo verificado en TraceFlow.`,
            status: 'RECHAZADO',
          };
        }

        const authorUser = userRes.rows[0];
        const isAssignedDev = authorUser.id === row.assigned_developer_id;
        const hasTeamRole = Number(authorUser.team_role_count) > 0;
        if (!isAssignedDev && !hasTeamRole) {
          return {
            authorized: false,
            rfcId: row.rfc_id,
            rfcCode: row.rfc_code,
            reason: `El autor del commit ('${authorEmail}') no cuenta con rol de desarrollo ni asignación técnica activa en el proyecto '${projectId}'.`,
            status: 'RECHAZADO',
          };
        }
      }

      // H04B-C: Comprobar correspondencia de archivos modificados con el ECS objetivo de la ECN
      if (row.config_item_id && changedFilePaths && changedFilePaths.length > 0) {
        const ecsSql = `
          SELECT id, code, file_path FROM traceflow.config_item
          WHERE (project_id::text = $1::text OR project_id::text = (SELECT id::text FROM traceflow.project WHERE code = $1::text OR id::text = $1::text LIMIT 1))
            AND file_path = ANY($2::text[]);
        `;
        const ecsRes = client
          ? await client.query(ecsSql, [projectId, changedFilePaths])
          : await this.db.query(ecsSql, [projectId, changedFilePaths]);

        if (ecsRes.rows.length > 0 && !ecsRes.rows.some((ci: any) => ci.id === row.config_item_id)) {
          return {
            authorized: false,
            rfcId: row.rfc_id,
            rfcCode: row.rfc_code,
            changeOrderId: row.change_order_id,
            configItemId: row.config_item_id,
            reason: `Discrepancia de ECS: La Orden de Cambio está emitida para el ECS '${row.config_item_code || row.config_item_id}', pero el commit modifica el ECS '${ecsRes.rows[0].code}'.`,
            status: 'RECHAZADO',
          };
        }
      }

      return {
        authorized: true,
        rfcId: row.rfc_id,
        rfcCode: row.rfc_code,
        changeOrderId: row.change_order_id,
        configItemId: row.config_item_id,
        reason: `Cambio validado formalmente contra persistencia SCM (RFC: ${row.rfc_code}, ECN: ${row.change_order_code || row.change_order_id}).`,
        status: 'AUTORIZADO',
      };
    }

    // Modo Mock
    let matchedRfc = this.mockRfcs.find(
      (r) =>
        (r.code?.toUpperCase() === code || r.id === code) &&
        (r.project_id === projectId || (projectId === 'b0000001-0000-0000-0000-000000000001' && r.project_id === 'PRJ-001'))
    );
    let matchedCo = this.mockChangeOrders.find((c) => c.code?.toUpperCase() === code || c.rfc_id === matchedRfc?.id);

    if (!matchedRfc && !matchedCo) {
      matchedRfc = this.mockRfcs.find((r) => r.code?.toUpperCase() === code || r.id === code);
      matchedCo = this.mockChangeOrders.find((c) => c.code?.toUpperCase() === code || c.rfc_id === matchedRfc?.id);
    }

    if (!matchedRfc && !matchedCo) {
      return {
        authorized: false,
        reason: `El expediente SCM '${code}' no existe en la persistencia del sistema.`,
        status: 'OUT_OF_BAND',
      };
    }

    if (!matchedRfc) {
      matchedRfc = this.mockRfcs.find((r) => r.id === matchedCo?.rfc_id);
    }
    if (!matchedRfc) {
      return {
        authorized: false,
        reason: `No se encontró RFC vinculada a la orden '${code}'.`,
        status: 'OUT_OF_BAND',
      };
    }

    const isProjectMatch =
      matchedRfc.project_id === projectId ||
      (projectId === 'b0000001-0000-0000-0000-000000000001' && matchedRfc.project_id === 'PRJ-001');

    if (!isProjectMatch) {
      return {
        authorized: false,
        rfcId: matchedRfc.id,
        rfcCode: matchedRfc.code,
        reason: `Violación de aislamiento interproyecto: La RFC '${matchedRfc.code}' pertenece a otro proyecto.`,
        status: 'RECHAZADO',
      };
    }

    const validStatuses = ['AUTORIZADA', 'ORDEN_EMITIDA', 'EN_EJECUCION', 'EN_IMPLEMENTACION'];
    if (!validStatuses.includes(matchedRfc.status)) {
      return {
        authorized: false,
        rfcId: matchedRfc.id,
        rfcCode: matchedRfc.code,
        reason: `La RFC '${matchedRfc.code}' no está aprobada (estado: ${matchedRfc.status}).`,
        status: 'RECHAZADO',
      };
    }

    matchedCo = matchedCo || this.mockChangeOrders.find((c) => c.rfc_id === matchedRfc.id && ['EMITIDA', 'EN_EJECUCION'].includes(c.status));
    if (!matchedCo) {
      return {
        authorized: false,
        rfcId: matchedRfc.id,
        rfcCode: matchedRfc.code,
        reason: `La RFC '${matchedRfc.code}' no tiene una orden de cambio activa.`,
        status: 'PENDIENTE_DE_CORRELACION',
      };
    }

    // H04B-C: Comprobar bloqueo sync_lock activo coherente con la ECN y el ECS
    const activeLock = this.mockSyncLocks.find((l) => l.change_order_id === matchedCo.id && l.status === 'ACTIVE');
    if (!activeLock) {
      return {
        authorized: false,
        rfcId: matchedRfc.id,
        rfcCode: matchedRfc.code,
        changeOrderId: matchedCo.id,
        configItemId: matchedCo.ecs_id || matchedRfc.target_ecs_id,
        reason: `La RFC '${matchedRfc.code}' y Orden de Cambio '${matchedCo.code || matchedCo.id}' no disponen de un bloqueo sync_lock activo para el ECS.`,
        status: 'PENDIENTE_DE_CORRELACION',
      };
    }

    // H04B-C: Comprobar identidad del ejecutor y rol activo en el proyecto
    if (authorEmail) {
      const authorUser = this.mockUsers.find(
        (u) =>
          u.status === 'ACTIVE' &&
          (u.email.toLowerCase() === authorEmail.toLowerCase() || u.username.toLowerCase() === authorEmail.toLowerCase())
      );
      if (!authorUser) {
        return {
          authorized: false,
          rfcId: matchedRfc.id,
          rfcCode: matchedRfc.code,
          reason: `El autor del commit ('${authorEmail}') no corresponde a ningún usuario activo verificado en TraceFlow.`,
          status: 'RECHAZADO',
        };
      }

      const isAssignedDev = authorUser.id === matchedCo.assigned_developer_id;
      const projectRoles = authorUser.projectRoles?.[projectId] || authorUser.projectRoles?.['PRJ-001'] || authorUser.assigned_role_codes || [];
      const hasTeamRole = projectRoles.some((r: string) => ['PU-06', 'PU-02', 'PU-03', 'PU-05'].includes(r));
      if (!isAssignedDev && !hasTeamRole) {
        return {
          authorized: false,
          rfcId: matchedRfc.id,
          rfcCode: matchedRfc.code,
          reason: `El autor del commit ('${authorEmail}') no cuenta con asignación activa de desarrollo en el proyecto.`,
          status: 'RECHAZADO',
        };
      }
    }

    // H04B-C: Comprobar correspondencia de archivos modificados con el ECS objetivo de la ECN
    if (matchedCo.ecs_id && changedFilePaths && changedFilePaths.length > 0) {
      const matchesAuthEcs = this.mockConfigItems.some(
        (c) =>
          (c.project_id === projectId || (projectId === 'b0000001-0000-0000-0000-000000000001' && c.project_id === 'PRJ-001')) &&
          changedFilePaths.includes(c.file_path) &&
          c.id === matchedCo.ecs_id
      );
      if (!matchesAuthEcs) {
        const otherEcs = this.mockConfigItems.find(
          (c) =>
            (c.project_id === projectId || (projectId === 'b0000001-0000-0000-0000-000000000001' && c.project_id === 'PRJ-001')) &&
            changedFilePaths.includes(c.file_path) &&
            c.id !== matchedCo.ecs_id
        );
        if (otherEcs) {
          return {
            authorized: false,
            rfcId: matchedRfc.id,
            rfcCode: matchedRfc.code,
            changeOrderId: matchedCo.id,
            configItemId: matchedCo.ecs_id,
            reason: `Discrepancia de ECS: La Orden de Cambio está emitida para el ECS '${matchedCo.ecs_id}', pero el commit modifica el ECS '${otherEcs.code || otherEcs.id}'.`,
            status: 'RECHAZADO',
          };
        }
      }
    }

    return {
      authorized: true,
      rfcId: matchedRfc.id,
      rfcCode: matchedRfc.code,
      changeOrderId: matchedCo.id,
      configItemId: matchedCo.ecs_id || matchedRfc.target_ecs_id,
      reason: `Cambio validado formalmente contra persistencia SCM (RFC: ${matchedRfc.code}).`,
      status: 'AUTORIZADO',
    };
  }

  // ==========================================================================
  // H04B-R07 — GESTIÓN DE ACCESOS, REVOCACIONES Y CICLO DE VIDA DE INSTALACIÓN
  // ==========================================================================
  async findInstallationByInstallationId(
    installationId: number,
    client?: pg.PoolClient | null
  ): Promise<OrganizationGitHubInstallationEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = 'SELECT * FROM traceflow.organization_github_installation WHERE installation_id = $1 LIMIT 1;';
      const res = client
        ? await client.query(sql, [installationId])
        : await this.db.query(sql, [installationId]);
      return res.rows[0] ? this.mapInstallationRow(res.rows[0]) : null;
    }

    return this.mockInstallations.find((i) => i.installation_id === installationId) || null;
  }

  async updateInstallationStatus(
    installationId: number,
    status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'DELETED',
    client?: pg.PoolClient | null
  ): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        UPDATE traceflow.organization_github_installation
        SET status = $2,
            updated_at = NOW()
        WHERE installation_id = $1;
      `;
      if (client) {
        await client.query(sql, [installationId, status]);
      } else {
        await this.db.query(sql, [installationId, status]);
      }
      return;
    }

    for (const inst of this.mockInstallations) {
      if (inst.installation_id === installationId) {
        inst.status = status;
        inst.updated_at = new Date().toISOString();
      }
    }
  }

  async updateIntegrationsByInstallationId(
    installationId: number,
    status: GitHubValidationStatus,
    errorMessage?: string | null,
    client?: pg.PoolClient | null
  ): Promise<string[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        UPDATE traceflow.github_integration
        SET validation_status = $2,
            validation_error_message = $3,
            updated_at = NOW()
        WHERE installation_id = $1
        RETURNING project_id;
      `;
      const res = client
        ? await client.query(sql, [installationId, status, errorMessage || null])
        : await this.db.query(sql, [installationId, status, errorMessage || null]);
      return res.rows.map((r: any) => r.project_id);
    }

    const affected: string[] = [];
    for (const integ of this.mockIntegrations) {
      if (integ.installation_id === installationId) {
        integ.validation_status = status;
        integ.validation_error_message = errorMessage || null;
        integ.updated_at = new Date().toISOString();
        affected.push(integ.project_id);
      }
    }
    return affected;
  }

  async updateIntegrationStatusByRepoId(
    repoId: number,
    status: GitHubValidationStatus,
    errorMessage?: string | null,
    client?: pg.PoolClient | null
  ): Promise<string | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        UPDATE traceflow.github_integration
        SET validation_status = $2,
            validation_error_message = $3,
            updated_at = NOW()
        WHERE github_repo_id = $1
        RETURNING project_id;
      `;
      const res = client
        ? await client.query(sql, [repoId, status, errorMessage || null])
        : await this.db.query(sql, [repoId, status, errorMessage || null]);
      return res.rows[0]?.project_id || null;
    }

    const item = this.mockIntegrations.find((i) => i.github_repo_id === repoId);
    if (!item) return null;
    item.validation_status = status;
    item.validation_error_message = errorMessage || null;
    item.updated_at = new Date().toISOString();
    return item.project_id;
  }

  async setProjectGithubCompleted(
    projectId: string,
    completed: boolean,
    client?: pg.PoolClient | null
  ): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        UPDATE traceflow.project_setup s
        SET github_completed = $2,
            updated_at = NOW()
        FROM traceflow.project p
        WHERE (s.project_id = p.id) AND (p.id::text = $1 OR p.code = $1 OR s.project_id::text = $1);
      `;
      if (client) {
        await client.query(sql, [projectId, completed]);
      } else {
        await this.db.query(sql, [projectId, completed]);
      }
      return;
    }
  }

  addMockRfc(rfc: any): void {
    this.mockRfcs.push(rfc);
  }

  addMockChangeOrder(order: any): void {
    this.mockChangeOrders.push(order);
  }

  addMockSyncLock(lock: any): void {
    this.mockSyncLocks.push(lock);
  }

  resetMockScmData(): void {
    this.mockRfcs = [
      {
        id: 'd0000001-0000-0000-0000-000000000001',
        code: 'RFC-2026-0001',
        project_id: 'PRJ-001',
        status: 'AUTORIZADA',
        target_ecs_id: 'c0000001-0000-0000-0000-000000000001',
        requested_by: 'a0000001-0000-0000-0000-000000000001',
      },
      {
        id: 'd0000001-0000-0000-0000-000000000002',
        code: 'RFC-2026-0002',
        project_id: 'PRJ-001',
        status: 'REGISTRADA',
        target_ecs_id: 'c0000001-0000-0000-0000-000000000001',
        requested_by: 'a0000001-0000-0000-0000-000000000001',
      },
      {
        id: 'd0000001-0000-0000-0000-000000000003',
        code: 'RFC-2026-0003',
        project_id: 'PRJ-002',
        status: 'AUTORIZADA',
        target_ecs_id: 'c0000001-0000-0000-0000-000000000005',
        requested_by: 'a0000001-0000-0000-0000-000000000004',
      },
    ];
    this.mockChangeOrders = [
      {
        id: 'e0000001-0000-0000-0000-000000000001',
        code: 'ECN-2026-0001',
        rfc_id: 'd0000001-0000-0000-0000-000000000001',
        ecs_id: 'c0000001-0000-0000-0000-000000000001',
        status: 'EMITIDA',
        issued_by: 'a0000001-0000-0000-0000-000000000001',
        assigned_developer_id: 'a0000001-0000-0000-0000-000000000002',
      },
    ];
    this.mockSyncLocks = [
      {
        id: 'f0000001-0000-0000-0000-000000000001',
        ecs_id: 'c0000001-0000-0000-0000-000000000001',
        change_order_id: 'e0000001-0000-0000-0000-000000000001',
        locked_by: 'a0000001-0000-0000-0000-000000000002',
        status: 'ACTIVE',
      },
    ];
  }

  resetMockEvents(): void {
    this.mockEvents = [];
  }

  resetMockPathHistories(): void {
    this.mockPathHistories = [];
  }

  resetMockConfigItems(): void {
    this.mockConfigItems = [];
  }
}
