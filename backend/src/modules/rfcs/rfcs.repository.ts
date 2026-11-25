import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import type { RFCStatus, Priority, ChangeClassification } from '../../common/types/index.js';

export interface RfcEntity {
  id: string;
  code: string;
  project_id: string;
  target_ecs_id: string;
  target_ecs_code?: string;
  title: string;
  description: string;
  justification: string;
  priority: Priority;
  classification: ChangeClassification;
  status: RFCStatus;
  requested_by: string;
  requester_name?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
}

export interface EcsEntity {
  id: string;
  project_id: string;
  code: string;
  name: string;
  item_type: string;
  current_library: string;
  current_version: string;
}

@Injectable()
export class RfcsRepository {
  private ecsList: EcsEntity[] = [
    {
      id: 'c0000001-0000-0000-0000-000000000001',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      code: 'SRC-AUTH-JWT.ts',
      name: 'Módulo de Autenticación y Firma JWT',
      item_type: 'CODIGO_FUENTE',
      current_library: 'TRABAJO',
      current_version: '1.2.1',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000002',
      project_id: 'b0000001-0000-0000-0000-000000000001',
      code: 'DB-SCHEMA-PAYMENTS.sql',
      name: 'Esquema Relacional de Transacciones y Asientos',
      item_type: 'ESQUEMA_BD',
      current_library: 'SOPORTE',
      current_version: '1.2.0',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000005',
      project_id: 'b0000001-0000-0000-0000-000000000002',
      code: 'SRC-UI-CLAIM-FORM.tsx',
      name: 'Componente Formulario de Reclamos y Solicitudes',
      item_type: 'CODIGO_FUENTE',
      current_library: 'SOPORTE',
      current_version: '2.0.1',
    },
    {
      id: 'c0000001-0000-0000-0000-000000000006',
      project_id: 'b0000001-0000-0000-0000-000000000003',
      code: 'SRV-UBL-VALIDATOR.ts',
      name: 'Servicio de Validación de Esquemas XML SUNAT',
      item_type: 'CODIGO_FUENTE',
      current_library: 'MAESTRA',
      current_version: '1.0.0',
    },
  ];

  private rfcs: RfcEntity[] = [
    {
      id: 'd0000001-0000-0000-0000-000000000001',
      code: 'RFC-2026-0001',
      project_id: 'PRJ-001',
      target_ecs_id: 'c0000001-0000-0000-0000-000000000001',
      target_ecs_code: 'SRC-AUTH-JWT.ts',
      title: 'Migración del Mecanismo Criptográfico de Credenciales a Argon2id',
      description: 'Actualización del algoritmo de hashing de contraseñas de bcrypt a Argon2id con parámetros recomendados OWASP para mitigar ataques GPU.',
      justification: 'Cumplimiento mandatorio de la circular de seguridad SBS N° G-140-2025 para entidades financieras.',
      priority: 'ALTA',
      classification: 'CAMBIO_MAYOR',
      status: 'IMPLEMENTADA',
      requested_by: 'USR-001',
      requester_name: 'Joan Cristian Medina Quispe',
      created_at: '2026-09-08T09:00:00Z',
      updated_at: '2026-09-30T17:00:00Z',
      closed_at: '2026-09-30T17:00:00Z',
    },
    {
      id: 'd0000001-0000-0000-0000-000000000002',
      code: 'RFC-2026-0002',
      project_id: 'PRJ-001',
      target_ecs_id: 'c0000001-0000-0000-0000-000000000001',
      target_ecs_code: 'SRC-AUTH-JWT.ts',
      title: 'Rotación Automática y Control de Expiración de Llaves Asimétricas RS256',
      description: 'Implementar el servicio de recambio de claves públicas/privadas RSA cada 30 días con caché de revocación instantánea.',
      justification: 'Evitar interrupciones operativas durante auditorías semestrales de la pasarela.',
      priority: 'MEDIA',
      classification: 'CAMBIO_MENOR',
      status: 'EN_IMPLEMENTACION',
      requested_by: 'USR-001',
      requester_name: 'Joan Cristian Medina Quispe',
      created_at: '2026-09-15T11:00:00Z',
      updated_at: '2026-10-06T10:15:00Z',
    },
  ];

  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<RfcEntity[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const query = `
        SELECT r.*, e.code as target_ecs_code, u.full_name as requester_name
        FROM traceflow.change_request r
        LEFT JOIN traceflow.config_item e ON r.target_ecs_id = e.id
        LEFT JOIN traceflow.app_user u ON r.requested_by = u.id
        ORDER BY r.created_at DESC;
      `;
      const res = await this.db.query<RfcEntity>(query);
      return res.rows;
    }
    return [...this.rfcs];
  }

  async findByIdOrCode(idOrCode: string): Promise<RfcEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const query = `
        SELECT r.*, e.code as target_ecs_code, u.full_name as requester_name
        FROM traceflow.change_request r
        LEFT JOIN traceflow.config_item e ON r.target_ecs_id = e.id
        LEFT JOIN traceflow.app_user u ON r.requested_by = u.id
        WHERE r.id::text = $1 OR r.code = $1
        LIMIT 1;
      `;
      const res = await this.db.query<RfcEntity>(query, [idOrCode]);
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    return this.rfcs.find((r) => r.id === idOrCode || r.code === idOrCode) || null;
  }

  async findEcsByIdOrCode(idOrCode: string): Promise<EcsEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const query = `SELECT * FROM traceflow.config_item WHERE id::text = $1 OR code = $1 LIMIT 1`;
      const res = await this.db.query<EcsEntity>(query, [idOrCode]);
      return res.rows.length > 0 ? res.rows[0] : null;
    }
    return this.ecsList.find((e) => e.id === idOrCode || e.code === idOrCode) || null;
  }

  async create(entity: RfcEntity): Promise<RfcEntity> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const query = `
        INSERT INTO traceflow.change_request 
          (id, code, project_id, target_ecs_id, title, description, justification, priority, classification, status, requested_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;
      const res = await this.db.query<RfcEntity>(query, [
        entity.id,
        entity.code,
        entity.project_id,
        entity.target_ecs_id,
        entity.title,
        entity.description,
        entity.justification,
        entity.priority,
        entity.classification,
        entity.status,
        entity.requested_by,
        entity.created_at,
        entity.updated_at,
      ]);
      return res.rows[0];
    }

    this.rfcs.unshift(entity);
    return entity;
  }

  async getNextCode(): Promise<string> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query<{ count: string }>('SELECT count(*) as count FROM traceflow.change_request');
      const nextNum = parseInt(res.rows[0]?.count || '0', 10) + 1;
      return `RFC-2026-${String(nextNum).padStart(4, '0')}`;
    }
    const nextNum = this.rfcs.length + 1;
    return `RFC-2026-${String(nextNum).padStart(4, '0')}`;
  }
}
