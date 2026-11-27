/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE VERIFICACIÓN DE APROVISIONAMIENTO DEMO-01
 * Archivo: backend/test/demo-provisioning.spec.ts
 * Cobertura:
 *  - Guardas de entorno local exclusivo (bloqueo Supabase remoto y producción)
 *  - Aprovisionamiento idempotente de 9 cuentas (PU-01 a PU-09) con Argon2id único
 *  - Conservación intacta de USR-001..USR-004 (jmedina, rantayhua, arivera, rloyola)
 *  - Flujo administrativo completo PU-08 <-> PU-09 y restricciones RBAC/SoD
 * ============================================================================
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { UsersRepository } from '../src/modules/users/users.repository.js';
import { UsersService } from '../src/modules/users/users.service.js';
import {
  DEMO_ACCOUNTS_CATALOG,
  assertSafeLocalDemoDatabase,
  provisionDemoAccounts,
} from '../src/scripts/provision-demo.js';

describe('MVP-H01 / DEMO-01: Aprovisionamiento seguro e idempotente de cuentas de evaluación', () => {
  const TEST_LOCAL_SECRET = 'LocalEvalTest#2026!';
  let app: INestApplication;
  let httpServer: any;
  let db: DatabaseService;
  let authRepo: AuthRepository;
  let usersRepo: UsersRepository;
  let orgRepo: OrganizationsRepository;
  let authService: AuthService;
  let usersService: UsersService;
  let auditService: AuditService;

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
    db = app.get(DatabaseService);
    authRepo = app.get(AuthRepository);
    usersRepo = app.get(UsersRepository);
    orgRepo = app.get(OrganizationsRepository);
    authService = app.get(AuthService);
    usersService = app.get(UsersService);
    auditService = app.get(AuditService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('bloquea ejecución contra Supabase remoto, hosts externos, producción y bases de sistema', () => {
    expect(() =>
      assertSafeLocalDemoDatabase('postgresql://user:pass@127.0.0.1:5432/traceflow_mvp_dev', 'production')
    ).toThrow(/NODE_ENV=production/);

    expect(() =>
      assertSafeLocalDemoDatabase(undefined, 'development')
    ).toThrow(/DATABASE_URL no está definida/);

    const blockedUrls = [
      'postgresql://postgres:pwd@db.xmyfqxlvveiawnxgydtz.supabase.co:5432/postgres',
      'postgresql://postgres:pwd@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
      'postgresql://postgres:pwd@my-db.rds.amazonaws.com:5432/traceflow',
      'postgresql://postgres:pwd@192.168.1.25:5432/traceflow_mvp_dev',
      'postgresql://postgres:pwd@127.0.0.1:5432/postgres',
      'postgresql://postgres:pwd@localhost:5432/production',
    ];

    for (const url of blockedUrls) {
      expect(() => assertSafeLocalDemoDatabase(url, 'development')).toThrow(/DEMO-01 BLOQUEADO/);
    }

    expect(() =>
      assertSafeLocalDemoDatabase('postgresql://postgres:pwd@127.0.0.1:5432/traceflow_mvp_dev', 'development')
    ).not.toThrow();
    expect(() =>
      assertSafeLocalDemoDatabase('postgresql://postgres:pwd@localhost:5432/traceflow_local', 'test')
    ).not.toThrow();
  });

  it('aprovisiona las 9 cuentas demo desde cero (incluyendo admin@exodo.pe), preserva USR-001..004 y es idempotente', async () => {
    // Simular entorno local fresco sin USR-005 previo
    const mockUsers = authRepo.getMockUsersRef();
    const adminIdx = mockUsers.findIndex((u) => u.email === 'admin@exodo.pe');
    if (adminIdx !== -1) {
      mockUsers.splice(adminIdx, 1);
    }

    const legacySnapshot = mockUsers.map((u) => ({
      email: u.email,
      passwordHash: u.password_hash,
      roles: [...u.assigned_role_codes],
      projects: [...u.assigned_project_codes],
    }));

    const firstRun = await provisionDemoAccounts(
      { db, authRepo, usersRepo, orgRepo, authService, usersService, auditService },
      TEST_LOCAL_SECRET
    );

    expect(firstRun.length).toBe(9);
    expect(firstRun.every((r) => r.status === 'CREATED')).toBe(true);

    // Verificar conservación íntegra de USR-001..USR-004
    for (const snap of legacySnapshot) {
      const current = await authRepo.findByEmail(snap.email);
      expect(current).not.toBeNull();
      expect(current!.password_hash).toBe(snap.passwordHash);
      expect(current!.assigned_role_codes).toEqual(snap.roles);
      expect(current!.assigned_project_codes).toEqual(snap.projects);
    }

    // Verificar hashes Argon2id independientes para las 9 cuentas
    const hashes = new Set<string>();
    for (const spec of DEMO_ACCOUNTS_CATALOG) {
      const account = await authRepo.findByEmail(spec.email);
      expect(account).not.toBeNull();
      expect(account!.email).toBe(spec.email.toLowerCase());
      expect(account!.status).toBe('ACTIVE');
      expect(account!.primary_role_code).toBe(spec.roleCode);
      expect(account!.assigned_role_codes).toContain(spec.roleCode);
      expect(account!.password_hash).toMatch(/^\$argon2id\$/);
      hashes.add(account!.password_hash);
    }
    expect(hashes.size).toBe(9);

    // Segunda ejecución: 100% idempotente, sin duplicados y sin sobrescribir hashes
    const secondRun = await provisionDemoAccounts(
      { db, authRepo, usersRepo, orgRepo, authService, usersService, auditService },
      'OtroPasswordQueNoDebeSobrescribir2026!'
    );
    expect(secondRun.length).toBe(9);
    expect(secondRun.every((r) => r.status === 'SKIPPED_EXISTING')).toBe(true);

    for (const spec of DEMO_ACCOUNTS_CATALOG) {
      const account = await authRepo.findByEmail(spec.email);
      expect(hashes.has(account!.password_hash)).toBe(true);
    }

    expect(auditService.verifyChainIntegrity()).toBe(true);
    expect(JSON.stringify(auditService.getAuditChain())).not.toContain(TEST_LOCAL_SECRET);
  });

  it('verifica autenticación, RBAC/SoD, permisos exclusivos PU-08/PU-09 y flujo completo de evaluación', async () => {
    // Escenario con USR-005 preexistente: no sobrescribe contraseña de USR-005 y crea las 8 adicionales
    const existingAdmin = await authRepo.findByEmail('admin@exodo.pe');
    const existingAdminHash = existingAdmin!.password_hash;

    const runResults = await provisionDemoAccounts(
      { db, authRepo, usersRepo, orgRepo, authService, usersService, auditService },
      TEST_LOCAL_SECRET
    );
    expect(runResults.find((r) => r.email === 'admin@exodo.pe')?.status).toBe('SKIPPED_EXISTING');
    expect((await authRepo.findByEmail('admin@exodo.pe'))!.password_hash).toBe(existingAdminHash);
    expect(runResults.filter((r) => r.status === 'CREATED').length).toBe(8);

    // 1. Iniciar sesión como PU-08 (admin@exodo.pe)
    const adminLogin = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@exodo.pe', password: 'TraceFlow2026!', requestedRoleId: 'PU-08' });
    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.sessionToken;
    expect(adminLogin.body.user.assignedProjectIds).toEqual([]);

    // 2. Consultar cuentas registradas y verificar autorización de PU-09 (jefeproyecto@exodo.pe)
    const listRes = await request(httpServer)
      .get('/api/v1/admin/users')
      .set('x-session-token', adminToken);
    expect(listRes.status).toBe(200);
    const pmUser = listRes.body.data.find((u: any) => u.email === 'jefeproyecto@exodo.pe');
    expect(pmUser).toBeDefined();
    expect(pmUser.canCreateProjects).toBe(true);
    expect(pmUser.primaryRoleCode).toBe('PU-09');
    expect(pmUser.assignedProjectCodes).toEqual([]);

    // 3. Revocar y volver a conceder autorización de PU-09
    const revokeRes = await request(httpServer)
      .patch(`/api/v1/admin/users/${pmUser.id}/project-creation-auth`)
      .set('x-session-token', adminToken)
      .send({ authorized: false, reason: 'Verificación de flujo demo' });
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.canCreateProjects).toBe(false);

    const regrantRes = await request(httpServer)
      .patch(`/api/v1/admin/users/${pmUser.id}/project-creation-auth`)
      .set('x-session-token', adminToken)
      .send({ authorized: true, reason: 'Habilitación demo' });
    expect(regrantRes.status).toBe(200);
    expect(regrantRes.body.data.canCreateProjects).toBe(true);

    // 4. Cerrar sesión admin e ingresar como jefe de proyecto PU-09
    await request(httpServer)
      .post('/api/v1/auth/logout')
      .set('x-session-token', adminToken);

    const pmLogin = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'jefeproyecto@exodo.pe', password: TEST_LOCAL_SECRET, requestedRoleId: 'PU-09' });
    expect(pmLogin.status).toBe(200);
    expect(pmLogin.body.user.canCreateProjects).toBe(true);

    // PU-09 autorizado puede crear proyecto en ORG-EXODO, pero no acceder a /admin/users
    const pmAdminAttempt = await request(httpServer)
      .get('/api/v1/admin/users')
      .set('x-session-token', pmLogin.body.sessionToken);
    expect(pmAdminAttempt.status).toBe(403);

    const createPrjRes = await request(httpServer)
      .post('/api/v1/projects')
      .set('x-session-token', pmLogin.body.sessionToken)
      .send({
        code: 'PRJ-DEMO-01',
        projectKey: 'DEMO-01',
        name: 'Proyecto Piloto Evaluación',
        clientName: 'ÉXODO S.A.C.',
        organizationId: 'ORG-EXODO',
      });
    expect(createPrjRes.status).toBe(201);

    // 5. Verificar autenticación, aislamiento de proyectos y bloqueo administrativo para PU-01..PU-07
    for (const spec of DEMO_ACCOUNTS_CATALOG) {
      if (spec.roleCode === 'PU-08' || spec.roleCode === 'PU-09') continue;

      const login = await request(httpServer)
        .post('/api/v1/auth/login')
        .send({ email: spec.email, password: TEST_LOCAL_SECRET, requestedRoleId: spec.roleCode });
      expect(login.status).toBe(200);
      expect(login.body.user.activeRoleId).toBe(spec.roleCode);
      expect(login.body.user.assignedProjectIds).toEqual([]);

      const adminCheck = await request(httpServer)
        .get('/api/v1/admin/users')
        .set('x-session-token', login.body.sessionToken);
      expect(adminCheck.status).toBe(403);

      const projectsCheck = await request(httpServer)
        .get('/api/v1/projects')
        .set('x-session-token', login.body.sessionToken);
      expect(projectsCheck.status).toBe(200);
      expect(projectsCheck.body.data).toEqual([]);
    }
  });
});
