-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL: MÍNIMO PRIVILEGIO E INVARIANTES SCM
-- Archivo: 202611250003_secure_app_role_least_privilege.sql
-- Hito: DB-02.1 — Remediación de Seguridad e Integración Funcional Completa
-- Normas: SAD v1.1 2.2, SAD v0.2 Secciones 7, 8, 11 y 12, ADR-004, ADR-008, RBAC Matrix
-- Cobertura: SEC-02 (Least Privilege), SEC-03 (Inmutabilidad), SEC-04 (Doble Llave), SEC-05 (SoD)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEC-03: INVARIANTES DE INMUTABILIDAD EN BASE DE DATOS
-- ----------------------------------------------------------------------------

-- 1.1 Inmutabilidad estricta de ecs_version (RNF-03, RN-02)
CREATE OR REPLACE FUNCTION traceflow.prevent_ecs_version_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACIÓN DE INMUTABILIDAD (RNF-03 / RN-02): Los registros de versiones de ECS (ecs_version) son inmutables; no se permite su modificación ni eliminación.';
    RETURN NULL;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ecs_version_immutable') THEN
        CREATE TRIGGER trg_ecs_version_immutable
        BEFORE UPDATE OR DELETE ON traceflow.ecs_version
        FOR EACH ROW EXECUTE FUNCTION traceflow.prevent_ecs_version_tampering();
    END IF;
END $$;

-- 1.2 Inmutabilidad estricta de ccb_vote (SoD-05, RN-04)
CREATE OR REPLACE FUNCTION traceflow.prevent_ccb_vote_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACIÓN DE INMUTABILIDAD (SoD-05 / RN-04): El voto de un miembro del CCB es irrevocable e inmutable una vez emitido.';
    RETURN NULL;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ccb_vote_immutable') THEN
        CREATE TRIGGER trg_ccb_vote_immutable
        BEFORE UPDATE OR DELETE ON traceflow.ccb_vote
        FOR EACH ROW EXECUTE FUNCTION traceflow.prevent_ccb_vote_tampering();
    END IF;
END $$;

-- 1.3 Firmeza e inmutabilidad de change_authorization (CU-30, ADR-005)
CREATE OR REPLACE FUNCTION traceflow.prevent_change_authorization_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACIÓN DE FIRMEZA (CU-30 / ADR-005): Las autorizaciones de cambio no pueden ser modificadas ni eliminadas.';
    RETURN NULL;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_change_authorization_immutable') THEN
        CREATE TRIGGER trg_change_authorization_immutable
        BEFORE UPDATE OR DELETE ON traceflow.change_authorization
        FOR EACH ROW EXECUTE FUNCTION traceflow.prevent_change_authorization_tampering();
    END IF;
END $$;

-- 1.4 Inmutabilidad de Líneas Base Congeladas (RN-02, RN-09)
CREATE OR REPLACE FUNCTION traceflow.prevent_frozen_baseline_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' AND OLD.status = 'CONGELADA' THEN
        RAISE EXCEPTION 'VIOLACIÓN DE LÍNEA BASE (RN-02): Una línea base congelada no puede ser eliminada.';
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.status = 'CONGELADA' THEN
        IF NEW.status != 'OBSOLETA' OR NEW.code != OLD.code OR NEW.project_id != OLD.project_id OR NEW.version_label != OLD.version_label THEN
            RAISE EXCEPTION 'VIOLACIÓN DE LÍNEA BASE (RN-02): Una línea base congelada solo puede ser marcada como OBSOLETA, sin alterar sus atributos identificadores.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_baseline_frozen_guard') THEN
        CREATE TRIGGER trg_baseline_frozen_guard
        BEFORE UPDATE OR DELETE ON traceflow.baseline
        FOR EACH ROW EXECUTE FUNCTION traceflow.prevent_frozen_baseline_tampering();
    END IF;
END $$;

CREATE OR REPLACE FUNCTION traceflow.prevent_frozen_baseline_item_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
DECLARE
    v_status VARCHAR;
BEGIN
    SELECT status INTO v_status FROM traceflow.baseline WHERE id = OLD.baseline_id;
    IF v_status = 'CONGELADA' THEN
        RAISE EXCEPTION 'VIOLACIÓN DE LÍNEA BASE (RN-02 / RN-09): No se pueden modificar ni eliminar ítems de una línea base congelada.';
    END IF;
    RETURN OLD;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_baseline_item_frozen_guard') THEN
        CREATE TRIGGER trg_baseline_item_frozen_guard
        BEFORE UPDATE OR DELETE ON traceflow.baseline_item
        FOR EACH ROW EXECUTE FUNCTION traceflow.prevent_frozen_baseline_item_tampering();
    END IF;
END $$;

-- 1.5 Prohibición de DELETE directo sobre sync_lock (RN-06)
CREATE OR REPLACE FUNCTION traceflow.prevent_sync_lock_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
BEGIN
    RAISE EXCEPTION 'VIOLACIÓN DE CONCURRENCIA (RN-06): Está prohibido eliminar registros de sync_lock mediante DELETE directo. La liberación debe realizarse mediante UPDATE status = ''RELEASED''.';
    RETURN NULL;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_lock_no_delete') THEN
        CREATE TRIGGER trg_sync_lock_no_delete
        BEFORE DELETE ON traceflow.sync_lock
        FOR EACH ROW EXECUTE FUNCTION traceflow.prevent_sync_lock_delete();
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. SEC-04: SEGREGACIÓN FÍSICA DE IDENTIDADES EN DOBLE LLAVE (CU-30)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION traceflow.enforce_double_key_segregation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
DECLARE
    v_requester_id UUID;
    v_existing_authorizer UUID;
