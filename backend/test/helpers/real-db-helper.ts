import fs from 'node:fs';
import path from 'node:path';
import { hash } from '@node-rs/argon2';
import pg from 'pg';
import {
  assertSafeDestructiveDatabaseReset,
  quoteSqlIdentifier,
} from '../../src/common/guards/test-isolation.guard.js';

const { Pool, Client } = pg;

export interface RealDbSetupOptions {
  host?: string;
  port?: number;
  adminUser?: string;
  adminPassword?: string;
  appUser?: string;
  appPassword?: string;
  database?: string;
  allowDestructiveReset?: boolean;
  targetMigration?: 'H02' | 'H03';
}

export const DEFAULT_REAL_DB_OPTIONS: Required<RealDbSetupOptions> = {
  host: process.env.TEST_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
  adminUser: process.env.TEST_DB_ADMIN_USER || 'postgres',
  adminPassword: process.env.TEST_DB_ADMIN_PASSWORD || '',
  appUser: process.env.TEST_DB_APP_USER || 'traceflow_app',
  appPassword: process.env.TEST_DB_APP_PASSWORD || 'TestAppPassword123!',
  database: process.env.TEST_DB_NAME || 'traceflow_cert',
  allowDestructiveReset: process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET === 'true',
  targetMigration: 'H03',
};

