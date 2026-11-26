import { Injectable, Logger, Inject } from '@nestjs/common';
import pg from 'pg';
import { DatabaseService } from '../../database/database.service.js';
import type { CanonicalRoleId, GitHubIdentityStatus } from '../../common/types/index.js';

export interface RoleCatalogEntry {
  id: number;
  code: CanonicalRoleId;
  name: string;
  description: string;
}

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
  can_create_projects?: boolean;
  project_creation_authorized_by?: string | null;
  project_creation_authorized_at?: string | Date | null;
  github_username?: string | null;
  github_user_id?: number | null;
  github_identity_status?: GitHubIdentityStatus;
  created_at?: string | Date;
  updated_at?: string | Date;
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
  active_project_id?: string | null;
  created_at: Date;
  last_activity_at: Date;
  expires_at: Date;
}

export const CANONICAL_ROLE_CATALOG: RoleCatalogEntry[] = [
  { id: 1, code: 'PU-01', name: 'Solicitante', description: 'Registra Solicitudes de Cambio (RFC), subsana observaciones y reporta incidencias de software.' },
  { id: 2, code: 'PU-02', name: 'Analista / Gestor de Configuración', description: 'Valida completitud, clasifica solicitudes y co-autoriza cambios menores.' },
  { id: 3, code: 'PU-03', name: 'Arquitecto / Especialista Técnico', description: 'Emite Informes Técnicos de Impacto y co-autoriza cambios menores (Doble Llave).' },
  { id: 4, code: 'PU-04', name: 'Comité de Control de Cambios (CCB)', description: 'Órgano decisional supremo; delibera colegiadamente y emite resoluciones vinculantes (ECN/ECO).' },
  { id: 5, code: 'PU-05', name: 'Bibliotecario / Administrador SCM', description: 'Custodio oficial de las tres bibliotecas; ejecuta Check-In a Maestra, bloqueos y congelamientos.' },
  { id: 6, code: 'PU-06', name: 'Desarrollador / Ingeniero de Software', description: 'Ejecuta cambios aprobados en la Biblioteca de Trabajo e implementa soluciones técnicas autorizadas.' },
  { id: 7, code: 'PU-07', name: 'Calidad / Equipo de Testing (QA)', description: 'Ejecuta pruebas de conformidad, reporta no conformidades y emite Certificados de Conformidad Técnica.' },
  { id: 8, code: 'PU-08', name: 'Administrador del Sistema', description: 'Gestiona usuarios, estados de cuentas, organizaciones, invitaciones y autorizaciones para crear proyectos.' },
  { id: 9, code: 'PU-09', name: 'Jefe de Proyecto', description: 'Crea e inicializa proyectos cuando está autorizado, configura metodología y cronograma, vincula GitHub y conforma equipos.' },
];

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  // Almacén exclusivo para modo mock / pruebas unitarias desconectadas (H-03)
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
      can_create_projects: false,
      github_username: null,
      github_user_id: null,
      github_identity_status: 'UNVERIFIED',
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
      can_create_projects: false,
      github_username: null,
      github_user_id: null,
      github_identity_status: 'UNVERIFIED',
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
      can_create_projects: false,
      github_username: null,
      github_user_id: null,
      github_identity_status: 'UNVERIFIED',
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
      assigned_project_codes: ['PRJ-001', 'PRJ-002'],
      can_create_projects: false,
      github_username: null,
      github_user_id: null,
      github_identity_status: 'UNVERIFIED',
    },
    {
      id: 'a0000001-0000-0000-0000-000000000005',
      code: 'USR-005',
      username: 'sysadmin',
      email: 'admin@exodo.pe',
      password_hash: '$argon2id$v=19$m=19456,t=2,p=1$DfJ7vr4XL13i4+9McOGBig$N9B9GQHn7emS+Et4b0knNa3EnTbenHzZ0wH6X0CkUgE',
      full_name: 'Administrador del Sistema TraceFlow',
      organization: 'ÉXODO S.A.C.',
      position: 'Administrador Global de Plataforma',
      status: 'ACTIVE',
      primary_role_code: 'PU-08',
      assigned_role_codes: ['PU-08'],
      assigned_project_codes: [],
      can_create_projects: false,
      github_username: null,
      github_user_id: null,
      github_identity_status: 'UNVERIFIED',
    },
  ];

  private mockSessions: Map<string, SessionRecord> = new Map();

  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  private runQuery<T extends pg.QueryResultRow = any>(
    sql: string,
    params: any[] = [],
    client?: pg.PoolClient | null
  ): Promise<pg.QueryResult<T>> {
    return client ? client.query<T>(sql, params) : this.db.query<T>(sql, params);
  }

  getMockUsersRef(): UserAccountEntity[] {
    return this.mockUsers;
  }

  getMockSessionsRef(): Map<string, SessionRecord> {
    return this.mockSessions;
  }

  async getRoleCatalog(client?: pg.PoolClient | null): Promise<RoleCatalogEntry[]> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<RoleCatalogEntry>(
        `SELECT id, code, name, description FROM traceflow.app_role ORDER BY id ASC`,
        [],
        client
      );
      return res.rows;
    }
    return [...CANONICAL_ROLE_CATALOG];
  }

  async resolveRoleByCode(
    code: string,
    client?: pg.PoolClient | null
  ): Promise<RoleCatalogEntry | null> {
    const normalized = code.trim().toUpperCase();
    const catalog = await this.getRoleCatalog(client);
    return catalog.find((r) => r.code.toUpperCase() === normalized) || null;
  }

  async resolveRoleById(
    id: number,
    client?: pg.PoolClient | null
  ): Promise<RoleCatalogEntry | null> {
    const catalog = await this.getRoleCatalog(client);
    return catalog.find((r) => Number(r.id) === Number(id)) || null;
  }

  private buildUserSelectQuery(whereClause: string): string {
    return `
      SELECT
        u.id, u.code, u.username, u.email, u.password_hash, u.full_name,
        u.organization, u.position, u.status,
        u.can_create_projects, u.project_creation_authorized_by, u.project_creation_authorized_at,
        u.github_username, u.github_user_id, u.github_identity_status,
        u.created_at, u.updated_at,
        COALESCE((
          SELECT r.code
          FROM traceflow.user_role_assignment ura
          JOIN traceflow.app_role r ON ura.role_id = r.id
          WHERE ura.user_id = u.id AND ura.status = 'ACTIVE'
          ORDER BY ura.is_primary DESC, ura.role_id ASC
          LIMIT 1
        ), 'PU-01') as primary_role_code,
        COALESCE((
          SELECT array_agg(r.code ORDER BY ura.is_primary DESC, r.id ASC)
          FROM traceflow.user_role_assignment ura
          JOIN traceflow.app_role r ON ura.role_id = r.id
          WHERE ura.user_id = u.id AND ura.status = 'ACTIVE'
        ), ARRAY[]::varchar[]) as assigned_role_codes,
        COALESCE((
          SELECT array_agg(DISTINCT pval)
          FROM traceflow.user_project_assignment upa
          JOIN traceflow.project p ON upa.project_id = p.id,
          LATERAL (VALUES (p.code), (p.id::text)) AS val(pval)
          WHERE upa.user_id = u.id
        ), ARRAY[]::varchar[]) as assigned_project_codes
      FROM traceflow.app_user u
      ${whereClause}
      LIMIT 1;
    `;
  }

  async findByEmail(email: string, client?: pg.PoolClient | null): Promise<UserAccountEntity | null> {
    const normalized = email.trim().toLowerCase();

    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<UserAccountEntity>(
        this.buildUserSelectQuery('WHERE LOWER(u.email) = $1'),
        [normalized],
        client
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }

    return this.mockUsers.find((u) => u.email.toLowerCase() === normalized) || null;
  }

  async findById(id: string, client?: pg.PoolClient | null): Promise<UserAccountEntity | null> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery<UserAccountEntity>(
        this.buildUserSelectQuery('WHERE u.id::text = $1 OR u.code = $1'),
        [id],
        client
      );
      return res.rows.length > 0 ? res.rows[0] : null;
    }

    return this.mockUsers.find((u) => u.id === id || u.code === id) || null;
  }

  async createSession(record: SessionRecord): Promise<void> {
    if (this.db.getDatabaseMode() === 'postgres') {
      await this.db.query(
        `INSERT INTO traceflow.user_session
          (id, user_id, active_role_id, session_token_hash, ip_address, user_agent, is_revoked, active_project_id, created_at, last_activity_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          record.id,
          record.user_id,
          record.active_role_id,
          record.session_token_hash,
          record.ip_address || null,
          record.user_agent || null,
          record.is_revoked,
          record.active_project_id || null,
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
      const res = await this.db.query<SessionRecord>(
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

  async revokeAllUserSessions(userId: string, client?: pg.PoolClient | null): Promise<number> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery(
        `UPDATE traceflow.user_session SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE`,
        [userId],
        client
      );
      return res.rowCount ?? 0;
    }

    let count = 0;
    for (const session of this.mockSessions.values()) {
      if (session.user_id === userId && !session.is_revoked) {
        session.is_revoked = true;
        count++;
      }
    }
    return count;
  }

  async revokeUserRoleSessions(
    userId: string,
    roleId: number,
    client?: pg.PoolClient | null
  ): Promise<number> {
    if (this.db.getDatabaseMode() === 'postgres') {
      const res = await this.runQuery(
        `UPDATE traceflow.user_session
         SET is_revoked = TRUE
         WHERE user_id = $1 AND active_role_id = $2 AND is_revoked = FALSE`,
        [userId, roleId],
        client
      );
      return res.rowCount ?? 0;
    }

    let count = 0;
    for (const session of this.mockSessions.values()) {
      if (session.user_id === userId && session.active_role_id === roleId && !session.is_revoked) {
        session.is_revoked = true;
        count++;
      }
    }
    return count;
  }
}
