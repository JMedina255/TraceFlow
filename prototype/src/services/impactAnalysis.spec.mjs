// Test de verificación de Fase 04A: CU-06 Análisis de Impacto Técnico y Reglas de Integridad
import assert from 'node:assert';

// 1. Mock in-memory localStorage for Node test runner BEFORE loading stores
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

// 2. Dynamic imports to ensure localStorage mock is available at module evaluation time
const { authService } = await import('./auth.service.ts');
const { rfcService } = await import('./rfc.service.ts');
const { impactAnalysisService } = await import('./impactAnalysis.service.ts');
const { auditService } = await import('./audit.service.ts');

console.log('🧪 Iniciando pruebas de Fase 04A: CU-06 Análisis de Impacto Técnico e Integridad...\n');

const accounts = authService.getAccounts();
const joanAccount = accounts[0];    // USR-001: PU-02 (Gestor) / PU-01 (Solicitante), PRJ-001, PRJ-002, PRJ-003
const renzoAccount = accounts[1];   // USR-002: PU-03 (Arquitecto) / PU-06 (Dev), PRJ-001, PRJ-002, PRJ-003
const _augustoAccount = accounts[2]; // USR-003: PU-05 (Bibliotecario) / PU-07 (Calidad)
const renzoLoyola = accounts[3];    // USR-004: PU-04 (CCB), PRJ-001, PRJ-002

const solicitanteUser = {
  ...joanAccount,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  allowedRoleIds: joanAccount.assignedRoleIds,
};

const gestorUser = {
  ...joanAccount,
  roleId: 'PU-02',
  role: 'GESTOR',
  roleLabel: 'Analista de Requerimientos / Gestor',
  allowedRoleIds: joanAccount.assignedRoleIds,
};

const architectUser = {
  ...renzoAccount,
  roleId: 'PU-03',
  role: 'ARQUITECTO',
  roleLabel: 'Arquitecto / Especialista Técnico',
  allowedRoleIds: renzoAccount.assignedRoleIds,
};

// ============================================================================
// TEST 1: Rol Autorizado (PU-03) Emite Análisis de Impacto Técnico (CU-06)
// ============================================================================
console.log('Test 1: Emisión exitosa de análisis de impacto técnico por Arquitecto (PU-03)');

// Paso 1: Solicitante registra RFC
const rfc1 = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Migración de Algoritmo de Hashing a Argon2id',
    description: 'Actualización del esquema de firmas criptográficas para mayor resistencia ante colisiones.',
    justification: 'Cumplimiento de estándares de ciberseguridad bancaria internacional.',
    proposedSolution: 'Incorporar libsodium y actualizar módulo de persistencia de credenciales.',
    priority: 'ALTA',
    category: 'ADAPTATIVO',
    affectedEcsId: 'ECS-001',
    attachments: [],
  },
  solicitanteUser
);
assert.strictEqual(rfc1.status, 'REGISTRADA');

// Paso 2: Gestor admite la solicitud en CU-05
const admittedRfc = rfcService.admit(
  rfc1.id,
  'Expediente completo y debidamente justificado. Pasa a evaluación técnica por Arquitectura.',
  gestorUser
);
assert.strictEqual(admittedRfc.status, 'CLASIFICADA');

// Paso 3: Arquitecto emite el análisis técnico dictaminando Cambio Mayor
const { report, updatedRfc } = impactAnalysisService.registerAnalysis(
  {
    rfcId: admittedRfc.id,
    effortHours: 36,
    estimatedCost: 2400,
    scheduleImpactDays: 5,
    technicalSummary: 'Impacta el esquema de base de datos de usuarios y la pasarela de autenticación de tokens.',
    affectedEcsIds: ['ECS-001', 'ECS-002'],
    technicalRisk: 'MEDIO',
    identifiedRisks: [
      'Migración de tablas existentes con potencial bloqueo transaccional.',
      'Riesgo de regresión en clientes API que utilicen credenciales heredadas.',
    ],
    recommendation: 'PROCEDE_MAYOR',
    proposedClassification: 'CAMBIO_MAYOR',
    rollbackPlan: 'Reversión a la última versión en Biblioteca Maestra y rollback de scripts DDL.',
  },
  architectUser
);

