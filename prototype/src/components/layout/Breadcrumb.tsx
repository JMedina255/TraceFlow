import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTES_METADATA } from '../../routes/navigation';

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Si estamos en la raíz o dashboard, breadcrumb simple
  if (pathname === '/' || pathname === '/dashboard') {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-400 py-1">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <Home className="w-3.5 h-3.5 text-indigo-400" />
          <span>Inicio</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-600" />
        <span className="text-slate-100 font-semibold">Dashboard</span>
      </nav>
    );
  }

  // Descomponer ruta en segmentos
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; path: string; isLast: boolean }[] = [];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Buscar coincidencia en metadatos
    const meta =
      ROUTES_METADATA[currentPath] ||
      Object.values(ROUTES_METADATA).find((r) => {
        if (r.path.includes(':')) {
          const regexStr = '^' + r.path.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$';
          return new RegExp(regexStr).test(currentPath);
        }
        return false;
      });

    let label = meta?.breadcrumbLabel || segment;
    // Si el segmento parece un ID (ej. RFC-2026-0042 o PRJ-001 o ECS-001), mostrarlo tal cual
    if (segment.includes('-') || !isNaN(Number(segment))) {
      label = segment;
    }

    breadcrumbs.push({
      label,
      path: currentPath,
      isLast,
    });
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap text-xs text-slate-400 py-1">
      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 hover:text-indigo-300 transition-colors"
      >
        <Home className="w-3.5 h-3.5 text-indigo-400" />
        <span>Inicio</span>
      </Link>

      {breadcrumbs.map((crumb) => (
        <React.Fragment key={crumb.path}>
          <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-600 shrink-0" />
          {crumb.isLast ? (
            <span className="text-slate-100 font-semibold truncate max-w-xs" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.path}
              className="hover:text-indigo-300 transition-colors truncate max-w-xs"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
