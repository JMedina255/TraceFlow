// Suite de pruebas automatizadas: Refactorización Empresarial RBAC, Identidad, Seguridad y SoD
// TraceFlow SCM — ÉXODO S.A.C.
import assert from 'node:assert';

// 1. Mock in-memory localStorage for Node test runner
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

// 2. Dynamic imports
const { authService } = await import('./auth.service.ts');
const { rfcService } = await import('./rfc.service.ts');
const { projectService } = await import('./project.service.ts');
const { minorApprovalService } = await import('./minorApproval.service.ts');
const { ccbService } = await import('./ccb.service.ts');
const { auditService } = await import('./audit.service.ts');
const { storageService } = await import('./storage.service.ts');
const { useProjectStore } = await import('../store/useProjectStore.ts');

console.log('🧪 Iniciando Suite de Pruebas de Refactorización Empresarial (RBAC, SoD y Seguridad)...\n');

const TEST_AUTH_CREDENTIAL = 'Ephemeral_Test_Secret_2026!';
// Aprovisionamiento local dinámico en memoria para ejecución de pruebas aisladas
for (const acc of authService.getAccounts()) {
  await authService.setLocalPassword(acc.id, TEST_AUTH_CREDENTIAL);
}

// ============================================================================
// TEST 1: Validación de Credenciales Incorrectas
// ============================================================================
console.log('Test 1: Validación de credenciales erróneas (rechazo seguro)');

// Caso A: Contraseña incorrecta para usuario existente
await assert.rejects(
  async () => {
    await authService.authenticate('jmedina@exodo.pe', 'PasswordIncorrecta999!');
  },
  /Credenciales institucionales incorrectas/,
  'Debe rechazar contraseñas incorrectas con mensaje institucional'
);

// Caso B: Correo inexistente en el catálogo
await assert.rejects(
  async () => {
    await authService.authenticate('usuario.ficticio@exodo.pe', TEST_AUTH_CREDENTIAL);
  },
  /Credenciales institucionales incorrectas/,
  'Debe rechazar correos inexistentes sin filtrar si el usuario existe o no'
);

// Caso C: Campos vacíos
await assert.rejects(
  async () => {
    await authService.authenticate('', '');
  },
  /Debe ingresar su correo institucional y su contraseña/,
  'Debe rechazar entradas incompletas'
);
console.log('✅ Validación de credenciales incorrectas verificada exitosamente.\n');

// ============================================================================
// TEST 2: Inicio y Cierre de Sesión Formal
// ============================================================================
console.log('Test 2: Inicio y cierre de sesión formal con hash SHA-256');

// Autenticación legítima de Joan Medina (USR-001) con rol primario PU-02
const authResult = await authService.authenticate('jmedina@exodo.pe', TEST_AUTH_CREDENTIAL, 'PU-02');
assert.ok(authResult.sessionToken, 'Debe generar token de sesión opaco');
assert.strictEqual(authResult.account.id, 'USR-001');
assert.strictEqual(authResult.effectiveRoleId, 'PU-02');
assert.strictEqual(authResult.sessionUser.role, 'GESTOR');
assert.ok(authResult.expiresAt > Date.now(), 'Token debe tener expiración futura');

// Cierre de sesión formal
authService.logout();
assert.strictEqual(authService.validatePersistedSession(), null, 'Tras logout la sesión debe ser nula');
console.log('✅ Ciclo de vida de inicio y cierre de sesión verificado.\n');

// ============================================================================
// TEST 3: Restricción contra Adopción de Roles No Asignados
// ============================================================================
console.log('Test 3: Restricción contra adopción de roles no asignados a la cuenta');

// Renzo Loyola (USR-004) solo tiene asignado PU-04 (CCB). Intentar iniciar como PU-06 (Desarrollador)
const renzoAuth = await authService.authenticate('rloyola@exodo.pe', TEST_AUTH_CREDENTIAL, 'PU-06');
assert.strictEqual(
  renzoAuth.effectiveRoleId,
  'PU-04',
  'El servicio debe forzar el rol primario autorizado (PU-04) e impedir la adopción de PU-06'
);
assert.strictEqual(renzoAuth.sessionUser.role, 'CCB');
console.log('✅ Bloqueo de adopción de roles no autorizados verificado.\n');

// ============================================================================
// TEST 4: Política de Seguridad Default-Deny para Acceso por URL
// ============================================================================
console.log('Test 4: Política de denegación por defecto (Default-Deny) para rutas no declaradas');

