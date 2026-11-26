import { Injectable, Logger, Inject } from '@nestjs/common';
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
  private readonly logger = new Logger(AuthRepository.name);

  // Almacén seguro exclusivo para modo mock / pruebas unitarias desconectadas (H-03)
  // Cada usuario cuenta con un hash Argon2id independiente generado con sal criptográfica única (H-02)
  private mockUsers: UserAccountEntity[] = [
    {
      id: 'a0000001-0000-0000-0000-000000000001',
      code: 'USR-001',
      username: 'jmedina',
      email: 'jmedina@exodo.pe',
      password_hash: '$argon2id$v=19$m=19456,t=2,p=1$DfJ7vr4XL13i4+9McOGBig$N9B9GQHn7emS+Et4b0knNa3EnTbenHzZ0wH6X0CkUgE',
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
      password_hash: '$argon2id$v=19$m=19456,t=2,p=1$Pz0lMqDi3iM5GCiKmtdiQA$toYBcyj1l44TUU/5RbRLYPjPTyQ/0vwKr9R4LOD9Nb4',
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
      password_hash: '$argon2id$v=19$m=19456,t=2,p=1$HShCQV/w5JAvLmYn5ysJKg$qdzfRx+iGNQ5xYQHHHZoYOMarUQ+qnKDimHbUtU9V+Y',
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
      password_hash: '$argon2id$v=19$m=19456,t=2,p=1$ggNFQqt7NFqHJ0d8WPl1qw$Oq69LlMFoDcd6u6F8d+Dy5tm6mX4A6ekG5KhJV/h4i4',
      full_name: 'Renzo Fernando Loyola Vilca Choque',
      organization: 'ÉXODO S.A.C.',
      position: 'Coordinador de Proyectos y CCB',
      status: 'ACTIVE',
      primary_role_code: 'PU-04',
      assigned_role_codes: ['PU-04'],
      assigned_project_codes: ['PRJ-001', 'PRJ-002'], // VETO ESTRICTO PRJ-003
    },
  ];

  private mockSessions: Map<string, SessionRecord> = new Map();

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  async findByEmail(email: string): Promise<UserAccountEntity | null> {
    const normalized = email.trim().toLowerCase();

    // Modo PostgreSQL Real (H-03: Sin fallback silencioso)
    if (this.db.getDatabaseMode() === 'postgres') {
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
            SELECT array_agg(DISTINCT pval) 
            FROM traceflow.user_project_assignment upa 
            JOIN traceflow.project p ON upa.project_id = p.id,
            LATERAL (VALUES (p.code), (p.id::text)) AS val(pval)
            WHERE upa.user_id = u.id
          ), ARRAY[]::varchar[]) as assigned_project_codes
        FROM traceflow.app_user u
        WHERE LOWER(u.email) = $1 AND u.status = 'ACTIVE'
        LIMIT 1;
      `;
      const res = await this.db.query(query, [normalized]);
      return res.rows.length > 0 ? res.rows[0] : null;
    }

    // Modo Mock en memoria exclusivo para pruebas
    return this.mockUsers.find((u) => u.email.toLowerCase() === normalized) || null;
  }

  async findById(id: string): Promise<UserAccountEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
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
            SELECT array_agg(DISTINCT pval) 
            FROM traceflow.user_project_assignment upa 
            JOIN traceflow.project p ON upa.project_id = p.id,
            LATERAL (VALUES (p.code), (p.id::text)) AS val(pval)
            WHERE upa.user_id = u.id
          ), ARRAY[]::varchar[]) as assigned_project_codes
        FROM traceflow.app_user u
        WHERE u.id::text = $1 OR u.code = $1
        LIMIT 1;
      `;
      const res = await this.db.query(query, [id]);
      return res.rows.length > 0 ? res.rows[0] : null;
    }

    return this.mockUsers.find((u) => u.id === id || u.code === id) || null;
  }

  async createSession(record: SessionRecord): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
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
    }

    this.mockSessions.set(record.session_token_hash, record);
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.db.query(
        `SELECT s.*, r.code as active_role_code
         FROM traceflow.user_session s
         JOIN traceflow.app_role r ON s.active_role_id = r.id
         WHERE s.session_token_hash = $1
         LIMIT 1`,
        [tokenHash]
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }

    return this.mockSessions.get(tokenHash) || null;
  }

  async updateSessionActivity(tokenHash: string, lastActivity: Date): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
      await this.db.query(
        `UPDATE traceflow.user_session SET last_activity_at = $1 WHERE session_token_hash = $2`,
        [lastActivity, tokenHash]
      );
      return;
    }

    const session = this.mockSessions.get(tokenHash);
    if (session) {
      session.last_activity_at = lastActivity;
    }
  }

  async revokeSession(tokenHash: string): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
      await this.db.query(
        `UPDATE traceflow.user_session SET is_revoked = TRUE WHERE session_token_hash = $1`,
        [tokenHash]
      );
      return;
    }

    const session = this.mockSessions.get(tokenHash);
    if (session) {
      session.is_revoked = true;
    }
  }
}
