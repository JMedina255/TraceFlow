-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE RECUPERACIÓN Y REVERSIÓN HITO INIT-H04B (SEC-02)
-- Archivo: 202611260005_init_h04b_github_installations_remediation_rollback.sql
-- ============================================================================

BEGIN;

-- Restaurar instalación semilla como ACTIVE si fue suspendida
UPDATE traceflow.organization_github_installation
SET status = 'ACTIVE',
    updated_at = NOW()
WHERE installation_id = 12345678;

COMMIT;
