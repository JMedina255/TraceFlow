import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  ArrowLeft,
  Send,
  Paperclip,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  XCircle,
  Info,
  User,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useRfcStore } from '../../store/useRfcStore';
import { ecsService } from '../../services/ecs.service';
import type { Priority, ChangeCategory, SubsanarRfcDTO } from '../../types';

const SUGGESTED_ATTACHMENTS = [
  'evidencia_adicional_subsanacion.pdf',
  'analisis_cuantitativo_impacto_v2.xlsx',
  'acta_reunion_usuarios_2026.pdf',
  'captura_caso_borde_gateway.png',
];

export const RfcEditView: React.FC = () => {
  const { rfcId } = useParams<{ rfcId: string }>();
  const navigate = useNavigate();

  const { currentUser, activeRoleId, switchRole } = useAuthStore();
  const { activeProject, setActiveProject } = useProjectStore();
  const { getRfcById, subsanarRfc, dismissRfc } = useRfcStore();

  // Buscar el expediente
  const rfc = rfcId ? getRfcById(rfcId) : undefined;

  // Estado del formulario prellenado con los datos del RFC
  const [formData, setFormData] = useState<SubsanarRfcDTO>(() => ({
    title: rfc?.title || '',
    priority: rfc?.priority || 'MEDIA',
    category: rfc?.category || 'CORRECTIVO',
    description: rfc?.description || '',
    justification: rfc?.justification || '',
    proposedSolution: rfc?.proposedSolution || '',
    affectedEcsId: rfc?.affectedEcsId || '',
    attachments: rfc?.attachments || [],
    subsanacionResponseNotes: '',
  }));

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customAttachment, setCustomAttachment] = useState<string>('');

  // Modales
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawReason, setWithdrawReason] = useState<string>('');
  const [withdrawConfirm, setWithdrawConfirm] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // =========================================================================
  // CASO 1: EXPEDIENTE NO ENCONTRADO (404)
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
            La Solicitud de Cambio a subsanar no existe
          </h1>
          <p className="text-xs sm:text-sm text-upt-muted max-w-lg mx-auto">
            El identificador (<strong className="font-mono text-upt-text">{rfcId}</strong>) no se encuentra registrado en los repositorios de TraceFlow SCM.
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
  // CASO 2: AISLAMIENTO MULTITENANT DE PROYECTO
  // =========================================================================
  if (rfc.projectId !== activeProject.id) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-500 text-upt-text rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6 text-amber-950" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded border border-amber-300">
                Aislamiento Multitenant &bull; Proyecto Externo
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-amber-950 pt-1">
                Subsanación no permitida en sesión de proyecto distinta
              </h2>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed pt-1">
                La solicitud <strong>{rfc.code}</strong> pertenece al proyecto <strong>&quot;{rfc.projectName}&quot;</strong>. 
                Debe conmutar su sesión activa al proyecto correspondiente para acceder a la subsanación.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-200">
            <button
              type="button"
              onClick={() => setActiveProject(rfc.projectId)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <span>Conmutar al proyecto &quot;{rfc.projectName}&quot;</span>
            </button>
            <Link
              to={`/rfcs/${rfc.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver Expediente en Modo Lectura</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASO 3: VALIDACIÓN DE ESTADO (SOLO EN_SUBSANACION)
  // =========================================================================
  if (rfc.status !== 'EN_SUBSANACION') {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-100 text-upt-primary rounded-xl shrink-0 mt-0.5">
              <Info className="w-6 h-6 text-upt-primary" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-upt-primary bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                Estado Incompatible para Subsanación (CU-04.1)
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-upt-text pt-1">
                La solicitud {rfc.code} no se encuentra en estado &quot;EN_SUBSANACION&quot;
              </h2>
              <p className="text-xs sm:text-sm text-upt-text-secondary leading-relaxed pt-1">
                Esta solicitud se encuentra actualmente en estado <strong>{rfc.status}</strong>. Conforme al ciclo de vida normativo DG-11, únicamente las solicitudes observadas en estado <strong>EN_SUBSANACION</strong> admiten corrección y descargo formal.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-200">
            <Link
              to={`/rfcs/${rfc.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Abrir Expediente 360° ({rfc.code})</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASO 4: CONTROL RBAC / SEGREGACIÓN DE FUNCIONES (SoD) — EXCLUSIVO PU-01
  // =========================================================================
  const isAuthorizedRole = activeRoleId === 'PU-01';
  if (!isAuthorizedRole) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-red-100 text-upt-error rounded-xl shrink-0 mt-0.5">
              <Lock className="w-6 h-6 text-upt-error" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-red-900 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                Segregación de Funciones (SoD) &bull; CU-04.1
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-red-950 pt-1">
                Acceso Denegado: Subsanación Reservada al Solicitante (PU-01)
              </h2>
              <p className="text-xs sm:text-sm text-red-900 leading-relaxed pt-1">
                Conforme a la norma IEEE 828 y las reglas de negocio del SRS, la subsanación de una solicitud observada es atribución exclusiva del rol <strong>Solicitante (PU-01)</strong>. Su rol activo en este momento es <strong>{currentUser.roleLabel} ({activeRoleId})</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-red-200">
            {currentUser.allowedRoleIds.includes('PU-01') && (
              <button
                type="button"
                onClick={() => switchRole('PU-01')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Conmutar al rol Solicitante (PU-01)</span>
              </button>
            )}
            <Link
              to={`/rfcs/${rfc.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-red-100 text-red-900 text-xs font-semibold border border-red-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Expediente</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DATOS OPERATIVOS DEL FORMULARIO
  // =========================================================================
  const projectEcsList = ecsService.getAll(rfc.projectId);

  const handleInputChange = (field: keyof SubsanarRfcDTO, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAddAttachment = (fileName: string) => {
    if (!fileName.trim()) return;
    const trimmed = fileName.trim();
    const current = formData.attachments || [];
    if (!current.includes(trimmed)) {
      handleInputChange('attachments', [...current, trimmed]);
    }
    setCustomAttachment('');
  };

  const handleRemoveAttachment = (fileName: string) => {
    const current = formData.attachments || [];
    handleInputChange(
      'attachments',
      current.filter((a) => a !== fileName)
    );
  };

  // Validación local completa antes de enviar
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      errors.title = 'El título de la Solicitud de Cambio es obligatorio.';
    } else if (trimmedTitle.length < 5) {
      errors.title = 'El título debe tener al menos 5 caracteres descriptivos.';
    } else if (trimmedTitle.length > 120) {
      errors.title = 'El título no puede exceder los 120 caracteres.';
    }

    const trimmedDesc = formData.description.trim();
    if (!trimmedDesc) {
      errors.description = 'La descripción detallada del cambio es obligatoria.';
    } else if (trimmedDesc.length < 15) {
      errors.description = 'La descripción debe tener al menos 15 caracteres.';
    }

    const trimmedJust = formData.justification.trim();
    if (!trimmedJust) {
      errors.justification = 'La justificación de negocio es mandatoria (RN-01).';
    } else if (trimmedJust.length < 15) {
      errors.justification = 'La justificación debe contener al menos 15 caracteres de fundamentación.';
    }

    if (!formData.affectedEcsId) {
      errors.affectedEcsId = 'Debe seleccionar al menos un Elemento de Configuración (ECS) afectado.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Reingreso formal subsanado (EN_SUBSANACION -> REGISTRADA)
  const handleSubmitSubsanacion = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    try {
      subsanarRfc(rfc.id, formData, currentUser);
      setShowSuccessModal(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la subsanación.';
      setSubmitError(msg);
    }
  };

  // Desistimiento voluntario (CU-04.1 A1) (EN_SUBSANACION -> DESESTIMADA)
  const handleConfirmWithdraw = () => {
    setWithdrawError(null);
    const trimmedReason = withdrawReason.trim();
    if (!trimmedReason || trimmedReason.length < 10) {
      setWithdrawError('Debe ingresar un motivo de desistimiento descriptivo (al menos 10 caracteres).');
      return;
    }
    if (!withdrawConfirm) {
      setWithdrawError('Debe marcar la casilla de confirmación para cerrar definitivamente la solicitud.');
      return;
    }

    try {
      dismissRfc(rfc.id, `Desistimiento voluntario del solicitante: ${trimmedReason}`, currentUser);
      setShowWithdrawModal(false);
      navigate(`/rfcs/${rfc.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el desistimiento.';
      setWithdrawError(msg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Barra de Retorno y Metadatos */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to={`/rfcs/${rfc.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-upt-secondary hover:text-upt-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Expediente {rfc.code}</span>
        </Link>

        <div className="flex items-center gap-2 text-[11px] font-mono text-upt-muted">
          <span>Proceso: CU-04.1 &bull; WF-07 &bull; DG-11</span>
        </div>
      </div>

      {/* Cabecera Principal */}
      <div className="bg-upt-surface border border-upt-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-upt-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-extrabold px-2.5 py-0.5 rounded bg-blue-50 text-upt-primary border border-blue-200">
                {rfc.code}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>EN_SUBSANACION</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-upt-text pt-1">
              Subsanación y Descargo de Solicitud de Cambio (CU-04.1)
            </h1>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-upt-muted">
            <span className="block text-[11px]">Proyecto:</span>
            <span className="font-bold text-upt-text">{rfc.projectName}</span>
          </div>
        </div>

        {/* Panel Destacado: Pliego de Observaciones del Gestor */}
        <div className="bg-amber-50/80 border-2 border-amber-300 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <span>Pliego Formal de Observaciones formulado por el Gestor (CU-05)</span>
            </div>
            <span className="font-mono text-[11px] text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded border border-amber-300 shrink-0">
              Mandatorio Subsanar
            </span>
          </div>

          <div className="bg-white/95 p-3.5 rounded-lg border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed whitespace-pre-line shadow-2xs font-sans">
            {rfc.subsanacionNotes || 'Se requiere subsanar la justificación operativa y fundamentar la afectación técnica al componente seleccionado.'}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-amber-900 border-t border-amber-200/80 pt-2 font-mono">
            <span>Observado por Gestor: <strong>{rfc.observedBy || 'Analista de Requerimientos'}</strong></span>
            {rfc.observedAt && (
              <span>Fecha de Emisión: {new Date(rfc.observedAt).toLocaleString('es-PE')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Error de Envío */}
      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-upt-error text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold block">Error al procesar el reingreso:</strong>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {/* Formulario de Subsanación */}
      <form onSubmit={handleSubmitSubsanacion} className="space-y-6">
        {/* Bloque 1: Datos Generales */}
        <div className="bg-upt-surface border border-upt-border rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-upt-border pb-3">
            <h2 className="text-base font-bold text-upt-primary">
              1. Datos Generales de la Solicitud
            </h2>
            <p className="text-xs text-upt-muted">
              Modifique el título, prioridad o categoría según lo solicitado en el pliego de observaciones.
            </p>
          </div>

          <div className="space-y-4">
            {/* Título */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-semibold text-upt-text flex items-center justify-between">
                <span>Título Formal de la Solicitud *</span>
                <span className="font-mono text-[10px] text-upt-muted">5 - 120 caracteres</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.title
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-upt-border focus:ring-blue-100 focus:border-upt-primary'
                }`}
                placeholder="Título descriptivo del cambio"
              />
              {fieldErrors.title && (
                <p className="text-[11px] text-red-600 font-medium">{fieldErrors.title}</p>
              )}
            </div>

            {/* Prioridad y Categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="priority" className="text-xs font-semibold text-upt-text">
                  Prioridad Solicitada *
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as Priority)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-upt-border text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-upt-primary"
                >
                  <option value="BAJA">BAJA (Mantenimiento menor programado)</option>
                  <option value="MEDIA">MEDIA (Operación estándar ordinaria)</option>
                  <option value="ALTA">ALTA (Urgencia de negocio)</option>
                  <option value="CRITICA">CRÍTICA (Detención o riesgo de parada de servicio)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="category" className="text-xs font-semibold text-upt-text">
                  Categoría del Cambio *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value as ChangeCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-upt-border text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-upt-primary"
                >
                  <option value="CORRECTIVO">CORRECTIVO (Corrección de fallas o bugs)</option>
                  <option value="EVOLUTIVO">EVOLUTIVO (Nueva funcionalidad requerida)</option>
                  <option value="ADAPTATIVO">ADAPTATIVO (Cambio normativo, legal o de plataforma)</option>
                  <option value="PERFECTIVO">PERFECTIVO (Optimización técnica, refactor o rendimiento)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque 2: Sustento Operativo y Justificación */}
        <div className="bg-upt-surface border border-upt-border rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-upt-border pb-3">
            <h2 className="text-base font-bold text-upt-primary">
              2. Descripción y Justificación de Negocio Subsanadas
            </h2>
            <p className="text-xs text-upt-muted">
              Amplíe el nivel de detalle y fundamente el valor agregado para subsanar los puntos observados por el Gestor.
            </p>
          </div>

          <div className="space-y-4">
            {/* Descripción */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-semibold text-upt-text flex items-center justify-between">
                <span>Descripción Detallada del Requerimiento / Falla *</span>
                <span className="font-mono text-[10px] text-upt-muted">Mínimo 15 caracteres</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.description
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-upt-border focus:ring-blue-100 focus:border-upt-primary'
                }`}
                placeholder="Describa el comportamiento actual, la falla detectada o el alcance del requerimiento funcional..."
              />
              {fieldErrors.description && (
                <p className="text-[11px] text-red-600 font-medium">{fieldErrors.description}</p>
              )}
            </div>

            {/* Justificación de Negocio */}
            <div className="space-y-1.5">
              <label htmlFor="justification" className="text-xs font-semibold text-upt-text flex items-center justify-between">
                <span>Justificación Operativa / Valor Agregado (Mandatoria bajo RN-01) *</span>
                <span className="font-mono text-[10px] text-upt-muted">Mínimo 15 caracteres</span>
              </label>
              <textarea
                id="justification"
                rows={4}
                value={formData.justification}
                onChange={(e) => handleInputChange('justification', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.justification
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-upt-border focus:ring-blue-100 focus:border-upt-primary'
                }`}
                placeholder="Indique el impacto operacional si no se implementa el cambio, el retorno de inversión o la obligatoriedad legal/regulatoria..."
              />
              {fieldErrors.justification && (
                <p className="text-[11px] text-red-600 font-medium">{fieldErrors.justification}</p>
              )}
            </div>

            {/* Propuesta Técnica Sugerida */}
            <div className="space-y-1.5">
              <label htmlFor="proposedSolution" className="text-xs font-semibold text-upt-text flex items-center justify-between">
                <span>Propuesta Técnica Sugerida por el Solicitante (Opcional)</span>
                <span className="font-mono text-[10px] text-upt-muted">Orientativa</span>
              </label>
              <textarea
                id="proposedSolution"
                rows={2}
                value={formData.proposedSolution || ''}
                onChange={(e) => handleInputChange('proposedSolution', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-upt-border text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-upt-primary"
                placeholder="Si conoce la implementación técnica deseada, mencione módulos, APIs o configuraciones de referencia..."
              />
            </div>
          </div>
        </div>

        {/* Bloque 3: ECS Afectado y Evidencias */}
        <div className="bg-upt-surface border border-upt-border rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-upt-border pb-3">
            <h2 className="text-base font-bold text-upt-primary">
              3. Elemento de Configuración (ECS) y Evidencias
            </h2>
            <p className="text-xs text-upt-muted">
              Rectifique el ECS asociado o incorpore archivos probatorios que aclaren las observaciones.
            </p>
          </div>

          <div className="space-y-4">
            {/* Selección de ECS */}
            <div className="space-y-1.5">
              <label htmlFor="affectedEcsId" className="text-xs font-semibold text-upt-text">
                Elemento de Configuración de Software (ECS) Principal Afectado *
              </label>
              <select
                id="affectedEcsId"
                value={formData.affectedEcsId}
                onChange={(e) => handleInputChange('affectedEcsId', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.affectedEcsId
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-upt-border focus:ring-blue-100 focus:border-upt-primary'
                }`}
              >
                <option value="">-- Seleccione un ECS del catálogo --</option>
                {projectEcsList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name} ({item.type}) &bull; Versión {item.currentVersion}
                  </option>
                ))}
              </select>
              {fieldErrors.affectedEcsId && (
                <p className="text-[11px] text-red-600 font-medium">{fieldErrors.affectedEcsId}</p>
              )}
            </div>

            {/* Gestión de Adjuntos */}
            <div className="space-y-2 pt-2 border-t border-upt-border">
              <span className="text-xs font-semibold text-upt-text flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-upt-secondary" />
                Archivos y Documentación Probatoria de la Subsanación:
              </span>

              {formData.attachments && formData.attachments.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.attachments.map((file) => (
                    <span
                      key={file}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-upt-primary text-xs font-mono"
                    >
                      <span>{file}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file)}
                        className="p-0.5 text-upt-muted hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Eliminar adjunto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-upt-muted italic">No hay archivos adjuntos a la solicitud.</p>
              )}

              {/* Sugerencias y Campo Personalizado */}
              <div className="pt-2 space-y-2">
                <span className="text-[11px] text-upt-muted block">Archivos de sustento sugeridos para subsanación:</span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_ATTACHMENTS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddAttachment(sug)}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-upt-bg border border-upt-border text-upt-text hover:bg-blue-50 hover:text-upt-primary hover:border-blue-200 transition-colors cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customAttachment}
                    onChange={(e) => setCustomAttachment(e.target.value)}
                    placeholder="Nombre de archivo adicional (ej. evidencia_qa_2026.pdf)..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-upt-border text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAttachment(customAttachment);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddAttachment(customAttachment)}
                    disabled={!customAttachment.trim()}
                    className="px-3 py-1.5 rounded-xl bg-upt-bg hover:bg-blue-50 text-upt-primary border border-upt-border text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque 4: Descargo Formal y Notas de Subsanación */}
        <div className="bg-upt-surface border-2 border-blue-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-upt-border pb-3">
            <h2 className="text-base font-bold text-upt-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-upt-secondary" />
              <span>4. Notas de Descargo Formal y Explicación de Cambios</span>
            </h2>
            <p className="text-xs text-upt-muted">
              Explique concisamente al Gestor cómo resolvió cada uno de los puntos formulados en el pliego de observaciones.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="subsanacionResponseNotes" className="text-xs font-semibold text-upt-text">
              Resumen de Descargo para el Gestor:
            </label>
            <textarea
              id="subsanacionResponseNotes"
              rows={3}
              value={formData.subsanacionResponseNotes || ''}
              onChange={(e) => handleInputChange('subsanacionResponseNotes', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-upt-border text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-upt-primary"
              placeholder="Ejemplo: Se amplió la justificación cuantitativa con datos de transacciones de octubre y se adjuntó el informe técnico oficial de la pasarela..."
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          {/* Desistir de la Solicitud (CU-04.1 A1) */}
          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-red-50 text-upt-error border border-red-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Desistir de la Solicitud (Cierre Voluntario)</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to={`/rfcs/${rfc.id}`}
              className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-upt-bg hover:bg-upt-border text-upt-text text-xs font-semibold border border-upt-border transition-colors cursor-pointer"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Reingresar Solicitud Subsanada</span>
            </button>
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* MODAL 1: DESISTIMIENTO VOLUNTARIO (CU-04.1 A1) */}
      {/* ========================================================================= */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-red-100 text-upt-error rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-upt-error" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-red-950">
                  Confirmar Desistimiento de la Solicitud (CU-04.1 A1)
                </h3>
                <p className="text-xs text-red-800 leading-relaxed">
                  El desistimiento cerrará formalmente la solicitud <strong>{rfc.code}</strong> transicionándola al estado terminal <strong>DESESTIMADA</strong> bajo la regla RN-07. Esta acción es irrevocable.
                </p>
              </div>
            </div>

            {withdrawError && (
              <div className="p-3 bg-red-50 border border-red-200 text-upt-error text-xs rounded-xl">
                {withdrawError}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="withdrawReason" className="text-xs font-semibold text-upt-text">
                Fundamentación Mandatoria de Desistimiento:
              </label>
              <textarea
                id="withdrawReason"
                rows={3}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Indique los motivos por los cuales desiste de continuar con este cambio..."
                className="w-full px-3 py-2 rounded-xl border border-upt-border text-xs focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-upt-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={withdrawConfirm}
                onChange={(e) => setWithdrawConfirm(e.target.checked)}
                className="mt-0.5 rounded border-upt-border text-upt-institutional focus:ring-upt-bright cursor-pointer"
              />
              <span>
                Confirmo que deseo desistir y que el expediente sea archivado en estado terminal <strong>DESESTIMADA</strong>.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-upt-border">
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawError(null);
                }}
                className="px-4 py-2 rounded-xl bg-upt-bg hover:bg-upt-border text-upt-text text-xs font-semibold cursor-pointer"
              >
                Volver al Formulario
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Desistimiento Definitivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRMACIÓN DE REINGRESO EXITOSO */}
      {/* ========================================================================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                Transición Exitosa: EN_SUBSANACION &rarr; REGISTRADA
              </span>
              <h3 className="text-lg font-bold text-emerald-950 pt-1">
                Solicitud Reingresada Satisfactoriamente
              </h3>
              <p className="text-xs text-emerald-900 leading-relaxed">
                El expediente <strong>{rfc.code}</strong> ha retornado formalmente al estado <strong>REGISTRADA</strong> conforme a la máquina de estados DG-11. El Gestor (PU-02) evaluará los descargos y datos subsanados.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate(`/rfcs/${rfc.id}`)}
                className="w-full px-5 py-2.5 rounded-xl bg-upt-institutional hover:bg-upt-primary text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Ir al Expediente 360°
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
