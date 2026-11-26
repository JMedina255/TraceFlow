-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE ROLLBACK CONTROLADO HITO INIT-H04B-C
-- Archivo: 202611260008_init_h04b_c_governance_and_leases_rollback.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- POLÍTICA DE SEGURIDAD (PITR):
--  Aborta si existen eventos con claim_token o instalaciones en estado DELETED,
--  salvo que se autorice explícitamente traceflow.allow_force_h04_rollback = 'true'.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_allow_force TEXT;
  v_token_count INT := 0;
  v_deleted_inst_count INT := 0;
BEGIN
  BEGIN
    v_allow_force := current_setting('traceflow.allow_force_h04_rollback', true);
  EXCEPTION WHEN OTHERS THEN
    v_allow_force := 'false';
  END;

  IF v_allow_force IS DISTINCT FROM 'true' THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'traceflow' AND table_name = 'github_event' AND column_name = 'claim_token'
    ) THEN
      SELECT COUNT(*) INTO v_token_count
      FROM traceflow.github_event
      WHERE claim_token IS NOT NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'traceflow' AND table_name = 'organization_github_installation'
    ) THEN
      SELECT COUNT(*) INTO v_deleted_inst_count
      FROM traceflow.organization_github_installation
      WHERE status = 'DELETED';
    END IF;

    IF (v_token_count + v_deleted_inst_count) > 0 THEN
      RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H04B-C): Se detectaron % eventos con claim_token activo y % instalaciones en estado DELETED. El rollback directo está bloqueado para preservar la integridad transaccional. Para contingencias utilice Point-In-Time Recovery (PITR) o configure "SET LOCAL traceflow.allow_force_h04_rollback = ''true'';" para pruebas.', v_token_count, v_deleted_inst_count;
    END IF;
  END IF;

  RAISE NOTICE 'Rollback de INIT-H04B-C autorizado. Revirtiendo extensiones DDL...';
END $$;

-- 1. Revertir claim_token de traceflow.github_event
ALTER TABLE traceflow.github_event
DROP COLUMN IF EXISTS claim_token;

-- 2. Revertir restricción CHECK de traceflow.organization_github_installation
ALTER TABLE traceflow.organization_github_installation
DROP CONSTRAINT IF EXISTS chk_org_github_inst_status;

ALTER TABLE traceflow.organization_github_installation
ADD CONSTRAINT chk_org_github_inst_status
CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED'));

COMMIT;
