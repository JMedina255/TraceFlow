-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE RECUPERACIÓN Y REVERSIÓN HITO INIT-H03
-- Archivo: 202611260002_init_h03_team_methodology_planning_rollback.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- REGLAS DE SEGURIDAD Y SALVAGUARDAS CONTRA PÉRDIDA DE INFORMACIÓN:
-- 1. SALVAGUARDA DE INTEGRIDAD OPERATIVA:
--    Verifica si existen datos operativos en las 6 tablas creadas en H03:
--    - project_team_role
--    - project_methodology
--    - project_phase
--    - project_milestone
--    - project_deliverable
--    - project_setup (con avance registrado o completado)
-- 2. PROCEDIMIENTO DE RECUPERACIÓN (PITR):
--    En caso de existir datos operativos, el rollback es abortado para evitar
--    pérdida irreversible de información técnica y configuraciones.
-- 3. SOBREESCRITURA DELIBERADA PARA PRUEBAS:
--    Para entornos de prueba descartables o rollback administrativo forzado:
--    SET LOCAL traceflow.allow_force_h03_rollback = 'true';
-- ============================================================================

BEGIN;

-- 1. SALVAGUARDA DE INTEGRIDAD: VERIFICAR DATOS OPERATIVOS DE PLANIFICACIÓN
DO $$
DECLARE
    v_force_rollback TEXT;
    v_team_roles_count INT := 0;
    v_methodologies_count INT := 0;
    v_phases_count INT := 0;
    v_milestones_count INT := 0;
    v_deliverables_count INT := 0;
    v_setups_with_progress INT := 0;
    v_total_records INT := 0;
BEGIN
    -- Verificar si se ha autorizado la fuerza de reversión deliberada
    BEGIN
        v_force_rollback := current_setting('traceflow.allow_force_h03_rollback', true);
    EXCEPTION WHEN OTHERS THEN
        v_force_rollback := 'false';
    END;

    IF COALESCE(v_force_rollback, 'false') = 'true' THEN
        RAISE NOTICE 'ROLLBACK FORZADO: Variable traceflow.allow_force_h03_rollback activa. Procediendo con la reversión.';
        RETURN;
    END IF;

    -- Comprobar si las tablas existen antes de contar (idempotencia)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'project_team_role') THEN
        SELECT COUNT(*) INTO v_team_roles_count FROM traceflow.project_team_role;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'project_methodology') THEN
        SELECT COUNT(*) INTO v_methodologies_count FROM traceflow.project_methodology;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'project_phase') THEN
        SELECT COUNT(*) INTO v_phases_count FROM traceflow.project_phase;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'project_milestone') THEN
        SELECT COUNT(*) INTO v_milestones_count FROM traceflow.project_milestone;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'project_deliverable') THEN
        SELECT COUNT(*) INTO v_deliverables_count FROM traceflow.project_deliverable;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'traceflow' AND table_name = 'project_setup') THEN
        SELECT COUNT(*) INTO v_setups_with_progress FROM traceflow.project_setup
        WHERE wizard_step > 1 OR team_completed = true OR methodology_completed = true OR github_completed = true;
    END IF;

    v_total_records := v_team_roles_count + v_methodologies_count + v_phases_count + v_milestones_count + v_deliverables_count + v_setups_with_progress;

    IF v_total_records > 0 THEN
        RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H03): Se detectaron registros operativos de planificación (roles: %, metodologías: %, fases: %, hitos: %, entregables: %, asistentes con avance: %). El rollback directo está bloqueado para prevenir pérdida irreversible de datos. Para contingencias utilice Point-In-Time Recovery (PITR) o habilite "SET LOCAL traceflow.allow_force_h03_rollback = ''true'';" para pruebas.',
            v_team_roles_count, v_methodologies_count, v_phases_count, v_milestones_count, v_deliverables_count, v_setups_with_progress;
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