assert.ok(report.id.startsWith('TIA-2026-'), 'ID de informe debe comenzar con prefijo TIA-2026-');
assert.strictEqual(report.architectId, 'USR-002');
assert.strictEqual(report.architectName, 'Renzo Antonio Antayhua Mamani');
assert.strictEqual(report.classification, 'CAMBIO_MAYOR');
assert.strictEqual(report.estimatedEffortHours, 36);
assert.strictEqual(report.estimatedCost, 2400);
assert.strictEqual(report.estimatedDurationDays, 5);
assert.strictEqual(report.status, 'COMPLETADO');
assert.strictEqual(updatedRfc.impactAnalysisId, report.id);
assert.strictEqual(updatedRfc.classification, 'CAMBIO_MAYOR');
assert.strictEqual(updatedRfc.status, 'EN_EVALUACION', 'Cambio Mayor debe transicionar a EN_EVALUACION para CCB');
console.log(`✅ Análisis de impacto registrado exitosamente: ${report.id} -> ${updatedRfc.code} (${updatedRfc.status}).\n`);

// ============================================================================
// TEST 2: Segregación SoD - Rechazo de Roles No Autorizados
// ============================================================================
console.log('Test 2: Bloqueo de roles no autorizados (PU-01, PU-02, PU-04, PU-05, PU-06, PU-07)');

// Crear otra RFC admitida para pruebas de bloqueo
const rfcTest2 = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Optimización de Índices en Conciliaciones',
    description: 'Creación de índices compuestos para reducir tiempos de consulta en liquidaciones.',
    justification: 'Degradación de rendimiento observada en cierres contables mensuales.',
    priority: 'MEDIA',
    category: 'PERFECTIVO',
    affectedEcsId: 'ECS-002',
  },
  solicitanteUser
);
rfcService.admit(rfcTest2.id, 'Admitida para evaluación técnica.', gestorUser);

const unauthorizedRoles = [
  { roleId: 'PU-01', roleLabel: 'Solicitante' },
  { roleId: 'PU-02', roleLabel: 'Gestor' },
  { roleId: 'PU-04', roleLabel: 'CCB' },
  { roleId: 'PU-05', roleLabel: 'Bibliotecario' },
  { roleId: 'PU-06', roleLabel: 'Desarrollador' },
  { roleId: 'PU-07', roleLabel: 'Calidad' },
];

for (const { roleId, roleLabel } of unauthorizedRoles) {
  const fakeUser = {
    ...renzoAccount,
    roleId,
    role: roleLabel.toUpperCase(),
    roleLabel,
  };

  assert.throws(
    () => {
      impactAnalysisService.registerAnalysis(
        {
          rfcId: rfcTest2.id,
          effortHours: 10,
          estimatedCost: 800,
          scheduleImpactDays: 2,
          technicalSummary: 'Intento de análisis con rol no autorizado por matriz SoD.',
          affectedEcsIds: ['ECS-002'],
          technicalRisk: 'BAJO',
          identifiedRisks: [],
          recommendation: 'PROCEDE_MENOR',
          proposedClassification: 'CAMBIO_MENOR',
        },
        fakeUser
      );
    },
    /Operación denegada \(SoD\)/,
    `El rol ${roleId} (${roleLabel}) debe ser rechazado por SoD`
  );
}
console.log('✅ Segregación SoD comprobada: los 6 roles no arquitectónicos fueron rechazados.\n');

// ============================================================================
// TEST 3: Antiautoevaluación SoD - Solicitante no puede evaluar su propia RFC
// ============================================================================
console.log('Test 3: Antiautoevaluación SoD - Arquitecto tiene prohibido evaluar su propia solicitud');

// Renzo Antayhua (USR-002) registra una RFC operando como Solicitante (PU-01)
const renzoAsSolicitante = {
  ...renzoAccount,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  allowedRoleIds: ['PU-01', 'PU-03', 'PU-06'],
};

