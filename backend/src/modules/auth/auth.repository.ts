import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service.js';
import type { AuthenticatedUser, CanonicalRoleId } from '../../common/types/index.js';

export interface UserAccountEntity {
  id: string;
  code: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  organization: string;
  position: string;
  status: string;
  primary_role_code: CanonicalRoleId;
  assigned_role_codes: CanonicalRoleId[];
  assigned_project_codes: string[];
}

export interface SessionRecord {
  id: string;
  user_id: string;
  active_role_id: number;
  active_role_code: CanonicalRoleId;
  session_token_hash: string;
  ip_address?: string;
  user_agent?: string;
  is_revoked: boolean;
  created_at: Date;
  last_activity_at: Date;
  expires_at: Date;
}

@Injectable()
export class AuthRepository {
  // Almacén seguro en memoria para cuando opera sin conexión PostgreSQL directa
  private users: UserAccountEntity[] = [
    {
      id: 'a0000001-0000-0000-0000-000000000001',
      code: 'USR-001',
      username: 'jmedina',
      email: 'jmedina@exodo.pe',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dHJhY2VmbG93c2FsdA$VnS1Y8u0lQjXzP3Z8N9t6K2w5Y8u0lQjXzP3Z8N9t6I',
      full_name: 'Joan Cristian Medina Quispe',
      organization: 'ÉXODO S.A.C.',
      position: 'Director de Calidad y Procesos',
      status: 'ACTIVE',
      primary_role_code: 'PU-02',
      assigned_role_codes: ['PU-02', 'PU-01'],
      assigned_project_codes: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
    },
    {
      id: 'a0000001-0000-0000-0000-000000000002',
      code: 'USR-002',
      username: 'rantayhua',
      email: 'rantayhua@exodo.pe',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dHJhY2VmbG93c2FsdA$VnS1Y8u0lQjXzP3Z8N9t6K2w5Y8u0lQjXzP3Z8N9t6I',
      full_name: 'Renzo Antonio Antayhua Mamani',
      organization: 'ÉXODO S.A.C.',
      position: 'Arquitecto de Software Principal',
      status: 'ACTIVE',
      primary_role_code: 'PU-03',
      assigned_role_codes: ['PU-03', 'PU-06'],
      assigned_project_codes: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
    },
    {
      id: 'a0000001-0000-0000-0000-000000000003',
      code: 'USR-003',
      username: 'arivera',
      email: 'arivera@exodo.pe',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dHJhY2VmbG93c2FsdA$VnS1Y8u0lQjXzP3Z8N9t6K2w5Y8u0lQjXzP3Z8N9t6I',
      full_name: 'Augusto Joaquin Rivera Muñoz',
      organization: 'ÉXODO S.A.C.',
      position: 'Jefe de SCM y Aseguramiento',
      status: 'ACTIVE',
      primary_role_code: 'PU-05',
      assigned_role_codes: ['PU-05', 'PU-07'],
      assigned_project_codes: ['PRJ-001', 'PRJ-002', 'PRJ-003'],
    },
    {
      id: 'a0000001-0000-0000-0000-000000000004',
      code: 'USR-004',
      username: 'rloyola',
      email: 'rloyola@exodo.pe',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$dHJhY2VmbG93c2FsdA$VnS1Y8u0lQjXzP3Z8N9t6K2w5Y8u0lQjXzP3Z8N9t6I',
      full_name: 'Renzo Fernando Loyola Vilca Choque',
      organization: 'ÉXODO S.A.C.',
      position: 'Coordinador de Proyectos y CCB',
      status: 'ACTIVE',
      primary_role_code: 'PU-04',
      assigned_role_codes: ['PU-04'],
      assigned_project_codes: ['PRJ-001', 'PRJ-002'], // VETO ESTRICTO PRJ-003
    },
  ];

  private sessions: Map<string, SessionRecord> = new Map();

  constructor(private readonly db: DatabaseService) {}

