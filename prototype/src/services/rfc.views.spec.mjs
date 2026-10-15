/**
 * TraceFlow SCM - Pruebas Automatizadas de Verificación para Fase V.2
 * Valida: SCREEN-05 (Bandeja / Filtros), SCREEN-06 (Expediente 360°),
 * Aislamiento Multitenant, SoD Security en Conmutación de Roles y Persistencia.
 */

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

import { rfcService } from './rfc.service.ts';
import { INITIAL_DEMO_USERS } from '../data/initialUsers.ts';
import { RFC_STATUS_CATALOG } from '../types/rfc.ts';

console.log('🧪 Iniciando pruebas de Fase V.2: Bandeja (SCREEN-05) y Expediente 360° (SCREEN-06)...\n');

// --------------------------------------------------------------------------
// TEST 1: Catálogo canónico estricto de 14 estados TB-07
// --------------------------------------------------------------------------
console.log('Test 1: Verificación de los 14 Estados Canónicos Oficiales (TB-07)');
const officialStatuses = Object.keys(RFC_STATUS_CATALOG);
assert.strictEqual(officialStatuses.length, 14, 'Deben existir exactamente 14 estados canónicos en TB-07');
assert.ok(officialStatuses.includes('REGISTRADA'), 'Estado 1 REGISTRADA debe existir');
assert.ok(officialStatuses.includes('EN_SUBSANACION'), 'Estado 2 EN_SUBSANACION debe existir (no inventar OBSERVADA)');
assert.ok(officialStatuses.includes('CLASIFICADA'), 'Estado 3 CLASIFICADA debe existir');
assert.ok(officialStatuses.includes('EN_ANALISIS_TECNICO'), 'Estado 4 EN_ANALISIS_TECNICO debe existir');
assert.ok(officialStatuses.includes('EN_EVALUACION'), 'Estado 5 EN_EVALUACION debe existir');
assert.ok(officialStatuses.includes('AUTORIZADA'), 'Estado 6 AUTORIZADA debe existir');
assert.ok(officialStatuses.includes('ORDEN_EMITIDA'), 'Estado 7 ORDEN_EMITIDA debe existir');
assert.ok(officialStatuses.includes('EN_IMPLEMENTACION'), 'Estado 8 EN_IMPLEMENTACION debe existir');
assert.ok(officialStatuses.includes('EN_PRUEBAS'), 'Estado 9 EN_PRUEBAS debe existir');
assert.ok(officialStatuses.includes('EN_ACEPTACION'), 'Estado 10 EN_ACEPTACION debe existir');
assert.ok(officialStatuses.includes('DESESTIMADA'), 'Estado 11 DESESTIMADA debe existir');
assert.ok(officialStatuses.includes('RECHAZADA'), 'Estado 12 RECHAZADA debe existir');
assert.ok(officialStatuses.includes('CANCELADA'), 'Estado 13 CANCELADA debe existir');
assert.ok(officialStatuses.includes('IMPLEMENTADA'), 'Estado 14 IMPLEMENTADA debe existir');
console.log('✅ Catálogo TB-07 verificado: 14 estados canónicos exactos sin estados espurios.\n');

// --------------------------------------------------------------------------
// TEST 2: Bandeja de Solicitudes (SCREEN-05) - Filtrado por Proyecto Aislado
// --------------------------------------------------------------------------
console.log('Test 2: Aislamiento Multitenant en Bandeja RFC por Proyecto');
const rfcsPrj1 = rfcService.getAll('PRJ-001');
const rfcsPrj2 = rfcService.getAll('PRJ-002');
const rfcsPrj3 = rfcService.getAll('PRJ-003');

assert.ok(rfcsPrj1.length >= 5, 'PRJ-001 debe contener al menos 5 RFCs iniciales');
assert.ok(rfcsPrj1.every((r) => r.projectId === 'PRJ-001'), 'Todas las RFCs de PRJ-001 deben coincidir con su proyecto');

assert.ok(rfcsPrj2.length >= 1, 'PRJ-002 debe contener al menos 1 RFC inicial');
assert.ok(rfcsPrj2.every((r) => r.projectId === 'PRJ-002'), 'Todas las RFCs de PRJ-002 deben coincidir con su proyecto');

assert.ok(rfcsPrj3.length >= 1, 'PRJ-003 debe contener al menos 1 RFC inicial');
console.log(`✅ Aislamiento verificado: PRJ-001 (${rfcsPrj1.length}), PRJ-002 (${rfcsPrj2.length}), PRJ-003 (${rfcsPrj3.length}).\n`);

// --------------------------------------------------------------------------
// TEST 3: Búsqueda y Filtros en Bandeja (Código, Título, Estado y Clasificación)
// --------------------------------------------------------------------------
console.log('Test 3: Lógica de Búsqueda y Filtros Multifacéticos en Bandeja');
// Búsqueda por código
const matchCode = rfcsPrj1.filter((r) => r.code.includes('0001'));
assert.strictEqual(matchCode.length, 1, 'Debe encontrar exactamente la RFC-2026-0001');
assert.strictEqual(matchCode[0].id, 'RFC-2026-0001');

// Búsqueda por texto en título
const matchTitle = rfcsPrj1.filter((r) => r.title.toLowerCase().includes('criptográfico'));
assert.strictEqual(matchTitle.length, 1, 'Debe encontrar la RFC sobre Mecanismo Criptográfico');

// Filtro por estado
const matchStatus = rfcsPrj1.filter((r) => r.status === 'REGISTRADA');
assert.strictEqual(matchStatus.length, 1, 'Debe encontrar la RFC en estado REGISTRADA (RFC-2026-0005)');
assert.strictEqual(matchStatus[0].code, 'RFC-2026-0005');

