-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL HITO INIT-H04A
-- Archivo: 202611260003_init_h04a_github_integration.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- ALCANCE:
--  1. Creación de tabla traceflow.github_integration para la vinculación y
--     verificación de repositorios remotos GitHub (ADR-011, DA-03, DA-04).
--  2. Restricción de unicidad para repositorios activos vinculados
--     (uq_active_github_repo: previene colisiones inter-proyectos).
--  3. Mínimo privilegio para traceflow_app (SELECT, INSERT, UPDATE permitidos;
--     DELETE estrictamente revocado).
--  4. Desvinculación lógica mediante estado 'UNLINKED' y auditoría.
-- ============================================================================

BEGIN;

-- 1. TABLA DE INTEGRACIÓN DE REPOSITORIOS GITHUB (github_integration)
CREATE TABLE IF NOT EXISTS traceflow.github_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    integration_mode VARCHAR(20) NOT NULL CHECK (integration_mode IN ('LINK_EXISTING', 'CREATE_NEW')),
    repo_owner VARCHAR(100) NOT NULL,
    repo_name VARCHAR(100) NOT NULL,
    repo_full_name VARCHAR(200) NOT NULL,
    github_repo_id BIGINT NOT NULL,
    default_branch VARCHAR(50) NOT NULL DEFAULT 'main',
    installation_id BIGINT NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'internal')),
    permissions JSONB NOT NULL DEFAULT '{"push": true, "pull": true, "admin": false}'::jsonb,
    validation_status VARCHAR(30) NOT NULL DEFAULT 'UNVALIDATED'
        CHECK (validation_status IN ('UNVALIDATED', 'VALIDATED', 'INVALID_CREDENTIALS', 'REPO_NOT_FOUND', 'PERMISSION_DENIED', 'REVOKED', 'UNLINKED')),
    last_validated_at TIMESTAMPTZ,
    validation_error_message TEXT,
    unlinked_at TIMESTAMPTZ,
    unlinked_by UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ÍNDICES DE RENDIMIENTO Y UNICIDAD EN REPOSITORIOS ACTIVOS
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_github_repo
ON traceflow.github_integration (repo_owner, repo_name)
WHERE validation_status != 'UNLINKED';

CREATE INDEX IF NOT EXISTS idx_github_integration_project
ON traceflow.github_integration (project_id);

CREATE INDEX IF NOT EXISTS idx_github_integration_installation
ON traceflow.github_integration (installation_id);

-- 3. PERMISOS DE MÍNIMO PRIVILEGIO PARA EL ROL DE APLICACIÓN (traceflow_app)
GRANT SELECT, INSERT, UPDATE ON traceflow.github_integration TO traceflow_app;
REVOKE DELETE ON traceflow.github_integration FROM traceflow_app;

COMMIT;
