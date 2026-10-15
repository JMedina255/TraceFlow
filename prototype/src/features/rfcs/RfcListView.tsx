import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Search,
  Filter,
  RotateCcw,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  FolderGit2,
  SlidersHorizontal,
} from 'lucide-react';
import { useRfcStore } from '../../store/useRfcStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  RFC_STATUS_CATALOG,
  type RFCStatus,
  type ChangeClassification,
  type Priority,
  type RFC,
} from '../../types';

// Opciones de clasificación incluyendo solicitudes sin clasificar aún
type ClassificationFilter = 'TODOS' | ChangeClassification | 'SIN_CLASIFICAR';

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export const RfcListView: React.FC = () => {
  const { activeProject } = useProjectStore();
  const { rfcs } = useRfcStore();
  const { activeRoleId, currentUser, switchRole } = useAuthStore();

  // Estados locales para filtros y paginación
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [classificationFilter, setClassificationFilter] = useState<ClassificationFilter>('TODOS');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Obtener todas las RFCs pertenecientes al proyecto activo (Aislamiento Multitenant)
  const projectRfcs = useMemo(() => {
    return rfcs.filter((r) => r.projectId === activeProject.id);
  }, [rfcs, activeProject.id]);

  // Aplicar filtros de búsqueda, estado y clasificación
  const filteredRfcs = useMemo(() => {
    return projectRfcs.filter((rfc) => {
      // 1. Filtro de búsqueda por código y título (insensible a mayúsculas)
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchCode = rfc.code.toLowerCase().includes(query);
        const matchTitle = rfc.title.toLowerCase().includes(query);
        const matchRequester = rfc.requesterName.toLowerCase().includes(query);
        if (!matchCode && !matchTitle && !matchRequester) {
          return false;
        }
      }

      // 2. Filtro por Estado Oficial TB-07
      if (statusFilter !== 'TODOS') {
        if (rfc.status !== statusFilter) {
          return false;
        }
      }

      // 3. Filtro por Clasificación (Mayor / Menor / Sin Clasificar)
      if (classificationFilter !== 'TODOS') {
        if (classificationFilter === 'SIN_CLASIFICAR') {
          if (rfc.classification) return false;
        } else {
          if (rfc.classification !== classificationFilter) return false;
        }
      }

      return true;
    });
  }, [projectRfcs, searchTerm, statusFilter, classificationFilter]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredRfcs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedRfcs = filteredRfcs.slice(startIndex, startIndex + pageSize);

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('TODOS');
    setClassificationFilter('TODOS');
    setCurrentPage(1);
  };

  // Verificar si hay algún filtro activo
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'TODOS' || classificationFilter !== 'TODOS';

  // Validación de autorización SoD para la acción "+ Nueva RFC" (Exclusivo PU-01 Solicitante)
  const isAuthorizedToCreate = activeRoleId === 'PU-01';
  const canSwitchToSolicitante = currentUser.allowedRoleIds.includes('PU-01');

  // Renderizador de badge de prioridad
  const renderPriorityBadge = (priority: Priority) => {
    const config: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
      BAJA: { label: 'Baja', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
      MEDIA: { label: 'Media', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
      ALTA: { label: 'Alta', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
      CRITICA: { label: 'Crítica', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-300' },
    };
    const c = config[priority] || config.MEDIA;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
        {c.label}
      </span>
    );
  };

  // Renderizador de badge de estado oficial TB-07
  const renderStatusBadge = (status: RFCStatus) => {
    const meta = RFC_STATUS_CATALOG[status];
    const variantStyles: Record<string, string> = {
      neutral: 'bg-gray-100 text-gray-800 border-gray-300',
      info: 'bg-blue-50 text-upt-secondary border-blue-200',
      warning: 'bg-amber-50 text-amber-900 border-amber-300',
      purple: 'bg-purple-50 text-purple-900 border-purple-200',
      success: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      danger: 'bg-red-50 text-red-900 border-red-300',
    };
    const badgeClass = variantStyles[meta?.badgeVariant || 'neutral'];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badgeClass}`}
        title={`Responsable canónico: ${meta?.responsibleActor || 'N/A'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
        {meta?.label || status}
      </span>
    );
  };

  // Renderizador de badge de clasificación
  const renderClassificationBadge = (classification?: ChangeClassification) => {
    if (!classification) {
      return (
        <span className="text-[11px] text-upt-muted italic bg-upt-bg px-2 py-0.5 rounded border border-upt-border">
          Sin clasificar
        </span>
      );
    }
    if (classification === 'CAMBIO_MAYOR') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
          Mayor (CCB)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
        Menor (Deleg.)
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Encabezado Principal y Badges de Trazabilidad */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-upt-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-upt-primary border border-blue-200">
              CU-04..08, CU-30
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-upt-bg text-upt-text-secondary border border-upt-border">
              SCREEN-05 / WF-05
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-upt-bg text-upt-muted border border-upt-border">
              Patrón PRES-03
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-blue-900 bg-blue-50 border border-blue-200">
              14 Estados Oficiales (TB-07)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-upt-primary flex items-center gap-2">
              <Inbox className="w-6 h-6 text-upt-secondary" />
              Bandeja General de Solicitudes (RFC)
            </h1>
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-upt-bg border border-upt-border text-upt-text-secondary">
              {filteredRfcs.length} {filteredRfcs.length === 1 ? 'solicitud' : 'solicitudes'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-upt-muted mt-1 max-w-3xl">
            Centro de monitoreo y control del ciclo de vida de Solicitudes de Cambio (RFC) del proyecto activo. 
            Permite filtrar por estado normativo, severidad y clasificación técnica.
          </p>
        </div>

        {/* Acciones Superiores: Nueva RFC (Exclusivo Solicitante PU-01) */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          {isAuthorizedToCreate ? (
            <Link
              to="/rfcs/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              title="Registrar una nueva Solicitud de Cambio (CU-04)"
            >
              <Plus className="w-4 h-4 text-upt-yellow" />
              <span>+ Nueva Solicitud RFC</span>
            </Link>
          ) : (
            <div className="relative group">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-upt-bg border border-upt-border text-upt-muted/70 text-xs font-medium cursor-not-allowed shadow-xs"
              >
                <Plus className="w-4 h-4 text-upt-muted/60" />
                <span>+ Nueva Solicitud RFC</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  PU-01
                </span>
              </button>
              {/* Tooltip explicativo de Segregación de Funciones */}
              <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-upt-surface border border-upt-border rounded-xl shadow-xl text-left hidden group-hover:block z-30 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-upt-text">
                      Restricción de Rol (SoD)
                    </p>
                    <p className="text-[11px] text-upt-muted leading-tight">
                      La creación de RFC (CU-04) está reservada exclusivamente para el rol <strong className="text-upt-text">Solicitante (PU-01)</strong>.
                    </p>
                    {canSwitchToSolicitante && (
                      <button
                        type="button"
                        onClick={() => switchRole('PU-01')}
                        className="mt-1 text-[11px] font-bold text-upt-bright hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Conmutar a mi rol Solicitante</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banner de Proyecto Activo e Indicadores de Estado */}
      <div className="bg-upt-surface border border-upt-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-upt-secondary flex items-center justify-center shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-upt-muted font-medium">Proyecto Activo:</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-upt-primary border border-blue-200">
                {activeProject.code}
              </span>
              <span className="text-[11px] text-upt-text-secondary hidden sm:inline">
                ({activeProject.client})
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-upt-text">
              {activeProject.name}
            </h2>
          </div>
        </div>

        {/* Resumen rápido de solicitudes */}
        <div className="flex items-center gap-4 text-xs font-mono pt-3 md:pt-0 border-t md:border-t-0 border-upt-border">
          <div className="text-right">
            <span className="text-upt-muted block text-[11px]">Total Proyecto:</span>
            <span className="font-bold text-upt-primary text-sm">{projectRfcs.length}</span>
          </div>
          <div className="h-8 w-px bg-upt-border" />
          <div className="text-right">
            <span className="text-upt-muted block text-[11px]">En Proceso:</span>
            <span className="font-bold text-amber-700 text-sm">
              {projectRfcs.filter((r) => !['IMPLEMENTADA', 'DESESTIMADA', 'RECHAZADA', 'CANCELADA'].includes(r.status)).length}
            </span>
          </div>
          <div className="h-8 w-px bg-upt-border" />
          <div className="text-right">
            <span className="text-upt-muted block text-[11px]">Cerradas:</span>
            <span className="font-bold text-emerald-700 text-sm">
              {projectRfcs.filter((r) => ['IMPLEMENTADA', 'DESESTIMADA', 'RECHAZADA', 'CANCELADA'].includes(r.status)).length}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Multifacéticos (PRES-03) */}
      <div className="bg-upt-surface border border-upt-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-upt-primary uppercase tracking-wider">
            <SlidersHorizontal className="w-4 h-4 text-upt-secondary" />
            <span>Filtros y Búsqueda de Solicitudes</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-upt-secondary hover:text-upt-primary hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          {/* Búsqueda por texto o código */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-upt-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por código (ej. RFC-2026-0001), título o solicitante..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-upt-border text-xs sm:text-sm text-upt-text placeholder-upt-muted/70 focus:outline-none focus:ring-2 focus:ring-upt-bright transition-colors"
            />
          </div>

          {/* Filtro por Estado Oficial (14 estados de TB-07) */}
          <div className="md:col-span-4 relative">
            <Filter className="w-4 h-4 text-upt-muted absolute left-3 top-3" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-upt-border text-xs sm:text-sm text-upt-text focus:outline-none focus:ring-2 focus:ring-upt-bright appearance-none cursor-pointer"
            >
              <option value="TODOS">Todos los Estados (14 de TB-07)</option>
              {Object.values(RFC_STATUS_CATALOG).map((meta) => (
                <option key={meta.status} value={meta.status}>
                  {meta.label} {meta.isTerminal ? '(Terminal)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Clasificación */}
          <div className="md:col-span-3">
            <select
              value={classificationFilter}
              onChange={(e) => {
                setClassificationFilter(e.target.value as ClassificationFilter);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-white border border-upt-border text-xs sm:text-sm text-upt-text focus:outline-none focus:ring-2 focus:ring-upt-bright appearance-none cursor-pointer"
            >
              <option value="TODOS">Todas las Clasificaciones</option>
              <option value="CAMBIO_MAYOR">Cambio Mayor (CCB)</option>
              <option value="CAMBIO_MENOR">Cambio Menor (Doble Llave)</option>
              <option value="SIN_CLASIFICAR">Sin Clasificar (Pendiente)</option>
            </select>
          </div>
        </div>

        {/* Resumen de resultados filtrados */}
        <div className="flex items-center justify-between text-xs text-upt-muted pt-2 border-t border-upt-border/60">
          <div>
            Mostrando <strong className="text-upt-text font-semibold">{filteredRfcs.length}</strong> de{' '}
            <strong className="text-upt-text font-semibold">{projectRfcs.length}</strong> solicitudes en este proyecto
          </div>

          <div className="flex items-center gap-2">
            <span>Mostrar por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-upt-border rounded px-2 py-0.5 text-xs text-upt-text cursor-pointer focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Principal de Solicitudes (Alta Densidad UPT) */}
      <div className="bg-upt-surface border border-upt-border rounded-2xl shadow-xs overflow-hidden">
        {paginatedRfcs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-upt-institutional text-white font-semibold border-b border-upt-border select-none">
                  <th className="py-3 px-4 font-mono text-[11px] tracking-wider">Código RFC</th>
                  <th className="py-3 px-4 min-w-[260px]">Título y Justificación Resumida</th>
                  <th className="py-3 px-3 text-center">Prioridad</th>
                  <th className="py-3 px-3 text-center">Clasificación</th>
                  <th className="py-3 px-3 text-center">Estado Oficial (TB-07)</th>
                  <th className="py-3 px-4 min-w-[140px]">Solicitante</th>
                  <th className="py-3 px-3 font-mono text-[11px]">Fecha</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-upt-border/80">
                {paginatedRfcs.map((rfc: RFC, idx: number) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={rfc.id}
                      className={`transition-colors hover:bg-blue-50/50 ${
                        isEven ? 'bg-white' : 'bg-upt-bg/30'
                      }`}
                    >
                      {/* Código RFC */}
                      <td className="py-3 px-4 font-mono font-bold text-upt-primary text-xs whitespace-nowrap">
                        <Link
                          to={`/rfcs/${rfc.id}`}
                          className="hover:underline hover:text-upt-bright transition-colors"
                          title="Abrir expediente completo"
                        >
                          {rfc.code}
                        </Link>
                      </td>

                      {/* Título y Resumen */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/rfcs/${rfc.id}`}
                          className="font-semibold text-upt-text hover:text-upt-bright transition-colors line-clamp-1 text-xs sm:text-[13px]"
                        >
                          {rfc.title}
                        </Link>
                        <p className="text-[11px] text-upt-muted line-clamp-1 mt-0.5">
                          {rfc.justification || rfc.description}
                        </p>
                      </td>

                      {/* Prioridad */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderPriorityBadge(rfc.priority)}
                      </td>

                      {/* Clasificación */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderClassificationBadge(rfc.classification)}
                      </td>

                      {/* Estado Oficial */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderStatusBadge(rfc.status)}
                      </td>

                      {/* Solicitante */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-upt-text text-xs">{rfc.requesterName}</div>
                        <div className="text-[10px] text-upt-muted font-mono">{rfc.requesterId}</div>
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3 px-3 font-mono text-[11px] text-upt-muted whitespace-nowrap">
                        {new Date(rfc.createdAt).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Acción Ver Expediente */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Link
                          to={`/rfcs/${rfc.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-upt-bright hover:text-white text-upt-primary text-xs font-semibold border border-blue-200 transition-colors shadow-2xs"
                        >
                          <span>Ver</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Estado Vacío */
          <div className="py-12 px-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-upt-bg border border-upt-border text-upt-muted mx-auto flex items-center justify-center">
              <Inbox className="w-7 h-7 text-upt-muted/70" />
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-upt-text">
                {hasActiveFilters
                  ? 'No se encontraron solicitudes con los filtros aplicados'
                  : 'No hay solicitudes de cambio registradas en este proyecto'}
              </h3>
              <p className="text-xs text-upt-muted leading-relaxed">
                {hasActiveFilters
                  ? 'Prueba modificando los términos de búsqueda o limpiando los filtros para ver el catálogo completo de este proyecto.'
                  : `Actualmente el proyecto ${activeProject.name} (${activeProject.code}) no registra solicitudes de cambio activas.`}
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-upt-bg border border-upt-border text-xs font-medium text-upt-text transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-upt-muted" />
                  <span>Restablecer Filtros</span>
                </button>
              ) : isAuthorizedToCreate ? (
                <Link
                  to="/rfcs/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 text-upt-yellow" />
                  <span>Registrar la Primera RFC (CU-04)</span>
                </Link>
              ) : null}
            </div>
          </div>
        )}

        {/* Barra de Paginación */}
        {filteredRfcs.length > 0 && (
          <div className="bg-upt-bg/40 border-t border-upt-border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none">
            <div className="text-upt-muted text-[11px]">
              Mostrando registros del <strong className="text-upt-text">{startIndex + 1}</strong> al{' '}
              <strong className="text-upt-text">
                {Math.min(startIndex + pageSize, filteredRfcs.length)}
              </strong>{' '}
              de <strong className="text-upt-text">{filteredRfcs.length}</strong> totales
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-upt-border bg-white hover:bg-upt-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4 text-upt-text" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-upt-border bg-white hover:bg-upt-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4 text-upt-text" />
              </button>

              <span className="px-3 py-1 font-mono text-xs text-upt-text font-medium bg-white border border-upt-border rounded-lg">
                Página {safeCurrentPage} de {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-upt-border bg-white hover:bg-upt-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4 text-upt-text" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-upt-border bg-white hover:bg-upt-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4 text-upt-text" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nota Normativa e Integridad del Ciclo de Vida */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-upt-text-secondary flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-upt-secondary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-upt-primary">
            Gobernanza del Ciclo de Vida de Configuración (IEEE 828 / TB-07)
          </div>
          <p className="text-[11px] leading-relaxed text-upt-muted">
            Cada solicitud mostrada en esta bandeja está vinculada a un Elemento de Configuración de Software (ECS) y controlada por la matriz de transición formal DG-11. Las acciones de avance de estado requieren la intervención colegiada de los roles canónicos autorizados según las reglas de negocio RN-01 a RN-09.
          </p>
        </div>
      </div>
    </div>
  );
};
