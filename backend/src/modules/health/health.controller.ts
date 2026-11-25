import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

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
      service: 'TraceFlow SCM Backend Core',
      version: '2.0.0-enterprise',
      timestamp: new Date().toISOString(),
      database: {
        connected: isDbConnected,
        latencyMs: isDbConnected ? latencyMs : null,
        mode: isDbConnected ? 'PostgreSQL (Supabase)' : 'Local Resilient Adapter',
      },
    };
  }
}