const selfRfc = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Actualización del Motor de Reglas de Facturación',
    description: 'Ajuste en validaciones de montos mínimos según normativa tributaria vigente.',
    justification: 'Cumplimiento normativo regulatorio con vigencia obligatoria inmediata.',
    priority: 'ALTA',
    category: 'ADAPTATIVO',
    affectedEcsId: 'ECS-001',
  },
  renzoAsSolicitante
);
assert.strictEqual(selfRfc.requesterId, 'USR-002');

// Gestor admite la solicitud
rfcService.admit(selfRfc.id, 'Admitida para análisis.', gestorUser);

// Renzo Antayhua conmuta a su rol de Arquitecto (PU-03) e intenta evaluar su propia solicitud
assert.throws(
  () => {
    impactAnalysisService.registerAnalysis(
      {
        rfcId: selfRfc.id,
        effortHours: 20,
        estimatedCost: 1500,
        scheduleImpactDays: 3,
        technicalSummary: 'Intento de autoevaluación técnica de propia solicitud por el arquitecto.',
        affectedEcsIds: ['ECS-001'],
        technicalRisk: 'BAJO',
        identifiedRisks: [],
        recommendation: 'PROCEDE_MENOR',
        proposedClassification: 'CAMBIO_MENOR',
      },
      architectUser
    );
  },
  /Operación denegada \(SoD\): El usuario .* es el solicitante original/,
  'El sistema debe bloquear la autoevaluación técnica de la propia solicitud'
);
console.log('✅ Antiautoevaluación SoD validada: el arquitecto no puede dictaminar su propia RFC.\n');

// ============================================================================
// TEST 4: Precondición de Estado - Rechazo sobre RFC en REGISTRADA o EN_SUBSANACION
// ============================================================================
console.log('Test 4: Rechazo de análisis técnico sobre RFC en estado no admitido (REGISTRADA / EN_SUBSANACION)');

// Caso A: RFC en estado REGISTRADA (sin admisión formal por Gestor)
const unadmittedRfc = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Ampliación de Logs de Transacciones en Pasarela',
    description: 'Adicionar trazas de auditoría con información de latencia por cada salto de red.',
    justification: 'Facilitar diagnóstico de problemas de conectividad con adquirentes.',
    priority: 'BAJA',
    category: 'PERFECTIVO',
    affectedEcsId: 'ECS-001',
  },
  solicitanteUser
);
assert.strictEqual(unadmittedRfc.status, 'REGISTRADA');

assert.throws(
  () => {
    impactAnalysisService.registerAnalysis(
      {
        rfcId: unadmittedRfc.id,
        effortHours: 8,
        estimatedCost: 500,
        scheduleImpactDays: 1,
        technicalSummary: 'Intento de evaluación sobre solicitud sin admisión formal.',
        affectedEcsIds: ['ECS-001'],
        technicalRisk: 'BAJO',
        identifiedRisks: [],
        recommendation: 'PROCEDE_MENOR',
        proposedClassification: 'CAMBIO_MENOR',
      },
      architectUser
    );
  },
  /Transición inválida: .* Solo solicitudes formalmente admitidas/,
  'No se puede evaluar una RFC en estado REGISTRADA'
);

// Caso B: RFC observada en estado EN_SUBSANACION
const observedForTest4 = rfcService.observe(
  unadmittedRfc.id,
  'Observación formal: Se requiere mayor detalle en los componentes afectados.',
  gestorUser
);
assert.strictEqual(observedForTest4.status, 'EN_SUBSANACION');

assert.throws(
  () => {
    impactAnalysisService.registerAnalysis(
      {
        rfcId: observedForTest4.id,
        effortHours: 8,
        estimatedCost: 500,
        scheduleImpactDays: 1,
        technicalSummary: 'Intento de evaluación sobre solicitud observada.',
        affectedEcsIds: ['ECS-001'],
        technicalRisk: 'BAJO',
        identifiedRisks: [],
        recommendation: 'PROCEDE_MENOR',
        proposedClassification: 'CAMBIO_MENOR',
      },
      architectUser
    );
  },
  /Transición inválida: .* Solo solicitudes formalmente admitidas/,
  'No se puede evaluar una RFC en estado EN_SUBSANACION'
);
console.log('✅ Precondición de ciclo de vida validada: estados previos son rechazados.\n');

