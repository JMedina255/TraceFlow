// Test de verificación de Fase 04C.1: CU-07 Deliberación Colegiada del CCB y Control de Votos
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
const { ccbService } = await import('./ccb.service.ts');
const { auditService } = await import('./audit.service.ts');
const { storageService } = await import('./storage.service.ts');

console.log('🧪 Iniciando pruebas de Fase 04C.1: CU-07 Deliberación del Comité CCB e Infraestructura de Votación...\n');

// Cuentas canónicas del catálogo
const accounts = authService.getAccounts();
const joanAccount = accounts[0];    // USR-001: PU-02 (Gestor) / PU-01 (Solicitante), PRJ-001, PRJ-002, PRJ-003
const renzoAccount = accounts[1];   // USR-002: PU-03 (Arquitecto) / PU-06 (Dev), PRJ-001, PRJ-002, PRJ-003
const augustoAccount = accounts[2]; // USR-003: PU-05 (Bibliotecario) / PU-07 (Calidad), PRJ-001, PRJ-002, PRJ-003
const renzoLoyola = accounts[3];    // USR-004: PU-04 (CCB), PRJ-001, PRJ-002 (Sin acceso a PRJ-003)

// Solicitante externo
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

// Gestor formal (USR-001)
const gestorUser = {
  ...joanAccount,
  roleId: 'PU-02',
  role: 'GESTOR',
  roleLabel: 'Analista de Requerimientos / Gestor',
  allowedRoleIds: joanAccount.assignedRoleIds,
};

// Arquitecto formal (USR-002)
const architectUser = {
  ...renzoAccount,
  roleId: 'PU-03',
  role: 'ARQUITECTO',
  roleLabel: 'Arquitecto / Especialista Técnico',
  allowedRoleIds: renzoAccount.assignedRoleIds,
};

// Miembro oficial del CCB en catálogo (USR-004)
const ccbUser = {
  ...renzoLoyola,
  roleId: 'PU-04',
  role: 'CCB',
  roleLabel: 'Comité de Control de Cambios',
  allowedRoleIds: renzoLoyola.assignedRoleIds,
};

// Fixture: Segundo miembro CCB para pruebas colegiadas multifirmantes
const testCcbMember2 = {
  id: 'USR-040',
  username: 'rvalcarcel',
  fullName: 'Dr. Ricardo Valcárcel Morales',
  email: 'rvalcarcel@exodo.pe',
  organization: 'ÉXODO S.A.C.',
  position: 'Presidente del Comité CCB',
  cargo: 'Presidente del Comité CCB',
  isActive: true,
  primaryRoleId: 'PU-04',
  roleId: 'PU-04',
  role: 'CCB',
  roleLabel: 'Comité de Control de Cambios',
  assignedRoleIds: ['PU-04'],
  allowedRoleIds: ['PU-04'],
  assignedProjectIds: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
};

// Fixture: Tercer miembro CCB para pruebas de abstención
const testCcbMember3 = {
  id: 'USR-041',
  username: 'psolano',
  fullName: 'Dra. Patricia Solano Benavides',
  email: 'psolano@exodo.pe',
  organization: 'ÉXODO S.A.C.',
  position: 'Vocal Legal del Comité CCB',
  cargo: 'Vocal Legal del Comité CCB',
  isActive: true,
  primaryRoleId: 'PU-04',
  roleId: 'PU-04',
  role: 'CCB',
  roleLabel: 'Comité de Control de Cambios',
  assignedRoleIds: ['PU-04'],
  allowedRoleIds: ['PU-04'],
  assignedProjectIds: ['PRJ-001', 'PRJ-002'],
};

// Registrar fixtures en el storage de cuentas para que authService los reconozca
{
  const currentAccounts = storageService.get('user_accounts', accounts);
  currentAccounts.push(testCcbMember2, testCcbMember3);
  storageService.set('user_accounts', currentAccounts);
}