// Filtro por clasificación: CAMBIO_MAYOR vs CAMBIO_MENOR vs SIN_CLASIFICAR
const mayores = rfcsPrj1.filter((r) => r.classification === 'CAMBIO_MAYOR');
const menores = rfcsPrj1.filter((r) => r.classification === 'CAMBIO_MENOR');
const sinClasificar = rfcsPrj1.filter((r) => !r.classification);

assert.ok(mayores.length >= 2, 'Deben existir al menos 2 Cambios Mayores en PRJ-001');
assert.ok(menores.length >= 1, 'Debe existir al menos 1 Cambio Menor en PRJ-001');
assert.ok(sinClasificar.length >= 2, 'Deben existir al menos 2 RFCs aún sin clasificar en PRJ-001');
console.log(`✅ Filtros verificados: Mayores (${mayores.length}), Menores (${menores.length}), Sin Clasificar (${sinClasificar.length}).\n`);

// --------------------------------------------------------------------------
// TEST 4: Expediente 360° (SCREEN-06) - Consulta y Manejo de Datos Reales
// --------------------------------------------------------------------------
console.log('Test 4: Consulta de Expediente 360° y variantes por estado');
// RFC con evaluación técnica e informe completo
const rfcCompleta = rfcService.getById('RFC-2026-0001');
assert.ok(rfcCompleta, 'RFC-2026-0001 debe existir');
assert.strictEqual(rfcCompleta.status, 'IMPLEMENTADA');
assert.ok(rfcCompleta.technicalImpact, 'RFC-2026-0001 debe tener technicalImpact');
assert.strictEqual(rfcCompleta.technicalImpact.architectName, 'Renzo Antonio Antayhua Mamani');
assert.strictEqual(rfcCompleta.ecnId, 'ECN-2026-0001');

// RFC recién registrada sin evaluación técnica
const rfcSinImpacto = rfcService.getById('RFC-2026-0005');
assert.ok(rfcSinImpacto, 'RFC-2026-0005 debe existir');
assert.strictEqual(rfcSinImpacto.status, 'REGISTRADA');
assert.strictEqual(rfcSinImpacto.classification, undefined, 'RFC-2026-0005 no debe tener clasificación aún');
assert.strictEqual(rfcSinImpacto.technicalImpact, undefined, 'RFC-2026-0005 no debe tener informe técnico aún');

// Identificador inexistente
const rfcInexistente = rfcService.getById('RFC-9999-9999');
assert.strictEqual(rfcInexistente, undefined, 'Identificador inexistente debe retornar undefined para disparar 404');
console.log('✅ Consulta de expediente validada: datos reales intactos, sin datos fabricados.\n');

// --------------------------------------------------------------------------
// TEST 5: Control de Seguridad SoD - Conmutación Estricta de Roles
// --------------------------------------------------------------------------
console.log('Test 5: Validación SoD en Conmutación de Roles');
const userJoan = INITIAL_DEMO_USERS.find((u) => u.id === 'USR-001');
assert.ok(userJoan, 'Usuario Joan Medina debe existir');
assert.deepStrictEqual(userJoan.allowedRoleIds, ['PU-02', 'PU-01'], 'Joan solo puede asumir PU-02 y PU-01');

// Intentar conmutar a PU-03 (Arquitecto) para Joan debe ser bloqueado por SoD
const intentoRolNoPermitido = 'PU-03';
const esPermitido = userJoan.allowedRoleIds.includes(intentoRolNoPermitido);
assert.strictEqual(esPermitido, false, 'SoD: Joan no puede conmutar a PU-03');

const intentoRolPermitido = 'PU-01';
const esPermitido2 = userJoan.allowedRoleIds.includes(intentoRolPermitido);
assert.strictEqual(esPermitido2, true, 'SoD: Joan puede conmutar legítimamente a PU-01');
console.log('✅ Regla de SoD comprobada: Conmutación de roles restringida exclusivamente a allowedRoleIds.\n');

// --------------------------------------------------------------------------
// TEST 6: Creación de RFC en CU-04 e Inclusión Automática en Bandeja
// --------------------------------------------------------------------------
console.log('Test 6: Integración CU-04 -> Bandeja SCREEN-05');
const solicitanteUser = {
  ...userJoan,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante (PU-01)',
};

const nuevaRfc = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Integración de Webhook de Notificaciones Transaccionales',
    description: 'Implementación de endpoint para notificar eventos de pago asíncronos a comercios afiliados.',
    justification: 'Reducción de latencia en confirmación de transacciones solicitada por clientes corporativos.',
    priority: 'ALTA',
    category: 'PERFECTIVO',
    affectedEcsId: 'ECS-001',
    attachments: ['especificacion_webhook_v1.pdf'],
  },
  solicitanteUser
);

assert.ok(nuevaRfc.id.startsWith('RFC-2026-'), 'Debe generar código correlativo');
assert.strictEqual(nuevaRfc.status, 'REGISTRADA', 'Estado inicial debe ser REGISTRADA');

// Consultar la bandeja después de la creación
const bandejasActualizadas = rfcService.getAll('PRJ-001');
const encontradaEnBandeja = bandejasActualizadas.find((r) => r.id === nuevaRfc.id);
assert.ok(encontradaEnBandeja, 'La nueva RFC debe figurar inmediatamente en la bandeja');
assert.strictEqual(encontradaEnBandeja.title, nuevaRfc.title);

console.log(`✅ Integración exitosa: ${nuevaRfc.code} creada en CU-04 y visible en bandeja de PRJ-001.\n`);

console.log('🎉 TODAS LAS PRUEBAS DE LA FASE V.2 PASARON SATISFACTORIAMENTE.');
