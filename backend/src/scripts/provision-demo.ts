/**
 * ============================================================================
 * TRACEFLOW SCM — APROVISIONAMIENTO IDEMPOTENTE DE CUENTAS DE EVALUACIÓN (DEMO-01)
 * Archivo: backend/src/scripts/provision-demo.ts
 * Uso local exclusivo:
 *   npm run provision:demo
 *
 * Seguridad:
 *  - Bloquea ejecución contra Supabase remoto, hosts en la nube y NODE_ENV=production.
 *  - No almacena contraseñas en código fuente ni imprime hashes/secretos en logs.
 *  - Reutiliza AuthService (Argon2id con sal independiente), UsersService y AuditService.
 *  - No sobrescribe contraseñas ni perfiles de cuentas existentes (incluyendo USR-001..USR-004).
 * ============================================================================
 */
import 'dotenv/config';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import { DatabaseService } from '../database/database.service.js';
import { AuditService } from '../modules/audit/audit.service.js';
import { AuthRepository } from '../modules/auth/auth.repository.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { OrganizationsRepository } from '../modules/organizations/organizations.repository.js';
import { UsersRepository } from '../modules/users/users.repository.js';
import { UsersService } from '../modules/users/users.service.js';
import {
  isLocalDatabaseHost,
  isRemoteDatabaseHost,
  sanitizeDatabaseUrl,
} from '../common/guards/test-isolation.guard.js';
import type { AuthenticatedUser, CanonicalRoleId } from '../common/types/index.js';

export interface DemoAccountSpec {
  roleCode: CanonicalRoleId;
  fullName: string;
  email: string;
  username: string;
  position: string;
}

export const DEMO_ACCOUNTS_CATALOG: readonly DemoAccountSpec[] = [
  {
    roleCode: 'PU-01',
    fullName: 'Solicitante',
    email: 'usuario@exodo.pe',
    username: 'usuario_demo',
    position: 'Solicitante de Cambios',
  },
  {
    roleCode: 'PU-02',
    fullName: 'Analista de Requerimientos',
    email: 'analistarequerimientos@exodo.pe',
    username: 'analistarequerimientos',
    position: 'Analista / Gestor de Configuración',
  },
  {
    roleCode: 'PU-03',
    fullName: 'Arquitecto de Software',
    email: 'arquitecto@exodo.pe',
    username: 'arquitecto_demo',
    position: 'Arquitecto / Especialista Técnico',
  },
  {
    roleCode: 'PU-04',
    fullName: 'Miembro del CCB',
    email: 'ccb@exodo.pe',
    username: 'ccb_demo',
    position: 'Comité de Control de Cambios (CCB)',
  },
  {
    roleCode: 'PU-05',
    fullName: 'Bibliotecario SCM',
    email: 'bibliotecario@exodo.pe',
    username: 'bibliotecario_demo',
    position: 'Bibliotecario / Administrador SCM',
  },
  {
    roleCode: 'PU-06',
    fullName: 'Desarrollador',
    email: 'desarrollador@exodo.pe',
    username: 'desarrollador_demo',
    position: 'Desarrollador / Ingeniero de Software',
  },
  {
    roleCode: 'PU-07',
    fullName: 'Responsable de Calidad',
    email: 'qa@exodo.pe',
    username: 'qa_demo',
    position: 'Calidad / Testing (QA)',
  },
  {
    roleCode: 'PU-08',
    fullName: 'Administrador del Sistema',
    email: 'admin@exodo.pe',
    username: 'sysadmin',
    position: 'Administrador Global de Plataforma',
  },
  {
    roleCode: 'PU-09',
    fullName: 'Jefe de Proyecto',
    email: 'jefeproyecto@exodo.pe',
    username: 'jefeproyecto_demo',
    position: 'Jefe de Proyecto',
  },
] as const;

const FORBIDDEN_DEMO_DB_NAMES = new Set([
  'postgres',
  'template0',
  'template1',
  'production',
  'prod',
  'supabase',
]);

