/**
 * TraceFlow SCM — Salvaguarda de Aislamiento de Base de Datos para Pruebas (INIT-H02-V)
 *
 * Previene la ejecución accidental de operaciones de escritura (DML) o mutación
 * sobre hosts productivos o instancias gestionadas en la nube (ej. Supabase).
 */

export function isRemoteDatabaseHost(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('supabase.co') ||
    lower.includes('pooler.supabase.com') ||
    lower.includes('amazonaws.com') ||
    lower.includes('neon.tech') ||
    lower.includes('rds.')
  );
}

export function sanitizeDatabaseUrl(url?: string): string {
  if (!url) return '';
  return url.replace(/:([^:@]+)@/, ':***@');
}

export function assertSafeTestDatabase(
  url?: string,
  suiteName = 'Prueba de Integración',
  allowRemoteDml = false
): void {
  if (!url) {
    throw new Error(`[SEC-01 / AISLAMIENTO] ${suiteName}: No se especificó URL de base de datos.`);
  }

  const isRemote = isRemoteDatabaseHost(url);
  const explicitAllow = allowRemoteDml || process.env.ALLOW_REMOTE_TEST_DML === 'true';

  if (isRemote && !explicitAllow) {
    throw new Error(
      `[BLOQUEO DE AISLAMIENTO] ${suiteName}: Se ha impedido la ejecución de pruebas con escritura (DML) ` +
        `contra la base de datos remota/productiva '${sanitizeDatabaseUrl(url)}'. ` +
        `Para pruebas locales aisladas utilice TEST_DATABASE_URL apuntando a un PostgreSQL local (ej. 127.0.0.1:5432). ` +
        `Para ejecutar pruebas controladas contra Supabase, configure explícitamente ALLOW_REMOTE_TEST_DML=true.`
    );
  }
}

export function getEffectiveTestDatabaseUrl(): string {
  return (
    process.env.TEST_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'postgresql://postgres@127.0.0.1:5432/traceflow_cert'
  );
}
