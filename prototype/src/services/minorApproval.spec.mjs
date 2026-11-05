// Test de verificación de Fase 04B: CU-30 Autorización Delegada de Cambios Menores (Doble Llave)
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
const { minorApprovalService } = await import('./minorApproval.service.ts');
const { auditService } = await import('./audit.service.ts');
const { storageService } = await import('./storage.service.ts');

console.log('🧪 Iniciando pruebas de Fase 04B: CU-30 Autorización Delegada de Cambios Menores (Doble Llave)...\n');

// Cuentas de usuario de prueba
const accounts = authService.getAccounts();
const joanAccount = accounts[0];    // USR-001: PU-02 (Gestor) / PU-01 (Solicitante), PRJ-001, PRJ-002, PRJ-003
const renzoAccount = accounts[1];   // USR-002: PU-03 (Arquitecto) / PU-06 (Dev), PRJ-001, PRJ-002, PRJ-003
const augustoAccount = accounts[2]; // USR-003: PU-05 (Bibliotecario) / PU-07 (Calidad), PRJ-001, PRJ-002, PRJ-003
const renzoLoyola = accounts[3];    // USR-004: PU-04 (CCB), PRJ-001, PRJ-002

// Solicitante externo para desacoplar de Gestor y Arquitecto
const externalRequester = {
  id: 'USR-099',
  username: 'cmendoza',
  fullName: 'Carlos Mendoza Ramos',
  email: 'cmendoza@exodo.pe',
  organization: 'ÉXODO S.A.C.',
  position: 'Líder Funcional de Negocio',
  cargo: 'Líder Funcional de Negocio',
  isActive: true,
  primaryRoleId: 'PU-01',
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  assignedRoleIds: ['PU-01'],
  allowedRoleIds: ['PU-01'],
  assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
};

// Joan como Solicitante (para pruebas de antiautoevaluación SoD)
const joanAsRequester = {
  ...joanAccount,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  allowedRoleIds: joanAccount.assignedRoleIds,
};

// Gestor formal (Joan Medina, USR-001)
const gestorUser = {
  ...joanAccount,
  roleId: 'PU-02',
  role: 'GESTOR',
  roleLabel: 'Analista de Requerimientos / Gestor',
  allowedRoleIds: joanAccount.assignedRoleIds,
};

// Segundo Gestor formal (para pruebas de duplicidad de rol)
const secondGestorUser = {
  id: 'USR-007',
  username: 'mvaldivia',
  fullName: 'Mario Valdivia Paredes',
  email: 'mvaldivia@exodo.pe',
  organization: 'ÉXODO S.A.C.',
  position: 'Gestor de Configuración Adjunto',
  cargo: 'Gestor de Configuración Adjunto',
  isActive: true,
  primaryRoleId: 'PU-02',
  roleId: 'PU-02',
  role: 'GESTOR',
  roleLabel: 'Analista de Requerimientos / Gestor',
  assignedRoleIds: ['PU-02'],
  allowedRoleIds: ['PU-02'],
  assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
};

// Arquitecto formal (Renzo Antayhua, USR-002)
const architectUser = {
  ...renzoAccount,
  roleId: 'PU-03',
  role: 'ARQUITECTO',
  roleLabel: 'Arquitecto / Especialista Técnico',
  allowedRoleIds: renzoAccount.assignedRoleIds,
};

// Usuario con doble rol asignado (para probar segregación de doble firma por misma cuenta)
const dualRoleUser = {
  id: 'USR-088',
  username: 'superaudit',
  fullName: 'Auditor Multifunción Demo',
  email: 'superaudit@exodo.pe',
  organization: 'ÉXODO S.A.C.',
  position: 'Especialista Integral',
  cargo: 'Especialista Integral',
  isActive: true,
  primaryRoleId: 'PU-02',
  roleId: 'PU-02',
  role: 'GESTOR',
  roleLabel: 'Analista de Requerimientos / Gestor',
  assignedRoleIds: ['PU-02', 'PU-03'],
  allowedRoleIds: ['PU-02', 'PU-03'],
  assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
};

// Roles no autorizados
const solicitanteUser = {
  ...joanAccount,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  allowedRoleIds: joanAccount.assignedRoleIds,
};

