/**
 * TraceFlow SCM — Entidades y Tipos de Integración GitHub (INIT-H04A)
 * Normativa: ADR-011, IEEE 828, DA-03, DA-04
 */

export type GitHubIntegrationMode = 'LINK_EXISTING' | 'CREATE_NEW';

export type GitHubValidationStatus =
  | 'UNVALIDATED'
  | 'VALIDATED'
  | 'INVALID_CREDENTIALS'
  | 'REPO_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'REVOKED'
  | 'UNLINKED';

export type GitHubRepoVisibility = 'public' | 'private' | 'internal';

export interface GitHubRepoPermissions {
  push: boolean;
  pull: boolean;
  admin: boolean;
}

export interface GitHubIntegrationEntity {
  id: string;
  project_id: string;
  integration_mode: GitHubIntegrationMode;
  repo_owner: string;
  repo_name: string;
  repo_full_name: string;
  github_repo_id: number;
  default_branch: string;
  installation_id: number;
  visibility: GitHubRepoVisibility;
  permissions: GitHubRepoPermissions;
  validation_status: GitHubValidationStatus;
  last_validated_at: string | null;
  validation_error_message?: string | null;
  unlinked_at?: string | null;
  unlinked_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepoDetails {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    type: string;
  };
  private: boolean;
  default_branch: string;
  visibility: GitHubRepoVisibility;
  permissions: GitHubRepoPermissions;
  html_url: string;
  description?: string | null;
}

export interface OrganizationGitHubInstallationEntity {
  id: string;
  organization_id: string;
  installation_id: number;
  account_login: string;
  account_type: 'Organization' | 'User';
  target_id?: number | null;
  permissions: Record<string, string>;
  repository_selection?: 'all' | 'selected';
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  installed_by?: string | null;
  installed_at: string;
  updated_at: string;
}

export interface GitHubInstallationDetails {
  id: number;
  account: {
    login: string;
    id?: number;
    type?: 'Organization' | 'User';
  };
  repository_selection?: 'all' | 'selected';
  permissions?: Record<string, string>;
  html_url?: string;
  app_id?: number;
  target_type?: string;
}

// ============================================================================
// H04B — TIPOS Y ENTIDADES DE WEBHOOKS Y SINCRONIZACIÓN GIT (DA-01, ADR-011)
// ============================================================================

export type GitHubEventProcessingStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';

export interface GitHubEventEntity {
  id: string;
  delivery_id: string;
  event_type: string;
  action?: string | null;
  installation_id: number;
  github_repo_id?: number | null;
  project_id?: string | null;
  payload: any;
  processing_status: GitHubEventProcessingStatus;
  attempts: number;
  max_attempts: number;
  last_attempt_at?: string | null;
  processed_at?: string | null;
  error_message?: string | null;
  created_at: string;
}

export type ConfigItemPathHistoryChangeType = 'RENAME' | 'MOVE' | 'DELETE';

export interface ConfigItemPathHistoryEntity {
  id: string;
  config_item_id: string;
  project_id: string;
  old_path: string;
  new_path: string;
  change_type: ConfigItemPathHistoryChangeType;
  git_commit_sha: string;
  detected_at: string;
}

export interface GitHubCommitFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed' | string;
  previous_filename?: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface GitHubCommitDetails {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  files: GitHubCommitFile[];
}

