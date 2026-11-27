/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE CERTIFICACIÓN FUNCIONAL Y DE SEGURIDAD ADMINISTRATIVA (MVP-H01 / MI-02)
 * Archivo: backend/test/users-admin.spec.ts
 * Cobertura: Criterios ADM-01 a ADM-26 (Bloques A, B, C, D, E)
 * Nivel: Integración modular HTTP (NestJS + AuthGuard + RolesGuard + ValidationPipe + Supertest)
 *        y atomicidad transaccional simulada con pg-mem.
 * ============================================================================
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { newDb } from 'pg-mem';
import pg from 'pg';
import crypto from 'node:crypto';

import { CreateUserDto } from '../src/modules/users/dtos/create-user.dto.js';
import { UpdateUserDto } from '../src/modules/users/dtos/update-user.dto.js';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { UsersRepository } from '../src/modules/users/users.repository.js';
import { UsersService } from '../src/modules/users/users.service.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { DatabaseService } from '../src/database/database.service.js';

describe('MVP-H01 / MI-02: Administración de Usuarios, Autorizaciones PU-08/PU-09, Invitaciones y Auditoría', () => {
  let app: INestApplication;
  let httpServer: any;
  let auditService: AuditService;
  let authRepo: AuthRepository;
  let orgRepo: OrganizationsRepository;
  let usersService: UsersService;

  const loginAs = async (
    email: string,
    password: string,
    requestedRoleId?: string
  ) => {
    return request(httpServer)
      .post('/api/v1/auth/login')
      .send(requestedRoleId ? { email, password, requestedRoleId } : { email, password });
  };

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_MODE = 'mock';

    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    httpServer = app.getHttpServer();
    auditService = app.get(AuditService);
    authRepo = app.get(AuthRepository);
    orgRepo = app.get(OrganizationsRepository);
    usersService = app.get(UsersService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  // ==========================================================================
  // BLOQUE A — AUTENTICACIÓN Y AUTORIZACIÓN (ADM-01, ADM-02, ADM-03, ADM-21, ADM-25, ADM-26)
  // ==========================================================================
  describe('Bloque A — Autenticación y autorización', () => {
    it('ADM-01: Inicio de sesión PU-08 autoriza acceso a endpoints administrativos', async () => {
      const loginRes = await loginAs('admin@exodo.pe', 'TraceFlow2026!', 'PU-08');
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.activeRoleId).toBe('PU-08');
      expect(loginRes.body.sessionToken).toBeDefined();
      expect(loginRes.headers['set-cookie']).toBeDefined();

      const usersRes = await request(httpServer)
        .get('/api/v1/admin/users')
        .set('x-session-token', loginRes.body.sessionToken);
      expect(usersRes.status).toBe(200);
      expect(usersRes.body.total).toBeGreaterThanOrEqual(5);

      const invRes = await request(httpServer)
        .get('/api/v1/admin/invitations')
        .set('x-session-token', loginRes.body.sessionToken);
      expect(invRes.status).toBe(200);
    });

    it('ADM-02: Acceso administrativo desde PU-05 (Bibliotecario) es denegado con 403 Forbidden', async () => {
      const loginRes = await loginAs('arivera@exodo.pe', 'TraceFlow2026!', 'PU-05');
      expect(loginRes.status).toBe(200);
      const token = loginRes.body.sessionToken;

      const listRes = await request(httpServer)
        .get('/api/v1/admin/users')
        .set('x-session-token', token);
      expect(listRes.status).toBe(403);

      const createRes = await request(httpServer)
        .post('/api/v1/admin/users')
        .set('x-session-token', token)
        .send({
          fullName: 'Intento No Autorizado',
          email: 'unauth@exodo.pe',
          password: 'Password2026!',
        });
      expect(createRes.status).toBe(403);

      const invRes = await request(httpServer)
        .get('/api/v1/admin/invitations')
        .set('x-session-token', token);
      expect(invRes.status).toBe(403);
    });

    it('ADM-03: Acceso administrativo desde PU-09 (Jefe de Proyecto) es denegado con 403 Forbidden', async () => {
      const adminLogin = await loginAs('admin@exodo.pe', 'TraceFlow2026!', 'PU-08');
      const adminToken = adminLogin.body.sessionToken;

      // Autorizar a USR-002 como PU-09
      const authPmRes = await request(httpServer)
        .patch('/api/v1/admin/users/USR-002/project-creation-auth')
        .set('x-session-token', adminToken)
        .send({ authorized: true, reason: 'Prueba ADM-03' });
      expect(authPmRes.status).toBe(200);

      const pmLogin = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-09');
      expect(pmLogin.status).toBe(200);
      const pmToken = pmLogin.body.sessionToken;

      const listUsersRes = await request(httpServer)
        .get('/api/v1/admin/users')
        .set('x-session-token', pmToken);
      expect(listUsersRes.status).toBe(403);

      const escalateRes = await request(httpServer)
        .patch('/api/v1/admin/users/USR-003/project-creation-auth')
        .set('x-session-token', pmToken)
        .send({ authorized: true });
      expect(escalateRes.status).toBe(403);

      const createInvRes = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', pmToken)
        .send({ channel: 'EMAIL', email: 'pm-inv@exodo.pe', intendedRoleCode: 'PU-06' });
      expect(createInvRes.status).toBe(403);
    });

    it('ADM-21: Usuario creado mediante API administrativa inicia sesión correctamente con Argon2id', async () => {
      const adminLogin = await loginAs('admin@exodo.pe', 'TraceFlow2026!', 'PU-08');
      const adminToken = adminLogin.body.sessionToken;

      const createRes = await request(httpServer)
        .post('/api/v1/admin/users')
        .set('x-session-token', adminToken)
        .send({
          fullName: 'Lucia Fernandez QA',
          email: 'lfernandez@exodo.pe',
          password: 'TempPassword2026!',
          position: 'Ingeniera QA',
          roleCodes: ['PU-07'],
          primaryRoleCode: 'PU-07',
          organizationId: 'ORG-EXODO',
        });
      expect(createRes.status).toBe(201);

      const userLogin = await loginAs('lfernandez@exodo.pe', 'TempPassword2026!', 'PU-07');
      expect(userLogin.status).toBe(200);
      expect(userLogin.body.user.email).toBe('lfernandez@exodo.pe');
      expect(userLogin.body.user.activeRoleId).toBe('PU-07');

      const meRes = await request(httpServer)
        .get('/api/v1/auth/me')
        .set('x-session-token', userLogin.body.sessionToken);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.code).toBe(createRes.body.data.code);
    });

    it('ADM-25: Escalamiento indebido a PU-08 es denegado en creación, roles, invitaciones y login', async () => {
      const adminLogin = await loginAs('admin@exodo.pe', 'TraceFlow2026!', 'PU-08');
      const adminToken = adminLogin.body.sessionToken;

      // 1. Crear usuario intentando asignar PU-08
      const createAdminRes = await request(httpServer)
        .post('/api/v1/admin/users')
        .set('x-session-token', adminToken)
        .send({
          fullName: 'Intento Admin',
          email: 'fakeadmin@exodo.pe',
          password: 'Password2026!',
          roleCodes: ['PU-08'],
          primaryRoleCode: 'PU-08',
        });
      expect(createAdminRes.status).toBe(403);

      // 2. Actualizar roles intentando elevar a PU-08
      const updateRolesRes = await request(httpServer)
        .put('/api/v1/admin/users/USR-002/roles')
        .set('x-session-token', adminToken)
        .send({ roleCodes: ['PU-03', 'PU-08'] });
      expect(updateRolesRes.status).toBe(403);

      // 3. Invitar con perfil PU-08
      const invAdminRes = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({
          channel: 'EMAIL',
          email: 'invadmin@exodo.pe',
          intendedRoleCode: 'PU-08',
        });
      expect(invAdminRes.status).toBe(403);

      // 4. Login solicitando PU-08 desde cuenta sin PU-08
      const loginEscRes = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-08');
      expect(loginEscRes.status).toBe(400);
    });

    it('ADM-26: Operación administrativa sin sesión o con token inválido es denegada con 401 Unauthorized', async () => {
      const noTokenList = await request(httpServer).get('/api/v1/admin/users');
      expect(noTokenList.status).toBe(401);

      const noTokenCreate = await request(httpServer)
        .post('/api/v1/admin/users')
        .send({ fullName: 'Sin Sesion', email: 'nosesion@exodo.pe', password: 'Password2026!' });
      expect(noTokenCreate.status).toBe(401);

      const invalidTokenInv = await request(httpServer)
        .get('/api/v1/admin/invitations')
        .set('x-session-token', 'token-invalido-0000');
      expect(invalidTokenInv.status).toBe(401);
    });
  });

  // ==========================================================================
  // BLOQUE B — GESTIÓN DE USUARIOS (ADM-04, ADM-05, ADM-06, ADM-07, ADM-08, ADM-09, ADM-15, ADM-22)
  // ==========================================================================
  describe('Bloque B — Gestión de usuarios', () => {
    let adminToken: string;

    beforeEach(async () => {
      const res = await loginAs('admin@exodo.pe', 'TraceFlow2026!', 'PU-08');
      adminToken = res.body.sessionToken;
    });

    it('ADM-04: Registro de usuario válido con normalización de correo, Argon2id, validaciones y anti-mass-assignment', async () => {
      // Validación de campos obligatorios / regla primaryRoleCode PU-09 sin authorizeProjectCreation
      const missingFieldsRes = await request(httpServer)
        .post('/api/v1/admin/users')
        .set('x-session-token', adminToken)
        .send({ fullName: 'AB', email: 'correo-invalido', password: '123' });
      expect(missingFieldsRes.status).toBe(400);

      const badPrimaryPu09Res = await request(httpServer)
        .post('/api/v1/admin/users')
        .set('x-session-token', adminToken)
        .send({
          fullName: 'Usuario Coherencia',
          email: 'coherencia@exodo.pe',
          password: 'Password2026!',
          roleCodes: ['PU-01'],
          primaryRoleCode: 'PU-09',
          authorizeProjectCreation: false,
        });
      expect(badPrimaryPu09Res.status).toBe(400);

      // Prevención de mass assignment mediante ValidationPipe real (forbidNonWhitelisted en build tsc)
      const strictPipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
      await expect(
        strictPipe.transform(
          {
            fullName: 'Mass Assign Attempt',
            email: 'mass@exodo.pe',
            password: 'Password2026!',
            canCreateProjects: true,
            passwordHash: 'fakehash',
          },
          { type: 'body', metatype: CreateUserDto }
        )
      ).rejects.toThrow();

      // Registro válido con correo en mayúsculas y espacios
      const createRes = await request(httpServer)
        .post('/api/v1/admin/users')
        .set('x-session-token', adminToken)
        .send({
          fullName: 'Carlos Mendoza Dev',
          email: '  Carlos.Mendoza@EXODO.PE  ',
          password: 'StrongPassword2026!',
          position: 'Desarrollador Senior',
          roleCodes: ['PU-06'],
          primaryRoleCode: 'PU-06',
          organizationId: 'ORG-EXODO',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.email).toBe('carlos.mendoza@exodo.pe');
      expect(createRes.body.data.status).toBe('ACTIVE');
      expect(createRes.body.data.assignedRoleCodes).toEqual(['PU-06']);
      expect(createRes.body.data.primaryRoleCode).toBe('PU-06');

      // Verificar hash Argon2id en persistencia interna
      const stored = await authRepo.findById(createRes.body.data.id);
      expect(stored).not.toBeNull();
      expect(stored!.password_hash).toMatch(/^\$argon2id\$/);
      expect(stored!.password_hash).not.toContain('StrongPassword2026!');
    });

    it('ADM-05: Correo electrónico duplicado (insensible a mayúsculas) es rechazado con 409 Conflict', async () => {
      const dupRes = await request(httpServer)
        .post('/api/v1/admin/users')
        .set('x-session-token', adminToken)
        .send({
          fullName: 'Duplicado Test',
          email: 'JMEDINA@EXODO.PE',
          password: 'Password2026!',
        });
      expect(dupRes.status).toBe(409);
    });

    it('ADM-06: Edición de información básica actualiza atributos permitidos y bloquea mass assignment', async () => {
      const strictPipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });
      await expect(
        strictPipe.transform(
          {
            fullName: 'Nombre Modificado',
            canCreateProjects: true,
            email: 'hack@exodo.pe',
          },
          { type: 'body', metatype: UpdateUserDto }
        )
      ).rejects.toThrow();

      // Incluso si se inyectan propiedades adicionales en el payload HTTP sin metadata en esbuild, el servicio no muta canCreateProjects ni email
      const editRes = await request(httpServer)
        .patch('/api/v1/admin/users/USR-002')
        .set('x-session-token', adminToken)
        .send({
          fullName: 'Renzo Antayhua Actualizado',
          position: 'Arquitecto Líder',
          githubUsername: 'rantayhua-gh',
          canCreateProjects: true,
          email: 'hijacked@exodo.pe',
        });
      expect(editRes.status).toBe(200);
      expect(editRes.body.data.fullName).toBe('Renzo Antayhua Actualizado');
      expect(editRes.body.data.position).toBe('Arquitecto Líder');
      expect(editRes.body.data.githubUsername).toBe('rantayhua-gh');
      expect(editRes.body.data.githubIdentityStatus).toBe('DECLARED');
      expect(editRes.body.data.canCreateProjects).toBe(false);
      expect(editRes.body.data.email).toBe('rantayhua@exodo.pe');
    });

    it('ADM-07, ADM-08 y ADM-09: Suspensión revoca sesiones activas, bloquea acceso previo y reactivación habilita nuevo login', async () => {
      // 1. El usuario USR-002 inicia sesión
      const userLogin = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-03');
      expect(userLogin.status).toBe(200);
      const oldToken = userLogin.body.sessionToken;

      const beforeSuspendMe = await request(httpServer)
        .get('/api/v1/auth/me')
        .set('x-session-token', oldToken);
      expect(beforeSuspendMe.status).toBe(200);

      // 2. ADM-07: Suspensión por PU-08
      const suspendRes = await request(httpServer)
        .patch('/api/v1/admin/users/USR-002/status')
        .set('x-session-token', adminToken)
        .send({ status: 'SUSPENDED', reason: 'Licencia temporal' });
      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.data.status).toBe('SUSPENDED');

      // 3. ADM-08: Uso de sesión anterior tras suspensión -> denegado (401)
      const afterSuspendMe = await request(httpServer)
        .get('/api/v1/auth/me')
        .set('x-session-token', oldToken);
      expect(afterSuspendMe.status).toBe(401);

      const loginWhileSuspended = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-03');
      expect(loginWhileSuspended.status).toBe(401);

      // 4. ADM-09: Reactivación permite nuevo acceso, pero la sesión revocada sigue inválida
      const reactivateRes = await request(httpServer)
        .patch('/api/v1/admin/users/USR-002/status')
        .set('x-session-token', adminToken)
        .send({ status: 'ACTIVE', reason: 'Retorno operativo' });
      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.status).toBe('ACTIVE');

      const oldTokenStillDead = await request(httpServer)
        .get('/api/v1/auth/me')
        .set('x-session-token', oldToken);
      expect(oldTokenStillDead.status).toBe(401);

      const newLogin = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-03');
      expect(newLogin.status).toBe(200);
    });

    it('ADM-15: Suspensión o alteración del último administrador activo (PU-08) es rechazada', async () => {
      // Auto-suspensión bloqueada con 403
      const selfSuspendRes = await request(httpServer)
        .patch('/api/v1/admin/users/USR-005/status')
        .set('x-session-token', adminToken)
        .send({ status: 'SUSPENDED' });
      expect(selfSuspendRes.status).toBe(403);

      // Otro administrador intentando suspender/alterar roles del único PU-08 activo en BD
      const secondCaller = {
        id: 'a0000001-0000-0000-0000-000000000099',
        code: 'USR-099',
        username: 'admin2',
        email: 'admin2@exodo.pe',
        fullName: 'Admin Delegado',
        organization: 'ÉXODO S.A.C.',
        position: 'Admin',
        activeRoleId: 'PU-08' as const,
        allowedRoleIds: ['PU-08' as const],
        assignedProjectIds: [],
      };

      await expect(
        usersService.updateUserStatus('USR-005', { status: 'SUSPENDED' }, secondCaller)
      ).rejects.toThrow('último Administrador del Sistema');

      await expect(
        usersService.updateUserRoles('USR-005', { roleCodes: ['PU-02'] }, secondCaller)
      ).rejects.toThrow('último Administrador del Sistema');
    });

    it('ADM-22: Respuestas administrativas nunca exponen password_hash, passwordHash ni tokens de sesión', async () => {
      const listRes = await request(httpServer)
        .get('/api/v1/admin/users')
        .set('x-session-token', adminToken);
      expect(listRes.status).toBe(200);

      const detailRes = await request(httpServer)
        .get('/api/v1/admin/users/USR-001')
        .set('x-session-token', adminToken);
      expect(detailRes.status).toBe(200);

      const serialized = JSON.stringify([listRes.body, detailRes.body]);
      expect(serialized).not.toContain('password_hash');
      expect(serialized).not.toContain('passwordHash');
      expect(serialized).not.toContain('$argon2');
      expect(serialized).not.toContain('session_token_hash');
      expect(serialized).not.toContain(adminToken);
    });
  });

  // ==========================================================================
  // BLOQUE C — AUTORIZACIÓN DE JEFES DE PROYECTO (ADM-10..ADM-14, ADM-24)
  // ==========================================================================
  describe('Bloque C — Autorización de jefes de proyecto y revocación de sesiones', () => {
    let adminToken: string;

    beforeEach(async () => {
      const res = await loginAs('admin@exodo.pe', 'TraceFlow2026!', 'PU-08');
      adminToken = res.body.sessionToken;
    });

    it('ADM-10, ADM-11, ADM-12, ADM-13 y ADM-24: Flujo completo de autorización PU-09, preservación SCM/membresías, revocación y bloqueo de PU-02/PU-08', async () => {
      // ADM-12: Antes de autorización, USR-002 no puede usar PU-09 ni crear proyectos
      const preLoginPm = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-09');
      expect(preLoginPm.status).toBe(400);

      // ADM-13: PU-02 tampoco puede crear proyectos vía HTTP
      const pu02Login = await loginAs('jmedina@exodo.pe', 'TraceFlow2026!', 'PU-02');
      expect(pu02Login.status).toBe(200);
      const pu02CreatePrj = await request(httpServer)
        .post('/api/v1/projects')
        .set('x-session-token', pu02Login.body.sessionToken)
        .send({
          code: 'PRJ-PU02-HTTP',
          projectKey: 'PU02-HTTP',
          name: 'Proyecto Bloqueado HTTP',
          clientName: 'Cliente',
          organizationId: 'ORG-EXODO',
        });
      expect(pu02CreatePrj.status).toBe(403);

      // PU-08 tampoco obtiene permisos operativos SCM
      const pu08CreatePrj = await request(httpServer)
        .post('/api/v1/projects')
        .set('x-session-token', adminToken)
        .send({
          code: 'PRJ-PU08-HTTP',
          projectKey: 'PU08-HTTP',
          name: 'Proyecto PU-08 Bloqueado',
          clientName: 'Cliente',
          organizationId: 'ORG-EXODO',
        });
      expect(pu08CreatePrj.status).toBe(403);

      const pu08CreateRfc = await request(httpServer)
        .post('/api/v1/rfcs')
        .set('x-session-token', adminToken)
        .send({
          projectId: 'PRJ-001',
          targetEcsId: 'SRC-AUTH-JWT.ts',
          title: 'RFC No Autorizada PU-08',
          description: 'Intento de operación SCM desde PU-08',
          justification: 'Prueba de seguridad',
          priority: 'MEDIA',
        });
      expect(pu08CreateRfc.status).toBe(403);

      const pu08Projects = await request(httpServer)
        .get('/api/v1/projects')
        .set('x-session-token', adminToken);
      expect(pu08Projects.status).toBe(200);
      expect(pu08Projects.body.data).toEqual([]);

      // ADM-10: Autorizar USR-002 como Jefe de Proyecto (PU-09)
      const authRes = await request(httpServer)
        .patch('/api/v1/admin/users/USR-002/project-creation-auth')
        .set('x-session-token', adminToken)
        .send({ authorized: true, reason: 'Designación oficial PM' });
      expect(authRes.status).toBe(200);
      expect(authRes.body.data.canCreateProjects).toBe(true);
      expect(authRes.body.data.assignedRoleCodes).toContain('PU-09');
      // Conserva perfiles SCM previos y asignaciones históricas de proyectos
      expect(authRes.body.data.assignedRoleCodes).toContain('PU-03');
      expect(authRes.body.data.assignedRoleCodes).toContain('PU-06');
      expect(authRes.body.data.assignedProjectCodes).toEqual(['PRJ-001', 'PRJ-002', 'PRJ-003']);

      // USR-002 inicia sesión como PU-09 y también mantiene una sesión paralela como PU-03
      const pmLogin = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-09');
      expect(pmLogin.status).toBe(200);
      const pmToken = pmLogin.body.sessionToken;

      const devLogin = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-03');
      expect(devLogin.status).toBe(200);
      const archToken = devLogin.body.sessionToken;

      // PU-09 autorizado crea proyecto exitosamente
      const createPrjRes = await request(httpServer)
        .post('/api/v1/projects')
        .set('x-session-token', pmToken)
        .send({
          code: 'PRJ-ADM-10',
          projectKey: 'ADM-10-KEY',
          name: 'Proyecto Autorizado PU-09',
          clientName: 'Cliente Corporativo',
          organizationId: 'ORG-EXODO',
        });
      expect(createPrjRes.status).toBe(201);
      expect(createPrjRes.body.data.status).toBe('BORRADOR');

      // ADM-11 y ADM-24: Revocar autorización PU-09
      const revokeRes = await request(httpServer)
        .patch('/api/v1/admin/users/USR-002/project-creation-auth')
        .set('x-session-token', adminToken)
        .send({ authorized: false, reason: 'Fin de mandato PM' });
      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.data.canCreateProjects).toBe(false);
      expect(revokeRes.body.data.assignedRoleCodes).not.toContain('PU-09');
      expect(revokeRes.body.data.assignedRoleCodes).toContain('PU-03');
      expect(revokeRes.body.data.assignedProjectCodes).toContain('PRJ-001');

      // Sesión PU-09 activa previa queda revocada inmediatamente (401)
      const revokedPmCreate = await request(httpServer)
        .post('/api/v1/projects')
        .set('x-session-token', pmToken)
        .send({
          code: 'PRJ-ADM-11',
          projectKey: 'ADM-11-KEY',
          name: 'Proyecto Tras Revocación',
          clientName: 'Cliente Corporativo',
          organizationId: 'ORG-EXODO',
        });
      expect(revokedPmCreate.status).toBe(401);

      // Sesión PU-03 no afectada sigue operando y nuevo login con PU-09 es rechazado
      const archStillValid = await request(httpServer)
        .get('/api/v1/auth/me')
        .set('x-session-token', archToken);
      expect(archStillValid.status).toBe(200);

      const postRevokeLogin = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-09');
      expect(postRevokeLogin.status).toBe(400);
    });

    it('ADM-14 y ADM-24: Autorización repetida/concurrente consistente y coherencia de primaryRoleCode al revocar PU-09 o rol operativo', async () => {
      // Crear usuario exclusivo PU-09 mediante authorizeProjectCreation
      const createPmOnly = await request(httpServer)
        .post('/api/v1/admin/users')
        .set('x-session-token', adminToken)
        .send({
          fullName: 'PM Exclusivo',
          email: 'pmonly@exodo.pe',
          password: 'Password2026!',
          authorizeProjectCreation: true,
          organizationId: 'ORG-EXODO',
        });
      expect(createPmOnly.status).toBe(201);
      expect(createPmOnly.body.data.primaryRoleCode).toBe('PU-09');
      expect(createPmOnly.body.data.assignedRoleCodes).toEqual(['PU-09']);

      // Autorizaciones concurrentes repetidas (ADM-14)
      const [r1, r2] = await Promise.all([
        request(httpServer)
          .patch(`/api/v1/admin/users/${createPmOnly.body.data.id}/project-creation-auth`)
          .set('x-session-token', adminToken)
          .send({ authorized: true }),
        request(httpServer)
          .patch(`/api/v1/admin/users/${createPmOnly.body.data.id}/project-creation-auth`)
          .set('x-session-token', adminToken)
          .send({ authorized: true }),
      ]);
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r2.body.data.assignedRoleCodes.filter((c: string) => c === 'PU-09').length).toBe(1);

      // Revocación de PU-09 único actualiza primaryRoleCode coherentemente (defecto corregido en MI-02)
      const revokePmOnly = await request(httpServer)
        .patch(`/api/v1/admin/users/${createPmOnly.body.data.id}/project-creation-auth`)
        .set('x-session-token', adminToken)
        .send({ authorized: false });
      expect(revokePmOnly.status).toBe(200);
      expect(revokePmOnly.body.data.assignedRoleCodes).toEqual([]);
      expect(revokePmOnly.body.data.primaryRoleCode).not.toBe('PU-09');
      expect(revokePmOnly.body.data.canCreateProjects).toBe(false);

      // ADM-24 sobre rol operativo mediante PUT /admin/users/:id/roles
      const usr2LoginPU06 = await loginAs('rantayhua@exodo.pe', 'TraceFlow2026!', 'PU-06');
      expect(usr2LoginPU06.status).toBe(200);
      const pu06Token = usr2LoginPU06.body.sessionToken;

      const updateRolesRes = await request(httpServer)
        .put('/api/v1/admin/users/USR-002/roles')
        .set('x-session-token', adminToken)
        .send({ roleCodes: ['PU-03'], primaryRoleCode: 'PU-03' });
      expect(updateRolesRes.status).toBe(200);
      expect(updateRolesRes.body.data.assignedRoleCodes).toEqual(['PU-03']);

      const mePu06AfterRevoke = await request(httpServer)
        .get('/api/v1/auth/me')
        .set('x-session-token', pu06Token);
      expect(mePu06AfterRevoke.status).toBe(401);
    });
  });

  // ==========================================================================
  // BLOQUE D — INVITACIONES (ADM-16..ADM-20)
  // ==========================================================================
  describe('Bloque D — Invitaciones pendientes sin envío externo ni OAuth', () => {
    let adminToken: string;

    beforeEach(async () => {
      const res = await loginAs('admin@exodo.pe', 'TraceFlow2026!', 'PU-08');
      adminToken = res.body.sessionToken;
    });

    it('ADM-16 y ADM-17: Registro de invitaciones por EMAIL y GITHUB como PENDING sin crear cuentas ni membresías', async () => {
      const usersBefore = (await request(httpServer).get('/api/v1/admin/users').set('x-session-token', adminToken)).body.total;
      const membersBefore = await orgRepo.findMembersByOrgId('c0000001-0000-0000-0000-000000000001');

      // ADM-16: Invitación por EMAIL
      const emailInvRes = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({
          channel: 'EMAIL',
          email: '  Invitado.Nuevo@EXODO.PE ',
          intendedRoleCode: 'PU-06',
          organizationId: 'ORG-EXODO',
          notes: 'Pendiente de onboarding',
        });
      expect(emailInvRes.status).toBe(201);
      expect(emailInvRes.body.data.status).toBe('PENDING');
      expect(emailInvRes.body.data.channel).toBe('EMAIL');
      expect(emailInvRes.body.data.email).toBe('invitado.nuevo@exodo.pe');
      expect(emailInvRes.body.data.intended_role_code).toBe('PU-06');

      // ADM-17: Invitación por GITHUB sin correo
      const ghInvRes = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({
          channel: 'GITHUB',
          githubUsername: 'dev-github-99',
          intendedRoleCode: 'PU-07',
          organizationId: 'ORG-EXODO',
        });
      expect(ghInvRes.status).toBe(201);
      expect(ghInvRes.body.data.status).toBe('PENDING');
      expect(ghInvRes.body.data.channel).toBe('GITHUB');
      expect(ghInvRes.body.data.email).toBeNull();
      expect(ghInvRes.body.data.github_username).toBe('dev-github-99');

      // No se crearon usuarios ni membresías automáticamente
      const usersAfter = (await request(httpServer).get('/api/v1/admin/users').set('x-session-token', adminToken)).body.total;
      const membersAfter = await orgRepo.findMembersByOrgId('c0000001-0000-0000-0000-000000000001');
      expect(usersAfter).toBe(usersBefore);
      expect(membersAfter.length).toBe(membersBefore.length);
    });

    it('ADM-18: Invitación inválida, duplicada o con rol PU-08 es rechazada', async () => {
      // Canal EMAIL sin email
      const missingEmail = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({ channel: 'EMAIL', intendedRoleCode: 'PU-06' });
      expect(missingEmail.status).toBe(400);

      // Canal GITHUB sin usuario GitHub
      const missingGh = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({ channel: 'GITHUB', intendedRoleCode: 'PU-06' });
      expect(missingGh.status).toBe(400);

      // Prohibición de invitar PU-08
      const invitePu08 = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({ channel: 'EMAIL', email: 'super@exodo.pe', intendedRoleCode: 'PU-08' });
      expect(invitePu08.status).toBe(403);

      // Fecha de expiración en el pasado
      const expiredDate = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({
          channel: 'EMAIL',
          email: 'exp@exodo.pe',
          intendedRoleCode: 'PU-06',
          expiresAt: '2020-01-01T00:00:00.000Z',
        });
      expect(expiredDate.status).toBe(400);

      // Duplicado en mismo ámbito
      const firstInv = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({
          channel: 'EMAIL',
          email: 'dup@exodo.pe',
          intendedRoleCode: 'PU-06',
          organizationId: 'ORG-EXODO',
        });
      expect(firstInv.status).toBe(201);

      const dupInv = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({
          channel: 'EMAIL',
          email: 'DUP@EXODO.PE',
          intendedRoleCode: 'PU-06',
          organizationId: 'ORG-EXODO',
        });
      expect(dupInv.status).toBe(409);
    });

    it('ADM-19 y ADM-20: Cancelación actualiza estado e impide aceptación externa o transiciones arbitrarias', async () => {
      const created = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({
          channel: 'EMAIL',
          email: 'cancelable@exodo.pe',
          intendedRoleCode: 'PU-01',
          organizationId: 'ORG-EXODO',
        });
      expect(created.status).toBe(201);
      const invId = created.body.data.id;

      // ADM-20: Bloquear aceptación externa (ACCEPTED -> 403 Forbidden)
      const acceptRes = await request(httpServer)
        .patch(`/api/v1/admin/invitations/${invId}/status`)
        .set('x-session-token', adminToken)
        .send({ status: 'ACCEPTED' });
      expect(acceptRes.status).toBe(403);

      // ADM-20: Bloquear transición arbitraria (PENDING / ACTIVE -> 400 Bad Request)
      const invalidTransRes = await request(httpServer)
        .patch(`/api/v1/admin/invitations/${invId}/status`)
        .set('x-session-token', adminToken)
        .send({ status: 'PENDING' });
      expect(invalidTransRes.status).toBe(400);

      // ADM-19: Cancelar invitación
      const cancelRes = await request(httpServer)
        .patch(`/api/v1/admin/invitations/${invId}/status`)
        .set('x-session-token', adminToken)
        .send({ status: 'CANCELLED', reason: 'Solicitud retirada' });
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
      expect(cancelRes.body.data.cancelled_by).toBeDefined();

      // No se puede cancelar nuevamente una invitación ya cancelada
      const cancelAgainRes = await request(httpServer)
        .patch(`/api/v1/admin/invitations/${invId}/status`)
        .set('x-session-token', adminToken)
        .send({ status: 'CANCELLED' });
      expect(cancelAgainRes.status).toBe(400);
    });
  });

  // ==========================================================================
  // BLOQUE E — AUDITORÍA ADMINISTRATIVA Y ATOMICIDAD (ADM-23)
  // ==========================================================================
  describe('Bloque E — Auditoría administrativa y rollback transaccional', () => {
    it('ADM-23: Registra todos los eventos administrativos en cadena SHA-256 íntegra sin exponer secretos', async () => {
      const adminLogin = await loginAs('admin@exodo.pe', 'TraceFlow2026!', 'PU-08');
      const adminToken = adminLogin.body.sessionToken;

      const created = await request(httpServer)
        .post('/api/v1/admin/users')
        .set('x-session-token', adminToken)
        .send({
          fullName: 'Auditado Admin',
          email: 'auditado@exodo.pe',
          password: 'SuperSecretPassword2026!',
          roleCodes: ['PU-01'],
        });
      expect(created.status).toBe(201);
      const uid = created.body.data.id;

      await request(httpServer)
        .patch(`/api/v1/admin/users/${uid}`)
        .set('x-session-token', adminToken)
        .send({ position: 'Analista Auditado' });

      await request(httpServer)
        .put(`/api/v1/admin/users/${uid}/roles`)
        .set('x-session-token', adminToken)
        .send({ roleCodes: ['PU-01', 'PU-02'], primaryRoleCode: 'PU-02' });

      await request(httpServer)
        .patch(`/api/v1/admin/users/${uid}/project-creation-auth`)
        .set('x-session-token', adminToken)
        .send({ authorized: true });

      await request(httpServer)
        .patch(`/api/v1/admin/users/${uid}/project-creation-auth`)
        .set('x-session-token', adminToken)
        .send({ authorized: false });

      await request(httpServer)
        .patch(`/api/v1/admin/users/${uid}/status`)
        .set('x-session-token', adminToken)
        .send({ status: 'SUSPENDED' });

      await request(httpServer)
        .patch(`/api/v1/admin/users/${uid}/status`)
        .set('x-session-token', adminToken)
        .send({ status: 'ACTIVE' });

      const inv = await request(httpServer)
        .post('/api/v1/admin/invitations')
        .set('x-session-token', adminToken)
        .send({ channel: 'EMAIL', email: 'auditinv@exodo.pe', intendedRoleCode: 'PU-06' });
      await request(httpServer)
        .patch(`/api/v1/admin/invitations/${inv.body.data.id}/status`)
        .set('x-session-token', adminToken)
        .send({ status: 'CANCELLED' });

      expect(auditService.verifyChainIntegrity()).toBe(true);
      const chain = auditService.getAuditChain();
      const eventCodes = chain.map((e) => e.eventCode);

      expect(eventCodes).toContain('USER_CREATED');
      expect(eventCodes).toContain('USER_UPDATED');
      expect(eventCodes).toContain('USER_ROLES_UPDATED');
      expect(eventCodes).toContain('USER_PRJ_CREATION_AUTHORIZED');
      expect(eventCodes).toContain('USER_PRJ_CREATION_REVOKED');
      expect(eventCodes).toContain('USER_SUSPENDED');
      expect(eventCodes).toContain('USER_REACTIVATED');
      expect(eventCodes).toContain('USER_INVITATION_CREATED');
      expect(eventCodes).toContain('USER_INVITATION_CANCELLED');

      const serializedChain = JSON.stringify(chain);
      expect(serializedChain).not.toContain('SuperSecretPassword2026!');
      expect(serializedChain).not.toContain('TraceFlow2026!');
      expect(serializedChain).not.toContain('$argon2');
      expect(serializedChain).not.toContain(adminToken);
    });

    it('ADM-23 (Atomicidad pg-mem): Un fallo en el servicio de auditoría revierte la operación administrativa sin confirmar cambios', async () => {
      const memDb = newDb();
      memDb.public.registerFunction({
        name: 'gen_random_uuid',
        implementation: () => crypto.randomUUID(),
      });
      memDb.public.registerFunction({
        name: 'now',
        implementation: () => new Date(),
      });
      const pgAdapter = memDb.adapters.createPg();
      const pool: pg.Pool = new pgAdapter.Pool();

      await pool.query(`
        CREATE SCHEMA IF NOT EXISTS traceflow;
        CREATE TABLE traceflow.app_role (
          id INT PRIMARY KEY,
          code VARCHAR(30) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT
        );
        CREATE TABLE traceflow.app_user (
          id UUID PRIMARY KEY,
          code VARCHAR(30) UNIQUE NOT NULL,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(120) NOT NULL,
          organization VARCHAR(120) NOT NULL DEFAULT 'ÉXODO S.A.C.',
          position VARCHAR(120),
          status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
          can_create_projects BOOLEAN NOT NULL DEFAULT FALSE,
          project_creation_authorized_by UUID,
          project_creation_authorized_at TIMESTAMPTZ,
          github_username VARCHAR(100),
          github_user_id BIGINT,
          github_identity_status VARCHAR(20) NOT NULL DEFAULT 'UNVERIFIED',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE traceflow.user_invitation (
          id UUID PRIMARY KEY,
          channel VARCHAR(20) NOT NULL,
          email VARCHAR(100),
          github_username VARCHAR(100),
          organization_id UUID,
          project_id UUID,
          intended_role_id INT NOT NULL REFERENCES traceflow.app_role(id),
          status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
          invited_by UUID NOT NULL REFERENCES traceflow.app_user(id),
          cancelled_by UUID,
          cancelled_at TIMESTAMPTZ,
          accepted_user_id UUID,
          accepted_at TIMESTAMPTZ,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ
        );
        INSERT INTO traceflow.app_role (id, code, name, description)
        VALUES
          (6, 'PU-06', 'Desarrollador', 'Dev'),
          (8, 'PU-08', 'Administrador del Sistema', 'Admin'),
          (9, 'PU-09', 'Jefe de Proyecto', 'PM');
        INSERT INTO traceflow.app_user (id, code, username, email, password_hash, full_name, status)
        VALUES ('a0000001-0000-0000-0000-000000000005', 'USR-005', 'sysadmin', 'admin@exodo.pe', 'hash5', 'Admin', 'ACTIVE');
      `);

      const pgDbService = new DatabaseService('postgres');
      (pool as any)._memDbBackup = () => memDb.backup();
      (pgDbService as any).pool = pool;
      (pgDbService as any).isConnected = true;

      const pgAuthRepo = new AuthRepository(pgDbService);
      const pgUsersRepo = new UsersRepository(pgDbService, pgAuthRepo);
      const pgOrgRepo = new OrganizationsRepository(pgDbService, pgAuthRepo);
      const pgAuditService = new AuditService(pgDbService);
      const pgAuthService = new AuthService(pgAuthRepo, pgAuditService);
      const pgUsersService = new UsersService(
        pgDbService,
        pgUsersRepo,
        pgAuthRepo,
        pgAuthService,
        pgOrgRepo,
        pgAuditService
      );

      // Forzar fallo del servicio de auditoría durante la transacción
      pgAuditService.logEvent = async () => {
        throw new Error('Fallo simulado de trazabilidad SHA-256');
      };

      const caller = {
        id: 'a0000001-0000-0000-0000-000000000005',
        code: 'USR-005',
        username: 'sysadmin',
        email: 'admin@exodo.pe',
        fullName: 'Admin',
        organization: 'ÉXODO S.A.C.',
        position: 'Admin',
        activeRoleId: 'PU-08' as const,
        allowedRoleIds: ['PU-08' as const],
        assignedProjectIds: [],
      };

      // Simular fallo en creación de invitación (evita query LATERAL de buildUserSelectQuery en pg-mem)
      pgUsersRepo.findDuplicatePendingInvitation = async () => null;
      pgUsersRepo.findInvitationById = async (id: string, client?: any) => {
        const res = await (client || pgDbService).query(
          'SELECT * FROM traceflow.user_invitation WHERE id = $1',
          [id]
        );
        return res.rows[0] || null;
      };

      await expect(
        pgUsersService.createInvitation(
          {
            channel: 'EMAIL',
            email: 'rollback-check@exodo.pe',
            intendedRoleCode: 'PU-06',
          },
          caller
        )
      ).rejects.toThrow('Fallo simulado de trazabilidad SHA-256');

      // Verificar que la invitación NO quedó persistida tras el rollback
      const checkRes = await pool.query(
        "SELECT COUNT(*)::text as c FROM traceflow.user_invitation WHERE email = 'rollback-check@exodo.pe'"
      );
      expect(parseInt(checkRes.rows[0].c, 10)).toBe(0);

      await pool.end();
    });
  });
});