export function assertSafeLocalDemoDatabase(
  databaseUrl?: string,
  nodeEnv = process.env.NODE_ENV
): void {
  if ((nodeEnv || '').trim().toLowerCase() === 'production') {
    throw new Error(
      '[DEMO-01 BLOQUEADO] Prohibido ejecutar provision:demo cuando NODE_ENV=production.'
    );
  }

  if (!databaseUrl || !databaseUrl.trim()) {
    throw new Error(
      '[DEMO-01 BLOQUEADO] DATABASE_URL no está definida. Configure una base de datos PostgreSQL local antes de ejecutar provision:demo.'
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(
      '[DEMO-01 BLOQUEADO] DATABASE_URL no tiene un formato URI válido.'
    );
  }

  if (isRemoteDatabaseHost(databaseUrl) || !isLocalDatabaseHost(parsed.hostname)) {
    throw new Error(
      `[DEMO-01 BLOQUEADO] El destino '${sanitizeDatabaseUrl(databaseUrl)}' no corresponde a un host local autorizado (127.0.0.1 / localhost). Prohibido contra Supabase o entornos remotos.`
    );
  }

  const dbName = parsed.pathname.replace(/^\/+/, '').trim().toLowerCase();
  if (!dbName || FORBIDDEN_DEMO_DB_NAMES.has(dbName)) {
    throw new Error(
      `[DEMO-01 BLOQUEADO] La base de datos '${dbName || '(vacía)'}' no está autorizada para aprovisionamiento de demostración.`
    );
  }
}

export async function promptHiddenPassword(
  promptText = 'Ingrese contraseña común de demostración local (mín. 8 caracteres): '
): Promise<string> {
  const fromEnv = process.env.DEMO_PROVISION_PASSWORD;
  if (fromEnv !== undefined) {
    if (fromEnv.length < 8) {
      throw new Error('DEMO_PROVISION_PASSWORD debe tener al menos 8 caracteres.');
    }
    return fromEnv;
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      'Se requiere entrada interactiva TTY o definir DEMO_PROVISION_PASSWORD en el entorno local para aprovisionar cuentas demo.'
    );
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(promptText);

    let password = '';
    const wasRaw = Boolean(stdin.isRaw);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(wasRaw);
      stdin.pause();
    };

    const onData = (char: string) => {
      for (const ch of char) {
        if (ch === '\r' || ch === '\n') {
          stdout.write('\n');
          cleanup();
          if (password.length < 8) {
            reject(new Error('La contraseña debe tener al menos 8 caracteres.'));
          } else {
            resolve(password);
          }
          return;
        }
        if (ch === '\u0003') {
          stdout.write('\n');
          cleanup();
          reject(new Error('Operación cancelada por el usuario.'));
          return;
        }
        if (ch === '\u007f' || ch === '\b') {
          if (password.length > 0) {
            password = password.slice(0, -1);
          }
          continue;
        }
        password += ch;
      }
    };

    stdin.on('data', onData);
  });
}

export interface DemoProvisionAccountResult {
  roleCode: CanonicalRoleId;
  email: string;
  code: string;
  status: 'CREATED' | 'SKIPPED_EXISTING';
  canCreateProjects: boolean;
}

export interface DemoProvisionDependencies {
  db: DatabaseService;
  authRepo: AuthRepository;
  usersRepo: UsersRepository;
  orgRepo: OrganizationsRepository;
  authService: AuthService;
  usersService: UsersService;
  auditService: AuditService;
}

