import { Injectable, UnauthorizedException, BadRequestException, Logger, Inject } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { hashPasswordArgon2id, verifyPasswordArgon2id } from '../../common/utils/password.util.js';
import { AuthRepository, UserAccountEntity } from './auth.repository.js';
import { AuditService } from '../audit/audit.service.js';
import { loadConfig } from '../../config/configuration.js';
import type { AuthenticatedUser, CanonicalRoleId } from '../../common/types/index.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AuthRepository) private readonly authRepo: AuthRepository,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async hashPassword(plainPassword: string): Promise<string> {
    return hashPasswordArgon2id(plainPassword);
  }

  async verifyPassword(plain: string, storedHash: string): Promise<boolean> {
    try {
      return await verifyPasswordArgon2id(plain, storedHash);
    } catch (err: any) {
      this.logger.error(`Error verificando hash de contraseña Argon2id: ${err.message}`);
    }
    return false;
  }

  async login(
    email: string,
    plainPassword: string,
    requestedRoleId?: CanonicalRoleId,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales institucionales incorrectas. Verifique correo y contraseña.');
    }

    if (user.status !== 'ACTIVE') {
      await this.auditService.logEvent({
        eventCode: 'EVT-AUTH-BLOCKED',
        actorUserId: user.id,
        actorRole: requestedRoleId || user.primary_role_code || 'PU-01',
        operation: 'AUTH_LOGIN_BLOCKED_INACTIVE',
        entityName: 'app_user',
        entityId: user.id,
        resultStatus: 'REJECTED',
        payloadDiff: { email, status: user.status },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException(
        'La cuenta de usuario se encuentra suspendida o inactiva. Contacte al Administrador del Sistema.'
      );
    }

    // Validación de contraseña segura mediante Argon2id estricto (H-02: Sin bypasses ni backdoors)
    const isValidPassword = await this.verifyPassword(plainPassword, user.password_hash);
    if (!isValidPassword) {
      await this.auditService.logEvent({
        eventCode: 'EVT-AUTH-FAIL',
        actorUserId: user.id,
        actorRole: requestedRoleId || user.primary_role_code,
        operation: 'AUTH_LOGIN_FAILED',
        entityName: 'app_user',
        entityId: user.id,
        resultStatus: 'FAILURE',
        payloadDiff: { email, reason: 'INVALID_CREDENTIALS' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Credenciales institucionales incorrectas. Verifique correo y contraseña.');
    }

    if (!user.assigned_role_codes || user.assigned_role_codes.length === 0) {
      throw new UnauthorizedException(
        `La cuenta '${user.code}' no posee perfiles activos asignados.`
      );
    }

    // Regla SoD-RN-01: Verificación de que el rol solicitado pertenezca a los roles activos autorizados
    const effectiveRole: CanonicalRoleId = requestedRoleId || user.primary_role_code;
    if (!user.assigned_role_codes.includes(effectiveRole)) {
      throw new BadRequestException(
        `Violación de SoD (RN-01 / RN-04): El rol '${effectiveRole}' no está asignado a la cuenta '${user.code}'.`
      );
    }

    const resolvedRole = await this.authRepo.resolveRoleByCode(effectiveRole);
    if (!resolvedRole) {
      throw new BadRequestException(`El perfil '${effectiveRole}' no existe en el catálogo canónico.`);
    }

    // Generar token de sesión opaco aleatorio de 256 bits (ADR-006)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 horas máximo

    await this.authRepo.createSession({
      id: crypto.randomUUID(),
      user_id: user.id,
      active_role_id: resolvedRole.id,
      active_role_code: resolvedRole.code,
      session_token_hash: tokenHash,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_revoked: false,
      active_project_id: null,
      created_at: now,
      last_activity_at: now,
      expires_at: expiresAt,
    });

    await this.auditService.logEvent({
      eventCode: 'EVT-AUTH-SUCCESS',
      actorUserId: user.id,
      actorRole: effectiveRole,
      operation: 'AUTH_LOGIN_SUCCESS',
      entityName: 'app_user',
      entityId: user.id,
      resultStatus: 'SUCCESS',
      payloadDiff: { effectiveRole, sessionTokenHashPrefix: tokenHash.substring(0, 16) },
      ipAddress,
      userAgent,
    });

    return {
      sessionToken: rawToken,
      user: this.mapToAuthenticatedUser(user, effectiveRole),
    };
  }

  async validateSessionToken(rawToken: string): Promise<AuthenticatedUser | null> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await this.authRepo.findSessionByTokenHash(tokenHash);

    if (!session || session.is_revoked) {
      return null;
    }

    const now = new Date();
    if (now > new Date(session.expires_at)) {
      return null;
    }

    // Control estricto de inactividad de 15 minutos (ADR-006 Decisión de Seguridad)
    const config = loadConfig();
    const maxInactivityMs = config.sessionTtlMinutes * 60 * 1000;
    const lastActivity = new Date(session.last_activity_at).getTime();

    if (now.getTime() - lastActivity > maxInactivityMs) {
      await this.authRepo.revokeSession(tokenHash);
      return null;
    }

    const user = await this.authRepo.findById(session.user_id);
    if (!user || user.status !== 'ACTIVE') {
      await this.authRepo.revokeSession(tokenHash);
      return null;
    }

    const resolvedRole = session.active_role_code
      ? { code: session.active_role_code }
      : await this.authRepo.resolveRoleById(session.active_role_id);

    const roleCode = resolvedRole?.code;
    if (!roleCode || !user.assigned_role_codes.includes(roleCode)) {
      // El perfil activo de la sesión fue revocado -> invalidar sesión inmediatamente
      await this.authRepo.revokeSession(tokenHash);
      return null;
    }

    // Actualizar actividad
    await this.authRepo.updateSessionActivity(tokenHash, now);

    return this.mapToAuthenticatedUser(user, roleCode, session.active_project_id || null);
  }

  async logout(rawToken: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await this.authRepo.findSessionByTokenHash(tokenHash);

    if (session) {
      await this.authRepo.revokeSession(tokenHash);
      await this.auditService.logEvent({
        eventCode: 'EVT-AUTH-LOGOUT',
        actorUserId: session.user_id,
        actorRole: session.active_role_code || 'PU-01',
        operation: 'AUTH_LOGOUT',
        entityName: 'user_session',
        entityId: session.id,
        resultStatus: 'SUCCESS',
        payloadDiff: { sessionTokenHashPrefix: tokenHash.substring(0, 16) },
        ipAddress,
        userAgent,
      });
    }
  }

  private mapToAuthenticatedUser(
    entity: UserAccountEntity,
    activeRole: CanonicalRoleId,
    activeProjectId: string | null = null,
  ): AuthenticatedUser {
    return {
      id: entity.id,
      code: entity.code,
      username: entity.username,
      email: entity.email,
      fullName: entity.full_name,
      organization: entity.organization,
      position: entity.position,
      activeRoleId: activeRole,
      allowedRoleIds: entity.assigned_role_codes,
      assignedProjectIds: entity.assigned_project_codes,
      canCreateProjects: Boolean(entity.can_create_projects),
      githubUsername: entity.github_username ?? null,
      githubIdentityStatus: entity.github_identity_status ?? 'UNVERIFIED',
      activeProjectId,
    };
  }
}
