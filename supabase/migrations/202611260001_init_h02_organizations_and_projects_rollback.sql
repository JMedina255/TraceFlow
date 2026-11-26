-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE ROLLBACK CONTROLADO (HITO INIT-H02)
-- Archivo: 202611260001_init_h02_organizations_and_projects_rollback.sql
-- Hito: INIT-H02 — Rollback y Plan de Recuperación
-- ============================================================================

BEGIN;

-- 1. Eliminar disparador de integridad institucional
DROP TRIGGER IF EXISTS trg_check_user_project_assignment_org ON traceflow.user_project_assignment;
DROP FUNCTION IF EXISTS traceflow.enforce_project_member_organization_integrity();

-- 2. Restaurar estado de proyectos históricos
UPDATE traceflow.project
SET status = 'ACTIVE'
WHERE status = 'HISTORICO_PENDIENTE_GITHUB';

-- 3. Restaurar restricción de estados original
ALTER TABLE traceflow.project DROP CONSTRAINT IF EXISTS chk_project_status;
ALTER TABLE traceflow.project ADD CONSTRAINT project_status_check
    CHECK (status IN ('ACTIVE', 'CLOSED', 'ARCHIVED'));

-- 4. Eliminar columna de relación organizacional
ALTER TABLE traceflow.project DROP COLUMN IF EXISTS organization_id;

-- 5. Eliminar tablas de organización y membresía
DROP TABLE IF EXISTS traceflow.organization_member;
DROP TABLE IF EXISTS traceflow.organization;

COMMIT;
