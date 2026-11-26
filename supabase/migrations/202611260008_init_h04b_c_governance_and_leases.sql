-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL HITO INIT-H04B-C
-- Archivo: 202611260008_init_h04b_c_governance_and_leases.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- OBJETIVO:
--  1. H04B-C-01: Incorporar token de reclamación (claim_token) en traceflow.github_event
--     para blindar la propiedad atómica del lease frente a workers zombies o expirados.
--  2. H04B-C-02: Alinear el estado canónico 'DELETED' en traceflow.organization_github_installation
--     preservando la integridad referencial sin borrado físico.
-- ============================================================================

BEGIN;

-- 1. EXTENSIÓN DE TABLA traceflow.github_event (Claim Token para Blindaje de Leases)
ALTER TABLE traceflow.github_event
ADD COLUMN IF NOT EXISTS claim_token UUID;

-- 2. ALINEACIÓN DE ESTADOS EN traceflow.organization_github_installation
ALTER TABLE traceflow.organization_github_installation
DROP CONSTRAINT IF EXISTS chk_org_github_inst_status,
DROP CONSTRAINT IF EXISTS organization_github_installation_status_check;

ALTER TABLE traceflow.organization_github_installation
ADD CONSTRAINT chk_org_github_inst_status
CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED', 'DELETED'));

-- 3. MÍNIMO PRIVILEGIO PARA traceflow_app (Least Privilege)
GRANT SELECT, INSERT, UPDATE ON traceflow.github_event TO traceflow_app;
GRANT SELECT, INSERT, UPDATE ON traceflow.organization_github_installation TO traceflow_app;
REVOKE DELETE ON traceflow.github_event FROM traceflow_app;
REVOKE DELETE ON traceflow.organization_github_installation FROM traceflow_app;

COMMIT;
