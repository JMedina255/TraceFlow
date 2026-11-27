/**
 * ============================================================================
 * TRACEFLOW SCM — SUITE E2E REAL PLAYWRIGHT (MVP-H01 / MI-04)
 * Archivo: scripts/e2e-mvp-h01-mi04.mjs
 *
 * Certifica de extremo a extremo la interfaz administrativa (PU-08), permisos
 * PU-09/PU-01, modales <dialog> accesibles, invitaciones pendientes,
 * organizaciones, revocación de sesión al suspender y flujos de demostración
 * sobre Frontend Vite (:5173) + Backend NestJS (:3001) + PostgreSQL 17 real.
 * ============================================================================
 */
import { chromium } from '../prototype/node_modules/playwright/index.mjs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import pg from '../backend/node_modules/pg/lib/index.js';
import dotenv from '../backend/node_modules/dotenv/lib/main.js';

const { Pool } = pg;

const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:3001/api/v1';
const SCREENSHOTS_DIR = path.resolve('docs/evidence/mvp-h01/screenshots');

function loadEnvSecrets() {
  const certEnvPath = path.resolve('backend/.env.cert');
  if (fs.existsSync(certEnvPath)) {
    dotenv.config({ path: certEnvPath, override: false });
  }
  const demoDocPath = path.resolve('docs/evidence/mvp-h01/DEMO_ACCOUNTS.local.md');
  if (!fs.existsSync(demoDocPath)) {
    throw new Error('No se encontró docs/evidence/mvp-h01/DEMO_ACCOUNTS.local.md');
  }
  const demoDoc = fs.readFileSync(demoDocPath, 'utf8');
  const match =
    demoDoc.match(/^(?:.*?(?:Contrasena|Contraseña).*?`([^`]+)`)/im) ||
    demoDoc.match(/^(?:.*?password.*?`([^`]+)`)/im);
  if (!match?.[1]) {
    throw new Error('No se pudo extraer la contraseña local de evaluación desde DEMO_ACCOUNTS.local.md');
  }

  const adminPassword = process.env.TEST_DB_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('Falta TEST_DB_ADMIN_PASSWORD en backend/.env.cert para limpieza controlada de datos sintéticos');
  }

  return {
    demoPassword: match[1],
    adminPassword,
  };
}

function attachDiagnostics(page, runtimeErrors) {
  page.on('pageerror', (err) => {
    runtimeErrors.pageErrors.push(err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Se toleran 401/403 esperados de pruebas negativas en consola de red del navegador
      if (!txt.includes('401') && !txt.includes('403')) {
        runtimeErrors.consoleErrors.push(txt);
      }
    }
  });
  page.on('response', (res) => {
    if (res.status() >= 500) {
      runtimeErrors.serverErrors.push(`${res.status()} ${res.url()}`);
    }
  });
}

async function loginThroughUi(page, email, password, preferredRoleId) {
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');

  // Si la cuenta tiene múltiples perfiles en modo API, LoginView muestra el paso 2 de selección SoD
  const step2Btn = page.locator('button[type="submit"]:has-text("Confirmar e Ingresar")');
  const outcome = await Promise.race([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 8000 }).then(() => 'navigated'),
    step2Btn.waitFor({ state: 'visible', timeout: 8000 }).then(() => 'step2'),
    page.locator('[role="alert"]').waitFor({ state: 'visible', timeout: 8000 }).then(() => 'alert'),
  ]).catch(() => 'timeout');

  if (outcome === 'step2') {
    if (preferredRoleId) {
      await page.selectOption('select', preferredRoleId);
    }
    await step2Btn.click();
  }
}

