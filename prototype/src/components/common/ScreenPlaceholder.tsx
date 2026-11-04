import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  ExternalLink, 
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';
import { ROUTES_METADATA, type RouteMeta } from '../../routes/navigation';

interface ScreenPlaceholderProps {
  meta?: RouteMeta;
  customTitle?: string;
  customDescription?: string;
  relatedRoutes?: { label: string; path: string }[];
}

export const ScreenPlaceholder: React.FC<ScreenPlaceholderProps> = ({
  meta,
  customTitle,
  customDescription,
  relatedRoutes,
}) => {
  const location = useLocation();

  // Buscar metadatos por ruta exacta o coincidencia de patrón
  const routeMeta: RouteMeta | undefined =
    meta ||
    ROUTES_METADATA[location.pathname] ||
    Object.values(ROUTES_METADATA).find((r) => {
      if (r.path.includes(':')) {
        const regexStr = '^' + r.path.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$';
        return new RegExp(regexStr).test(location.pathname);
      }
      return false;
    });

  const title = customTitle || routeMeta?.title || 'Módulo del Sistema';
  const description =
    customDescription ||
    routeMeta?.description ||
    'Módulo en proceso de integración en la plataforma TraceFlow SCM.';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <div className="bg-upt-surface border border-upt-border rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-upt-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-upt-primary border border-blue-200">
              {routeMeta?.packageName || 'TraceFlow SCM'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Módulo en preparación</span>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-upt-primary tracking-tight">{title}</h1>
          <p className="text-sm text-upt-text-secondary mt-2 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Perfiles Autorizados */}
        <div className="bg-upt-surface border border-upt-border rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-upt-secondary font-semibold text-xs tracking-wider uppercase">
            <Users className="w-4 h-4" />
            <span>Perfiles autorizados para este módulo</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {routeMeta?.canonicalActors?.map((actor) => (
              <span
                key={actor}
                className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded font-medium"
              >
                {actor}
              </span>
            )) || <span className="text-xs text-upt-muted">Todos los perfiles</span>}
          </div>
          <p className="text-xs text-upt-muted leading-snug">
            Políticas de acceso y control de segregación de funciones aplicadas a este módulo.
          </p>
        </div>

        {/* Estado de Disponibilidad */}
        <div className="bg-upt-surface border border-upt-border rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-upt-primary font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-upt-secondary" />
            <span>Estado de disponibilidad</span>
          </div>
          <p className="text-xs text-upt-text-secondary leading-relaxed">
            Las operaciones interactivas y formularios de este módulo se encuentran en fase de habilitación. 
            Puedes navegar a los módulos activos del sistema para continuar con las operaciones disponibles.
          </p>
        </div>
      </div>

      {/* Quick Navigation / Related Sub-screens */}
      {relatedRoutes && relatedRoutes.length > 0 && (
        <div className="bg-upt-surface border border-upt-border rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-upt-text-secondary font-semibold text-xs tracking-wider uppercase">
            <ExternalLink className="w-4 h-4 text-upt-secondary" />
            <span>Accesos y vistas relacionadas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedRoutes.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 text-upt-secondary border border-blue-200 hover:bg-blue-100 hover:border-upt-bright transition-colors"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-3 h-3 text-upt-secondary" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Informative Guidance Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-upt-secondary shrink-0 mt-0.5" />
        <div className="text-xs text-upt-text-secondary space-y-1">
          <p className="font-medium text-upt-primary">
            Información del sistema
          </p>
          <p>
            Este módulo cuenta con enrutamiento y estructura de navegación activa dentro de TraceFlow SCM. 
            Su funcionalidad completa se integrará en las siguientes entregas programadas.
          </p>
        </div>
      </div>
    </div>
  );
};
