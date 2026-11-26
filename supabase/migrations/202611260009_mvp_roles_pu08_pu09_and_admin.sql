-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL (HITO MVP-H01)
-- Archivo: 202611260009_mvp_roles_pu08_pu09_and_admin.sql
-- Hito: MVP-H01 — Administración del Sistema (PU-08), Preparación PU-09 e Invitaciones
-- Motor: PostgreSQL 16+ / Supabase
-- Marco Normativo: PLAN_DESARROLLO_MVP.md, MATRIZ_PERFILES_PERMISOS.md, DA-06, SEC-02
-- ============================================================================

BEGIN;

-- 0. COMPROBACIONES PRE-MIGRACIÓN
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_name = 'app_role'
    ) THEN
        RAISE EXCEPTION '[PRE-CHECK ERROR] Tabla traceflow.app_role no encontrada.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_name = 'app_user'
    ) THEN
        RAISE EXCEPTION '[PRE-CHECK ERROR] Tabla traceflow.app_user no encontrada.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_name = 'user_role_assignment'
    ) THEN
        RAISE EXCEPTION '[PRE-CHECK ERROR] Tabla traceflow.user_role_assignment no encontrada.';
    END IF;
END $$;

-- 1. AMPLIACIÓN DEL CATÁLOGO CANÓNICO DE ROLES (PU-08 Y PU-09)
-- Conserva intactos los identificadores y códigos históricos PU-01..PU-07 (ids 1..7)
INSERT INTO traceflow.app_role (id, code, name, description) VALUES
(8, 'PU-08', 'Administrador del Sistema', 'Gestiona usuarios, estados de cuentas, organizaciones, invitaciones y autorizaciones para crear proyectos.'),
(9, 'PU-09', 'Jefe de Proyecto', 'Crea e inicializa proyectos cuando está autorizado, configura metodología y cronograma, vincula GitHub y conforma equipos.')
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Sincronizar secuencia de traceflow.app_role para prevenir colisiones futuras
SELECT setval(
    pg_get_serial_sequence('traceflow.app_role', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM traceflow.app_role), 9),
    true
);

COMMENT ON TABLE traceflow.app_role IS 'Catálogo canónico de perfiles de usuario PU-01 a PU-09.';

-- 2. AUTORIZACIÓN DE CREACIÓN DE PROYECTOS E IDENTIDAD GITHUB EN traceflow.app_user
ALTER TABLE traceflow.app_user
    ADD COLUMN IF NOT EXISTS can_create_projects BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS project_creation_authorized_by UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS project_creation_authorized_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS github_username VARCHAR(100),
    ADD COLUMN IF NOT EXISTS github_user_id BIGINT,
    ADD COLUMN IF NOT EXISTS github_identity_status VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED';

ALTER TABLE traceflow.app_user DROP CONSTRAINT IF EXISTS chk_app_user_github_identity_status;
ALTER TABLE traceflow.app_user ADD CONSTRAINT chk_app_user_github_identity_status
    CHECK (github_identity_status IN ('UNVERIFIED', 'DECLARED', 'VERIFIED'));

-- Unicidad exclusiva sobre github_user_id permanente verificado (cuando sea no nulo)
CREATE UNIQUE INDEX IF NOT EXISTS uq_app_user_github_user_id
    ON traceflow.app_user (github_user_id)
    WHERE github_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_user_can_create_projects
    ON traceflow.app_user (can_create_projects)
    WHERE can_create_projects = TRUE;

COMMENT ON COLUMN traceflow.app_user.can_create_projects IS 'Autorización explícita otorgada por PU-08 para crear proyectos (política default-deny).';
COMMENT ON COLUMN traceflow.app_user.github_username IS 'Nombre de usuario GitHub declarado manualmente o verificado. No autentica ni otorga permisos sin verificación OAuth/ID.';
COMMENT ON COLUMN traceflow.app_user.github_user_id IS 'Identificador numérico permanente de GitHub reservado para futura verificación criptográfica/OAuth.';

-- 3. REVOCACIÓN Y ACTIVACIÓN LÓGICA EN traceflow.user_role_assignment (SIN DELETE)
ALTER TABLE traceflow.user_role_assignment
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE traceflow.user_role_assignment DROP CONSTRAINT IF EXISTS chk_user_role_assignment_status;
ALTER TABLE traceflow.user_role_assignment ADD CONSTRAINT chk_user_role_assignment_status
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED'));

CREATE INDEX IF NOT EXISTS idx_user_role_assignment_active
    ON traceflow.user_role_assignment (user_id, status);

-- 4. CONTEXTO OPCIONAL DE PROYECTO ACTIVO EN traceflow.user_session (PREPARACIÓN MVP-H02)
ALTER TABLE traceflow.user_session
    ADD COLUMN IF NOT EXISTS active_project_id UUID REFERENCES traceflow.project(id) ON DELETE SET NULL;

