/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE AISLAMIENTO MULTITENANT DE PROYECTOS
 * Archivo: backend/test/projects.spec.ts
 * Hito: DB-01 / DB-01.1 — Requisito H-04 (Certificación de Pruebas)
 * 
 * [CLASIFICACIÓN: UNITARIAS / REPOSITORIOS EN MEMORIA]
 * ADVERTENCIA DE CERTIFICACIÓN (H-04):
 * Esta suite verifica el aislamiento multitenant a nivel del servicio de aplicación.
 * Ejecuta con el repositorio simulado en memoria.
 * NO constituye prueba de restricciones de integridad referencial ni esquemas de PostgreSQL.
 * ============================================================================
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import type { AuthenticatedUser } from '../src/common/types/index.js';

describe('Backend Multitenant Projects Isolation (ADR-006, RBAC Matrix)', () => {
  let projectsService: ProjectsService;

  beforeEach(() => {
    const db = new DatabaseService('mock');
    const repo = new ProjectsRepository(db);
    projectsService = new ProjectsService(repo);
  });

  it('USR-001 con acceso a PRJ-001, PRJ-002 y PRJ-003 debe recibir los 3 proyectos', async () => {
    const userUSR001: AuthenticatedUser = {
      id: 'a0000001-0000-0000-0000-000000000001',
      code: 'USR-001',
      username: 'jmedina',
      email: 'jmedina@exodo.pe',
      fullName: 'Joan Cristian Medina Quispe',
      organization: 'ÉXODO S.A.C.',
      position: 'Director de Calidad',
      activeRoleId: 'PU-02',
      allowedRoleIds: ['PU-02', 'PU-01'],
      assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
    };

    const projects = await projectsService.getProjectsForUser(userUSR001);
    expect(projects.length).toBe(3);
    const codes = projects.map((p) => p.code);
    expect(codes).toContain('PRJ-001');
    expect(codes).toContain('PRJ-002');
    expect(codes).toContain('PRJ-003');
  });

  it('PRUEBA NEGATIVA: USR-004 con veto estricto sobre PRJ-003 solo debe ver PRJ-001 y PRJ-002', async () => {
    const userUSR004: AuthenticatedUser = {
      id: 'a0000001-0000-0000-0000-000000000004',
      code: 'USR-004',
      username: 'rloyola',
      email: 'rloyola@exodo.pe',
      fullName: 'Renzo Fernando Loyola Vilca Choque',
      organization: 'ÉXODO S.A.C.',
      position: 'Coordinador CCB',
      activeRoleId: 'PU-04',
      allowedRoleIds: ['PU-04'],
      assignedProjectIds: ['PRJ-001', 'PRJ-002'], // Veto PRJ-003
    };

    const projects = await projectsService.getProjectsForUser(userUSR004);
    expect(projects.length).toBe(2);
    const codes = projects.map((p) => p.code);
    expect(codes).toContain('PRJ-001');
    expect(codes).toContain('PRJ-002');
    expect(codes).not.toContain('PRJ-003');
  });

  it('PRUEBA NEGATIVA: USR-004 debe ser bloqueado con 403 Forbidden al consultar directamente PRJ-003', async () => {
    const userUSR004: AuthenticatedUser = {
      id: 'a0000001-0000-0000-0000-000000000004',
      code: 'USR-004',
      username: 'rloyola',
      email: 'rloyola@exodo.pe',
      fullName: 'Renzo Fernando Loyola Vilca Choque',
      organization: 'ÉXODO S.A.C.',
      position: 'Coordinador CCB',
      activeRoleId: 'PU-04',
      allowedRoleIds: ['PU-04'],
      assignedProjectIds: ['PRJ-001', 'PRJ-002'],
    };

    await expect(projectsService.getProjectById('PRJ-003', userUSR004)).rejects.toThrow(
      "El usuario 'USR-004' no tiene asignado el proyecto 'PRJ-003'"
    );
  });
});
