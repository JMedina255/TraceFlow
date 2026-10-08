// Test de verificación de CU-04 (Registrar Solicitud de Cambio RFC)
import assert from 'node:assert';

// Mock in-memory localStorage for Node test runner
const memoryStorage = new Map();
globalThis.localStorage = {
  getItem: (k) => memoryStorage.get(k) || null,
  setItem: (k, v) => memoryStorage.set(k, String(v)),
  removeItem: (k) => memoryStorage.delete(k),
  clear: () => memoryStorage.clear(),
  get length() {
    return memoryStorage.size;
  },
  key: (i) => Array.from(memoryStorage.keys())[i] || null,
};

// Import services and initial data
import { authService } from './auth.service.ts';
import { rfcService } from './rfc.service.ts';
import { auditService } from './audit.service.ts';
import { INITIAL_DEMO_USERS } from '../data/initialUsers.ts';

console.log('🧪 Iniciando pruebas de CU-04: Registrar Solicitud de Cambio (RFC)...\n');

// 1. Prueba de Segregación de Funciones (SoD) en authService
console.log('Test 1: Matriz SoD para REGISTRAR_RFC');
assert.strictEqual(authService.isActionAuthorized('PU-01', 'REGISTRAR_RFC'), true, 'PU-01 debe estar autorizado');
assert.strictEqual(authService.isActionAuthorized('PU-02', 'REGISTRAR_RFC'), false, 'PU-02 no debe estar autorizado');
assert.strictEqual(authService.isActionAuthorized('PU-03', 'REGISTRAR_RFC'), false, 'PU-03 no debe estar autorizado');
assert.strictEqual(authService.isActionAuthorized('PU-04', 'REGISTRAR_RFC'), false, 'PU-04 no debe estar autorizado');
assert.strictEqual(authService.isActionAuthorized('PU-05', 'REGISTRAR_RFC'), false, 'PU-05 no debe estar autorizado');
assert.strictEqual(authService.isActionAuthorized('PU-06', 'REGISTRAR_RFC'), false, 'PU-06 no debe estar autorizado');
assert.strictEqual(authService.isActionAuthorized('PU-07', 'REGISTRAR_RFC'), false, 'PU-07 no debe estar autorizado');
console.log('✅ Matriz SoD validada correctamente: Solo PU-01 (Solicitante) está autorizado.\n');

// Usuarios de prueba
const solicitanteUser = {
  ...INITIAL_DEMO_USERS[0],
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
};

const gestorUser = {
  ...INITIAL_DEMO_USERS[0],
  roleId: 'PU-02',
  role: 'GESTOR',
  roleLabel: 'Analista de Requerimientos / Gestor',
};

// 2. Prueba de Seguridad en la Capa de Servicio
console.log('Test 2: rfcService.create rechaza operaciones de usuarios no autorizados');
assert.throws(
  () => {
    rfcService.create(
      {
        projectId: 'PRJ-001',
        title: 'Intento no autorizado de creación',
        description: 'Descripción detallada de prueba con más de 15 caracteres',
        justification: 'Justificación operativa suficiente para la prueba de excepción',
        priority: 'MEDIA',
        category: 'CORRECTIVO',
        affectedEcsId: 'ECS-001',
      },
      gestorUser
    );
  },
  /Operación denegada \(SoD\)/,
  'Debe lanzar error SoD al invocar con rol PU-02'
);
console.log('✅ Bloqueo SoD a nivel de servicio validado exitosamente.\n');

// 3. Prueba de Validaciones de Datos del SRS (CU-04 / Excepciones E1 y E2)
console.log('Test 3: Validaciones de completitud y negocio según SRS');

// E1: Justificación vacía o corta
assert.throws(
  () => {
    rfcService.create(
      {
        projectId: 'PRJ-001',
        title: 'Título válido de cambio para la prueba',
        description: 'Descripción con longitud adecuada de más de 15 caracteres',
        justification: 'Corta', // < 15 chars
        priority: 'MEDIA',
        category: 'CORRECTIVO',
        affectedEcsId: 'ECS-001',
      },
      solicitanteUser
    );
  },
  /Excepción E1 del SRS/,
  'Debe rechazar justificaciones vacías o insuficientes'
);

