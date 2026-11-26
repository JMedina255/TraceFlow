-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL HITO INIT-H04B-R
-- Archivo: 202611260007_init_h04b_r_webhooks_governance_and_worker.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- ALCANCE:
--  1. H04B-R04 / H04B-R05: Incorporación de campos de lease y bloqueo transaccional
--     en traceflow.github_event para el trabajador recuperable con FOR UPDATE SKIP LOCKED.
--  2. H04B-R01: Incorporación de correlation_status en traceflow.github_event
--     para clasificar la correlación formal con la persistencia SCM.
--  3. H04B-R02 / H04B-R05: Incorporación de columnas applied_to_ecs, applied_at, status
--     e índice de unicidad uq_cip_history_commit_ecs_change en traceflow.config_item_path_history
--     para preservación del inventario ECS e idempotencia estricta por commit.
--  4. Refuerzo de mínimo privilegio para traceflow_app.
-- ============================================================================

BEGIN;

-- 1. EXTENSIÓN DE TABLA traceflow.github_event (Lease de Trabajador y Correlación SCM)
ALTER TABLE traceflow.github_event
ADD COLUMN IF NOT EXISTS locked_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS correlation_status VARCHAR(40) NOT NULL DEFAULT 'NONE';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_github_event_correlation_status'
  ) THEN
    ALTER TABLE traceflow.github_event
    ADD CONSTRAINT chk_github_event_correlation_status
    CHECK (correlation_status IN ('NONE', 'AUTORIZADO', 'PENDIENTE_DE_CORRELACION', 'OUT_OF_BAND', 'RECHAZADO'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_github_event_claimable
ON traceflow.github_event (processing_status, lease_expires_at, attempts);

-- 2. EXTENSIÓN DE TABLA traceflow.config_item_path_history (Evidencia vs Estado Oficial e Idempotencia)
ALTER TABLE traceflow.config_item_path_history
ADD COLUMN IF NOT EXISTS applied_to_ecs BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'PENDING';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_config_item_path_history_status'
  ) THEN
    ALTER TABLE traceflow.config_item_path_history
    ADD CONSTRAINT chk_config_item_path_history_status
    CHECK (status IN ('PENDING', 'APPLIED', 'REJECTED'));
  END IF;
END $$;

-- Índice único para garantizar que reintentos o entregas repetidas no dupliquen transiciones del mismo commit
CREATE UNIQUE INDEX IF NOT EXISTS uq_cip_history_commit_ecs_change
ON traceflow.config_item_path_history (config_item_id, git_commit_sha, change_type);

-- 3. MÍNIMO PRIVILEGIO PARA EL ROL DE APLICACIÓN (traceflow_app)
GRANT SELECT, INSERT, UPDATE ON traceflow.github_event TO traceflow_app;
REVOKE DELETE ON traceflow.github_event FROM traceflow_app;

GRANT SELECT, INSERT, UPDATE ON traceflow.config_item_path_history TO traceflow_app;
REVOKE DELETE ON traceflow.config_item_path_history FROM traceflow_app;

COMMIT;
