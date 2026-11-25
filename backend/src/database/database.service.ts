import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import pg from 'pg';
const { Pool } = pg;
import { loadConfig } from '../config/configuration.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: pg.Pool | null = null;
  private isConnected = false;

  async onModuleInit() {
    const config = loadConfig();
    if (!config.databaseUrl) {
      this.logger.warn('DATABASE_URL no configurada. El servicio operará en modo contingente local.');
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.databaseUrl.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isConnected = true;
      this.logger.log('Conexión con PostgreSQL (Supabase) establecida exitosamente.');
    } catch (err: any) {
      this.logger.warn(`No se pudo conectar a PostgreSQL remoto: ${err.message}. Operando con adaptador seguro.`);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  isDatabaseConnected(): boolean {
    return this.isConnected;
  }

  async query<T extends pg.QueryResultRow = any>(sql: string, params: any[] = []): Promise<pg.QueryResult<T>> {
    if (!this.pool || !this.isConnected) {
      throw new Error('DatabaseNotConnected: Base de datos no disponible');
    }
    return this.pool.query<T>(sql, params);
  }

  async getClient(): Promise<pg.PoolClient> {
    if (!this.pool || !this.isConnected) {
      throw new Error('DatabaseNotConnected: Base de datos no disponible');
    }
    return this.pool.connect();
  }
}
