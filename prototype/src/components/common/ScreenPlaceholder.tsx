import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileCheck2, 
  Clock, 
  ExternalLink, 
  ArrowRight,
  Info
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
    'Pantalla física formalizada dentro de la arquitectura de TraceFlow SCM.';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <div className="bg-upt-surface border border-upt-border rounded-xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-upt-border pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-upt-primary border border-blue-200">
              {routeMeta?.screenId || 'SCREEN'}
            </span>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-upt-bg text-upt-text-secondary border border-upt-border">
              Wireframe: {routeMeta?.wireframeId || 'WF'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded bg-upt-bg text-upt-muted">
              {routeMeta?.packageName || 'TraceFlow SCM Core'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>{routeMeta?.plannedPhase || 'Previsto para próximas fases'}</span>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-upt-primary tracking-tight">{title}</h1>
          <p className="text-sm text-upt-text-secondary mt-2 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Casos de Uso Gobernados */}
        <div className="bg-upt-surface border border-upt-border rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-upt-secondary font-semibold text-xs tracking-wider uppercase">
            <FileCheck2 className="w-4 h-4" />
            <span>Casos de Uso Gobernados</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {routeMeta?.governedUseCases?.map((cu) => (
              <span
                key={cu}
                className="font-mono text-xs bg-upt-bg/60 text-upt-text border border-upt-border px-2.5 py-1 rounded"
              >
                {cu}
              </span>
            )) || <span className="text-xs text-upt-muted">No especificado</span>}
          </div>
          <p className="text-xs text-upt-muted leading-snug">
            Interacciones formales vinculadas a este nodo según la matriz de trazabilidad UWE del SAD de Diseño (FD05).
          </p>
        </div>

        {/* Actores Canónicos Autorizados */}
        <div className="bg-upt-surface border border-upt-border rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-upt-success font-semibold text-xs tracking-wider uppercase">
            <Users className="w-4 h-4" />
            <span>Actores Canónicos con Permisos (SoD)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {routeMeta?.canonicalActors?.map((actor) => (
              <span
                key={actor}
                className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded font-medium"
              >
                {actor}
              </span>
            )) || <span className="text-xs text-upt-muted">Todos los actores</span>}
          </div>
          <p className="text-xs text-upt-muted leading-snug">
            Segregación de funciones (SoD) y perfiles autorizados a acceder a las operaciones de esta pantalla.
          </p>
        </div>
      </div>

      {/* Quick Navigation / Related Sub-screens */}
      {relatedRoutes && relatedRoutes.length > 0 && (
        <div className="bg-upt-surface border border-upt-border rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-upt-text-secondary font-semibold text-xs tracking-wider uppercase">
            <ExternalLink className="w-4 h-4 text-upt-secondary" />
            <span>Sub-pantallas y Rutas Relacionadas para Pruebas</span>
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
            Aviso de Gobernanza de la Fase III (Shell Global y Navegación)
          </p>
          <p>
            Esta pantalla cuenta con ruta formal registrada, trazabilidad canónica y marco de layout activo. 
            Su lógica de negocio interactiva, formularios de captura y datos simulados se habilitarán de forma 
            progresiva a partir de la <strong>Fase IV (Integración de Datos y Simulación de Roles)</strong> y 
            la <strong>Fase V (Flujo Central de RFC)</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
