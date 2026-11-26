import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { traceFlowAdapter } from '../../services/api/apiAdapter';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Guarda de Navegación para Rutas Privadas
 * Requiere una sesión activa verificada contra useAuthStore y revalida en API cuando aplica.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, currentUser, refreshSession } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && traceFlowAdapter.isApiMode()) {
      refreshSession().catch(() => {});
    }
  }, [isAuthenticated, location.pathname, refreshSession]);

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
