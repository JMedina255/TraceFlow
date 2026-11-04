// Test de verificación de Fase 03: Navegación Contextual por Perfil (TraceFlow SCM)
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

// 2. Dynamic imports
const { authService } = await import('./auth.service.ts');
const { 
  getNavigationForRole, 
  isRouteAuthorizedForRole 
} = await import('../routes/navigation.ts');
const { INITIAL_USER_ACCOUNTS } = await import('../data/initialUsers.ts');

console.log('🧪 Iniciando pruebas de Fase 03: Navegación Contextual por Perfil y SSOT...\n');

// ============================================================================
// TEST 1: Navegación Contextual para PU-01 (Solicitante)
// ============================================================================
console.log('Test 1: Menú contextual para PU-01 (Solicitante)');
const navPU01 = getNavigationForRole('PU-01');
const sectionIdsPU01 = navPU01.map((s) => s.id);

// Secciones permitidas
assert.deepStrictEqual(
  sectionIdsPU01.sort(),
  ['general', 'changes', 'support'].sort(),
  'PU-01 solo debe visualizar las secciones General, Control de Cambios y Soporte'
);

const allPathsPU01 = navPU01.flatMap((s) => s.items.map((i) => i.path));
assert.ok(allPathsPU01.includes('/dashboard'), 'PU-01 debe tener Dashboard');
assert.ok(allPathsPU01.includes('/rfcs'), 'PU-01 debe tener Bandeja de RFCs');
assert.ok(allPathsPU01.includes('/rfcs/new'), 'PU-01 debe tener acceso directo a Nueva RFC');
assert.ok(allPathsPU01.includes('/incidents'), 'PU-01 debe tener Mesa de Incidencias');

// Módulos no autorizados ausentes
assert.strictEqual(allPathsPU01.includes('/scm/operations'), false, 'PU-01 NO debe ver Operaciones SCM');
assert.strictEqual(allPathsPU01.includes('/admin/users'), false, 'PU-01 NO debe ver Administración de Usuarios');
assert.strictEqual(allPathsPU01.includes('/projects'), false, 'PU-01 NO debe ver Directorio de Proyectos');
assert.strictEqual(allPathsPU01.includes('/ecs'), false, 'PU-01 NO debe ver Catálogo de ECS');
assert.strictEqual(allPathsPU01.includes('/audit'), false, 'PU-01 NO debe ver Auditoría Forense');
console.log('✅ Menú contextual de Solicitante (PU-01) validado: solo módulos pertinentes.\n');

// ============================================================================
// TEST 2: Navegación Contextual para PU-02 (Gestor de Cambios)
// ============================================================================
console.log('Test 2: Menú contextual para PU-02 (Gestor de Cambios)');
const navPU02 = getNavigationForRole('PU-02');
const sectionIdsPU02 = navPU02.map((s) => s.id);

assert.ok(sectionIdsPU02.includes('projects'), 'PU-02 debe tener Gestión de Proyectos');
assert.ok(sectionIdsPU02.includes('changes'), 'PU-02 debe tener Control de Cambios');
assert.ok(sectionIdsPU02.includes('support'), 'PU-02 debe tener Soporte e Incidencias');
assert.ok(sectionIdsPU02.includes('audit'), 'PU-02 debe tener Trazabilidad y Auditoría');
assert.ok(sectionIdsPU02.includes('reports'), 'PU-02 debe tener Reportes');

const allPathsPU02 = navPU02.flatMap((s) => s.items.map((i) => i.path));
assert.ok(allPathsPU02.includes('/projects'));
assert.ok(allPathsPU02.includes('/rfcs'));
assert.ok(allPathsPU02.includes('/ecns'));

// SoD: El Gestor NO crea solicitudes RFC directamente (atribución de PU-01)
assert.strictEqual(allPathsPU02.includes('/rfcs/new'), false, 'PU-02 NO debe tener la opción de Nueva RFC en el menú');
assert.strictEqual(allPathsPU02.includes('/scm/operations'), false, 'PU-02 NO debe tener Operaciones SCM (exclusivo PU-05)');
assert.strictEqual(allPathsPU02.includes('/admin/users'), false, 'PU-02 NO debe tener Administración de Usuarios (exclusivo PU-05)');
console.log('✅ Menú contextual de Gestor (PU-02) validado: respeta restricciones SoD.\n');

