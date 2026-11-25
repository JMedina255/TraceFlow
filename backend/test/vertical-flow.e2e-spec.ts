/**
 * ============================================================================
 * TRACEFLOW SCM — FLUJO VERTICAL MODULAR COMPLETO
 * Archivo: backend/test/vertical-flow.e2e-spec.ts
 * Hito: DB-01 / DB-01.1 — Requisito H-04 (Certificación de Pruebas)
 * 
 * [CLASIFICACIÓN: INTEGRACIÓN DE SERVICIOS EN MEMORIA / E2E MODULAR]
 * ADVERTENCIA DE CERTIFICACIÓN (H-04):
 * Esta suite valida la integración de extremo a extremo entre los módulos de aplicación
 * (AuthService -> ProjectsService -> RfcsService -> AuditService) en modo memoria desconectado.
 * NO sustituye la verificación de la red, latencia, TLS ni persistencia en PostgreSQL real.
 * ============================================================================
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { RfcsRepository } from '../src/modules/rfcs/rfcs.repository.js';
import { RfcsService } from '../src/modules/rfcs/rfcs.service.js';

describe('Flujo Vertical Completo E2E (Login -> Proyectos -> Crear RFC -> Consultar RFC -> Auditoría)', () => {
  let authService: AuthService;
  let projectsService: ProjectsService;
  let rfcsService: RfcsService;
  let auditService: AuditService;

  beforeEach(() => {
    const db = new DatabaseService('mock');
    auditService = new AuditService(db);
    const authRepo = new AuthRepository(db);
    authService = new AuthService(authRepo, auditService);

    const projectsRepo = new ProjectsRepository(db);
    projectsService = new ProjectsService(projectsRepo);

    const rfcsRepo = new RfcsRepository(db);
    rfcsService = new RfcsService(rfcsRepo, projectsRepo, auditService);
  });

  it('debe ejecutar exitosamente el flujo de extremo a extremo sin datos ficticios', async () => {
    // PASO 1: Login autorizado como Solicitante (PU-01)
    const loginResult = await authService.login('jmedina@exodo.pe', 'TraceFlow2026!', 'PU-01');
    expect(loginResult.sessionToken).toBeDefined();
    expect(loginResult.user.code).toBe('USR-001');
    expect(loginResult.user.activeRoleId).toBe('PU-01');

    // Validar token de sesión en servidor
    const authenticatedUser = await authService.validateSessionToken(loginResult.sessionToken);
    expect(authenticatedUser).not.toBeNull();
    if (!authenticatedUser) throw new Error('Usuario no autenticado');

    // PASO 2: Consulta de proyectos asignados
    const projects = await projectsService.getProjectsForUser(authenticatedUser);
    expect(projects.length).toBeGreaterThan(0);
    const targetProject = projects.find((p) => p.code === 'PRJ-001');
    expect(targetProject).toBeDefined();

    // PASO 3: Creación formal de RFC para el proyecto PRJ-001 sobre el ECS SRC-AUTH-JWT.ts
    const createdRfc = await rfcsService.createRfc(
      {
        projectId: 'PRJ-001',
        targetEcsId: 'SRC-AUTH-JWT.ts',
        title: 'Endurecimiento Criptográfico de Sesiones con Cookies HttpOnly y SameSite Strict',
        description: 'Implementación del estándar ADR-006 para mitigar vectores XSS y CSRF en el monolito modular.',
        justification: 'Cumplimiento normativo ISO/IEC/IEEE 12207 y resolución de auditoría AUD-GCSW-001.',
        priority: 'CRITICA',
      },
      authenticatedUser
    );

    expect(createdRfc.code).toMatch(/^RFC-2026-\d{4}$/);
    expect(createdRfc.status).toBe('REGISTRADA');
    expect(createdRfc.project_id).toBe('PRJ-001');

    // PASO 4: Lectura y verificación de persistencia
    const retrievedRfc = await rfcsService.getRfcById(createdRfc.code, authenticatedUser);
    expect(retrievedRfc).toBeDefined();
    expect(retrievedRfc.id).toBe(createdRfc.id);
    expect(retrievedRfc.title).toBe(createdRfc.title);
    expect(retrievedRfc.priority).toBe('CRITICA');

    // PASO 5: Verificación de la pista inmutable de auditoría con hash SHA-256
    const auditChain = auditService.getAuditChain();
    expect(auditChain.length).toBeGreaterThan(0);

    const rfcCreationEvent = auditChain.find((evt) => evt.operation === 'REGISTRAR_RFC_CU04');
    expect(rfcCreationEvent).toBeDefined();
    expect(rfcCreationEvent?.actorRole).toBe('PU-01');
    expect(rfcCreationEvent?.entityId).toBe(createdRfc.id);
    expect(rfcCreationEvent?.currLogHash).toBeDefined();

    // Verificación de integridad matemática de la cadena SHA-256
    expect(auditService.verifyChainIntegrity()).toBe(true);

    // PASO 6: Cierre formal de sesión (Logout)
    await authService.logout(loginResult.sessionToken);
    const postLogoutUser = await authService.validateSessionToken(loginResult.sessionToken);
    expect(postLogoutUser).toBeNull();
  });
});
