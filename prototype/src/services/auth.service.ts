import type { CanonicalRoleId, UserAccount, User, SystemAction } from '../types';
import { ACTION_PERMISSIONS, ROUTE_PERMISSIONS, CANONICAL_ROLES } from '../types';
import { INITIAL_USER_ACCOUNTS, INITIAL_DEMO_USERS, type DemoUserConfig } from '../data/initialUsers';
import { storageService } from './storage.service';

export type { SystemAction };
export { ACTION_PERMISSIONS, ROUTE_PERMISSIONS };

/**
 * Sal y configuración criptográfica para autenticación institucional.
 * Las contraseñas en texto plano NUNCA se almacenan en código ni se exponen en el bundle.
 */
const AUTH_SALT = 'traceflow:exodo:scm:auth:v1';
const STORAGE_KEY_CUSTOM_HASHES = 'traceflow_user_password_hashes';
const STORAGE_KEY_SESSION_TOKEN = 'traceflow_session_token';
const STORAGE_KEY_SESSION_EXPIRES = 'traceflow_session_expires_at';
const STORAGE_KEY_USER_ID = 'active_demo_user_id';
const STORAGE_KEY_ROLE_ID = 'active_demo_role_id';

export interface AuthSessionResult {
  account: UserAccount;
  sessionUser: User;
  effectiveRoleId: CanonicalRoleId;
  sessionToken: string;
  expiresAt: number;
}

/**
 * Genera el hash criptográfico SHA-256 de una contraseña combinada con la sal del sistema.
 */
