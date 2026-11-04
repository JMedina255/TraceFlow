// Test de verificación de Fase 02: Identidades, Usuarios y Perfiles (TraceFlow SCM)
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
const { storageService } = await import('./storage.service.ts');
const { useAuthStore } = await import('../store/useAuthStore.ts');
const { CANONICAL_ROLES } = await import('../types/auth.ts');

console.log('🧪 Iniciando pruebas de Fase 02: Identidades, Usuarios, Perfiles y SoD...\n');

// ============================================================================
// TEST 1: Catálogo de Identidades Corporativas y Roles Asignados
// ============================================================================
console.log('Test 1: Integridad del catálogo de cuentas e identidades organizacionales');
const accounts = authService.getAccounts();
assert.strictEqual(accounts.length, 4, 'Deben existir exactamente 4 identidades de evaluación');

const accountIds = accounts.map((a) => a.id);
assert.deepStrictEqual(accountIds, ['USR-001', 'USR-002', 'USR-003', 'USR-004'], 'IDs de cuenta deben coincidir con la nómina');

for (const acc of accounts) {
  assert.ok(acc.fullName && acc.fullName.length > 5, `Cuenta ${acc.id} debe tener nombre completo`);
  assert.ok(acc.email && acc.email.endsWith('@exodo.pe'), `Cuenta ${acc.id} debe tener correo institucional @exodo.pe`);
  assert.strictEqual(acc.organization, 'ÉXODO S.A.C.', `Cuenta ${acc.id} debe pertenecer a ÉXODO S.A.C.`);
  assert.ok(acc.assignedRoleIds.length >= 1, `Cuenta ${acc.id} debe tener al menos un rol asignado`);
  assert.ok(acc.assignedRoleIds.includes(acc.primaryRoleId), `El rol primario de ${acc.id} debe estar en assignedRoleIds`);

  // Verificar que todos los roles asignados existen en la taxonomía canónica
  for (const rId of acc.assignedRoleIds) {
    assert.ok(CANONICAL_ROLES[rId], `El rol ${rId} asignado a ${acc.id} debe ser un rol canónico válido`);
  }
}
console.log('✅ Integridad del catálogo de cuentas validada exitosamente.\n');

// ============================================================================
// TEST 2: Establecimiento de Sesión y Rol Efectivo Único
// ============================================================================
console.log('Test 2: Inicio de sesión con cuenta y rol efectivo único');
const store = useAuthStore.getState();

// USR-001 (Joan Medina) inicia sesión con rol efectivo PU-02 (Gestor)
store.loginWithAccount(accounts[0], 'PU-02');
let currentSession = useAuthStore.getState();

assert.strictEqual(currentSession.isAuthenticated, true, 'Sesión debe estar autenticada');
assert.strictEqual(currentSession.currentUser?.id, 'USR-001', 'ID de usuario debe ser USR-001');
assert.strictEqual(currentSession.activeRoleId, 'PU-02', 'Rol activo debe ser exactamente PU-02');
assert.strictEqual(currentSession.activeRole, 'GESTOR', 'Enum de rol activo debe ser GESTOR');
assert.strictEqual(currentSession.currentUser?.roleId, 'PU-02', 'Rol efectivo de sesión debe ser PU-02');

// Persistencia en storageService
assert.strictEqual(storageService.get('active_demo_user_id', null), 'USR-001', 'active_demo_user_id debe estar persistido');
assert.strictEqual(storageService.get('active_demo_role_id', null), 'PU-02', 'active_demo_role_id debe estar persistido');
console.log('✅ Sesión establecida correctamente con un único rol efectivo (PU-02 Gestor).\n');

// ============================================================================
// TEST 3: Restricción contra Adopción de Roles No Asignados
// ============================================================================
console.log('Test 3: Restricción contra adopción de roles no asignados a la cuenta');
// USR-004 (Renzo Loyola) solo tiene PU-04 (CCB). Intentar iniciar como PU-06 (Desarrollador)
const renzoAccount = accounts.find((a) => a.id === 'USR-004');
assert.ok(renzoAccount);
assert.deepStrictEqual(renzoAccount.assignedRoleIds, ['PU-04'], 'Renzo Loyola solo tiene PU-04 asignado');

