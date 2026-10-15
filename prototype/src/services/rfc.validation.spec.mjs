/**
 * TraceFlow SCM - Pruebas Automatizadas para Fase V.3
 * Valida: CU-05 (Revisión Inicial y Admisión del Gestor)
 *         CU-04.1 (Subsanación y Desistimiento del Solicitante)
 *         Máquina de estados DG-11, Reglas SoD y Auditoría Forense SHA-256.
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
import { authService } from './auth.service.ts';
import { auditService } from './audit.service.ts';
import { INITIAL_DEMO_USERS } from '../data/initialUsers.ts';

console.log('🧪 Iniciando pruebas de Fase V.3: Validación (CU-05) y Subsanación (CU-04.1)...\n');

// Usuarios de prueba con roles canónicos
const userJoan = INITIAL_DEMO_USERS.find((u) => u.id === 'USR-001'); // Joan Medina
const userRenzo = INITIAL_DEMO_USERS.find((u) => u.id === 'USR-002'); // Renzo Antayhua

const gestorUser = {
  ...userJoan,
  roleId: 'PU-02',
  role: 'GESTOR_CAMBIOS',
  roleLabel: 'Analista de Requerimientos / Gestor (PU-02)',
};

const solicitanteUser = {
  ...userJoan,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante (PU-01)',
};

const arquitectoUser = {
  ...userRenzo,
  roleId: 'PU-03',
  role: 'ESPECIALISTA_TECNICO',
  roleLabel: 'Especialista Técnico / Arquitecto (PU-03)',
};

// --------------------------------------------------------------------------
// TEST 1: Matriz de Segregación de Funciones (SoD) para CU-05 y CU-04.1
// --------------------------------------------------------------------------
console.log('Test 1: Verificación de la Matriz SoD para CU-05 y CU-04.1');
// CU-05: Solo PU-02
assert.strictEqual(
  authService.isActionAuthorized('PU-02', 'VALIDAR_CLASIFICAR_RFC'),
  true,
  'PU-02 debe estar autorizado para VALIDAR_CLASIFICAR_RFC (CU-05)'
);
const rolesNoGestor = ['PU-01', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'];
for (const r of rolesNoGestor) {
  assert.strictEqual(
    authService.isActionAuthorized(r, 'VALIDAR_CLASIFICAR_RFC'),
    false,
    `Rol ${r} NO debe estar autorizado para VALIDAR_CLASIFICAR_RFC`
  );
}

// CU-04.1: Solo PU-01
assert.strictEqual(
  authService.isActionAuthorized('PU-01', 'SUBSANAR_RFC'),
  true,
  'PU-01 debe estar autorizado para SUBSANAR_RFC (CU-04.1)'
);
const rolesNoSolicitante = ['PU-02', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'];
for (const r of rolesNoSolicitante) {
  assert.strictEqual(
    authService.isActionAuthorized(r, 'SUBSANAR_RFC'),
    false,
    `Rol ${r} NO debe estar autorizado para SUBSANAR_RFC`
  );
}
console.log('✅ Matriz SoD validada: CU-05 exclusivo PU-02 y CU-04.1 exclusivo PU-01.\n');

// --------------------------------------------------------------------------
// TEST 2: Transiciones canónicas en DG-11
// --------------------------------------------------------------------------
console.log('Test 2: Transiciones canónicas en DG-11 para Admisión y Subsanación');
assert.strictEqual(
  rfcService.isTransitionAllowed('REGISTRADA', 'CLASIFICADA'),
  true,
  'DG-11: REGISTRADA -> CLASIFICADA debe ser válida (Admisión CU-05)'
);
assert.strictEqual(
  rfcService.isTransitionAllowed('REGISTRADA', 'EN_SUBSANACION'),
  true,
  'DG-11: REGISTRADA -> EN_SUBSANACION debe ser válida (Observación CU-05)'
);
assert.strictEqual(
  rfcService.isTransitionAllowed('REGISTRADA', 'DESESTIMADA'),
  true,
  'DG-11: REGISTRADA -> DESESTIMADA debe ser válida (Desestimación CU-05)'
);
assert.strictEqual(
  rfcService.isTransitionAllowed('EN_SUBSANACION', 'REGISTRADA'),
  true,
  'DG-11: EN_SUBSANACION -> REGISTRADA debe ser válida (Reingreso CU-04.1)'
);
assert.strictEqual(
  rfcService.isTransitionAllowed('EN_SUBSANACION', 'DESESTIMADA'),
  true,
  'DG-11: EN_SUBSANACION -> DESESTIMADA debe ser válida (Desistimiento CU-04.1 A1)'
);
assert.strictEqual(
  rfcService.isTransitionAllowed('EN_SUBSANACION', 'CLASIFICADA'),
  false,
  'DG-11: EN_SUBSANACION -> CLASIFICADA NO está permitida directamente sin re-evaluación del Gestor'
);
console.log('✅ Máquina de estados DG-11 confirmada sin saltos inválidos.\n');

// --------------------------------------------------------------------------
// TEST 3: CU-05 A: Admitir Solicitud (REGISTRADA -> CLASIFICADA)
// --------------------------------------------------------------------------
console.log('Test 3: CU-05 A - Admisión formal por el Gestor');
// Crear una RFC nueva para admitir
const rfcParaAdmitir = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Migración a pasarela de cobros bancarios TLS 1.3',
    description: 'Actualización mandatoria de protocolos criptográficos en pasarela de pagos institucionales.',
    justification: 'Requisito regulatorio de la SBS y prevención de ataques Man-in-the-Middle.',
    priority: 'ALTA',
    category: 'ADAPTATIVO',
    affectedEcsId: 'ECS-001',
  },
  solicitanteUser
);

// Intento por no-PU-02 debe fallar por SoD
assert.throws(
  () => rfcService.admit(rfcParaAdmitir.id, 'Notas de prueba', solicitanteUser),
  /Operación denegada \(SoD\)/
);

// Admisión formal por Gestor PU-02
const rfcAdmitida = rfcService.admit(
  rfcParaAdmitir.id,
  'Completitud formal verificada satisfactoriamente bajo RN-01. Pasa a evaluación técnica.',
  gestorUser
);

assert.strictEqual(rfcAdmitida.status, 'CLASIFICADA');
assert.ok(rfcAdmitida.admittedAt);
assert.strictEqual(rfcAdmitida.admittedBy, gestorUser.fullName);
assert.ok(rfcAdmitida.admissionNotes.includes('Completitud formal'));

// Evento de auditoría emitido
const auditEventsAdmit = auditService.getAll().filter((e) => e.entityId === rfcAdmitida.id);
assert.ok(auditEventsAdmit.some((e) => e.action === 'RFC_ADMITIDA'));
console.log(`✅ RFC ${rfcAdmitida.code} admitida formalmente en estado CLASIFICADA con auditoría registrada.\n`);

// --------------------------------------------------------------------------
// TEST 4: CU-05 B: Observar Solicitud (REGISTRADA -> EN_SUBSANACION)
// --------------------------------------------------------------------------
console.log('Test 4: CU-05 B - Formulación de pliego de observaciones por el Gestor');
const rfcParaObservar = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Ampliación de campos en ficha de matrícula 2026',
    description: 'Inclusión de nuevo formulario con datos socioeconómicos de alumnos ingresantes.',
    justification: 'Cumplimiento de la nueva directiva de acreditación universitaria UPT.',
    priority: 'MEDIA',
    category: 'EVOLUTIVO',
    affectedEcsId: 'ECS-002',
  },
  solicitanteUser
);

// Observaciones muy cortas deben ser rechazadas
assert.throws(
  () => rfcService.observe(rfcParaObservar.id, 'Falta', gestorUser),
  /debe contener al menos 10 caracteres/
);

// Observación formal válida
const obsTexto = 'Se requiere adjuntar la directiva oficial de acreditación y detallar el impacto en la base de datos.';
const rfcObservada = rfcService.observe(rfcParaObservar.id, obsTexto, gestorUser);

assert.strictEqual(rfcObservada.status, 'EN_SUBSANACION');
assert.strictEqual(rfcObservada.subsanacionNotes, obsTexto);
assert.strictEqual(rfcObservada.observedBy, gestorUser.fullName);
assert.ok(rfcObservada.observedAt);

const auditEventsObs = auditService.getAll().filter((e) => e.entityId === rfcObservada.id);
assert.ok(auditEventsObs.some((e) => e.action === 'RFC_OBSERVADA'));
console.log(`✅ RFC ${rfcObservada.code} transicionó a EN_SUBSANACION con pliego de observaciones.\n`);

// --------------------------------------------------------------------------
// TEST 5: CU-04.1: Subsanación por el Solicitante (EN_SUBSANACION -> REGISTRADA)
// --------------------------------------------------------------------------
console.log('Test 5: CU-04.1 - Subsanación de observaciones por el Solicitante');

// Intento por no-PU-01 debe fallar por SoD
assert.throws(
  () =>
    rfcService.subsanar(
      rfcObservada.id,
      {
        title: rfcObservada.title,
        description: rfcObservada.description,
        justification: rfcObservada.justification,
        priority: rfcObservada.priority,
        category: rfcObservada.category,
        affectedEcsId: rfcObservada.affectedEcsId,
      },
      arquitectoUser
    ),
  /Operación denegada \(SoD\)/
);

// Subsanación formal por el Solicitante
const rfcSubsanada = rfcService.subsanar(
  rfcObservada.id,
  {
    title: 'Ampliación de campos en ficha de matrícula 2026 - Con Directiva UPT',
    description: 'Inclusión de nuevo formulario con datos socioeconómicos de alumnos ingresantes según directiva DIR-UPT-2026-04.',
    justification: 'Cumplimiento obligatorio de la directiva DIR-UPT-2026-04 para licenciamiento institucional.',
    proposedSolution: 'Modificar la tabla socioeconómica y el endpoint REST de matrícula.',
    priority: 'ALTA',
    category: 'EVOLUTIVO',
    affectedEcsId: 'ECS-002',
    attachments: ['directiva_acreditacion_upt_2026.pdf'],
    subsanacionResponseNotes: 'Se adjuntó la directiva DIR-UPT-2026-04 y se aclaró la solución técnica en BD.',
  },
  solicitanteUser
);

// DEBE retornar a REGISTRADA conforme a DG-11
assert.strictEqual(
  rfcSubsanada.status,
  'REGISTRADA',
  'CU-04.1: La RFC subsanada debe retornar a REGISTRADA para re-evaluación del Gestor'
);
assert.ok(rfcSubsanada.subsanatedAt);
assert.strictEqual(
  rfcSubsanada.subsanacionResponseNotes,
  'Se adjuntó la directiva DIR-UPT-2026-04 y se aclaró la solución técnica en BD.'
);
assert.deepStrictEqual(rfcSubsanada.attachments, ['directiva_acreditacion_upt_2026.pdf']);

const auditEventsSub = auditService.getAll().filter((e) => e.entityId === rfcSubsanada.id);
assert.ok(auditEventsSub.some((e) => e.action === 'RFC_SUBSANADA'));
console.log(`✅ RFC ${rfcSubsanada.code} subsanada exitosamente: retornó a REGISTRADA con auditoría RFC_SUBSANADA.\n`);

// --------------------------------------------------------------------------
// TEST 6: CU-05 C: Desestimar Solicitud en Revisión Inicial (REGISTRADA -> DESESTIMADA)
// --------------------------------------------------------------------------
console.log('Test 6: CU-05 C - Desestimación formal por el Gestor (RN-07)');
const rfcParaDesestimar = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Instalación de motor de videojuegos en servidor de pagos',
    description: 'Solicitud para desplegar un entorno lúdico en la infraestructura crítica bancaria.',
    justification: 'Propuesta informal sin sustento de negocio ni justificación operativa.',
    priority: 'BAJA',
    category: 'PERFECTIVO',
    affectedEcsId: 'ECS-001',
  },
  solicitanteUser
);

const motivoDesest = 'Solicitud improcedente: no guarda relación con los objetivos del proyecto y atenta contra la política de seguridad RN-07.';
const rfcDesestimada = rfcService.dismiss(rfcParaDesestimar.id, motivoDesest, gestorUser);

assert.strictEqual(rfcDesestimada.status, 'DESESTIMADA');
assert.strictEqual(rfcDesestimada.dismissalReason, motivoDesest);
assert.strictEqual(rfcDesestimada.dismissedBy, gestorUser.fullName);
assert.ok(rfcDesestimada.dismissedAt);
assert.ok(rfcDesestimada.closedAt);

const auditEventsDes = auditService.getAll().filter((e) => e.entityId === rfcDesestimada.id);
assert.ok(auditEventsDes.some((e) => e.action === 'RFC_DESESTIMADA'));
console.log(`✅ RFC ${rfcDesestimada.code} desestimada formalmente en estado terminal DESESTIMADA.\n`);

// --------------------------------------------------------------------------
// TEST 7: CU-04.1 A1: Desistimiento voluntario del Solicitante en EN_SUBSANACION
// --------------------------------------------------------------------------
console.log('Test 7: CU-04.1 A1 - Desistimiento voluntario del Solicitante');
const rfcParaDesistir = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Reporte auxiliar de logs temporales de depuración',
    description: 'Creación de endpoint transitorio para descargar trazas de depuración en formato crudo.',
    justification: 'Monitoreo preventivo del equipo de desarrollo.',
    priority: 'BAJA',
    category: 'PERFECTIVO',
    affectedEcsId: 'ECS-001',
  },
  solicitanteUser
);

// Gestor observa
rfcService.observe(rfcParaDesistir.id, 'Las trazas de depuración deben canalizarse a través de Grafana/Prometheus.', gestorUser);

// Solicitante desiste voluntariamente
const rfcDesistida = rfcService.dismiss(
  rfcParaDesistir.id,
  'Desistimiento voluntario: se adoptará la solución sugerida mediante Grafana sin requerir cambio de software.',
  solicitanteUser
);

assert.strictEqual(rfcDesistida.status, 'DESESTIMADA');
assert.strictEqual(rfcDesistida.dismissedBy, solicitanteUser.fullName);
assert.ok(rfcDesistida.closedAt);
console.log(`✅ Desistimiento voluntario comprobado: RFC ${rfcDesistida.code} cerrada en DESESTIMADA.\n`);

console.log('🎉 TODAS LAS PRUEBAS DE LA FASE V.3 PASARON SATISFACTORIAMENTE.');
