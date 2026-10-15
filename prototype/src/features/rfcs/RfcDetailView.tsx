import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  ShieldAlert,
  Building2,
  Layers,
  FileCheck2,
  Lock,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Clock,
  GitCommit,
  User,
  Activity,
  FileCode,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useRfcStore } from '../../store/useRfcStore';
import { useProjectStore } from '../../store/useProjectStore';
import { ecsService } from '../../services/ecs.service';
import { auditService } from '../../services/audit.service';
import { INITIAL_ECNS } from '../../data/initialEcns';
import {
  RFC_STATUS_CATALOG,
  type RFCStatus,
  type Priority,
  type ChangeClassification,
  type AuditEvent,
} from '../../types';

type DetailTab = 'resumen' | 'ecs' | 'impacto' | 'dictamen' | 'ecn' | 'qa' | 'auditoria';

export const RfcDetailView: React.FC = () => {
  const { rfcId } = useParams<{ rfcId: string }>();

  const { getRfcById } = useRfcStore();
  const { activeProject, setActiveProject } = useProjectStore();

  const [activeTab, setActiveTab] = useState<DetailTab>('resumen');

  // Buscar el expediente en el store de RFCs
  const rfc = useMemo(() => {
    if (!rfcId) return undefined;
    return getRfcById(rfcId);
  }, [rfcId, getRfcById]);

  // Consultar ECS afectado
  const ecsInfo = useMemo(() => {
    if (!rfc?.affectedEcsId) return undefined;
    return ecsService.getById(rfc.affectedEcsId);
  }, [rfc]);

  // Consultar orden ECN vinculada
  const linkedEcn = useMemo(() => {
    if (!rfc) return undefined;
    return INITIAL_ECNS.find((e) => e.id === rfc.ecnId || e.rfcId === rfc.id || e.rfcCode === rfc.code);
  }, [rfc]);

  // Consultar eventos de auditoría para este expediente
  const rfcAuditEvents = useMemo(() => {
    if (!rfc) return [];
    const allEvents = auditService.getAll();
    return allEvents.filter(
      (ev: AuditEvent) => ev.entityId === rfc.id || ev.entityId === rfc.code
    );
  }, [rfc]);

  // =========================================================================
  // CASO 1: EXPEDIENTE NO ENCONTRADO
  // =========================================================================
  if (!rfc) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-upt-error mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-upt-bg border border-upt-border text-upt-muted">
            Error 404 &bull; Expediente No Encontrado
          </span>
          <h1 className="text-2xl font-bold text-upt-primary">
            La Solicitud de Cambio no existe en el catálogo
          </h1>
          <p className="text-xs sm:text-sm text-upt-muted max-w-lg mx-auto">
            El identificador de expediente solicitado (<strong className="font-mono text-upt-text">{rfcId}</strong>) no se encuentra registrado en los repositorios de TraceFlow SCM. Verifique el código o consulte la bandeja general.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/rfcs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Bandeja de Solicitudes</span>
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASO 2: AISLAMIENTO MULTITENANT DE PROYECTO (SEGURIDAD Y CONTROL DE ACCESO)
  // =========================================================================
  const isCrossProjectAccess = rfc.projectId !== activeProject.id;
  if (isCrossProjectAccess) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-500 text-upt-text rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6 text-amber-950" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded border border-amber-300">
                Aislamiento de Proyecto &bull; Restricción Multitenant
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-amber-950 pt-1">
                Acceso Bloqueado: Expediente de Proyecto Externo
              </h2>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed pt-1">
                Por políticas de gobierno y aislamiento de configuración (FD05 §20.5 / RNF-08), 
                no está permitido consultar solicitudes de cambio pertenecientes a proyectos distintos 
                al actualmente seleccionado en la sesión activa.
              </p>
            </div>
          </div>

          {/* Comparación de Proyectos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/80 p-4 rounded-xl border border-amber-200 text-xs">
            <div>
              <span className="text-amber-800 font-semibold block text-[11px]">Proyecto del Expediente Solicitado:</span>
              <div className="font-bold text-upt-primary text-sm mt-0.5">{rfc.projectName}</div>
              <div className="font-mono text-upt-muted text-[11px]">ID: {rfc.projectId} &bull; Código RFC: {rfc.code}</div>
            </div>
            <div>
              <span className="text-amber-800 font-semibold block text-[11px]">Tu Proyecto Activo Actual:</span>
              <div className="font-bold text-upt-primary text-sm mt-0.5">{activeProject.name}</div>
              <div className="font-mono text-upt-muted text-[11px]">ID: {activeProject.id} ({activeProject.code})</div>
            </div>
          </div>

          {/* Opciones de Solución */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-200">
            <button
              type="button"
              onClick={() => {
                setActiveProject(rfc.projectId);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Conmutar al proyecto &quot;{rfc.projectName}&quot; y abrir expediente</span>
            </button>

            <Link
              to="/rfcs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Regresar a la Bandeja de mi Proyecto</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASO 3: RENDERIZADO DEL EXPEDIENTE 360° (PROYECTO AUTORIZADO)
  // =========================================================================
  const statusMeta = RFC_STATUS_CATALOG[rfc.status];

  // Helper para badge de prioridad
  const renderPriorityBadge = (priority: Priority) => {
    const config: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
      BAJA: { label: 'Baja', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
      MEDIA: { label: 'Media', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
      ALTA: { label: 'Alta', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-300' },
      CRITICA: { label: 'Crítica / Urgente', bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-300' },
    };
    const c = config[priority] || config.MEDIA;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
        {c.label}
      </span>
    );
  };

  // Helper para badge de clasificación
  const renderClassificationBadge = (classification?: ChangeClassification) => {
    if (!classification) {
      return (
        <span className="text-xs text-upt-muted italic bg-upt-bg px-2.5 py-0.5 rounded border border-upt-border">
          Pendiente de Clasificación Oficial (CU-05)
        </span>
      );
    }
    if (classification === 'CAMBIO_MAYOR') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-900 border border-purple-300">
          Cambio Mayor (Requiere Deliberación CCB)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-900 border border-blue-300">
        Cambio Menor (Autoridad Delegada Doble Llave)
      </span>
    );
  };

  // Helper para estado oficial
  const renderOfficialStateBadge = (status: RFCStatus) => {
    const variantStyles: Record<string, string> = {
      neutral: 'bg-gray-100 text-gray-800 border-gray-300',
      info: 'bg-blue-50 text-upt-secondary border-blue-300',
      warning: 'bg-amber-50 text-amber-900 border-amber-300',
      purple: 'bg-purple-50 text-purple-900 border-purple-300',
      success: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      danger: 'bg-red-50 text-red-900 border-red-300',
    };
    const badgeClass = variantStyles[statusMeta?.badgeVariant || 'neutral'];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
        <span className="w-2 h-2 rounded-full bg-current opacity-80" />
        <span>{statusMeta?.label || status}</span>
      </span>
    );
  };

  // Determinación de la Variante Contextual Oficial (WF-06A, WF-06B, WF-06C)
  const isVariantA = ['REGISTRADA', 'EN_SUBSANACION', 'CLASIFICADA'].includes(rfc.status);
  const isVariantB = ['EN_ANALISIS_TECNICO', 'EN_EVALUACION'].includes(rfc.status);
  const isVariantC = ['AUTORIZADA', 'ORDEN_EMITIDA', 'EN_IMPLEMENTACION', 'EN_PRUEBAS', 'EN_ACEPTACION', 'IMPLEMENTADA', 'DESESTIMADA', 'RECHAZADA', 'CANCELADA'].includes(rfc.status);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Barra de Navegación Superior y Retorno */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/rfcs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-upt-secondary hover:text-upt-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Bandeja de Solicitudes</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] font-mono text-upt-muted">
          <span>Trazabilidad: SCREEN-06 &bull; NAV-06 &bull; PRES-04/07</span>
        </div>
      </div>

      {/* Cabecera Principal del Expediente 360° */}
      <div className="bg-upt-surface border border-upt-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-upt-border pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-extrabold px-2.5 py-0.5 rounded bg-blue-50 text-upt-primary border border-blue-200">
                {rfc.code}
              </span>
              {renderOfficialStateBadge(rfc.status)}
              <span className="text-[11px] font-mono text-upt-muted bg-upt-bg px-2 py-0.5 rounded border border-upt-border">
                {rfc.category || 'CAMBIO'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-upt-text pt-1">
              {rfc.title}
            </h1>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0 text-xs font-mono">
            <span className="text-upt-muted text-[11px]">Fecha de Radicación:</span>
            <span className="font-semibold text-upt-text">
              {new Date(rfc.createdAt).toLocaleString('es-PE', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>

        {/* Ficha Resumida de Metadatos Clave (Grid 2x3) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Proyecto */}
          <div className="p-3 rounded-xl bg-upt-bg/60 border border-upt-border space-y-1">
            <span className="text-[11px] text-upt-muted flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-upt-secondary" />
              Proyecto de Software:
            </span>
            <div className="font-semibold text-upt-text truncate">{rfc.projectName}</div>
            <div className="text-[10px] font-mono text-upt-muted">{rfc.projectId}</div>
          </div>

          {/* Solicitante */}
          <div className="p-3 rounded-xl bg-upt-bg/60 border border-upt-border space-y-1">
            <span className="text-[11px] text-upt-muted flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-upt-secondary" />
              Solicitante (PU-01):
            </span>
            <div className="font-semibold text-upt-text truncate">{rfc.requesterName}</div>
            <div className="text-[10px] font-mono text-upt-muted">{rfc.requesterId}</div>
          </div>

          {/* Prioridad */}
          <div className="p-3 rounded-xl bg-upt-bg/60 border border-upt-border space-y-1">
            <span className="text-[11px] text-upt-muted flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-upt-secondary" />
              Prioridad Solicitada:
            </span>
            <div>{renderPriorityBadge(rfc.priority)}</div>
          </div>

          {/* Clasificación Oficial */}
          <div className="p-3 rounded-xl bg-upt-bg/60 border border-upt-border space-y-1">
            <span className="text-[11px] text-upt-muted flex items-center gap-1">
              <FileCheck2 className="w-3.5 h-3.5 text-upt-secondary" />
              Clasificación (RN-01):
            </span>
            <div>{renderClassificationBadge(rfc.classification)}</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL DE PRESENTACIÓN CONTEXTUAL POR ESTADO (WF-06A / WF-06B / WF-06C) */}
      {/* ========================================================================= */}

      {/* VARIANTE WF-06A: REGISTRADA / EN_SUBSANACION / CLASIFICADA */}
      {isVariantA && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-upt-primary rounded-lg shrink-0 mt-0.5">
                <FileText className="w-5 h-5 text-upt-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200/60 text-upt-primary">
                    FASE: ADMISIÓN Y FILTRO DE COMPLETITUD (CU-05)
                  </span>
                  <span className="text-xs text-upt-muted font-medium">Variante WF-06A</span>
                </div>
                <h3 className="text-sm font-bold text-upt-primary">
                  {rfc.status === 'REGISTRADA' && 'Solicitud registrada pendiente de evaluación formal de completitud'}
                  {rfc.status === 'EN_SUBSANACION' && 'Solicitud observada en subsanación por el solicitante'}
                  {rfc.status === 'CLASIFICADA' && 'Solicitud admitida formalmente y clasificada para análisis técnico'}
                </h3>
                <p className="text-xs text-upt-text-secondary leading-relaxed">
                  {rfc.status === 'REGISTRADA' &&
                    'El Analista de Requerimientos / Gestor (PU-02) verificará la veracidad, completitud de la justificación (RN-01) y pertinencia del ECS antes de clasificarla como Cambio Mayor o Menor.'}
                  {rfc.status === 'EN_SUBSANACION' &&
                    `El Gestor registró observaciones sobre la solicitud. El Solicitante (${rfc.requesterName}) dispone del plazo normativo para subsanar los datos antes de que sea desestimada.`}
                  {rfc.status === 'CLASIFICADA' &&
                    'La solicitud ha superado el filtro formal y está lista para que el Arquitecto de Software elabore el Informe Técnico de Impacto (CU-06).'}
                </p>
              </div>
            </div>

            {/* Acción Contextual Informativa para Roles */}
            <div className="shrink-0 text-right">
              <span className="text-[10px] font-mono text-upt-muted block">Actor Responsable:</span>
              <span className="text-xs font-bold text-upt-primary">{statusMeta.responsibleActor}</span>
            </div>
          </div>

          {/* Panel de Subsanación si el usuario es Solicitante y la RFC está en subsanación */}
          {rfc.status === 'EN_SUBSANACION' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Observaciones registradas para subsanación:</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed pl-5 italic">
                {rfc.subsanacionNotes || 'Faltan antecedentes probatorios del impacto transaccional en la pasarela.'}
              </p>
            </div>
          )}

          {/* Aviso de CU-05 Pendiente */}
          <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-xs text-upt-muted">
            <span className="text-[11px]">
              * La operación CU-05 (Clasificar / Observar / Desestimar) corresponde a la siguiente fase de desarrollo (Fase V.3).
            </span>
            <span className="font-mono text-[11px] text-upt-secondary font-semibold">Estado Actual: {rfc.status}</span>
          </div>
        </div>
      )}

      {/* VARIANTE WF-06B: EN_ANALISIS_TECNICO / EN_EVALUACION */}
      {isVariantB && (
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 text-purple-900 rounded-lg shrink-0 mt-0.5">
                <FileCode className="w-5 h-5 text-purple-800" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200/70 text-purple-900">
                    FASE: EVALUACIÓN DE IMPACTO Y DICTAMEN (CU-06 / CU-07 / CU-30)
                  </span>
                  <span className="text-xs text-upt-muted font-medium">Variante WF-06B</span>
                </div>
                <h3 className="text-sm font-bold text-purple-950">
                  {rfc.status === 'EN_ANALISIS_TECNICO'
                    ? 'Evaluación Técnica de Arquitectura en Curso (CU-06)'
                    : 'Deliberación Colegiada y Votación de Dictamen (CU-07 / CU-30)'}
                </h3>
                <p className="text-xs text-purple-900 leading-relaxed">
                  {rfc.status === 'EN_ANALISIS_TECNICO'
                    ? 'El Arquitecto está evaluando la afectación a la Triple Restricción (Alcance, Tiempo, Costo) y el nivel de riesgo técnico para ratificar la clasificación.'
                    : `La solicitud cuenta con informe técnico de impacto y está siendo evaluada por ${
                        rfc.classification === 'CAMBIO_MAYOR'
                          ? 'el Comité de Control de Cambios (CCB) en sesión colegiada (CU-07)'
                          : 'la Autoridad Operativa Delegada (Doble Llave Gestor + Arquitecto) bajo CU-30'
                      }.`}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="text-[10px] font-mono text-purple-800 block">Actor Responsable:</span>
              <span className="text-xs font-bold text-purple-950">{statusMeta.responsibleActor}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-purple-200/80 flex items-center justify-between text-xs text-purple-800">
            <span className="text-[11px]">
              * Las operaciones de votación CCB (CU-07) y autorización de Cambio Menor (CU-30) se habilitarán en la Fase V.3.
            </span>
            <span className="font-mono text-[11px] font-semibold">{rfc.status}</span>
          </div>
        </div>
      )}

      {/* VARIANTE WF-06C: AUTORIZADA / ORDEN_EMITIDA / IMPLEMENTACION / PRUEBAS / ACEPTACION / IMPLEMENTADA */}
      {isVariantC && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-900 rounded-lg shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5 text-emerald-800" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900">
                    FASE: EJECUCIÓN, QA Y CIERRE DE CONFIGURACIÓN
                  </span>
                  <span className="text-xs text-upt-muted font-medium">Variante WF-06C</span>
                </div>
                <h3 className="text-sm font-bold text-emerald-950">
                  {rfc.status === 'IMPLEMENTADA'
                    ? 'Expediente Cerrado Exitosamente con Doble Conformidad (QA + UAT)'
                    : `Expediente en Ejecución Operativa SCM — Estado: ${statusMeta.label}`}
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {rfc.status === 'IMPLEMENTADA'
                    ? 'La modificación fue incorporada a la Biblioteca Maestra (CU-12), se congeló la nueva Línea Base con hash SHA-256 (CU-20) y se formalizó el cierre del cambio.'
                    : `El expediente avanza a través de las fases de implementación, verificación de calidad en Biblioteca de Soporte y suscripción formal de Acta UAT.`}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="text-[10px] font-mono text-emerald-800 block">Actor Responsable:</span>
              <span className="text-xs font-bold text-emerald-950">{statusMeta.responsibleActor}</span>
            </div>
          </div>

          {linkedEcn && (
            <div className="p-3 bg-white/80 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-upt-primary">Orden de Cambio Asociada:</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                  {linkedEcn.code}
                </span>
                <span className="text-upt-muted hidden sm:inline">({linkedEcn.status})</span>
              </div>
              <span className="text-[11px] text-upt-muted font-mono">
                Desarrollador: {linkedEcn.assignedDeveloperName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑAS ESTRUCTURADAS DEL EXPEDIENTE 360° (PRES-04 / PRES-07) */}
      {/* ========================================================================= */}
      <div className="bg-upt-surface border border-upt-border rounded-2xl shadow-xs overflow-hidden">
        {/* Barra de Pestañas */}
        <div className="flex items-center overflow-x-auto border-b border-upt-border bg-upt-bg/30 px-3 scrollbar-none select-none">
          {[
            { id: 'resumen', label: '1. Resumen y Justificación' },
            { id: 'ecs', label: '2. ECS Afectados' },
            { id: 'impacto', label: '3. Análisis de Impacto' },
            { id: 'dictamen', label: '4. Evaluación y Dictamen' },
            { id: 'ecn', label: '5. Orden ECN/ECO' },
            { id: 'qa', label: '6. Calidad y UAT' },
            { id: 'auditoria', label: '7. Historial y Auditoría' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as DetailTab)}
                className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-upt-bright text-upt-primary bg-white shadow-2xs font-bold'
                    : 'border-transparent text-upt-muted hover:text-upt-text hover:bg-upt-bg/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="p-6 sm:p-8">
          
          {/* ===================================================================== */}
          {/* PESTAÑA 1: RESUMEN Y JUSTIFICACIÓN */}
          {/* ===================================================================== */}
          {activeTab === 'resumen' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-upt-primary">
                  Descripción y Justificación de Negocio (CU-04 / RN-01)
                </h3>
                <p className="text-xs text-upt-muted">
                  Fundamentación operativa y técnica radicada por el Solicitante para la apertura del expediente.
                </p>
              </div>

              {/* Título Formal */}
              <div className="p-4 rounded-xl bg-upt-bg/50 border border-upt-border space-y-1">
                <span className="text-[11px] font-semibold text-upt-muted block uppercase tracking-wide">
                  Título Formal de la Solicitud
                </span>
                <p className="text-sm font-bold text-upt-primary">{rfc.title}</p>
              </div>

              {/* Descripción Detallada */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-upt-text flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-upt-secondary" />
                  Descripción Detallada del Requerimiento o Falla:
                </span>
                <div className="p-4 rounded-xl bg-white border border-upt-border text-xs sm:text-sm text-upt-text leading-relaxed whitespace-pre-line shadow-2xs">
                  {rfc.description}
                </div>
              </div>

              {/* Justificación de Negocio */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-upt-text flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-upt-secondary" />
                  Justificación de Negocio / Valor Agregado (Mandatoria bajo RN-01):
                </span>
                <div className="p-4 rounded-xl bg-white border border-upt-border text-xs sm:text-sm text-upt-text leading-relaxed whitespace-pre-line shadow-2xs">
                  {rfc.justification}
                </div>
              </div>

              {/* Propuesta Técnica Sugerida */}
              {rfc.proposedSolution ? (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-upt-text flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-upt-secondary" />
                    Propuesta Técnica Sugerida por el Solicitante:
                  </span>
                  <div className="p-4 rounded-xl bg-white border border-upt-border text-xs sm:text-sm text-upt-text leading-relaxed whitespace-pre-line shadow-2xs">
                    {rfc.proposedSolution}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-upt-bg/40 border border-upt-border text-xs text-upt-muted italic">
                  No se registró propuesta técnica preliminar por el Solicitante. La solución arquitectural será formulada por el especialista técnico en CU-06.
                </div>
              )}

              {/* Archivos de Sustento Adjuntos */}
              <div className="space-y-2 pt-2 border-t border-upt-border">
                <span className="text-xs font-semibold text-upt-text flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-upt-secondary" />
                  Documentación Técnica y Evidencias Adjuntas:
                </span>

                {rfc.attachments && rfc.attachments.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {rfc.attachments.map((file) => (
                      <div
                        key={file}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs font-mono text-upt-secondary shadow-2xs"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-upt-secondary" />
                        <span className="font-medium text-upt-text">{file}</span>
                        <span className="text-[10px] text-upt-muted bg-white px-1.5 py-0.5 rounded border border-blue-100">
                          Registrado
                        </span>
                      </div>
                    ))}
                    <div className="w-full text-[11px] text-upt-muted italic pt-1">
                      * Archivos probatorios referenciados formalmente en el registro. En el prototipo no se ejecutan descargas ficticias de binarios.
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-upt-bg/40 border border-upt-border text-xs text-upt-muted">
                    No se adjuntaron archivos adicionales de respaldo para esta solicitud.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* PESTAÑA 2: ECS AFECTADOS */}
          {/* ===================================================================== */}
          {activeTab === 'ecs' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-upt-primary">
                  Elementos de Configuración de Software (ECS) Vinculados
                </h3>
                <p className="text-xs text-upt-muted">
                  Artefactos de software identificados para intervención y sujetos a control de bibliotecas y bloqueos.
                </p>
              </div>

              {/* Tarjeta del ECS Principal */}
              {ecsInfo ? (
                <div className="p-5 rounded-2xl bg-white border border-upt-border shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-upt-border pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 text-upt-primary border border-blue-200">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-upt-primary">{ecsInfo.code}</span>
                        <h4 className="text-sm font-bold text-upt-text">{ecsInfo.name}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          ecsInfo.currentLibrary === 'MAESTRA'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                            : ecsInfo.currentLibrary === 'SOPORTE'
                            ? 'bg-blue-50 text-upt-secondary border border-blue-200'
                            : 'bg-amber-50 text-amber-900 border border-amber-300'
                        }`}
                      >
                        Biblioteca {ecsInfo.currentLibrary}
                      </span>
                      {ecsInfo.lock?.isLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-50 text-red-900 border border-red-300">
                          <Lock className="w-3 h-3" />
                          Bloqueado (RN-06)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-upt-muted block text-[11px]">Tipo de ECS:</span>
                      <span className="font-semibold text-upt-text">{ecsInfo.type}</span>
                    </div>
                    <div>
                      <span className="text-upt-muted block text-[11px]">Versión en Línea Base:</span>
                      <span className="font-semibold text-upt-text">v{ecsInfo.currentVersion}</span>
                    </div>
                    <div>
                      <span className="text-upt-muted block text-[11px]">Proyecto Propietario:</span>
                      <span className="font-semibold text-upt-text">{rfc.projectName} ({ecsInfo.projectId})</span>
                    </div>
                  </div>

                  {ecsInfo.description && (
                    <div className="pt-2 border-t border-upt-border/80 text-xs text-upt-muted">
                      <span className="font-semibold text-upt-text-secondary block mb-0.5">Propósito del ECS:</span>
                      <p>{ecsInfo.description}</p>
                    </div>
                  )}

                  {/* Estado de Bloqueo RN-06 */}
                  {ecsInfo.lock?.isLocked && (
                    <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs space-y-1">
                      <div className="font-semibold text-red-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-red-700" />
                        <span>Bloqueo de Sincronización Activo (Regla de Negocio RN-06)</span>
                      </div>
                      <p className="text-red-800 text-[11px]">
                        Bloqueado por <strong className="font-semibold">{ecsInfo.lock.lockedByUserName || 'Administrador SCM'}</strong> para la orden{' '}
                        <strong className="font-mono">{ecsInfo.lock.ecnId || 'ECN activa'}</strong>
                        {ecsInfo.lock.lockedAt && ` desde el ${new Date(ecsInfo.lock.lockedAt).toLocaleString()}`}.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-upt-bg border border-upt-border text-xs text-upt-muted">
                  ECS referenciado: <strong className="font-mono text-upt-text">{rfc.affectedEcsName}</strong> ({rfc.affectedEcsId}).
                </div>
              )}

              {/* ECS adicionales identificados en el análisis técnico */}
              {rfc.technicalImpact?.affectedEcsIds && rfc.technicalImpact.affectedEcsIds.length > 1 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-upt-text">
                    ECS Secundarios Identificados en Evaluación de Impacto:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rfc.technicalImpact.affectedEcsIds
                      .filter((id) => id !== rfc.affectedEcsId)
                      .map((id) => (
                        <span
                          key={id}
                          className="font-mono text-xs px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-upt-primary font-semibold"
                        >
                          {id}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* PESTAÑA 3: ANÁLISIS DE IMPACTO TÉCNICO */}
          {/* ===================================================================== */}
          {activeTab === 'impacto' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-upt-primary">
                  Informe Técnico de Impacto Arquitectural (CU-06 / RN-05)
                </h3>
                <p className="text-xs text-upt-muted">
                  Evaluación de viabilidad, dependencias y afectación a la Triple Restricción emitida por Arquitectura.
                </p>
              </div>

              {rfc.technicalImpact ? (
                <div className="space-y-5">
                  {/* Ficha Resumen del Dictamen de Arquitectura */}
                  <div className="p-5 rounded-2xl bg-white border border-upt-border shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-upt-border pb-3">
                      <div>
                        <span className="text-[11px] text-upt-muted font-mono block">Especialista Evaluador (PU-03):</span>
                        <div className="font-bold text-upt-primary text-sm">
                          {rfc.technicalImpact.architectName}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-upt-muted font-mono block">Fecha de Emisión:</span>
                        <span className="font-mono text-xs text-upt-text font-semibold">
                          {new Date(rfc.technicalImpact.reportDate).toLocaleDateString('es-PE')}
                        </span>
                      </div>
                    </div>

                    {/* Descripción de impacto */}
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-upt-text">
                        Afectación Arquitectural y de Seguridad:
                      </span>
                      <p className="text-xs sm:text-sm text-upt-text-secondary leading-relaxed bg-upt-bg/40 p-3.5 rounded-xl border border-upt-border">
                        {rfc.technicalImpact.architectureImpactDescription}
                      </p>
                    </div>

                    {/* Métricas de la Triple Restricción */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                      <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
                        <span className="text-upt-muted block text-[11px]">Esfuerzo Estimado:</span>
                        <span className="font-bold text-upt-primary text-sm font-mono">
                          {rfc.technicalImpact.estimatedEffortHours} hrs
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
                        <span className="text-upt-muted block text-[11px]">Presupuesto Estimado:</span>
                        <span className="font-bold text-upt-primary text-sm font-mono">
                          S/. {rfc.technicalImpact.estimatedCost.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
                        <span className="text-upt-muted block text-[11px]">Plazo de Ejecución:</span>
                        <span className="font-bold text-upt-primary text-sm font-mono">
                          {rfc.technicalImpact.estimatedDurationDays} días útiles
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
                        <span className="text-upt-muted block text-[11px]">Riesgo Técnico:</span>
                        <span
                          className={`font-bold text-xs uppercase ${
                            rfc.technicalImpact.technicalRisk === 'ALTO'
                              ? 'text-red-700'
                              : rfc.technicalImpact.technicalRisk === 'MEDIO'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {rfc.technicalImpact.technicalRisk}
                        </span>
                      </div>
                    </div>

                    {/* Indicador de Triple Restricción */}
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-xs flex flex-wrap items-center justify-between gap-3">
                      <span className="font-semibold text-upt-primary">Afectación de la Triple Restricción (RN-05):</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className={rfc.technicalImpact.tripleConstraintImpact.scopeAffected ? 'text-upt-primary font-bold' : 'text-upt-muted'}>
                          {rfc.technicalImpact.tripleConstraintImpact.scopeAffected ? '✓ Alcance Afectado' : '✗ Alcance No Afectado'}
                        </span>
                        <span className={rfc.technicalImpact.tripleConstraintImpact.scheduleAffected ? 'text-upt-primary font-bold' : 'text-upt-muted'}>
                          {rfc.technicalImpact.tripleConstraintImpact.scheduleAffected ? '✓ Cronograma Afectado' : '✗ Cronograma Intacto'}
                        </span>
                        <span className={rfc.technicalImpact.tripleConstraintImpact.costAffected ? 'text-upt-primary font-bold' : 'text-upt-muted'}>
                          {rfc.technicalImpact.tripleConstraintImpact.costAffected ? '✓ Presupuesto Adicional' : '✗ Sin Costo Adicional'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Estado Pendiente Real */
                <div className="p-6 rounded-2xl bg-upt-bg/50 border border-upt-border text-center space-y-3">
                  <Clock className="w-8 h-8 text-upt-muted mx-auto" />
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-upt-text">
                      Informe Técnico de Impacto Pendiente (CU-06)
                    </h4>
                    <p className="text-xs text-upt-muted leading-relaxed">
                      Esta solicitud aún no cuenta con informe técnico de impacto registrado. Conforme al flujo oficial, el Arquitecto de Software emitirá este dictamen una vez admitida la solicitud.
                    </p>
                  </div>
                  <span className="inline-block text-[11px] font-mono font-medium text-blue-900 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    Estado Actual: {rfc.status} &bull; Próxima Acción: CU-06
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* PESTAÑA 4: EVALUACIÓN Y DICTAMEN */}
          {/* ===================================================================== */}
          {activeTab === 'dictamen' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-upt-primary">
                  Evaluación Colegiada y Dictamen de Decisión (CU-07 / CU-30)
                </h3>
                <p className="text-xs text-upt-muted">
                  Resolución emitida por el Comité de Control de Cambios (CCB) o por la Autoridad Delegada (Doble Llave).
                </p>
              </div>

              {['AUTORIZADA', 'ORDEN_EMITIDA', 'EN_IMPLEMENTACION', 'EN_PRUEBAS', 'EN_ACEPTACION', 'IMPLEMENTADA'].includes(rfc.status) ? (
                <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-upt-border pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-sm text-emerald-950">
                        DICTAMEN APROBATORIO FORMAL EMITIDO
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      {rfc.classification === 'CAMBIO_MAYOR' ? 'Aprobación CCB (CU-07)' : 'Autorización Delegada (CU-30)'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-upt-text-secondary leading-relaxed">
                    {rfc.classification === 'CAMBIO_MAYOR'
                      ? 'El Comité de Control de Cambios (CCB) evaluó colegiadamente el informe técnico de impacto y aprobó unánimemente la procedencia del cambio para emisión de la correspondiente orden ECN.'
                      : 'El Gestor y el Especialista Técnico ejercieron la Autorización Delegada Compartida (regla de Doble Llave sin quorum CCB) para este Cambio Menor.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-upt-border/80">
                    <div>
                      <span className="text-upt-muted block text-[11px]">Tipo de Votación:</span>
                      <span className="font-semibold text-upt-text">
                        {rfc.classification === 'CAMBIO_MAYOR' ? 'Votación Colegiada Ordinaria' : 'Doble Firma Delegada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-upt-muted block text-[11px]">Habilitación Operativa:</span>
                      <span className="font-semibold text-emerald-800">Emisión de ECN / Check-Out de ECS</span>
                    </div>
                  </div>
                </div>
              ) : rfc.status === 'RECHAZADA' ? (
                <div className="p-5 rounded-2xl bg-red-50 border border-red-300 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-red-900 font-bold">
                    <XCircle className="w-5 h-5 text-upt-error" />
                    <span>DICTAMEN NEGATIVO / CAMBIO RECHAZADO (CU-07 / CU-30)</span>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed">
                    {rfc.rejectionReason || 'El cambio fue rechazado por el Comité debido a inviabilidad operativa en ventana de producción.'}
                  </p>
                </div>
              ) : rfc.status === 'DESESTIMADA' ? (
                <div className="p-5 rounded-2xl bg-gray-100 border border-gray-300 text-xs space-y-2">
                  <div className="font-bold text-gray-900">SOLICITUD DESESTIMADA EN REVISIÓN INICIAL</div>
                  <p className="text-gray-700">
                    Cierre formal anticipado por falta de sustento técnico o incumplimiento del plazo de subsanación de observaciones.
                  </p>
                </div>
              ) : (
                /* Estado Pendiente Real */
                <div className="p-6 rounded-2xl bg-upt-bg/50 border border-upt-border text-center space-y-3">
                  <Clock className="w-8 h-8 text-upt-muted mx-auto" />
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-upt-text">
                      Evaluación Formal y Dictamen Pendientes
                    </h4>
                    <p className="text-xs text-upt-muted leading-relaxed">
                      El expediente aún no ha alcanzado la fase de deliberación y votación de dictamen. Las operaciones CU-07 y CU-30 se ejecutarán tras la emisión del informe técnico de impacto.
                    </p>
                  </div>
                  <span className="inline-block text-[11px] font-mono font-medium text-upt-muted bg-white px-3 py-1 rounded-lg border border-upt-border">
                    Estado Actual: {rfc.status}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* PESTAÑA 5: ORDEN DE CAMBIO (ECN/ECO) */}
          {/* ===================================================================== */}
          {activeTab === 'ecn' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-upt-primary">
                  Orden de Cambio de Ingeniería (ECN/ECO — CU-08)
                </h3>
                <p className="text-xs text-upt-muted">
                  Instrumento contractual y normativo que autoriza la asignación de recursos y el Check-Out en SCM.
                </p>
              </div>

              {linkedEcn ? (
                <div className="p-5 rounded-2xl bg-white border border-upt-border shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-upt-border pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-50 text-purple-900 rounded-lg border border-purple-200">
                        <GitCommit className="w-5 h-5 text-purple-800" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-upt-primary">{linkedEcn.code}</span>
                        <h4 className="text-sm font-bold text-upt-text">Orden Formalizada y Vigente</h4>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-blue-50 text-upt-secondary border border-blue-200">
                      Estado ECN: {linkedEcn.status}
                    </span>
                  </div>

                  {/* Instrucciones de Trabajo */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-upt-text">Instrucciones de Implementación:</span>
                    <p className="text-xs sm:text-sm text-upt-text-secondary bg-upt-bg/40 p-3.5 rounded-xl border border-upt-border leading-relaxed">
                      {linkedEcn.instructions}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-1">
                    <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
                      <span className="text-upt-muted block text-[11px]">Desarrollador Asignado:</span>
                      <span className="font-bold text-upt-primary truncate block">{linkedEcn.assignedDeveloperName}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
                      <span className="text-upt-muted block text-[11px]">ECS Autorizado:</span>
                      <span className="font-bold text-upt-text truncate block">{linkedEcn.affectedEcsCode}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
                      <span className="text-upt-muted block text-[11px]">Fecha de Emisión:</span>
                      <span className="font-semibold text-upt-text block">{new Date(linkedEcn.emittedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
                      <span className="text-upt-muted block text-[11px]">Fecha Límite:</span>
                      <span className="font-semibold text-amber-800 block">{linkedEcn.plannedCompletionDate}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Sin Orden Emitida Aún */
                <div className="p-6 rounded-2xl bg-upt-bg/50 border border-upt-border text-center space-y-3">
                  <Clock className="w-8 h-8 text-upt-muted mx-auto" />
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-upt-text">
                      Orden de Cambio (ECN) Pendiente de Emisión
                    </h4>
                    <p className="text-xs text-upt-muted leading-relaxed">
                      No se ha emitido orden de cambio formal para esta solicitud. La ECN será generada mediante CU-08 una vez obtenido el dictamen aprobatorio correspondiente.
                    </p>
                  </div>
                  <span className="inline-block text-[11px] font-mono font-medium text-upt-muted bg-white px-3 py-1 rounded-lg border border-upt-border">
                    Prerrequisito: Estado AUTORIZADA
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* PESTAÑA 6: QA Y ACEPTACIÓN UAT */}
          {/* ===================================================================== */}
          {activeTab === 'qa' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-upt-primary">
                  Aseguramiento de Calidad (QA) y Aceptación de Usuario (UAT)
                </h3>
                <p className="text-xs text-upt-muted">
                  Verificación en Biblioteca de Soporte (CU-16/17) y suscripción de Acta UAT por el Solicitante (CU-29).
                </p>
              </div>

              {rfc.status === 'IMPLEMENTADA' ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-upt-border pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-sm text-emerald-950">
                          CERTIFICACIÓN TÉCNICA DE CALIDAD CONFORME (CU-17 / RN-09)
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        100% PASS
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-upt-text-secondary leading-relaxed">
                      El equipo de Calidad ejecutó la suite completa de pruebas de regresión e integración en la Biblioteca de Soporte. Cero defectos abiertos. Certificado de Calidad formalmente archivado con segregación de funciones (el tester no participó como desarrollador de la orden).
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-upt-border pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-sm text-emerald-950">
                          ACTA DE ACEPTACIÓN UAT SUSCRITA (CU-29)
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        CONFORME
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-upt-text-secondary leading-relaxed">
                      El Solicitante autorizó formalmente el pase a producción tras constatar en entorno de validación el cumplimiento íntegro de los criterios de aceptación planteados en la solicitud.
                    </p>
                  </div>
                </div>
              ) : rfc.status === 'EN_PRUEBAS' ? (
                <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Activity className="w-5 h-5 text-amber-700" />
                    <span>SUITE DE PRUEBAS DE INTEGRACIÓN EN EJECUCIÓN (CU-16)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    El ECS modificado se encuentra en la Biblioteca de Soporte para la ejecución de pruebas por el Equipo de Calidad (PU-07). Pendiente de emisión del Certificado de Conformidad Técnica.
                  </p>
                </div>
              ) : rfc.status === 'EN_ACEPTACION' ? (
                <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-300 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-upt-primary font-bold text-sm">
                    <FileCheck2 className="w-5 h-5 text-upt-secondary" />
                    <span>CERTIFICADO QA CONFORME &bull; PENDIENTE DE SUSCRIPCIÓN ACTA UAT (CU-29)</span>
                  </div>
                  <p className="text-xs text-upt-text-secondary leading-relaxed">
                    Las pruebas de QA concluyeron exitosamente. Se encuentra pendiente la suscripción formal del Acta de Aceptación por el Solicitante ({rfc.requesterName}) para habilitar el Check-In a Biblioteca Maestra.
                  </p>
                </div>
              ) : (
                /* Estado Pendiente */
                <div className="p-6 rounded-2xl bg-upt-bg/50 border border-upt-border text-center space-y-3">
                  <Clock className="w-8 h-8 text-upt-muted mx-auto" />
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-upt-text">
                      Aseguramiento de Calidad y UAT Pendientes
                    </h4>
                    <p className="text-xs text-upt-muted leading-relaxed">
                      El cambio aún no ha concluido la fase de desarrollo e implementación en la Biblioteca de Trabajo. La entrega a QA (CU-16) se habilitará una vez finalizadas las modificaciones por el desarrollador.
                    </p>
                  </div>
                  <span className="inline-block text-[11px] font-mono font-medium text-upt-muted bg-white px-3 py-1 rounded-lg border border-upt-border">
                    Prerrequisito: Culminación de Implementación en Biblioteca de Trabajo
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* PESTAÑA 7: HISTORIAL Y AUDITORÍA FORENSE (SHA-256) */}
          {/* ===================================================================== */}
          {activeTab === 'auditoria' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-upt-border pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-upt-primary">
                    Bitácora Forense de Auditoría Append-Only (IEEE 828 / CU-27)
                  </h3>
                  <p className="text-xs text-upt-muted">
                    Registro inmutable de transacciones vinculadas a este expediente protegidas por hash SHA-256.
                  </p>
                </div>

                <span className="text-[11px] font-mono text-upt-secondary bg-blue-50 px-2.5 py-1 rounded border border-blue-200 font-semibold self-start sm:self-auto">
                  {rfcAuditEvents.length} {rfcAuditEvents.length === 1 ? 'evento registrado' : 'eventos registrados'}
                </span>
              </div>

              {rfcAuditEvents.length > 0 ? (
                <div className="space-y-3">
                  {rfcAuditEvents.map((evt: AuditEvent) => (
                    <div
                      key={evt.id}
                      className="p-4 rounded-xl bg-white border border-upt-border shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-upt-primary text-xs">{evt.id}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-upt-secondary border border-blue-200">
                            {evt.action}
                          </span>
                        </div>
                        <span className="text-[11px] text-upt-muted">
                          {new Date(evt.timestamp).toLocaleString('es-PE')}
                        </span>
                      </div>

                      <p className="text-xs text-upt-text-secondary leading-snug">
                        {evt.details}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-upt-border/60 text-[11px]">
                        <span className="text-upt-muted">
                          Actor: <strong className="text-upt-text">{evt.userName}</strong> ({evt.userRole})
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-upt-muted truncate max-w-sm" title={`SHA-256: ${evt.sha256Hash}`}>
                          <span>Hash:</span>
                          <span className="text-upt-primary truncate">{evt.sha256Hash}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Si no hay eventos específicos todavía para este ID recién creado */
                <div className="p-6 rounded-2xl bg-upt-bg/40 border border-upt-border text-center space-y-2">
                  <div className="font-semibold text-xs text-upt-text">
                    Registro de apertura formal en proceso de consolidación de bloque
                  </div>
                  <p className="text-xs text-upt-muted max-w-md mx-auto">
                    La creación formal de este expediente fue registrada en el almacén de auditoría con fecha {new Date(rfc.createdAt).toLocaleString()}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