// Rutas no registradas deben denegar acceso a TODOS los roles
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-01', '/admin/secret-backdoor'), false);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-05', '/sistema/debug/privilegios'), false);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-02', '/ruta-inexistente'), false);

// getRouteAllowedRoles retorna arreglo vacío para rutas desconocidas
assert.deepStrictEqual(
  authService.getRouteAllowedRoles('/ruta-no-mapeada'),
  [],
  'Rutas no declaradas deben retornar [] (denegación absoluta)'
);

// Coincidencia con rutas parametrizadas registradas
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-02', '/projects/PRJ-001'), true);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-01', '/projects/PRJ-001'), false);
console.log('✅ Política de Default-Deny verificada: rutas no declaradas denegadas por defecto.\n');

// ============================================================================
// TEST 5: Cambio de Proyecto No Autorizado (Multitenancy)
// ============================================================================
console.log('Test 5: Aislamiento multitenant por proyecto (USR-004 denegado para PRJ-003)');

const renzoAccount = authService.getAccountById('USR-004');
assert.ok(renzoAccount);
assert.deepStrictEqual(renzoAccount.assignedProjectIds, ['PRJ-001', 'PRJ-002']);

// projectService.getById deniega acceso a PRJ-003 para USR-004
assert.strictEqual(projectService.getById('PRJ-001', renzoAccount)?.id, 'PRJ-001');
assert.strictEqual(
  projectService.getById('PRJ-003', renzoAccount),
  undefined,
  'USR-004 no debe poder consultar la ficha de PRJ-003'
);

// useProjectStore rechaza conmutación al proyecto PRJ-003 para USR-004
const renzoSessionUser = {
  ...renzoAccount,
  roleId: 'PU-04',
  role: 'CCB',
  roleLabel: 'Comité de Control de Cambios',
  allowedRoleIds: ['PU-04'],
};

const projectStore = useProjectStore.getState();
projectStore.setActiveProject('PRJ-001', renzoSessionUser);
assert.strictEqual(useProjectStore.getState().activeProject.id, 'PRJ-001');

// Intento no autorizado de cambiar a PRJ-003
projectStore.setActiveProject('PRJ-003', renzoSessionUser);
assert.strictEqual(
  useProjectStore.getState().activeProject.id,
  'PRJ-001',
  'El store debe rechazar conmutar al proyecto PRJ-003 si el usuario no tiene permiso'
);

// rfcService.create deniega registrar RFC en un proyecto no asignado al usuario
const unassignedSolicitante = {
  ...renzoSessionUser,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  allowedRoleIds: ['PU-01'],
};
assert.throws(
  () => {
    rfcService.create(
      {
        projectId: 'PRJ-003',
        title: 'Intento Ilegítimo de Creación en Proyecto Ajeno',
        description: 'Descripción de prueba para verificar bloqueo multitenant a nivel de servicio.',
        justification: 'Justificación operativa de prueba para verificación multitenant.',
        priority: 'BAJA',
        category: 'CORRECTIVO',
        affectedEcsId: 'ECS-001',
      },
      unassignedSolicitante
    );
  },
  /Acceso denegado \(Proyecto\)/,
  'rfcService.create debe rechazar registrar solicitudes en proyectos no asignados'
);

console.log('✅ Aislamiento multitenant de proyectos verificado exitosamente.\n');

// ============================================================================
// TEST 6: Restricción de Consulta de RFC Ajena para Solicitante (PU-01)
// ============================================================================
console.log('Test 6: Consulta de RFC restringida por propiedad (Ownership) para Solicitante');

const joanAccount = authService.getAccountById('USR-001');
const solicitanteUser = {
  ...joanAccount,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  allowedRoleIds: joanAccount.assignedRoleIds,
};

// Crear una RFC perteneciente a USR-001
const rfcPropia = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Actualización de Certificado SSL de Pasarela',
    description: 'Renovación de certificados X.509 antes del vencimiento anual.',
    justification: 'Continuidad operacional del servicio de pagos en línea.',
    priority: 'MEDIA',
    category: 'ADAPTATIVO',
    affectedEcsId: 'ECS-001',
  },
  solicitanteUser
);

// Consulta propia permitida
const rfcConsultada = rfcService.getById(rfcPropia.id, solicitanteUser);
assert.ok(rfcConsultada);
assert.strictEqual(rfcConsultada.id, rfcPropia.id);