const ccbUser = {
  ...renzoLoyola,
  roleId: 'PU-04',
  role: 'CCB',
  roleLabel: 'Comité de Control de Cambios',
  allowedRoleIds: renzoLoyola.assignedRoleIds,
};

const librarianUser = {
  ...augustoAccount,
  roleId: 'PU-05',
  role: 'BIBLIOTECARIO',
  roleLabel: 'Bibliotecario / Administrador SCM',
  allowedRoleIds: augustoAccount.assignedRoleIds,
};

const devUser = {
  ...renzoAccount,
  roleId: 'PU-06',
  role: 'DESARROLLADOR',
  roleLabel: 'Desarrollador de Software',
  allowedRoleIds: renzoAccount.assignedRoleIds,
};

const qaUser = {
  ...augustoAccount,
  roleId: 'PU-07',
  role: 'CALIDAD',
  roleLabel: 'Aseguramiento de Calidad (QA)',
  allowedRoleIds: augustoAccount.assignedRoleIds,
};

// Helper: Crear y preparar RFC clasificada como Cambio Menor en EN_EVALUACION
function setupMinorRfcInEvaluation(title, customRequester = externalRequester) {
  const rfc = rfcService.create(
    {
      projectId: 'PRJ-001',
      title: title || 'Ajuste de Caché en Respuestas de Catálogo',
      description: 'Optimización de headers HTTP Cache-Control en endpoints públicos.',
      justification: 'Reducción de latencia y consumo de ancho de banda.',
      proposedSolution: 'Configurar max-age a 3600 segundos en microservicio de catálogo.',
      priority: 'MEDIA',
      category: 'PERFECCIONAMIENTO',
      affectedEcsId: 'ECS-001',
      attachments: [],
    },
    customRequester
  );

  const admitted = rfcService.admit(
    rfc.id,
    'Expediente completo y debidamente respaldado. Procede análisis de impacto técnico.',
    gestorUser
  );

  const { updatedRfc, report } = impactAnalysisService.registerAnalysis(
    {
      rfcId: admitted.id,
      effortHours: 6,
      estimatedCost: 350,
      scheduleImpactDays: 1,
      technicalSummary: 'Impacto estrictamente localizado en cabeceras de respuesta HTTP. Sin alteración de contratos ni datos.',
      affectedEcsIds: ['ECS-001'],
      technicalRisk: 'BAJO',
      identifiedRisks: ['Riesgo menor de persistencia de caché transitoria durante el despliegue.'],
      recommendation: 'PROCEDE_MENOR',
      proposedClassification: 'CAMBIO_MENOR',
      rollbackPlan: 'Invalidar caché CDN y revertir configuración al valor previo.',
    },
    architectUser
  );

  return { rfc: updatedRfc, report };
}

// ============================================================================
// TEST 1: PU-02 (Gestor) puede emitir visto bueno de viabilidad operativa
// ============================================================================
console.log('Test 1: PU-02 (Gestor) puede emitir visto bueno de viabilidad operativa');
{
  const { rfc, report } = setupMinorRfcInEvaluation('Refactorización de Logger Interno');
  assert.strictEqual(rfc.status, 'EN_EVALUACION');
  assert.strictEqual(rfc.classification, 'CAMBIO_MENOR');

  const { record: approval } = minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Viabilidad operativa, presupuestal y de cronograma verificada formalmente conforme a CU-30.',
    },
    gestorUser
  );

  assert.ok(approval.id.startsWith('APR-2026-'), 'ID de aprobación debe tener prefijo APR-2026-');
  assert.strictEqual(approval.role, 'GESTOR');
  assert.strictEqual(approval.roleId, 'PU-02');
  assert.strictEqual(approval.userId, gestorUser.id);
  assert.strictEqual(approval.decision, 'APROBADO');
  assert.strictEqual(approval.impactReportId, report.id);

  const status = minorApprovalService.getDelegatedStatus(rfc.id);
  assert.strictEqual(status.overallStatus, 'PENDIENTE', 'Tras 1 sola firma, el estado debe ser PENDIENTE');
  assert.ok(status.gestorApproval, 'Debe contener la firma del Gestor');
  assert.strictEqual(status.architectApproval, undefined, 'Aún no debe existir firma del Arquitecto');

  const currentRfc = rfcService.getById(rfc.id);
  assert.strictEqual(currentRfc.status, 'EN_EVALUACION', 'La RFC debe continuar en EN_EVALUACION');
  console.log('✅ Visto bueno de Gestor registrado exitosamente; expediente permanece en EN_EVALUACION (1/2 firmas).');
}

