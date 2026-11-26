-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL HITO INIT-H03
-- Archivo: 202611260002_init_h03_team_methodology_planning.sql
-- Motor: PostgreSQL 16+ / Supabase
-- Marco Normativo: DA-01 a DA-06, ADR-011, Plan Maestro, IEEE 828, RNF-01
--
-- OBJETIVO DEL HITO:
-- Implementación del segundo nivel de configuración de proyectos en TraceFlow SCM:
--   1. project_setup: Persistencia de guardado progresivo (Wizard Steps 1 a 5, DA-05).
--   2. project_team_role: Asignación de roles de proyecto (PU-01 a PU-07) con blindaje DA-06.
--   3. project_methodology: Configuración metodológica (SCRUM, KANBAN, CASCADA, HIBRIDA, UPT_ACADEMICA).
--   4. project_phase: Estructura de fases y cronograma secuencial.
--   5. project_milestone: Hitos de proyecto vinculados opcionalmente a fases.
--   6. project_deliverable: Entregables planificados con enlace opcional a ECS (sin ECS ficticios).
--
-- REGLAS DE SEGURIDAD Y GOBERNANZA:
-- - Mínimo privilegio para traceflow_app: SELECT, INSERT, UPDATE exclusivamente (sin DELETE).
-- - Disparadores de integridad institucional: los usuarios asignados al equipo deben ser
--   miembros activos (status = 'ACTIVE') de la organización propietaria del proyecto (DA-06).
-- - Restricción de aislamiento cruzado: hitos y entregables no pueden referenciar fases
--   de otros proyectos.
-- ============================================================================

BEGIN;

-- 1. TABLA DE CONFIGURACIÓN PROGRESIVA Y ASISTENTE (DA-05)
CREATE TABLE IF NOT EXISTS traceflow.project_setup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES traceflow.project(id) ON DELETE CASCADE,
    wizard_step INT NOT NULL DEFAULT 1 CHECK (wizard_step BETWEEN 1 AND 5),
    wizard_completed BOOLEAN NOT NULL DEFAULT FALSE,
    identity_completed BOOLEAN NOT NULL DEFAULT TRUE,
    team_completed BOOLEAN NOT NULL DEFAULT FALSE,
    methodology_completed BOOLEAN NOT NULL DEFAULT FALSE,
    github_completed BOOLEAN NOT NULL DEFAULT FALSE,
    validation_completed BOOLEAN NOT NULL DEFAULT FALSE,
    draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_saved_by UUID REFERENCES traceflow.app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE traceflow.project_setup IS 'Persistencia y estado progresivo del asistente de configuración (DA-05).';

-- 2. TABLA DE ROLES FUNCIONALES DEL EQUIPO EN EL PROYECTO (DA-06, PU-01 a PU-07)
CREATE TABLE IF NOT EXISTS traceflow.project_team_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    role_id INT NOT NULL REFERENCES traceflow.app_role(id) ON DELETE RESTRICT,
    functional_title VARCHAR(100),
    is_lead BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_user_role UNIQUE (project_id, user_id, role_id)
);

COMMENT ON TABLE traceflow.project_team_role IS 'Asignación de roles funcionales canónicos a nivel de proyecto (DA-06).';

-- 3. TABLA DE METODOLOGÍA DEL PROYECTO
CREATE TABLE IF NOT EXISTS traceflow.project_methodology (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    methodology_type VARCHAR(30) NOT NULL,
    iteration_duration_weeks INT DEFAULT 2,
    active_phase_code VARCHAR(30),
    configuration_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_methodology_type CHECK (methodology_type IN ('SCRUM', 'KANBAN', 'CASCADA', 'HIBRIDA', 'UPT_ACADEMICA')),
    CONSTRAINT chk_iteration_duration CHECK (iteration_duration_weeks IS NULL OR iteration_duration_weeks > 0)
);

COMMENT ON TABLE traceflow.project_methodology IS 'Definición de marco de trabajo y parámetros metodológicos del proyecto.';

