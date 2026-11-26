/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE COMPATIBILIDAD Y CERTIFICACIÓN DE MIGRACIÓN (INIT-H02)
 * Archivo: backend/test/migration-compatibility.spec.ts
 * Hito: INIT-H02 — Requisito H02.2 (Persistencia incremental y rollback)
 * ============================================================================
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('INIT-H02: Certificación de Scripts de Migración y Rollback (H02.2)', () => {
  const migrationsDir = path.resolve(process.cwd(), '../supabase/migrations');
  const migrationPath = path.join(migrationsDir, '202611260001_init_h02_organizations_and_projects.sql');
  const rollbackPath = path.join(migrationsDir, '202611260001_init_h02_organizations_and_projects_rollback.sql');

  it('debe existir el script de migración incremental 202611260001_init_h02_organizations_and_projects.sql', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content.length).toBeGreaterThan(100);
  });

  it('el script de migración debe declarar las entidades organization y organization_member conforme a DA-02 y DA-06', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS traceflow.organization');
    expect(content).toContain('CREATE TABLE IF NOT EXISTS traceflow.organization_member');
    expect(content).toContain('ALTER TABLE traceflow.project');
    expect(content).toContain('organization_id UUID');
  });

  it('el script de migración no debe contener el estado INVITED en organization_member (DA-06 estricto)', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    // En DA-06 solo se admiten usuarios registrados previamente; no existe estado de invitación externa
    expect(content).not.toContain("'INVITED'");
  });

  it('el script de migración debe aplicar Least Privilege y revocar DELETE sobre las nuevas tablas', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('GRANT SELECT, INSERT, UPDATE ON TABLE');
    expect(content).toContain('traceflow.organization');
    expect(content).toContain('traceflow.organization_member');
    expect(content).toContain('REVOKE DELETE ON TABLE');
    expect(content).toContain('FROM traceflow_app');
  });

  it('el script de migración debe incorporar el disparador de segregación institucional (DA-06)', () => {
    const content = fs.readFileSync(migrationPath, 'utf8');
    expect(content).toContain('enforce_project_member_organization_integrity');
    expect(content).toContain('trg_check_user_project_assignment_org');
  });

  it('debe existir el script de rollback compatible 202611260001_init_h02_organizations_and_projects_rollback.sql', () => {
    expect(fs.existsSync(rollbackPath)).toBe(true);
    const content = fs.readFileSync(rollbackPath, 'utf8');
    expect(content).toContain('DROP TRIGGER IF EXISTS trg_check_user_project_assignment_org');
    expect(content).toContain('DROP TABLE IF EXISTS traceflow.organization_member');
    expect(content).toContain('DROP TABLE IF EXISTS traceflow.organization');
    expect(content).toContain('DROP COLUMN IF EXISTS organization_id');
  });
});