// Simular otro solicitante (ej. USR-EXTERNO) que intenta consultar la RFC de USR-001
const otroSolicitante = {
  id: 'USR-EXTERNO',
  username: 'otro_user',
  fullName: 'Otro Solicitante Distinto',
  email: 'otro@exodo.pe',
  organization: 'ÉXODO S.A.C.',
  isActive: true,
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  allowedRoleIds: ['PU-01'],
  assignedRoleIds: ['PU-01'],
  assignedProjectIds: ['PRJ-001'],
};

assert.throws(
  () => {
    rfcService.getById(rfcPropia.id, otroSolicitante);
  },
  /Acceso denegado \(Propiedad\)/,
  'Un solicitante no debe poder consultar expedientes registrados por otros usuarios'
);
console.log('✅ Restricción de propiedad (Ownership) para Solicitante comprobada.\n');

// ============================================================================
// TEST 7: Doble Llave de Cambios Menores con Identidades Distintas (CU-30)
// ============================================================================
console.log('Test 7: Doble Llave en Cambios Menores con exigencia de dos identidades distintas');

// Preparar una RFC clasificada como CAMBIO_MENOR en EN_EVALUACION con informe técnico
const allRfcs = storageService.get('rfcs', []);
const rfcMenor = {
  id: 'RFC-2026-TEST-MENOR',
  code: 'RFC-2026-TEST-MENOR',
  projectId: 'PRJ-001',
  projectName: 'Pasarela de Pagos Core',
  requesterId: 'USR-SOLICITANTE-TEST',
  requesterName: 'Solicitante de Pruebas',
  title: 'Ajuste de textos en pantalla de confirmación',
  description: 'Modificación de tipografía y labels en vista de pago exitoso.',
  justification: 'Mejora de experiencia de usuario validada por marketing.',
  priority: 'BAJA',
  category: 'PERFECTIVO',
  affectedEcsId: 'ECS-001',
  affectedEcsName: 'SRC-AUTH-JWT.ts',
  status: 'EN_EVALUACION',
  classification: 'CAMBIO_MENOR',
  impactAnalysisId: 'TIA-2026-TEST',
  technicalImpact: {
    id: 'TIA-2026-TEST',
    classification: 'CAMBIO_MENOR',
    estimatedEffortHours: 4,
    estimatedCost: 200,
    estimatedDurationDays: 1,
    technicalRisk: 'BAJO',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
storageService.set('rfcs', [rfcMenor, ...allRfcs]);

// Firma 1: Gestor Joan Medina (USR-001 con PU-02)
const gestorEvaluador = {
  ...joanAccount,
  roleId: 'PU-02',
  role: 'GESTOR',
  roleLabel: 'Analista de Requerimientos / Gestor',
  allowedRoleIds: joanAccount.assignedRoleIds,
};

const approvalGestor = minorApprovalService.registerApproval(
  {
    rfcId: rfcMenor.id,
    decision: 'APROBADO',
    justification: 'Visto bueno funcional emitido tras verificar ausencia de conflictos con roadmap.',
  },
  gestorEvaluador
);
assert.strictEqual(approvalGestor.record.role, 'GESTOR');
assert.strictEqual(approvalGestor.delegatedStatus.overallStatus, 'PENDIENTE');

// Intento de la MISMA persona física (USR-001 alternando a PU-03) de firmar la segunda llave
const joanComoArquitecto = {
  ...joanAccount,
  roleId: 'PU-03',
  role: 'ARQUITECTO',
  roleLabel: 'Arquitecto',
  allowedRoleIds: ['PU-03'],
};

assert.throws(
  () => {
    minorApprovalService.registerApproval(
      {
        rfcId: rfcMenor.id,
        decision: 'APROBADO',
        justification: 'Intento de firmar ambas llaves por la misma persona física.',
      },
      joanComoArquitecto
    );
  },
  /Violación de Segregación de Funciones por Identidad/,
  'La Doble Llave debe rechazar que la misma persona física complete ambas conformidades'
);

// Firma legítima de la segunda llave por una persona distinta: Renzo Antayhua (USR-002 con PU-03)
const renzoAccountObj = authService.getAccountById('USR-002');
const arquitectoRenzo = {
  ...renzoAccountObj,
  roleId: 'PU-03',
  role: 'ARQUITECTO',
  roleLabel: 'Arquitecto de Software Principal',
  allowedRoleIds: renzoAccountObj.assignedRoleIds,
};

const approvalFinal = minorApprovalService.registerApproval(
  {
    rfcId: rfcMenor.id,
    decision: 'APROBADO',
    justification: 'Visto bueno técnico de arquitectura: no afecta contratos de API ni BD.',
  },
  arquitectoRenzo
);

assert.strictEqual(approvalFinal.delegatedStatus.overallStatus, 'AUTORIZADA');
assert.strictEqual(approvalFinal.updatedRfc.status, 'AUTORIZADA');
console.log('✅ Doble Llave con identidades distintas verificada: cambio menor autorizado.\n');

// ============================================================================
// TEST 8: Antiautoevaluación del Solicitante (SoD)
// ============================================================================
console.log('Test 8: Antiautoevaluación: El solicitante no puede aprobar su propio requerimiento');

// RFC creada por Joan Medina (USR-001)
const rfcDeJoan = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Nueva funcionalidad propuesta por Joan',
    description: 'Descripción detallada de la necesidad funcional.',
    justification: 'Fundamentación de negocio de prueba de antiautoevaluación.',
    priority: 'MEDIA',
    category: 'ADAPTATIVO',
    affectedEcsId: 'ECS-001',
  },
  solicitanteUser
);

