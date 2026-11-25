import { Controller, Get, Inject } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  @Get()
  async getHealth() {
    const isDbConnected = this.db.isDatabaseConnected();
    let latencyMs = 0;

    if (isDbConnected) {
      const start = Date.now();
      try {
        await this.db.query('SELECT 1');
        latencyMs = Date.now() - start;
      } catch {
        // Ignored
      }
    }

    return {
      status: 'ok',
      database: isDbConnected ? 'connected' : 'disconnected',
      mode: this.db.getDatabaseMode(),
      service: 'TraceFlow SCM Backend Core',
      version: '2.0.0-enterprise',
      timestamp: new Date().toISOString(),
      details: {
        connected: isDbConnected,
        latencyMs: isDbConnected ? latencyMs : null,
        engine: isDbConnected ? 'PostgreSQL (Supabase)' : 'Local Resilient Adapter',
      },
    };
  }
}