// ============================================================================
// TEST 5: Validaciones de Integridad y Rangos de Entrada
// ============================================================================
console.log('Test 5: Validaciones cuantitativas y cualitativas de negocio (horas, costo, resumen, ECS)');

// Validar esfuerzo <= 0
assert.throws(
  () => {
    impactAnalysisService.registerAnalysis(
      {
        rfcId: rfcTest2.id,
        effortHours: 0,
        estimatedCost: 1000,
        scheduleImpactDays: 2,
        technicalSummary: 'Fundamentación técnica válida con suficiente longitud descriptiva.',
        affectedEcsIds: ['ECS-002'],
        technicalRisk: 'BAJO',
        identifiedRisks: [],
        recommendation: 'PROCEDE_MENOR',
        proposedClassification: 'CAMBIO_MENOR',
      },
      architectUser
    );
  },
  /esfuerzo técnico estimado debe ser un valor numérico positivo mayor a 0/
);

// Validar resumen < 15 caracteres
assert.throws(
  () => {
    impactAnalysisService.registerAnalysis(
      {
        rfcId: rfcTest2.id,
        effortHours: 12,
        estimatedCost: 1000,
        scheduleImpactDays: 2,
        technicalSummary: 'Muy corto',
        affectedEcsIds: ['ECS-002'],
        technicalRisk: 'BAJO',
        identifiedRisks: [],
        recommendation: 'PROCEDE_MENOR',
        proposedClassification: 'CAMBIO_MENOR',
      },
      architectUser
    );
  },
  /resumen y fundamentación técnica del impacto debe contener al menos 15 caracteres/
);

// Validar sin ECS seleccionados
assert.throws(
  () => {
    impactAnalysisService.registerAnalysis(
      {
        rfcId: rfcTest2.id,
        effortHours: 12,
        estimatedCost: 1000,
        scheduleImpactDays: 2,
        technicalSummary: 'Fundamentación técnica válida con suficiente longitud descriptiva.',
        affectedEcsIds: [],
        technicalRisk: 'BAJO',
        identifiedRisks: [],
        recommendation: 'PROCEDE_MENOR',
        proposedClassification: 'CAMBIO_MENOR',
      },
      architectUser
    );
  },
  /Debe seleccionar al menos un Elemento de Configuración/
);

// Validar ECS de otro proyecto
assert.throws(
  () => {
    impactAnalysisService.registerAnalysis(
      {
        rfcId: rfcTest2.id, // Pertenece a PRJ-001
        effortHours: 12,
        estimatedCost: 1000,
        scheduleImpactDays: 2,
        technicalSummary: 'Fundamentación técnica válida con suficiente longitud descriptiva.',
        affectedEcsIds: ['ECS-005'], // ECS-005 pertenece a PRJ-002
        technicalRisk: 'BAJO',
        identifiedRisks: [],
        recommendation: 'PROCEDE_MENOR',
        proposedClassification: 'CAMBIO_MENOR',
      },
      architectUser
    );
  },
  /no pertenece al proyecto asignado a la solicitud/
);
console.log('✅ Validaciones cuantitativas y de consistencia de ECS verificadas exitosamente.\n');

// ============================================================================
// TEST 6: Aislamiento Multitenant de Proyectos
// ============================================================================
console.log('Test 6: Aislamiento por proyecto: arquitecto sin asignación al proyecto es bloqueado');

// Creamos un usuario arquitecto restringido que NO tiene asignado PRJ-003
const restrictedArchitect = {
  ...renzoAccount,
  id: 'USR-RESTRICTED-ARCH',
  roleId: 'PU-03',
  role: 'ARQUITECTO',
  roleLabel: 'Arquitecto',
  assignedProjectIds: ['PRJ-001'], // Solo PRJ-001, sin acceso a PRJ-002 ni PRJ-003
};

// Crear y admitir una RFC en PRJ-003
const rfcPrj3 = rfcService.create(
  {
    projectId: 'PRJ-003',
    title: 'Módulo de Facturación Electrónica SUNAT UBL 2.1',
    description: 'Integración de firma XML conforme a los estándares de facturación electrónica.',
    justification: 'Exigencia tributaria obligatoria.',
    priority: 'ALTA',
    category: 'ADAPTATIVO',
    affectedEcsId: 'ECS-007',
  },
  solicitanteUser
);
rfcService.admit(rfcPrj3.id, 'Admitida formalmente.', gestorUser);

