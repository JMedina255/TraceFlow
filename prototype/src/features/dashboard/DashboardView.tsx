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
  Sparkles,
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useRfcStore } from '../../store/useRfcStore';
import { SIDEBAR_NAVIGATION } from '../../routes/navigation';
import { RFC_STATUS_CATALOG } from '../../types';

export const DashboardView: React.FC = () => {
  const { currentUser, activeRoleId } = useAuthStore();
  const { activeProject } = useProjectStore();
  const { getRfcsByProject } = useRfcStore();

  // Filtrado estricto por aislamiento del proyecto activo
  const projectRfcs = getRfcsByProject(activeProject.id);
  const pendingRfcs = projectRfcs.filter((r) => 
    !['IMPLEMENTADA', 'RECHAZADA', 'DESESTIMADA', 'CANCELADA'].includes(r.status)
  );
  const implementedRfcs = projectRfcs.filter((r) => r.status === 'IMPLEMENTADA');

  const metrics = [
    {
      id: 'm-1',
      label: 'Solicitudes en este Proyecto',
      value: String(projectRfcs.length),
      sub: `${pendingRfcs.length} en ciclo activo`,
      icon: GitPullRequest,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/40 border-indigo-800/60',
    },
    {
      id: 'm-2',
      label: 'RFCs Pendientes de Atención',
      value: String(pendingRfcs.length),
      sub: 'En evaluación, pruebas o desarrollo',
      icon: Layers,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/60',
    },
    {
      id: 'm-3',
      label: 'Cambios Cerrados con Éxito',
      value: String(implementedRfcs.length),
      sub: 'Doble validación QA + UAT',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/60',
    },
    {
      id: 'm-4',
      label: 'Línea Base Activa',
      value: activeProject.activeBaselineVersion || 'v1.0.0',
      sub: `Cliente: ${activeProject.client}`,
      icon: Boxes,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40 border-purple-800/60',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner de Bienvenida con Contexto del Operador y Proyecto Activo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fase V — CU-04 Registro de Solicitud de Cambio (RFC)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Bienvenido, {currentUser?.fullName}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Operando como <strong className="text-indigo-400 font-semibold">{currentUser?.roleLabel}</strong> ({activeRoleId}) en el proyecto{' '}
            <strong className="text-white">{activeProject.name}</strong> (<span className="font-mono text-xs text-indigo-300">{activeProject.code}</span>).
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

      {/* Tarjetas de Métricas Dinámicas del Proyecto */}
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

      {/* Solicitudes de Cambio (RFC) del Proyecto Activo */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
              Solicitudes de Cambio en {activeProject.name}
            </h2>
            <p className="text-xs text-slate-400">
              Datos simulados aislados para este proyecto ({projectRfcs.length} solicitudes registradas).
            </p>
          </div>
          <Link
            to="/rfcs"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>Ver todas las RFCs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projectRfcs.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {projectRfcs.map((rfc) => {
              const statusMeta = RFC_STATUS_CATALOG[rfc.status];
              return (
                <div
                  key={rfc.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-300">{rfc.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          statusMeta?.badgeVariant === 'success'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : statusMeta?.badgeVariant === 'warning'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : statusMeta?.badgeVariant === 'purple'
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        }`}
                      >
                        {statusMeta?.label || rfc.status}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        Prioridad: <strong className="text-slate-400">{rfc.priority}</strong>
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium">{rfc.title}</p>
                    <p className="text-slate-400 text-[11px] line-clamp-1">
                      ECS Afectado: <span className="font-mono text-slate-300">{rfc.affectedEcsName}</span> | Solicitante: {rfc.requesterName}
                    </p>
                  </div>

                  <Link
                    to={`/rfcs/${rfc.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium self-start sm:self-auto shrink-0 transition-colors"
                  >
                    <span>Ver Expediente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p>No hay solicitudes de cambio registradas en este proyecto.</p>
            <Link
              to="/rfcs/new"
              className="mt-3 inline-flex items-center gap-1.5 text-indigo-400 hover:underline"
            >
              <span>Registrar la primera Solicitud (RFC)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* Módulos de los 8 Paquetes de DG-04 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Módulos del Sistema (Arquitectura DG-04)
            </h2>
            <p className="text-xs text-slate-400">
              Acceso a las herramientas operativas de los 8 paquetes arquitecturales de TraceFlow SCM.
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