// E2: ECS no perteneciente al proyecto
assert.throws(
  () => {
    rfcService.create(
      {
        projectId: 'PRJ-001',
        title: 'Título válido de cambio para la prueba',
        description: 'Descripción con longitud adecuada de más de 15 caracteres',
        justification: 'Justificación operativa completa con longitud suficiente',
        priority: 'MEDIA',
        category: 'CORRECTIVO',
        affectedEcsId: 'ECS-005', // ECS-005 pertenece a PRJ-002
      },
      solicitanteUser
    );
  },
  /Excepción E2 del SRS/,
  'Debe rechazar ECS que no pertenece al proyecto activo'
);
console.log('✅ Validaciones del SRS (E1 y E2) verificadas exitosamente.\n');

// 4. Prueba de Registro Exitoso por Solicitante (CU-04)
console.log('Test 4: Registro exitoso formal de RFC');
const auditBeforeCount = auditService.getAll().length;

const created = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Actualización obligatoria de cifrado TLS 1.3 en Gateway Bancario',
    description: 'Se requiere actualizar la versión de TLS para dar cumplimiento a la normativa PCI-DSS 4.0.',
    justification: 'Evitar sanciones regulatorias y garantizar la continuidad del switch interbancario.',
    proposedSolution: 'Modificar configuración en clase SSLContext del controlador transaccional.',
    priority: 'ALTA',
    category: 'ADAPTATIVO',
    affectedEcsId: 'ECS-001',
    attachments: ['especificacion_pci_dss_v4.pdf'],
  },
  solicitanteUser
);

assert.ok(created.id, 'Debe poseer ID');
assert.strictEqual(created.code, created.id, 'Code e ID deben coincidir');
assert.match(created.code, /^RFC-2026-\d{4}$/, 'Formato de código debe ser RFC-2026-NNNN');
assert.strictEqual(created.status, 'REGISTRADA', 'Estado inicial oficial debe ser REGISTRADA (TB-07 / DG-11)');
assert.strictEqual(created.projectId, 'PRJ-001', 'Proyecto debe corresponder');
assert.strictEqual(created.affectedEcsId, 'ECS-001', 'ECS debe corresponder');
assert.strictEqual(created.requesterId, solicitanteUser.id, 'Solicitante ID debe corresponder');
assert.strictEqual(created.priority, 'ALTA');
assert.strictEqual(created.category, 'ADAPTATIVO');
console.log(`✅ RFC creada con éxito: ${created.code} en estado ${created.status}.\n`);

// 5. Prueba de Persistencia y Consulta
console.log('Test 5: Persistencia en almacenamiento');
const fetched = rfcService.getById(created.id);
assert.ok(fetched, 'La RFC debe ser recuperable por ID');
assert.strictEqual(fetched.title, created.title);

const projectRfcs = rfcService.getAll('PRJ-001');
const existsInProject = projectRfcs.some((r) => r.id === created.id);
assert.strictEqual(existsInProject, true, 'La RFC debe aparecer en la lista del proyecto');
console.log('✅ Persistencia y consulta en colección verificadas exitosamente.\n');

// 6. Prueba de Evento de Auditoría
console.log('Test 6: Registro de Auditoría Append-Only con Hash SHA-256');
const auditEvents = auditService.getAll();
assert.strictEqual(auditEvents.length, auditBeforeCount + 1, 'Debe haberse agregado un evento de auditoría');
const latestAudit = auditEvents[0];
assert.strictEqual(latestAudit.action, 'RFC_CREADA', 'Acción de auditoría debe ser RFC_CREADA');
assert.strictEqual(latestAudit.entityId, created.id, 'Entidad de auditoría debe ser el ID de la RFC');
assert.strictEqual(latestAudit.userId, solicitanteUser.id);
assert.ok(latestAudit.sha256Hash, 'Debe contener hash criptográfico SHA-256');
assert.strictEqual(latestAudit.sha256Hash.length, 64, 'Longitud de hash SHA-256 debe ser 64 hex');
console.log(`✅ Evento de auditoría emitido: ${latestAudit.id} (Hash: ${latestAudit.sha256Hash.slice(0, 16)}...).\n`);

console.log('🎉 TODAS LAS PRUEBAS DE CU-04 PASARON SATISFACTORIAMENTE.');
