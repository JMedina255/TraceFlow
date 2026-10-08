import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  X,
  FileCode2,
  Lock,
  Layers,
  Paperclip,
  Trash2,
  Check,
  Building2,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useRfcStore } from '../../store/useRfcStore';
import { ecsService } from '../../services/ecs.service';
import { rfcService } from '../../services/rfc.service';
import type { ECS, Priority, ChangeCategory, RFC } from '../../types';

interface FormData {
  projectId: string;
  title: string;
  priority: Priority;
  category: ChangeCategory;
  description: string;
  justification: string;
  proposedSolution: string;
  affectedEcsId: string;
  attachments: string[];
  termsAccepted: boolean;
}

const INITIAL_FORM: FormData = {
  projectId: '',
  title: '',
  priority: 'MEDIA',
  category: 'CORRECTIVO',
  description: '',
  justification: '',
  proposedSolution: '',
  affectedEcsId: '',
  attachments: [],
  termsAccepted: false,
};

const SUGGESTED_ATTACHMENTS = [
  'reporte_incidencia_sunat.pdf',
  'log_fallo_transaccion_202610.txt',
  'especificacion_pci_dss_v4.pdf',
  'captura_error_gateway_504.png',
];

export const RfcCreateView: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, activeRoleId, switchRole, switchUser } = useAuthStore();
  const { activeProject, projects, setActiveProject } = useProjectStore();
  const { createRfc } = useRfcStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(() => ({
    ...INITIAL_FORM,
    projectId: activeProject.id,
  }));
  const [prevActiveProjectId, setPrevActiveProjectId] = useState<string>(activeProject.id);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdRfc, setCreatedRfc] = useState<RFC | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [draftSavedToast, setDraftSavedToast] = useState<boolean>(false);
  const [customAttachment, setCustomAttachment] = useState<string>('');

  // Sincronizar projectId si el proyecto activo cambia externamente desde el Topbar
  if (activeProject.id !== prevActiveProjectId) {
    setPrevActiveProjectId(activeProject.id);
    setFormData((prev) => ({
      ...prev,
      projectId: activeProject.id,
      affectedEcsId: '',
    }));
  }


  // Obtener ECS del proyecto seleccionado
  const projectEcsList = ecsService.getAll(formData.projectId || activeProject.id);

  // Previsualización del código correlativo unívoco siguiente
  const nextRfcCodePreview = rfcService.generateNextRfcCode();

  // Validación de autorización RBAC (Exclusivo Solicitante PU-01)
  const isAuthorized = activeRoleId === 'PU-01';

  // Manejar cambio en inputs
  const handleInputChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Cambio de proyecto desde el formulario
  const handleProjectSelect = (projId: string) => {
    setActiveProject(projId);
    setFormData((prev) => ({
      ...prev,
      projectId: projId,
      affectedEcsId: '', // Resetear ECS al cambiar proyecto
    }));
  };

  // Validaciones por paso según SRS (CU-04 / RF-04 / Excepciones E1 y E2)
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.projectId) {
        errors.projectId = 'Debe seleccionar un proyecto válido.';
      }
      const trimmedTitle = formData.title.trim();
      if (!trimmedTitle) {
        errors.title = 'El título de la Solicitud de Cambio es mandatorio.';
      } else if (trimmedTitle.length < 5) {
        errors.title = 'El título debe tener al menos 5 caracteres descriptivos.';
      } else if (trimmedTitle.length > 120) {
        errors.title = 'El título no puede exceder los 120 caracteres.';
      }
    }

    if (step === 2) {
      const trimmedDesc = formData.description.trim();
      if (!trimmedDesc) {
        errors.description = 'La descripción del requerimiento o falla es obligatoria.';
      } else if (trimmedDesc.length < 15) {
        errors.description = 'La descripción debe tener al menos 15 caracteres para ser sustantiva.';
      }

      const trimmedJust = formData.justification.trim();
      if (!trimmedJust) {
        errors.justification = 'La justificación de negocio es obligatoria (Excepción E1 del SRS).';
      } else if (trimmedJust.length < 15) {
        errors.justification = 'La justificación debe contener al menos 15 caracteres de fundamentación.';
      }
    }

    if (step === 3) {
      if (!formData.affectedEcsId) {
        errors.affectedEcsId = 'Debe seleccionar al menos un Elemento de Configuración (ECS) afectado.';
      }
    }

    if (step === 4) {
      if (!formData.termsAccepted) {
        errors.termsAccepted = 'Debe aceptar la declaración de veracidad institucional para proceder.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Guardar borrador local
  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        `traceflow_draft_rfc_${formData.projectId}`,
        JSON.stringify({ ...formData, savedAt: new Date().toISOString() })
      );
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 3000);
    } catch {
      // Ignorar errores de localStorage en modo borrador
    }
  };

  // Gestión de adjuntos simulados
  const handleAddAttachment = (fileName: string) => {
    if (!fileName.trim()) return;
    if (!formData.attachments.includes(fileName.trim())) {
      handleInputChange('attachments', [...formData.attachments, fileName.trim()]);
    }
    setCustomAttachment('');
  };

  const handleRemoveAttachment = (fileName: string) => {
    handleInputChange(
      'attachments',
      formData.attachments.filter((a) => a !== fileName)
    );
  };

  // Envío formal de la RFC
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validación completa
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    try {
      const created = createRfc(
        {
          projectId: formData.projectId,
          title: formData.title,
          description: formData.description,
          justification: formData.justification,
          proposedSolution: formData.proposedSolution,
          priority: formData.priority,
          category: formData.category,
          affectedEcsId: formData.affectedEcsId,
          attachments: formData.attachments,
        },
        currentUser
      );

      // Limpiar borrador si existía
      localStorage.removeItem(`traceflow_draft_rfc_${formData.projectId}`);

      setCreatedRfc(created);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el registro de la RFC.';
      setSubmitError(msg);
    }
  };

  const handleResetForm = () => {
    setFormData({
      ...INITIAL_FORM,
      projectId: activeProject.id,
    });
    setCreatedRfc(null);
    setCurrentStep(1);
    setFieldErrors({});
    setSubmitError(null);
  };

  const selectedEcs = projectEcsList.find((e) => e.id === formData.affectedEcsId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Toast de Guardado de Borrador */}
      {draftSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-950 border border-emerald-600 text-emerald-200 px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-medium">Borrador guardado exitosamente en este navegador.</span>
        </div>
      )}

      {/* Encabezado Principal y Badges Normativos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
              CU-04 / RF-04
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
              SCREEN-07 / WF-07
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
              Patrón PRES-06
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80">
              Correlativo Proyectado: {nextRfcCodePreview}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Registro de Solicitud de Cambio (RFC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Formalización de necesidad de cambio sobre Elementos de Configuración de Software (ECS) del proyecto. 
            El envío transiciona automáticamente al estado inicial oficial <strong className="text-slate-200">REGISTRADA</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
            <span>Cancelar</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Guardar Borrador</span>
          </button>
        </div>
      </div>

      {/* Alerta de Segregación de Funciones (SoD) si el rol NO es Solicitante PU-01 */}
      {!isAuthorized && (
        <div className="bg-amber-950/30 border border-amber-600/50 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-amber-200">
                Restricción de Segregación de Funciones (SoD / RBAC)
              </h2>
              <p className="text-xs text-amber-300/90 leading-relaxed">
                El caso de uso <strong className="text-white">CU-04: Registrar Solicitud de Cambio</strong> está reservado exclusivamente al rol{' '}
                <strong className="text-white">Solicitante (PU-01)</strong> conforme a la gobernanza oficial de TraceFlow SCM (FD03 §TB-09 / DG-05). 
                Actualmente estás operando como <strong className="text-white">{currentUser.fullName}</strong> con el rol{' '}
                <strong className="text-white">{currentUser.roleLabel} ({activeRoleId})</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-amber-800/40">
            {currentUser.allowedRoleIds.includes('PU-01') ? (
              <button
                type="button"
                onClick={() => switchRole('PU-01')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Asumir mi Rol Solicitante (PU-01)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  // Cambiar a Joan Medina con PU-01
                  switchUser('USR-001');
                  switchRole('PU-01');
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Cambiar a Usuario Demo con Rol Solicitante (PU-01)</span>
              </button>
            )}
            <span className="text-[11px] text-amber-400/80">
              * El servicio y el formulario bloquearán el envío hasta que actives el rol Solicitante.
            </span>
          </div>
        </div>
      )}

      {/* Barra de Progreso del Wizard (Paso 1 a 4) - PRES-06 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { step: 1, label: '1. Información General', desc: 'Proyecto, Título y Criticidad' },
            { step: 2, label: '2. Justificación y Alcance', desc: 'Descripción y Valor de Negocio' },
            { step: 3, label: '3. ECS y Evidencias', desc: 'Catálogo ECS y Adjuntos' },
            { step: 4, label: '4. Revisión y Envío', desc: 'Ficha Resumen y Términos' },
          ].map((item) => {
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div
                key={item.step}
                onClick={() => {
                  if (item.step < currentStep) setCurrentStep(item.step);
                }}
                className={`p-3 rounded-xl border transition-all text-left ${
                  isCurrent
                    ? 'bg-indigo-950/60 border-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/20'
                    : isDone
                    ? 'bg-slate-900/80 border-slate-700/80 text-slate-300 cursor-pointer hover:bg-slate-800/50'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500 cursor-not-allowed opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : item.step}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Paso {item.step}/4
                  </span>
                </div>
                <div className="text-xs font-semibold truncate">{item.label}</div>
                <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mensaje de Error de Envío General */}
      {submitError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-700/60 text-red-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-300">No se pudo procesar la Solicitud de Cambio</div>
            <div>{submitError}</div>
          </div>
        </div>
      )}

      {/* Contenedor del Formulario Activo */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* ========================================================================= */}
        {/* PASO 1: INFORMACIÓN GENERAL */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Paso 1: Información General de la Solicitud
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Indica el proyecto asignado, el título conciso del requerimiento y su categorización inicial.
              </p>
            </div>

            {/* Selector de Proyecto */}
            <div className="space-y-2">
              <label htmlFor="project-select" className="block text-xs font-semibold text-slate-300">
                Proyecto de Software Asignado <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {projects.map((proj) => {
                  const isSelected = (formData.projectId || activeProject.id) === proj.id;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => handleProjectSelect(proj.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/20'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-indigo-400">{proj.code}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <div className="text-xs font-semibold text-white truncate">{proj.name}</div>
                      <div className="text-[11px] text-slate-500 mt-1">Cliente: {proj.client}</div>
                    </div>
                  );
                })}
              </div>
              {fieldErrors.projectId && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.projectId}</p>
              )}
            </div>

            {/* Título de la RFC */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="rfc-title" className="block text-xs font-semibold text-slate-300">
                  Título de la Solicitud de Cambio <span className="text-red-400">*</span>
                </label>
                <span className={`text-[11px] font-mono ${formData.title.length > 120 ? 'text-red-400' : 'text-slate-500'}`}>
                  {formData.title.length}/120 caracteres
                </span>
              </div>
              <input
                id="rfc-title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ej. Actualización del protocolo de handshake TLS 1.3 en el gateway de pagos..."
                className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  fieldErrors.title ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-800'
                }`}
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-400">{fieldErrors.title}</p>
              )}
            </div>

            {/* Fila: Prioridad y Categoría de Cambio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Prioridad Propuesta */}
              <div className="space-y-2">
                <label htmlFor="priority-select" className="block text-xs font-semibold text-slate-300">
                  Prioridad Propuesta por el Solicitante <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'BAJA', label: 'Baja', color: 'border-slate-700 text-slate-300' },
                    { value: 'MEDIA', label: 'Media', color: 'border-blue-700/60 text-blue-300' },
                    { value: 'ALTA', label: 'Alta', color: 'border-amber-700/60 text-amber-300' },
                    { value: 'CRITICA', label: 'Crítica / Urgente', color: 'border-red-700/60 text-red-300' },
                  ].map((p) => {
                    const isSelected = formData.priority === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handleInputChange('priority', p.value)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm font-semibold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categoría de Cambio */}
              <div className="space-y-2">
                <label htmlFor="category-select" className="block text-xs font-semibold text-slate-300">
                  Categoría de Cambio <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'CORRECTIVO', label: 'Correctivo', desc: 'Falla o defecto' },
                    { value: 'ADAPTATIVO', label: 'Adaptativo', desc: 'Regulación / entorno' },
                    { value: 'PERFECTIVO', label: 'Perfectivo', desc: 'Mejora o rapidez' },
                  ].map((c) => {
                    const isSelected = formData.category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleInputChange('category', c.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm font-semibold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">{c.label}</div>
                        <div className="text-[10px] opacity-80 truncate">{c.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: JUSTIFICACIÓN Y DESCRIPCIÓN */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-indigo-400" />
                Paso 2: Justificación y Descripción Detallada
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Conforme a la regla de completitud del SRS (RN-01 / CU-04), la justificación y descripción deben ser sustantivas para evitar la desestimación en el filtro del Gestor.
              </p>
            </div>

            {/* Descripción Detallada */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="rfc-description" className="block text-xs font-semibold text-slate-300">
                  Descripción Detallada del Requerimiento o Falla <span className="text-red-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Mínimo 15 caracteres ({formData.description.trim().length} ingresados)
                </span>
              </div>
              <textarea
                id="rfc-description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describa de manera precisa la necesidad operativa, los pasos para reproducir la falla si aplica, o la nueva funcionalidad esperada en el sistema..."
                className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  fieldErrors.description ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-800'
                }`}
              />
              {fieldErrors.description && (
                <p className="text-xs text-red-400">{fieldErrors.description}</p>
              )}
            </div>

            {/* Justificación de Negocio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="rfc-justification" className="block text-xs font-semibold text-slate-300">
                  Justificación de Negocio / Valor Agregado <span className="text-red-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Mínimo 15 caracteres ({formData.justification.trim().length} ingresados)
                </span>
              </div>
              <textarea
                id="rfc-justification"
                rows={3}
                value={formData.justification}
                onChange={(e) => handleInputChange('justification', e.target.value)}
                placeholder="Explique el impacto de no implementar el cambio (riesgo operativo, multas, interrupción de servicio) y el beneficio concreto para el negocio..."
                className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  fieldErrors.justification ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-800'
                }`}
              />
              {fieldErrors.justification && (
                <p className="text-xs text-red-400">{fieldErrors.justification}</p>
              )}
            </div>

            {/* Propuesta Técnica Sugerida (Opcional) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="rfc-proposedSolution" className="block text-xs font-semibold text-slate-300">
                  Propuesta Técnica Sugerida / Beneficio Esperado <span className="text-slate-500">(Opcional)</span>
                </label>
                <span className="text-[11px] text-slate-500">Evaluada por el Arquitecto en CU-06</span>
              </div>
              <textarea
                id="rfc-proposedSolution"
                rows={2}
                value={formData.proposedSolution}
                onChange={(e) => handleInputChange('proposedSolution', e.target.value)}
                placeholder="Si cuenta con una propuesta de solución o indicación técnica preliminar, detalle aquí..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: ECS Y EVIDENCIAS */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Paso 3: Elemento de Configuración (ECS) y Evidencias
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Selecciona del catálogo activo el Elemento de Configuración de Software afectado por la solicitud y adjunta antecedentes de sustento.
              </p>
            </div>

            {/* Selector de ECS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Seleccionar ECS Afectado del Proyecto ({projectEcsList.length} disponibles) <span className="text-red-400">*</span>
                </label>
                <span className="text-[11px] text-indigo-400 font-mono">
                  {formData.affectedEcsId ? `Seleccionado: ${formData.affectedEcsId}` : 'Ninguno seleccionado'}
                </span>
              </div>

              {projectEcsList.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                  No se encontraron ECS registrados para este proyecto. Contacte al Administrador SCM (CU-09).
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {projectEcsList.map((ecs: ECS) => {
                    const isSelected = formData.affectedEcsId === ecs.id;
                    return (
                      <div
                        key={ecs.id}
                        onClick={() => handleInputChange('affectedEcsId', ecs.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-600 text-white shadow-sm ring-1 ring-indigo-500/20'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-indigo-300">{ecs.code}</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${
                                ecs.currentLibrary === 'MAESTRA'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : ecs.currentLibrary === 'SOPORTE'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {ecs.currentLibrary}
                            </span>
                            {ecs.lock?.isLocked && (
                              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono bg-red-950 text-red-300 border border-red-800" title="Bloqueado bajo RN-06">
                                <Lock className="w-2.5 h-2.5" />
                                RN-06
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-white truncate">{ecs.name}</div>
                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          Versión: <span className="font-mono text-slate-400">{ecs.currentVersion}</span> &bull; Tipo: {ecs.type}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {fieldErrors.affectedEcsId && (
                <p className="text-xs text-red-400">{fieldErrors.affectedEcsId}</p>
              )}
            </div>

            {/* Evidencias y Documentación de Respaldo (Flujo Alternativo A1) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                Documentación Técnica o Probatoria de Respaldo (Flujo A1)
              </label>
              
              {/* Sugerencias Rápidas */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500">Archivos sugeridos para la demo:</span>
                {SUGGESTED_ATTACHMENTS.map((sug) => {
                  const already = formData.attachments.includes(sug);
                  return (
                    <button
                      key={sug}
                      type="button"
                      disabled={already}
                      onClick={() => handleAddAttachment(sug)}
                      className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                        already
                          ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-white'
                      }`}
                    >
                      + {sug}
                    </button>
                  );
                })}
              </div>

              {/* Input personalizado */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Paperclip className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={customAttachment}
                    onChange={(e) => setCustomAttachment(e.target.value)}
                    placeholder="Nombre de archivo de sustento (ej. acta_cliente_2026.pdf, log_error.txt)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAttachment(customAttachment);
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddAttachment(customAttachment)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
                >
                  Adjuntar
                </button>
              </div>

              {/* Lista de adjuntos agregados */}
              {formData.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formData.attachments.map((att) => (
                    <span
                      key={att}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs font-mono"
                    >
                      <Paperclip className="w-3 h-3 text-indigo-400" />
                      <span>{att}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att)}
                        className="text-indigo-400 hover:text-red-400 transition-colors ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 4: REVISIÓN Y ENVÍO */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Paso 4: Confirmación y Envío Formal de la Solicitud
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Revisa la ficha técnica antes del envío definitivo. Tras la confirmación, la solicitud quedará radicada en estado <strong className="text-slate-200">REGISTRADA</strong> y se emitirá la firma de auditoría.
              </p>
            </div>

            {/* ReadOnlySummaryCard: Ficha Resumen Consolidada */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <span className="text-xs font-semibold text-slate-400">Resumen Técnico de la Solicitud</span>
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/80">
                  {nextRfcCodePreview} &bull; REGISTRADA
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Proyecto Seleccionado:</span>
                  <span className="font-semibold text-white">{activeProject.name} ({activeProject.code})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Solicitante Responsable (PU-01):</span>
                  <span className="font-semibold text-white">{currentUser.fullName} ({currentUser.email})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Prioridad Propuesta:</span>
                  <span className="font-semibold text-amber-300">{formData.priority}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Categoría de Cambio:</span>
                  <span className="font-semibold text-indigo-300">{formData.category}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div>
                  <span className="text-slate-500 block text-xs">Título Formal:</span>
                  <div className="text-xs font-bold text-white">{formData.title}</div>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Descripción Detallada:</span>
                  <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {formData.description}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 block text-xs">Justificación de Negocio / Valor:</span>
                  <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {formData.justification}
                  </p>
                </div>

                {formData.proposedSolution && (
                  <div>
                    <span className="text-slate-500 block text-xs">Solución Técnica Sugerida:</span>
                    <p className="text-xs text-slate-300 whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {formData.proposedSolution}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 block text-xs">Elemento de Configuración (ECS) Afectado:</span>
                  <div className="text-xs font-semibold text-indigo-300 font-mono mt-1">
                    {selectedEcs ? `${selectedEcs.code} — ${selectedEcs.name} (Biblioteca: ${selectedEcs.currentLibrary}, v${selectedEcs.currentVersion})` : formData.affectedEcsId}
                  </div>
                </div>

                {formData.attachments.length > 0 && (
                  <div>
                    <span className="text-slate-500 block text-xs">Archivos de Sustento Adjuntos ({formData.attachments.length}):</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {formData.attachments.map((a) => (
                        <span key={a} className="font-mono text-[11px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Checkbox de Declaración de Veracidad */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  Declaro que la información consignada corresponde a una necesidad técnica o defecto justificado, y autorizo su tramitación formal bajo las políticas de gestión de configuración de software (IEEE 828 / TraceFlow SCM).
                </span>
              </label>
              {fieldErrors.termsAccepted && (
                <p className="text-xs text-red-400 pl-7">{fieldErrors.termsAccepted}</p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CONTROLES DE NAVEGACIÓN DEL WIZARD */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Paso Anterior</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Siguiente Paso</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isAuthorized || !formData.termsAccepted}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
                  isAuthorized && formData.termsAccepted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Radicar Solicitud formalmente (CU-04)</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* MODAL DE ÉXITO Y EXPEDIENTE CREADO */}
      {/* ========================================================================= */}
      {createdRfc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-600/80 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">
                ¡Solicitud de Cambio Registrada Exitosamente!
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                La solicitud ha sido catalogada formalmente en el sistema y ha ingresado al ciclo de vida en estado oficial <strong className="text-slate-200">REGISTRADA</strong>.
              </p>
            </div>

            {/* Ficha de Comprobante */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-500">Código de Expediente:</span>
                <span className="font-bold text-emerald-400 text-sm">{createdRfc.code}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-500">Estado Oficial (TB-07):</span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                  {createdRfc.status}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-500">Proyecto Afectado:</span>
                <span className="text-white truncate max-w-[240px]">{createdRfc.projectName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-500">ECS Vinculado:</span>
                <span className="text-indigo-300 truncate max-w-[240px]">{createdRfc.affectedEcsName}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Fecha de Radicación:</span>
                <span className="text-slate-400">{new Date(createdRfc.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Aviso de Trazabilidad e Integridad */}
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-[11px] text-indigo-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong>Trazabilidad y Notificaciones:</strong> Se ha emitido la firma de auditoría forense con hash SHA-256 y se ha puesto a disposición del <strong>Analista de Requerimientos / Gestor (PU-02)</strong> para su validación de completitud y clasificación (CU-05).
              </div>
            </div>

            {/* Botones de Acción Posterior */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Link
                to={`/rfcs/${createdRfc.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Expediente</span>
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <span>Ir al Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <span>Registrar Otra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMACIÓN DE DESCARTE (Flujo Alternativo A2) */}
      {/* ========================================================================= */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">¿Descartar registro de solicitud?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Conforme al flujo alternativo A2 del SRS, si cancelas el registro los datos no guardados se perderán y no se emitirá ninguna transacción en el catálogo ni en auditoría.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Sí, descartar y salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
