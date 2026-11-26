import { Injectable, Inject } from '@nestjs/common';
import pg from 'pg';
import { DatabaseService } from '../../database/database.service.js';
import type {
  GitHubIntegrationEntity,
  GitHubValidationStatus,
} from './github.entity.js';

@Injectable()
export class GitHubRepository {
  private mockIntegrations: GitHubIntegrationEntity[] = [];

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  private mapRow(row: any): GitHubIntegrationEntity {
    return {
      ...row,
      github_repo_id: Number(row.github_repo_id),
      installation_id: Number(row.installation_id),
    };
  }

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
      id: existingIndex >= 0 ? this.mockIntegrations[existingIndex].id : `git00001-${Date.now().toString(16).padStart(12, '0')}`,
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
      created_at: existingIndex >= 0 ? this.mockIntegrations[existingIndex].created_at : new Date().toISOString(),
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
}