// Roles no autorizados para votar en el CCB
const solicitanteUser = { ...externalRequester };
const librarianUser = {
  ...augustoAccount,
  roleId: 'PU-05',
  role: 'BIBLIOTECARIO',
  roleLabel: 'Bibliotecario / Administrador SCM',
};
const devUser = {
  ...renzoAccount,
  roleId: 'PU-06',
  role: 'DESARROLLADOR',
  roleLabel: 'Desarrollador de Software',
};
const qaUser = {
  ...augustoAccount,
  roleId: 'PU-07',
  role: 'CALIDAD',
  roleLabel: 'Aseguramiento de Calidad (QA)',
};

// Helper para crear y preparar RFC de Cambio Mayor en EN_EVALUACION con informe técnico
function setupMajorRfcInEvaluation(title, projectId = 'PRJ-001', customRequester = externalRequester) {
  const ecsId = projectId === 'PRJ-003' ? 'ECS-007' : projectId === 'PRJ-002' ? 'ECS-005' : 'ECS-001';
  const affectedEcsList = [ecsId];

  const rfc = rfcService.create(
    {
      projectId,
      title: title || 'Migración de Arquitectura a Microfrontends',
      description: 'Desacoplamiento del monolito frontend en microservicios independientes.',
      justification: 'Escalabilidad del equipo y despliegues independientes.',
      proposedSolution: 'Webpack Module Federation y CDN distribuida.',
      priority: 'ALTA',
      category: 'PERFECCIONAMIENTO',
      affectedEcsId: ecsId,
      attachments: [],
    },
    customRequester
  );

  const admitted = rfcService.admit(
    rfc.id,
    'Expediente completo y debidamente respaldado. Procede evaluación técnica de Arquitectura.',
    gestorUser
  );

  const { updatedRfc, report } = impactAnalysisService.registerAnalysis(
    {
      rfcId: admitted.id,
      effortHours: 120,
      estimatedCost: 12500,
      scheduleImpactDays: 20,
      technicalSummary: 'Impacto estructural en arquitectura base y pipelines CI/CD. Requiere tratamiento colegiado.',
      affectedEcsIds: affectedEcsList,
      technicalRisk: 'ALTO',
      identifiedRisks: [
        'Riesgo crítico de latencia de red en carga de chunks dinámicos.',
        'Complejidad en orquestación de autenticación unificada.',
      ],
      recommendation: 'PROCEDE_MAYOR',
      proposedClassification: 'CAMBIO_MAYOR',
      rollbackPlan: 'Plan de contingencia con switch DNS y rollback a versión previa en Biblioteca Maestra.',
    },
    architectUser
  );

  return { rfc: updatedRfc, report };
}

// ============================================================================
// TEST 1: Apertura de sesión CCB autorizada por miembro del comité (PU-04)
// ============================================================================
console.log('Test 1: Apertura de sesión CCB autorizada por miembro del comité (PU-04)');
{
  const { rfc, report } = setupMajorRfcInEvaluation('Refactorización Integral de Núcleo');
  assert.strictEqual(rfc.status, 'EN_EVALUACION');
  assert.strictEqual(rfc.classification, 'CAMBIO_MAYOR');

  const { session, updatedRfc } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  assert.ok(session.id.startsWith('CCB-2026-'), 'ID de sesión debe iniciar con CCB-2026-');
  assert.strictEqual(session.rfcId, rfc.id);
  assert.strictEqual(session.projectId, rfc.projectId);
  assert.strictEqual(session.status, 'ABIERTA');
  assert.strictEqual(session.convenedBy, ccbUser.id);
  assert.strictEqual(session.impactReportId, report.id);
  assert.strictEqual(updatedRfc.ccbSessionId, session.id);

  console.log('✅ Sesión CCB abierta formalmente con identificador correlativo y vinculación a RFC.');
}

