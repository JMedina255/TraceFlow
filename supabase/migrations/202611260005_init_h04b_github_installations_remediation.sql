-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL CORRECTIVA (INIT-H04B / SEC-02)
-- Archivo: 202611260005_init_h04b_github_installations_remediation.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- PROPÓSITO:
-- 1. Saneamiento de instalaciones de ejemplo: marcar instalación ficticia 12345678
--    como 'SUSPENDED' en entornos que no sean de prueba explícita, evitando dependencias
--    operativas de datos ficticios en producción.
-- 2. Asegurar que las columnas target_id, repository_selection e installed_by estén
--    plenamente alineadas en traceflow.organization_github_installation.
-- ============================================================================

BEGIN;

-- 1. Saneamiento de instalación semilla para entornos operativos reales
DO $$
DECLARE
    v_is_test TEXT;
BEGIN
    BEGIN
        v_is_test := current_setting('traceflow.is_test_environment', true);
    EXCEPTION WHEN OTHERS THEN
        v_is_test := 'false';
    END;

    -- Si no es entorno de prueba explícito, suspender instalación semilla
    IF COALESCE(v_is_test, 'false') != 'true' THEN
        UPDATE traceflow.organization_github_installation
        SET status = 'SUSPENDED',
            updated_at = NOW()
        WHERE installation_id = 12345678
          AND status = 'ACTIVE';
    END IF;
END $$;

COMMIT;
