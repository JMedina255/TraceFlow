/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE TDD DE GESTIÓN DE PROYECTOS EN BORRADOR Y AISLAMIENTO (INIT-H02)
 * Archivo: backend/test/projects-h02.spec.ts
 * Hito: INIT-H02 — Requisitos H02.3, H02.4, H02.5, H02.6
 * Marco Normativo: DA-01 (Multiproyecto), DA-02 (Organización), DA-06 (Integrantes Registrados)
 * Casos TDD: TDD-INIT-07 a TDD-INIT-10 + Aislamiento y Compatibilidad
 * ============================================================================
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import type { AuthenticatedUser } from '../src/common/types/index.js';
import { normalizeProjectStatus } from '../src/common/types/index.js';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('INIT-H02: Proyectos en Borrador, Aislamiento y Normalización de Estados (DA-01, DA-02)', () => {
  let db: DatabaseService;
  let authRepo: AuthRepository;
  let orgRepo: OrganizationsRepository;
  let projectsRepo: ProjectsRepository;
  let auditService: AuditService;
  let projectsService: ProjectsService;

  const userOwnerExodo: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000001',
    code: 'USR-001',
    username: 'jmedina',
    email: 'jmedina@exodo.pe',
    fullName: 'Joan Cristian Medina Quispe',
    organization: 'ÉXODO S.A.C.',
    position: 'Director de Calidad y Procesos',
    activeRoleId: 'PU-02',
    allowedRoleIds: ['PU-02', 'PU-01'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
  };

  const userDevExodo: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000002',
    code: 'USR-002',
    username: 'rantayhua',
    email: 'rantayhua@exodo.pe',
    fullName: 'Renzo Antonio Antayhua Mamani',
    organization: 'ÉXODO S.A.C.',
    position: 'Arquitecto de Software',
    activeRoleId: 'PU-06',
    allowedRoleIds: ['PU-03', 'PU-06'],
    assignedProjectIds: ['PRJ-001', 'PRJ-002'],
  };

  const userOrgB: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000088',
    code: 'USR-088',
    username: 'acme_user',
    email: 'admin@acme.com',
    fullName: 'Administrador Acme Corp',
    organization: 'Acme Corp',
    position: 'Gerente TI',
    activeRoleId: 'PU-02',
    allowedRoleIds: ['PU-02'],
    assignedProjectIds: [],
  };

  beforeEach(() => {
    db = new DatabaseService('mock');
    authRepo = new AuthRepository(db);
    orgRepo = new OrganizationsRepository(db, authRepo);
    projectsRepo = new ProjectsRepository(db);
    auditService = new AuditService(db);
    projectsService = new ProjectsService(db, projectsRepo, orgRepo, auditService);
  });

  describe('TDD-INIT-07: Creación de proyecto en estado BORRADOR (DA-01, DA-02)', () => {
    it('debe permitir crear un proyecto en BORRADOR asociado a una organización válida', async () => {
      const created = await projectsService.createProject(
        {
          code: 'PRJ-004',
          projectKey: 'EXO-MOBILE',
          name: 'App Móvil Corporativa',
          description: 'Banca móvil multiplataforma Flutter/NestJS',
          clientName: 'Financiera del Norte',
          organizationId: 'ORG-EXODO',
        },
        userOwnerExodo
      );

      expect(created).toBeDefined();
      expect(created.code).toBe('PRJ-004');
      expect(created.project_key).toBe('EXO-MOBILE');
      // Estado canónico estricto: BORRADOR (no activo en este hito)
      expect(created.status).toBe('BORRADOR');
      expect(created.organization_id).toBe('c0000001-0000-0000-0000-000000000001');

      // Auditoría SHA-256 registrada
      expect(auditService.verifyChainIntegrity()).toBe(true);
      const auditChain = auditService.getAuditChain();
      expect(auditChain.some((l) => l.eventCode === 'PRJ_CREATED_DRAFT')).toBe(true);
    });

    it('PRUEBA NEGATIVA (H02-R06): debe rechazar la creación si el usuario opera con activeRoleId no autorizado aunque tenga PU-02 en roles pasivos', async () => {
      // Usuario que es MEMBER ordinario en la org, y tiene PU-02 en allowed pero activo PU-06
      const userMemberRolInactivo: AuthenticatedUser = {
        ...userDevExodo, // rol en org: MEMBER
        activeRoleId: 'PU-06',
        allowedRoleIds: ['PU-06', 'PU-02'],
      };

      await expect(
        projectsService.createProject(
          {
            code: 'PRJ-UNAUTH-ACTIVE',
            projectKey: 'UNAUTH-KEY',
            name: 'Proyecto Invalido Activo',
            clientName: 'Cliente X',
            organizationId: 'ORG-EXODO',
          },
          userMemberRolInactivo
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('PRUEBA NEGATIVA (H02-R06): debe rechazar la creación si el miembro se encuentra suspendido', async () => {
      // Suspender temporalmente a un miembro
      await orgRepo.updateMemberStatus('c0000001-0000-0000-0000-000000000001', userDevExodo.id, 'SUSPENDED');

      const userSuspendido: AuthenticatedUser = {
        ...userDevExodo,
        activeRoleId: 'PU-02',
      };

      await expect(
        projectsService.createProject(
          {
            code: 'PRJ-SUSPENDED',
            projectKey: 'SUSP-KEY',
            name: 'Proyecto Suspendido',
            clientName: 'Cliente X',
            organizationId: 'ORG-EXODO',
          },
          userSuspendido
        )
      ).rejects.toThrow(ForbiddenException);

      // Restaurar estado activo
      await orgRepo.updateMemberStatus('c0000001-0000-0000-0000-000000000001', userDevExodo.id, 'ACTIVE');
    });

    it('PRUEBA NEGATIVA: debe rechazar la creación si la organización no existe (404)', async () => {
      await expect(
        projectsService.createProject(
          {
            code: 'PRJ-FANTASMA',
            projectKey: 'GHOST-KEY',
            name: 'Proyecto Invalido',
            clientName: 'Cliente X',
            organizationId: 'ORG-INEXISTENTE',
          },
          userOwnerExodo
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('PRUEBA NEGATIVA (DA-06): debe rechazar la creación si el usuario no pertenece a la organización propietaria', async () => {
      await expect(
        projectsService.createProject(
          {
            code: 'PRJ-INTRUSO',
            projectKey: 'INTR-KEY',
            name: 'Proyecto Intruso',
            clientName: 'Cliente X',
            organizationId: 'ORG-EXODO',
          },
          userOrgB // Usuario de otra organización
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('TDD-INIT-08: Unicidad de código y clave nemotécnica', () => {
    it('PRUEBA NEGATIVA: debe rechazar proyectos con código ya existente (409 Conflict)', async () => {
      await expect(
        projectsService.createProject(
          {
            code: 'PRJ-001', // Ya existe en semillas
            projectKey: 'NUEVA-KEY',
            name: 'Proyecto Repetido',
            clientName: 'Cliente',
            organizationId: 'ORG-EXODO',
          },
          userOwnerExodo
        )
      ).rejects.toThrow(ConflictException);
    });

    it('PRUEBA NEGATIVA: debe rechazar proyectos con clave nemotécnica ya existente (409 Conflict)', async () => {
      await expect(
        projectsService.createProject(
          {
            code: 'PRJ-NUEVO-09',
            projectKey: 'EXO-CORE', // Ya existe en PRJ-001
            name: 'Proyecto Repetido Clave',
            clientName: 'Cliente',
            organizationId: 'ORG-EXODO',
          },
          userOwnerExodo
        )
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('TDD-INIT-09: Asignación automática del creador al proyecto', () => {
    it('el creador del proyecto debe quedar registrado inmediatamente en las asignaciones de usuario', async () => {
      const created = await projectsService.createProject(
        {
          code: 'PRJ-005',
          projectKey: 'EXO-ANALYTICS',
          name: 'Plataforma de Analítica SCM',
          clientName: 'Banco Global',
          organizationId: 'ORG-EXODO',
        },
        userOwnerExodo
      );

      const assignments = await projectsRepo.findUserProjectAssignments(userOwnerExodo.id);
      expect(assignments).toContain(created.id);
    });
  });

  describe('TDD-INIT-10: Aislamiento Multitenant de Proyectos entre Organizaciones', () => {
    it('un usuario de una organización ajena no debe visualizar los proyectos de otra entidad', async () => {
      // Creamos una segunda organización para userOrgB
      const orgB = await orgRepo.create({
        code: 'ORG-ACME',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        status: 'ACTIVE',
        created_by: userOrgB.id,
      });

      await orgRepo.addMember({
        organization_id: orgB.id,
        user_id: userOrgB.id,
        role_in_org: 'OWNER',
        status: 'ACTIVE',
      });

      // Creamos proyecto en Org B
      const prjAcme = await projectsService.createProject(
        {
          code: 'PRJ-ACM-01',
          projectKey: 'ACM-PORTAL',
          name: 'Portal Corporativo Acme',
          clientName: 'Acme Industries',
          organizationId: 'ORG-ACME',
        },
        userOrgB
      );

      // Usuario de Éxodo consulta proyectos: NO debe ver PRJ-ACM-01
      const projectsExodo = await projectsService.getProjectsForUser(userOwnerExodo);
      const exodoCodes = projectsExodo.map((p) => p.code);
      expect(exodoCodes).not.toContain('PRJ-ACM-01');

      // Usuario de Acme consulta proyectos: NO debe ver PRJ-001 de Éxodo
      const projectsAcme = await projectsService.getProjectsForUser(userOrgB);
      const acmeCodes = projectsAcme.map((p) => p.code);
      expect(acmeCodes).toContain('PRJ-ACM-01');
      expect(acmeCodes).not.toContain('PRJ-001');
    });

    it('PRUEBA NEGATIVA: manipulación de URL/ID debe ser bloqueada con 403 Forbidden', async () => {
      // Usuario de Acme intenta acceder por endpoint directo al proyecto PRJ-001 de Éxodo
      await expect(
        projectsService.getProjectById('PRJ-001', userOrgB)
      ).rejects.toThrow(ForbiddenException);
    });

    it('PRUEBA NEGATIVA (H02-R06): un miembro suspendido en la organización no puede consultar sus proyectos con filtro', async () => {
      // Suspender temporalmente a USR-002 en ORG-EXODO
      await orgRepo.updateMemberStatus('c0000001-0000-0000-0000-000000000001', userDevExodo.id, 'SUSPENDED');

      await expect(
        projectsService.getProjectsForUser(userDevExodo, 'ORG-EXODO')
      ).rejects.toThrow(ForbiddenException);

      // Restaurar estado activo
      await orgRepo.updateMemberStatus('c0000001-0000-0000-0000-000000000001', userDevExodo.id, 'ACTIVE');
    });

    it('PRUEBA NEGATIVA (H02-R02): en modo PostgreSQL, un proyecto sin organización válida no debe ser devuelto ni accesible', async () => {
      const dbPgMode = new DatabaseService('postgres');
      const pRepo = new ProjectsRepository(dbPgMode);
      const oRepo = new OrganizationsRepository(dbPgMode, authRepo);
      const audService = new AuditService(dbPgMode);
      const pService = new ProjectsService(dbPgMode, pRepo, oRepo, audService);

      // Simular que findByIdOrCode retorna un proyecto sin organization_id
      pRepo.findByIdOrCode = async () => ({
        id: 'b0000001-0000-0000-0000-000000000999',
        code: 'PRJ-NO-ORG',
        project_key: 'NO-ORG',
        name: 'Sin Org',
        description: '',
        client_name: 'Test',
        status: 'ACTIVO',
        organization_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      await expect(
        pService.getProjectById('PRJ-NO-ORG', userOwnerExodo)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Compatibilidad de estados y normalización canónica', () => {
    it('debe normalizar estados legados sin romper compatibilidad', () => {
      expect(normalizeProjectStatus('ACTIVE')).toBe('HISTORICO_PENDIENTE_GITHUB');
      expect(normalizeProjectStatus('ACTIVO')).toBe('ACTIVO');
      expect(normalizeProjectStatus('CLOSED')).toBe('CERRADO');
      expect(normalizeProjectStatus('BORRADOR')).toBe('BORRADOR');
      expect(normalizeProjectStatus('CONFIGURACION_INICIAL')).toBe('CONFIGURACION_INICIAL');
      expect(normalizeProjectStatus('SUSPENDIDO')).toBe('SUSPENDIDO');
      expect(normalizeProjectStatus('ARCHIVADO')).toBe('ARCHIVADO');
      expect(normalizeProjectStatus('HISTORICO_PENDIENTE_GITHUB')).toBe('HISTORICO_PENDIENTE_GITHUB');
    });

    it('los proyectos devueltos deben presentar el estado canónico normalizado', async () => {
      const projects = await projectsService.getProjectsForUser(userOwnerExodo);
      for (const p of projects) {
        expect([
          'BORRADOR',
          'CONFIGURACION_INICIAL',
          'ACTIVO',
          'SUSPENDIDO',
          'ARCHIVADO',
          'HISTORICO_PENDIENTE_GITHUB',
        ]).toContain(p.status);
      }
    });
  });
});
