-- ============================================================================
-- TRACEFLOW SCM — ROL DE APLICACIÓN DE MÍNIMO PRIVILEGIO (LEAST PRIVILEGE)
-- Archivo: supabase/roles/01_app_role.sql
-- Hito: DB-02.1 — Requisito SEC-02 (Seguridad PostgreSQL y Mínimo Privilegio)
-- Normas: SAD Diseño v0.2 Sección 11.1, ADR-004, ADR-008
-- ============================================================================

-- 1. CREACIÓN DEL ROL DE APLICACIÓN CON CONTRASEÑA SEGURA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'traceflow_app') THEN
        CREATE ROLE traceflow_app WITH LOGIN PASSWORD 'CONFIGURAR_EN_VARIABLE_DE_ENTORNO';
    END IF;
END $$;

-- 2. PRIVILEGIOS DE ESQUEMA, SECUENCIAS Y RUTINAS
GRANT USAGE ON SCHEMA traceflow TO traceflow_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA traceflow TO traceflow_app;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA traceflow TO traceflow_app;

-- 3. TABLAS DE SOLO LECTURA (SELECT)
GRANT SELECT ON TABLE 
    traceflow.app_role,
    traceflow.project,
    traceflow.user_role_assignment,
    traceflow.user_project_assignment,
    traceflow.baseline,
    traceflow.baseline_item
TO traceflow_app;

-- 4. TABLAS DE LECTURA Y ESCRITURA (SELECT, INSERT, UPDATE — SIN DELETE)
GRANT SELECT, INSERT, UPDATE ON TABLE 
    traceflow.app_user,
    traceflow.user_session,
    traceflow.config_item,
    traceflow.change_request,
    traceflow.impact_assessment,
    traceflow.change_order,
    traceflow.sync_lock,
    traceflow.qa_certification,
    traceflow.uat_acceptance,
    traceflow.incident_ticket
TO traceflow_app;

-- 5. TABLAS DE SOLO ADICIÓN / LECTURA (SELECT, INSERT — SIN UPDATE, SIN DELETE)
GRANT SELECT, INSERT ON TABLE 
    traceflow.change_authorization,
    traceflow.ccb_resolution,
    traceflow.ccb_vote,
    traceflow.audit_log,
    traceflow.ecs_version
TO traceflow_app;

-- 6. REGLAS DEFENSIVAS DE PRIVILEGIOS POR DEFECTO
ALTER DEFAULT PRIVILEGES IN SCHEMA traceflow REVOKE ALL ON TABLES FROM traceflow_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA traceflow GRANT USAGE, SELECT ON SEQUENCES TO traceflow_app;