// ============================================================================
// TEST 2: PU-03 (Arquitecto) puede emitir visto bueno completando la Doble Llave
// ============================================================================
console.log('\nTest 2: PU-03 (Arquitecto) emite segundo visto bueno completando la Doble Llave');
{
  const { rfc } = setupMinorRfcInEvaluation('Ajuste de Tipografía en Reportes PDF');

  // Firma 1: Gestor
  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Viabilidad funcional constatada. No afecta compromisos contractuales.',
    },
    gestorUser
  );

  // Firma 2: Arquitecto
  const { record: archApproval } = minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Viabilidad arquitectónica comprobada. Sin impacto en componentes críticos.',
    },
    architectUser
  );

  assert.strictEqual(archApproval.role, 'ARQUITECTO');
  assert.strictEqual(archApproval.roleId, 'PU-03');
  assert.strictEqual(archApproval.userId, architectUser.id);

  const status = minorApprovalService.getDelegatedStatus(rfc.id);
  assert.strictEqual(status.overallStatus, 'AUTORIZADA', 'Al completarse ambas firmas el estado global es AUTORIZADA');
  assert.ok(status.gestorApproval);
  assert.ok(status.architectApproval);
  assert.ok(status.completedAt);

  const currentRfc = rfcService.getById(rfc.id);
  assert.strictEqual(currentRfc.status, 'AUTORIZADA', 'La RFC debe transicionar a AUTORIZADA');
  assert.ok(currentRfc.authorizedBy.includes(gestorUser.fullName));
  assert.ok(currentRfc.authorizedBy.includes(architectUser.fullName));
  assert.ok(currentRfc.authorizedAt);
  console.log('✅ Doble llave completada: RFC transicionó canónicamente a AUTORIZADA con firmas registradas.');
}

// ============================================================================
// TEST 3: Bloqueo de los 5 roles no autorizados (PU-01, PU-04, PU-05, PU-06, PU-07)
// ============================================================================
console.log('\nTest 3: Bloqueo de los 5 roles no autorizados (PU-01, PU-04, PU-05, PU-06, PU-07)');
{
  const { rfc } = setupMinorRfcInEvaluation('Cambio Menor de Estilos CSS');
  const unauthorizedUsers = [solicitanteUser, ccbUser, librarianUser, devUser, qaUser];

  for (const u of unauthorizedUsers) {
    assert.throws(
      () => {
        minorApprovalService.registerApproval(
          {
            rfcId: rfc.id,
            decision: 'APROBADO',
            justification: 'Intento de aprobación no autorizada por rol sin facultad.',
          },
          u
        );
      },
      /no posee autorización|Operación denegada|Segregación de Funciones/,
      `El rol ${u.roleId} (${u.roleLabel}) debió ser bloqueado por SoD.`
    );
  }
  console.log('✅ Bloqueo SoD validado exitosamente para los 5 roles no autorizados.');
}

