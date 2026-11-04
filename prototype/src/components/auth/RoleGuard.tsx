import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { AccessDeniedView } from '../../features/auth/AccessDeniedView';
import type { CanonicalRoleId } from '../../types';

interface RoleGuardProps {
  allowedRoles: CanonicalRoleId[];
  moduleName?: string;
  children?: React.ReactNode;
}

/**
 * Guarda de Navegación por Rol y Segregación de Funciones (SoD)
 * Verifica que el rol efectivo de la sesión activa pertenezca a la lista de roles autorizados.
 * En caso contrario, bloquea la renderización y muestra la vista AccessDeniedView.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  moduleName,
  children,
}) => {
  const location = useLocation();
  const { activeRoleId } = useAuthStore();

  const isAuthorized = activeRoleId ? allowedRoles.includes(activeRoleId) : false;

  if (!isAuthorized) {
    return (
      <AccessDeniedView
        allowedRoles={allowedRoles}
        moduleName={moduleName}
        attemptedPath={location.pathname}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