export async function provisionDemoAccounts(
  deps: DemoProvisionDependencies,
  commonPassword: string
): Promise<DemoProvisionAccountResult[]> {
  if (!commonPassword || commonPassword.length < 8) {
    throw new Error('La contraseña común de demostración debe tener al menos 8 caracteres.');
  }

  const orgExodo = await deps.orgRepo.findByIdOrSlugOrCode('ORG-EXODO');
  if (!orgExodo) {
    throw new Error(
      "Organización institucional 'ORG-EXODO' (ÉXODO S.A.C.) no encontrada. Aplique las migraciones locales antes de aprovisionar cuentas de demostración."
    );
  }

  const results: DemoProvisionAccountResult[] = [];
  const adminSpec = DEMO_ACCOUNTS_CATALOG.find((a) => a.roleCode === 'PU-08')!;
  const normalizedAdminEmail = adminSpec.email.trim().toLowerCase();

  // 1. Resolver o crear cuenta PU-08 (admin@exodo.pe) sin sobrescribir si ya existe
  let existingAdmin = await deps.authRepo.findByEmail(normalizedAdminEmail);
  if (!existingAdmin) {
    existingAdmin = await deps.usersRepo.findByUsername(adminSpec.username);
  }

  if (existingAdmin) {
    if (!existingAdmin.assigned_role_codes.includes('PU-08')) {
      throw new Error(
        `La cuenta existente '${existingAdmin.email}' no tiene asignado el perfil PU-08 requerido para ejecutar el aprovisionamiento administrativo.`
      );
    }
    results.push({
      roleCode: 'PU-08',
      email: existingAdmin.email,
      code: existingAdmin.code,
      status: 'SKIPPED_EXISTING',
      canCreateProjects: Boolean(existingAdmin.can_create_projects),
    });
  } else {
    const adminHash = await deps.authService.hashPassword(commonPassword);
    const createdAdmin = await deps.db.transaction(async (client) => {
      const pu08 = await deps.authRepo.resolveRoleByCode('PU-08', client);
      if (!pu08) {
        throw new Error('El perfil canónico PU-08 no está registrado en app_role.');
      }
      const code = await deps.usersRepo.getNextUserCode(client);
      const userId = crypto.randomUUID();

      await deps.usersRepo.createUser(
        {
          id: userId,
          code,
          username: adminSpec.username,
          email: normalizedAdminEmail,
          passwordHash: adminHash,
          fullName: adminSpec.fullName,
          organization: orgExodo.name,
          position: adminSpec.position,
          status: 'ACTIVE',
          githubUsername: null,
          githubIdentityStatus: 'UNVERIFIED',
        },
        client
      );

      await deps.usersRepo.upsertUserRole(
        userId,
        pu08.id,
        'PU-08',
        true,
        userId,
        client
      );

      await deps.auditService.logEvent(
        {
          eventCode: 'USER_CREATED',
          actorUserId: userId,
          actorRole: 'PU-08',
          operation: 'DEMO_BOOTSTRAP_ADMIN',
          entityName: 'app_user',
          entityId: userId,
          resultStatus: 'SUCCESS',
          payloadDiff: {
            code,
            username: adminSpec.username,
            email: normalizedAdminEmail,
            roles: ['PU-08'],
            canCreateProjects: false,
          },
          ipAddress: '127.0.0.1',
          userAgent: 'TraceFlow-Demo-Provisioner',
        },
        client
      );

      return (await deps.authRepo.findById(userId, client))!;
    });

    existingAdmin = createdAdmin;
    results.push({
      roleCode: 'PU-08',
      email: createdAdmin.email,
      code: createdAdmin.code,
      status: 'CREATED',
      canCreateProjects: false,
    });
  }

  const adminCaller: AuthenticatedUser = {
    id: existingAdmin.id,
    code: existingAdmin.code,
    username: existingAdmin.username,
    email: existingAdmin.email,
    fullName: existingAdmin.full_name,
    organization: existingAdmin.organization,
    position: existingAdmin.position,
    activeRoleId: 'PU-08',
    allowedRoleIds: existingAdmin.assigned_role_codes,
    assignedProjectIds: [],
    canCreateProjects: Boolean(existingAdmin.can_create_projects),
  };

  // 2. Aprovisionar los perfiles PU-01..PU-07 y PU-09 mediante UsersService (reutilizando validaciones, Argon2id y auditoría)
  for (const spec of DEMO_ACCOUNTS_CATALOG) {
    if (spec.roleCode === 'PU-08') continue;

    const normalizedEmail = spec.email.trim().toLowerCase();
    const existingByEmail = await deps.authRepo.findByEmail(normalizedEmail);
    const existingByUsername = await deps.usersRepo.findByUsername(spec.username);
    const existing = existingByEmail || existingByUsername;

    if (existing) {
      results.push({
        roleCode: spec.roleCode,
        email: existing.email,
        code: existing.code,
        status: 'SKIPPED_EXISTING',
        canCreateProjects: Boolean(existing.can_create_projects),
      });
      continue;
    }

    const isPm = spec.roleCode === 'PU-09';
    const created = await deps.usersService.createUser(
      {
        fullName: spec.fullName,
        email: normalizedEmail,
        username: spec.username,
        position: spec.position,
        organization: orgExodo.name,
        organizationId: orgExodo.code,
        password: commonPassword,
        status: 'ACTIVE',
        roleCodes: isPm ? [] : [spec.roleCode],
        primaryRoleCode: spec.roleCode,
        authorizeProjectCreation: isPm,
      },
      adminCaller,
      '127.0.0.1',
      'TraceFlow-Demo-Provisioner'
    );

    results.push({
      roleCode: spec.roleCode,
      email: created.email,
      code: created.code,
      status: 'CREATED',
      canCreateProjects: created.canCreateProjects,
    });
  }

  return results;
}

async function main() {
  assertSafeLocalDemoDatabase(process.env.DATABASE_URL, process.env.NODE_ENV);
  const commonPassword = await promptHiddenPassword();

  const db = new DatabaseService('postgres');
  await db.onModuleInit();

  try {
    const authRepo = new AuthRepository(db);
    const usersRepo = new UsersRepository(db, authRepo);
    const orgRepo = new OrganizationsRepository(db, authRepo);
    const auditService = new AuditService(db);
    const authService = new AuthService(authRepo, auditService);
    const usersService = new UsersService(
      db,
      usersRepo,
      authRepo,
      authService,
      orgRepo,
      auditService
    );

    const results = await provisionDemoAccounts(
      { db, authRepo, usersRepo, orgRepo, authService, usersService, auditService },
      commonPassword
    );

    console.log('\nResultado de aprovisionamiento DEMO-01 (entorno local ÉXODO S.A.C.):');
    for (const r of results) {
      console.log(
        ` - [${r.status}] ${r.roleCode} | ${r.code} | ${r.email} | canCreateProjects=${r.canCreateProjects}`
      );
    }
    console.log('Aprovisionamiento finalizado sin exposición de credenciales.');
  } finally {
    await db.onModuleDestroy();
  }
}

const entryPath = typeof process.argv[1] === 'string' ? path.resolve(process.argv[1]) : '';
const isDirectEntry =
  entryPath.endsWith(path.join('scripts', 'provision-demo.ts')) ||
  entryPath.endsWith(path.join('scripts', 'provision-demo.js'));

if (isDirectEntry) {
  main().catch((err) => {
    console.error('Error en provision:demo:', err.message);
    process.exit(1);
  });
}
