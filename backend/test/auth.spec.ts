/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE DE PRUEBAS DE AUTENTICACIÓN Y SESIONES
 * Archivo: backend/test/auth.spec.ts
 * Hito: DB-01 / DB-01.1 — Requisito H-04 (Certificación de Pruebas)
 * 
 * [CLASIFICACIÓN: UNITARIAS / REPOSITORIOS EN MEMORIA]
 * ADVERTENCIA DE CERTIFICACIÓN (H-04):
 * Esta suite ejecuta sobre repositorios y almacenes en memoria (mock mode).
 * Valida la lógica de negocio, derivación de tokens SHA-256, hashing Argon2id
 * y reglas SoD a nivel de servicio NestJS.
 * NO constituye evidencia de restricciones físicas ni conectividad de PostgreSQL en vivo.
 * Las pruebas de integración contra PostgreSQL real residen en real-postgres-integration.spec.ts.
 * ============================================================================
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { AuthService } from '../src/modules/auth/auth.service.js';

describe('Backend Auth & Session Management (ADR-006, SoD, RBAC)', () => {
  let authService: AuthService;
  let authRepo: AuthRepository;
  let auditService: AuditService;

  beforeEach(() => {
    const db = new DatabaseService();
    auditService = new AuditService(db);
    authRepo = new AuthRepository(db);
    authService = new AuthService(authRepo, auditService);
  });

  it('debe autenticar exitosamente con credenciales válidas y rol asignado', async () => {
    const result = await authService.login('jmedina@exodo.pe', 'TraceFlow2026!', 'PU-02');
    expect(result.sessionToken).toBeDefined();
    expect(result.sessionToken.length).toBe(64); // 256 bits hex
    expect(result.user.code).toBe('USR-001');
    expect(result.user.activeRoleId).toBe('PU-02');
  });

  it('debe rechazar inicio de sesión con contraseña inválida', async () => {
    await expect(authService.login('jmedina@exodo.pe', 'WrongPassword123!', 'PU-02')).rejects.toThrow(
      'Credenciales institucionales incorrectas'
    );
  });

  it('debe rechazar adopción de rol no asignado (SoD / RN-01)', async () => {
    // USR-004 solo tiene PU-04 asignado. Intentar adoptar PU-01 debe fallar
    await expect(authService.login('rloyola@exodo.pe', 'TraceFlow2026!', 'PU-01')).rejects.toThrow(
      'Violación de SoD (RN-01 / RN-04)'
    );
  });

  it('debe validar token de sesión opaco y recuperar el usuario activo', async () => {
    const { sessionToken } = await authService.login('jmedina@exodo.pe', 'TraceFlow2026!', 'PU-01');
    const user = await authService.validateSessionToken(sessionToken);
    expect(user).not.toBeNull();
    expect(user?.code).toBe('USR-001');
    expect(user?.activeRoleId).toBe('PU-01');
  });

  it('debe revocar la sesión al ejecutar logout y no permitir reutilización', async () => {
    const { sessionToken } = await authService.login('jmedina@exodo.pe', 'TraceFlow2026!', 'PU-02');
    await authService.logout(sessionToken);
    const user = await authService.validateSessionToken(sessionToken);
    expect(user).toBeNull();
  });
});
