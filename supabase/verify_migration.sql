-- ============================================================================
-- SCRIPT DE COMPROBACIÓN Y VERIFICACIÓN DE INTEGRIDAD DE ESQUEMA POSTGRESQL
-- Archivo: supabase/verify_migration.sql
-- ============================================================================

SELECT '1. Verificando esquema traceflow y extensión pgcrypto...' as check_step;
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'traceflow';
SELECT extname, extversion FROM pg_extension WHERE extname = 'pgcrypto';

SELECT '2. Conteo de tablas creadas en esquema traceflow...' as check_step;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'traceflow' 
ORDER BY table_name;

SELECT '3. Verificación de índice único condicional RN-06 (uq_active_sync_lock_per_ecs)...' as check_step;
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'traceflow' AND indexname = 'uq_active_sync_lock_per_ecs';

SELECT '4. Verificación de trigger defensivo contra manipulación en audit_log (ADR-008)...' as check_step;
SELECT trigger_schema, trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'traceflow' AND event_object_table = 'audit_log';

SELECT '5. Verificación de roles canónicos y usuarios sembrados...' as check_step;
SELECT id, code, name FROM traceflow.app_role ORDER BY id;
SELECT code, username, email, full_name, status FROM traceflow.app_user ORDER BY code;

SELECT '6. Verificación de aislamiento multitenant de proyectos...' as check_step;
SELECT u.code as user_code, p.code as project_code, p.name as project_name
FROM traceflow.user_project_assignment upa
JOIN traceflow.app_user u ON upa.user_id = u.id
JOIN traceflow.project p ON upa.project_id = p.id
ORDER BY u.code, p.code;

SELECT '7. Verificación de integridad de cadena SHA-256 en audit_log...' as check_step;
SELECT sequence_number, event_code, operation, prev_log_hash, curr_log_hash, timestamp
FROM traceflow.audit_log
ORDER BY sequence_number;