assert.throws(
  () => {
    impactAnalysisService.registerAnalysis(
      {
        rfcId: rfcPrj3.id,
        effortHours: 40,
        estimatedCost: 3500,
        scheduleImpactDays: 7,
        technicalSummary: 'Evaluación técnica intentada por usuario sin acceso al proyecto.',
        affectedEcsIds: ['ECS-007'],
        technicalRisk: 'ALTO',
        identifiedRisks: [],
        recommendation: 'PROCEDE_MAYOR',
        proposedClassification: 'CAMBIO_MAYOR',
      },
      restrictedArchitect
    );
  },
  /Acceso denegado \(Proyecto\)/,
  'El servicio debe rechazar la evaluación si el usuario no tiene acceso al proyecto'
);
console.log('✅ Aislamiento multitenant validado: acceso a proyectos ajenos fue bloqueado.\n');

// ============================================================================
// TEST 7: Clasificación como Cambio Menor sin Auto-Aprobación (CU-30)
// ============================================================================
console.log('Test 7: Clasificación como Cambio Menor sin auto-aprobación (queda pendiente de CU-30)');

const { report: minorReport, updatedRfc: minorRfc } = impactAnalysisService.registerAnalysis(
  {
    rfcId: rfcTest2.id,
    effortHours: 12,
    estimatedCost: 800,
    scheduleImpactDays: 2,
    technicalSummary: 'Ajuste de índices no invasivo en base de datos. No compromete APIs ni contratos externos.',
    affectedEcsIds: ['ECS-002'],
    technicalRisk: 'BAJO',
    identifiedRisks: ['Breve bloqueo de lectura durante la creación online del índice.'],
    recommendation: 'PROCEDE_MENOR',
    proposedClassification: 'CAMBIO_MENOR',
    rollbackPlan: 'Eliminación del índice creado mediante DROP INDEX CONCURRENTLY.',
  },
  architectUser
);

assert.strictEqual(minorReport.classification, 'CAMBIO_MENOR');
assert.strictEqual(minorRfc.classification, 'CAMBIO_MENOR');
assert.strictEqual(minorRfc.status, 'EN_EVALUACION', 'Toda RFC con informe técnico completado transiciona a EN_EVALUACION (TB-07)');
assert.notStrictEqual(minorRfc.status, 'AUTORIZADA', 'El análisis técnico NO debe auto-aprobar la solicitud');
console.log(`✅ Cambio Menor clasificado correctamente en estado EN_EVALUACION listo para CU-30.\n`);

// ============================================================================
// TEST 8: Consulta y Persistencia del Informe Emitido
// ============================================================================
console.log('Test 8: Consulta de informe emitido por identificador de RFC y por ID de informe');

const retrievedByRfc = impactAnalysisService.getByRfcId(minorRfc.id);
assert.ok(retrievedByRfc);
assert.strictEqual(retrievedByRfc.id, minorReport.id);
assert.strictEqual(retrievedByRfc.estimatedCost, 800);

const retrievedById = impactAnalysisService.getById(minorReport.id);
assert.ok(retrievedById);
assert.strictEqual(retrievedById.rfcId, minorRfc.id);
console.log('✅ Consulta y persistencia del informe verificadas exitosamente.\n');

// ============================================================================
// TEST 9: Inmutabilidad y Congelamiento - No Sobrescritura de Informe
// ============================================================================
console.log('Test 9: Inmutabilidad del dictamen: no es posible sobrescribir un informe emitido');

assert.throws(
  () => {
    impactAnalysisService.registerAnalysis(
      {
        rfcId: minorRfc.id,
        effortHours: 15,
        estimatedCost: 900,
        scheduleImpactDays: 3,
        technicalSummary: 'Intento de modificar un informe ya congelado.',
        affectedEcsIds: ['ECS-002'],
        technicalRisk: 'BAJO',
        identifiedRisks: [],
        recommendation: 'PROCEDE_MENOR',
        proposedClassification: 'CAMBIO_MENOR',
      },
      architectUser
    );
  },
  /ya cuenta con un Informe Técnico de Impacto emitido y congelado/,
  'No se debe permitir sobrescribir un informe congelado'
);
console.log('✅ Inmutabilidad comprobada: intento de sobrescritura rechazado.\n');

