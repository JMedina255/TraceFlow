import fs from 'node:fs';
import path from 'node:path';
import { hash } from '@node-rs/argon2';
import pg from 'pg';
const { Pool, Client } = pg;

export interface RealDbSetupOptions {
  host?: string;
  port?: number;
  adminUser?: string;
  adminPassword?: string;
  appUser?: string;
  appPassword?: string;
  database?: string;
}

export const DEFAULT_REAL_DB_OPTIONS: Required<RealDbSetupOptions> = {
  host: process.env.TEST_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
  adminUser: process.env.TEST_DB_ADMIN_USER || 'postgres',
  adminPassword: process.env.TEST_DB_ADMIN_PASSWORD || '',
  appUser: process.env.TEST_DB_APP_USER || 'traceflow_app',
  appPassword: process.env.TEST_DB_APP_PASSWORD || 'TestAppPassword123!',
  database: process.env.TEST_DB_NAME || 'traceflow_cert',
};

export async function resetAndMigrateRealPostgres(
  options: RealDbSetupOptions = {}
): Promise<{
  adminPool: pg.Pool;
  appPool: pg.Pool;
  appliedMigrations: string[];
}> {
  const opts = { ...DEFAULT_REAL_DB_OPTIONS, ...options };

  // 1. Conexión de administración (postgres) para recrear la base de datos de pruebas aislada
  const adminClient = new Client({
    host: opts.host,
    port: opts.port,
    user: opts.adminUser,
    password: opts.adminPassword,
    database: 'postgres',
  });

  await adminClient.connect();

  // Terminar conexiones activas hacia la base de datos de pruebas si existe
  await adminClient.query(
    `
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = $1 AND pid <> pg_backend_pid();
  `,
    [opts.database]
  );

  await adminClient.query(`DROP DATABASE IF EXISTS ${opts.database};`);
  await adminClient.query(`CREATE DATABASE ${opts.database};`);

  // Asegurar que el rol operativo traceflow_app exista con login
  await adminClient.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${opts.appUser}') THEN
        CREATE ROLE ${opts.appUser} WITH LOGIN PASSWORD '${opts.appPassword}';
      ELSE
        ALTER ROLE ${opts.appUser} WITH LOGIN PASSWORD '${opts.appPassword}';
      END IF;
    END $$;
  `);

  await adminClient.end();

  // 2. Conectar a la nueva base de datos como admin para aplicar las migraciones oficiales en orden
  const adminDbClient = new Client({
    host: opts.host,
    port: opts.port,
    user: opts.adminUser,
    password: opts.adminPassword,
    database: opts.database,
  });

  await adminDbClient.connect();

  // Crear esquema extensions y pgcrypto en extensions (tal como en Supabase y como requiere append_audit_log)
  await adminDbClient.query(`
    CREATE SCHEMA IF NOT EXISTS extensions;
    CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
    GRANT USAGE ON SCHEMA extensions TO ${opts.appUser};
    GRANT EXECUTE ON ALL ROUTINES IN SCHEMA extensions TO ${opts.appUser};
  `);

  const migrationsDir = path.resolve(process.cwd(), '../supabase/migrations');
  const seedsDir = path.resolve(process.cwd(), '../supabase/seeds');

  const appliedMigrations: string[] = [];

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

  await adminDbClient.end();

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
