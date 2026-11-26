import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GitBranch,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Briefcase,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';
import { traceFlowAdapter } from '../../services/api/apiAdapter';
import { CANONICAL_ROLES, type CanonicalRoleId, type User } from '../../types';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithCredentials } = useAuthStore();
  const isApiMode = traceFlowAdapter.isApiMode();

  const [email, setEmail] = useState<string>(isApiMode ? '' : 'jmedina@exodo.pe');
  const [password, setPassword] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<CanonicalRoleId | ''>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showHelperInfo, setShowHelperInfo] = useState<boolean>(false);
  const [showConfigPassword, setShowConfigPassword] = useState<boolean>(false);
  const [newLocalPassword, setNewLocalPassword] = useState<string>('');
  const [passwordSetSuccess, setPasswordSetSuccess] = useState<string | null>(null);

  // Estado post-autenticación en modo API cuando la cuenta tiene múltiples perfiles asignados
  const [authenticatedPendingRole, setAuthenticatedPendingRole] = useState<User | null>(null);

  // Solo en modo mock se consulta el catálogo local para el selector previo
  const matchedAccount = useMemo(() => {
    if (isApiMode) return undefined;
    return authService.getAccountByEmail(email);
  }, [email, isApiMode]);

  const effectiveRoleId = useMemo<CanonicalRoleId | undefined>(() => {
    if (isApiMode) return undefined;
    if (!matchedAccount) return undefined;
    if (selectedRoleId && matchedAccount.assignedRoleIds.includes(selectedRoleId as CanonicalRoleId)) {
      return selectedRoleId as CanonicalRoleId;
    }
    return matchedAccount.primaryRoleId || matchedAccount.assignedRoleIds[0];
  }, [isApiMode, matchedAccount, selectedRoleId]);

  const redirectAfterLogin = (user?: User) => {
    const defaultTarget = user?.roleId === 'PU-08' ? '/admin/users' : '/dashboard';
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || defaultTarget;
    navigate(from, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPasswordSetSuccess(null);
    setIsLoading(true);

    try {
      const loggedUser = await loginWithCredentials(email, password, effectiveRoleId);
      if (isApiMode && loggedUser.allowedRoleIds && loggedUser.allowedRoleIds.length > 1) {
        setAuthenticatedPendingRole(loggedUser);
        setSelectedRoleId(loggedUser.roleId);
        return;
      }
      redirectAfterLogin(loggedUser);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocurrió un error al validar sus credenciales. Intente nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmApiRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedPendingRole) return;
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const chosen = (selectedRoleId || authenticatedPendingRole.roleId) as CanonicalRoleId;
      const loggedUser =
        chosen !== authenticatedPendingRole.roleId
          ? await loginWithCredentials(email, password, chosen)
          : authenticatedPendingRole;
      redirectAfterLogin(loggedUser);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo activar el perfil seleccionado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLocalPassword = async () => {
    if (isApiMode || !matchedAccount || !newLocalPassword) return;
    try {
      await authService.setLocalPassword(matchedAccount.id, newLocalPassword);
      setPassword(newLocalPassword);
      setPasswordSetSuccess(`Contraseña local configurada exitosamente para ${matchedAccount.fullName}.`);
      setErrorMessage(null);
      setShowConfigPassword(false);
      setNewLocalPassword('');
    } catch {
      setErrorMessage('No se pudo guardar la contraseña en el almacenamiento local.');
    }
  };

  return (
    <div className="min-h-screen bg-upt-bg flex flex-col items-center justify-center p-4 sm:p-6 text-upt-text font-sans antialiased">
      <div className="w-full max-w-md bg-upt-surface border border-upt-border rounded-2xl shadow-xl overflow-hidden">
        {/* Cabecera Corporativa */}
        <div className="bg-upt-institutional p-6 text-white text-center sm:text-left flex items-center justify-between gap-4 border-b border-upt-primary">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-upt-bright text-white shadow-md">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">TraceFlow SCM</h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-upt-primary text-blue-100 border border-white/20">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Gestión de Configuración y Control de Cambios
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-upt-primary/80 border border-white/20 text-blue-100">
              ÉXODO S.A.C.
            </span>
          </div>
        </div>

        {/* Paso 2 Post-Autenticación en Modo API: Selección de Perfil Efectivo */}
        {isApiMode && authenticatedPendingRole ? (
          <form onSubmit={handleConfirmApiRole} className="p-6 sm:p-8 space-y-5">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Credenciales verificadas: {authenticatedPendingRole.fullName}</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Seleccione el perfil único con el cual operará esta sesión.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
            )}

            <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs">
              <label className="font-bold text-upt-primary flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-upt-bright" />
                <span>Perfiles Habilitados en su Cuenta</span>
              </label>
              <select
                value={selectedRoleId || authenticatedPendingRole.roleId}
                onChange={(e) => setSelectedRoleId(e.target.value as CanonicalRoleId)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-blue-200 text-upt-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-upt-bright cursor-pointer"
              >
                {authenticatedPendingRole.allowedRoleIds.map((rId) => {
                  const roleDef = CANONICAL_ROLES[rId];
                  return (
                    <option key={rId} value={rId}>
                      {rId} — {roleDef?.label || rId}
                    </option>
                  );
                })}
              </select>
              <p className="text-[10px] text-upt-muted leading-tight mt-1">
                Regla SoD: La sesión operará bajo un único perfil efectivo hasta el cierre de sesión.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthenticatedPendingRole(null);
                  setPassword('');
                }}
                className="px-4 py-2.5 rounded-xl border border-upt-border text-xs font-semibold text-upt-text-secondary hover:bg-upt-bg cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
              >
                <span>{isLoading ? 'Ingresando...' : 'Confirmar e Ingresar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Formulario de Acceso Institucional */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-base font-bold text-upt-primary tracking-tight">Portal de Acceso Corporativo</h2>
              <p className="text-xs text-upt-muted mt-1">
                Ingrese con sus credenciales institucionales registradas en el sistema.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{errorMessage}</div>
              </div>
            )}

            {passwordSetSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">{passwordSetSuccess}</div>
              </div>
            )}

            {/* Campo: Correo Institucional */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-upt-text flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-upt-bright" />
                <span>Correo Institucional</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedRoleId('');
                }}
                placeholder="usuario@exodo.pe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-upt-bg border border-upt-border text-upt-text text-xs focus:outline-none focus:ring-2 focus:ring-upt-bright focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Campo: Contraseña */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-upt-text flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-upt-bright" />
                <span>Contraseña</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-upt-bg border border-upt-border text-upt-text text-xs focus:outline-none focus:ring-2 focus:ring-upt-bright focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-upt-muted hover:text-upt-text transition-colors p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Selector previo exclusivamente en modo mock local */}
            {!isApiMode && matchedAccount && matchedAccount.assignedRoleIds.length > 1 && (
              <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs animate-in fade-in">
                <label className="font-bold text-upt-primary flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-upt-bright" />
                  <span>Perfil de Operación para esta Sesión</span>
                </label>
                <select
                  value={effectiveRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value as CanonicalRoleId)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-blue-200 text-upt-text text-xs font-medium focus:outline-none focus:ring-2 focus:ring-upt-bright cursor-pointer"
                >
                  {matchedAccount.assignedRoleIds.map((rId) => {
                    const roleDef = CANONICAL_ROLES[rId];
                    const isPrimary = rId === matchedAccount.primaryRoleId;
                    return (
                      <option key={rId} value={rId}>
                        {roleDef?.label || rId} {isPrimary ? '(Rol Principal)' : '(Secundario)'}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-upt-muted leading-tight mt-1">
                  La sesión operará bajo este perfil único en observancia de la política de Segregación de Funciones (SoD).
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Configuración Local Segura de Contraseña: SOLO en modo mock */}
            {!isApiMode && (
              <div className="pt-2 border-t border-upt-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigPassword(!showConfigPassword);
                    setPasswordSetSuccess(null);
                  }}
                  className="w-full text-center text-[11px] text-upt-secondary hover:text-upt-bright font-medium underline underline-offset-2 cursor-pointer transition-colors"
                >
                  {showConfigPassword ? 'Cerrar configuración local' : 'Configurar o actualizar contraseña local en este navegador'}
                </button>

                {showConfigPassword && (
                  <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="text-[11px] font-bold text-upt-primary">
                      Aprovisionar Contraseña Local ({matchedAccount ? matchedAccount.fullName : 'Ingrese correo'})
                    </div>
                    <p className="text-[10px] text-upt-muted leading-tight">
                      Guarda el hash SHA-256 exclusivamente en el almacenamiento de su navegador (localStorage). No se modifican archivos versionados ni se publican secretos.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={newLocalPassword}
                        onChange={(e) => setNewLocalPassword(e.target.value)}
                        placeholder="Nueva contraseña local"
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-upt-border text-xs focus:ring-2 focus:ring-upt-bright focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveLocalPassword}
                        disabled={!newLocalPassword || !matchedAccount}
                        className="px-3.5 py-1.5 rounded-lg bg-upt-bright text-white text-xs font-semibold hover:bg-upt-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        )}

        {/* Guía Institucional Desplegable */}
        <div className="border-t border-upt-border bg-upt-bg/40 p-4 text-xs">
          <button
            type="button"
            onClick={() => setShowHelperInfo(!showHelperInfo)}
            className="w-full flex items-center justify-between text-upt-muted hover:text-upt-text font-medium text-[11px] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-upt-bright" />
              <span>Información de acceso para evaluación institucional</span>
            </span>
            {showHelperInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showHelperInfo && (
            <div className="mt-3 pt-3 border-t border-upt-border/60 space-y-2 text-[11px] text-upt-text-secondary leading-relaxed animate-in fade-in">
              <p className="font-semibold text-upt-primary">
                Cuentas institucionales de referencia (ÉXODO S.A.C.):
              </p>
              <ul className="space-y-1 font-mono text-[10px] bg-white p-2.5 rounded-lg border border-upt-border">
                <li>• <strong>admin@exodo.pe</strong> — Administrador del Sistema (PU-08)</li>
                <li>• <strong>jmedina@exodo.pe</strong> — Director de Calidad (PU-02 / PU-01)</li>
                <li>• <strong>rantayhua@exodo.pe</strong> — Arquitecto Principal (PU-03 / PU-06)</li>
                <li>• <strong>arivera@exodo.pe</strong> — Jefe de SCM (PU-05 / PU-07)</li>
                <li>• <strong>rloyola@exodo.pe</strong> — Coordinador de Proyectos (PU-04)</li>
              </ul>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-upt-primary text-[10px]">
                <span>
                  {isApiMode
                    ? 'Modo API Activo: Las credenciales y perfiles asignados se verifican directamente en PostgreSQL.'
                    : 'Acceso regulado: Las credenciales locales se administran mediante el servicio seguro institucional.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nota de Seguridad y Gobernanza */}
      <div className="mt-6 text-center text-xs text-upt-muted max-w-md space-y-1">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <Briefcase className="w-3.5 h-3.5 text-upt-primary" />
          <span>Seguridad corporativa regida por IEEE 828 e ISO/IEC/IEEE 12207</span>
        </p>
        <p className="text-[10px] text-upt-muted/80">
          {isApiMode
            ? 'Autenticación Argon2id y sesiones opacas HttpOnly verificadas en el Backend API.'
            : 'Autenticación criptográfica con hash SHA-256 (Web Crypto). En producción, las credenciales se validan exclusivamente en el Backend API.'}
        </p>
      </div>
    </div>
  );
};