// ============================================================================
// TEST 3: Navegación Contextual para PU-03 (Arquitecto) y PU-04 (CCB)
// ============================================================================
console.log('Test 3: Menús contextuales para PU-03 (Arquitecto) y PU-04 (CCB)');
const navPU03 = getNavigationForRole('PU-03');
const allPathsPU03 = navPU03.flatMap((s) => s.items.map((i) => i.path));
assert.ok(allPathsPU03.includes('/ecs'), 'PU-03 debe tener Catálogo de ECS');
assert.ok(allPathsPU03.includes('/projects'), 'PU-03 debe tener Proyectos');
assert.strictEqual(allPathsPU03.includes('/scm/operations'), false, 'PU-03 NO debe ver Operaciones SCM');
assert.strictEqual(allPathsPU03.includes('/admin/users'), false, 'PU-03 NO debe ver Usuarios');

const navPU04 = getNavigationForRole('PU-04');
const allPathsPU04 = navPU04.flatMap((s) => s.items.map((i) => i.path));
assert.ok(allPathsPU04.includes('/rfcs'), 'PU-04 debe tener Bandeja de RFCs');
assert.ok(allPathsPU04.includes('/ecns'), 'PU-04 debe tener Órdenes ECN');
assert.ok(allPathsPU04.includes('/audit'), 'PU-04 debe tener Auditoría');
assert.ok(allPathsPU04.includes('/reports'), 'PU-04 debe tener Reportes');
assert.strictEqual(allPathsPU04.includes('/scm/operations'), false, 'PU-04 NO debe ver Operaciones SCM');
assert.strictEqual(allPathsPU04.includes('/admin/users'), false, 'PU-04 NO debe ver Usuarios');
console.log('✅ Menús contextuales de Arquitecto (PU-03) y CCB (PU-04) validados.\n');

// ============================================================================
// TEST 4: Gobernanza Exclusiva en Menú de PU-05 (Bibliotecario / Admin SCM)
// ============================================================================
console.log('Test 4: Exclusividad de Gobernanza y Bibliotecas en PU-05 (Bibliotecario)');
const navPU05 = getNavigationForRole('PU-05');
const allPathsPU05 = navPU05.flatMap((s) => s.items.map((i) => i.path));

// PU-05 es el único custodio de bibliotecas y administración de usuarios
assert.ok(allPathsPU05.includes('/scm/operations'), 'PU-05 debe tener Operaciones SCM');
assert.ok(allPathsPU05.includes('/baselines'), 'PU-05 debe tener Líneas Base y Reversión');
assert.ok(allPathsPU05.includes('/admin/users'), 'PU-05 debe tener Administración de Usuarios y Roles');

// Verificar que NINGÚN otro rol tenga /scm/operations o /admin/users
const otherRoles = ['PU-01', 'PU-02', 'PU-03', 'PU-04', 'PU-06', 'PU-07'];
for (const role of otherRoles) {
  const otherPaths = getNavigationForRole(role).flatMap((s) => s.items.map((i) => i.path));
  assert.strictEqual(
    otherPaths.includes('/scm/operations'),
    false,
    `El rol ${role} NO debe tener acceso en menú a /scm/operations`
  );
  assert.strictEqual(
    otherPaths.includes('/admin/users'),
    false,
    `El rol ${role} NO debe tener acceso en menú a /admin/users`
  );
}
console.log('✅ Exclusividad de operaciones SCM y gestión de usuarios en PU-05 verificada.\n');

// ============================================================================
// TEST 5: Menú para PU-06 (Desarrollador) y PU-07 (Calidad) — Reglas RN-04 y RN-09
// ============================================================================
console.log('Test 5: Segregación SoD para PU-06 (Desarrollador) y PU-07 (Calidad)');
const navPU06 = getNavigationForRole('PU-06');
const allPathsPU06 = navPU06.flatMap((s) => s.items.map((i) => i.path));

// PU-06 tiene órdenes ECN y catálogo ECS
assert.ok(allPathsPU06.includes('/ecns'));
assert.ok(allPathsPU06.includes('/ecs'));

// RN-04: Desarrollador NO puede hacer Check-In en Maestra ni administrar bibliotecas
assert.strictEqual(allPathsPU06.includes('/scm/operations'), false);
// RN-09: Desarrollador NO puede validar pruebas QA
assert.strictEqual(allPathsPU06.includes('/qa/validation/RFC-2026-0042'), false);

