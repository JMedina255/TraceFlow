-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INICIAL POSTGRESQL (SUPABASE)
-- Archivo: 202611250001_initial_traceflow.sql
-- Hito: DB-01 — PostgreSQL + Supabase MCP + Backend NestJS + Primer Flujo Real
-- Esquema: traceflow (Esquema privado no expuesto a PostgREST anon/authenticated)
-- Basado en: SRS v1.1 (FD03), SAD Análisis v1.1 (FD04), SAD Diseño v0.2 (FD05)
-- ADRs: ADR-003, ADR-004, ADR-005, ADR-006, ADR-008
-- ============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CREACIÓN DEL ESQUEMA PRIVADO
CREATE SCHEMA IF NOT EXISTS traceflow;

-- Comentario de arquitectura:
COMMENT ON SCHEMA traceflow IS 'Esquema privado central de TraceFlow SCM. No exponer a API web directa.';

-- 3. CATÁLOGO DE ROLES CANÓNICOS (PU-01 a PU-07)
CREATE TABLE IF NOT EXISTS traceflow.app_role (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(80) NOT NULL,
    description TEXT NOT NULL
);

COMMENT ON TABLE traceflow.app_role IS 'Catálogo canónico de roles de seguridad PU-01 a PU-07 según SAD 2.2.';

-- 4. USUARIOS DEL SISTEMA
CREATE TABLE IF NOT EXISTS traceflow.app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,               -- Código de negocio ej. USR-001
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,            -- Hash seguro Argon2id
    full_name VARCHAR(120) NOT NULL,
    organization VARCHAR(120) NOT NULL DEFAULT 'ÉXODO S.A.C.',
    position VARCHAR(120),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE traceflow.app_user IS 'Usuarios físicos del sistema con separación estricta entre UUID e identificador de negocio.';

-- 5. ASIGNACIÓN DE ROLES (N:M con SoD)
CREATE TABLE IF NOT EXISTS traceflow.user_role_assignment (
    user_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    role_id INT NOT NULL REFERENCES traceflow.app_role(id) ON DELETE RESTRICT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

-- 6. CATÁLOGO DE PROYECTOS
CREATE TABLE IF NOT EXISTS traceflow.project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,               -- Código de negocio ej. PRJ-001
    project_key VARCHAR(30) UNIQUE NOT NULL,        -- Clave nemotécnica ej. EXO-CORE
    name VARCHAR(120) NOT NULL,
    description TEXT,
    client_name VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'ARCHIVED')),
    active_baseline_version VARCHAR(30),
    manager_id UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    architect_id UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    librarian_id UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_id_code UNIQUE (id, code)
);

-- 7. ASIGNACIÓN MULTITENANT DE USUARIOS A PROYECTOS (Subsanación de inconsistencia DG-D03 vs RBAC_ACCESS_MATRIX)
CREATE TABLE IF NOT EXISTS traceflow.user_project_assignment (
    user_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, project_id)
);

COMMENT ON TABLE traceflow.user_project_assignment IS 'Particionamiento multitenant estricto por usuario y proyecto (ADR-006, RBAC_ACCESS_MATRIX Sección 5).';

-- 8. SESIONES OPACAS EN SERVIDOR (ADR-006)
CREATE TABLE IF NOT EXISTS traceflow.user_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE CASCADE,
    active_role_id INT NOT NULL REFERENCES traceflow.app_role(id) ON DELETE RESTRICT,
    session_token_hash VARCHAR(64) UNIQUE NOT NULL,  -- SHA-256 del token aleatorio de 256 bits
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_session_token_hash ON traceflow.user_session(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_user_session_user_activity ON traceflow.user_session(user_id, is_revoked, expires_at);

-- 9. ELEMENTOS DE CONFIGURACIÓN (ECS) Y CUSTODIA (ADR-005)
CREATE TABLE IF NOT EXISTS traceflow.config_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,                       -- ej. ECS-001 o SRC-AUTH-JWT.ts
    name VARCHAR(120) NOT NULL,
    description TEXT,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('CODIGO_FUENTE', 'DOCUMENTO_TECNICO', 'ESQUEMA_BD', 'SCRIPT_DESPLIEGUE', 'SOURCE_CODE', 'DOCUMENT', 'DB_SCHEMA', 'BUILD_SCRIPT')),
    current_library VARCHAR(20) NOT NULL DEFAULT 'TRABAJO' CHECK (current_library IN ('TRABAJO', 'SOPORTE', 'MAESTRA')),
    current_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    file_path VARCHAR(255) NOT NULL,
    sha256_checksum VARCHAR(64) NOT NULL,            -- Hash SHA-256 inmutable (RNF-03, RF-17)
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    author_id UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_ecs_code UNIQUE (project_id, code),
    CONSTRAINT uq_ecs_id_project UNIQUE (id, project_id)  -- Clave compuesta para asegurar integridad entre proyectos
);

