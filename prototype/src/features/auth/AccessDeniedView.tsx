import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Lock, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { CANONICAL_ROLES, type CanonicalRoleId } from '../../types';

interface AccessDeniedViewProps {
  allowedRoles?: CanonicalRoleId[];
  moduleName?: string;
  attemptedPath?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  allowedRoles = [],
  moduleName,
  attemptedPath,
}) => {
  const navigate = useNavigate();
  const { currentUser, activeRoleId, logout } = useAuthStore();

  const activeRoleDef = activeRoleId ? CANONICAL_ROLES[activeRoleId] : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 text-upt-text antialiased">
      <div className="w-full max-w-xl bg-upt-surface border border-red-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Cabecera de Alerta SoD */}
        <div className="bg-red-50 border-b border-red-200 p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-300 text-upt-error flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-200/60 px-2 py-0.5 rounded border border-red-300">
                Error 403 — Acceso Restringido
              </span>
            </div>
            <h1 className="text-lg font-bold text-red-950 mt-1">
              {moduleName ? `Acceso Denegado a: ${moduleName}` : 'Acceso Denegado (Segregación de Funciones)'}
            </h1>
            <p className="text-xs text-red-800 mt-1 leading-relaxed">
              La política de gobernanza y control de cambios de TraceFlow SCM restringe el acceso a esta función según el principio de Segregación de Funciones (SoD).
            </p>
          </div>
        </div>

        {/* Ficha de Sesión Activa vs Requisitos */}
        <div className="p-6 space-y-5 text-xs">
          {/* Datos de la Sesión Actual */}
          <div className="p-4 bg-upt-bg rounded-xl border border-upt-border space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-upt-border text-[11px] font-semibold text-upt-text-secondary uppercase">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-upt-muted" />
                Sesión Activa
              </span>
              <span className="font-mono text-upt-primary">
                {currentUser?.organization || 'ÉXODO S.A.C.'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-upt-muted block text-[11px]">Usuario:</span>
                <span className="font-bold text-upt-text">{currentUser?.fullName || 'No autenticado'}</span>
              </div>
              <div>
                <span className="text-upt-muted block text-[11px]">Rol Efectivo en Sesión:</span>
                <span className="font-bold text-upt-error">
                  {activeRoleDef ? `${activeRoleDef.id} (${activeRoleDef.role})` : 'Sin rol activo'}
                </span>
              </div>
            </div>
          </div>

          {/* Roles Autorizados para esta Ruta */}
          {allowedRoles.length > 0 && (
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Perfiles Autorizados para esta Operación:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allowedRoles.map((rId) => {
                  const rDef = CANONICAL_ROLES[rId];
                  return (
                    <span
                      key={rId}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-950 font-medium shadow-2xs"
                    >
                      <span className="font-mono font-bold text-amber-800">{rId}</span>
                      <span>{rDef?.role} ({rDef?.label})</span>
                    </span>
                  );
                })}
              </div>
              {currentUser && (
                <div className="pt-2 text-[11px] text-amber-900 leading-normal">
                  {currentUser.allowedRoleIds.some((rId) => allowedRoles.includes(rId)) ? (
                    <p className="font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
                      ✓ Su cuenta tiene asignado uno de los perfiles requeridos. Para acceder, cierre sesión e inicie con el rol correspondiente.
                    </p>
                  ) : (
                    <p className="text-upt-muted">
                      Su cuenta corporativa no tiene asignado ninguno de los roles autorizados para esta vista. Contacte al Coordinador de Proyecto si requiere este acceso.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {attemptedPath && (
            <div className="text-[11px] text-upt-muted font-mono">
              Ruta solicitada: <span className="text-upt-text font-semibold">{attemptedPath}</span>
            </div>
          )}

          {/* Acciones */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-upt-institutional hover:bg-upt-primary text-white rounded-xl font-medium text-xs transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Dashboard</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-upt-border hover:bg-upt-bg text-upt-text-secondary hover:text-upt-text rounded-xl font-medium text-xs transition-colors cursor-pointer"
              title="Cerrar la sesión actual e iniciar con otro rol"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cambiar Perfil (Cerrar Sesión)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