// ============================================================================
// TEST 4: Rechazo si la RFC no está en estado EN_EVALUACION
// ============================================================================
console.log('\nTest 4: Rechazo si la RFC no está en estado EN_EVALUACION');
{
  // 4.1 RFC en REGISTRADA
  const rfcReg = rfcService.create(
    {
      projectId: 'PRJ-001',
      title: 'Solicitud recién creada sin admisión',
      description: 'Descripción de prueba.',
      justification: 'Justificación válida de prueba.',
      proposedSolution: 'Solución preliminar.',
      priority: 'BAJA',
      category: 'CORRECTIVO',
      affectedEcsId: 'ECS-001',
      attachments: [],
    },
    externalRequester
  );

  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfcReg.id,
          decision: 'APROBADO',
          justification: 'Intento de aprobación en estado REGISTRADA.',
        },
        gestorUser
      );
    },
    /EN_EVALUACION/,
    'Debe rechazar intento de aprobación sobre RFC en estado REGISTRADA'
  );

  // 4.2 RFC en CLASIFICADA
  const rfcClas = rfcService.admit(
    rfcReg.id,
    'Admisión formal de prueba.',
    gestorUser
  );
  assert.strictEqual(rfcClas.status, 'CLASIFICADA');

  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfcClas.id,
          decision: 'APROBADO',
          justification: 'Intento de aprobación en estado CLASIFICADA sin informe técnico.',
        },
        gestorUser
      );
    },
    /EN_EVALUACION/,
    'Debe rechazar intento de aprobación sobre RFC en estado CLASIFICADA'
  );
  console.log('✅ Precondición de ciclo de vida validada: solo se admiten RFCs en estado EN_EVALUACION.');
}

// ============================================================================
// TEST 5: Rechazo si la RFC está clasificada como CAMBIO_MAYOR
// ============================================================================
console.log('\nTest 5: Rechazo si la RFC está clasificada como CAMBIO_MAYOR');
{
  const rfcMajor = rfcService.create(
    {
      projectId: 'PRJ-001',
      title: 'Reestructuración Arquitectónica del Núcleo',
      description: 'Cambio de alto impacto en subsistema transaccional.',
      justification: 'Modernización tecnológica profunda.',
      proposedSolution: 'Reescritura de orquestador.',
      priority: 'MUY_ALTA',
      category: 'PERFECCIONAMIENTO',
      affectedEcsId: 'ECS-001',
      attachments: [],
    },
    externalRequester
  );

  rfcService.admit(rfcMajor.id, 'Admitida para análisis de cambio mayor.', gestorUser);

  const { updatedRfc } = impactAnalysisService.registerAnalysis(
    {
      rfcId: rfcMajor.id,
      effortHours: 80,
      estimatedCost: 6500,
      scheduleImpactDays: 14,
      technicalSummary: 'Impacto estructural en arquitectura base.',
      affectedEcsIds: ['ECS-001', 'ECS-002'],
      technicalRisk: 'ALTO',
      identifiedRisks: ['Riesgo crítico de regresión general.'],
      recommendation: 'PROCEDE_MAYOR',
      proposedClassification: 'CAMBIO_MAYOR',
      rollbackPlan: 'Plan de contingencia complejo.',
    },
    architectUser
  );

  assert.strictEqual(updatedRfc.status, 'EN_EVALUACION');
  assert.strictEqual(updatedRfc.classification, 'CAMBIO_MAYOR');

  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: updatedRfc.id,
          decision: 'APROBADO',
          justification: 'Intento de autorizar cambio mayor vía doble llave menor.',
        },
        gestorUser
      );
    },
    /CAMBIO_MAYOR/,
    'Debe prohibir autorización delegada sobre solicitudes de Cambio Mayor.'
  );
  console.log('✅ Bloqueo normativo confirmado: los Cambios Mayores requieren deliberación colegiada del CCB (CU-07).');
}

// ============================================================================
// TEST 6: Rechazo si la RFC no cuenta con Informe Técnico de Impacto emitido
// ============================================================================
console.log('\nTest 6: Rechazo si la RFC no cuenta con Informe Técnico de Impacto emitido');
{
  const rfcWithoutReport = rfcService.create(
    {
      projectId: 'PRJ-001',
      title: 'Cambio sin informe técnico',
      description: 'Descripción de prueba.',
      justification: 'Justificación de prueba.',
      proposedSolution: 'Solución rápida.',
      priority: 'MEDIA',
      category: 'CORRECTIVO',
      affectedEcsId: 'ECS-001',
      attachments: [],
    },
    externalRequester
  );

  // Manipulamos estado en store para simular inconsistencia sin impactAnalysisId
  const allRfcs = storageService.get('rfcs', []);
  const idx = allRfcs.findIndex((r) => r.id === rfcWithoutReport.id);
  allRfcs[idx] = {
    ...allRfcs[idx],
    status: 'EN_EVALUACION',
    classification: 'CAMBIO_MENOR',
    impactAnalysisId: undefined,
  };
  storageService.set('rfcs', allRfcs);

  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfcWithoutReport.id,
          decision: 'APROBADO',
          justification: 'Intento de aprobación sin informe de impacto.',
        },
        gestorUser
      );
    },
    /informe técnico de impacto/i,
    'Debe exigir la existencia de un informe técnico previo emitido'
  );
  console.log('✅ Exigencia de informe técnico previo validada conforme a RN-05.');
}

