-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE ROLLBACK CONTROLADO HITO INIT-H04B-R
-- Archivo: 202611260007_init_h04b_r_webhooks_governance_and_worker_rollback.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- POLÍTICA DE SEGURIDAD (PITR):
--  Aborta si existen eventos procesados o bloqueos activos post-migración,
--  salvo que se autorice explícitamente traceflow.allow_force_h04_rollback = 'true'.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_allow_force TEXT;
  v_locked_count INT;
BEGIN
  BEGIN
    v_allow_force := current_setting('traceflow.allow_force_h04_rollback', true);
  EXCEPTION WHEN OTHERS THEN
    v_allow_force := 'false';
  END;

  IF v_allow_force IS DISTINCT FROM 'true' THEN
    SELECT COUNT(*) INTO v_locked_count
    FROM traceflow.github_event
    WHERE locked_by IS NOT NULL OR processing_status = 'PROCESSING';

    IF v_locked_count > 0 THEN
      RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H04B-R): Existen % eventos actualmente bloqueados o en procesamiento. El rollback directo está bloqueado para preservar la integridad transaccional. Para contingencias utilice Point-In-Time Recovery (PITR) o configure "SET LOCAL traceflow.allow_force_h04_rollback = ''true'';" para pruebas.', v_locked_count;
    END IF;
  END IF;

  RAISE NOTICE 'Rollback de INIT-H04B-R autorizado. Revirtiendo extensiones DDL...';
END $$;

-- 1. Revertir índices y columnas de traceflow.config_item_path_history
DROP INDEX IF EXISTS traceflow.uq_cip_history_commit_ecs_change;

ALTER TABLE traceflow.config_item_path_history
DROP CONSTRAINT IF EXISTS chk_config_item_path_history_status;

ALTER TABLE traceflow.config_item_path_history
DROP COLUMN IF EXISTS applied_to_ecs,
DROP COLUMN IF EXISTS applied_at,
DROP COLUMN IF EXISTS status;

-- 2. Revertir índices y columnas de traceflow.github_event
DROP INDEX IF EXISTS traceflow.idx_github_event_claimable;

ALTER TABLE traceflow.github_event
DROP CONSTRAINT IF EXISTS chk_github_event_correlation_status;

ALTER TABLE traceflow.github_event
DROP COLUMN IF EXISTS locked_by,
DROP COLUMN IF EXISTS locked_at,
DROP COLUMN IF EXISTS lease_expires_at,
DROP COLUMN IF EXISTS correlation_status;

COMMIT;
