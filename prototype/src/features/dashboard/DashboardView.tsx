import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GitPullRequest, 
  Boxes, 
  ShieldCheck, 
  Layers, 
  FolderGit2, 
  ArrowRight,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { SIDEBAR_NAVIGATION } from '../../routes/navigation';

export const DashboardView: React.FC = () => {
  const { currentUser } = useAuthStore();

  const metrics = [
    {
      id: 'm-1',
      label: 'Solicitudes de Cambio (RFC)',
      value: '14',
      sub: '4 pendientes de análisis',
      icon: GitPullRequest,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/40 border-indigo-800/60',
    },
    {
      id: 'm-2',
      label: 'Órdenes de Cambio (ECN)',
      value: '5',
      sub: '2 en implementación activa',
      icon: Layers,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40 border-purple-800/60',
    },
    {
      id: 'm-3',
      label: 'Elementos ECS Custodiados',
      value: '28',
      sub: '1 bloqueado (Check-Out)',
      icon: Boxes,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/60',
    },
    {
      id: 'm-4',
      label: 'Líneas Base Congeladas',
      value: '3',
      sub: 'Versión activa: v1.0.0',
      icon: ShieldCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/60',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner de Bienvenida con Contexto del Operador */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fase III — Shell Global Operativo</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Bienvenido, {currentUser?.fullName}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Sesión iniciada con perfil canónico{' '}
            <strong className="text-indigo-400 font-semibold">{currentUser?.roleLabel}</strong>{' '}
            (<span className="font-mono text-xs">{currentUser?.roleId}</span>) en la plataforma institucional de gestión de configuración de <strong>ÉXODO S.A.C.</strong>
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/rfcs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Solicitud (RFC)</span>
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
          >
            <FolderGit2 className="w-4 h-4 text-slate-400" />
            <span>Ver Proyectos</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas de SCM */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className={`p-5 rounded-xl border ${m.bg} bg-slate-900/60 shadow-xs flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400">{m.label}</span>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div>
                <span className="text-2xl font-bold text-white tracking-tight">{m.value}</span>
                <p className="text-xs text-slate-400 mt-1">{m.sub}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Módulos de los 8 Paquetes de DG-04 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Módulos del Sistema (Arquitectura DG-04)
            </h2>
            <p className="text-xs text-slate-400">
              Acceso a las pantallas físicas del sistema estructuradas según el modelo arquitectural aprobado.
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            8 Paquetes Formalizados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SIDEBAR_NAVIGATION.filter((s) => s.id !== 'general').map((section) => {
            const Icon = section.icon;
            const primaryItem = section.items[0];

            return (
              <Link
                key={section.id}
                to={primaryItem.path}
                className="group p-5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-indigo-600/60 rounded-xl transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                      {section.packageCode}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-white transition-colors">
                    {section.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    Acceder a las pantallas y herramientas operativas de este dominio.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
                  <span>{primaryItem.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};
