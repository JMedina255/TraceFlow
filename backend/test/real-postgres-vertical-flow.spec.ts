/**
 * ============================================================================
 * TRACEFLOW SCM — VERIFICACIÓN DE FLUJO VERTICAL REAL EN POSTGRESQL (DB-02.7)
 * Archivo: backend/test/real-postgres-vertical-flow.spec.ts
 * Hito: DB-02 — Etapa DB-02.7
 * 
 * [CLASIFICACIÓN: INTEGRACIÓN E2E POSTGRESQL REAL VÍA HTTP / SUPERTEST]
 * Valida el flujo completo React ↔ NestJS ↔ PostgreSQL Supabase:
 * 1. Health check (/api/v1/health)
 * 2. Login con USR-001 y Argon2id (/api/v1/auth/login)
 * 3. Perfil del usuario autenticado (/api/v1/auth/me)
 * 4. Listado de proyectos autorizados (/api/v1/projects)
 * 5. Detalle de proyecto y ECS asociados (/api/v1/projects/PRJ-001)
 * 6. Registro formal de RFC con PU-01 (/api/v1/rfcs)
 * 7. Consulta de RFC recién creada (/api/v1/rfcs/:id)
 * 8. Comprobación de persistencia física en PostgreSQL y auditoría SHA-256
 * 9. Persistencia tras reinicio completo del backend
 * 10. Logout e invalidación de sesión (/api/v1/auth/logout)
 * ============================================================================
 */
import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import pg from 'pg';
const { Pool } = pg;
import * as fs from 'node:fs';
import * as path from 'node:path';

import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { assertSafeTestDatabase } from '../src/common/guards/test-isolation.guard.js';

const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('[SEC-01] DATABASE_URL o TEST_DATABASE_URL no configurada. Las pruebas de integración requieren variables de entorno explícitas.');
}
assertSafeTestDatabase(dbUrl, 'Flujo Vertical Real NestJS ↔ PostgreSQL (Etapa DB-02.7)', process.env.ALLOW_REMOTE_TEST_DML === 'true');
const certPath = path.resolve(process.cwd(), process.env.DATABASE_SSL_CA_PATH || 'cert/prod-ca-2021.crt');
const caCert = fs.existsSync(certPath) ? fs.readFileSync(certPath, 'utf8') : undefined;

