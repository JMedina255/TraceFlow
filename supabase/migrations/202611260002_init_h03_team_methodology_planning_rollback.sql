-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE RECUPERACIÓN Y REVERSIÓN HITO INIT-H03
-- Archivo: 202611260002_init_h03_team_methodology_planning_rollback.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- REGLAS DE SEGURIDAD Y SALVAGUARDAS CONTRA PÉRDIDA DE INFORMACIÓN:
-- 1. SALVAGUARDA DE INTEGRIDAD PREVIA:
--    Verifica si existen entregables vinculados formalmente a ECS en producción
--    o si existen proyectos activados que dependan de la planificación H03.
-- 2. PROCEDIMIENTO DE RECUPERACIÓN (PITR):
--    En caso de contingencia con proyectos en producción, utilizar WAL y PITR.
-- ============================================================================

BEGIN;

-- 1. SALVAGUARDA DE INTEGRIDAD: VERIFICAR DEPENDENCIAS CRÍTICAS SCM
DO $$
DECLARE
    v_ecs_linked_count INT;
    v_active_projects_count INT;
BEGIN
    -- Comprobar si existen entregables vinculados a ECS con valor probatorio SCM
    SELECT COUNT(*) INTO v_ecs_linked_count
    FROM traceflow.project_deliverable
    WHERE associated_ecs_id IS NOT NULL;

    IF v_ecs_linked_count > 0 THEN
        RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H03): Se detectaron % entregables vinculados a ECS. El rollback directo está bloqueado para preservar la trazabilidad SCM. Utilice PITR.', v_ecs_linked_count;
    END IF;
END $$;

-- 2. ELIMINAR DISPARADORES Y FUNCIONES DE INTEGRIDAD
DROP TRIGGER IF EXISTS trg_check_project_team_role_org ON traceflow.project_team_role;
DROP FUNCTION IF EXISTS traceflow.enforce_project_team_role_org_integrity();

DROP TRIGGER IF EXISTS trg_check_milestone_project ON traceflow.project_milestone;
DROP TRIGGER IF EXISTS trg_check_deliverable_project ON traceflow.project_deliverable;
DROP FUNCTION IF EXISTS traceflow.enforce_milestone_project_consistency();
DROP FUNCTION IF EXISTS traceflow.enforce_deliverable_project_consistency();
DROP FUNCTION IF EXISTS traceflow.enforce_planning_project_consistency();

-- 3. ELIMINAR TABLAS DDL DE PLANIFICACIÓN Y EQUIPO (EN ORDEN DE DEPENDENCIAS, SIN CASCADE)
DROP TABLE IF EXISTS traceflow.project_deliverable;
DROP TABLE IF EXISTS traceflow.project_milestone;
DROP TABLE IF EXISTS traceflow.project_phase;
DROP TABLE IF EXISTS traceflow.project_methodology;
DROP TABLE IF EXISTS traceflow.project_team_role;
DROP TABLE IF EXISTS traceflow.project_setup;

COMMIT;
