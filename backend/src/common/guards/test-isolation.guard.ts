/**
 * TraceFlow SCM — Salvaguarda de Aislamiento de Base de Datos para Pruebas (INIT-H02-V / INIT-H02-VF)
 *
 * Previene la ejecución accidental de operaciones de escritura (DML), mutación
 * o eliminación destructiva (DROP DATABASE) sobre hosts productivos o instancias
 * gestionadas en la nube (ej. Supabase, RDS, Neon).
 */

export const ALLOWED_DISPOSABLE_DATABASES = [
  'traceflow_cert',
  'traceflow_test_disposable',
  'traceflow_isolated_test',
] as const;

export type AllowedDisposableDatabase = (typeof ALLOWED_DISPOSABLE_DATABASES)[number];

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export function isLocalDatabaseHost(host?: string): boolean {
  if (!host) return false;
  const cleanHost = host.trim().toLowerCase();
  return LOCAL_HOSTS.has(cleanHost);
}

export function isRemoteDatabaseHost(urlOrHost?: string): boolean {
  if (!urlOrHost) return false;
  const lower = urlOrHost.toLowerCase();
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

export function quoteSqlIdentifier(ident?: string): string {
  if (!ident || typeof ident !== 'string') {
    throw new Error('[SEC-01 / IDENTIFICADOR INVÁLIDO] El identificador SQL no puede estar vacío.');
  }
  const trimmed = ident.trim();
  // Validar formato estricto de identificador PostgreSQL (letras, números, guiones bajos, max 63 caracteres)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(trimmed)) {
    throw new Error(
      `[SEC-01 / IDENTIFICADOR INVÁLIDO] El identificador '${trimmed}' contiene caracteres no permitidos o longitud inválida.`
    );
  }
  return `"${trimmed.replace(/"/g, '""')}"`;
}

export function isDisposableDatabaseName(name?: string): boolean {
  if (!name) return false;
  return ALLOWED_DISPOSABLE_DATABASES.includes(name.trim().toLowerCase() as AllowedDisposableDatabase);
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

export interface DestructiveResetGuardOptions {
  host?: string;
  database?: string;
  allowDestructiveReset?: boolean;
}

export function assertSafeDestructiveDatabaseReset(options: DestructiveResetGuardOptions): void {
  const { host, database, allowDestructiveReset } = options;

  // 1. Validar presencia obligatoria de host y base de datos
  if (!host) {
    throw new Error(
      '[BLOQUEO DESTRUCCTIVO] No se especificó el host de la base de datos para la operación destructiva.'
    );
  }
  if (!database) {
    throw new Error(
      '[BLOQUEO DESTRUCCTIVO] No se especificó el nombre de la base de datos para la operación destructiva.'
    );
  }

  // 2. Validación estricta de destino local (rechazar destinos remotos o en la nube)
  if (isRemoteDatabaseHost(host) || !isLocalDatabaseHost(host)) {
    throw new Error(
      `[BLOQUEO DESTRUCCTIVO] Operación rechazada: El host '${host}' no es un PostgreSQL local aislado (127.0.0.1/localhost). ` +
        'Queda terminantemente prohibido ejecutar DROP DATABASE contra instancias remotas o no identificadas.'
    );
  }

  // 3. Validación de identificador seguro
  quoteSqlIdentifier(database);

  // 4. Lista explícita de nombres de bases descartables permitidas
  if (!isDisposableDatabaseName(database)) {
    throw new Error(
      `[BLOQUEO DESTRUCCTIVO] Operación rechazada: La base de datos '${database}' no se encuentra en la lista permitida de ` +
        `bases descartables para pruebas (${ALLOWED_DISPOSABLE_DATABASES.join(', ')}). ` +
        'Bases de producción, sistema (postgres, template1) o de desarrollo general no pueden ser eliminadas.'
    );
  }

  // 5. Decoplamiento estricto: La autorización de DML remoto no autoriza el borrado destructivo
  const hasDestructiveAuth =
    allowDestructiveReset === true || process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET === 'true';

  if (!hasDestructiveAuth) {
    if (process.env.ALLOW_REMOTE_TEST_DML === 'true') {
      throw new Error(
        '[BLOQUEO DESTRUCCTIVO] Operación rechazada: La autorización de pruebas remotas (ALLOW_REMOTE_TEST_DML=true) ' +
          'NO autoriza la eliminación destructiva (DROP DATABASE) de bases de datos. ' +
          'Se requiere la variable explícita e independiente ALLOW_DESTRUCTIVE_DATABASE_RESET=true.'
      );
    }
    throw new Error(
      `[BLOQUEO DESTRUCCTIVO] Operación rechazada: Se intentó eliminar/recrear la base de datos '${database}' sin ` +
        'autorización deliberada. Configure ALLOW_DESTRUCTIVE_DATABASE_RESET=true para autorizar operaciones destructivas locales.'
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