// Al solicitar un rol no asignado (PU-06), el store debe rechazarlo y asignar su rol primario (PU-04)
store.loginWithAccount(renzoAccount, 'PU-06');
currentSession = useAuthStore.getState();

assert.strictEqual(currentSession.activeRoleId, 'PU-04', 'No debe permitir adoptar PU-06; debe forzar PU-04');
assert.strictEqual(currentSession.activeRole, 'CCB', 'Rol efectivo debe mantenerse en CCB');
console.log('✅ Protección de asignación de roles validada: roles no autorizados son bloqueados.\n');

// ============================================================================
// TEST 4: Cierre de Sesión y Estado Sin Identidad (Sesión Anónima)
// ============================================================================
console.log('Test 4: Cierre de sesión y estado sin identidad');
store.logout();
currentSession = useAuthStore.getState();

assert.strictEqual(currentSession.isAuthenticated, false, 'isAuthenticated debe ser false tras logout');
assert.strictEqual(currentSession.currentUser, null, 'currentUser debe ser null tras logout');
assert.strictEqual(currentSession.activeRoleId, null, 'activeRoleId debe ser null tras logout');
assert.strictEqual(currentSession.activeRole, null, 'activeRole debe ser null tras logout');
assert.strictEqual(storageService.get('active_demo_user_id', null), null, 'LocalStorage de usuario debe eliminarse');
assert.strictEqual(storageService.get('active_demo_role_id', null), null, 'LocalStorage de rol debe eliminarse');
console.log('✅ Cierre de sesión y restablecimiento de estado sin identidad verificados.\n');

// ============================================================================
// TEST 5: Matriz de Permisos por Ruta para Protección de Navegación (RouteGuard)
// ============================================================================
console.log('Test 5: Validación de permisos por ruta según roles canónicos');

// /rfcs/new solo autorizado para PU-01 (Solicitante)
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-01', '/rfcs/new'), true);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-02', '/rfcs/new'), false);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-03', '/rfcs/new'), false);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-04', '/rfcs/new'), false);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-05', '/rfcs/new'), false);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-06', '/rfcs/new'), false);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-07', '/rfcs/new'), false);

// /rfcs/:rfcId/impact-analysis solo autorizado para PU-03 (Arquitecto)
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-03', '/rfcs/:rfcId/impact-analysis'), true);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-01', '/rfcs/:rfcId/impact-analysis'), false);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-04', '/rfcs/:rfcId/impact-analysis'), false);

// /rfcs/:rfcId/ccb-deliberation solo autorizado para PU-04 (CCB)
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-04', '/rfcs/:rfcId/ccb-deliberation'), true);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-06', '/rfcs/:rfcId/ccb-deliberation'), false);

// /scm/operations y /baselines solo autorizado para PU-05 (Bibliotecario)
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-05', '/scm/operations'), true);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-06', '/scm/operations'), false);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-05', '/baselines'), true);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-01', '/baselines'), false);

// /qa/validation/:rfcId solo autorizado para PU-07 (Calidad)
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-07', '/qa/validation/:rfcId'), true);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-06', '/qa/validation/:rfcId'), false);

// /dashboard abierto a todos los perfiles autenticados
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-01', '/dashboard'), true);
assert.strictEqual(authService.isRoleAuthorizedForRoute('PU-05', '/dashboard'), true);
console.log('✅ Matriz de permisos de navegación por ruta validada correctamente.\n');

// ============================================================================
// TEST 6: Aislamiento de Acceso a Proyectos (Multitenancy)
// ============================================================================
console.log('Test 6: Aislamiento de acceso a proyectos por usuario');
const joan = accounts[0]; // Asignado a PRJ-001, PRJ-002, PRJ-003
const renzo = accounts[3]; // USR-004 asignado solo a PRJ-001, PRJ-002

assert.strictEqual(authService.canUserAccessProject(joan, 'PRJ-001'), true);
assert.strictEqual(authService.canUserAccessProject(joan, 'PRJ-002'), true);
assert.strictEqual(authService.canUserAccessProject(joan, 'PRJ-003'), true);

assert.strictEqual(authService.canUserAccessProject(renzo, 'PRJ-001'), true);
assert.strictEqual(authService.canUserAccessProject(renzo, 'PRJ-002'), true);
assert.strictEqual(
  authService.canUserAccessProject(renzo, 'PRJ-003'),
  false,
  'Renzo Loyola (USR-004) NO debe tener acceso al proyecto PRJ-003'
);
console.log('✅ Aislamiento de acceso a proyectos validado: USR-004 denegado para PRJ-003.\n');

