-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE RECUPERACIÓN Y REVERSIÓN HITO INIT-H04A-R
-- Archivo: 202611260004_init_h04a_r_github_security_rollback.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- REGLAS DE SEGURIDAD Y SALVAGUARDAS CONTRA PÉRDIDA DE INFORMACIÓN (H04A-R05):
-- 1. SALVAGUARDA DE INTEGRIDAD FORENSE:
--    Verifica si existen registros en organization_github_installation o github_integration.
--    Ningún registro puede eliminarse a ciegas. Bloquea si existen datos que deban preservarse.
-- 2. SOBREESCRITURA DELIBERADA PARA PRUEBAS:
--    SET LOCAL traceflow.allow_force_h04_rollback = 'true';
-- ============================================================================

BEGIN;

-- 1. SALVAGUARDA DE INTEGRIDAD FORENSE (H04A-R05)
DO $$
DECLARE
    v_force_rollback TEXT;
    v_total_installations INT := 0;
    v_total_integrations INT := 0;
BEGIN
    BEGIN
        v_force_rollback := current_setting('traceflow.allow_force_h04_rollback', true);
    EXCEPTION WHEN OTHERS THEN
        v_force_rollback := 'false';
    END;

    IF COALESCE(v_force_rollback, 'false') = 'true' THEN
        RAISE NOTICE 'ROLLBACK FORZADO: Variable traceflow.allow_force_h04_rollback activa. Procediendo con la reversión de H04A-R.';
        RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'organization_github_installation') THEN
        -- Descontar la instalación semilla inicial si no hay adicionales
        SELECT COUNT(*) INTO v_total_installations
        FROM traceflow.organization_github_installation
        WHERE installation_id != 12345678;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'github_integration') THEN
        SELECT COUNT(*) INTO v_total_integrations
        FROM traceflow.github_integration;
    END IF;

    IF v_total_installations > 0 OR v_total_integrations > 0 THEN
        RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H04A-R): Se detectaron registros operativos en traceflow (instalaciones: %, integraciones: %). El rollback directo está bloqueado para preservar la trazabilidad forense SCM. Para contingencias utilice Point-In-Time Recovery (PITR) o habilite "SET LOCAL traceflow.allow_force_h04_rollback = ''true'';" para pruebas.',
            v_total_installations, v_total_integrations;
    END IF;
END $$;

-- 2. RESTAURAR ÍNDICES PREVIOS DE H04A
DROP INDEX IF EXISTS traceflow.uq_active_github_repo_id;
DROP INDEX IF EXISTS traceflow.uq_active_github_repo_name;

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_github_repo
ON traceflow.github_integration (repo_owner, repo_name)
WHERE (validation_status != 'UNLINKED');

-- 3. ELIMINAR TABLA DE INSTALACIONES (RESTRICTIVO, SIN CASCADE)
DROP INDEX IF EXISTS traceflow.idx_org_github_inst_org;
DROP INDEX IF EXISTS traceflow.idx_org_github_inst_status;
DROP TABLE IF EXISTS traceflow.organization_github_installation;

COMMIT;