CREATE INDEX IF NOT EXISTS idx_config_item_project ON traceflow.config_item(project_id);

-- 10. VERSIONES INMUTABLES DE ECS (RN-02, RNF-03)
CREATE TABLE IF NOT EXISTS traceflow.ecs_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ecs_id UUID NOT NULL REFERENCES traceflow.config_item(id) ON DELETE RESTRICT,
    version_number VARCHAR(20) NOT NULL,             -- Formato mayor.menor.parche
    sha256_checksum VARCHAR(64) NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    storage_status VARCHAR(20) NOT NULL DEFAULT 'COMMITTED' CHECK (storage_status IN ('PENDING_STORAGE', 'COMMITTED', 'STORAGE_FAILED')),
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    check_in_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    change_order_id UUID,                            -- Vinculado a la ECN ejecutada
    commit_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ecs_version UNIQUE (ecs_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_ecs_version_ecs ON traceflow.ecs_version(ecs_id);

-- 11. SOLICITUDES DE CAMBIO (RFC) — 14 ESTADOS CANÓNICOS TB-07
CREATE TABLE IF NOT EXISTS traceflow.change_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,                -- Código de negocio ej. RFC-2026-0001
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    target_ecs_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    justification TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    classification VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (classification IN ('CAMBIO_MENOR', 'CAMBIO_MAYOR', 'PENDIENTE')),
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTRADA' CHECK (status IN (
        'REGISTRADA',
        'EN_SUBSANACION',
        'CLASIFICADA',
        'EN_ANALISIS_TECNICO',
        'EN_EVALUACION',
        'AUTORIZADA',
        'ORDEN_EMITIDA',
        'EN_IMPLEMENTACION',
        'EN_PRUEBAS',
        'EN_ACEPTACION',
        'DESESTIMADA',
        'RECHAZADA',
        'CANCELADA',
        'IMPLEMENTADA'
    )),
    requested_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    observations TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    CONSTRAINT uq_rfc_id_project UNIQUE (id, project_id),
    CONSTRAINT fk_rfc_target_ecs_same_project FOREIGN KEY (target_ecs_id, project_id) REFERENCES traceflow.config_item(id, project_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_rfc_project_status ON traceflow.change_request(project_id, status);
CREATE INDEX IF NOT EXISTS idx_rfc_requester ON traceflow.change_request(requested_by);

-- 12. INFORME DE ANÁLISIS DE IMPACTO TÉCNICO (CU-06, RN-05)
CREATE TABLE IF NOT EXISTS traceflow.impact_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfc_id UUID UNIQUE NOT NULL REFERENCES traceflow.change_request(id) ON DELETE CASCADE,
    architect_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    classification VARCHAR(20) NOT NULL CHECK (classification IN ('CAMBIO_MENOR', 'CAMBIO_MAYOR')),
    architecture_impact TEXT NOT NULL,
    dependencies_impact TEXT,
    affected_ecs_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    effort_hours INT NOT NULL CHECK (effort_hours >= 0),
    estimated_cost NUMERIC(10,2) NOT NULL CHECK (estimated_cost >= 0),
    estimated_days INT NOT NULL CHECK (estimated_days >= 0),
    technical_risk VARCHAR(20) NOT NULL CHECK (technical_risk IN ('BAJO', 'MEDIO', 'ALTO')),
    scope_affected BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_affected BOOLEAN NOT NULL DEFAULT FALSE,
    cost_affected BOOLEAN NOT NULL DEFAULT FALSE,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AUTORIZACIÓN DELEGADA DE CAMBIO MENOR (CU-30 / DOBLE LLAVE OPERATIVA)
CREATE TABLE IF NOT EXISTS traceflow.change_authorization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfc_id UUID NOT NULL REFERENCES traceflow.change_request(id) ON DELETE CASCADE,
    authorizer_role VARCHAR(40) NOT NULL CHECK (authorizer_role IN ('GESTOR', 'ARQUITECTO')),
    authorizer_role_id VARCHAR(10) NOT NULL CHECK (authorizer_role_id IN ('PU-02', 'PU-03')),
    authorizer_user_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('APROBADO', 'RECHAZADO', 'REESCALADO_CCB')),
    justification TEXT NOT NULL,
    authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rfc_authorizer_role UNIQUE (rfc_id, authorizer_role)
);

