import { spawnSync } from 'node:child_process';
import { isRemoteDatabaseHost, isLocalDatabaseHost, sanitizeDatabaseUrl } from '../../src/common/guards/test-isolation.guard.js';

/**
 * TraceFlow SCM — Script de Ejecución Controlada hacia Supabase (INIT-H02 / Auditoría Residual)
 *
 * Exige autorización expresa proporcionada antes de iniciar la suite (NO se establece automáticamente)
 * y valida que el destino corresponda estrictamente a un entorno remoto de pruebas.
 */

// 1. Exigir autorización expresa previa (no automática)
if (process.env.ALLOW_REMOTE_TEST_DML !== 'true') {
  console.error('\n❌ [BLOQUEO DE SEGURIDAD / SUPABASE]');
  console.error('La ejecución de pruebas contra Supabase requiere autorización expresa previa.');
  console.error('El script no auto-establece ALLOW_REMOTE_TEST_DML=true por seguridad.');
  console.error('\nPara ejecutar estas pruebas de forma deliberada, configure explícitamente:');
  console.error('  ALLOW_REMOTE_TEST_DML=true npm run test:supabase\n');
  process.exit(1);
}

// 2. Validar presencia y formato de la URL de base de datos
const targetUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!targetUrl) {
  console.error('\n❌ [ERROR DE CONFIGURACIÓN]');
  console.error('No se especificó TEST_DATABASE_URL ni DATABASE_URL en el entorno.');
  process.exit(1);
}

// 3. Validar que el destino sea efectivamente un entorno remoto permitido
if (!isRemoteDatabaseHost(targetUrl)) {
  console.error('\n❌ [BLOQUEO DE DESTINO]');
  console.error(`El destino '${sanitizeDatabaseUrl(targetUrl)}' no es un host remoto reconocido de Supabase.`);
  console.error('Este script está restringido exclusivamente a entornos remotos autorizados (*.supabase.co).');
  console.error('Para pruebas en PostgreSQL local utilice: npm run test:real-postgres\n');
  process.exit(1);
}

console.log(`\n🔒 [AUTORIZACIÓN CONFIRMADA] Ejecutando pruebas controladas contra destino remoto: ${sanitizeDatabaseUrl(targetUrl)}`);

const result = spawnSync(
  'npx',
  ['vitest', 'run', 'test/real-postgres-integration.spec.ts', 'test/real-postgres-vertical-flow.spec.ts'],
  {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  }
);

process.exit(result.status ?? 1);
