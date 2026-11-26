-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL HITO INIT-H04B
-- Archivo: 202611260006_init_h04b_webhooks_and_git_sync.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- ALCANCE:
--  1. Creación de tabla traceflow.github_event para recepción idempotente,
--     auditoría criptográfica y procesamiento asíncrono de eventos webhook
--     (DA-01, DA-02, DA-03, ADR-011).
--  2. Creación de tabla traceflow.config_item_path_history para seguimiento
--     histórico de movimientos, renombrados y bajas de rutas de ECS ante
--     sincronización con commits de Git (DA-01, DA-04, RNF-03).
--  3. Concesión de mínimo privilegio para traceflow_app (SELECT, INSERT, UPDATE;
--     DELETE estrictamente revocado).
-- ============================================================================

BEGIN;

-- 1. TABLA DE EVENTOS DE WEBHOOKS GITHUB (github_event)
CREATE TABLE IF NOT EXISTS traceflow.github_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    action VARCHAR(50),
    installation_id BIGINT NOT NULL,
    github_repo_id BIGINT,
    project_id UUID REFERENCES traceflow.project(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    processing_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (processing_status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED')),
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES PARA EVENTOS GITHUB
CREATE UNIQUE INDEX IF NOT EXISTS uq_github_event_delivery
ON traceflow.github_event (delivery_id);

CREATE INDEX IF NOT EXISTS idx_github_event_status
ON traceflow.github_event (processing_status);

CREATE INDEX IF NOT EXISTS idx_github_event_repo
ON traceflow.github_event (github_repo_id);

CREATE INDEX IF NOT EXISTS idx_github_event_project
ON traceflow.github_event (project_id);

CREATE INDEX IF NOT EXISTS idx_github_event_created
ON traceflow.github_event (created_at);

-- 2. TABLA DE HISTORIAL DE RUTAS DE ELEMENTOS DE CONFIGURACIÓN (config_item_path_history)
CREATE TABLE IF NOT EXISTS traceflow.config_item_path_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_item_id UUID NOT NULL REFERENCES traceflow.config_item(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    old_path VARCHAR(500) NOT NULL,
    new_path VARCHAR(500) NOT NULL,
    change_type VARCHAR(30) NOT NULL
        CHECK (change_type IN ('RENAME', 'MOVE', 'DELETE')),
    git_commit_sha VARCHAR(64) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES PARA HISTORIAL DE RUTAS
CREATE INDEX IF NOT EXISTS idx_config_item_path_history_item
ON traceflow.config_item_path_history (config_item_id);

CREATE INDEX IF NOT EXISTS idx_config_item_path_history_project
ON traceflow.config_item_path_history (project_id);

CREATE INDEX IF NOT EXISTS idx_config_item_path_history_sha
ON traceflow.config_item_path_history (git_commit_sha);

-- 3. PERMISOS DE MÍNIMO PRIVILEGIO PARA EL ROL DE APLICACIÓN (traceflow_app)
GRANT SELECT, INSERT, UPDATE ON traceflow.github_event TO traceflow_app;
REVOKE DELETE ON traceflow.github_event FROM traceflow_app;

GRANT SELECT, INSERT, UPDATE ON traceflow.config_item_path_history TO traceflow_app;
REVOKE DELETE ON traceflow.config_item_path_history FROM traceflow_app;

COMMIT;