  async findByEmail(email: string): Promise<UserAccountEntity | null> {
    const normalized = email.trim().toLowerCase();

    if (this.db.isDatabaseConnected()) {
      try {
        const query = `
          SELECT 
            u.id, u.code, u.username, u.email, u.password_hash, u.full_name, u.organization, u.position, u.status,
            COALESCE((
              SELECT r.code 
              FROM traceflow.user_role_assignment ura 
              JOIN traceflow.app_role r ON ura.role_id = r.id 
              WHERE ura.user_id = u.id AND ura.is_primary = TRUE 
              LIMIT 1
            ), 'PU-01') as primary_role_code,
            COALESCE((
              SELECT array_agg(r.code) 
              FROM traceflow.user_role_assignment ura 
              JOIN traceflow.app_role r ON ura.role_id = r.id 
              WHERE ura.user_id = u.id
            ), ARRAY[]::varchar[]) as assigned_role_codes,
            COALESCE((
              SELECT array_agg(p.code) 
              FROM traceflow.user_project_assignment upa 
              JOIN traceflow.project p ON upa.project_id = p.id 
              WHERE upa.user_id = u.id
            ), ARRAY[]::varchar[]) as assigned_project_codes
          FROM traceflow.app_user u
          WHERE LOWER(u.email) = $1 AND u.status = 'ACTIVE'
          LIMIT 1;
        `;
        const res = await this.db.query(query, [normalized]);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err) {
        // Fallback a repositorio local si la consulta falla
      }
    }

    return this.users.find((u) => u.email.toLowerCase() === normalized) || null;
  }

  async findById(id: string): Promise<UserAccountEntity | null> {
    if (this.db.isDatabaseConnected()) {
      try {
        const query = `
          SELECT 
            u.id, u.code, u.username, u.email, u.password_hash, u.full_name, u.organization, u.position, u.status,
            COALESCE((
              SELECT r.code 
              FROM traceflow.user_role_assignment ura 
              JOIN traceflow.app_role r ON ura.role_id = r.id 
              WHERE ura.user_id = u.id AND ura.is_primary = TRUE 
              LIMIT 1
            ), 'PU-01') as primary_role_code,
            COALESCE((
              SELECT array_agg(r.code) 
              FROM traceflow.user_role_assignment ura 
              JOIN traceflow.app_role r ON ura.role_id = r.id 
              WHERE ura.user_id = u.id
            ), ARRAY[]::varchar[]) as assigned_role_codes,
            COALESCE((
              SELECT array_agg(p.code) 
              FROM traceflow.user_project_assignment upa 
              JOIN traceflow.project p ON upa.project_id = p.id 
              WHERE upa.user_id = u.id
            ), ARRAY[]::varchar[]) as assigned_project_codes
          FROM traceflow.app_user u
          WHERE u.id = $1
          LIMIT 1;
        `;
        const res = await this.db.query(query, [id]);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err) {
        // Fallback
      }
    }

    return this.users.find((u) => u.id === id || u.code === id) || null;
  }

  async createSession(record: SessionRecord): Promise<void> {
    if (this.db.isDatabaseConnected()) {
      try {
        await this.db.query(
          `INSERT INTO traceflow.user_session 
            (id, user_id, active_role_id, session_token_hash, ip_address, user_agent, is_revoked, created_at, last_activity_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            record.id,
            record.user_id,
            record.active_role_id,
            record.session_token_hash,
            record.ip_address,
            record.user_agent,
            record.is_revoked,
            record.created_at,
            record.last_activity_at,
            record.expires_at,
          ]
        );
        return;
      } catch (err) {
        // Fallback
      }
    }

    this.sessions.set(record.session_token_hash, record);
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    if (this.db.isDatabaseConnected()) {
      try {
        const res = await this.db.query(
          `SELECT s.*, r.code as active_role_code
           FROM traceflow.user_session s
           JOIN traceflow.app_role r ON s.active_role_id = r.id
           WHERE s.session_token_hash = $1
           LIMIT 1`,
          [tokenHash]
        );
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err) {
        // Fallback
      }
    }

    return this.sessions.get(tokenHash) || null;
  }

  async updateSessionActivity(tokenHash: string, lastActivity: Date): Promise<void> {
    if (this.db.isDatabaseConnected()) {
      try {
        await this.db.query(
          `UPDATE traceflow.user_session SET last_activity_at = $1 WHERE session_token_hash = $2`,
          [lastActivity, tokenHash]
        );
        return;
      } catch (err) {
        // Fallback
      }
    }

    const session = this.sessions.get(tokenHash);
    if (session) {
      session.last_activity_at = lastActivity;
    }
  }

  async revokeSession(tokenHash: string): Promise<void> {
    if (this.db.isDatabaseConnected()) {
      try {
        await this.db.query(
          `UPDATE traceflow.user_session SET is_revoked = TRUE WHERE session_token_hash = $1`,
          [tokenHash]
        );
        return;
      } catch (err) {
        // Fallback
      }
    }

    const session = this.sessions.get(tokenHash);
    if (session) {
      session.is_revoked = true;
    }
  }
}
