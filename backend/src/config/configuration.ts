export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  databaseUrl: string;
  sessionCookieSecure: boolean;
  sessionCookieSameSite: 'strict' | 'lax' | 'none';
  sessionTtlMinutes: number;
}

export function loadConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL || '',
    sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
    sessionCookieSameSite: (process.env.SESSION_COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
    sessionTtlMinutes: parseInt(process.env.SESSION_TTL_MINUTES || '15', 10),
  };
}