const navPU07 = getNavigationForRole('PU-07');
const allPathsPU07 = navPU07.flatMap((s) => s.items.map((i) => i.path));
// PU-07 es el único rol con acceso a la Consola de Validación QA
assert.ok(allPathsPU07.includes('/qa/validation/RFC-2026-0042'));
assert.strictEqual(allPathsPU07.includes('/scm/operations'), false);
console.log('✅ Reglas RN-04 y RN-09 validadas en menús de Desarrollador y QA.\n');

// ============================================================================
// TEST 6: Coherencia Total entre ROUTE_PERMISSIONS y getNavigationForRole (SSOT)
// ============================================================================
console.log('Test 6: Verificación de coherencia SSOT entre navegación y guardas de ruta');
const allRoles = ['PU-01', 'PU-02', 'PU-03', 'PU-04', 'PU-05', 'PU-06', 'PU-07'];

for (const rId of allRoles) {
  const roleSections = getNavigationForRole(rId);

  // Todo ítem visible en el menú DEBE estar formalmente autorizado en ROUTE_PERMISSIONS
  for (const sec of roleSections) {
    for (const item of sec.items) {
      assert.ok(
        item.allowedRoles.includes(rId),
        `El ítem '${item.label}' (${item.path}) presente en el menú de ${rId} debe estar en su lista de roles autorizados`
      );

      // Verificación cruzada con authService
      // Para rutas dinámicas como /qa/validation/:rfcId mapeada a muestra
      const checkPath = item.path.startsWith('/qa/validation/') ? '/qa/validation/:rfcId' : item.path;
      assert.strictEqual(
        authService.isRoleAuthorizedForRoute(rId, checkPath),
        true,
        `authService debe autorizar la ruta '${checkPath}' para el rol ${rId}`
      );
    }
  }
}
console.log('✅ Coherencia SSOT 100% verificada: ningún ítem de menú genera denegación en guardas.\n');

// ============================================================================
// TEST 7: Aislamiento Multitenant de Proyectos por Cuenta
// ============================================================================
console.log('Test 7: Aislamiento multitenant de proyectos por cuenta');
const joan = INITIAL_USER_ACCOUNTS.find((u) => u.id === 'USR-001');
const renzo = INITIAL_USER_ACCOUNTS.find((u) => u.id === 'USR-004');

assert.ok(joan);
assert.ok(renzo);

// Joan Medina tiene acceso a PRJ-001, PRJ-002, PRJ-003
assert.strictEqual(authService.canUserAccessProject(joan, 'PRJ-001'), true);
assert.strictEqual(authService.canUserAccessProject(joan, 'PRJ-002'), true);
assert.strictEqual(authService.canUserAccessProject(joan, 'PRJ-003'), true);

// Renzo Loyola tiene acceso exclusivo a PRJ-001 y PRJ-002
assert.strictEqual(authService.canUserAccessProject(renzo, 'PRJ-001'), true);
assert.strictEqual(authService.canUserAccessProject(renzo, 'PRJ-002'), true);
assert.strictEqual(authService.canUserAccessProject(renzo, 'PRJ-003'), false);
console.log('✅ Aislamiento multitenant comprobado: USR-004 aislado de PRJ-003.\n');

// ============================================================================
// TEST 8: Validación de Función Auxiliar isRouteAuthorizedForRole
// ============================================================================
console.log('Test 8: Validación de helper isRouteAuthorizedForRole');
assert.strictEqual(isRouteAuthorizedForRole('/rfcs/new', 'PU-01'), true);
assert.strictEqual(isRouteAuthorizedForRole('/rfcs/new', 'PU-02'), false);
assert.strictEqual(isRouteAuthorizedForRole('/scm/operations', 'PU-05'), true);
assert.strictEqual(isRouteAuthorizedForRole('/scm/operations', 'PU-06'), false);
assert.strictEqual(isRouteAuthorizedForRole('/admin/users', 'PU-05'), true);
assert.strictEqual(isRouteAuthorizedForRole('/admin/users', 'PU-01'), false);
assert.strictEqual(isRouteAuthorizedForRole('/ruta-desconocida', null), false);
console.log('✅ Helper isRouteAuthorizedForRole validado exitosamente.\n');

console.log('🎉 TODAS LAS PRUEBAS DE FASE 03 PASARON SATISFACTORIAMENTE (8/8).');