// ============================================================================
// TEST 2: Denegación a roles distintos de PU-04
// ============================================================================
console.log('\nTest 2: Denegación a roles distintos de PU-04');
{
  const { rfc } = setupMajorRfcInEvaluation('Ajuste de Gateway de Seguridad');
  const unauthorizedUsers = [solicitanteUser, gestorUser, architectUser, librarianUser, devUser, qaUser];

  for (const u of unauthorizedUsers) {
    // Intento de aperturar sesión
    assert.throws(
      () => {
        ccbService.openSession({ rfcId: rfc.id }, u);
      },
      /no posee facultades|Operación denegada/i,
      `El rol ${u.roleId} (${u.roleLabel}) debió ser bloqueado para abrir sesión CCB.`
    );
  }

  // Abrimos sesión válida con ccbUser
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  for (const u of unauthorizedUsers) {
    // Intento de emitir voto
    assert.throws(
      () => {
        ccbService.registerVote(
          {
            sessionId: session.id,
            decision: 'APROBAR',
            justification: 'Intento de votar con rol no facultado.',
          },
          u
        );
      },
      /no posee facultades|Operación denegada/i,
      `El rol ${u.roleId} (${u.roleLabel}) debió ser bloqueado para votar en CCB.`
    );
  }

  console.log('✅ Segregación SoD comprobada: los 6 roles no-CCB fueron estrictamente bloqueados.');
}

// ============================================================================
// TEST 3: Acceso restringido por proyecto (aislamiento multitenant)
// ============================================================================
console.log('\nTest 3: Acceso restringido por proyecto (aislamiento multitenant)');
{
  // RFC creada en PRJ-003, proyecto al cual renzoLoyola (USR-004) NO tiene acceso
  const { rfc } = setupMajorRfcInEvaluation('Cambio Mayor en Proyecto Confidencial', 'PRJ-003');
  assert.strictEqual(rfc.projectId, 'PRJ-003');
  assert.ok(!ccbUser.assignedProjectIds.includes('PRJ-003'));

  assert.throws(
    () => {
      ccbService.openSession({ rfcId: rfc.id }, ccbUser);
    },
    /no tiene asignado el proyecto/i,
    'Debe denegar apertura de sesión para proyectos no asignados.'
  );

  console.log('✅ Aislamiento multitenant validado: miembros del CCB no pueden operar sobre proyectos ajenos.');
}

// ============================================================================
// TEST 4: Rechazo de RFC sin informe técnico previo emitido (RN-05)
// ============================================================================
console.log('\nTest 4: Rechazo de RFC sin informe técnico previo emitido (RN-05)');
{
  const rfcWithoutReport = rfcService.create(
    {
      projectId: 'PRJ-001',
      title: 'Cambio Mayor prematuro sin informe',
      description: 'Sin informe técnico de impacto.',
      justification: 'Prueba de precondición.',
      proposedSolution: 'Solución no analizada.',
      priority: 'ALTA',
      category: 'PERFECCIONAMIENTO',
      affectedEcsId: 'ECS-001',
      attachments: [],
    },
    externalRequester
  );

  // Manipulamos para simular inconsistencia de estado
  const allRfcs = storageService.get('rfcs', []);
  const idx = allRfcs.findIndex((r) => r.id === rfcWithoutReport.id);
  allRfcs[idx] = {
    ...allRfcs[idx],
    status: 'EN_EVALUACION',
    classification: 'CAMBIO_MAYOR',
    impactAnalysisId: undefined,
  };
  storageService.set('rfcs', allRfcs);

  assert.throws(
    () => {
      ccbService.openSession({ rfcId: rfcWithoutReport.id }, ccbUser);
    },
    /carece de Informe Técnico de Impacto/i,
    'Debe exigir el informe técnico conforme a RN-05.'
  );

  console.log('✅ Precondición técnica validada: el CCB exige Informe Técnico de Impacto previo emitido.');
}