-- 4. TABLA DE FASES DEL PROYECTO (CRONOGRAMA)
CREATE TABLE IF NOT EXISTS traceflow.project_phase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    phase_code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    sequence_order INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_phase_order UNIQUE (project_id, sequence_order),
    CONSTRAINT uq_project_phase_code UNIQUE (project_id, phase_code),
    CONSTRAINT chk_phase_dates CHECK (end_date >= start_date)
);

COMMENT ON TABLE traceflow.project_phase IS 'Fases temporales y secuenciales de ejecución del proyecto.';

-- 5. TABLA DE HITOS DEL PROYECTO
CREATE TABLE IF NOT EXISTS traceflow.project_milestone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    phase_id UUID REFERENCES traceflow.project_phase(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    target_date DATE NOT NULL,
    completion_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACHIEVED', 'DELAYED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_milestone_code UNIQUE (project_id, code)
);

COMMENT ON TABLE traceflow.project_milestone IS 'Hitos verificables del proyecto con asociación opcional a fase.';

-- 6. TABLA DE ENTREGABLES PLANIFICADOS
CREATE TABLE IF NOT EXISTS traceflow.project_deliverable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES traceflow.project(id) ON DELETE RESTRICT,
    phase_id UUID REFERENCES traceflow.project_phase(id) ON DELETE RESTRICT,
    milestone_id UUID REFERENCES traceflow.project_milestone(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    expected_type VARCHAR(50) NOT NULL CHECK (expected_type IN ('SOFTWARE_RELEASE', 'TECHNICAL_DOCUMENT', 'SOURCE_BRANCH', 'TEST_REPORT', 'DB_MIGRATION')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED')),
    responsible_user_id UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    target_date DATE,
    associated_ecs_id UUID REFERENCES traceflow.config_item(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_deliverable_code UNIQUE (project_id, code)
);

COMMENT ON TABLE traceflow.project_deliverable IS 'Entregables planificados con enlace opcional a ECS (INIT-H04).';

-- 7. DISPARADOR DE INTEGRIDAD INSTITUCIONAL PARA ASIGNACIÓN DE ROLES (DA-06)
CREATE OR REPLACE FUNCTION traceflow.enforce_project_team_role_org_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
DECLARE
    v_project_org_id UUID;
    v_user_active_in_org BOOLEAN;
    v_user_active_system BOOLEAN;
BEGIN
    -- a) Validar que el usuario exista y esté activo en el sistema
    SELECT (status = 'ACTIVE') INTO v_user_active_system
    FROM traceflow.app_user
    WHERE id = NEW.user_id;

    IF v_user_active_system IS NULL OR NOT v_user_active_system THEN
        RAISE EXCEPTION 'Violación de integridad (DA-06): El usuario % no está registrado o no se encuentra activo en el sistema.', NEW.user_id;
    END IF;

    -- b) Obtener la organización propietaria del proyecto
    SELECT organization_id INTO v_project_org_id
    FROM traceflow.project
    WHERE id = NEW.project_id;

    IF v_project_org_id IS NULL THEN
        RAISE EXCEPTION 'Violación de aislamiento (DA-02): El proyecto % no tiene una organización asignada.', NEW.project_id;
    END IF;

    -- c) Validar membresía activa del usuario en dicha organización
    SELECT (status = 'ACTIVE') INTO v_user_active_in_org
    FROM traceflow.organization_member
    WHERE organization_id = v_project_org_id
      AND user_id = NEW.user_id;

    IF v_user_active_in_org IS NULL OR NOT v_user_active_in_org THEN
        RAISE EXCEPTION 'Violación de segregación institucional (DA-06): El usuario % no es miembro activo de la organización % propietaria del proyecto %.',
            NEW.user_id, v_project_org_id, NEW.project_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_project_team_role_org ON traceflow.project_team_role;
CREATE TRIGGER trg_check_project_team_role_org
    BEFORE INSERT OR UPDATE ON traceflow.project_team_role
    FOR EACH ROW
    EXECUTE FUNCTION traceflow.enforce_project_team_role_org_integrity();

