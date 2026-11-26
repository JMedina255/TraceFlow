-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE RECUPERACIÓN Y REVERSIÓN HITO INIT-H04A
-- Archivo: 202611260003_init_h04a_github_integration_rollback.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- REGLAS DE SEGURIDAD Y SALVAGUARDAS CONTRA PÉRDIDA DE INFORMACIÓN:
-- 1. SALVAGUARDA DE INTEGRIDAD:
--    Verifica si existen integraciones activas formalmente validadas (VALIDATED).
--    Si existen registros validados, el rollback directo se aborta para prevenir
--    la desconexión accidental del repositorio Git respecto a los ECS.
-- 2. SOBREESCRITURA DELIBERADA PARA PRUEBAS:
--    SET LOCAL traceflow.allow_force_h04_rollback = 'true';
-- ============================================================================

BEGIN;

-- 1. SALVAGUARDA DE INTEGRIDAD: VERIFICAR INTEGRACIONES VALIDADAS ACTIVAS
DO $$
DECLARE
    v_force_rollback TEXT;
    v_validated_integrations INT := 0;
BEGIN
    BEGIN
        v_force_rollback := current_setting('traceflow.allow_force_h04_rollback', true);
    EXCEPTION WHEN OTHERS THEN
        v_force_rollback := 'false';
    END;

    IF COALESCE(v_force_rollback, 'false') = 'true' THEN
        RAISE NOTICE 'ROLLBACK FORZADO: Variable traceflow.allow_force_h04_rollback activa. Procediendo con la reversión.';
        RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'github_integration') THEN
        -- H04A-R05: Bloquear si existe CUALQUIER registro de integración, independientemente de su estado
        SELECT COUNT(*) INTO v_validated_integrations
        FROM traceflow.github_integration;
    END IF;

    IF v_validated_integrations > 0 THEN
        RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H04A-R): Se detectaron % registros en traceflow.github_integration. Ningún registro puede eliminarse automáticamente, independientemente de su estado (UNLINKED, PERMISSION_DENIED, etc.). El rollback directo está bloqueado para preservar la trazabilidad forense SCM. Para contingencias utilice Point-In-Time Recovery (PITR) o habilite "SET LOCAL traceflow.allow_force_h04_rollback = ''true'';" para pruebas.',
            v_validated_integrations;
    END IF;
END $$;

-- 2. ELIMINAR ÍNDICES Y TABLA DDL (RESTRICTIVO, SIN CASCADE)
DROP INDEX IF EXISTS traceflow.uq_active_github_repo;
DROP INDEX IF EXISTS traceflow.idx_github_integration_project;
DROP INDEX IF EXISTS traceflow.idx_github_integration_installation;
DROP TABLE IF EXISTS traceflow.github_integration;

COMMIT;
