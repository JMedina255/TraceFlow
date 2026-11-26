/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE TDD DE GESTIÓN DE ORGANIZACIONES Y MEMBRESÍAS (INIT-H02)
 * Archivo: backend/test/organizations.spec.ts
 * Hito: INIT-H02 — Requisito H02.1 (Entidades organization y organization_member)
 * Marco Normativo: DA-02 (Agrupación por Organización), DA-06 (Usuarios Registrados)
 * Casos TDD: TDD-INIT-01 a TDD-INIT-06
 * ============================================================================
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { OrganizationsService } from '../src/modules/organizations/organizations.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import type { AuthenticatedUser } from '../src/common/types/index.js';
import { ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('INIT-H02: Gestión de Organizaciones y Membresías (DA-02, DA-06)', () => {
  let db: DatabaseService;
  let authRepo: AuthRepository;
  let orgRepo: OrganizationsRepository;
  let auditService: AuditService;
  let orgService: OrganizationsService;

  // Usuarios fixture canónicos
  const userPU02Gestor: AuthenticatedUser = {
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

  const userPU06Dev: AuthenticatedUser = {
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

  const userExternoSinOrg: AuthenticatedUser = {
    id: 'a0000001-0000-0000-0000-000000000099',
    code: 'USR-099',
    username: 'invitado',
    email: 'invitado@externo.pe',
    fullName: 'Usuario Sin Organización',
    organization: 'Sin Empresa',
    position: 'Consultor Externo',
    activeRoleId: 'PU-01',
    allowedRoleIds: ['PU-01'],
    assignedProjectIds: [],
  };

  beforeEach(() => {
    db = new DatabaseService('mock');
    authRepo = new AuthRepository(db);
    orgRepo = new OrganizationsRepository(db, authRepo);
    auditService = new AuditService(db);
    orgService = new OrganizationsService(orgRepo, authRepo, auditService);
  });

  describe('TDD-INIT-01: Creación de la primera organización (Regla de Bootstrap)', () => {
    it('debe permitir a un usuario PU-02 crear la primera organización cuando la BD está vacía', async () => {
      orgRepo.clearAllMockForBootstrap();
      expect(await orgRepo.count()).toBe(0);

      const org = await orgService.createOrganization(
        {
          code: 'ORG-INIT',
          name: 'Organización Inicial',
          slug: 'org-init',
          legalName: 'Organización Inicial S.A.C.',
          taxId: '20100000001',
        },
        userPU02Gestor
      );

      expect(org).toBeDefined();
      expect(org.code).toBe('ORG-INIT');
      expect(org.status).toBe('ACTIVE');

      // Comprobar que el creador quedó asignado como OWNER (DA-06)
      const member = await orgRepo.findMember(org.id, userPU02Gestor.id);
      expect(member).toBeDefined();
      expect(member?.role_in_org).toBe('OWNER');
      expect(member?.status).toBe('ACTIVE');

      // Auditoría SHA-256 registrada
      expect(auditService.verifyChainIntegrity()).toBe(true);
      const auditLogs = auditService.getAuditChain();
      expect(auditLogs.some((l) => l.eventCode === 'ORG_CREATED')).toBe(true);
    });

    it('PRUEBA NEGATIVA: debe rechazar a un usuario sin rol PU-02 al intentar inicializar el sistema', async () => {
      orgRepo.clearAllMockForBootstrap();

      await expect(
        orgService.createOrganization(
          {
            code: 'ORG-UNAUTH',
            name: 'Organización No Autorizada',
            slug: 'org-unauth',
          },
          userExternoSinOrg
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('TDD-INIT-02: Control de duplicidad e integridad de organizaciones', () => {
    it('PRUEBA NEGATIVA: debe rechazar la creación si el código ya existe (409 Conflict)', async () => {
      await expect(
        orgService.createOrganization(
          {
            code: 'ORG-EXODO', // Ya existe en mock seed
            name: 'Éxodo Duplicado',
            slug: 'exodo-duplicado',
          },
          userPU02Gestor
        )
      ).rejects.toThrow(ConflictException);
    });

    it('PRUEBA NEGATIVA: debe rechazar la creación si el slug ya existe (409 Conflict)', async () => {
      await expect(
        orgService.createOrganization(
          {
            code: 'ORG-NUEVO',
            name: 'Éxodo Slug Duplicado',
            slug: 'exodo-sac', // Ya existe en mock seed
          },
          userPU02Gestor
        )
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('TDD-INIT-03: Restricción de creación arbitraria de organizaciones', () => {
    it('PRUEBA NEGATIVA: un usuario ordinario que no es OWNER ni tiene delegación administrativa no puede crear organizaciones', async () => {
      await expect(
        orgService.createOrganization(
          {
            code: 'ORG-PIRATA',
            name: 'Empresa Pirata',
            slug: 'empresa-pirata',
          },
          userPU06Dev // USR-002 es solo MEMBER en ORG-EXODO
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('TDD-INIT-04: Incorporación exclusiva de usuarios registrados (DA-06)', () => {
    it('debe permitir al OWNER agregar a un usuario previamente registrado en traceflow.app_user', async () => {
      // Crear una organización nueva para pruebas de incorporación
      const testOrg = await orgService.createOrganization(
        {
          code: 'ORG-ONBOARD',
          name: 'Organización Onboarding',
          slug: 'org-onboard',
        },
        userPU02Gestor
      );

      // Incorporar a USR-002 (registrado en app_user) en la nueva organización
      const newMember = await orgService.addMember(
        testOrg.code,
        {
          userCodeOrEmailOrId: 'rantayhua@exodo.pe',
          roleInOrg: 'ADMIN',
        },
        userPU02Gestor
      );

      expect(newMember).toBeDefined();
      expect(newMember.user_code).toBe('USR-002');
      expect(newMember.role_in_org).toBe('ADMIN');
      expect(newMember.status).toBe('ACTIVE');
    });

    it('PRUEBA NEGATIVA (DA-06): debe rechazar rotundamente la incorporación de usuarios inexistentes o no registrados', async () => {
      await expect(
        orgService.addMember(
          'ORG-EXODO',
          {
            userCodeOrEmailOrId: 'noexiste@fantasma.com',
            roleInOrg: 'MEMBER',
          },
          userPU02Gestor
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('PRUEBA NEGATIVA: un miembro ordinario no puede agregar nuevos integrantes', async () => {
      await expect(
        orgService.addMember(
          'ORG-EXODO',
          {
            userCodeOrEmailOrId: 'USR-003',
            roleInOrg: 'MEMBER',
          },
          userPU06Dev // USR-002 es solo MEMBER
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('TDD-INIT-05: Modificación de estados de membresía y protección de gobernanza', () => {
    it('debe permitir al OWNER suspender la membresía de un integrante ordinario', async () => {
      const updated = await orgService.updateMemberStatus(
        'ORG-EXODO',
        'USR-003',
        { status: 'SUSPENDED' },
        userPU02Gestor
      );

      expect(updated.status).toBe('SUSPENDED');
      expect(auditService.verifyChainIntegrity()).toBe(true);
      const logs = auditService.getAuditChain();
      expect(logs.some((l) => l.eventCode === 'ORG_MEMBER_STATUS_CHANGED')).toBe(true);
    });

    it('PRUEBA NEGATIVA: debe bloquear la suspensión del único OWNER de la organización', async () => {
      await expect(
        orgService.updateMemberStatus(
          'ORG-EXODO',
          'USR-001', // USR-001 es el único OWNER
          { status: 'SUSPENDED' },
          userPU02Gestor
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('TDD-INIT-06: Aislamiento multitenant de organizaciones', () => {
    it('un usuario solo debe visualizar las organizaciones donde tiene membresía activa', async () => {
      const orgs = await orgService.getOrganizationsForUser(userPU02Gestor);
      expect(orgs.length).toBeGreaterThanOrEqual(1);
      expect(orgs[0].code).toBe('ORG-EXODO');

      const orgsExterno = await orgService.getOrganizationsForUser(userExternoSinOrg);
      expect(orgsExterno.length).toBe(0);
    });

    it('PRUEBA NEGATIVA: un usuario no perteneciente a una organización debe recibir 403 Forbidden al consultarla', async () => {
      await expect(
        orgService.getOrganizationByIdOrSlug('ORG-EXODO', userExternoSinOrg)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