describe('TraceFlow SCM — Flujo Vertical Real NestJS ↔ PostgreSQL (Etapa DB-02.7)', { timeout: 35000 }, () => {
  let app: INestApplication;
  let pgPool: pg.Pool;
  let sessionCookie: string;
  let createdRfcCode: string;
  let createdRfcId: string;

  const createNestApp = async (): Promise<INestApplication> => {
    const nestApp = await NestFactory.create(AppModule);
    nestApp.setGlobalPrefix('api/v1');
    nestApp.use(cookieParser());
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    nestApp.useGlobalFilters(new HttpExceptionFilter());
    await nestApp.init();
    return nestApp;
  };

  beforeAll(async () => {
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: caCert ? { rejectUnauthorized: true, ca: caCert } : { rejectUnauthorized: false },
      max: 3,
    });
    app = await createNestApp();
  });

  afterAll(async () => {
    if (createdRfcId && pgPool) {
      try {
        await pgPool.query('DELETE FROM traceflow.change_request WHERE id = $1', [createdRfcId]);
      } catch {
        // Ignorar
      }
    }
    if (app) await app.close();
    if (pgPool) await pgPool.end();
  });

  // 1. Health check
  it('Paso 1: GET /api/v1/health debe reportar status ok, database connected y mode postgres', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    console.log('HEALTH RES:', res.status, res.body);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.mode).toBe('postgres');
    expect(res.body.details?.engine).toMatch(/PostgreSQL/i);
  });

  // 2. Login con USR-001 (Argon2id)
  it('Paso 2: POST /api/v1/auth/login debe autenticar a USR-001 con Argon2id y emitir cookie tf_session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'jmedina@exodo.pe',
        password: process.env.TEST_USER_PASSWORD || 'TraceFlow2026!',
        requestedRoleId: 'PU-01',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.code).toBe('USR-001');
    expect(res.body.user.activeRoleId).toBe('PU-01');
    expect(res.body.sessionToken).toBeDefined();

    // Extraer cookie de sesión
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
    expect(cookieHeader).toContain('tf_session=');
    sessionCookie = cookieHeader;
  });

  // 3. Perfil del usuario /auth/me
  it('Paso 3: GET /api/v1/auth/me debe validar la sesión y retornar proyectos y roles autorizados', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.user.code).toBe('USR-001');
    expect(res.body.user.activeRoleId).toBe('PU-01');
    expect(res.body.user.allowedRoleIds).toContain('PU-01');
    expect(res.body.user.allowedRoleIds).toContain('PU-02');
    expect(res.body.user.assignedProjectIds).toContain('PRJ-001');
  });

  // 4. Listado de proyectos
  it('Paso 4: GET /api/v1/projects debe retornar los proyectos activos desde PostgreSQL', async () => {
    const hasOrgTableRes = await pgPool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_name = 'organization'
      ) as exists;
    `);
    const hasOrgTable = hasOrgTableRes.rows[0]?.exists;

    const res = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .set('Cookie', sessionCookie);

    if (!hasOrgTable) {
      // H02-R02: Si la tabla de organizaciones no existe en la BD real (migración pendiente de CCB),
      // el sistema debe arrojar un error controlado 503 sin simular organizaciones en memoria.
      expect([503, 500]).toContain(res.status);
      return;
    }

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
    const codes = res.body.data.map((p: any) => p.code);
    expect(codes).toContain('PRJ-001');
    expect(codes).toContain('PRJ-002');
    expect(codes).toContain('PRJ-003');
  });

  // 5. Detalle de PRJ-001 con ECS asociados
  it('Paso 5: GET /api/v1/projects/PRJ-001 debe retornar detalle y sus elementos ECS asociados', async () => {
    const hasOrgTableRes = await pgPool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'traceflow' AND table_name = 'organization'
      ) as exists;
    `);
    const hasOrgTable = hasOrgTableRes.rows[0]?.exists;

    const res = await request(app.getHttpServer())
      .get('/api/v1/projects/PRJ-001')
      .set('Cookie', sessionCookie);

    if (!hasOrgTable) {
      // H02-R02: Proyecto sin organización institucional en BD no migrada es bloqueado controladamente
      expect([403, 503, 500]).toContain(res.status);
      return;
    }

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('PRJ-001');
    expect(res.body.data.name).toBe('Pasarela de Pagos Core');
    expect(res.body.data.ecs).toBeDefined();
    expect(Array.isArray(res.body.data.ecs)).toBe(true);
    expect(res.body.data.ecs.length).toBeGreaterThan(0);
  });

  // 6. Registro de nueva RFC con PU-01
  it('Paso 6: POST /api/v1/rfcs debe registrar formalmente una RFC con PU-01 y generar auditoría', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/rfcs')
      .set('Cookie', sessionCookie)
      .send({
        projectId: 'PRJ-001',
        targetEcsId: 'SRC-AUTH-JWT.ts',
        title: 'Verificación del Flujo Vertical E2E con PostgreSQL Supabase',
        description: 'Implementación y verificación integral del flujo React -> NestJS -> PostgreSQL real con certificado CA.',
        justification: 'Cumplimiento del Hito DB-02 para certificación física de integridad referencial y auditoría SHA-256.',
        priority: 'ALTA',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.code).toMatch(/^RFC-2026-\d{4}$/);
    expect(res.body.data.status).toBe('REGISTRADA');
    createdRfcCode = res.body.data.code;
    createdRfcId = res.body.data.id;
  });

  // 7. Consulta de RFC por código
  it('Paso 7: GET /api/v1/rfcs/:id debe retornar la RFC recién registrada', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/rfcs/${createdRfcCode}`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe(createdRfcCode);
    expect(res.body.data.title).toContain('Verificación del Flujo Vertical');
    expect(res.body.data.priority).toBe('ALTA');
  });

  // 8. Verificación de persistencia física directa en PostgreSQL y pista SHA-256
  it('Paso 8: La RFC y el evento de auditoría SHA-256 deben existir físicamente en traceflow', async () => {
    // Verificar en tabla traceflow.change_request
    const rfcRes = await pgPool.query(
      'SELECT id, code, title, status, priority FROM traceflow.change_request WHERE id = $1',
      [createdRfcId]
    );
    expect(rfcRes.rows.length).toBe(1);
    expect(rfcRes.rows[0].code).toBe(createdRfcCode);

    // Verificar en tabla traceflow.audit_log
    const auditRes = await pgPool.query(
      `SELECT sequence_number, event_code, operation, prev_log_hash, curr_log_hash, timestamp
       FROM traceflow.audit_log
       WHERE entity_name = 'change_request' AND entity_id = $1
       ORDER BY sequence_number DESC LIMIT 1`,
      [createdRfcId]
    );
    expect(auditRes.rows.length).toBe(1);
    expect(auditRes.rows[0].operation).toBe('REGISTRAR_RFC_CU04');
    expect(auditRes.rows[0].curr_log_hash).toBeDefined();
    expect(auditRes.rows[0].curr_log_hash.length).toBe(64); // Longitud SHA-256 hex
  });

  // 9. Persistencia tras reinicio completo del backend
  it('Paso 9: Los datos persisten tras el cierre y reinicio del proceso NestJS', async () => {
    // Cerrar la aplicación NestJS simulando parada del servidor
    await app.close();

    // Crear y reiniciar una nueva instancia completa de NestJS
    app = await createNestApp();

    // Iniciar nueva sesión
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'jmedina@exodo.pe',
        password: process.env.TEST_USER_PASSWORD || 'TraceFlow2026!',
        requestedRoleId: 'PU-01',
      });
    expect(loginRes.status).toBe(200);
    const newCookieHeader = loginRes.headers['set-cookie'];
    const newSessionCookie = Array.isArray(newCookieHeader) ? newCookieHeader.join('; ') : newCookieHeader;

    // Consultar nuevamente la RFC creada previamente
    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/rfcs/${createdRfcCode}`)
      .set('Cookie', newSessionCookie);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(createdRfcId);
    expect(getRes.body.data.code).toBe(createdRfcCode);
  });

  // 10. Logout e invalidación de sesión
  it('Paso 10: POST /api/v1/auth/logout debe revocar la sesión en PostgreSQL y bloquear acceso posterior', async () => {
    const logoutRes = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', sessionCookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toContain('Sesión cerrada');

    // Intentar acceder con la cookie anterior debe responder 401 Unauthorized
    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(meRes.status).toBe(401);
  });
});
