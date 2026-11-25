export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  databaseUrl: string;
  databaseMode: 'postgres' | 'mock';
  databaseSslRejectUnauthorized: boolean;
  databaseCaCert?: string;
  sessionCookieSecure: boolean;
  sessionCookieSameSite: 'strict' | 'lax' | 'none';
  sessionTtlMinutes: number;
}

export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  // En entorno de prueba (test) se admite modo mock si no se especifica DATABASE_MODE
  const defaultMode: 'postgres' | 'mock' = nodeEnv === 'test' ? 'mock' : 'postgres';
  const databaseMode = (process.env.DATABASE_MODE as 'postgres' | 'mock') || defaultMode;

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '3001', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL || '',
    databaseMode,
    databaseSslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
    databaseCaCert: process.env.DATABASE_CA_CERT || undefined,
    sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
    sessionCookieSameSite: (process.env.SESSION_COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
    sessionTtlMinutes: parseInt(process.env.SESSION_TTL_MINUTES || '15', 10),
  };
}