// Establecer en estado EN_EVALUACION con CAMBIO_MENOR
const rfcsList = storageService.get('rfcs', []);
const rfcParaEval = rfcsList.find((r) => r.id === rfcDeJoan.id);
rfcParaEval.status = 'EN_EVALUACION';
rfcParaEval.classification = 'CAMBIO_MENOR';
rfcParaEval.impactAnalysisId = 'TIA-2026-TEST';
rfcParaEval.technicalImpact = { id: 'TIA-2026-TEST', classification: 'CAMBIO_MENOR' };
storageService.set('rfcs', rfcsList);

// Joan (USR-001 con PU-02) intenta autorizar su propio cambio
assert.throws(
  () => {
    minorApprovalService.registerApproval(
      {
        rfcId: rfcDeJoan.id,
        decision: 'APROBADO',
        justification: 'Intento de auto-aprobación como Gestor de su propio requerimiento.',
      },
      gestorEvaluador
    );
  },
  /es el solicitante original.*tiene prohibido emitir la autorización de su propio requerimiento/,
  'El solicitante original tiene prohibido autorizar su propia RFC'
);
console.log('✅ Antiautoevaluación comprobada: Solicitante no puede auto-aprobarse.\n');

// ============================================================================
// TEST 9: Deliberación CCB sin Proyecto Asignado (Aislamiento de Proyecto)
// ============================================================================
console.log('Test 9: Deliberación CCB: Bloqueo de miembros sin asignación al proyecto');

