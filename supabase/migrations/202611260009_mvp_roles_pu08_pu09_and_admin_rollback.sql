-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE ROLLBACK CONTROLADO (HITO MVP-H01)
-- Archivo: 202611260009_mvp_roles_pu08_pu09_and_admin_rollback.sql
-- Motor: PostgreSQL 16+ / Supabase
--
-- POLÍTICA DE SEGURIDAD (PITR):
--  Aborta si existen usuarios con PU-08/PU-09 asignados, cuentas autorizadas
--  para crear proyectos, asignaciones revocadas/inactivas o invitaciones
--  registradas, salvo autorización explícita:
--    SET LOCAL traceflow.allow_force_mvp_h01_rollback = 'true';
-- ============================================================================

BEGIN;

DO $$
DECLARE
    v_allow_force TEXT;
    v_inv_count INT := 0;
    v_auth_users_count INT := 0;
    v_new_role_assign_count INT := 0;
    v_revoked_role_assign_count INT := 0;
BEGIN
    BEGIN
        v_allow_force := current_setting('traceflow.allow_force_mvp_h01_rollback', true);
    EXCEPTION WHEN OTHERS THEN
        v_allow_force := 'false';
    END;

    IF v_allow_force IS DISTINCT FROM 'true' THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'traceflow' AND table_name = 'user_invitation'
        ) THEN
            SELECT COUNT(*) INTO v_inv_count FROM traceflow.user_invitation;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'traceflow' AND table_name = 'app_user' AND column_name = 'can_create_projects'
        ) THEN
            SELECT COUNT(*) INTO v_auth_users_count
            FROM traceflow.app_user
            WHERE can_create_projects = TRUE;
        END IF;

        SELECT COUNT(*) INTO v_new_role_assign_count
        FROM traceflow.user_role_assignment ura
        JOIN traceflow.app_role ar ON ura.role_id = ar.id
        WHERE ar.code IN ('PU-08', 'PU-09');

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'traceflow' AND table_name = 'user_role_assignment' AND column_name = 'status'
        ) THEN
            SELECT COUNT(*) INTO v_revoked_role_assign_count
            FROM traceflow.user_role_assignment
            WHERE status != 'ACTIVE';
        END IF;

        IF (v_inv_count + v_auth_users_count + v_new_role_assign_count + v_revoked_role_assign_count) > 0 THEN
            RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (MVP-H01): Se detectaron datos operativos (% invitaciones, % autorizaciones de proyecto, % asignaciones PU-08/PU-09, % asignaciones revocadas). Use PITR o configure "SET LOCAL traceflow.allow_force_mvp_h01_rollback = ''true'';" para pruebas.',
                v_inv_count, v_auth_users_count, v_new_role_assign_count, v_revoked_role_assign_count;
        END IF;
    END IF;

    RAISE NOTICE 'Rollback de MVP-H01 autorizado. Revirtiendo objetos de 202611260009...';
END $$;

-- 1. Eliminar tabla y trigger de invitaciones
DROP TRIGGER IF EXISTS trg_enforce_invitation_security ON traceflow.user_invitation;
DROP FUNCTION IF EXISTS traceflow.enforce_invitation_security();
DROP TABLE IF EXISTS traceflow.user_invitation;

-- 2. Eliminar columna active_project_id de user_session
ALTER TABLE traceflow.user_session
    DROP COLUMN IF EXISTS active_project_id;

-- 3. Restaurar privilegios y columnas de user_role_assignment
REVOKE INSERT, UPDATE ON TABLE traceflow.user_role_assignment FROM traceflow_app;
GRANT SELECT ON TABLE traceflow.user_role_assignment TO traceflow_app;

-- Si fue forzado en entorno de prueba, limpiar asignaciones PU-08/PU-09 antes de borrar roles
DELETE FROM traceflow.user_session
WHERE active_role_id IN (SELECT id FROM traceflow.app_role WHERE code IN ('PU-08', 'PU-09'));

DELETE FROM traceflow.user_role_assignment
WHERE role_id IN (SELECT id FROM traceflow.app_role WHERE code IN ('PU-08', 'PU-09'));

DROP INDEX IF EXISTS traceflow.idx_user_role_assignment_active;
ALTER TABLE traceflow.user_role_assignment DROP CONSTRAINT IF EXISTS chk_user_role_assignment_status;
ALTER TABLE traceflow.user_role_assignment
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS revoked_at,
    DROP COLUMN IF EXISTS revoked_by,
    DROP COLUMN IF EXISTS updated_at;

-- 4. Eliminar columnas nuevas en app_user
DROP INDEX IF EXISTS traceflow.uq_app_user_github_user_id;
DROP INDEX IF EXISTS traceflow.idx_app_user_can_create_projects;
ALTER TABLE traceflow.app_user DROP CONSTRAINT IF EXISTS chk_app_user_github_identity_status;
ALTER TABLE traceflow.app_user
    DROP COLUMN IF EXISTS can_create_projects,
    DROP COLUMN IF EXISTS project_creation_authorized_by,
    DROP COLUMN IF EXISTS project_creation_authorized_at,
    DROP COLUMN IF EXISTS github_username,
    DROP COLUMN IF EXISTS github_user_id,
    DROP COLUMN IF EXISTS github_identity_status;

-- 5. Retirar PU-08 y PU-09 de app_role (conservando PU-01..PU-07)
DELETE FROM traceflow.app_role WHERE code IN ('PU-08', 'PU-09');

SELECT setval(
    pg_get_serial_sequence('traceflow.app_role', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM traceflow.app_role), 7),
    true
);

COMMIT;