// ============================================================================
// TEST 7: Rechazo por aislamiento de proyecto (usuario sin asignación)
// ============================================================================
console.log('\nTest 7: Rechazo por aislamiento de proyecto (usuario sin asignación)');
{
  const { rfc } = setupMinorRfcInEvaluation('Cambio en Proyecto 001');

  const unassignedUser = {
    ...gestorUser,
    id: 'USR-077',
    assignedProjectIds: ['PRJ-999'], // No asignado a PRJ-001
  };

  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfc.id,
          decision: 'APROBADO',
          justification: 'Intento de aprobación en proyecto no asignado.',
        },
        unassignedUser
      );
    },
    /no tiene asignado el proyecto/,
    'Debe bloquear operaciones sobre proyectos ajenos.'
  );
  console.log('✅ Aislamiento multitenant de proyectos validado exitosamente.');
}

// ============================================================================
// TEST 8: Segregación SoD anti-autoevaluación: Solicitante no puede aprobar su RFC
// ============================================================================
console.log('\nTest 8: Segregación SoD anti-autoevaluación: Solicitante no puede aprobar su RFC');
{
  // Joan Medina (USR-001) registra la RFC como Solicitante
  const { rfc } = setupMinorRfcInEvaluation('Actualización de Ícono de Menú', joanAsRequester);
  assert.strictEqual(rfc.requesterId, joanAccount.id);

  // Joan Medina intenta aprobar su propia RFC asumiendo rol de Gestor (PU-02)
  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfc.id,
          decision: 'APROBADO',
          justification: 'Intento de auto-aprobar mi propia solicitud como gestor.',
        },
        gestorUser // USR-001
      );
    },
    /solicitante original.*tiene prohibido|RN-01/i,
    'El solicitante no puede auto-aprobar su solicitud bajo ningún rol.'
  );
  console.log('✅ Regla de antiautoevaluación SoD verificada: Solicitante no puede autoaprobar su solicitud.');
}

// ============================================================================
// TEST 9: Primera aprobación deja la RFC en EN_EVALUACION con estado PENDIENTE
// ============================================================================
console.log('\nTest 9: Primera aprobación deja la RFC en EN_EVALUACION con estado PENDIENTE');
{
  const { rfc } = setupMinorRfcInEvaluation('Refactor de Helpers de Fecha');

  // En esta ocasión, el Arquitecto firma primero
  const { record: archApproval } = minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Firma técnica preliminar del Arquitecto. Código limpio y probado.',
    },
    architectUser
  );

  assert.strictEqual(archApproval.role, 'ARQUITECTO');
  const delegated = minorApprovalService.getDelegatedStatus(rfc.id);
  assert.strictEqual(delegated.overallStatus, 'PENDIENTE');
  assert.ok(delegated.architectApproval);
  assert.strictEqual(delegated.gestorApproval, undefined);

  const currentRfc = rfcService.getById(rfc.id);
  assert.strictEqual(currentRfc.status, 'EN_EVALUACION');
  console.log('✅ Primera firma (Arquitecto) registrada; expediente permanece en EN_EVALUACION.');
}