async function runMi04Suite() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const { demoPassword, adminPassword } = loadEnvSecrets();
  const suffix = `${Date.now().toString(36)}`;
  const syntheticEmail = `mi04.e2e.${suffix}@exodo.pe`;
  const syntheticUserPassword = `Tf!${crypto.randomBytes(6).toString('hex')}9`;
  const syntheticInvEmail = `inv.mi04.${suffix}@exodo.pe`;
  const syntheticInvGithub = `octo-mi04-${suffix}`;
  const syntheticOrgCode = `ORG-E2E-${suffix.toUpperCase()}`.slice(0, 20);
  const syntheticOrgSlug = `org-e2e-${suffix.toLowerCase()}`;

  const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: adminPassword,
    database: 'traceflow_mvp_dev',
  });

  const browser = await chromium.launch({ headless: true });
  const runtimeErrors = { pageErrors: [], consoleErrors: [], serverErrors: [] };
  const results = [];

  const record = (id, name, passed, detail = '') => {
    const icon = passed ? 'PASS' : 'FAIL';
    console.log(`[${icon}] ${id} — ${name}${detail ? ` (${detail})` : ''}`);
    results.push({ id, name, passed, detail });
    if (!passed) {
      throw new Error(`Fallo en ${id} (${name}): ${detail}`);
    }
  };

  let adminContext;
  let adminPage;
  let createdUserCode = '';
  let initialPmCount = 0;

  try {
    // ------------------------------------------------------------------------
    // E2E-01: Login PU-08 y renderizado del Panel Administrativo
    // ------------------------------------------------------------------------
    adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    adminPage = await adminContext.newPage();
    attachDiagnostics(adminPage, runtimeErrors);

    await loginThroughUi(adminPage, 'admin@exodo.pe', demoPassword);
    await adminPage.waitForURL('**/admin/users', { timeout: 10000 });
    await adminPage.waitForSelector('table tbody tr', { timeout: 10000 });

    const headerScope = await adminPage.locator('header').innerText();
    const rowCount = await adminPage.locator('table tbody tr').count();
    const pmKpiText = await adminPage
      .locator('div', { hasText: 'Jefes de proyecto autorizados' })
      .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
      .innerText();
    const kpiNumMatch = pmKpiText.match(/\b(\d+)\b/);
    initialPmCount = kpiNumMatch ? Number(kpiNumMatch[1]) : 0;

    await adminPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-admin-users-pu08.png'),
      fullPage: true,
    });

    record(
      'E2E-01',
      'Login PU-08 y redirección directa a /admin/users',
      headerScope.includes('Ámbito Global de Plataforma') && rowCount >= 13 && initialPmCount >= 1,
      `filas=${rowCount}, pmAutorizados=${initialPmCount}`
    );

    // ------------------------------------------------------------------------
    // E2E-02: Filtros combinados por rol y botón Limpiar filtros
    // ------------------------------------------------------------------------
    await adminPage.selectOption('#admin-users-role-filter', 'PU-09');
    await adminPage.waitForFunction(
      () => document.querySelectorAll('table tbody tr').length >= 1 &&
        document.body.innerText.includes('jefeproyecto@exodo.pe'),
      { timeout: 8000 }
    );
    await adminPage.click('button:has-text("Limpiar filtros")');
    await adminPage.waitForFunction(
      () => document.querySelectorAll('table tbody tr').length >= 13,
      { timeout: 8000 }
    );
    record('E2E-02', 'Filtros por perfil y restablecimiento limpio', true, 'PU-09 filtrado y limpiado');

    // ------------------------------------------------------------------------
    // E2E-03: Modal nativo <dialog> de Detalle + cierre con Escape
    // ------------------------------------------------------------------------
    await adminPage.click('button[aria-label="Ver detalle de USR-013"]');
    await adminPage.waitForSelector('dialog[open]', { timeout: 5000 });
    const detailText = await adminPage.locator('dialog[open]').innerText();
    await adminPage.keyboard.press('Escape');
    await adminPage.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 5000 });
    record(
      'E2E-03',
      'Modal nativo <dialog> Detalle de Cuenta y cierre con Esc',
      detailText.includes('USR-013') && detailText.includes('Autorizado (PU-09)'),
      'Tecla Escape cerró el top-layer nativo'
    );

    // ------------------------------------------------------------------------
    // E2E-04: Validación visible dentro del Modal + Creación real de usuario
    // ------------------------------------------------------------------------
    await adminPage.click('button:has-text("Nuevo usuario")');
    await adminPage.waitForSelector('dialog[open]', { timeout: 5000 });

    await adminPage.fill('#new-full-name', 'Usuario E2E MI04');
    await adminPage.fill('#new-email', syntheticEmail);
    await adminPage.fill('#new-position', 'Analista E2E Temporal');
    await adminPage.fill('#new-password', syntheticUserPassword);
    await adminPage.fill('#new-confirm-password', `${syntheticUserPassword}X`);
    await adminPage.click('dialog[open] button[type="submit"]');

    const modalAlertText = await adminPage.locator('dialog[open] [role="alert"]').innerText();
    if (!modalAlertText.includes('no coinciden')) {
      throw new Error(`Alerta interna esperada no visible: ${modalAlertText}`);
    }

    await adminPage.fill('#new-confirm-password', syntheticUserPassword);
    await adminPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-create-user-dialog.png'),
      fullPage: true,
    });
    await adminPage.click('dialog[open] button[type="submit"]');
    await adminPage.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 8000 });

    const createdRow = adminPage.locator('table tbody tr', { hasText: syntheticEmail });
    await createdRow.waitFor({ timeout: 8000 });
    createdUserCode = (await createdRow.locator('td').first().innerText()).trim();

    await adminPage.reload({ waitUntil: 'networkidle' });
    await adminPage.locator('table tbody tr', { hasText: syntheticEmail }).waitFor({ timeout: 8000 });

    record(
      'E2E-04',
      'Validación inline en modal y creación persistente en PostgreSQL',
      Boolean(createdUserCode),
      `codigo=${createdUserCode}`
    );

    // ------------------------------------------------------------------------
    // E2E-05: Edición básica y actualización de perfiles operativos
    // ------------------------------------------------------------------------
    await adminPage.click(`button[aria-label="Editar usuario ${createdUserCode}"]`);
    await adminPage.waitForSelector('dialog[open]', { timeout: 5000 });
    await adminPage.fill('#edit-position', 'Especialista QA Certificado');
    await adminPage.click('dialog[open] button[type="submit"]');
    await adminPage.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 8000 });
    await adminPage
      .locator('table tbody tr', { hasText: createdUserCode })
      .locator('text=Especialista QA Certificado')
      .waitFor({ timeout: 8000 });

    await adminPage.click(`button[aria-label="Gestionar perfiles de ${createdUserCode}"]`);
    await adminPage.waitForSelector('dialog[open]', { timeout: 5000 });
    await adminPage
      .locator('dialog[open] label', { hasText: 'PU-07' })
      .locator('input[type="checkbox"]')
      .check();
    await adminPage.click('dialog[open] button[type="submit"]');
    await adminPage.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 8000 });

    const rolesCellText = await adminPage
      .locator('table tbody tr', { hasText: createdUserCode })
      .innerText();
    record(
      'E2E-05',
      'Edición básica y actualización de perfiles operativos',
      rolesCellText.includes('PU-07'),
      `${createdUserCode} actualizado a Especialista QA Certificado + PU-07`
    );

    // ------------------------------------------------------------------------
    // E2E-06: Autorizar y revocar Jefe de Proyecto (PU-09 / can_create_projects)
    // ------------------------------------------------------------------------
    const targetRow = adminPage.locator('table tbody tr', { hasText: createdUserCode });
    await targetRow.locator('button:has-text("Autorizar PU-09")').click();
    await adminPage.waitForSelector('dialog[open]', { timeout: 5000 });
    await adminPage.click('dialog[open] button:has-text("Autorizar Jefe de Proyecto")');
    await adminPage.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 8000 });
    await targetRow.locator('text=Autorizado (PU-09)').waitFor({ timeout: 8000 });

    await adminPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-pu09-authorized.png'),
      fullPage: true,
    });

    await targetRow.locator('button:has-text("Revocar PU-09")').click();
    await adminPage.waitForSelector('dialog[open]', { timeout: 5000 });
    await adminPage.click('dialog[open] button:has-text("Revocar Autorización")');
    await adminPage.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 8000 });
    await targetRow.locator('text=No autorizado').waitFor({ timeout: 8000 });

    record('E2E-06', 'Autorización y revocación atómica PU-09 desde UI', true, createdUserCode);

    // ------------------------------------------------------------------------
    // E2E-07: Suspensión y revocación inmediata de sesión en navegador separado
    // ------------------------------------------------------------------------
    const userContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const userPage = await userContext.newPage();
    attachDiagnostics(userPage, runtimeErrors);

    await loginThroughUi(userPage, syntheticEmail, syntheticUserPassword);
    await userPage.waitForURL('**/dashboard', { timeout: 10000 });

    await targetRow.locator('button:has-text("Suspender")').click();
    await adminPage.waitForSelector('dialog[open]', { timeout: 5000 });
    const cancelFocused = await adminPage.evaluate(
      () => document.activeElement?.textContent?.includes('Cancelar') ?? false
    );
    await adminPage.click('dialog[open] button:has-text("Confirmar Suspensión")');
    await adminPage.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 8000 });
    await targetRow.locator('text=SUSPENDED').waitFor({ timeout: 8000 });

    await adminPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-user-suspended.png'),
      fullPage: true,
    });

    // El usuario suspendido intenta navegar -> refreshSession falla 401 y redirige a /login
    await userPage.goto(`${FRONTEND_URL}/rfcs`, { waitUntil: 'networkidle' });
    await userPage.waitForURL('**/login', { timeout: 8000 });

    // Intento de nuevo login mientras está SUSPENDED debe ser rechazado
    await loginThroughUi(userPage, syntheticEmail, syntheticUserPassword);
    const loginErr = await userPage.locator('[role="alert"]').innerText();
    await userContext.close();

    // Reactivar en admin
    await targetRow.locator('button:has-text("Reactivar")').click();
    await adminPage.waitForSelector('dialog[open]', { timeout: 5000 });
    await adminPage.click('dialog[open] button:has-text("Confirmar Reactivación")');
    await adminPage.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 8000 });
    await targetRow.locator('text=ACTIVE').waitFor({ timeout: 8000 });

    record(
      'E2E-07',
      'Suspensión, foco seguro en Cancelar y revocación inmediata de sesión',
      cancelFocused && loginErr.length > 0,
      `cancelFocused=${cancelFocused}, rechazoLogin="${loginErr.trim()}"`
    );

    // ------------------------------------------------------------------------
    // E2E-08: Invitaciones pendientes (EMAIL + GITHUB sin correo + Cancelación)
    // ------------------------------------------------------------------------
    await adminPage.click('button[role="tab"]:has-text("Invitaciones pendientes")');
    await adminPage.fill('#inv-email', syntheticInvEmail);
    await adminPage.selectOption('#inv-role', 'PU-02');
    await adminPage.click('button:has-text("Registrar invitación")');
    await adminPage.locator('table tbody tr', { hasText: syntheticInvEmail }).waitFor({ timeout: 8000 });

    await adminPage.click('button:has-text("GitHub")');
    await adminPage.fill('#inv-github', syntheticInvGithub);
    await adminPage.selectOption('#inv-role', 'PU-06');
    await adminPage.click('button:has-text("Registrar invitación")');
    await adminPage.locator('table tbody tr', { hasText: `@${syntheticInvGithub}` }).waitFor({ timeout: 8000 });

    const emailInvRow = adminPage.locator('table tbody tr', { hasText: syntheticInvEmail });
    await emailInvRow.locator('button:has-text("Cancelar")').click();
    await adminPage.waitForSelector('dialog[open]', { timeout: 5000 });
    await adminPage.click('dialog[open] button:has-text("Cancelar Invitación")');
    await adminPage.waitForFunction(() => !document.querySelector('dialog[open]'), { timeout: 8000 });
    await emailInvRow.locator('text=CANCELLED').waitFor({ timeout: 8000 });

    await adminPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-invitations-tab.png'),
      fullPage: true,
    });
    record('E2E-08', 'Invitaciones pendientes EMAIL/GITHUB y cancelación lógica', true);

    // ------------------------------------------------------------------------
    // E2E-09: Organizaciones y membresías
    // ------------------------------------------------------------------------
    await adminPage.click('button[role="tab"]:has-text("Organizaciones y Membresías")');
    await adminPage.click('button:has-text("Nueva org")');
    await adminPage.fill('input[aria-label="Código de organización"]', syntheticOrgCode);
    await adminPage.fill('input[aria-label="Nombre comercial de organización"]', 'Empresa E2E Temporal SAC');
    await adminPage.fill('input[aria-label="Slug de organización"]', syntheticOrgSlug);
    await adminPage.click('button:has-text("Crear organización")');
    await adminPage.locator(`h3:has-text("Membresías de ${syntheticOrgCode}")`).waitFor({ timeout: 8000 });

    await adminPage.fill('input[aria-label="Código o correo del miembro a incorporar"]', createdUserCode);
    await adminPage.click('button:has-text("Incorporar")');
    await adminPage.locator('table tbody tr', { hasText: createdUserCode }).waitFor({ timeout: 8000 });

    await adminPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06-organizations-tab.png'),
      fullPage: true,
    });
    record('E2E-09', 'Gestión de organizaciones y membresías', true, syntheticOrgCode);

    // ------------------------------------------------------------------------
    // E2E-10: RBAC y experiencia de demostración para PU-09 y PU-01
    // ------------------------------------------------------------------------
    const pmContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pmPage = await pmContext.newPage();
    attachDiagnostics(pmPage, runtimeErrors);

    await loginThroughUi(pmPage, 'jefeproyecto@exodo.pe', demoPassword);
    await pmPage.waitForURL('**/dashboard', { timeout: 10000 });
    const pmDashText = await pmPage.locator('main').innerText();
    await pmPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07-pu09-dashboard.png'),
      fullPage: true,
    });

    await pmPage.goto(`${FRONTEND_URL}/admin/users`, { waitUntil: 'networkidle' });
    const pmDeniedText = await pmPage.locator('main').innerText();
    await pmPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, '08-pu09-admin-denied.png'),
      fullPage: true,
    });
    await pmContext.close();

    const reqContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const reqPage = await reqContext.newPage();
    attachDiagnostics(reqPage, runtimeErrors);
    await loginThroughUi(reqPage, 'usuario@exodo.pe', demoPassword);
    await reqPage.waitForURL('**/dashboard', { timeout: 10000 });
    await reqPage.goto(`${FRONTEND_URL}/admin/users`, { waitUntil: 'networkidle' });
    const reqDeniedText = await reqPage.locator('main').innerText();
    await reqContext.close();

    record(
      'E2E-10',
      'Dashboard PU-09 y bloqueo RBAC de /admin/users para PU-09 y PU-01',
      pmDashText.includes('Habilitada') &&
        pmDeniedText.includes('No tienes permisos para acceder a esta sección') &&
        reqDeniedText.includes('No tienes permisos para acceder a esta sección'),
      'PU-09 y PU-01 bloqueados correctamente en /admin/users'
    );

    // ------------------------------------------------------------------------
    // E2E-11: Menú de usuario PU-08 (cargo real) + Cierre de sesión + Estabilidad
    // ------------------------------------------------------------------------
    await adminPage.click('button[aria-label="Menú de perfil y sesión de usuario"]');
    const userMenuText = await adminPage.locator('header').innerText();
    await adminPage.click('button:has-text("Cerrar Sesión")');
    await adminPage.waitForURL('**/login', { timeout: 8000 });

    const totalRuntimeErrors =
      runtimeErrors.pageErrors.length +
      runtimeErrors.consoleErrors.length +
      runtimeErrors.serverErrors.length;

    record(
      'E2E-11',
      'Cierre de sesión limpio y cero errores JS/5xx en navegador',
      userMenuText.includes('Administrador del Sistema') && totalRuntimeErrors === 0,
      `pageErrors=${runtimeErrors.pageErrors.length}, consoleErrors=${runtimeErrors.consoleErrors.length}, server5xx=${runtimeErrors.serverErrors.length}`
    );
  } finally {
    await browser.close();

    // Limpieza no destructiva de registros sintéticos (respeta inmutabilidad append-only de audit_log)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM traceflow.user_invitation WHERE email = $1 OR github_username = $2', [
        syntheticInvEmail,
        syntheticInvGithub,
      ]);
      await client.query(
        `DELETE FROM traceflow.organization_member
         WHERE organization_id IN (SELECT id FROM traceflow.organization WHERE code = $1)
            OR user_id IN (SELECT id FROM traceflow.app_user WHERE email LIKE 'mi04.e2e.%@exodo.pe')`,
        [syntheticOrgCode]
      );
      await client.query('DELETE FROM traceflow.organization WHERE code = $1', [syntheticOrgCode]);
      await client.query(
        `UPDATE traceflow.app_user
         SET status = 'SUSPENDED', can_create_projects = FALSE, updated_at = NOW()
         WHERE email LIKE 'mi04.e2e.%@exodo.pe'`
      );
      await client.query(
        `UPDATE traceflow.user_session
         SET is_revoked = TRUE
         WHERE user_id IN (SELECT id FROM traceflow.app_user WHERE email LIKE 'mi04.e2e.%@exodo.pe')`
      );
      await client.query('COMMIT');
      console.log('Limpieza no destructiva de registros sintéticos E2E completada en traceflow_mvp_dev.');
    } catch (cleanErr) {
      await client.query('ROLLBACK').catch(() => {});
      console.warn('Advertencia durante limpieza E2E:', cleanErr.message);
    } finally {
      client.release();
      await pool.end();
    }
  }

  console.log(`\nRESUMEN MI-04 E2E: ${results.filter((r) => r.passed).length}/${results.length} flujos aprobados.`);
}

runMi04Suite().catch((err) => {
  console.error('\nERROR E2E MI-04:', err);
  process.exit(1);
});
