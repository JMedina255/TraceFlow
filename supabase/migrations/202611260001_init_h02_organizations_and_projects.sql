-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL (HITO INIT-H02)
-- Archivo: 202611260001_init_h02_organizations_and_projects.sql
-- Hito: INIT-H02 — Organizaciones, Proyectos y Persistencia
-- Marco Normativo: DA-01 a DA-06, ADR-011, Plan Maestro Sección 7.2, SRS TB-04, SAD Sección 29
-- Motor: PostgreSQL 17 / Supabase
-- Restricciones: Preservación histórica estricta, Least Privilege (sin DELETE), Integridad DA-06
-- ============================================================================

BEGIN;

-- 0. COMPROBACIONES DE INTEGRIDAD PRE-MIGRACIÓN (INIT-H02-V §4)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_name = 'project'
    ) THEN
        RAISE EXCEPTION '[PRE-CHECK ERROR] Tabla traceflow.project no encontrada. Migraciones base ausentes.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM traceflow.app_user
        WHERE id = 'a0000001-0000-0000-0000-000000000001' AND status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION '[PRE-CHECK ERROR] Usuario fundador USR-001 no existe en traceflow.app_user o no está activo.';
    END IF;
END $$;

-- 1. TABLA DE ORGANIZACIONES (TENANT RAÍZ - DA-02)
CREATE TABLE IF NOT EXISTS traceflow.organization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,               -- ej. ORG-EXODO, ORG-001
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(60) UNIQUE NOT NULL,               -- ej. exodo-sac
    legal_name VARCHAR(150),
    tax_id VARCHAR(30),                             -- RUC / CIF institucional
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
    created_by UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE traceflow.organization IS 'Catálogo de organizaciones (Tenants raíz de gobernanza) conforme a DA-02.';