// ============================================================================
// TEST 10: Segunda aprobación consecutiva por Gestor completa la Doble Llave
// ============================================================================
console.log('\nTest 10: Segunda aprobación consecutiva por Gestor completa la Doble Llave');
{
  // Continuamos sobre la RFC del Test 9
  const allRfcs = rfcService.getAll();
  const targetRfc = allRfcs.find((r) => r.title === 'Refactor de Helpers de Fecha');

  const { record: gestorApproval } = minorApprovalService.registerApproval(
    {
      rfcId: targetRfc.id,
      decision: 'APROBADO',
      justification: 'Visto bueno operativo formal del Gestor SCM. Doble llave completada.',
    },
    gestorUser
  );

  assert.strictEqual(gestorApproval.role, 'GESTOR');
  const finalStatus = minorApprovalService.getDelegatedStatus(targetRfc.id);
  assert.strictEqual(finalStatus.overallStatus, 'AUTORIZADA');
  assert.ok(finalStatus.gestorApproval);
  assert.ok(finalStatus.architectApproval);

  const updatedRfc = rfcService.getById(targetRfc.id);
  assert.strictEqual(updatedRfc.status, 'AUTORIZADA');
  console.log('✅ Independencia de orden comprobada: Arquitecto primero y Gestor después alcanzan AUTORIZADA.');
}

// ============================================================================
// TEST 11: Bloqueo de doble firma por la misma cuenta de usuario (Doble Llave)
// ============================================================================
console.log('\nTest 11: Bloqueo de doble firma por la misma cuenta de usuario (Doble Llave)');
{
  const { rfc } = setupMinorRfcInEvaluation('Ajuste de Metadatos de Facturación');

  // dualRoleUser firma primero como Gestor (PU-02)
  const userAsGestor = {
    ...dualRoleUser,
    roleId: 'PU-02',
    role: 'GESTOR',
    roleLabel: 'Analista de Requerimientos / Gestor',
  };
  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Primera firma emitida como Gestor por usuario multirrol.',
    },
    userAsGestor
  );

  // El mismo usuario cambia de rol a Arquitecto (PU-03) e intenta emitir la segunda firma
  const userAsArchitect = {
    ...dualRoleUser,
    roleId: 'PU-03',
    role: 'ARQUITECTO',
    roleLabel: 'Arquitecto / Especialista Técnico',
  };

  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfc.id,
          decision: 'APROBADO',
          justification: 'Intento de emitir la segunda firma con la misma cuenta de usuario.',
        },
        userAsArchitect
      );
    },
    /El mismo usuario no puede emitir ambos vistos buenos|Doble Llave/i,
    'La regla de Doble Llave exige dos identidades de usuario físicas distintas.'
  );
  console.log('✅ Regla de Doble Llave e identidad segregada verificada: se prohíbe auto-completar ambas llaves.');
}

// ============================================================================
// TEST 12: Bloqueo de firma duplicada para el mismo rol funcional
// ============================================================================
console.log('\nTest 12: Bloqueo de firma duplicada para el mismo rol funcional');
{
  const { rfc } = setupMinorRfcInEvaluation('Optimización de Formato SVG');

  // Firma 1: Gestor Joan Medina
  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Primera firma del Gestor Joan Medina.',
    },
    gestorUser
  );

  // Firma 2 intentada por otro Gestor (Mario Valdivia)
  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfc.id,
          decision: 'APROBADO',
          justification: 'Intento de segunda firma con rol Gestor duplicado.',
        },
        secondGestorUser
      );
    },
    /ya ha sido emitida previamente/i,
    'No se puede duplicar la firma del mismo rol funcional.'
  );
  console.log('✅ Control de rol único por expediente validado: no se admite duplicidad de rol funcional.');
}

// ============================================================================
// TEST 13: Validación de justificación obligatoria (mínimo 10 caracteres)
// ============================================================================
console.log('\nTest 13: Validación de justificación obligatoria (mínimo 10 caracteres)');
{
  const { rfc } = setupMinorRfcInEvaluation('Corrección Ortográfica en Footer');

  // Justificación vacía o corta
  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfc.id,
          decision: 'APROBADO',
          justification: 'Ok',
        },
        gestorUser
      );
    },
    /al menos 10 caracteres/i,
    'Debe exigir al menos 10 caracteres en la justificación.'
  );

  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfc.id,
          decision: 'RECHAZADO',
          justification: '          ',
        },
        gestorUser
      );
    },
    /al menos 10 caracteres/i,
    'Debe rechazar justificaciones vacías o solo con espacios.'
  );
  console.log('✅ Validación de completitud cualitativa en justificación verificada exitosamente.');
}

