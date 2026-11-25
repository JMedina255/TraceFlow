-- ============================================================================
-- TRACEFLOW SCM — ROL DE APLICACIÓN DE MÍNIMO PRIVILEGIO (LEAST PRIVILEGE)
-- Archivo: supabase/roles/01_app_role.sql
-- Hito: DB-01.1 — Requisito H-06 (Seguridad PostgreSQL y Mínimo Privilegio)
-- Normas: SAD Diseño v0.2 Sección 11.1, ADR-004, ADR-008
-- ============================================================================

-- 1. CREACIÓN DEL ROL DE APLICACIÓN CON CONTRASEÑA SEGURA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'traceflow_app') THEN
        CREATE ROLE traceflow_app WITH LOGIN PASSWORD 'CONFIGURAR_EN_VARIABLE_DE_ENTORNO';
    END IF;
END $$;

-- 2. PRIVILEGIOS DE ESQUEMA
GRANT USAGE ON SCHEMA traceflow TO traceflow_app;

-- 3. PERMISOS OPERATIVOS DML (SELECT, INSERT, UPDATE, DELETE)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA traceflow TO traceflow_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA traceflow TO traceflow_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA traceflow TO traceflow_app;

-- 4. REGLAS DE DEFENSIVA EN PROFUNDIDAD (REVOCACIÓN ESTRICTA DE MÍNIMO PRIVILEGIO)
-- audit_log es estrictamente append-only: Prohibir UPDATE, DELETE y TRUNCATE para la aplicación
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE traceflow.audit_log FROM traceflow_app;

-- ecs_version es inmutable: Prohibir DELETE y TRUNCATE
REVOKE DELETE, TRUNCATE ON TABLE traceflow.ecs_version FROM traceflow_app;

-- sync_lock solo se modifica por causas canónicas: Prohibir TRUNCATE
REVOKE TRUNCATE ON TABLE traceflow.sync_lock FROM traceflow_app;

-- 5. ASEGURAR QUE LAS TABLAS FUTURAS HEREDEN LOS MISMOS PRIVILEGIOS MÍNIMOS
ALTER DEFAULT PRIVILEGES IN SCHEMA traceflow
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO traceflow_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA traceflow
GRANT USAGE, SELECT ON SEQUENCES TO traceflow_app;