export async function resetAndMigrateRealPostgres(
  options: RealDbSetupOptions = {}
): Promise<{
  adminPool: pg.Pool;
  appPool: pg.Pool;
  appliedMigrations: string[];
}> {
  const opts = { ...DEFAULT_REAL_DB_OPTIONS, ...options };

  // 0. Salvaguarda crítica: Validar que el destino sea un PostgreSQL local permitido,
  // con nombre en la lista blanca de bases descartables y autorización deliberada explícita.
  assertSafeDestructiveDatabaseReset({
    host: opts.host,
    database: opts.database,
    allowDestructiveReset: opts.allowDestructiveReset,
  });

  const safeDbIdent = quoteSqlIdentifier(opts.database);
  quoteSqlIdentifier(opts.adminUser);
  quoteSqlIdentifier(opts.appUser);

  // 1. Conexión de administración (postgres) para recrear la base de datos de pruebas aislada
  const adminClient = new Client({
    host: opts.host,
    port: opts.port,
    user: opts.adminUser,
    password: opts.adminPassword,
    database: 'postgres',
  });

  await adminClient.connect();

  try {
    // 0.1 Comprobación verificable del entorno descartable mediante introspección directa de PostgreSQL
    const srvCheck = await adminClient.query(
      'SELECT inet_server_addr()::text AS srv_addr, inet_server_port() AS srv_port, current_database() AS curr_db;'
    );
    const { srv_addr, curr_db } = srvCheck.rows[0];
    if (srv_addr && srv_addr !== '127.0.0.1' && srv_addr !== '::1' && !srv_addr.startsWith('127.')) {
      throw new Error(
        `[BLOQUEO DESTRUCCTIVO] Introspección de servidor fallida: La conexión activa se estableció hacia la dirección no local '${srv_addr}'. Operación de borrado cancelada.`
      );
    }
    if (curr_db === opts.database) {
      throw new Error(
        `[BLOQUEO DESTRUCCTIVO] Introspección fallida: La base de datos conectada '${curr_db}' coincide con la base que se intenta eliminar.`
      );
    }

    const tplCheck = await adminClient.query(
      'SELECT datistemplate FROM pg_database WHERE datname = $1;',
      [opts.database]
    );
    if (tplCheck.rows.length > 0 && tplCheck.rows[0].datistemplate) {
      throw new Error(
        `[BLOQUEO DESTRUCCTIVO] La base de datos '${opts.database}' es una plantilla de sistema (template). Prohibido eliminar.`
      );
    }

    // Terminar conexiones activas hacia la base de datos de pruebas si existe (usando parámetros bind)
    await adminClient.query(
      `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid();
    `,
      [opts.database]
    );

    // Recrear base de datos descartable usando identificador sanitizado y entrecomillado
    await adminClient.query(`DROP DATABASE IF EXISTS ${safeDbIdent};`);
    await adminClient.query(`CREATE DATABASE ${safeDbIdent};`);

    // Asegurar que el rol operativo traceflow_app exista con login usando PostgreSQL format(%I, %L)
    // para evitar cualquier interpolación insegura de identificadores o contraseñas
    const checkRoleRes = await adminClient.query(
      'SELECT 1 FROM pg_roles WHERE rolname = $1',
      [opts.appUser]
    );

    if (checkRoleRes.rows.length === 0) {
      const createRoleStmt = await adminClient.query(
        'SELECT format(\'CREATE ROLE %I WITH LOGIN PASSWORD %L\', $1::text, $2::text) AS stmt',
        [opts.appUser, opts.appPassword]
      );
      await adminClient.query(createRoleStmt.rows[0].stmt);
    } else {
      const alterRoleStmt = await adminClient.query(
        'SELECT format(\'ALTER ROLE %I WITH LOGIN PASSWORD %L\', $1::text, $2::text) AS stmt',
        [opts.appUser, opts.appPassword]
      );
      await adminClient.query(alterRoleStmt.rows[0].stmt);
    }
  } finally {
    await adminClient.end();
  }

  // 2. Conectar a la nueva base de datos como admin para aplicar las migraciones oficiales en orden
  const adminDbClient = new Client({
    host: opts.host,
    port: opts.port,
    user: opts.adminUser,
    password: opts.adminPassword,
    database: opts.database,
  });

  await adminDbClient.connect();

  const appliedMigrations: string[] = [];

  try {
    // Crear esquema extensions y pgcrypto en extensions (tal como en Supabase y como requiere append_audit_log)
    await adminDbClient.query(`
      CREATE SCHEMA IF NOT EXISTS extensions;
      CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
    `);

    // Otorgar permisos al usuario de aplicación usando format() seguro
    const grantPermsStmt = await adminDbClient.query(
      'SELECT format(\'GRANT USAGE ON SCHEMA extensions TO %I; GRANT EXECUTE ON ALL ROUTINES IN SCHEMA extensions TO %I;\', $1::text, $1::text) AS stmt',
      [opts.appUser]
    );
    await adminDbClient.query(grantPermsStmt.rows[0].stmt);

    const migrationsDir = path.resolve(process.cwd(), '../supabase/migrations');
    const seedsDir = path.resolve(process.cwd(), '../supabase/seeds');

    // Paso 1: Migración inicial (21 tablas, secuencias, funciones base)
    const mig1 = fs.readFileSync(path.join(migrationsDir, '202611250001_initial_traceflow.sql'), 'utf8');
    await adminDbClient.query(mig1);
    appliedMigrations.push('202611250001_initial_traceflow.sql');

    // Paso 2: Catálogo estructural de roles
    const mig2 = fs.readFileSync(path.join(migrationsDir, '202611250002_structural_seeds.sql'), 'utf8');
    await adminDbClient.query(mig2);
    appliedMigrations.push('202611250002_structural_seeds.sql');

    // Paso 3: Estado pre-H02 histórico (proyectos PRJ-001..PRJ-003 y usuarios USR-001..USR-004 de ÉXODO S.A.C.)
    const demoSeedsSql = fs.readFileSync(path.join(seedsDir, 'demo_seeds.sql.example'), 'utf8');
    await adminDbClient.query(demoSeedsSql);

    const pwdHash = await hash('SecurePassword123!', {
      memoryCost: 65536,
      timeCost: 3,
      outputLen: 32,
      parallelism: 4,
    });

    const users = [
      { id: 'a0000001-0000-0000-0000-000000000001', code: 'USR-001', username: 'jmedina', email: 'jmedina@exodo.pe', name: 'Joan Cristian Medina Quispe', roleId: 2, roles: [2, 1], prjs: ['PRJ-001', 'PRJ-002', 'PRJ-003'] },
      { id: 'a0000001-0000-0000-0000-000000000002', code: 'USR-002', username: 'rantayhua', email: 'rantayhua@exodo.pe', name: 'Renzo Antonio Antayhua Mamani', roleId: 3, roles: [3, 6], prjs: ['PRJ-001', 'PRJ-002', 'PRJ-003'] },
      { id: 'a0000001-0000-0000-0000-000000000003', code: 'USR-003', username: 'arivera', email: 'arivera@exodo.pe', name: 'Augusto Joaquin Rivera Muñoz', roleId: 5, roles: [5, 7], prjs: ['PRJ-001', 'PRJ-002', 'PRJ-003'] },
      { id: 'a0000001-0000-0000-0000-000000000004', code: 'USR-004', username: 'rloyola', email: 'rloyola@exodo.pe', name: 'Renzo Fernando Loyola Vilca Choque', roleId: 4, roles: [4], prjs: ['PRJ-001', 'PRJ-002'] },
    ];

    for (const u of users) {
      await adminDbClient.query(
        `INSERT INTO traceflow.app_user (id, code, username, email, password_hash, full_name, organization, position, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'ÉXODO S.A.C.', 'Ingeniero', 'ACTIVE')
         ON CONFLICT (id) DO NOTHING;`,
        [u.id, u.code, u.username, u.email, pwdHash, u.name]
      );

      for (const r of u.roles) {
        await adminDbClient.query(
          `INSERT INTO traceflow.user_role_assignment (user_id, role_id, is_primary)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, role_id) DO NOTHING;`,
          [u.id, r, r === u.roleId]
        );
      }

      for (const p of u.prjs) {
        await adminDbClient.query(
          `INSERT INTO traceflow.user_project_assignment (user_id, project_id)
           SELECT $1, id FROM traceflow.project WHERE code = $2
           ON CONFLICT (user_id, project_id) DO NOTHING;`,
          [u.id, p]
        );
      }
    }

    // Paso 4: Mínimo privilegio histórico de aplicación
    const mig3 = fs.readFileSync(path.join(migrationsDir, '202611250003_secure_app_role_least_privilege.sql'), 'utf8');
    await adminDbClient.query(mig3);
    appliedMigrations.push('202611250003_secure_app_role_least_privilege.sql');

    // Paso 5: Migración INIT-H02 (organizaciones, miembros, restricciones canónicas, least privilege actualizado)
    const migH02 = fs.readFileSync(path.join(migrationsDir, '202611260001_init_h02_organizations_and_projects.sql'), 'utf8');
    await adminDbClient.query(migH02);
    appliedMigrations.push('202611260001_init_h02_organizations_and_projects.sql');

    // Paso 6: Migración INIT-H03 (equipos, metodologías, fases, hitos, entregables, setup progresivo)
    if (opts.targetMigration !== 'H02') {
      const migH03 = fs.readFileSync(path.join(migrationsDir, '202611260002_init_h03_team_methodology_planning.sql'), 'utf8');
      await adminDbClient.query(migH03);
      appliedMigrations.push('202611260002_init_h03_team_methodology_planning.sql');
    }

    // Paso 7: Migración INIT-H04A (integración segura de repositorios GitHub, permisos, no DELETE)
    if (opts.targetMigration !== 'H02' && opts.targetMigration !== 'H03') {
      const migH04A = fs.readFileSync(path.join(migrationsDir, '202611260003_init_h04a_github_integration.sql'), 'utf8');
      await adminDbClient.query(migH04A);
      appliedMigrations.push('202611260003_init_h04a_github_integration.sql');
    }

    // Paso 8: Migración INIT-H04A-R (asociación de instalaciones, unicidad canónica por github_repo_id)
    if (opts.targetMigration !== 'H02' && opts.targetMigration !== 'H03' && opts.targetMigration !== 'H04A') {
      const migH04AR = fs.readFileSync(path.join(migrationsDir, '202611260004_init_h04a_r_github_security.sql'), 'utf8');
      await adminDbClient.query(migH04AR);
      appliedMigrations.push('202611260004_init_h04a_r_github_security.sql');
    }
  } finally {
    await adminDbClient.end();
  }

  // 3. Crear pools listos para pruebas: admin (superuser) y app (least privilege)
  const adminPool = new Pool({
    host: opts.host,
    port: opts.port,
    user: opts.adminUser,
    password: opts.adminPassword,
    database: opts.database,
    max: 10,
  });

  const appPool = new Pool({
    host: opts.host,
    port: opts.port,
    user: opts.appUser,
    password: opts.appPassword,
    database: opts.database,
    max: 10,
  });

  return { adminPool, appPool, appliedMigrations };
}
