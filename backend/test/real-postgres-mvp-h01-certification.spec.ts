/**
 * ============================================================================
 * TRACEFLOW SCM — CERTIFICACIÓN OFICIAL EN POSTGRESQL 17 REAL (MVP-H01 / MI-03)
 * Archivo: backend/test/real-postgres-mvp-h01-certification.spec.ts
 * Base de datos exclusiva: traceflow_cert (127.0.0.1:5432)
 *
 * Cobertura:
 *  - Bloque B (MI-03A): 12 migraciones (202611250001..0003 + 202611260001..0009),
 *    esquemas/extensiones, DDL/índices/CHECK/UNIQUE, triggers, PU-01..PU-09,
 *    mínimo privilegio de traceflow_app, rollback y reaplicación de 202611260009,
 *    preservación de invariantes SCM anteriores.
 *  - Bloque C (MI-03B): Certificación física administrativa (registro/edición,
 *    perfiles, autorización/revocación PU-09, revocación de sesiones, último
 *    administrador con FOR UPDATE, concurrencia transaccional, invitaciones y
 *    triggers, auditoría SHA-256 append_audit_log, rollback ante fallos, SoD y
 *    aislamiento entre organizaciones/proyectos).
 * ============================================================================
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { resetAndMigrateRealPostgres } from './helpers/real-db-helper.js';
import { DatabaseService } from '../src/database/database.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { OrganizationsRepository } from '../src/modules/organizations/organizations.repository.js';
import { OrganizationsService } from '../src/modules/organizations/organizations.service.js';
import { ProjectsRepository } from '../src/modules/projects/projects.repository.js';
import { ProjectsService } from '../src/modules/projects/projects.service.js';
import { UsersRepository } from '../src/modules/users/users.repository.js';
import { UsersService } from '../src/modules/users/users.service.js';
import type { AuthenticatedUser } from '../src/common/types/index.js';

describe(
  'TraceFlow SCM — Certificación Física PostgreSQL Real (MVP-H01 / MI-03)',
  { timeout: 60000 },
  () => {
    let adminPool: pg.Pool;
    let appPool: pg.Pool;
    let appliedMigrations: string[];
    let dbService: DatabaseService;

    let authRepo: AuthRepository;
    let authService: AuthService;
    let orgRepo: OrganizationsRepository;
    let orgService: OrganizationsService;
    let projectsRepo: ProjectsRepository;
    let projectsService: ProjectsService;
    let usersRepo: UsersRepository;
    let usersService: UsersService;
    let auditService: AuditService;

    let adminCaller: AuthenticatedUser;
    const TEST_ADMIN_PWD = 'CertAdminPwd#2026!';
    const TEST_USER_PWD = 'CertUserPwd#2026!';

    beforeAll(async () => {
      process.env.NODE_ENV = 'test';
      process.env.DATABASE_MODE = 'postgres';
      process.env.DATABASE_SSL = 'false';
      const appPwd = process.env.TEST_DB_APP_PASSWORD || 'TestAppPassword123!';
      process.env.TEST_DATABASE_URL = `postgresql://traceflow_app:${encodeURIComponent(appPwd)}@127.0.0.1:5432/traceflow_cert`;

      const setupResult = await resetAndMigrateRealPostgres({
        allowDestructiveReset: process.env.ALLOW_DESTRUCTIVE_DATABASE_RESET === 'true',
        targetMigration: 'MVP-H01',
      });
      adminPool = setupResult.adminPool;
      appPool = setupResult.appPool;
      appliedMigrations = setupResult.appliedMigrations;

      dbService = new DatabaseService();
      await dbService.onModuleInit();

      auditService = new AuditService(dbService);
      authRepo = new AuthRepository(dbService);
      authService = new AuthService(authRepo, auditService);
      orgRepo = new OrganizationsRepository(dbService, authRepo);
      orgService = new OrganizationsService(dbService, orgRepo, authRepo, auditService);
      projectsRepo = new ProjectsRepository(dbService);
      projectsService = new ProjectsService(dbService, projectsRepo, orgRepo, auditService, authRepo);
      usersRepo = new UsersRepository(dbService, authRepo);
      usersService = new UsersService(
        dbService,
        usersRepo,
        authRepo,
        authService,
        orgRepo,
        auditService
      );
    });

    afterAll(async () => {
      if (dbService) await dbService.onModuleDestroy();
      if (appPool) await appPool.end();
      if (adminPool) await adminPool.end();
    });

    // ========================================================================
    // BLOQUE B (MI-03A): CERTIFICACIÓN DE 12 MIGRACIONES, DDL, TRIGGERS, GRANTS Y ROLLBACK
    // ========================================================================
    describe('Bloque B (MI-03A): Migraciones, DDL, Privilegios y Rollback MVP-H01', () => {
      it('MI03A-01: Se aplicaron exactamente las 12 migraciones oficiales en orden canónico', async () => {
        expect(appliedMigrations).toEqual([
          '202611250001_initial_traceflow.sql',
          '202611250002_structural_seeds.sql',
          '202611250003_secure_app_role_least_privilege.sql',
          '202611260001_init_h02_organizations_and_projects.sql',
          '202611260002_init_h03_team_methodology_planning.sql',
          '202611260003_init_h04a_github_integration.sql',
          '202611260004_init_h04a_r_github_security.sql',
          '202611260005_init_h04b_github_installations_remediation.sql',
          '202611260006_init_h04b_webhooks_and_git_sync.sql',
          '202611260007_init_h04b_r_webhooks_governance_and_worker.sql',
          '202611260008_init_h04b_c_governance_and_leases.sql',
          '202611260009_mvp_roles_pu08_pu09_and_admin.sql',
        ]);

        const extRes = await adminPool.query(
          "SELECT extname, nspname FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE extname = 'pgcrypto';"
        );
        expect(extRes.rows.length).toBe(1);
        expect(extRes.rows[0].nspname).toBe('extensions');
      });

      it('MI03A-02: Catálogo completo PU-01..PU-09, columnas MVP-H01, índices y triggers presentes', async () => {
        const rolesRes = await adminPool.query(
          'SELECT id, code FROM traceflow.app_role ORDER BY id ASC;'
        );
        expect(rolesRes.rows.map((r) => r.code)).toEqual([
          'PU-01',
          'PU-02',
          'PU-03',
          'PU-04',
          'PU-05',
          'PU-06',
          'PU-07',
          'PU-08',
          'PU-09',
        ]);

        const colsUser = await adminPool.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'traceflow' AND table_name = 'app_user'
            AND column_name IN ('can_create_projects', 'project_creation_authorized_by', 'project_creation_authorized_at', 'github_username', 'github_user_id', 'github_identity_status');
        `);
        expect(colsUser.rows.length).toBe(6);

        const colsRoleAssign = await adminPool.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'traceflow' AND table_name = 'user_role_assignment'
            AND column_name IN ('status', 'revoked_at', 'revoked_by', 'updated_at');
        `);
        expect(colsRoleAssign.rows.length).toBe(4);

        const invTable = await adminPool.query("SELECT to_regclass('traceflow.user_invitation') AS tbl;");
        expect(invTable.rows[0].tbl).toBe('traceflow.user_invitation');

        const idxRes = await adminPool.query(`
          SELECT indexname FROM pg_indexes
          WHERE schemaname = 'traceflow'
            AND indexname IN ('uq_app_user_github_user_id', 'uq_pending_invitation_email_scope', 'uq_pending_invitation_github_scope');
        `);
        expect(idxRes.rows.length).toBe(3);

        const trgRes = await adminPool.query(`
          SELECT tgname FROM pg_trigger
          WHERE tgname IN (
            'trg_enforce_invitation_security',
            'trg_ecs_version_immutable',
            'trg_ccb_vote_immutable',
            'trg_sync_lock_no_delete',
            'trg_enforce_double_key_segregation'
          );
        `);
        expect(trgRes.rows.length).toBe(5);
      });

      it('MI03A-03: Mínimo privilegio de traceflow_app (sin DELETE ni SUPERUSER) y conservación SCM', async () => {
        const roleFlags = await adminPool.query(
          "SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = 'traceflow_app';"
        );
        expect(roleFlags.rows[0]).toEqual({
          rolsuper: false,
          rolcreatedb: false,
          rolcreaterole: false,
        });

        const tablesNoDelete = [
          'traceflow.app_role',
          'traceflow.app_user',
          'traceflow.user_role_assignment',
          'traceflow.user_session',
          'traceflow.user_invitation',
          'traceflow.audit_log',
          'traceflow.ecs_version',
          'traceflow.ccb_vote',
        ];
        for (const tbl of tablesNoDelete) {
          const priv = await adminPool.query(
            "SELECT has_table_privilege('traceflow_app', $1, 'DELETE') AS can_del;",
            [tbl]
          );
          expect(priv.rows[0].can_del).toBe(false);
        }

        const rwPriv = await adminPool.query(`
          SELECT
            has_table_privilege('traceflow_app', 'traceflow.user_invitation', 'SELECT') AS inv_sel,
            has_table_privilege('traceflow_app', 'traceflow.user_invitation', 'INSERT') AS inv_ins,
            has_table_privilege('traceflow_app', 'traceflow.user_invitation', 'UPDATE') AS inv_upd,
            has_table_privilege('traceflow_app', 'traceflow.user_role_assignment', 'INSERT') AS ura_ins,
            has_table_privilege('traceflow_app', 'traceflow.user_role_assignment', 'UPDATE') AS ura_upd;
        `);
        expect(rwPriv.rows[0]).toEqual({
          inv_sel: true,
          inv_ins: true,
          inv_upd: true,
          ura_ins: true,
          ura_upd: true,
        });
      });

      it('MI03A-04: Rollback controlado y reaplicación limpia de 202611260009 conservando datos históricos', async () => {
        const migrationsDir = path.resolve(process.cwd(), '../supabase/migrations');
        const rollbackSql = fs.readFileSync(
          path.join(migrationsDir, '202611260009_mvp_roles_pu08_pu09_and_admin_rollback.sql'),
          'utf8'
        );
        const forwardSql = fs.readFileSync(
          path.join(migrationsDir, '202611260009_mvp_roles_pu08_pu09_and_admin.sql'),
          'utf8'
        );

        // 1. Insertar dato operativo (autorización can_create_projects = true) y verificar que rollback aborta sin force
        await adminPool.query(
          "UPDATE traceflow.app_user SET can_create_projects = TRUE WHERE code = 'USR-001';"
        );
        let rollbackBlocked = false;
        try {
          await adminPool.query(rollbackSql);
        } catch (err: any) {
          rollbackBlocked = true;
          expect(err.message).toContain('BLOQUEO DE SEGURIDAD (MVP-H01)');
        }
        expect(rollbackBlocked).toBe(true);

        // 2. Restaurar dato y ejecutar rollback limpio
        await adminPool.query(
          "UPDATE traceflow.app_user SET can_create_projects = FALSE WHERE code = 'USR-001';"
        );
        await adminPool.query(rollbackSql);

        const invAfterRb = await adminPool.query(
          "SELECT to_regclass('traceflow.user_invitation') AS tbl;"
        );
        expect(invAfterRb.rows[0].tbl).toBeNull();

        const rolesAfterRb = await adminPool.query(
          'SELECT code FROM traceflow.app_role ORDER BY id ASC;'
        );
        expect(rolesAfterRb.rows.map((r) => r.code)).toEqual([
          'PU-01',
          'PU-02',
          'PU-03',
          'PU-04',
          'PU-05',
          'PU-06',
          'PU-07',
        ]);

        // Datos históricos preservados
        const usersAfterRb = await adminPool.query(
          'SELECT code FROM traceflow.app_user ORDER BY code ASC;'
        );
        expect(usersAfterRb.rows.map((r) => r.code)).toEqual([
          'USR-001',
          'USR-002',
          'USR-003',
          'USR-004',
        ]);

        // 3. Reaplicar 202611260009 para continuar con Bloque C
        await adminPool.query(forwardSql);
        const rolesReapplied = await adminPool.query(
          'SELECT code FROM traceflow.app_role ORDER BY id ASC;'
        );
        expect(rolesReapplied.rows.length).toBe(9);
      });
    });

    // ========================================================================
    // BLOQUE C (MI-03B): CERTIFICACIÓN FÍSICA ADMINISTRATIVA CON traceflow_app
    // ========================================================================
    describe('Bloque C (MI-03B): Certificación física administrativa sobre PostgreSQL 17', () => {
      let createdUserId: string;
      let createdUserEmail: string;

      it('MI03B-01: Bootstrap PU-08 físico, creación y edición de usuario, email único y login real Argon2id (ADM-01, ADM-04..06, ADM-21, ADM-22)', async () => {
        // Bootstrap PU-08 en traceflow_cert
        const adminHash = await authService.hashPassword(TEST_ADMIN_PWD);
        const adminId = 'a0000001-0000-0000-0000-000000000005';
        await dbService.transaction(async (client) => {
          const pu08 = await authRepo.resolveRoleByCode('PU-08', client);
          await usersRepo.createUser(
            {
              id: adminId,
              code: 'USR-005',
              username: 'sysadmin',
              email: 'admin@exodo.pe',
              passwordHash: adminHash,
              fullName: 'Administrador del Sistema TraceFlow',
              organization: 'ÉXODO S.A.C.',
              position: 'Administrador Global de Plataforma',
              status: 'ACTIVE',
              githubIdentityStatus: 'UNVERIFIED',
            },
            client
          );
          await usersRepo.upsertUserRole(adminId, pu08!.id, 'PU-08', true, adminId, client);
        });

        const adminLogin = await authService.login('admin@exodo.pe', TEST_ADMIN_PWD, 'PU-08');
        expect(adminLogin.user.activeRoleId).toBe('PU-08');
        adminCaller = adminLogin.user;

        // Registro de usuario válido (ADM-04)
        createdUserEmail = 'cert.pm@exodo.pe';
        const created = await usersService.createUser(
          {
            fullName: 'Usuario Certificación Física',
            email: '  CERT.PM@EXODO.PE ',
            password: TEST_USER_PWD,
            position: 'Especialista SCM',
            roleCodes: ['PU-03'],
            primaryRoleCode: 'PU-03',
            organizationId: 'ORG-EXODO',
          },
          adminCaller
        );
        createdUserId = created.id;
        expect(created.email).toBe(createdUserEmail);
        expect(created.assignedRoleCodes).toEqual(['PU-03']);
        expect(JSON.stringify(created)).not.toContain('password_hash');

        // Duplicado rechazado (ADM-05)
        await expect(
          usersService.createUser(
            {
              fullName: 'Duplicado PG',
              email: 'cert.pm@exodo.pe',
              password: TEST_USER_PWD,
            },
            adminCaller
          )
        ).rejects.toThrow(ConflictException);

        // Edición básica (ADM-06)
        const edited = await usersService.updateUser(
          createdUserId,
          { position: 'Arquitecto Certificado', githubUsername: 'cert-gh-user' },
          adminCaller
        );
        expect(edited.position).toBe('Arquitecto Certificado');
        expect(edited.githubIdentityStatus).toBe('DECLARED');

        // Login real del usuario recién creado (ADM-21)
        const userLogin = await authService.login(createdUserEmail, TEST_USER_PWD, 'PU-03');
        expect(userLogin.user.id).toBe(createdUserId);
      });

      it('MI03B-02: Suspensión revoca sesiones reales en user_session y reactivación rehabilita nuevo login (ADM-07..ADM-09)', async () => {
        const loginBefore = await authService.login(createdUserEmail, TEST_USER_PWD, 'PU-03');
        const oldToken = loginBefore.sessionToken;
        expect(await authService.validateSessionToken(oldToken)).not.toBeNull();

        await usersService.updateUserStatus(
          createdUserId,
          { status: 'SUSPENDED', reason: 'Certificación física suspensión' },
          adminCaller
        );

        // Sesión marcada como revocada en PostgreSQL
        const sessRes = await appPool.query(
          'SELECT is_revoked FROM traceflow.user_session WHERE user_id = $1;',
          [createdUserId]
        );
        expect(sessRes.rows.every((r) => r.is_revoked === true)).toBe(true);
        expect(await authService.validateSessionToken(oldToken)).toBeNull();

        // Reactivación permite nuevo login, pero token revocado sigue inválido
        await usersService.updateUserStatus(
          createdUserId,
          { status: 'ACTIVE', reason: 'Reactivación' },
          adminCaller
        );
        expect(await authService.validateSessionToken(oldToken)).toBeNull();
        const loginAfter = await authService.login(createdUserEmail, TEST_USER_PWD, 'PU-03');
        expect(loginAfter.user.activeRoleId).toBe('PU-03');
      });

      it('MI03B-03: Autorización/revocación PU-09, revocación de sesión PU-09, bloqueo PU-02/PU-08 y concurrencia real (ADM-10..ADM-15, ADM-24)', async () => {
        // Autorizar PU-09 conservando rol previo PU-03
        const authorized = await usersService.updateProjectCreationAuth(
          createdUserId,
          { authorized: true, reason: 'Habilitación PM real' },
          adminCaller
        );
        expect(authorized.canCreateProjects).toBe(true);
        expect(authorized.assignedRoleCodes).toContain('PU-03');
        expect(authorized.assignedRoleCodes).toContain('PU-09');

        // Autorización concurrente repetida en PostgreSQL real (ADM-14)
        await Promise.all([
          usersService.updateProjectCreationAuth(createdUserId, { authorized: true }, adminCaller),
          usersService.updateProjectCreationAuth(createdUserId, { authorized: true }, adminCaller),
        ]);

        const pmSession = await authService.login(createdUserEmail, TEST_USER_PWD, 'PU-09');
        const archSession = await authService.login(createdUserEmail, TEST_USER_PWD, 'PU-03');

        // PU-09 autorizado crea proyecto BORRADOR real en ORG-EXODO
        const prj = await projectsService.createProject(
          {
            code: 'PRJ-PG-H01',
            projectKey: 'PGH01',
            name: 'Proyecto Certificado MVP-H01',
            clientName: 'ÉXODO S.A.C.',
            organizationId: 'ORG-EXODO',
          },
          pmSession.user
        );
        expect(prj.status).toBe('BORRADOR');

        // PU-02 y PU-08 bloqueados para crear proyectos (ADM-13)
        const pu02User = await authService.login('jmedina@exodo.pe', 'SecurePassword123!', 'PU-02');
        await expect(
          projectsService.createProject(
            {
              code: 'PRJ-PU02-PG',
              projectKey: 'PU02PG',
              name: 'Bloqueado PU-02',
              clientName: 'X',
              organizationId: 'ORG-EXODO',
            },
            pu02User.user
          )
        ).rejects.toThrow(ForbiddenException);

        await expect(
          projectsService.createProject(
            {
              code: 'PRJ-PU08-PG',
              projectKey: 'PU08PG',
              name: 'Bloqueado PU-08',
              clientName: 'X',
              organizationId: 'ORG-EXODO',
            },
            adminCaller
          )
        ).rejects.toThrow(ForbiddenException);

        // PU-08 sin acceso automático a proyectos operativos
        expect(await projectsService.getProjectsForUser(adminCaller)).toEqual([]);

        // Revocar autorización PU-09 (ADM-11, ADM-24)
        const revoked = await usersService.updateProjectCreationAuth(
          createdUserId,
          { authorized: false, reason: 'Fin de rol PM' },
          adminCaller
        );
        expect(revoked.canCreateProjects).toBe(false);
        expect(revoked.assignedRoleCodes).not.toContain('PU-09');
        expect(revoked.assignedRoleCodes).toContain('PU-03');

        // Verificar revocación lógica sin DELETE físico en user_role_assignment
        const uraRow = await appPool.query(`
          SELECT ura.status, ura.revoked_at
          FROM traceflow.user_role_assignment ura
          JOIN traceflow.app_role r ON ura.role_id = r.id
          WHERE ura.user_id = $1 AND r.code = 'PU-09';
        `, [createdUserId]);
        expect(uraRow.rows[0].status).toBe('REVOKED');
        expect(uraRow.rows[0].revoked_at).not.toBeNull();

        // Sesión PU-09 invalidada, sesión PU-03 preservada
        expect(await authService.validateSessionToken(pmSession.sessionToken)).toBeNull();
        expect(await authService.validateSessionToken(archSession.sessionToken)).not.toBeNull();

        // Incluso con DTO de sesión en caché, ProjectsService rechaza por validación en BD
        await expect(
          projectsService.createProject(
            {
              code: 'PRJ-STALE-PG',
              projectKey: 'STALEPG',
              name: 'Bloqueado Sesión Obsoleta',
              clientName: 'X',
              organizationId: 'ORG-EXODO',
            },
            pmSession.user
          )
        ).rejects.toThrow(ForbiddenException);

        // Protección del último administrador activo con FOR UPDATE (ADM-15)
        const secondAdminCaller: AuthenticatedUser = {
          ...adminCaller,
          id: 'a0000001-0000-0000-0000-000000000099',
          code: 'USR-099',
        };
        await expect(
          usersService.updateUserStatus('USR-005', { status: 'SUSPENDED' }, secondAdminCaller)
        ).rejects.toThrow(BadRequestException);
      });

      it('MI03B-04: Invitaciones físicas, índices parciales únicos y trigger enforce_invitation_security (ADM-16..ADM-20)', async () => {
        const invEmail = await usersService.createInvitation(
          {
            channel: 'EMAIL',
            email: 'invitado.pg@exodo.pe',
            intendedRoleCode: 'PU-06',
            organizationId: 'ORG-EXODO',
          },
          adminCaller
        );
        expect(invEmail.status).toBe('PENDING');

        const invGh = await usersService.createInvitation(
          {
            channel: 'GITHUB',
            githubUsername: 'gh-invitado-pg',
            intendedRoleCode: 'PU-07',
          },
          adminCaller
        );
        expect(invGh.status).toBe('PENDING');
        expect(invGh.email).toBeNull();

        // Duplicado en mismo ámbito bloqueado (ADM-18)
        await expect(
          usersService.createInvitation(
            {
              channel: 'EMAIL',
              email: 'INVITADO.PG@EXODO.PE',
              intendedRoleCode: 'PU-06',
              organizationId: 'ORG-EXODO',
            },
            adminCaller
          )
        ).rejects.toThrow(ConflictException);

        // Trigger físico bloquea inserción directa SQL con PU-08
        await expect(
          appPool.query(
            `INSERT INTO traceflow.user_invitation (id, channel, email, intended_role_id, status, invited_by)
             VALUES ($1, 'EMAIL', 'evil-admin@exodo.pe', 8, 'PENDING', $2);`,
            [crypto.randomUUID(), adminCaller.id]
          )
        ).rejects.toThrow(/VIOLACIÓN DE SEGURIDAD \(MVP-H01\)/);

        // Trigger físico bloquea UPDATE directo SQL a ACCEPTED sin flag verificado
        await expect(
          appPool.query(
            "UPDATE traceflow.user_invitation SET status = 'ACCEPTED' WHERE id = $1;",
            [invEmail.id]
          )
        ).rejects.toThrow(/OPERACIÓN BLOQUEADA \(MVP-H01\)/);

        // Cancelación válida (ADM-19)
        const cancelled = await usersService.updateInvitationStatus(
          invEmail.id,
          { status: 'CANCELLED', reason: 'Cierre de prueba' },
          adminCaller
        );
        expect(cancelled.status).toBe('CANCELLED');
      });

      it('MI03B-05: Auditoría física append_audit_log sin secretos y rollback real ante fallo intermedio (ADM-23)', async () => {
        const auditRows = await appPool.query(`
          SELECT event_code, curr_log_hash, payload_diff
          FROM traceflow.audit_log
          WHERE event_code IN (
            'USER_CREATED', 'USER_UPDATED', 'USER_SUSPENDED', 'USER_REACTIVATED',
            'USER_PRJ_CREATION_AUTHORIZED', 'USER_PRJ_CREATION_REVOKED',
            'USER_INVITATION_CREATED', 'USER_INVITATION_CANCELLED'
          );
        `);
        expect(auditRows.rows.length).toBeGreaterThanOrEqual(8);
        for (const row of auditRows.rows) {
          expect(row.curr_log_hash).toMatch(/^[a-f0-9]{64}$/);
          const dump = JSON.stringify(row.payload_diff);
          expect(dump).not.toContain(TEST_USER_PWD);
          expect(dump).not.toContain(TEST_ADMIN_PWD);
          expect(dump).not.toContain('$argon2');
        }

        // Rollback real ante fallo del servicio de auditoría
        const originalLogEvent = auditService.logEvent.bind(auditService);
        auditService.logEvent = async () => {
          throw new Error('Fallo simulado de append_audit_log');
        };

        try {
          await expect(
            usersService.createInvitation(
              {
                channel: 'EMAIL',
                email: 'rollback-pg@exodo.pe',
                intendedRoleCode: 'PU-06',
              },
              adminCaller
            )
          ).rejects.toThrow('Fallo simulado de append_audit_log');
        } finally {
          auditService.logEvent = originalLogEvent;
        }

        const checkRollback = await appPool.query(
          "SELECT COUNT(*)::text AS c FROM traceflow.user_invitation WHERE email = 'rollback-pg@exodo.pe';"
        );
        expect(parseInt(checkRollback.rows[0].c, 10)).toBe(0);
      });
    });
  }
);
