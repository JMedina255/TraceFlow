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
      color: 'text-upt-bright',
      bg: 'border-blue-200/80',
    },
    {
      id: 'm-2',
      label: 'RFCs Pendientes de Atención',
      value: String(pendingRfcs.length),
      sub: 'En evaluación, pruebas o desarrollo',
      icon: Layers,
      color: 'text-amber-700',
      bg: 'border-amber-200/80',
    },
    {
      id: 'm-3',
      label: 'Cambios Cerrados con Éxito',
      value: String(implementedRfcs.length),
      sub: 'Doble validación QA + UAT',
      icon: ShieldCheck,
      color: 'text-upt-success',
      bg: 'border-emerald-200/80',
    },
    {
      id: 'm-4',
      label: 'Línea Base Activa',
      value: activeProject.activeBaselineVersion || 'v1.0.0',
      sub: `Cliente: ${activeProject.client}`,
      icon: Boxes,
      color: 'text-upt-secondary',
      bg: 'border-purple-200/80',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner de Bienvenida con Contexto del Operador y Proyecto Activo */}
      <div className="bg-upt-surface border border-upt-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-upt-primary border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-upt-bright" />
            <span>Fase V — CU-04 Registro de Solicitud de Cambio (RFC)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-upt-primary">
            Bienvenido, {currentUser?.fullName}
          </h1>
          <p className="text-sm text-upt-text-secondary max-w-2xl leading-relaxed">
            Operando como <strong className="text-upt-secondary font-semibold">{currentUser?.roleLabel}</strong> ({activeRoleId}) en el proyecto{' '}
            <strong className="text-upt-primary font-bold">{activeProject.name}</strong> (<span className="font-mono text-xs text-upt-secondary font-bold">{activeProject.code}</span>).
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/rfcs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-upt-institutional hover:bg-upt-primary text-white text-xs font-medium transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Solicitud (RFC)</span>
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-upt-bg text-upt-text-secondary border border-upt-border text-xs font-medium transition-colors shadow-xs"
          >
            <FolderGit2 className="w-4 h-4 text-upt-muted" />
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
              className={`p-5 rounded-xl border ${m.bg} bg-upt-surface shadow-xs flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-upt-muted">{m.label}</span>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div>
                <span className="text-2xl font-bold text-upt-primary tracking-tight">{m.value}</span>
                <p className="text-xs text-upt-muted mt-1">{m.sub}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Solicitudes de Cambio (RFC) del Proyecto Activo */}
      <section className="bg-upt-surface border border-upt-border rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-upt-border pb-3">
          <div>
            <h2 className="text-base font-bold text-upt-primary tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-upt-secondary" />
              Solicitudes de Cambio en {activeProject.name}
            </h2>
            <p className="text-xs text-upt-muted">
              Datos simulados aislados para este proyecto ({projectRfcs.length} solicitudes registradas).
            </p>
          </div>
          <Link
            to="/rfcs"
            className="text-xs text-upt-bright hover:text-upt-secondary font-medium flex items-center gap-1"
          >
            <span>Ver todas las RFCs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projectRfcs.length > 0 ? (
          <div className="divide-y divide-upt-border/70">
            {projectRfcs.map((rfc) => {
              const statusMeta = RFC_STATUS_CATALOG[rfc.status];
              return (
                <div
                  key={rfc.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-upt-bg/80 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-upt-primary">{rfc.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          statusMeta?.badgeVariant === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : statusMeta?.badgeVariant === 'warning'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : statusMeta?.badgeVariant === 'purple'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-blue-50 text-upt-secondary border-blue-200'
                        }`}
                      >
                        {statusMeta?.label || rfc.status}
                      </span>
                      <span className="text-upt-muted text-[10px]">
                        Prioridad: <strong className="text-upt-text-secondary">{rfc.priority}</strong>
                      </span>
                    </div>
                    <p className="text-upt-text font-medium">{rfc.title}</p>
                    <p className="text-upt-muted text-[11px] line-clamp-1">
                      ECS Afectado: <span className="font-mono text-upt-text-secondary font-semibold">{rfc.affectedEcsName}</span> | Solicitante: {rfc.requesterName}
                    </p>
                  </div>

                  <Link
                    to={`/rfcs/${rfc.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-upt-bg text-upt-text-secondary border border-upt-border text-xs font-medium self-start sm:self-auto shrink-0 transition-colors shadow-xs"
                  >
                    <span>Ver Expediente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-upt-muted text-xs">
            <AlertCircle className="w-8 h-8 mx-auto text-upt-muted mb-2" />
            <p>No hay solicitudes de cambio registradas en este proyecto.</p>
            <Link
              to="/rfcs/new"
              className="mt-3 inline-flex items-center gap-1.5 text-upt-bright hover:text-upt-secondary font-medium"
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
            <h2 className="text-lg font-bold text-upt-primary tracking-tight">
              Módulos del Sistema (Arquitectura DG-04)
            </h2>
            <p className="text-xs text-upt-muted">
              Acceso a las herramientas operativas de los 8 paquetes arquitecturales de TraceFlow SCM.
            </p>
          </div>
          <span className="text-xs font-mono text-upt-secondary bg-blue-50 px-2.5 py-1 rounded border border-blue-200 font-medium">
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
                className="group p-5 bg-upt-surface hover:bg-blue-50/40 border border-upt-border hover:border-upt-bright/50 rounded-xl transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-upt-bg group-hover:bg-blue-100/80 text-upt-secondary group-hover:text-upt-bright transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-upt-muted group-hover:text-upt-secondary">
                      {section.packageCode}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-upt-text group-hover:text-upt-primary transition-colors">
                    {section.name}
                  </h3>
                  <p className="text-xs text-upt-muted mt-1 line-clamp-2 leading-relaxed">
                    Acceder a las pantallas y herramientas operativas de este dominio.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-upt-border/70 flex items-center justify-between text-xs text-upt-bright font-medium">
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