COMMENT ON TABLE traceflow.change_authorization IS 'Doble llave obligatoria para Cambios Menores (PU-02 Gestor + PU-03 Arquitecto, identidades físicas distintas).';

-- 14. SESIÓN Y RESOLUCIÓN DEL CCB (CU-07, RN-01, RN-04)
CREATE TABLE IF NOT EXISTS traceflow.ccb_resolution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfc_id UUID NOT NULL REFERENCES traceflow.change_request(id) ON DELETE RESTRICT,
    resolution_code VARCHAR(50) UNIQUE NOT NULL,      -- Correlativo ej. ACT-CCB-2026-0001
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('AUTORIZADA', 'RECHAZADA', 'EN_DELIBERACION')),
    votes_in_favor INT NOT NULL DEFAULT 0,
    votes_against INT NOT NULL DEFAULT 0,
    votes_abstention INT NOT NULL DEFAULT 0,
    observations TEXT,
    resolved_by UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ
);

-- 15. VOTO INDIVIDUAL DE MIEMBROS DEL CCB (SoD-05: Unicidad e Inmutabilidad de Voto)
CREATE TABLE IF NOT EXISTS traceflow.ccb_vote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resolution_id UUID NOT NULL REFERENCES traceflow.ccb_resolution(id) ON DELETE CASCADE,
    rfc_id UUID NOT NULL REFERENCES traceflow.change_request(id) ON DELETE CASCADE,
    voter_user_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('APROBAR', 'RECHAZAR', 'ABSTENERSE')),
    justification TEXT NOT NULL,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ccb_vote_per_member UNIQUE (rfc_id, voter_user_id)
);

-- 16. ÓRDENES DE CAMBIO (ECN/ECO) (CU-08)
CREATE TABLE IF NOT EXISTS traceflow.change_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,                -- Código de negocio ej. ECN-2026-0001
    rfc_id UUID UNIQUE NOT NULL REFERENCES traceflow.change_request(id) ON DELETE RESTRICT,
    ecs_id UUID NOT NULL REFERENCES traceflow.config_item(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'EMITIDA' CHECK (status IN ('EMITIDA', 'EN_EJECUCION', 'CERRADA', 'CANCELADA')),
    issued_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    assigned_developer_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- 17. BLOQUEO EXCLUSIVO DE SINCRONIZACIÓN (RN-06)
CREATE TABLE IF NOT EXISTS traceflow.sync_lock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ecs_id UUID NOT NULL REFERENCES traceflow.config_item(id) ON DELETE RESTRICT,
    change_order_id UUID NOT NULL REFERENCES traceflow.change_order(id) ON DELETE RESTRICT,
    locked_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RELEASED')),
    work_library_path VARCHAR(255) NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    release_reason VARCHAR(30) CHECK (release_reason IN ('CHECK_IN', 'ROLLBACK', 'CANCELED'))
);