// ============================================================================
// TEST 5: Rechazo de RFC clasificada como CAMBIO_MENOR
// ============================================================================
console.log('\nTest 5: Rechazo de RFC clasificada como CAMBIO_MENOR');
{
  const rfcMinor = rfcService.create(
    {
      projectId: 'PRJ-001',
      title: 'Ajuste de Cabecera HTTP Menor',
      description: 'Cambio de bajo riesgo.',
      justification: 'Ajuste cosmético.',
      proposedSolution: 'Modificar header.',
      priority: 'BAJA',
      category: 'CORRECTIVO',
      affectedEcsId: 'ECS-001',
      attachments: [],
    },
    externalRequester
  );

  rfcService.admit(rfcMinor.id, 'Admitida.', gestorUser);

  const { updatedRfc } = impactAnalysisService.registerAnalysis(
    {
      rfcId: rfcMinor.id,
      effortHours: 4,
      estimatedCost: 200,
      scheduleImpactDays: 1,
      technicalSummary: 'Afectación estrictamente menor.',
      affectedEcsIds: ['ECS-001'],
      technicalRisk: 'BAJO',
      identifiedRisks: [],
      recommendation: 'PROCEDE_MENOR',
      proposedClassification: 'CAMBIO_MENOR',
      rollbackPlan: 'Rollback rápido.',
    },
    architectUser
  );

  assert.strictEqual(updatedRfc.status, 'EN_EVALUACION');
  assert.strictEqual(updatedRfc.classification, 'CAMBIO_MENOR');

  assert.throws(
    () => {
      ccbService.openSession({ rfcId: updatedRfc.id }, ccbUser);
    },
    /CAMBIO_MAYOR/i,
    'El CCB no debe evaluar solicitudes dictaminadas como Cambio Menor (vía CU-30).'
  );

  console.log('✅ Bifurcación canónica confirmada: solicitudes de Cambio Menor no corresponden al CCB.');
}

// ============================================================================
// TEST 6: Rechazo de RFC fuera del estado canónico EN_EVALUACION
// ============================================================================
console.log('\nTest 6: Rechazo de RFC fuera del estado canónico EN_EVALUACION');
{
  const rfcReg = rfcService.create(
    {
      projectId: 'PRJ-001',
      title: 'Cambio recién registrado',
      description: 'En estado REGISTRADA.',
      justification: 'Prueba de ciclo de vida.',
      proposedSolution: 'Solución en borrador.',
      priority: 'ALTA',
      category: 'ADAPTATIVO',
      affectedEcsId: 'ECS-001',
      attachments: [],
    },
    externalRequester
  );

  assert.strictEqual(rfcReg.status, 'REGISTRADA');

  assert.throws(
    () => {
      ccbService.openSession({ rfcId: rfcReg.id }, ccbUser);
    },
    /EN_EVALUACION/i,
    'Debe rechazar apertura sobre RFC en estado REGISTRADA.'
  );

  console.log('✅ Ciclo de vida normativo verificado: solo se admiten expedientes en estado EN_EVALUACION.');
}

// ============================================================================
// TEST 7: Registro de voto individual fundamentado (APROBAR)
// ============================================================================
console.log('\nTest 7: Registro de voto individual fundamentado (APROBAR)');
{
  const { rfc } = setupMajorRfcInEvaluation('Implementación de Protocolo OAuth2');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  const { vote, tally, session: updatedSession } = ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'APROBAR',
      justification: 'Conforme con el análisis de impacto. El cronograma de 20 días es compatible con el hito comercial.',
    },
    ccbUser
  );

  assert.ok(vote.id.startsWith('VOTE-2026-'), 'ID de voto debe iniciar con VOTE-2026-');
  assert.strictEqual(vote.voterUserId, ccbUser.id);
  assert.strictEqual(vote.decision, 'APROBAR');
  assert.strictEqual(vote.voterRoleId, 'PU-04');
  assert.strictEqual(tally.approve, 1);
  assert.strictEqual(tally.total, 1);
  assert.strictEqual(updatedSession.status, 'EN_DELIBERACION');

  console.log('✅ Voto individual favorable registrado exitosamente y sesión transicionó a EN_DELIBERACION.');
}