-- 5. TABLA DE INVITACIONES PENDIENTES (UI + VALIDACIONES + PERSISTENCIA SIN SERVICIO EXTERNO)
CREATE TABLE IF NOT EXISTS traceflow.user_invitation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'GITHUB')),
    email VARCHAR(100),
    github_username VARCHAR(100),
    organization_id UUID REFERENCES traceflow.organization(id) ON DELETE RESTRICT,
    project_id UUID REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    intended_role_id INT NOT NULL REFERENCES traceflow.app_role(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CANCELLED', 'EXPIRED', 'ACCEPTED')),
    invited_by UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    cancelled_by UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    cancelled_at TIMESTAMPTZ,
    accepted_user_id UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    accepted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT chk_user_invitation_recipient CHECK (
        (channel = 'EMAIL' AND email IS NOT NULL AND length(trim(email)) > 0)
        OR
        (channel = 'GITHUB' AND github_username IS NOT NULL AND length(trim(github_username)) > 0)
    )
);

COMMENT ON TABLE traceflow.user_invitation IS 'Invitaciones pendientes por correo o GitHub (MVP: persistencia local sin envío externo ni OAuth; sin tokens en texto plano).';

-- Índices parciales para prevenir invitaciones PENDING duplicadas en el mismo ámbito
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_invitation_email_scope
    ON traceflow.user_invitation (
        LOWER(email),
        COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
        intended_role_id
    )
    WHERE status = 'PENDING' AND channel = 'EMAIL';

CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_invitation_github_scope
    ON traceflow.user_invitation (
        LOWER(github_username),
        COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
        COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid),
        intended_role_id
    )
    WHERE status = 'PENDING' AND channel = 'GITHUB';

CREATE INDEX IF NOT EXISTS idx_user_invitation_status ON traceflow.user_invitation (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_invitation_org ON traceflow.user_invitation (organization_id);

-- 6. DISPARADOR DE SEGURIDAD PARA INVITACIONES (PROHIBIR PU-08 Y ACEPTACIÓN SIN VERIFICACIÓN)
CREATE OR REPLACE FUNCTION traceflow.enforce_invitation_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
DECLARE
    v_role_code VARCHAR(30);
    v_allow_accept TEXT;
BEGIN
    SELECT code INTO v_role_code
    FROM traceflow.app_role
    WHERE id = NEW.intended_role_id;

    IF v_role_code IS NULL THEN
        RAISE EXCEPTION 'El perfil propuesto (%) no existe en traceflow.app_role.', NEW.intended_role_id;
    END IF;

    -- Regla estricta: Nunca asignar PU-08 mediante invitaciones
    IF v_role_code = 'PU-08' THEN
        RAISE EXCEPTION 'VIOLACIÓN DE SEGURIDAD (MVP-H01): No está permitido asignar el perfil PU-08 (Administrador del Sistema) mediante invitaciones.';
    END IF;

    -- Regla estricta: La aceptación externa permanece bloqueada hasta contar con verificación de identidad (OAuth/token verificado)
    IF NEW.status = 'ACCEPTED' THEN
        BEGIN
            v_allow_accept := current_setting('traceflow.allow_verified_invitation_acceptance', true);
        EXCEPTION WHEN OTHERS THEN
            v_allow_accept := 'false';
        END;

        IF v_allow_accept IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'OPERACIÓN BLOQUEADA (MVP-H01): La aceptación externa de invitaciones está deshabilitada hasta implementar verificación formal de identidad.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_invitation_security ON traceflow.user_invitation;
CREATE TRIGGER trg_enforce_invitation_security
    BEFORE INSERT OR UPDATE ON traceflow.user_invitation
    FOR EACH ROW EXECUTE FUNCTION traceflow.enforce_invitation_security();

REVOKE EXECUTE ON FUNCTION traceflow.enforce_invitation_security() FROM PUBLIC;

-- 7. MÍNIMO PRIVILEGIO ACTUALIZADO PARA traceflow_app (SEC-02: SIN DELETE)
GRANT SELECT, INSERT, UPDATE ON TABLE
    traceflow.user_role_assignment,
    traceflow.user_invitation
TO traceflow_app;

REVOKE DELETE ON TABLE
    traceflow.app_role,
    traceflow.app_user,
    traceflow.user_role_assignment,
    traceflow.user_session,
    traceflow.user_invitation
FROM traceflow_app;

-- 8. COMPROBACIONES POST-MIGRACIÓN
DO $$
DECLARE
    v_roles_count INT;
BEGIN
    SELECT COUNT(*) INTO v_roles_count
    FROM traceflow.app_role
    WHERE code IN ('PU-01','PU-02','PU-03','PU-04','PU-05','PU-06','PU-07','PU-08','PU-09');

    IF v_roles_count != 9 THEN
        RAISE EXCEPTION '[POST-CHECK ERROR] Catálogo app_role incompleto tras migración: % de 9 perfiles.', v_roles_count;
    END IF;
END $$;

COMMIT;