// ============================================================================
// TEST 10: Registro Demostrativo de Auditoría
// ============================================================================
console.log('Test 10: Emisión de evento en la bitácora de auditoría demostrativa');

const auditEvents = auditService.getAll();
const impactEvent = auditEvents.find(
  (e) => e.action === 'RFC_ANALISIS_TECNICO_REGISTRADO' && e.entityId === minorRfc.id
);

assert.ok(impactEvent, 'Debe existir un evento RFC_ANALISIS_TECNICO_REGISTRADO para la RFC evaluada');
assert.strictEqual(impactEvent.entityType, 'RFC');
assert.strictEqual(impactEvent.userId, 'USR-002');
assert.strictEqual(impactEvent.userName, 'Renzo Antonio Antayhua Mamani');
assert.ok(impactEvent.sha256Hash && impactEvent.sha256Hash.length === 64, 'Debe contener hash demostrativo');
console.log(`✅ Evento de auditoría validado: ${impactEvent.id} (${impactEvent.action}).\n`);

// ============================================================================
// TEST 11: Integridad de Propiedad de RFC (Verificación de Etapa A)
// ============================================================================
console.log('Test 11: Validación de propiedad de RFC: Solicitante no puede subsanar RFC de otro usuario');

// Joan (USR-001) crea RFC y Gestor la observa
const rfcOwnershipTest = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Actualización de Parámetros de Timeout en Pasarela',
    description: 'Incrementar timeout de 3s a 5s para conexiones con adquirentes lentos.',
    justification: 'Reducción de transacciones fallidas por timeout en horas de alta carga.',
    priority: 'MEDIA',
    category: 'ADAPTATIVO',
    affectedEcsId: 'ECS-001',
  },
  solicitanteUser
);

const observedOwnershipRfc = rfcService.observe(
  rfcOwnershipTest.id,
  'Se solicita adjuntar métricas de latencia de los últimos 30 días.',
  gestorUser
);
assert.strictEqual(observedOwnershipRfc.status, 'EN_SUBSANACION');

// Otro usuario (Renzo Loyola USR-004 con rol PU-01) intenta subsanar la solicitud de Joan
const impostorSolicitante = {
  ...renzoLoyola,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  allowedRoleIds: ['PU-01', 'PU-04'],
};

assert.throws(
  () => {
    rfcService.subsanar(
      observedOwnershipRfc.id,
      {
        title: observedOwnershipRfc.title,
        description: observedOwnershipRfc.description,
        justification: 'Justificación enviada por otro usuario no autor del expediente.',
        priority: observedOwnershipRfc.priority,
        category: observedOwnershipRfc.category,
        affectedEcsId: observedOwnershipRfc.affectedEcsId,
      },
      impostorSolicitante
    );
  },
  /Acceso denegado \(Propiedad\)/,
  'Un solicitante no puede subsanar una RFC de otro usuario'
);

// El solicitante original (Joan USR-001) subsana con éxito
const subsanatedByOwner = rfcService.subsanar(
  observedOwnershipRfc.id,
  {
    title: observedOwnershipRfc.title,
    description: observedOwnershipRfc.description,
    justification: 'Se adjuntan métricas de latencia con percentil 99 superior a 3.8s en horas pico.',
    priority: observedOwnershipRfc.priority,
    category: observedOwnershipRfc.category,
    affectedEcsId: observedOwnershipRfc.affectedEcsId,
  },
  solicitanteUser
);

assert.strictEqual(subsanatedByOwner.status, 'REGISTRADA');
assert.strictEqual(subsanatedByOwner.requesterId, 'USR-001');
console.log('✅ Validación de propiedad confirmada: bloqueo a terceros y autorización al titular.\n');

console.log('🎉 TODAS LAS PRUEBAS DE FASE 04A PASARON SATISFACTORIAMENTE (11/11).');
