import { Injectable, Inject } from '@nestjs/common';
import pg from 'pg';
import { DatabaseService } from '../../database/database.service.js';
import type {
  GitHubIntegrationEntity,
  GitHubValidationStatus,
  OrganizationGitHubInstallationEntity,
} from './github.entity.js';

@Injectable()
export class GitHubRepository {
  private mockIntegrations: GitHubIntegrationEntity[] = [];
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
      permissions?: Record<string, string>;
      status?: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
    },
    client?: pg.PoolClient | null
  ): Promise<OrganizationGitHubInstallationEntity> {
    const status = data.status || 'ACTIVE';
    const permissions = data.permissions || {
      contents: 'read',
      metadata: 'read',
      pull_requests: 'write',
    };

    if (this.db.getDatabaseMode() === 'postgres') {
      const sql = `
        INSERT INTO traceflow.organization_github_installation (
          organization_id, installation_id, account_login, account_type, permissions, status
        ) VALUES (
          $1, $2, $3, $4, $5::jsonb, $6
        )
        ON CONFLICT (organization_id, installation_id) DO UPDATE SET
          account_login = EXCLUDED.account_login,
          account_type = EXCLUDED.account_type,
          permissions = EXCLUDED.permissions,
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING *;
      `;
      const params = [
        data.organizationId,
        data.installationId,
        data.accountLogin,
        data.accountType,
        JSON.stringify(permissions),
        status,
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
      permissions,
      status,
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
}