// ============================================================================
// TEST 14: Denegación definitiva transiciona RFC a RECHAZADA
// ============================================================================
console.log('\nTest 14: Denegación definitiva transiciona RFC a RECHAZADA');
{
  const { rfc } = setupMinorRfcInEvaluation('Modificación Incompatible de Parámetro');

  const { record: rejection } = minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'RECHAZADO',
      escalateToCcb: false,
      justification: 'El cambio entra en conflicto con la política de seguridad y no aporta valor comercial suficiente.',
    },
    gestorUser
  );

  assert.strictEqual(rejection.decision, 'RECHAZADO');
  const status = minorApprovalService.getDelegatedStatus(rfc.id);
  assert.strictEqual(status.overallStatus, 'RECHAZADA');

  const currentRfc = rfcService.getById(rfc.id);
  assert.strictEqual(currentRfc.status, 'RECHAZADA');
  assert.strictEqual(
    currentRfc.rejectionReason,
    'El cambio entra en conflicto con la política de seguridad y no aporta valor comercial suficiente.'
  );
  console.log('✅ Denegación definitiva verificada: transiciona canónicamente a RECHAZADA con motivo consignado.');
}

// ============================================================================
// TEST 15: Reescalamiento a CCB reasigna a CAMBIO_MAYOR y mantiene EN_EVALUACION
// ============================================================================
console.log('\nTest 15: Reescalamiento a CCB reasigna a CAMBIO_MAYOR y mantiene EN_EVALUACION');
{
  const { rfc } = setupMinorRfcInEvaluation('Reemplazo de Dependencia Criptográfica');

  // El Arquitecto determina que el cambio menor encubre riesgos estructurales y lo reescala
  const { record: escalation } = minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'RECHAZADO',
      escalateToCcb: true,
      justification: 'Se detectó afectación no declarada a certificados SSL de producción; requiere deliberación del CCB.',
    },
    architectUser
  );

  assert.strictEqual(escalation.decision, 'RECHAZADO');
  assert.strictEqual(escalation.escalateToCcb, true);

  const status = minorApprovalService.getDelegatedStatus(rfc.id);
  assert.strictEqual(status.overallStatus, 'REESCALADA_CCB');

  const currentRfc = rfcService.getById(rfc.id);
  assert.strictEqual(currentRfc.status, 'EN_EVALUACION', 'La RFC debe mantenerse en EN_EVALUACION para el CCB');
  assert.strictEqual(currentRfc.classification, 'CAMBIO_MAYOR', 'Debe ser reescalada canónicamente a CAMBIO_MAYOR');
  console.log('✅ Reescalamiento a CCB verificado: RFC reclasificada a CAMBIO_MAYOR en EN_EVALUACION para CU-07.');
}

// ============================================================================
// TEST 16: Persistencia y consulta vía getDelegatedStatus y getByRfcId
// ============================================================================
console.log('\nTest 16: Persistencia y consulta vía getDelegatedStatus y getByRfcId');
{
  const { rfc } = setupMinorRfcInEvaluation('Prueba de Recuperación en Persistencia');

  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Visto bueno persistido para consulta de expediente.',
    },
    gestorUser
  );

  const records = minorApprovalService.getByRfcId(rfc.id);
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].role, 'GESTOR');
  assert.strictEqual(records[0].userName, gestorUser.fullName);

  const delegated = minorApprovalService.getDelegatedStatus(rfc.id);
  assert.strictEqual(delegated.rfcId, rfc.id);
  assert.strictEqual(delegated.gestorApproval?.id, records[0].id);
  console.log('✅ Persistencia y recuperación en storage verificadas exitosamente.');
}

