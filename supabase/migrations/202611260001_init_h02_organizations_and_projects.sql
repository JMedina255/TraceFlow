-- ============================================================================
-- TRACEFLOW SCM — MIGRACIÓN INCREMENTAL (HITO INIT-H02)
-- Archivo: 202611260001_init_h02_organizations_and_projects.sql
-- Hito: INIT-H02 — Organizaciones, Proyectos y Persistencia
-- Marco Normativo: DA-01 a DA-06, ADR-011, Plan Maestro Sección 7.2, SRS TB-04, SAD Sección 29
-- Motor: PostgreSQL 17 / Supabase
-- Restricciones: Preservación histórica estricta, Least Privilege (sin DELETE), Integridad DA-06
-- ============================================================================

BEGIN;

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
INSERT INTO traceflow.organization (id, code, name, slug, legal_name, tax_id, status, created_by, created_at, updated_at)
VALUES (
    'c0000001-0000-0000-0000-000000000001',
    'ORG-EXODO',
    'ÉXODO S.A.C.',
    'exodo-sac',
    'Éxodo Soluciones Informáticas S.A.C.',
    '20601234567',
    'ACTIVE',
    'a0000001-0000-0000-0000-000000000001',
    '2026-08-01 00:00:00+00',
    '2026-08-01 00:00:00+00'
)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    slug = EXCLUDED.slug;

-- 4.2 Incorporación de miembros fundadores registrados (DA-06)
INSERT INTO traceflow.organization_member (id, organization_id, user_id, role_in_org, status, joined_at, added_by)
VALUES
    ('d0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'OWNER', 'ACTIVE', '2026-08-01 00:00:00+00', 'a0000001-0000-0000-0000-000000000001'),
    ('d0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'MEMBER', 'ACTIVE', '2026-08-01 00:00:00+00', 'a0000001-0000-0000-0000-000000000001'),
    ('d0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'MEMBER', 'ACTIVE', '2026-08-01 00:00:00+00', 'a0000001-0000-0000-0000-000000000001'),
    ('d0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'MEMBER', 'ACTIVE', '2026-08-01 00:00:00+00', 'a0000001-0000-0000-0000-000000000001')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4.3 Vinculación de los proyectos históricos existentes a ORG-EXODO
UPDATE traceflow.project
SET organization_id = 'c0000001-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- 5. ACTUALIZACIÓN DE RESTRICCIÓN DE ESTADOS CANÓNICOS DE PROYECTO (INIT-H01-R)
-- Permitir estados canónicos ('BORRADOR', 'CONFIGURACION_INICIAL', 'ACTIVO', 'SUSPENDIDO', 'ARCHIVADO', 'HISTORICO_PENDIENTE_GITHUB')
-- y preservar compatibilidad con estados legados ('ACTIVE', 'CLOSED') durante la migración progresiva.
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

-- 7. REAJUSTE DE PRIVILEGIOS MÍNIMOS (LEAST PRIVILEGE AUDITADO)
-- Conforme a trazabilidad SCM (IEEE 828, RNF-01, RNF-03), queda revocado el privilegio DELETE para traceflow_app.
GRANT SELECT, INSERT, UPDATE ON TABLE
    traceflow.organization,
    traceflow.organization_member,
    traceflow.project
TO traceflow_app;

REVOKE DELETE ON TABLE
    traceflow.organization,
    traceflow.organization_member,
    traceflow.project
FROM traceflow_app;

COMMIT;
