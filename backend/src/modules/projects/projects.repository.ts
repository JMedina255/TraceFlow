import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';

export interface ProjectEntity {
  id: string;
  code: string;
  project_key: string;
  name: string;
  description: string;
  client_name: string;
  status: string;
  active_baseline_version: string;
  manager_id?: string;
  architect_id?: string;
  librarian_id?: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class ProjectsRepository {
  private projects: ProjectEntity[] = [
    {
      id: 'b0000001-0000-0000-0000-000000000001',
      code: 'PRJ-001',
      project_key: 'EXO-CORE',
      name: 'Pasarela de Pagos Core',
      description: 'Plataforma central transaccional, enrutamiento bancario, tokenización y conciliación financiera en tiempo real.',
      client_name: 'Banco Regional del Sur',
      status: 'ACTIVO',
      active_baseline_version: 'v1.2.0',
      manager_id: 'a0000001-0000-0000-0000-000000000001',
      architect_id: 'a0000001-0000-0000-0000-000000000002',
      librarian_id: 'a0000001-0000-0000-0000-000000000003',
      created_at: '2026-08-01T08:00:00Z',
      updated_at: '2026-10-01T15:30:00Z',
    },
    {
      id: 'b0000001-0000-0000-0000-000000000002',
      code: 'PRJ-002',
      project_key: 'EXO-PORTAL',
      name: 'Portal Autoservicio Clientes',
      description: 'Aplicación web interactiva SPA para consulta de pólizas, descarga de estados de cuenta y registro de reclamos.',
      client_name: 'Financiera CrediSur',
      status: 'ACTIVO',
      active_baseline_version: 'v2.0.1',
      manager_id: 'a0000001-0000-0000-0000-000000000001',
      architect_id: 'a0000001-0000-0000-0000-000000000002',
      librarian_id: 'a0000001-0000-0000-0000-000000000003',
      created_at: '2026-08-15T09:00:00Z',
      updated_at: '2026-09-28T11:20:00Z',
    },
    {
      id: 'b0000001-0000-0000-0000-000000000003',
      code: 'PRJ-003',
      project_key: 'EXO-SUNAT',
      name: 'Módulo de Facturación Electrónica',
      description: 'Servicio de integración para emisión de comprobantes de pago electrónicos en formato XML UBL 2.1 con certificación OSE.',
      client_name: 'Corporación Minera Andina',
      status: 'ACTIVO',
      active_baseline_version: 'v1.0.0',
      manager_id: 'a0000001-0000-0000-0000-000000000001',
      architect_id: 'a0000001-0000-0000-0000-000000000002',
      librarian_id: 'a0000001-0000-0000-0000-000000000003',
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-10-05T14:10:00Z',
    },
  ];

  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<ProjectEntity[]> {
    if (this.db.isDatabaseConnected()) {
      try {
        const res = await this.db.query('SELECT * FROM traceflow.project ORDER BY code ASC');
        return res.rows;
      } catch (err) {
        // Fallback
      }
    }
    return [...this.projects];
  }

  async findByIdOrCode(idOrCode: string): Promise<ProjectEntity | null> {
    if (this.db.isDatabaseConnected()) {
      try {
        const res = await this.db.query(
          'SELECT * FROM traceflow.project WHERE id::text = $1 OR code = $1 LIMIT 1',
          [idOrCode]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        // Fallback
      }
    }
    return this.projects.find((p) => p.id === idOrCode || p.code === idOrCode) || null;
  }
}
