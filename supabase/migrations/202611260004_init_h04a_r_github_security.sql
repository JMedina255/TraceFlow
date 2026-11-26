-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN DDL HITO INIT-H04A-R
-- Archivo: 202611260004_init_h04a_r_github_security.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- OBJETIVOS DE SEGURIDAD (H04A-R):
-- 1. H04A-R02: Aislamiento de instalaciones GitHub por organización:
--    Crea tabla traceflow.organization_github_installation para persistir
--    la asociación autorizada entre la organización TraceFlow y la GitHub App.
-- 2. H04A-R03: Unicidad canónica de repositorios:
--    Sustituye uq_active_github_repo por uq_active_github_repo_id sobre el ID
--    estable (github_repo_id) y uq_active_github_repo_name sobre (LOWER(repo_owner), LOWER(repo_name)),
--    garantizando que repositorios renombrados mantengan su unicidad activa.
-- 3. Mínimo Privilegio:
--    traceflow_app recibe SELECT, INSERT, UPDATE; DELETE revocado explícitamente.
-- ============================================================================

BEGIN;

-- 1. TABLA RELACIONAL DE ASOCIACIÓN AUTORIZADA ORGANIZACIÓN <-> INSTALACIÓN GITHUB (H04A-R02)
CREATE TABLE IF NOT EXISTS traceflow.organization_github_installation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES traceflow.organization(id) ON DELETE RESTRICT,
    installation_id BIGINT NOT NULL,
    account_login VARCHAR(100) NOT NULL,
    account_type VARCHAR(30) NOT NULL DEFAULT 'Organization' CHECK (account_type IN ('Organization', 'User')),
    target_id BIGINT NOT NULL DEFAULT 0,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    repository_selection VARCHAR(30) NOT NULL DEFAULT 'selected' CHECK (repository_selection IN ('all', 'selected')),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
    installed_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_org_github_installation UNIQUE (organization_id, installation_id),
    CONSTRAINT uq_active_installation UNIQUE (installation_id)
);

-- Índices de consulta y rendimiento
CREATE INDEX IF NOT EXISTS idx_org_github_inst_org ON traceflow.organization_github_installation(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_github_inst_status ON traceflow.organization_github_installation(status);

-- 2. MÍNIMO PRIVILEGIO PARA traceflow_app (H04A-R01, H04A-R02)
GRANT SELECT, INSERT, UPDATE ON TABLE traceflow.organization_github_installation TO traceflow_app;
REVOKE DELETE ON TABLE traceflow.organization_github_installation FROM traceflow_app;

-- 3. UNICIDAD CANÓNICA DE REPOSITORIOS ACTIVOS (H04A-R03)
-- Eliminar índice anterior basado solo en nombres en texto plano
DROP INDEX IF EXISTS traceflow.uq_active_github_repo;

-- Índice canónico principal: Unicidad activa por identificador numérico inmutable provisto por GitHub
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_github_repo_id
ON traceflow.github_integration (github_repo_id)
WHERE (validation_status != 'UNLINKED');

-- Índice auxiliar insensitivo a mayúsculas/minúsculas para el nombre completo
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_github_repo_name
ON traceflow.github_integration (LOWER(repo_owner), LOWER(repo_name))
WHERE (validation_status != 'UNLINKED');

-- 4. SEMILLA AUTORIZADA PARA LA ORGANIZACIÓN POR DEFECTO (ÉXODO S.A.C.)
INSERT INTO traceflow.organization_github_installation (
    organization_id,
    installation_id,
    account_login,
    account_type,
    target_id,
    permissions,
    repository_selection,
    status,
    installed_by
)
SELECT
    'c0000001-0000-0000-0000-000000000001',
    12345678,
    'exodo-org',
    'Organization',
    501,
    '{"issues":"write","contents":"write","pull_requests":"write","metadata":"read"}'::jsonb,
    'selected',
    'ACTIVE',
    'a0000001-0000-0000-0000-000000000001'
WHERE EXISTS (SELECT 1 FROM traceflow.organization WHERE id = 'c0000001-0000-0000-0000-000000000001')
ON CONFLICT (organization_id, installation_id) DO NOTHING;

COMMIT;
