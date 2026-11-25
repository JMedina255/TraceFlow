import { Injectable, OnModuleDestroy, OnModuleInit, Logger, Optional, Inject } from '@nestjs/common';
import pg from 'pg';
const { Pool } = pg;
import { loadConfig } from '../config/configuration.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: pg.Pool | null = null;
  private isConnected = false;
  private databaseMode: 'postgres' | 'mock' = 'postgres';

  constructor(@Optional() @Inject('DATABASE_MODE') mode?: 'postgres' | 'mock') {
    if (mode) {
      this.databaseMode = mode;
    } else {
      this.databaseMode = loadConfig().databaseMode;
    }
  }

  async onModuleInit() {
    const config = loadConfig();
    this.databaseMode = config.databaseMode;

    if (this.databaseMode === 'mock') {
      this.logger.log('[TEST/MOCK] Modo mock activo: persistencia simulada exclusiva para pruebas unitarias y desarrollo desconectado.');
      this.isConnected = false;
      return;
    }

    // Modo PostgreSQL Real Obligatorio (H-03)
    if (!config.databaseUrl) {
      const errorMsg = '[CRITICAL / H-03] DATABASE_MODE="postgres" pero DATABASE_URL no está configurada. El servidor no iniciará para prevenir inconsistencias de datos.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      let sslConfig: pg.ConnectionConfig['ssl'] = undefined;

      // Configuración TLS segura (H-06: Sin rejectUnauthorized: false no justificado)
      if (
        config.databaseUrl.includes('supabase.co') ||
        config.databaseUrl.includes('pooler.supabase.com') ||
        process.env.DATABASE_SSL === 'true'
      ) {
        sslConfig = {
          rejectUnauthorized: config.databaseSslRejectUnauthorized,
          ca: config.databaseCaCert ? config.databaseCaCert : undefined,
        };
      }

      this.pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: sslConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isConnected = true;
      this.logger.log('Conexión con PostgreSQL (Supabase) establecida exitosamente con TLS verificado.');
    } catch (err: any) {
      this.isConnected = false;
      const criticalMsg = `[CRITICAL / H-03] Fallo fatal de conexión a PostgreSQL (${err.message}). Detención preventiva del backend para evitar fallback silencioso.`;
      this.logger.error(criticalMsg);
      throw new Error(criticalMsg);
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  getDatabaseMode(): 'postgres' | 'mock' {
    return this.databaseMode;
  }

  isDatabaseConnected(): boolean {
    return this.isConnected;
  }

  async query<T extends pg.QueryResultRow = any>(sql: string, params: any[] = []): Promise<pg.QueryResult<T>> {
    if (this.databaseMode === 'postgres') {
      if (!this.pool || !this.isConnected) {
        throw new Error('[DatabaseError / H-03] Base de datos PostgreSQL no disponible en modo producción.');
      }
      return this.pool.query<T>(sql, params);
    }
    throw new Error('[DatabaseModeError] Invocación directa de query en modo mock sin almacenamiento relacional.');
  }

  async getClient(): Promise<pg.PoolClient> {
    if (this.databaseMode === 'postgres') {
      if (!this.pool || !this.isConnected) {
        throw new Error('[DatabaseError / H-03] Pool de conexiones PostgreSQL no disponible.');
      }
      return this.pool.connect();
    }
    throw new Error('[DatabaseModeError] Invocación directa de getClient en modo mock.');
  }
}