// ============================================================================
// TEST 8: Persistencia del voto y consulta de escrutinio
// ============================================================================
console.log('\nTest 8: Persistencia del voto y consulta de escrutinio');
{
  const { rfc } = setupMajorRfcInEvaluation('Actualización de Motor Transaccional');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'RECHAZAR',
      justification: 'Riesgo operacional excesivo en la ventana de cierre contable de fin de año.',
    },
    ccbUser
  );

  const votes = ccbService.getVotesBySessionId(session.id);
  assert.strictEqual(votes.length, 1);
  assert.strictEqual(votes[0].decision, 'RECHAZAR');
  assert.strictEqual(votes[0].voterUserId, ccbUser.id);

  const tally = ccbService.getVoteTally(session.id);
  assert.strictEqual(tally.reject, 1);
  assert.strictEqual(tally.approve, 0);
  assert.strictEqual(tally.total, 1);

  console.log('✅ Persistencia y recuperación de votos en almacenamiento verificadas correctamente.');
}

// ============================================================================
// TEST 9: Prevención de votos duplicados por la misma identidad física
// ============================================================================
console.log('\nTest 9: Prevención de votos duplicados por la misma identidad física');
{
  const { rfc } = setupMajorRfcInEvaluation('Migración de Base de Datos a PostgreSQL');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'APROBAR',
      justification: 'Primera emisión válida de voto favorable.',
    },
    ccbUser
  );

  // Intento de emitir un segundo voto por el mismo usuario
  assert.throws(
    () => {
      ccbService.registerVote(
        {
          sessionId: session.id,
          decision: 'RECHAZAR',
          justification: 'Intento de modificar o duplicar voto.',
        },
        ccbUser
      );
    },
    /Voto duplicado.*ya ha registrado su voto/i,
    'No se debe permitir más de un voto por identidad física.'
  );

  console.log('✅ Control de unicidad de voto validado: cada identidad física emite a lo sumo un único voto.');
}

// ============================================================================
// TEST 10: Rechazo de identidad no perteneciente al comité
// ============================================================================
console.log('\nTest 10: Rechazo de identidad no perteneciente al comité');
{
  const { rfc } = setupMajorRfcInEvaluation('Rediseño de Sistema de Alertas');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  const fakeUser = {
    id: 'USR-999',
    fullName: 'Usuario Espurio',
    roleId: 'PU-04',
    roleLabel: 'Comité de Control de Cambios',
    assignedProjectIds: ['PRJ-001'],
  };

  assert.throws(
    () => {
      ccbService.registerVote(
        {
          sessionId: session.id,
          decision: 'APROBAR',
          justification: 'Voto con cuenta no registrada en catálogo.',
        },
        fakeUser
      );
    },
    /Identidad no autorizada/i,
    'Debe verificar la existencia de la cuenta en el catálogo activo.'
  );

  console.log('✅ Verificación estricta de pertenencia al catálogo CCB confirmada.');
}

// ============================================================================
// TEST 11: Prevención de alteración de identidad del votante
// ============================================================================
console.log('\nTest 11: Prevención de alteración de identidad del votante');
{
  const { rfc } = setupMajorRfcInEvaluation('Refactor de Servicios de Pagos');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  // Se registra voto; la firma proviene siempre de ccbUser
  const { vote } = ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'APROBAR',
      justification: 'Identidad vinculada estrictamente al token/sesión del usuario.',
    },
    ccbUser
  );

  assert.strictEqual(vote.voterUserId, ccbUser.id);
  assert.strictEqual(vote.voterUserName, ccbUser.fullName);

  console.log('✅ Integridad de identidad confirmada: el votante se deriva inmutablemente de la sesión activa.');
}

// ============================================================================
// TEST 12: Registro de abstención fundamentada
// ============================================================================
console.log('\nTest 12: Registro de abstención fundamentada');
{
  const { rfc } = setupMajorRfcInEvaluation('Revisión de Contrato de Pasarela');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  const { vote, tally } = ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'ABSTENCION',
      justification: 'Abstención por haber participado en la redacción de la propuesta técnica preliminar.',
    },
    ccbUser
  );

  assert.strictEqual(vote.decision, 'ABSTENCION');
  assert.strictEqual(tally.abstain, 1);
  assert.strictEqual(tally.approve, 0);
  assert.strictEqual(tally.reject, 0);

  console.log('✅ Opción de abstención fundamentada validada conforme al diseño formal de WF-09.');
}