// Renzo Loyola (USR-004) NO tiene asignado PRJ-003. Intentar deliberar sobre RFC de PRJ-003
const rfcDePrj003 = {
  id: 'RFC-PRJ003-CCB-TEST',
  code: 'RFC-PRJ003-CCB-TEST',
  projectId: 'PRJ-003', // Proyecto de Facturación Electrónica SUNAT
  projectName: 'Facturación Electrónica SUNAT',
  requesterId: 'USR-EXTERNO',
  title: 'Actualización de Schemas UBL 2.1',
  description: 'Alineamiento con normativa tributaria SUNAT 2026.',
  justification: 'Obligación fiscal legal de facturación electrónica.',
  priority: 'CRITICA',
  category: 'ADAPTATIVO',
  affectedEcsId: 'ECS-001',
  status: 'EN_EVALUACION',
  classification: 'CAMBIO_MAYOR',
  impactAnalysisId: 'TIA-PRJ003-01',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
storageService.set('rfcs', [rfcDePrj003, ...storageService.get('rfcs', [])]);

// Inyectar informe técnico para PRJ-003
storageService.set('impact_reports', [
  {
    id: 'TIA-PRJ003-01',
    rfcId: rfcDePrj003.id,
    projectId: 'PRJ-003',
    classification: 'CAMBIO_MAYOR',
    createdAt: new Date().toISOString(),
  },
]);

// Intento de apertura de sesión CCB por USR-004 sobre PRJ-003 debe ser denegado
assert.throws(
  () => {
    ccbService.openSession(
      {
        rfcId: rfcDePrj003.id,
      },
      renzoSessionUser
    );
  },
  /Acceso restringido por proyecto/,
  'Miembro del CCB no puede operar sobre proyectos que no tenga asignados'
);
console.log('✅ Aislamiento de proyecto en CCB verificado exitosamente.\n');

// ============================================================================
// TEST 10: Incompatibilidad Desarrollo vs. Calidad QA (RN-09)
// ============================================================================
console.log('Test 10: Incompatibilidad Desarrollo (PU-06) vs. Calidad QA (PU-07)');

// RN-09: El desarrollador no puede certificar su propio cambio ni ejecutar VALIDACION_QA
assert.strictEqual(
  authService.isActionAuthorized('PU-06', 'VALIDACION_QA'),
  false,
  'El rol Desarrollador (PU-06) NO debe tener autorizado VALIDACION_QA'
);
assert.strictEqual(
  authService.isActionAuthorized('PU-07', 'VALIDACION_QA'),
  true,
  'El rol Calidad (PU-07) debe tener autorizado VALIDACION_QA'
);

assert.throws(
  () => {
    authService.assertActionAuthorized('PU-06', 'VALIDACION_QA');
  },
  /Operación denegada \(SoD\)/
);
console.log('✅ Incompatibilidad SoD Desarrollo vs Calidad QA verificada.\n');

// ============================================================================
// TEST 11: Persistencia y Restauración de Sesión Segura
// ============================================================================
console.log('Test 11: Persistencia y restauración de sesión segura');

// Iniciar sesión con Augusto Rivera (USR-003 con PU-05 Bibliotecario)
const augustoAuth = await authService.authenticate('arivera@exodo.pe', TEST_AUTH_CREDENTIAL, 'PU-05');
assert.strictEqual(augustoAuth.sessionUser.id, 'USR-003');
assert.strictEqual(augustoAuth.effectiveRoleId, 'PU-05');

// Validar que validatePersistedSession restaura correctamente la sesión
const restored = authService.validatePersistedSession();
assert.ok(restored);
assert.strictEqual(restored.user.id, 'USR-003');
assert.strictEqual(restored.roleId, 'PU-05');

// Simular expiración de sesión
storageService.set('traceflow_session_expires_at', Date.now() - 1000); // Expirado hace 1 seg
const expiredSession = authService.validatePersistedSession();
assert.strictEqual(expiredSession, null, 'Sesión expirada debe limpiarse automáticamente');
console.log('✅ Persistencia, expiración y restauración de sesión validadas.\n');

// ============================================================================
// TEST 12: Compatibilidad con las Reglas SCM Existentes y Máquina de Estados
// ============================================================================
console.log('Test 12: Compatibilidad con reglas SCM, transiciones TB-07 e integridad SHA-256');

// Máquina de estados oficial TB-07
assert.strictEqual(rfcService.isTransitionAllowed('REGISTRADA', 'CLASIFICADA'), true);
assert.strictEqual(rfcService.isTransitionAllowed('REGISTRADA', 'EN_SUBSANACION'), true);
assert.strictEqual(rfcService.isTransitionAllowed('REGISTRADA', 'AUTORIZADA'), false);
assert.strictEqual(rfcService.isTransitionAllowed('AUTORIZADA', 'ORDEN_EMITIDA'), true);
assert.strictEqual(rfcService.isTransitionAllowed('EN_EVALUACION', 'AUTORIZADA'), true);
assert.strictEqual(rfcService.isTransitionAllowed('EN_EVALUACION', 'RECHAZADA'), true);

// Integridad forense de eventos de auditoría append-only
const testEvent = auditService.record({
  action: 'EVALUACION_SEGURIDAD_EMPRESARIAL',
  entityType: 'SEGURIDAD',
  entityId: 'SEC-2026-0001',
  userId: 'USR-001',
  userName: 'Joan Cristian Medina Quispe',
  userRole: 'Analista de Requerimientos / Gestor',
  details: 'Auditoría integral de controles RBAC, SoD y autenticación corporativa.',
  ipAddress: '192.168.1.100',
});

assert.ok(testEvent.id);
assert.ok(testEvent.sha256Hash);
assert.strictEqual(testEvent.sha256Hash.length, 64, 'La firma criptográfica debe ser un hash de 64 caracteres');
console.log('✅ Compatibilidad con reglas SCM e integridad SHA-256 verificada al 100%.\n');

console.log('🎉 TODAS LAS 12 PRUEBAS DE LA SUITE ENTERPRISE RBAC & SECURITY PASARON EXITOSAMENTE (12/12).');
