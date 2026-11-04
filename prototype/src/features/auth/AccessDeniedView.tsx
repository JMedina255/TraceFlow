import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { CANONICAL_ROLES, type CanonicalRoleId } from '../../types';

interface AccessDeniedViewProps {
  allowedRoles?: CanonicalRoleId[];
  moduleName?: string;
  attemptedPath?: string;
}

/**
 * Vista de Acceso Denegado (403) Orientada al Usuario Final
 * Proporciona un mensaje claro y empresarial sin sobrecarga técnica,
 * manteniendo un panel desplegable de diagnóstico para soporte técnico.
 */
export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  allowedRoles = [],
  moduleName,
  attemptedPath,
}) => {
  const navigate = useNavigate();
  const { currentUser, activeRoleId, logout } = useAuthStore();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const activeRoleDef = activeRoleId ? CANONICAL_ROLES[activeRoleId] : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 text-upt-text antialiased">
      <div className="w-full max-w-lg bg-upt-surface border border-upt-border rounded-2xl shadow-lg overflow-hidden">
        {/* Cabecera Amigable */}
        <div className="p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-upt-primary tracking-tight">
              {moduleName ? `Acceso no disponible: ${moduleName}` : 'Acceso Restringido'}
            </h1>
            <p className="text-sm text-upt-text-secondary max-w-md mx-auto leading-relaxed">
              No tienes permisos para acceder a esta sección.
            </p>
            <p className="text-xs text-upt-muted max-w-sm mx-auto">
              Tu perfil actual no cuenta con autorización para realizar operaciones en esta vista. Si requieres acceso, solicita la asignación de perfil a tu coordinador.
            </p>
          </div>

          {/* Acciones Principales */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-upt-institutional hover:bg-upt-primary text-white rounded-xl font-medium text-xs transition-colors shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Dashboard</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-upt-border hover:bg-upt-bg text-upt-text-secondary hover:text-upt-text rounded-xl font-medium text-xs transition-colors cursor-pointer"
              title="Cerrar sesión para ingresar con otro perfil"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Sección Plegable de Diagnóstico (Solo si se despliega) */}
        <div className="border-t border-upt-border bg-upt-bg/50 px-6 py-3">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between text-[11px] font-medium text-upt-muted hover:text-upt-text cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Información técnica para soporte</span>
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 pt-3 border-t border-upt-border/60 text-[11px] space-y-1.5 font-mono text-upt-text-secondary">
              <div className="flex justify-between">
                <span className="text-upt-muted font-sans">Usuario:</span>
                <span className="font-semibold">{currentUser?.fullName} ({currentUser?.username})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-upt-muted font-sans">Rol Activo:</span>
                <span className="font-semibold text-amber-800">{activeRoleDef?.role || 'Sin rol'}</span>
              </div>
              {attemptedPath && (
                <div className="flex justify-between">
                  <span className="text-upt-muted font-sans">Ruta Solicitada:</span>
                  <span className="truncate max-w-[240px]">{attemptedPath}</span>
                </div>
              )}
              {allowedRoles.length > 0 && (
                <div className="pt-1 text-[10px] text-upt-muted font-sans">
                  Código de control: {allowedRoles.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