// ============================================================================
// TEST 13: Conservación del historial de votación multifirmante
// ============================================================================
console.log('\nTest 13: Conservación del historial de votación multifirmante');
{
  const { rfc } = setupMajorRfcInEvaluation('Modernización de Capa de Presentación');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  // Voto 1: Renzo Loyola (USR-004) -> APROBAR
  ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'APROBAR',
      justification: 'Viabilidad operativa comprobada desde la coordinación de proyectos.',
    },
    ccbUser
  );

  // Voto 2: Dr. Ricardo Valcárcel (USR-040) -> APROBAR
  ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'APROBAR',
      justification: 'Dictamen favorable como Presidente del Comité CCB.',
    },
    testCcbMember2
  );

  // Voto 3: Dra. Patricia Solano (USR-041) -> ABSTENCION
  ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'ABSTENCION',
      justification: 'Abstención legal documentada sin objeción técnica.',
    },
    testCcbMember3
  );

  const tally = ccbService.getVoteTally(session.id);
  assert.strictEqual(tally.approve, 2);
  assert.strictEqual(tally.reject, 0);
  assert.strictEqual(tally.abstain, 1);
  assert.strictEqual(tally.total, 3);

  const votes = ccbService.getVotesBySessionId(session.id);
  assert.strictEqual(votes.length, 3);

  console.log('✅ Historial colegiado multifirmante preservado íntegramente con conteo exacto.');
}

// ============================================================================
// TEST 14: Preparación del borrador de acta de deliberación (CU-07)
// ============================================================================
console.log('\nTest 14: Preparación del borrador de acta de deliberación (CU-07)');
{
  const { rfc } = setupMajorRfcInEvaluation('Implementación de Autenticación Biométrica');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'APROBAR',
      justification: 'Voto favorable del comité.',
    },
    ccbUser
  );

  const { resolution } = ccbService.generateDraftResolution(
    {
      sessionId: session.id,
      resolution: 'PENDIENTE',
      justification: 'Borrador de acta de deliberación CCB con votos recepcionados.',
    },
    ccbUser
  );

  assert.ok(resolution.id.startsWith('ACTA-2026-'), 'ID de acta debe iniciar con ACTA-2026-');
  assert.strictEqual(resolution.status, 'BORRADOR');
  assert.strictEqual(resolution.votes.length, 1);
  assert.strictEqual(resolution.tally.total, 1);

  const events = auditService.getAll();
  const draftEvent = events.find((e) => e.action === 'CCB_ACTA_GENERADA');
  assert.ok(draftEvent, 'Debe registrarse evento CCB_ACTA_GENERADA en la bitácora');
  assert.strictEqual(draftEvent.sha256Hash.length, 64);

  console.log('✅ Borrador de acta formal de deliberación confeccionado y persistido correctamente.');
}