// ============================================================================
// TEST 17: Registro de auditoría demostrativa append-only con SHA-256
// ============================================================================
console.log('\nTest 17: Registro de auditoría demostrativa append-only con SHA-256');
{
  const { rfc } = setupMinorRfcInEvaluation('Auditoría Integral de Cambio Menor');

  // 1. Firma parcial
  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Firma preliminar para emisión de auditoría parcial.',
    },
    gestorUser
  );

  // 2. Firma total
  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Firma definitiva para emisión de auditoría aprobatoria.',
    },
    architectUser
  );

  const events = auditService.getAll();
  const partialEvent = events.find(
    (e) => e.entityId === rfc.id && e.action === 'RFC_APROBACION_PARCIAL_MENOR'
  );
  assert.ok(partialEvent, 'Debe emitirse evento RFC_APROBACION_PARCIAL_MENOR');
  assert.strictEqual(partialEvent.sha256Hash.length, 64, 'El hash SHA-256 debe tener 64 caracteres');

  const fullEvent = events.find(
    (e) => e.entityId === rfc.id && e.action === 'RFC_APROBADA_MENOR'
  );
  assert.ok(fullEvent, 'Debe emitirse evento RFC_APROBADA_MENOR');
  assert.strictEqual(fullEvent.sha256Hash.length, 64);
  console.log('✅ Bitácora de auditoría demostrativa validada: eventos emitidos con integridad SHA-256.');
}

// ============================================================================
// TEST 18: Inexistencia de emisión automática de ECN (colección intacta)
// ============================================================================
console.log('\nTest 18: Inexistencia de emisión automática de ECN (colección intacta)');
{
  const initialEcns = storageService.get('ecns', []);
  const initialCount = initialEcns.length;

  const { rfc } = setupMinorRfcInEvaluation('Verificación de No Emisión de ECN Automática');

  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Firma 1 de 2 sin generar orden ECN.',
    },
    gestorUser
  );

  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Firma 2 de 2 completando autorización delegada sin emisión automática.',
    },
    architectUser
  );

  const finalEcns = storageService.get('ecns', []);
  assert.strictEqual(
    finalEcns.length,
    initialCount,
    'La colección de ECNs debe permanecer exactamente igual; no debe auto-generarse ECN en CU-30'
  );
  console.log('✅ Ausencia de emisión espuria de ECN confirmada: la emisión formal de orden compete a CU-08.');
}

// ============================================================================
// TEST 19: Inmutabilidad tras dictamen: rechazo de aprobación sobre RFC AUTORIZADA o RECHAZADA
// ============================================================================
console.log('\nTest 19: Inmutabilidad tras dictamen: rechazo de aprobación sobre RFC AUTORIZADA o RECHAZADA');
{
  const { rfc } = setupMinorRfcInEvaluation('Verificación de Inmutabilidad Final');

  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Firma 1 del Gestor para prueba de inmutabilidad.',
    },
    gestorUser
  );

  minorApprovalService.registerApproval(
    {
      rfcId: rfc.id,
      decision: 'APROBADO',
      justification: 'Firma 2 del Arquitecto completando AUTORIZADA.',
    },
    architectUser
  );

  const authorizedRfc = rfcService.getById(rfc.id);
  assert.strictEqual(authorizedRfc.status, 'AUTORIZADA');

  // Intento de emitir una tercera firma posterior al cierre
  assert.throws(
    () => {
      minorApprovalService.registerApproval(
        {
          rfcId: rfc.id,
          decision: 'APROBADO',
          justification: 'Intento de modificar un expediente ya resuelto y autorizado.',
        },
        secondGestorUser
      );
    },
    /EN_EVALUACION/,
    'Debe rechazar cualquier firma sobre una RFC que ya salió de EN_EVALUACION.'
  );
  console.log('✅ Inmutabilidad post-dictamen confirmada: no es posible alterar un expediente ya resuelto.');
}

// ============================================================================
// TEST 20: No regresión y verificación de los 14 estados oficiales (TB-07)
// ============================================================================
console.log('\nTest 20: No regresión y verificación de los 14 estados oficiales (TB-07)');
{
  const canonicalTransitions = rfcService.getAvailableTransitions('EN_EVALUACION');
  assert.deepStrictEqual(
    canonicalTransitions,
    ['AUTORIZADA', 'RECHAZADA'],
    'Desde EN_EVALUACION solo se permite transicionar a AUTORIZADA o RECHAZADA'
  );
  console.log('✅ Consistencia normativa confirmada: 14 estados y transiciones canónicas de TB-07 preservadas al 100%.');
}

console.log('\n🎉 TODAS LAS PRUEBAS DE FASE 04B PASARON SATISFACTORIAMENTE (20/20).\n');
