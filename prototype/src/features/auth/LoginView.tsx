import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  GitBranch, 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  FolderGit2, 
  ArrowRight, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { INITIAL_USER_ACCOUNTS } from '../../data/initialUsers';
import { CANONICAL_ROLES, type CanonicalRoleId, type UserAccount } from '../../types';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithAccount } = useAuthStore();

  // Cuenta seleccionada por defecto: USR-001 (Joan Cristian Medina Quispe)
  const [selectedAccountId, setSelectedAccountId] = useState<string>(INITIAL_USER_ACCOUNTS[0].id);
  
  const selectedAccount: UserAccount = 
    INITIAL_USER_ACCOUNTS.find((u) => u.id === selectedAccountId) || INITIAL_USER_ACCOUNTS[0];

  // Rol efectivo seleccionado (por defecto el rol primario de la cuenta)
  const [selectedRoleId, setSelectedRoleId] = useState<CanonicalRoleId>(
    selectedAccount.primaryRoleId || selectedAccount.assignedRoleIds[0]
  );

  // Manejar cambio de cuenta
  const handleSelectAccount = (acc: UserAccount) => {
    setSelectedAccountId(acc.id);
    setSelectedRoleId(acc.primaryRoleId || acc.assignedRoleIds[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithAccount(selectedAccount, selectedRoleId);

    // Redirigir a la ruta de origen si venía de un guard o al dashboard
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-upt-bg flex flex-col items-center justify-center p-4 sm:p-6 text-upt-text font-sans antialiased">
      <div className="w-full max-w-2xl bg-upt-surface border border-upt-border rounded-2xl shadow-xl overflow-hidden">
        {/* Cabecera Corporativa */}
        <div className="bg-upt-institutional p-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-upt-primary">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-upt-bright text-white shadow-md">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">TraceFlow SCM</h1>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-upt-primary text-blue-100 border border-white/20">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Plataforma de Gestión de Configuración y Control de Cambios
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-upt-primary/80 border border-white/20 text-blue-100">
              ÉXODO S.A.C.
            </span>
          </div>
        </div>

        {/* Formulario de Acceso por Identidad y Rol Efectivo */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Paso 1: Seleccionar Identidad */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-upt-text flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-upt-bright" />
                1. Seleccionar Identidad de Usuario
              </label>
              <span className="text-[11px] text-upt-muted">
                {INITIAL_USER_ACCOUNTS.length} identidades corporativas registradas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INITIAL_USER_ACCOUNTS.map((acc) => {
                const isSelected = acc.id === selectedAccountId;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-50/70 border-upt-bright ring-1 ring-upt-bright text-upt-text shadow-xs'
                        : 'bg-white border-upt-border hover:border-upt-secondary/50 hover:bg-upt-bg/40 text-upt-text'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-upt-institutional text-white'
                              : 'bg-upt-bg text-upt-text-secondary border border-upt-border'
                          }`}
                        >
                          {acc.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-upt-text leading-tight">{acc.fullName}</p>
                          <p className="text-[11px] text-upt-muted font-mono">{acc.email}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-upt-bright shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-upt-border/60 flex items-center justify-between text-[11px]">
                      <span className="text-upt-text-secondary flex items-center gap-1 truncate max-w-[170px]">
                        <Briefcase className="w-3 h-3 text-upt-muted shrink-0" />
                        <span className="truncate">{acc.cargo}</span>
                      </span>
                      <span className="font-mono text-[10px] bg-upt-bg px-1.5 py-0.5 rounded text-upt-muted border border-upt-border shrink-0">
                        {acc.assignedRoleIds.length} roles
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ficha Resumen de la Identidad y Aislamiento de Proyectos */}
          <div className="p-3.5 bg-upt-bg rounded-xl border border-upt-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-upt-text">Proyectos autorizados para {selectedAccount.fullName}:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedAccount.assignedProjectIds.map((pId) => (
                  <span
                    key={pId}
                    className="inline-flex items-center gap-1 font-mono text-[11px] bg-white border border-upt-border px-2 py-0.5 rounded text-upt-primary font-medium"
                  >
                    <FolderGit2 className="w-3 h-3 text-upt-yellow" />
                    {pId}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-upt-muted sm:text-right">
              Aislamiento de acceso aplicado
            </div>
          </div>

          {/* Paso 2: Seleccionar Rol Efectivo para la Sesión */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-upt-text flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-upt-bright" />
                2. Seleccionar Rol Efectivo de Sesión (Segregación SoD)
              </label>
            </div>
            <p className="text-xs text-upt-muted mb-3">
              Cada sesión opera bajo un único rol activo para garantizar la trazabilidad de operaciones según la norma SCM.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedAccount.assignedRoleIds.map((roleId) => {
                const roleDef = CANONICAL_ROLES[roleId];
                const isSelected = selectedRoleId === roleId;
                const isPrimary = roleId === selectedAccount.primaryRoleId;

                return (
                  <button
                    key={roleId}
                    type="button"
                    onClick={() => setSelectedRoleId(roleId)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-upt-institutional text-white border-upt-institutional shadow-sm ring-1 ring-upt-bright'
                        : 'bg-white border-upt-border hover:border-upt-bright/50 hover:bg-upt-bg/50 text-upt-text'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-white/20 text-white border border-white/30'
                              : 'bg-blue-50 text-upt-primary border border-blue-200'
                          }`}
                        >
                          {roleId}
                        </span>
                        <span className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-upt-text'}`}>
                          {roleDef?.role}
                        </span>
                      </div>
                      {isPrimary && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            isSelected ? 'bg-upt-bright text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          Principal
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] mt-1.5 ${isSelected ? 'text-blue-100' : 'text-upt-muted'}`}>
                      {roleDef?.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón de Entrada */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-upt-institutional hover:bg-upt-primary text-white rounded-xl font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-upt-bright focus:ring-offset-2 cursor-pointer"
            >
              <span>Iniciar Sesión como {selectedAccount.fullName.split(' ')[0]} ({CANONICAL_ROLES[selectedRoleId]?.role})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Metadatos y Nota de Arquitectura */}
        <div className="p-4 bg-upt-bg border-t border-upt-border text-center text-xs text-upt-muted">
          <div className="flex items-center justify-center gap-1.5 font-medium text-upt-text-secondary mb-1">
            <Info className="w-3.5 h-3.5 text-upt-bright" />
            <span>Portal de Acceso Corporativo — Modo Demostración</span>
          </div>
          <p className="text-[11px] max-w-lg mx-auto">
            Las identidades y perfiles corresponden al equipo de consultoría de ÉXODO S.A.C. En producción, la autenticación se delega al proveedor de identidad corporativo (IdP / OpenID Connect) con credenciales seguras.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-center text-xs text-upt-muted">
        TraceFlow SCM &copy; 2026 — Plataforma de Gestión de Configuración (ÉXODO S.A.C.)
      </footer>
    </div>
  );
};