-- RESTRICCIÓN ÚNICA CONDICIONAL QUE BLINDA RN-06 A NIVEL DE MOTOR POSTGRESQL:
-- Garantiza que jamás existirá más de UN bloqueo en estado ACTIVE para un mismo ECS.
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_sync_lock_per_ecs
ON traceflow.sync_lock (ecs_id)
WHERE status = 'ACTIVE';

-- 18. CERTIFICACIÓN DE CALIDAD QA (CU-17, RN-01, SoD Incompatibilidad Dev vs QA)
CREATE TABLE IF NOT EXISTS traceflow.qa_certification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_order_id UUID NOT NULL REFERENCES traceflow.change_order(id) ON DELETE RESTRICT,
    ecs_version_id UUID REFERENCES traceflow.ecs_version(id) ON DELETE RESTRICT,
    result VARCHAR(20) NOT NULL CHECK (result IN ('CONFORME', 'NO_CONFORME')),
    test_suite_summary TEXT NOT NULL,
    certified_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    certified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. ACEPTACIÓN FORMAL UAT (CU-29, RN-09)
CREATE TABLE IF NOT EXISTS traceflow.uat_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_order_id UUID NOT NULL REFERENCES traceflow.change_order(id) ON DELETE RESTRICT,
    ecs_version_id UUID REFERENCES traceflow.ecs_version(id) ON DELETE RESTRICT,
    result VARCHAR(20) NOT NULL CHECK (result IN ('ACEPTADO', 'RECHAZADO')),
    observations TEXT NOT NULL,
    accepted_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. LÍNEAS BASE (CU-20, RN-02, RN-09)
CREATE TABLE IF NOT EXISTS traceflow.baseline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    code VARCHAR(30) UNIQUE NOT NULL,                -- Código de negocio ej. BSL-2026-0001
    name VARCHAR(120) NOT NULL,
    version_label VARCHAR(30) NOT NULL,              -- ej. v1.2.0
    status VARCHAR(20) NOT NULL DEFAULT 'CONGELADA' CHECK (status IN ('CONGELADA', 'OBSOLETA')),
    frozen_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    frozen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traceflow.baseline_item (
    baseline_id UUID NOT NULL REFERENCES traceflow.baseline(id) ON DELETE CASCADE,
    ecs_version_id UUID NOT NULL REFERENCES traceflow.ecs_version(id) ON DELETE RESTRICT,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (baseline_id, ecs_version_id)
);

-- 21. TICKETS DE INCIDENCIA (MOD-08)
CREATE TABLE IF NOT EXISTS traceflow.incident_ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    code VARCHAR(30) UNIQUE NOT NULL,                -- Código de negocio ej. INC-2026-0001
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    reported_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO' CHECK (status IN ('REGISTRADO', 'DERIVADO', 'ATENDIDO', 'CERRADO')),
    derived_rfc_id UUID REFERENCES traceflow.change_request(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. PISTA INMUTABLE DE AUDITORÍA FORENSE APPEND-ONLY CON CADENA CRIPTOGRÁFICA (ADR-008, RN-02)
CREATE TABLE IF NOT EXISTS traceflow.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_number BIGSERIAL NOT NULL UNIQUE,       -- Secuencia monótona estricta
    event_code VARCHAR(30),                          -- ej. EVT-2026-0001
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_user_id UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL,
    actor_role VARCHAR(50) NOT NULL,
    operation VARCHAR(60) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    project_id UUID REFERENCES traceflow.project(id) ON DELETE SET NULL,
    related_ecn_id UUID REFERENCES traceflow.change_order(id) ON DELETE SET NULL,
    result_status VARCHAR(20) NOT NULL CHECK (result_status IN ('SUCCESS', 'FAILURE', 'REJECTED')),
    payload_diff JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    prev_log_hash VARCHAR(64) NOT NULL,              -- Hash del registro cronológico inmediatamente anterior
    curr_log_hash VARCHAR(64) NOT NULL               -- SHA-256 acumulado con serialización
);

CREATE INDEX IF NOT EXISTS idx_audit_log_seq ON traceflow.audit_log(sequence_number);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON traceflow.audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_project ON traceflow.audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON traceflow.audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON traceflow.audit_log(operation);