-- 2. TABLA DE MEMBRESÍA ORGANIZACIONAL (DA-06 - EXCLUSIVO USUARIOS REGISTRADOS)
-- Nota de remediación INIT-H01-R: Se excluye el estado INVITED para cumplir estrictamente DA-06.
-- Solo pueden incorporarse usuarios previamente registrados y autorizados en app_user.
CREATE TABLE IF NOT EXISTS traceflow.organization_member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES traceflow.organization(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    role_in_org VARCHAR(30) NOT NULL DEFAULT 'MEMBER' CHECK (role_in_org IN ('OWNER', 'ADMIN', 'MEMBER', 'AUDITOR')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by UUID REFERENCES traceflow.app_user(id) ON DELETE RESTRICT,
    CONSTRAINT uq_org_member UNIQUE (organization_id, user_id)
);

COMMENT ON TABLE traceflow.organization_member IS 'Membresías institucionales estrictamente restringidas a usuarios activos registrados (DA-06).';

-- 3. EVOLUCIÓN DE TABLA PROJECT (AGREGAR FK DE ORGANIZACIÓN)
ALTER TABLE traceflow.project
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES traceflow.organization(id) ON DELETE RESTRICT;

COMMENT ON COLUMN traceflow.project.organization_id IS 'Organización propietaria del proyecto (DA-02).';

-- 4. POBLACIÓN SEGURA Y REGULARIZACIÓN HISTÓRICA (PRESERVACIÓN DE DATOS PREVIOS)
-- 4.1 Inserción de la organización institucional inicial (ÉXODO S.A.C.)
-- H02-R04: Se omite tax_id ficticio (NULL) y se usa ON CONFLICT DO NOTHING para preservar datos previos sin sobrescribir.
INSERT INTO traceflow.organization (id, code, name, slug, legal_name, tax_id, status, created_by, created_at, updated_at)
VALUES (
    'c0000001-0000-0000-0000-000000000001',
    'ORG-EXODO',
    'ÉXODO S.A.C.',
    'exodo-sac',
    'Éxodo Soluciones Informáticas S.A.C.',
    NULL,
    'ACTIVE',
    'a0000001-0000-0000-0000-000000000001',
    '2026-08-01 00:00:00+00',
    '2026-08-01 00:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- 4.2 Incorporación de miembros fundadores registrados (DA-06, H02-R04)
-- Valida explícitamente la existencia de cada usuario en traceflow.app_user antes de insertar membresías
INSERT INTO traceflow.organization_member (id, organization_id, user_id, role_in_org, status, joined_at, added_by)
SELECT v.id, v.organization_id, v.user_id, v.role_in_org, v.status, v.joined_at, v.added_by
FROM (
    VALUES
    ('d0000001-0000-0000-0000-000000000001'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000001'::uuid, 'OWNER', 'ACTIVE', '2026-08-01 00:00:00+00'::timestamptz, 'a0000001-0000-0000-0000-000000000001'::uuid),
    ('d0000001-0000-0000-0000-000000000002'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000002'::uuid, 'MEMBER', 'ACTIVE', '2026-08-01 00:00:00+00'::timestamptz, 'a0000001-0000-0000-0000-000000000001'::uuid),
    ('d0000001-0000-0000-0000-000000000003'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000003'::uuid, 'MEMBER', 'ACTIVE', '2026-08-01 00:00:00+00'::timestamptz, 'a0000001-0000-0000-0000-000000000001'::uuid),
    ('d0000001-0000-0000-0000-000000000004'::uuid, 'c0000001-0000-0000-0000-000000000001'::uuid, 'a0000001-0000-0000-0000-000000000004'::uuid, 'MEMBER', 'ACTIVE', '2026-08-01 00:00:00+00'::timestamptz, 'a0000001-0000-0000-0000-000000000001'::uuid)
) AS v(id, organization_id, user_id, role_in_org, status, joined_at, added_by)
WHERE EXISTS (
    SELECT 1 FROM traceflow.app_user u WHERE u.id = v.user_id AND u.status = 'ACTIVE'
)
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4.3 Regularización acotada: Vinculación exclusiva de los proyectos históricos verificados de ÉXODO S.A.C.
-- (PRJ-001, PRJ-002, PRJ-003) únicamente cuando no posean organización previamente asignada (INIT-H02-V §4).
-- Prohibido vincular proyectos desconocidos o sobrescribir organizaciones existentes.
UPDATE traceflow.project
SET organization_id = 'c0000001-0000-0000-0000-000000000001'
WHERE code IN ('PRJ-001', 'PRJ-002', 'PRJ-003')
  AND organization_id IS NULL;

-- 5. ACTUALIZACIÓN DE RESTRICCIÓN DE ESTADOS CANÓNICOS DE PROYECTO (INIT-H01-R)
-- Permitir estados canónicos ('BORRADOR', 'CONFIGURACION_INICIAL', 'ACTIVO', 'SUSPENDIDO', 'ARCHIVADO', 'HISTORICO_PENDIENTE_GITHUB')
-- y preservar compatibilidad con estados legados ('ACTIVE', 'CLOSED') durante la migración progresiva.
ALTER TABLE traceflow.project ALTER COLUMN status TYPE VARCHAR(40);
ALTER TABLE traceflow.project DROP CONSTRAINT IF EXISTS project_status_check;
ALTER TABLE traceflow.project DROP CONSTRAINT IF EXISTS chk_project_status;

ALTER TABLE traceflow.project ADD CONSTRAINT chk_project_status
    CHECK (status IN (
        'BORRADOR',
        'CONFIGURACION_INICIAL',
        'ACTIVO',
        'SUSPENDIDO',
        'ARCHIVADO',
        'HISTORICO_PENDIENTE_GITHUB',
        'PENDIENTE_VALIDACION',
        'CERRADO',
        'ACTIVE',
        'CLOSED'
    ));

-- 5.1 Regularización controlada: Marcar proyectos históricos como HISTORICO_PENDIENTE_GITHUB
-- respetando la política que impide considerarlos automáticamente activos bajo la política GitHub (INIT-H01-R §7.3)
UPDATE traceflow.project
SET status = 'HISTORICO_PENDIENTE_GITHUB'
WHERE status = 'ACTIVE' AND code IN ('PRJ-001', 'PRJ-002', 'PRJ-003');

-- 6. DISPARADOR DE INTEGRIDAD INSTITUCIONAL MULTITENANT (DA-06)
-- Garantiza que ningún usuario sea asignado a un proyecto si no es miembro activo de la organización propietaria.
CREATE OR REPLACE FUNCTION traceflow.enforce_project_member_organization_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_project_org_id UUID;
    v_is_member BOOLEAN;
BEGIN
    SELECT organization_id INTO v_project_org_id
    FROM traceflow.project
    WHERE id = NEW.project_id;

    IF v_project_org_id IS NULL THEN
        RAISE EXCEPTION 'Violación de integridad (DA-02): El proyecto % no tiene organización asignada.', NEW.project_id;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM traceflow.organization_member
        WHERE organization_id = v_project_org_id
          AND user_id = NEW.user_id
          AND status = 'ACTIVE'
    ) INTO v_is_member;

    IF NOT v_is_member THEN
        RAISE EXCEPTION 'Violación de segregación institucional (DA-06): El usuario % no es miembro activo de la organización propietaria del proyecto %.',
            NEW.user_id, NEW.project_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_user_project_assignment_org ON traceflow.user_project_assignment;
CREATE TRIGGER trg_check_user_project_assignment_org
    BEFORE INSERT OR UPDATE ON traceflow.user_project_assignment
    FOR EACH ROW EXECUTE FUNCTION traceflow.enforce_project_member_organization_integrity();

-- 7. REAJUSTE DE PRIVILEGIOS MÍNIMOS (LEAST PRIVILEGE AUDITADO - H02-R01)
-- Se otorga a traceflow_app el permiso necesario para insertar asignaciones en user_project_assignment
-- Conforme a trazabilidad SCM (IEEE 828, RNF-01, RNF-03), queda revocado el privilegio DELETE para traceflow_app.
GRANT SELECT, INSERT, UPDATE ON TABLE
    traceflow.organization,
    traceflow.organization_member,
    traceflow.project,
    traceflow.user_project_assignment
TO traceflow_app;

REVOKE DELETE ON TABLE
    traceflow.organization,
    traceflow.organization_member,
    traceflow.project,
    traceflow.user_project_assignment
FROM traceflow_app;

-- 8. COMPROBACIONES DE INTEGRIDAD POST-MIGRACIÓN (INIT-H02-V §4)
DO $$
DECLARE
    v_unassigned_historical INT;
    v_invalid_members INT;
BEGIN
    SELECT COUNT(*) INTO v_unassigned_historical
    FROM traceflow.project
    WHERE code IN ('PRJ-001', 'PRJ-002', 'PRJ-003') AND organization_id IS NULL;

    IF v_unassigned_historical > 0 THEN
        RAISE EXCEPTION '[POST-CHECK ERROR] Existen proyectos históricos sin organización asignada tras la migración.';
    END IF;

    SELECT COUNT(*) INTO v_invalid_members
    FROM traceflow.organization_member m
    LEFT JOIN traceflow.app_user u ON m.user_id = u.id
    WHERE u.id IS NULL;

    IF v_invalid_members > 0 THEN
        RAISE EXCEPTION '[POST-CHECK ERROR] Se detectaron membresías huérfanas sin usuario asociado en app_user.';
    END IF;
END $$;

COMMIT;
