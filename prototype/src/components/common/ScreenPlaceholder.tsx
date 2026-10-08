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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {routeMeta?.screenId || 'SCREEN'}
            </span>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Wireframe: {routeMeta?.wireframeId || 'WF'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-800/80 text-slate-400">
              {routeMeta?.packageName || 'TraceFlow SCM Core'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            <span>{routeMeta?.plannedPhase || 'Previsto para próximas fases'}</span>
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Casos de Uso Gobernados */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <FileCheck2 className="w-4 h-4" />
            <span>Casos de Uso Gobernados</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {routeMeta?.governedUseCases?.map((cu) => (
              <span
                key={cu}
                className="font-mono text-xs bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded"
              >
                {cu}
              </span>
            )) || <span className="text-xs text-slate-500">No especificado</span>}
          </div>
          <p className="text-xs text-slate-400 leading-snug">
            Interacciones formales vinculadas a este nodo según la matriz de trazabilidad UWE del SAD de Diseño (FD05).
          </p>
        </div>

        {/* Actores Canónicos Autorizados */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <Users className="w-4 h-4" />
            <span>Actores Canónicos con Permisos (SoD)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {routeMeta?.canonicalActors?.map((actor) => (
              <span
                key={actor}
                className="text-xs bg-slate-800/90 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded"
              >
                {actor}
              </span>
            )) || <span className="text-xs text-slate-500">Todos los actores</span>}
          </div>
          <p className="text-xs text-slate-400 leading-snug">
            Segregación de funciones (SoD) y perfiles autorizados a acceder a las operaciones de esta pantalla.
          </p>
        </div>
      </div>

      {/* Quick Navigation / Related Sub-screens */}
      {relatedRoutes && relatedRoutes.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs tracking-wider uppercase">
            <ExternalLink className="w-4 h-4 text-indigo-400" />
            <span>Sub-pantallas y Rutas Relacionadas para Pruebas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedRoutes.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-700/60 hover:bg-indigo-600/30 hover:border-indigo-500 transition-colors"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-3 h-3 text-indigo-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Informative Guidance Banner */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">
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