-- 8. DISPARADORES DE CONSISTENCIA PARA HITOS Y ENTREGABLES DE PROYECTO
CREATE OR REPLACE FUNCTION traceflow.enforce_milestone_project_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
DECLARE
    v_phase_project_id UUID;
BEGIN
    -- Validar que la fase pertenezca al mismo proyecto
    IF NEW.phase_id IS NOT NULL THEN
        SELECT project_id INTO v_phase_project_id
        FROM traceflow.project_phase
        WHERE id = NEW.phase_id;

        IF v_phase_project_id IS NULL OR v_phase_project_id != NEW.project_id THEN
            RAISE EXCEPTION 'Inconsistencia de proyecto: La fase referenciada % no pertenece al proyecto %.', NEW.phase_id, NEW.project_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_milestone_project ON traceflow.project_milestone;
CREATE TRIGGER trg_check_milestone_project
    BEFORE INSERT OR UPDATE ON traceflow.project_milestone
    FOR EACH ROW
    EXECUTE FUNCTION traceflow.enforce_milestone_project_consistency();

CREATE OR REPLACE FUNCTION traceflow.enforce_deliverable_project_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = traceflow, pg_catalog, pg_temp
AS $$
DECLARE
    v_phase_project_id UUID;
    v_milestone_project_id UUID;
BEGIN
    -- Validar que la fase pertenezca al mismo proyecto
    IF NEW.phase_id IS NOT NULL THEN
        SELECT project_id INTO v_phase_project_id
        FROM traceflow.project_phase
        WHERE id = NEW.phase_id;

        IF v_phase_project_id IS NULL OR v_phase_project_id != NEW.project_id THEN
            RAISE EXCEPTION 'Inconsistencia de proyecto: La fase referenciada % no pertenece al proyecto %.', NEW.phase_id, NEW.project_id;
        END IF;
    END IF;

    -- Validar que el hito pertenezca al mismo proyecto
    IF NEW.milestone_id IS NOT NULL THEN
        SELECT project_id INTO v_milestone_project_id
        FROM traceflow.project_milestone
        WHERE id = NEW.milestone_id;

        IF v_milestone_project_id IS NULL OR v_milestone_project_id != NEW.project_id THEN
            RAISE EXCEPTION 'Inconsistencia de proyecto: El hito referenciado % no pertenece al proyecto %.', NEW.milestone_id, NEW.project_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_deliverable_project ON traceflow.project_deliverable;
CREATE TRIGGER trg_check_deliverable_project
    BEFORE INSERT OR UPDATE ON traceflow.project_deliverable
    FOR EACH ROW
    EXECUTE FUNCTION traceflow.enforce_deliverable_project_consistency();

-- 9. PERMISOS DE MÍNIMO PRIVILEGIO PARA TRACEFLOW_APP (RNF-01 / SEC-02)
GRANT SELECT, INSERT, UPDATE ON
    traceflow.project_setup,
    traceflow.project_team_role,
    traceflow.project_methodology,
    traceflow.project_phase,
    traceflow.project_milestone,
    traceflow.project_deliverable
TO traceflow_app;

REVOKE DELETE ON
    traceflow.project_setup,
    traceflow.project_team_role,
    traceflow.project_methodology,
    traceflow.project_phase,
    traceflow.project_milestone,
    traceflow.project_deliverable
FROM traceflow_app;

-- 10. ÍNDICES DE RENDIMIENTO Y CONSULTA
CREATE INDEX IF NOT EXISTS idx_project_setup_project ON traceflow.project_setup(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_role_project ON traceflow.project_team_role(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_role_user ON traceflow.project_team_role(user_id);
CREATE INDEX IF NOT EXISTS idx_project_methodology_project ON traceflow.project_methodology(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phase_project ON traceflow.project_phase(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestone_project ON traceflow.project_milestone(project_id);
CREATE INDEX IF NOT EXISTS idx_project_deliverable_project ON traceflow.project_deliverable(project_id);

COMMIT;
