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
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Users,
  GitBranch,
  ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useRfcStore } from '../../store/useRfcStore';
import { RFC_STATUS_CATALOG, CANONICAL_ROLES } from '../../types';

export const DashboardView: React.FC = () => {
  const { currentUser, activeRoleId } = useAuthStore();
  const { projects, activeProject, setActiveProject } = useProjectStore();
  const { getRfcsByProject } = useRfcStore();

  const activeRoleDef = activeRoleId ? CANONICAL_ROLES[activeRoleId] : null;

  // Filtrar proyectos autorizados para la cuenta actual
  const userAssignedProjectIds = currentUser?.assignedProjectIds || [];
  const authorizedProjects = projects.filter((p) =>
    userAssignedProjectIds.length === 0 || userAssignedProjectIds.includes(p.id)
  );

  // Solicitudes del proyecto activo
  const projectRfcs = getRfcsByProject(activeProject.id);

  // Derivar métricas contextuales según el rol efectivo
  const pendingRfcs = projectRfcs.filter((r) => 
    !['IMPLEMENTADA', 'RECHAZADA', 'DESESTIMADA', 'CANCELADA'].includes(r.status)
  );
  const registeredRfcs = projectRfcs.filter((r) => r.status === 'REGISTRADA');
  const subsanacionRfcs = projectRfcs.filter((r) => r.status === 'EN_SUBSANACION');
  const technicalAnalysisRfcs = projectRfcs.filter((r) => r.status === 'EN_ANALISIS_TECNICO' || r.status === 'CLASIFICADA');
  const ccbPendingRfcs = projectRfcs.filter((r) => r.status === 'EN_EVALUACION' && r.classification === 'CAMBIO_MAYOR');
  const qaPendingRfcs = projectRfcs.filter((r) => r.status === 'EN_PRUEBAS');
  const implementedRfcs = projectRfcs.filter((r) => r.status === 'IMPLEMENTADA');

  // Mis solicitudes (para Solicitante PU-01)
  const myRfcs = projectRfcs.filter((r) => r.requesterId === currentUser?.id);
  const mySubsanaciones = myRfcs.filter((r) => r.status === 'EN_SUBSANACION');

  // Configuración contextual de métricas según rol efectivo
  const getRoleMetrics = () => {
    switch (activeRoleId) {
      case 'PU-01':
        return [
          {
            id: 'm-pu01-1',
            label: 'Mis Solicitudes en Proyecto',
            value: String(myRfcs.length),
            sub: `${mySubsanaciones.length} en subsanación`,
            icon: GitPullRequest,
            color: 'text-upt-bright',
            bg: 'border-blue-200/80',
          },
          {
            id: 'm-pu01-2',
            label: 'Observaciones por Subsanar',
            value: String(mySubsanaciones.length),
            sub: mySubsanaciones.length > 0 ? 'Requieren tu atención' : 'Al día',
            icon: AlertTriangle,
            color: 'text-amber-700',
            bg: 'border-amber-200/80',
          },
          {
            id: 'm-pu01-3',
            label: 'Cambios Implementados',
            value: String(myRfcs.filter((r) => r.status === 'IMPLEMENTADA').length),
            sub: 'Conformidad total',
            icon: CheckCircle2,
            color: 'text-upt-success',
            bg: 'border-emerald-200/80',
          },
          {
            id: 'm-pu01-4',
            label: 'Línea Base del Proyecto',
            value: activeProject.activeBaselineVersion || 'v1.0.0',
            sub: activeProject.name,
            icon: Boxes,
            color: 'text-upt-secondary',
            bg: 'border-purple-200/80',
          },
        ];

      case 'PU-02':
        return [
          {
            id: 'm-pu02-1',
            label: 'Por Validar y Clasificar',
            value: String(registeredRfcs.length),
            sub: 'Revisión formal inicial (CU-05)',
            icon: Clock,
            color: 'text-upt-bright',
            bg: 'border-blue-200/80',
          },
          {
            id: 'm-pu02-2',
            label: 'En Subsanación',
            value: String(subsanacionRfcs.length),
            sub: 'A la espera del solicitante',
            icon: AlertTriangle,
            color: 'text-amber-700',
            bg: 'border-amber-200/80',
          },
          {
            id: 'm-pu02-3',
            label: 'Total Solicitudes en Proyecto',
            value: String(projectRfcs.length),
            sub: `${pendingRfcs.length} activas`,
            icon: Layers,
            color: 'text-upt-secondary',
            bg: 'border-purple-200/80',
          },
          {
            id: 'm-pu02-4',
            label: 'Proyectos Autorizados',
            value: String(authorizedProjects.length),
            sub: 'Bajo tu gestión',
            icon: FolderGit2,
            color: 'text-upt-success',
            bg: 'border-emerald-200/80',
          },
        ];

      case 'PU-03':
        return [
          {
            id: 'm-pu03-1',
            label: 'Por Análisis de Impacto',
            value: String(technicalAnalysisRfcs.length),
            sub: 'Evaluación técnica (CU-06)',
            icon: Layers,
            color: 'text-upt-bright',
            bg: 'border-blue-200/80',
          },
          {
            id: 'm-pu03-2',
            label: 'Solicitudes Activas',
            value: String(pendingRfcs.length),
            sub: 'En el proyecto actual',
            icon: GitPullRequest,
            color: 'text-upt-secondary',
            bg: 'border-purple-200/80',
          },
          {
            id: 'm-pu03-3',
            label: 'Línea Base Vigente',
            value: activeProject.activeBaselineVersion || 'v1.0.0',
            sub: 'Configuración oficial',
            icon: Boxes,
            color: 'text-upt-success',
            bg: 'border-emerald-200/80',
          },
          {
            id: 'm-pu03-4',
            label: 'Proyectos Asignados',
            value: String(authorizedProjects.length),
            sub: 'Acreditados para tu cuenta',
            icon: FolderGit2,
            color: 'text-amber-700',
            bg: 'border-amber-200/80',
          },
        ];

      case 'PU-04':
        return [
          {
            id: 'm-pu04-1',
            label: 'Cambios Mayores por Deliberar',
            value: String(ccbPendingRfcs.length),
            sub: 'Dictamen colegiado CCB (CU-07)',
            icon: ShieldCheck,
            color: 'text-upt-bright',
            bg: 'border-blue-200/80',
          },
          {
            id: 'm-pu04-2',
            label: 'Solicitudes en Trámite',
            value: String(pendingRfcs.length),
            sub: 'Monitoreo de control de cambios',
            icon: Layers,
            color: 'text-amber-700',
            bg: 'border-amber-200/80',
          },
          {
            id: 'm-pu04-3',
            label: 'Cambios Implementados',
            value: String(implementedRfcs.length),
            sub: 'Cierre formal completado',
            icon: CheckCircle2,
            color: 'text-upt-success',
            bg: 'border-emerald-200/80',
          },
          {
            id: 'm-pu04-4',
            label: 'Línea Base Vigente',
            value: activeProject.activeBaselineVersion || 'v1.0.0',
            sub: activeProject.name,
            icon: Boxes,
            color: 'text-upt-secondary',
            bg: 'border-purple-200/80',
          },
        ];

      case 'PU-05':
        return [
          {
            id: 'm-pu05-1',
            label: 'Línea Base Activa',
            value: activeProject.activeBaselineVersion || 'v1.0.0',
            sub: 'Custodia Maestra SCM',
            icon: Boxes,
            color: 'text-upt-bright',
            bg: 'border-blue-200/80',
          },
          {
            id: 'm-pu05-2',
            label: 'Solicitudes del Proyecto',
            value: String(projectRfcs.length),
            sub: `${pendingRfcs.length} activas`,
            icon: GitPullRequest,
            color: 'text-upt-secondary',
            bg: 'border-purple-200/80',
          },
          {
            id: 'm-pu05-3',
            label: 'Registro de Auditoría',
            value: 'Activo (Demo)',
            sub: 'Eventos locales demostrativos',
            icon: History,
            color: 'text-upt-success',
            bg: 'border-emerald-200/80',
          },
          {
            id: 'm-pu05-4',
            label: 'Gobernanza de Accesos',
            value: '7 Perfiles',
            sub: 'Administración de usuarios (CU-01)',
            icon: Users,
            color: 'text-amber-700',
            bg: 'border-amber-200/80',
          },
        ];

      case 'PU-06':
        return [
          {
            id: 'm-pu06-1',
            label: 'Solicitudes en Trámite',
            value: String(pendingRfcs.length),
            sub: 'Ciclo de cambios del proyecto',
            icon: GitPullRequest,
            color: 'text-upt-bright',
            bg: 'border-blue-200/80',
          },
          {
            id: 'm-pu06-2',
            label: 'Cambios Implementados',
            value: String(implementedRfcs.length),
            sub: 'En línea base maestra',
            icon: CheckCircle2,
            color: 'text-upt-success',
            bg: 'border-emerald-200/80',
          },
          {
            id: 'm-pu06-3',
            label: 'Línea Base del Proyecto',
            value: activeProject.activeBaselineVersion || 'v1.0.0',
            sub: 'Biblioteca de Trabajo',
            icon: Boxes,
            color: 'text-upt-secondary',
            bg: 'border-purple-200/80',
          },
          {
            id: 'm-pu06-4',
            label: 'Proyectos Asignados',
            value: String(authorizedProjects.length),
            sub: 'Asignación técnica',
            icon: FolderGit2,
            color: 'text-amber-700',
            bg: 'border-amber-200/80',
          },
        ];

      case 'PU-07':
      default:
        return [
          {
            id: 'm-pu07-1',
            label: 'Pendientes de Validación QA',
            value: String(qaPendingRfcs.length),
            sub: 'Certificación técnica (CU-16..19)',
            icon: ShieldCheck,
            color: 'text-amber-700',
            bg: 'border-amber-200/80',
          },
          {
            id: 'm-pu07-2',
            label: 'Solicitudes en Trámite',
            value: String(pendingRfcs.length),
            sub: 'Monitoreo de calidad',
            icon: Layers,
            color: 'text-upt-bright',
            bg: 'border-blue-200/80',
          },
          {
            id: 'm-pu07-3',
            label: 'Cambios Certificados',
            value: String(implementedRfcs.length),
            sub: 'Conformidad aprobada',
            icon: CheckCircle2,
            color: 'text-upt-success',
            bg: 'border-emerald-200/80',
          },
          {
            id: 'm-pu07-4',
            label: 'Línea Base Activa',
            value: activeProject.activeBaselineVersion || 'v1.0.0',
            sub: 'Biblioteca de Soporte',
            icon: Boxes,
            color: 'text-upt-secondary',
            bg: 'border-purple-200/80',
          },
        ];
    }
  };

  const metrics = getRoleMetrics();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner de Bienvenida con Contexto del Operador y Rol Efectivo */}
      <div className="bg-upt-surface border border-upt-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-upt-primary border border-blue-200">
            <GitBranch className="w-3.5 h-3.5 text-upt-bright" />
            <span>Espacio de Trabajo: {activeRoleDef?.role || 'Consulta'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-upt-primary">
            Bienvenido, {currentUser?.fullName}
          </h1>
          <p className="text-sm text-upt-text-secondary max-w-2xl leading-relaxed">
            Sesión activa como <strong className="text-upt-secondary font-semibold">{activeRoleDef?.label || currentUser?.roleLabel}</strong> en el proyecto{' '}
            <strong className="text-upt-primary font-bold">{activeProject.name}</strong> (<span className="font-mono text-xs text-upt-secondary font-bold">{activeProject.code}</span>).
          </p>
        </div>

        {/* Accesos Rápidos Contextuales por Rol */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {activeRoleId === 'PU-01' && (
            <Link
              to="/rfcs/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-upt-institutional hover:bg-upt-primary text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-upt-yellow" />
              <span>Nueva Solicitud (RFC)</span>
            </Link>
          )}

          {activeRoleId === 'PU-02' && (
            <Link
              to="/rfcs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-upt-institutional hover:bg-upt-primary text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Clock className="w-4 h-4 text-upt-yellow" />
              <span>Bandeja de Revisión</span>
            </Link>
          )}

          {activeRoleId === 'PU-04' && (
            <Link
              to="/rfcs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-upt-institutional hover:bg-upt-primary text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-upt-yellow" />
              <span>Deliberación CCB</span>
            </Link>
          )}

          {activeRoleId === 'PU-05' && (
            <Link
              to="/scm/operations"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-upt-institutional hover:bg-upt-primary text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-upt-yellow" />
              <span>Operaciones SCM</span>
            </Link>
          )}

          {activeRoleId === 'PU-07' && (
            <Link
              to="/qa/validation/RFC-2026-0042"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-upt-institutional hover:bg-upt-primary text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-upt-yellow" />
              <span>Validación QA</span>
            </Link>
          )}

          <Link
            to="/rfcs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-upt-bg text-upt-text-secondary border border-upt-border text-xs font-medium transition-colors shadow-xs cursor-pointer"
          >
            <GitPullRequest className="w-4 h-4 text-upt-muted" />
            <span>Ver Bandeja RFC</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas Dinámicas Adaptadas al Rol */}
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

      {/* Sección Contextual: Tareas o Solicitudes Relevantes para el Rol */}
      {activeRoleId === 'PU-01' && mySubsanaciones.length > 0 && (
        <section className="bg-amber-50/70 border border-amber-300 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Observaciones Pendientes de Subsanación ({mySubsanaciones.length})</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            Las siguientes solicitudes registradas por tu cuenta fueron observadas por el Gestor y requieren subsanación formal para continuar su ciclo de vida.
          </p>
          <div className="space-y-2 pt-1">
            {mySubsanaciones.map((r) => (
              <div
                key={r.id}
                className="p-3 bg-white rounded-lg border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-mono font-bold text-amber-950">
                    <span>{r.code}</span>
                    <span className="font-sans font-normal text-upt-text">— {r.title}</span>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-1 line-clamp-1 italic">
                    Motivo: {r.subsanacionNotes || 'Faltan antecedentes probatorios del impacto técnico.'}
                  </p>
                </div>
                <Link
                  to={`/rfcs/${r.id}/edit`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-2xs"
                >
                  <span>Subsanar Ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Listado de Solicitudes de Cambio (RFC) del Proyecto Activo */}
      <section className="bg-upt-surface border border-upt-border rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-upt-border pb-3">
          <div>
            <h2 className="text-base font-bold text-upt-primary tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-upt-secondary" />
              Solicitudes de Cambio en {activeProject.name}
            </h2>
            <p className="text-xs text-upt-muted">
              {activeRoleId === 'PU-01' ? 'Historial de solicitudes en el proyecto' : `Bandeja operacional (${projectRfcs.length} solicitudes registradas).`}
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
            {projectRfcs.slice(0, 5).map((rfc) => {
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
            <ShieldAlert className="w-8 h-8 mx-auto text-upt-muted mb-2" />
            <p>No hay solicitudes de cambio registradas en este proyecto.</p>
            {activeRoleId === 'PU-01' && (
              <Link
                to="/rfcs/new"
                className="mt-3 inline-flex items-center gap-1.5 text-upt-bright hover:text-upt-secondary font-medium"
              >
                <span>Registrar la primera Solicitud (RFC)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Proyectos Autorizados para este Usuario (Aislamiento Multitenant) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-upt-primary tracking-tight flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-upt-yellow" />
              Proyectos Asignados a tu Cuenta
            </h2>
            <p className="text-xs text-upt-muted">
              {authorizedProjects.length} proyecto(s) con acceso acreditado según la política de aislamiento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {authorizedProjects.map((proj) => {
            const isCurrentActive = proj.id === activeProject.id;
            return (
              <div
                key={proj.id}
                className={`p-4 rounded-xl border transition-all shadow-xs flex flex-col justify-between ${
                  isCurrentActive
                    ? 'bg-blue-50/60 border-upt-bright ring-1 ring-upt-bright text-upt-text'
                    : 'bg-upt-surface border-upt-border text-upt-text'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-upt-bg border border-upt-border text-upt-primary">
                      {proj.code}
                    </span>
                    {isCurrentActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-upt-bright bg-white px-2 py-0.5 rounded-full border border-blue-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Activo
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveProject(proj.id)}
                        className="text-[11px] text-upt-bright hover:underline font-medium cursor-pointer"
                      >
                        Seleccionar
                      </button>
                    )}
                  </div>
                  <h3 className="font-semibold text-xs text-upt-text">{proj.name}</h3>
                  <p className="text-[11px] text-upt-muted mt-1">Cliente: {proj.client}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-upt-border/60 flex items-center justify-between text-[10px] text-upt-muted font-mono">
                  <span>Línea Base: {proj.activeBaselineVersion}</span>
                  <span>{proj.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