// ============================================================================
// TEST 7: Reglas de Negocio SoD e Incompatibilidades Normativas
// ============================================================================
console.log('Test 7: Segregación de Funciones (SoD) e incompatibilidades operativas');

// RN-04: El desarrollador no puede custodiar la biblioteca ni hacer Check-In en Master
assert.strictEqual(authService.isActionAuthorized('PU-06', 'CHECK_IN'), false);
assert.strictEqual(authService.isActionAuthorized('PU-05', 'CHECK_IN'), true);

// RN-09: El desarrollador no puede auto-aprobarse ni validar su propio QA
assert.strictEqual(authService.isActionAuthorized('PU-06', 'VALIDACION_QA'), false);
assert.strictEqual(authService.isActionAuthorized('PU-07', 'VALIDACION_QA'), true);

// Incompatibilidad: Solicitante no puede deliberar en CCB
assert.strictEqual(authService.isActionAuthorized('PU-01', 'EVALUAR_CCB'), false);
assert.strictEqual(authService.isActionAuthorized('PU-04', 'EVALUAR_CCB'), true);

// assertActionAuthorized lanza excepción descriptiva
assert.throws(
  () => authService.assertActionAuthorized('PU-06', 'CHECK_IN'),
  /Operación denegada \(SoD\)/
);
console.log('✅ Reglas de incompatibilidad SoD y excepciones comprobadas.\n');

// ============================================================================
// TEST 8: Flujo Integral de Creación de RFC según Rol Efectivo Activo
// ============================================================================
console.log('Test 8: Registro de RFC restringido al rol efectivo');

// Caso A: Usuario opera con rol efectivo PU-02 (Gestor) -> Intento de crear RFC rechazado
const gestorSessionUser = {
  ...accounts[0],
  roleId: 'PU-02',
  role: 'GESTOR',
  roleLabel: 'Analista de Requerimientos / Gestor',
  allowedRoleIds: accounts[0].assignedRoleIds,
};

assert.throws(
  () => {
    rfcService.create(
      {
        projectId: 'PRJ-001',
        title: 'Intento no autorizado de creación por Gestor',
        description: 'Descripción descriptiva con suficiente longitud para validación.',
        justification: 'Justificación fundamentada de prueba de segregación.',
        proposedSolution: 'Solución técnica tentativa.',
        priority: 'MEDIA',
        category: 'CORRECTIVO',
        affectedEcsId: 'ECS-001',
        attachments: [],
      },
      gestorSessionUser
    );
  },
  /Operación denegada \(SoD\)/,
  'El servicio debe rechazar el registro si el rol efectivo es PU-02'
);

// Caso B: Usuario inicia sesión con rol efectivo PU-01 (Solicitante) -> Registro exitoso
const solicitanteSessionUser = {
  ...accounts[0],
  roleId: 'PU-01',
  role: 'SOLICITANTE',
  roleLabel: 'Solicitante',
  allowedRoleIds: accounts[0].assignedRoleIds,
};

const newRfc = rfcService.create(
  {
    projectId: 'PRJ-001',
    title: 'Actualización de Protocolo TLS en Pasarela',
    description: 'Actualización obligatoria a TLS 1.3 por requerimiento normativo de seguridad.',
    justification: 'Cumplimiento de estándares de seguridad PCI-DSS y prevención de vulnerabilidades.',
    proposedSolution: 'Modificar configuración de cipher suites y módulos de cifrado.',
    priority: 'ALTA',
    category: 'ADAPTATIVO',
    affectedEcsId: 'ECS-001',
    attachments: ['certificado_tls_2026.pem'],
  },
  solicitanteSessionUser
);

assert.ok(newRfc.id);
assert.strictEqual(newRfc.status, 'REGISTRADA');
assert.strictEqual(newRfc.requesterId, 'USR-001');
assert.strictEqual(newRfc.requesterName, 'Joan Cristian Medina Quispe');
console.log(`✅ Registro de RFC exitoso con rol efectivo PU-01: ${newRfc.code} (${newRfc.title}).\n`);

console.log('🎉 TODAS LAS PRUEBAS DE FASE 02 PASARON SATISFACTORIAMENTE (8/8).');
