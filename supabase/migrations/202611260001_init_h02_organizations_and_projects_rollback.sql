-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE RECUPERACIÓN Y ROLLBACK COMPENSATORIO (HITO INIT-H02)
-- Archivo: 202611260001_init_h02_organizations_and_projects_rollback.sql
-- Hito: INIT-H02-R — Subsanación H02-R05 (Estrategia de Recuperación Segura y No Destructiva)
-- Marco Normativo: RNF-01, RNF-03, IEEE 828, ISO/IEC/IEEE 12207
-- ============================================================================
--
-- GUÍA OPERATIVA DE CONTINGENCIA Y RECUPERACIÓN (PITR / PG_RESTORE):
-- ----------------------------------------------------------------------------
-- 1. Si este script se ejecuta en una base de datos donde YA se crearon nuevas organizaciones
--    o proyectos con posterioridad a la migración, la transacción ABORTARÁ AUTOMÁTICAMENTE
--    para evitar la destrucción accidental de datos operativos (H02-R05).
-- 2. En caso de incidente de corrupción o desincronización con datos post-migración:
--    a) NO forzar el DROP de tablas.
--    b) Procedimiento PITR (Point-in-Time Recovery):
--       i. Detener el tráfico hacia traceflow_app.
--       ii. Determinar el LSN o timestamp exacto previo al incidente:
--           SELECT pg_current_wal_lsn(), NOW();
--       iii. Restaurar el backup base inmediatamente anterior y configurar target dinámico:
--           recovery_target_time = '<TIMESTAMP_UTC_PREVIO_AL_INCIDENTE>' -- O recovery_target_lsn = '<LSN_PREVIO>'
--           recovery_target_action = 'promote'
--    c) Procedimiento Restauración Selectiva con pg_restore:
--       pg_restore --host=$DB_HOST --username=$DB_USER --dbname=$DB_NAME \
--                  --table=organization --table=organization_member \
--                  --clean --if-exists backup_pre_h02.dump
-- ============================================================================

BEGIN;

-- 1. SALVAGUARDA DE INTEGRIDAD: VERIFICACIÓN DE DATOS POST-MIGRACIÓN (H02-R05)
DO $$
DECLARE
    v_new_orgs_count INT;
    v_new_prjs_count INT;
BEGIN
    -- Comprobar si existen organizaciones distintas a la semilla institucional ORG-EXODO
    SELECT COUNT(*) INTO v_new_orgs_count
    FROM traceflow.organization
    WHERE id != 'c0000001-0000-0000-0000-000000000001';

    -- Comprobar si existen proyectos creados con posterioridad a los históricos (PRJ-001, PRJ-002, PRJ-003)
    SELECT COUNT(*) INTO v_new_prjs_count
    FROM traceflow.project
    WHERE id NOT IN (
        'b0000001-0000-0000-0000-000000000001',
        'b0000001-0000-0000-0000-000000000002',
        'b0000001-0000-0000-0000-000000000003'
    );

    IF v_new_orgs_count > 0 OR v_new_prjs_count > 0 THEN
        RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (H02-R05): Se detectaron % organizaciones y % proyectos creados post-migración. El rollback destructivo (DROP TABLE) está prohibido para preservar la integridad operativa. Utilice el procedimiento de recuperación PITR documentado en la cabecera.',
            v_new_orgs_count, v_new_prjs_count;
    END IF;
END $$;

-- 2. ELIMINAR DISPARADOR Y FUNCIÓN DE INTEGRIDAD INSTITUCIONAL
DROP TRIGGER IF EXISTS trg_check_user_project_assignment_org ON traceflow.user_project_assignment;
DROP FUNCTION IF EXISTS traceflow.enforce_project_member_organization_integrity();

-- 3. DESVINCULAR Y RESTAURAR PROYECTOS HISTÓRICOS
UPDATE traceflow.project
SET organization_id = NULL
WHERE organization_id = 'c0000001-0000-0000-0000-000000000001';

UPDATE traceflow.project
SET status = 'ACTIVE'
WHERE status = 'HISTORICO_PENDIENTE_GITHUB';

-- 4. RESTAURAR RESTRICCIÓN DE ESTADOS LEGADA
ALTER TABLE traceflow.project DROP CONSTRAINT IF EXISTS chk_project_status;
ALTER TABLE traceflow.project DROP CONSTRAINT IF EXISTS project_status_check;
ALTER TABLE traceflow.project ADD CONSTRAINT project_status_check
    CHECK (status IN ('ACTIVE', 'CLOSED', 'ARCHIVED'));

-- 5. ELIMINAR COLUMNA DE RELACIÓN ORGANIZACIONAL EN PROJECT
ALTER TABLE traceflow.project DROP COLUMN IF EXISTS organization_id;

-- 6. ELIMINAR MEMBRESÍAS Y ORGANIZACIÓN SEMILLA CONTROLADAMENTE
DELETE FROM traceflow.organization_member
WHERE organization_id = 'c0000001-0000-0000-0000-000000000001';

DELETE FROM traceflow.organization
WHERE id = 'c0000001-0000-0000-0000-000000000001';

-- 7. ELIMINAR TABLAS DDL DE MANERA SEGURA (RESTRICTIVO, SIN CASCADE PARA PREVENIR BORRADOS COLATERALES)
DROP TABLE IF EXISTS traceflow.organization_member;
DROP TABLE IF EXISTS traceflow.organization;

COMMIT;