-- 23. TRIGGER DEFENSIVO DE INMUTABILIDAD CONTRA UPDATE O DELETE EN AUDIT_LOG (ADR-008, SAD 11.1)
CREATE OR REPLACE FUNCTION traceflow.prevent_audit_log_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACIÓN DE INMUTABILIDAD (ADR-008 / RN-02): Los registros de audit_log son estrictamente append-only y no pueden modificarse ni eliminarse.';
    RETURN NULL;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_log_immutable'
    ) THEN
        CREATE TRIGGER trg_audit_log_immutable
        BEFORE UPDATE OR DELETE ON traceflow.audit_log
        FOR EACH ROW EXECUTE FUNCTION traceflow.prevent_audit_log_tampering();
    END IF;
END $$;

-- 24. FUNCIÓN TRANSACCIONAL DE INSERCIÓN SERIALIZADA PARA CADENA HASH SHA-256 (SIN CONDICIONES DE CARRERA)
CREATE OR REPLACE FUNCTION traceflow.append_audit_log(
    p_event_code VARCHAR(30),
    p_actor_user_id UUID,
    p_actor_role VARCHAR(50),
    p_operation VARCHAR(60),
    p_entity_name VARCHAR(50),
    p_entity_id VARCHAR(50),
    p_project_id UUID,
    p_related_ecn_id UUID,
    p_result_status VARCHAR(20),
    p_payload_diff JSONB,
    p_ip_address VARCHAR(45),
    p_user_agent TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_last_hash VARCHAR(64);
    v_new_hash VARCHAR(64);
    v_timestamp TIMESTAMPTZ;
    v_inserted_id UUID;
    v_hash_input TEXT;
BEGIN
    -- Serialización transaccional mediante lock consultivo a nivel de transacción
    -- Identificador exclusivo para TraceFlow Audit Log (74291 = 'TFAL')
    PERFORM pg_advisory_xact_lock(74291);

    -- Obtener el hash inmediatamente anterior (o génesis si es el primer registro)
    SELECT curr_log_hash INTO v_last_hash
    FROM traceflow.audit_log
    ORDER BY sequence_number DESC
    LIMIT 1;

    IF v_last_hash IS NULL THEN
        v_last_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    END IF;

    v_timestamp := clock_timestamp();

    -- Cálculo canónico de hash SHA-256: SHA256(prev_hash || timestamp || actor_id || operation || payload_diff)
    v_hash_input := v_last_hash || v_timestamp::text || COALESCE(p_actor_user_id::text, 'ANONYMOUS') || p_operation || COALESCE(p_payload_diff::text, '{}');
    v_new_hash := encode(digest(v_hash_input, 'sha256'), 'hex');

    INSERT INTO traceflow.audit_log (
        event_code,
        timestamp,
        actor_user_id,
        actor_role,
        operation,
        entity_name,
        entity_id,
        project_id,
        related_ecn_id,
        result_status,
        payload_diff,
        ip_address,
        user_agent,
        prev_log_hash,
        curr_log_hash
    ) VALUES (
        p_event_code,
        v_timestamp,
        p_actor_user_id,
        p_actor_role,
        p_operation,
        p_entity_name,
        p_entity_id,
        p_project_id,
        p_related_ecn_id,
        p_result_status,
        COALESCE(p_payload_diff, '{}'::jsonb),
        p_ip_address,
        p_user_agent,
        v_last_hash,
        v_new_hash
    ) RETURNING id INTO v_inserted_id;

    RETURN v_inserted_id;
END;
$$;

-- 25. POLÍTICA DE SEGURIDAD Y MÍNIMO PRIVILEGIO (ADR-004, ADR-006, ADR-008)
-- Revocar accesos por defecto a roles de PostgREST / web si existen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON SCHEMA traceflow FROM anon;
        REVOKE ALL ON ALL TABLES IN SCHEMA traceflow FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON SCHEMA traceflow FROM authenticated;
        REVOKE ALL ON ALL TABLES IN SCHEMA traceflow FROM authenticated;
    END IF;
END $$;
