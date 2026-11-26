-- ============================================================================
-- TRACEFLOW SCM — SCRIPT DE RECUPERACIÓN Y ROLLBACK COMPENSATORIO (HITO INIT-H02)
-- Archivo: 202611260001_init_h02_organizations_and_projects_rollback.sql
-- Hito: INIT-H02-VF — Subsanación Final de Seguridad y Cierre de Persistencia
-- Marco Normativo: RNF-01 (Seguridad), RNF-02 (Disponibilidad), RNF-03 (Integridad), IEEE 828, ISO/IEC/IEEE 12207
-- ============================================================================
--
-- GUÍA OPERATIVA DE CONTINGENCIA, RESPALDO Y RECUPERACIÓN (PITR / PG_RESTORE):
-- ----------------------------------------------------------------------------
-- Metas de Recuperación: RTO <= 2 horas | RPO <= 0 (con WAL archiving continuo) / <= 24 horas (con backups diarios)
--
-- 1. RESTRICCIÓN DE INTEGRIDAD DE RETORNO:
--    Si este script se ejecuta en una base de datos donde YA se han producido modificaciones
--    posteriores (nuevas organizaciones, nuevos proyectos, adición de miembros a la organización
--    semilla, o alteración del estado/rol de la membresía inicial), la transacción ABORTA
--    AUTOMÁTICAMENTE mediante RAISE EXCEPTION para impedir pérdida irreversible de información.
--
-- 2. PROCEDIMIENTO FORMAL PREVIO A CUALQUIER REVERSIÓN:
--    a) Detener inmediatamente el tráfico de aplicación revocando conexiones operativas:
--       SELECT pg_terminate_backend(pid) FROM pg_stat_activity
--       WHERE usename = 'traceflow_app' AND pid <> pg_backend_pid();
--    b) Capturar el LSN y marca temporal exacta previa a la contingencia:
--       SELECT pg_current_wal_lsn(), clock_timestamp() AT TIME ZONE 'UTC';
--    c) Generar un respaldo físico y lógico completo de seguridad antes de ejecutar DDL:
--       pg_dump -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -F c -b -v \
--               -f "/backups/traceflow_pre_rollback_$(date +%Y%m%d_%H%M%S).dump"
--
-- 3. PROCEDIMIENTO DE RECUPERACIÓN EN EL TIEMPO (PITR - Point-in-Time Recovery):
--    En caso de corrupción de datos o necesidad de volver a un estado previo con datos post-migración:
--    a) Detener el servidor PostgreSQL.
--    b) Restaurar el backup base inmediatamente anterior al incidente en el directorio de datos.
--    c) En postgresql.conf (o recovery.signal), configurar los parámetros dinámicos:
--       restore_command = 'cp /var/lib/postgresql/wal_archive/%f %p'
--       recovery_target_time = '<TIMESTAMP_UTC_PREVIO_AL_INCIDENTE>' -- Ej: '2026-11-26 06:00:00 UTC'
--       -- O alternativamente mediante LSN:
--       -- recovery_target_lsn = '<LSN_PREVIO>'
--       recovery_target_action = 'promote'
--    d) Iniciar el servidor y verificar consistencia de tablas y registros de auditoría SHA-256.
--
-- 4. PROCEDIMIENTO DE RESTAURACIÓN SELECTIVA CON PG_RESTORE:
--    Para restaurar exclusivamente la estructura y datos de tablas específicas sin afectar el resto del sistema:
--    pg_restore --host=$DB_HOST --port=$DB_PORT --username=postgres --dbname=$DB_NAME \
--               --table=organization --table=organization_member \
--               --clean --if-exists --single-transaction backup_pre_h02.dump
-- ============================================================================

BEGIN;

-- 1. SALVAGUARDA DE INTEGRIDAD: VERIFICACIÓN EXHAUSTIVA DE DATOS Y MUTACIONES POST-MIGRACIÓN
DO $$
DECLARE
    v_new_orgs_count INT;
    v_new_prjs_count INT;
    v_extra_members_count INT;
    v_seed_member_modified BOOLEAN;
    v_seed_org_modified BOOLEAN;
BEGIN
    -- a) Comprobar si existen organizaciones distintas a la semilla institucional ORG-EXODO
    SELECT COUNT(*) INTO v_new_orgs_count
    FROM traceflow.organization
    WHERE id != 'c0000001-0000-0000-0000-000000000001';

    -- b) Comprobar si existen proyectos creados con posterioridad a los históricos (PRJ-001, PRJ-002, PRJ-003)
    SELECT COUNT(*) INTO v_new_prjs_count
    FROM traceflow.project
    WHERE id NOT IN (
        'b0000001-0000-0000-0000-000000000001',
        'b0000001-0000-0000-0000-000000000002',
        'b0000001-0000-0000-0000-000000000003'
    );

    -- c) Comprobar si existen miembros adicionales en traceflow.organization_member
    -- (la semilla solo incorporó al usuario fundador USR-001 como OWNER)
    SELECT COUNT(*) INTO v_extra_members_count
    FROM traceflow.organization_member
    WHERE organization_id != 'c0000001-0000-0000-0000-000000000001'
       OR user_id != 'a0000001-0000-0000-0000-000000000001';

    -- d) Comprobar si la membresía inicial del fundador fue modificada (ej. rol degradado o suspendido)
    SELECT EXISTS (
        SELECT 1
        FROM traceflow.organization_member
        WHERE organization_id = 'c0000001-0000-0000-0000-000000000001'
          AND user_id = 'a0000001-0000-0000-0000-000000000001'
          AND (role_in_org != 'OWNER' OR status != 'ACTIVE')
    ) INTO v_seed_member_modified;

    -- e) Comprobar si la organización semilla sufrió alteraciones críticas
    SELECT EXISTS (
        SELECT 1
        FROM traceflow.organization
        WHERE id = 'c0000001-0000-0000-0000-000000000001'
          AND (code != 'ORG-EXODO' OR status != 'ACTIVE')
    ) INTO v_seed_org_modified;

    IF v_new_orgs_count > 0 OR v_new_prjs_count > 0 OR v_extra_members_count > 0 OR v_seed_member_modified OR v_seed_org_modified THEN
        RAISE EXCEPTION 'BLOQUEO DE SEGURIDAD (INIT-H02-VF): Se detectaron modificaciones post-migración que impiden el rollback directo sin pérdida de información (Orgs nuevas: %, Proyectos nuevos: %, Membresías alteradas/nuevas: %, Miembro semilla alterado: %, Org semilla alterada: %). El rollback directo está cancelado para proteger la custodia de datos. Utilice el procedimiento PITR documentado en la cabecera.',
            v_new_orgs_count, v_new_prjs_count, v_extra_members_count, v_seed_member_modified, v_seed_org_modified;
    END IF;
END $$;

-- 2. ELIMINAR DISPARADOR Y FUNCIÓN DE INTEGRIDAD INSTITUCIONAL (DA-06)
DROP TRIGGER IF EXISTS trg_check_user_project_assignment_org ON traceflow.user_project_assignment;
DROP FUNCTION IF EXISTS traceflow.enforce_project_member_organization_integrity();

-- 3. DESVINCULAR Y RESTAURAR ESTADOS DE PROYECTOS HISTÓRICOS
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