// ============================================================================
// TEST 15: Reescalamiento desde CU-30 participa plenamente en el CCB
// ============================================================================
console.log('\nTest 15: Reescalamiento desde CU-30 participa plenamente en el CCB');
{
  // 1. Crear RFC originalmente menor
  const rfcOrigMinor = rfcService.create(
    {
      projectId: 'PRJ-001',
      title: 'Cambio Menor que encubre Riesgo Mayor',
      description: 'Inicialmente catalogado como menor.',
      justification: 'Optimización de interfaz.',
      proposedSolution: 'Modificación de componentes.',
      priority: 'MEDIA',
      category: 'PERFECCIONAMIENTO',
      affectedEcsId: 'ECS-001',
      attachments: [],
    },
    externalRequester
  );

  rfcService.admit(rfcOrigMinor.id, 'Admitida.', gestorUser);

  impactAnalysisService.registerAnalysis(
    {
      rfcId: rfcOrigMinor.id,
      effortHours: 10,
      estimatedCost: 800,
      scheduleImpactDays: 2,
      technicalSummary: 'Dictaminado inicialmente como menor.',
      affectedEcsIds: ['ECS-001'],
      technicalRisk: 'BAJO',
      identifiedRisks: [],
      recommendation: 'PROCEDE_MENOR',
      proposedClassification: 'CAMBIO_MENOR',
      rollbackPlan: 'Rollback rápido.',
    },
    architectUser
  );

  // 2. La Autoridad Delegada en CU-30 decide REESCALAR al CCB
  const { updatedRfc: reescalatedRfc } = minorApprovalService.registerApproval(
    {
      rfcId: rfcOrigMinor.id,
      decision: 'RECHAZADO',
      escalateToCcb: true,
      justification: 'Se detectaron dependencias no declaradas que comprometen la arquitectura; reescalada al CCB.',
    },
    architectUser
  );

  assert.strictEqual(reescalatedRfc.classification, 'CAMBIO_MAYOR');
  assert.strictEqual(reescalatedRfc.status, 'EN_EVALUACION');

  // 3. Apertura de sesión CCB sobre la solicitud reescalada
  const { session } = ccbService.openSession({ rfcId: reescalatedRfc.id }, ccbUser);
  assert.strictEqual(session.rfcId, reescalatedRfc.id);

  // 4. Votación del CCB sobre la solicitud reescalada
  const { vote } = ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'APROBAR',
      justification: 'El CCB asume el expediente reescalado y aprueba la asignación de recursos adicionales.',
    },
    ccbUser
  );

  assert.strictEqual(vote.decision, 'APROBAR');
  console.log('✅ Integración CU-30 -> CU-07 verificada: expediente reescalado procesado exitosamente por el CCB.');
}

// ============================================================================
// TEST 16: Prevención de aprobación automática sin política formal de cuórum
// ============================================================================
console.log('\nTest 16: Prevención de aprobación automática sin política formal de cuórum');
{
  const { rfc } = setupMajorRfcInEvaluation('Evaluación de Política de Cuórum');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  // Registro de voto aprobatorio
  ccbService.registerVote(
    {
      sessionId: session.id,
      decision: 'APROBAR',
      justification: 'Voto favorable del único miembro activo en catálogo.',
    },
    ccbUser
  );

  // Verificamos que la RFC permanezca en EN_EVALUACION y no salte automáticamente a AUTORIZADA
  const currentRfc = rfcService.getById(rfc.id);
  assert.strictEqual(
    currentRfc.status,
    'EN_EVALUACION',
    'La RFC debe permanecer en EN_EVALUACION mientras no exista política formal de cuórum aprobada.'
  );

  console.log('✅ Salvaguarda de gobernanza validada: la RFC no transiciona automáticamente a AUTORIZADA.');
}

// ============================================================================
// TEST 17: Protección contra formalización prematura sin regla reglamentaria
// ============================================================================
console.log('\nTest 17: Protección contra formalización prematura sin regla reglamentaria');
{
  const { rfc } = setupMajorRfcInEvaluation('Prueba de Cierre Definitivo de Resolución');
  const { session } = ccbService.openSession({ rfcId: rfc.id }, ccbUser);

  assert.throws(
    () => {
      ccbService.finalizeResolution(session.id, ccbUser);
    },
    /Bloqueo normativo de gobernanza/i,
    'Debe arrojar la excepción de salvaguarda administrativa mientras la regla no esté definida.'
  );

  console.log('✅ Excepción de bloqueo normativo comprobada: protege el cierre definitivo ante vacíos reglamentarios.');
}

// ============================================================================
// TEST 18: Preservación de las transiciones canónicas de TB-07
// ============================================================================
console.log('\nTest 18: Preservación de las transiciones canónicas de TB-07');
{
  const transitions = rfcService.getAvailableTransitions('EN_EVALUACION');
  assert.deepStrictEqual(
    transitions,
    ['AUTORIZADA', 'RECHAZADA'],
    'Desde EN_EVALUACION solo se permite transicionar a AUTORIZADA o RECHAZADA.'
  );

  console.log('✅ Máquina de estados canónica de TB-07 preservada al 100%.');
}

console.log('\n🎉 TODAS LAS PRUEBAS DE FASE 04C.1 PASARON SATISFACTORIAMENTE (18/18).\n');
