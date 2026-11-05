import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  UserCheck,
  Layers,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { rfcService } from '../../services/rfc.service';
import { minorApprovalService } from '../../services/minorApproval.service';
import type {
  RFC,
  ApprovalDecision,
  DelegatedMinorApproval,
} from '../../types';

export const RfcMinorApprovalView: React.FC = () => {
  const { rfcId } = useParams<{ rfcId: string }>();
  const navigate = useNavigate();
  const { currentUser, activeRoleId } = useAuthStore();

  // Lazy initialization of state to prevent cascading renders
  const [rfc, setRfc] = useState<RFC | null>(() => {
    return rfcId ? rfcService.getById(rfcId) || null : null;
  });

  const [delegatedStatus, setDelegatedStatus] = useState<DelegatedMinorApproval | null>(() => {
    return rfcId ? minorApprovalService.getDelegatedStatus(rfcId) : null;
  });

  const [decision, setDecision] = useState<ApprovalDecision>('APROBADO');
  const [justification, setJustification] = useState<string>('');
  const [escalateToCcb, setEscalateToCcb] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!rfc) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Expediente de Solicitud no encontrado</span>
          </div>
          <p className="text-xs">No se encontró ninguna solicitud de cambio con el identificador '{rfcId}'.</p>
        </div>
        <Link
          to="/rfcs"
          className="inline-flex items-center gap-2 text-xs font-semibold text-upt-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a la Bandeja de Solicitudes
        </Link>
      </div>
    );
  }

  // Precondiciones y verificaciones de seguridad
  const isProjectAuthorized = currentUser && currentUser.assignedProjectIds?.includes(rfc.projectId);
  const isOriginalRequester = currentUser && rfc.requesterId === currentUser.id;
  const isStatusValid = rfc.status === 'EN_EVALUACION';
  const isClassificationValid = rfc.classification === 'CAMBIO_MENOR';
  const hasImpactReport = Boolean(rfc.impactAnalysisId || rfc.technicalImpact);

  // Rol activo y elegibilidad
  const isGestor = activeRoleId === 'PU-02';
  const isArchitect = activeRoleId === 'PU-03';
  const isAuthorizedRole = isGestor || isArchitect;

  const currentRoleName = isGestor ? 'Gestión' : isArchitect ? 'Arquitectura' : null;
  const myExistingApproval = isGestor
    ? delegatedStatus?.gestorApproval
    : isArchitect
    ? delegatedStatus?.architectApproval
    : null;

  const otherApproval = isGestor
    ? delegatedStatus?.architectApproval
    : isArchitect
    ? delegatedStatus?.gestorApproval
    : null;

  // Control Adicional de Seguridad: Segregación por Identidad (distinto usuario para la otra llave)
  const isSameUserAsOtherApproval = otherApproval && currentUser && otherApproval.userId === currentUser.id;

  const canSubmitApproval =
    isAuthorizedRole &&
    isStatusValid &&
    isClassificationValid &&
    hasImpactReport &&
    isProjectAuthorized &&
    !isOriginalRequester &&
    !myExistingApproval &&
    !isSameUserAsOtherApproval &&
    delegatedStatus?.overallStatus !== 'AUTORIZADA' &&
    delegatedStatus?.overallStatus !== 'RECHAZADA' &&
    delegatedStatus?.overallStatus !== 'REESCALADA_CCB';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser) {
      setFormError('Sesión de usuario no válida.');
      return;
    }

    const trimmed = justification.trim();
    if (!trimmed || trimmed.length < 10) {
      setFormError('La fundamentación es obligatoria y debe tener al menos 10 caracteres.');
      return;
    }

    try {
      setSubmitting(true);
      const result = minorApprovalService.registerApproval(
        {
          rfcId: rfc.id,
          decision,
          justification: trimmed,
          escalateToCcb: decision === 'RECHAZADO' && escalateToCcb,
        },
        currentUser
      );

      setRfc(result.updatedRfc);
      setDelegatedStatus(result.delegatedStatus);
      setSuccessMessage(
        decision === 'APROBADO'
          ? result.updatedRfc.status === 'AUTORIZADA'
            ? '¡Autorización completa! Ambas llaves han sido emitidas favorablemente. El expediente transicionó a AUTORIZADA.'
            : 'Conformidad registrada con éxito. El expediente permanece en evaluación a la espera de la segunda llave.'
          : escalateToCcb
          ? 'Expediente reescalado formalmente a Cambio Mayor para deliberación colegiada en el Comité de Control de Cambios.'
          : 'Dictamen denegatorio registrado. El expediente ha sido cerrado en estado RECHAZADA.'
      );
      setSubmitting(false);
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error.message || 'Error al registrar la autorización.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Cabecera y Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-upt-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-upt-muted mb-1">
            <Link to="/rfcs" className="hover:text-upt-primary">Bandeja de Solicitudes</Link>
            <span>/</span>
            <Link to={`/rfcs/${rfc.id}`} className="hover:text-upt-primary font-mono">{rfc.code}</Link>
            <span>/</span>
            <span className="text-upt-primary font-semibold">Autorización Delegada</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-upt-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-upt-secondary" />
            Autorización Delegada de Cambio Menor
          </h1>
          <p className="text-xs text-upt-muted mt-0.5">
            Mecanismo de Doble Llave Operativa para aprobación concurrente entre Gestión y Arquitectura.
          </p>
        </div>

        <Link
          to={`/rfcs/${rfc.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-upt-border text-xs font-medium text-upt-text hover:bg-upt-bg transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Expediente
        </Link>
      </div>

      {/* BLOQUEO: Aislamiento Multitenant */}
      {!isProjectAuthorized && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Lock className="w-5 h-5 text-amber-700" />
            <span>Acceso Denegado por Aislamiento de Proyecto</span>
          </div>
          <p className="text-xs leading-relaxed">
            Su cuenta no cuenta con asignación al proyecto <strong>{rfc.projectName}</strong> ({rfc.projectId}).
            No tiene autorización para evaluar o autorizar expedientes de proyectos ajenos.
          </p>
        </div>
      )}

      {/* BLOQUEO: Antiautoevaluación SoD */}
      {isOriginalRequester && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-700" />
            <span>Incompatibilidad Normativa por Segregación de Funciones</span>
          </div>
          <p className="text-xs leading-relaxed">
            Usted figura como el <strong>Solicitante original</strong> ({rfc.requesterName}) de esta solicitud de cambio.
            Por políticas estrictas de segregación de funciones, quien origina un requerimiento tiene prohibido autorizar
            su propia solicitud, aun cuando opere bajo el perfil de Gestión o Arquitectura.
          </p>
        </div>
      )}

      {/* BLOQUEO: Clasificación Inválida */}
      {!isClassificationValid && (
        <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Layers className="w-5 h-5 text-purple-700" />
            <span>Procedimiento No Aplicable (Cambio Mayor)</span>
          </div>
          <p className="text-xs leading-relaxed">
            Esta solicitud se encuentra clasificada como <strong>{rfc.classification || 'SIN_CLASIFICAR'}</strong>.
            La autorización delegada aplica exclusivamente a solicitudes dictaminadas como Cambio Menor.
            Los cambios mayores requieren resolución colegiada del Comité de Control de Cambios (CCB).
          </p>
        </div>
      )}

      {/* BLOQUEO: Estado no es EN_EVALUACION */}
      {!isStatusValid && (
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Clock className="w-5 h-5 text-blue-700" />
            <span>Expediente no disponible para resolución delegada</span>
          </div>
          <p className="text-xs leading-relaxed">
            El expediente se encuentra actualmente en estado <strong>{rfc.status}</strong>. Solo las solicitudes
            en estado <strong>EN_EVALUACION</strong> con informe técnico congelado pueden ser resueltas por la Autoridad Delegada.
          </p>
        </div>
      )}

      {/* Contexto del Requerimiento Original y Resumen Técnico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Ficha General de la RFC */}
        <div className="p-5 rounded-2xl bg-white border border-upt-border shadow-xs space-y-3 md:col-span-1">
          <div className="border-b border-upt-border pb-2.5">
            <span className="text-[10px] font-mono text-upt-muted uppercase block">Solicitud de Cambio:</span>
            <span className="font-bold text-sm text-upt-primary font-mono">{rfc.code}</span>
            <div className="text-xs font-semibold text-upt-text mt-1">{rfc.title}</div>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-upt-muted block text-[11px]">Proyecto:</span>
              <span className="font-medium text-upt-text">{rfc.projectName}</span>
            </div>
            <div>
              <span className="text-upt-muted block text-[11px]">Solicitante:</span>
              <span className="font-medium text-upt-text">{rfc.requesterName}</span>
            </div>
            <div>
              <span className="text-upt-muted block text-[11px]">Clasificación:</span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                Cambio Menor
              </span>
            </div>
            <div>
              <span className="text-upt-muted block text-[11px]">Estado Actual:</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded inline-block mt-0.5">
                {rfc.status}
              </span>
            </div>
          </div>
        </div>

        {/* Resumen del Informe Técnico de Impacto */}
        <div className="p-5 rounded-2xl bg-white border border-upt-border shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-b border-upt-border pb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-upt-secondary" />
              <span className="font-bold text-xs uppercase tracking-wider text-upt-primary">
                Informe Técnico de Impacto de Respaldo
              </span>
            </div>
            {rfc.technicalImpact?.reportDate && (
              <span className="text-[11px] font-mono text-upt-muted">
                Emitido: {new Date(rfc.technicalImpact.reportDate).toLocaleDateString('es-PE')}
              </span>
            )}
          </div>

          {rfc.technicalImpact ? (
            <div className="space-y-3 text-xs">
              <p className="text-upt-text-secondary bg-upt-bg p-3 rounded-xl border border-upt-border leading-relaxed">
                {rfc.technicalImpact.architectureImpactDescription}
              </p>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-upt-muted text-[10px] block">Esfuerzo:</span>
                  <span className="font-bold text-upt-primary font-mono text-xs">
                    {rfc.technicalImpact.estimatedEffortHours} hrs
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-upt-muted text-[10px] block">Presupuesto:</span>
                  <span className="font-bold text-upt-primary font-mono text-xs">
                    S/. {rfc.technicalImpact.estimatedCost.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-upt-muted text-[10px] block">Cronograma:</span>
                  <span className="font-bold text-upt-primary font-mono text-xs">
                    {rfc.technicalImpact.estimatedDurationDays} días
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-upt-muted">Evaluador Técnico:</span>
                  <span className="font-semibold text-upt-text">{rfc.technicalImpact.architectName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-upt-muted">Riesgo Evaluado:</span>
                  <span className="font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {rfc.technicalImpact.technicalRisk}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 text-amber-900 text-xs">
              No se encontró informe técnico adjunto.
            </div>
          )}
        </div>
      </div>

      {/* ESTADO DE LAS DOS CONFORMIDADES (Doble Llave) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-upt-primary uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-upt-secondary" />
          Estado de la Doble Llave Operativa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Tarjeta 1: Conformidad de Gestión */}
          <div
            className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
              delegatedStatus?.gestorApproval
                ? delegatedStatus.gestorApproval.decision === 'APROBADO'
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-red-400 bg-red-50/50'
                : 'border-dashed border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between border-b border-upt-border pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-upt-primary">
                  1. Llave de Gestión
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  PU-02 Gestor
                </span>
              </div>
              {delegatedStatus?.gestorApproval ? (
                delegatedStatus.gestorApproval.decision === 'APROBADO' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3.5 h-3.5" /> Rechazado
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> Pendiente
                </span>
              )}
            </div>

            {delegatedStatus?.gestorApproval ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-upt-muted text-[11px] block">Evaluador Responsable:</span>
                  <span className="font-semibold text-upt-text">
                    {delegatedStatus.gestorApproval.userName}
                  </span>
                </div>
                <div>
                  <span className="text-upt-muted text-[11px] block">Fecha y Hora:</span>
                  <span className="font-mono text-[11px] text-upt-text">
                    {new Date(delegatedStatus.gestorApproval.decidedAt).toLocaleString('es-PE')}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-upt-muted text-[11px] block">Fundamentación de Gestión:</span>
                  <p className="text-upt-text-secondary bg-white p-2.5 rounded-xl border border-upt-border leading-relaxed italic">
                    "{delegatedStatus.gestorApproval.justification}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-1 text-xs text-upt-muted">
                <Clock className="w-6 h-6 mx-auto text-amber-500 opacity-60" />
                <p>Pendiente de visto bueno por el Analista de Requerimientos / Gestor.</p>
              </div>
            )}
          </div>

          {/* Tarjeta 2: Conformidad de Arquitectura */}
          <div
            className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
              delegatedStatus?.architectApproval
                ? delegatedStatus.architectApproval.decision === 'APROBADO'
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-red-400 bg-red-50/50'
                : 'border-dashed border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between border-b border-upt-border pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-upt-primary">
                  2. Llave de Arquitectura
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  PU-03 Arquitecto
                </span>
              </div>
              {delegatedStatus?.architectApproval ? (
                delegatedStatus.architectApproval.decision === 'APROBADO' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3.5 h-3.5" /> Rechazado
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" /> Pendiente
                </span>
              )}
            </div>

            {delegatedStatus?.architectApproval ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-upt-muted text-[11px] block">Evaluador Responsable:</span>
                  <span className="font-semibold text-upt-text">
                    {delegatedStatus.architectApproval.userName}
                  </span>
                </div>
                <div>
                  <span className="text-upt-muted text-[11px] block">Fecha y Hora:</span>
                  <span className="font-mono text-[11px] text-upt-text">
                    {new Date(delegatedStatus.architectApproval.decidedAt).toLocaleString('es-PE')}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-upt-muted text-[11px] block">Fundamentación Técnica:</span>
                  <p className="text-upt-text-secondary bg-white p-2.5 rounded-xl border border-upt-border leading-relaxed italic">
                    "{delegatedStatus.architectApproval.justification}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-1 text-xs text-upt-muted">
                <Clock className="w-6 h-6 mx-auto text-amber-500 opacity-60" />
                <p>Pendiente de visto bueno por el Arquitecto / Especialista Técnico.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Segregación por Identidad */}
      {isSameUserAsOtherApproval && !myExistingApproval && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Segregación por Identidad Requerida:</span>
            <p className="leading-relaxed">
              Su cuenta (<strong>{currentUser?.fullName}</strong>) ya suscribió la conformidad previa como{' '}
              <strong>{otherApproval?.role}</strong>. Para garantizar la independencia de la Doble Llave, la segunda
              conformidad debe ser suscrita por otro especialista con credencial autorizada.
            </p>
          </div>
        </div>
      )}

      {/* Banner de Éxito */}
      {successMessage && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-sm block">Transacción Registrada Formalmente</span>
              <p className="leading-relaxed">{successMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(`/rfcs/${rfc.id}`)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Ver Expediente Actualizado
            </button>
            <button
              type="button"
              onClick={() => navigate('/rfcs')}
              className="px-4 py-2 rounded-xl border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Ir a Bandeja de Solicitudes
            </button>
          </div>
        </div>
      )}

      {/* FORMULARIO DE EMISIÓN DE DICTAMEN (Solo si está habilitado) */}
      {canSubmitApproval && !successMessage && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white border border-upt-border shadow-xs space-y-5">
          <div className="border-b border-upt-border pb-3">
            <h3 className="text-sm font-bold text-upt-primary uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-upt-secondary" />
              Emisión de Conformidad de {currentRoleName}
            </h3>
            <p className="text-xs text-upt-muted mt-0.5">
              Usted opera bajo el perfil de <strong>{currentUser?.fullName}</strong> ({currentUser?.roleLabel}).
            </p>
          </div>

          {/* Opciones de Decisión */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-upt-text block">Decisión del Dictamen: *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  decision === 'APROBADO'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                    : 'border-upt-border hover:bg-slate-50 text-upt-text'
                }`}
              >
                <input
                  type="radio"
                  name="approvalDecision"
                  value="APROBADO"
                  checked={decision === 'APROBADO'}
                  onChange={() => setDecision('APROBADO')}
                />
                <div className="text-xs">
                  <div>OTORGAR VISTO BUENO (APROBADO)</div>
                  <div className="text-[10px] text-emerald-700 font-normal">
                    Conformidad favorable con la ejecución del cambio.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  decision === 'RECHAZADO'
                    ? 'border-red-500 bg-red-50/70 text-red-950 font-bold shadow-xs'
                    : 'border-upt-border hover:bg-slate-50 text-upt-text'
                }`}
              >
                <input
                  type="radio"
                  name="approvalDecision"
                  value="RECHAZADO"
                  checked={decision === 'RECHAZADO'}
                  onChange={() => setDecision('RECHAZADO')}
                />
                <div className="text-xs">
                  <div>DENEGAR CONFORMIDAD (RECHAZADO)</div>
                  <div className="text-[10px] text-red-700 font-normal">
                    Rechazar el cambio o solicitar reescalamiento formal.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Opción de Reescalamiento a CCB si es Rechazado */}
          {decision === 'RECHAZADO' && (
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs space-y-2 animate-in fade-in">
              <label className="flex items-start gap-2.5 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={escalateToCcb}
                  onChange={(e) => setEscalateToCcb(e.target.checked)}
                  className="rounded text-purple-700 mt-0.5"
                />
                <div>
                  <span className="block">Reescalar expediente al Comité de Control de Cambios (CCB)</span>
                  <span className="text-[11px] font-normal text-purple-800 leading-relaxed block mt-0.5">
                    Marque esta casilla si la causal de denegación obedece a que el requerimiento excede los umbrales
                    de un Cambio Menor y amerita ser reclasificado formalmente como Cambio Mayor para resolución colegiada.
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Campo de Fundamentación */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-upt-text">
                Fundamentación del Dictamen: *
              </label>
              <span className={`text-[11px] font-mono ${justification.length < 10 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {justification.length}/10 caracteres mínimos
              </span>
            </div>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique las consideraciones de negocio o técnicas que justifican su decisión..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-upt-border text-xs text-upt-text focus:outline-hidden focus:ring-2 focus:ring-upt-primary leading-relaxed"
              required
            />
          </div>

          {/* Errores del formulario */}
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Barra de Acciones */}
          <div className="pt-3 border-t border-upt-border flex items-center justify-between gap-3">
            <Link
              to={`/rfcs/${rfc.id}`}
              className="px-4 py-2 rounded-xl border border-upt-border text-xs font-semibold text-upt-muted hover:text-upt-text hover:bg-upt-bg transition-colors"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                decision === 'APROBADO'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {decision === 'APROBADO' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Registrando...' : 'Emitir Visto Bueno de Conformidad'}</span>
                </>
              ) : escalateToCcb ? (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{submitting ? 'Reescalando...' : 'Reescalar Expediente a CCB'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>{submitting ? 'Rechazando...' : 'Emitir Dictamen Denegatorio'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
