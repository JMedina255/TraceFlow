-- ============================================================================
-- TRACEFLOW SCM — INICIALIZACIÓN NO DESTRUCTIVA DE BASES LOCALES (ENV-03)
-- Archivo: scripts/env03-init-local-databases.sql
-- Uso (desde psql conectado como superusuario postgres en 127.0.0.1:5432):
--   $env:TRACEFLOW_LOCAL_APP_PASSWORD="<tu_password_traceflow_app>"
--   psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 -f scripts/env03-init-local-databases.sql
-- ============================================================================

-- 1. Crear bases locales independientes solo si no existen (sin DROP DATABASE)
SELECT 'CREATE DATABASE traceflow_mvp_dev WITH ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'traceflow_mvp_dev')
\gexec

SELECT 'CREATE DATABASE traceflow_cert WITH ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'traceflow_cert')
\gexec

-- 2. Crear rol aplicativo de mínimo privilegio (sin SUPERUSER, CREATEDB ni CREATEROLE)
\getenv app_pwd TRACEFLOW_LOCAL_APP_PASSWORD
SELECT format(
    'CREATE ROLE traceflow_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD %L',
    :'app_pwd'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'traceflow_app')
  AND length(coalesce(:'app_pwd', '')) >= 8
\gexec

-- 3. Privilegios mínimos de conexión sobre ambas bases locales
GRANT CONNECT ON DATABASE traceflow_mvp_dev TO traceflow_app;
GRANT CONNECT ON DATABASE traceflow_cert TO traceflow_app;

-- 4. Diagnóstico de servidor y verificación de aislamiento local
SELECT version();
SELECT current_database();
SELECT current_user;
SHOW server_encoding;
SHOW listen_addresses;
SELECT datname, pg_encoding_to_char(encoding) AS encoding
FROM pg_database
WHERE datname IN ('traceflow_mvp_dev', 'traceflow_cert')
ORDER BY datname;
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolcanlogin
FROM pg_roles
WHERE rolname IN ('postgres', 'traceflow_app')
ORDER BY rolname;
