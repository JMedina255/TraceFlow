-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE RECUPERACIÓN Y REVERSIÓN HITO INIT-H04B
-- Archivo: 202611260006_init_h04b_webhooks_and_git_sync_rollback.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- REGLAS DE SEGURIDAD Y SALVAGUARDAS CONTRA PÉRDIDA DE INFORMACIÓN:
-- 1. SALVAGUARDA DE INTEGRIDAD Y TRAZABILIDAD:
--    Verifica si existen eventos webhook persistidos o registros de cambios de rutas.
--    Si existen registros, el rollback directo se bloquea para prevenir la pérdida
--    de trazabilidad forense y auditoría SCM.
-- 2. SOBREESCRITURA DELIBERADA PARA PRUEBAS:
--    SET LOCAL traceflow.allow_force_h04_rollback = 'true';
-- ============================================================================

BEGIN;

-- 1. SALVAGUARDA DE INTEGRIDAD: VERIFICAR REGISTROS EN TABLAS H04B
DO $$
DECLARE
    v_force_rollback TEXT;
    v_event_count INT := 0;
    v_path_count INT := 0;
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

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'github_event') THEN
        SELECT COUNT(*) INTO v_event_count FROM traceflow.github_event;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'config_item_path_history') THEN
        SELECT COUNT(*) INTO v_path_count FROM traceflow.config_item_path_history;
    END IF;

    IF (v_event_count + v_path_count) > 0 THEN
        RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H04B-R): Se detectaron % eventos webhook y % registros de historial de rutas en el esquema traceflow. Ningún registro puede eliminarse automáticamente para preservar la trazabilidad forense SCM. Para contingencias utilice Point-In-Time Recovery (PITR) o habilite "SET LOCAL traceflow.allow_force_h04_rollback = ''true'';" para pruebas.',
            v_event_count, v_path_count;
    END IF;
END $$;

-- 2. ELIMINAR ÍNDICES Y TABLAS DDL (RESTRICTIVO, SIN CASCADE)
DROP INDEX IF EXISTS traceflow.idx_config_item_path_history_sha;
DROP INDEX IF EXISTS traceflow.idx_config_item_path_history_project;
DROP INDEX IF EXISTS traceflow.idx_config_item_path_history_item;
DROP TABLE IF EXISTS traceflow.config_item_path_history;

DROP INDEX IF EXISTS traceflow.idx_github_event_created;
DROP INDEX IF EXISTS traceflow.idx_github_event_project;
DROP INDEX IF EXISTS traceflow.idx_github_event_repo;
DROP INDEX IF EXISTS traceflow.idx_github_event_status;
DROP INDEX IF EXISTS traceflow.uq_github_event_delivery;
DROP TABLE IF EXISTS traceflow.github_event;

COMMIT;