BEGIN
    -- 1. Anti-autoevaluación: El solicitante no puede ser autorizador de su propia RFC
    SELECT requested_by INTO v_requester_id FROM traceflow.change_request WHERE id = NEW.rfc_id;
    IF v_requester_id IS NOT NULL AND NEW.authorizer_user_id = v_requester_id THEN
        RAISE EXCEPTION 'VIOLACIÓN DE SoD (SoD-01 / CU-30): El solicitante de la RFC no puede autoautorizar su propio cambio.';
    END IF;

    -- 2. Segregación física: La segunda llave no puede ser emitida por el mismo usuario físico
    SELECT authorizer_user_id INTO v_existing_authorizer
    FROM traceflow.change_authorization
    WHERE rfc_id = NEW.rfc_id
    LIMIT 1;

    IF v_existing_authorizer IS NOT NULL AND v_existing_authorizer = NEW.authorizer_user_id THEN
        RAISE EXCEPTION 'VIOLACIÓN DE DOBLE LLAVE (CU-30 / ADR-005): La doble llave operativa exige dos identidades físicas distintas (PU-02 Gestor y PU-03 Arquitecto no pueden ser la misma persona).';
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_double_key_segregation') THEN
        CREATE TRIGGER trg_enforce_double_key_segregation
        BEFORE INSERT ON traceflow.change_authorization
        FOR EACH ROW EXECUTE FUNCTION traceflow.enforce_double_key_segregation();
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. SEC-05: REGLAS DE ANTI-AUTOEVALUACIÓN REFORZADA (SoD-01)
-- ----------------------------------------------------------------------------

-- 3.1 Un usuario no puede emitir informe de impacto técnico sobre su propia RFC
CREATE OR REPLACE FUNCTION traceflow.enforce_impact_assessment_sod()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
DECLARE
    v_requester_id UUID;
BEGIN
    SELECT requested_by INTO v_requester_id FROM traceflow.change_request WHERE id = NEW.rfc_id;
    IF v_requester_id IS NOT NULL AND NEW.architect_id = v_requester_id THEN
        RAISE EXCEPTION 'VIOLACIÓN DE SoD (SoD-01 / CU-06): El solicitante de la RFC no puede emitir el informe de impacto técnico sobre su propia solicitud.';
    END IF;
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_impact_assessment_sod') THEN
        CREATE TRIGGER trg_enforce_impact_assessment_sod
        BEFORE INSERT ON traceflow.impact_assessment
        FOR EACH ROW EXECUTE FUNCTION traceflow.enforce_impact_assessment_sod();
    END IF;
END $$;

-- 3.2 Un usuario no puede votar en el CCB sobre una RFC que él mismo solicitó
CREATE OR REPLACE FUNCTION traceflow.enforce_ccb_vote_sod()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
DECLARE
    v_requester_id UUID;
BEGIN
    SELECT requested_by INTO v_requester_id FROM traceflow.change_request WHERE id = NEW.rfc_id;
    IF v_requester_id IS NOT NULL AND NEW.voter_user_id = v_requester_id THEN
        RAISE EXCEPTION 'VIOLACIÓN DE SoD (SoD-01 / SoD-05): El solicitante de la RFC no puede emitir votos en el CCB sobre su propia solicitud.';
    END IF;
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_ccb_vote_sod') THEN
        CREATE TRIGGER trg_enforce_ccb_vote_sod
        BEFORE INSERT ON traceflow.ccb_vote
        FOR EACH ROW EXECUTE FUNCTION traceflow.enforce_ccb_vote_sod();
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. SEC-02: REESTRUCTURACIÓN DE PRIVILEGIOS MÍNIMOS (LEAST PRIVILEGE) PARA traceflow_app
-- ----------------------------------------------------------------------------

-- 4.1 Revocar concesiones genéricas anteriores
REVOKE ALL ON ALL TABLES IN SCHEMA traceflow FROM traceflow_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA traceflow FROM traceflow_app;
REVOKE ALL ON ALL ROUTINES IN SCHEMA traceflow FROM traceflow_app;

-- 4.2 Privilegios base de esquema y ejecución
GRANT USAGE ON SCHEMA traceflow TO traceflow_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA traceflow TO traceflow_app;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA traceflow TO traceflow_app;

-- 4.3 Tablas de Solo Lectura (SELECT)
GRANT SELECT ON TABLE 
    traceflow.app_role,
    traceflow.project,
    traceflow.user_role_assignment,
    traceflow.user_project_assignment,
    traceflow.baseline,
    traceflow.baseline_item
TO traceflow_app;

-- 4.4 Tablas de Lectura y Escritura (SELECT, INSERT, UPDATE — Sin DELETE)
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

-- 4.5 Tablas de Solo Adición / Lectura (SELECT, INSERT — Sin UPDATE, Sin DELETE)
GRANT SELECT, INSERT ON TABLE 
    traceflow.change_authorization,
    traceflow.ccb_resolution,
    traceflow.ccb_vote,
    traceflow.audit_log,
    traceflow.ecs_version
TO traceflow_app;

-- 4.6 Ajuste de privilegios por defecto para evitar concesiones genéricas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA traceflow REVOKE ALL ON TABLES FROM traceflow_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA traceflow GRANT USAGE, SELECT ON SEQUENCES TO traceflow_app;