export async function hashPassword(password: string): Promise<string> {
  const salted = `${AUTH_SALT}:${password}`;
  const encoded = new TextEncoder().encode(salted);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const authService = {
  getAccounts(): UserAccount[] {
    return INITIAL_USER_ACCOUNTS;
  },

  getAccountById(id: string): UserAccount | undefined {
    return INITIAL_USER_ACCOUNTS.find((a) => a.id === id);
  },

  getAccountByEmail(email: string): UserAccount | undefined {
    const normalized = email.trim().toLowerCase();
    return INITIAL_USER_ACCOUNTS.find((a) => a.email.toLowerCase() === normalized);
  },

  getDemoUsers(): DemoUserConfig[] {
    return INITIAL_DEMO_USERS;
  },

  getDemoUserById(id: string): DemoUserConfig | undefined {
    return INITIAL_DEMO_USERS.find((u) => u.id === id);
  },

  /**
   * Obtiene el hash configurado para una cuenta desde el almacenamiento local seguro.
   * No almacena ni expone hashes o verificadores predeterminados en código versionado.
   */
  getPasswordHashForUser(userId: string): string | null {
    const customHashes = storageService.get<Record<string, string>>(STORAGE_KEY_CUSTOM_HASHES, {});
    return customHashes[userId] || null;
  },

  /**
   * Indica si una cuenta ya cuenta con una credencial aprovisionada en el entorno local.
   */
  hasConfiguredPassword(userId: string): boolean {
    return !!this.getPasswordHashForUser(userId);
  },

  /**
   * Permite configurar localmente la contraseña de un usuario de forma segura (sin exponer texto plano).
   */
  async setLocalPassword(userId: string, newPlainTextPassword: string): Promise<void> {
    const customHashes = storageService.get<Record<string, string>>(STORAGE_KEY_CUSTOM_HASHES, {});
    const hashed = await hashPassword(newPlainTextPassword);
    customHashes[userId] = hashed;
    storageService.set(STORAGE_KEY_CUSTOM_HASHES, customHashes);
  },

  /**
   * Valida credenciales institucionales y establece una sesión con un único rol efectivo.
   */
  async authenticate(
    email: string,
    plainPassword: string,
    requestedRoleId?: CanonicalRoleId
  ): Promise<AuthSessionResult> {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !plainPassword) {
      throw new Error('Debe ingresar su correo institucional y su contraseña.');
    }

    const account = this.getAccountByEmail(normalizedEmail);
    if (!account || !account.isActive) {
      throw new Error('Credenciales institucionales incorrectas. Verifique su correo y contraseña.');
    }

    // Validación criptográfica con hash SHA-256
    const expectedHash = this.getPasswordHashForUser(account.id);
    if (!expectedHash) {
      throw new Error(
        'Esta cuenta no tiene credenciales configuradas en el entorno local. Configure una contraseña local antes de acceder.'
      );
    }

    const inputHash = await hashPassword(plainPassword);
    if (inputHash !== expectedHash) {
      throw new Error('Credenciales institucionales incorrectas. Verifique su correo y contraseña.');
    }

    // Determinación del rol efectivo (un solo rol por sesión)
    const effectiveRoleId =
      requestedRoleId && account.assignedRoleIds.includes(requestedRoleId)
        ? requestedRoleId
        : account.primaryRoleId || account.assignedRoleIds[0];

    const roleDef = CANONICAL_ROLES[effectiveRoleId];
    if (!roleDef) {
      throw new Error(`El rol solicitado '${effectiveRoleId}' no es un rol canónico válido.`);
    }

    const sessionToken = crypto.randomUUID ? crypto.randomUUID() : `tok_${Date.now()}_${Math.random()}`;
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 horas de vigencia

    const sessionUser: User = {
      ...account,
      roleId: effectiveRoleId,
      role: roleDef.role,
      roleLabel: roleDef.label,
      allowedRoleIds: account.assignedRoleIds,
    };

    // Persistencia controlada de sesión
    storageService.set(STORAGE_KEY_USER_ID, account.id);
    storageService.set(STORAGE_KEY_ROLE_ID, effectiveRoleId);
    storageService.set(STORAGE_KEY_SESSION_TOKEN, sessionToken);
    storageService.set(STORAGE_KEY_SESSION_EXPIRES, expiresAt);

    return {
      account,
      sessionUser,
      effectiveRoleId,
      sessionToken,
      expiresAt,
    };
  },

  /**
   * Cierra formalmente la sesión activa y elimina tokens de almacenamiento.
   */
  logout(): void {
    storageService.remove(STORAGE_KEY_USER_ID);
    storageService.remove(STORAGE_KEY_ROLE_ID);
    storageService.remove(STORAGE_KEY_SESSION_TOKEN);
    storageService.remove(STORAGE_KEY_SESSION_EXPIRES);
  },

  /**
   * Valida la vigencia y coherencia de la sesión persistida.
   */
  validatePersistedSession(): { user: User; roleId: CanonicalRoleId } | null {
    const savedUserId = storageService.get<string | null>(STORAGE_KEY_USER_ID, null);
    const savedRoleId = storageService.get<CanonicalRoleId | null>(STORAGE_KEY_ROLE_ID, null);
    const savedExpires = storageService.get<number | null>(STORAGE_KEY_SESSION_EXPIRES, null);

    if (!savedUserId || !savedRoleId) return null;

    if (savedExpires && Date.now() > savedExpires) {
      this.logout();
      return null;
    }

    const account = this.getAccountById(savedUserId);
    if (!account || !account.isActive) {
      this.logout();
      return null;
    }

    // Rol efectivo debe pertenecer a los roles asignados a la cuenta
    const effectiveRoleId = account.assignedRoleIds.includes(savedRoleId)
      ? savedRoleId
      : account.primaryRoleId || account.assignedRoleIds[0];

    const roleDef = CANONICAL_ROLES[effectiveRoleId];
    if (!roleDef) return null;

    const sessionUser: User = {
      ...account,
      roleId: effectiveRoleId,
      role: roleDef.role,
      roleLabel: roleDef.label,
      allowedRoleIds: account.assignedRoleIds,
    };

    return {
      user: sessionUser,
      roleId: effectiveRoleId,
    };
  },

  isActionAuthorized(roleId: CanonicalRoleId, action: SystemAction): boolean {
    const allowed = ACTION_PERMISSIONS[action];
    return allowed ? allowed.includes(roleId) : false;
  },

  assertActionAuthorized(roleId: CanonicalRoleId, action: SystemAction): void {
    if (!this.isActionAuthorized(roleId, action)) {
      throw new Error(
        `Operación denegada (SoD): El rol activo '${roleId}' no tiene autorización para ejecutar la acción '${action}'.`
      );
    }
  },

  getAllowedActions(roleId: CanonicalRoleId): SystemAction[] {
    return (Object.keys(ACTION_PERMISSIONS) as SystemAction[]).filter((act) =>
      ACTION_PERMISSIONS[act].includes(roleId)
    );
  },

  /**
   * Resuelve los roles autorizados para una ruta, aplicando coincidencia exacta o parametrizada.
   * Política de Seguridad: DENEGACIÓN POR DEFECTO (Default-Deny).
   * Si la ruta no está registrada en ROUTE_PERMISSIONS, retorna un arreglo vacío [].
   */
  getRouteAllowedRoles(routePath: string): CanonicalRoleId[] {
    // 1. Coincidencia exacta
    if (ROUTE_PERMISSIONS[routePath]) {
      return ROUTE_PERMISSIONS[routePath];
    }

    // 2. Coincidencia con patrones parametrizados (ej. /projects/:projectId -> /projects/PRJ-001)
    for (const [pattern, roles] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pattern.includes(':')) {
        const regexStr = '^' + pattern.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$';
        if (new RegExp(regexStr).test(routePath)) {
          return roles;
        }
      }
    }

    // 3. Política Default-Deny: Las rutas no declaradas NO tienen roles autorizados por defecto
    return [];
  },

  /**
   * Determina si un rol canónico está autorizado a navegar o interactuar con una ruta.
   * Política de Seguridad: DENEGACIÓN POR DEFECTO (Default-Deny).
   */
  isRoleAuthorizedForRoute(roleId: CanonicalRoleId, routePath: string): boolean {
    const allowedRoles = this.getRouteAllowedRoles(routePath);
    if (!allowedRoles || allowedRoles.length === 0) {
      return false; // DENEGADO POR DEFECTO
    }
    return allowedRoles.includes(roleId);
  },

  canUserAccessProject(user: UserAccount | User, projectId: string): boolean {
    if (!user || !user.assignedProjectIds || user.assignedProjectIds.length === 0) {
      return false;
    }
    return user.assignedProjectIds.includes(projectId);
  },
};
