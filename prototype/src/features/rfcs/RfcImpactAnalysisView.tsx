import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  Calendar,
  Layers,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { rfcService } from '../../services/rfc.service';
import { impactAnalysisService } from '../../services/impactAnalysis.service';
import { ecsService } from '../../services/ecs.service';
import type {
  RFC,
  ECS,
  ImpactRecommendation,
  TechnicalRiskLevel,
  ChangeClassification,
} from '../../types';

export const RfcImpactAnalysisView: React.FC = () => {
  const { rfcId } = useParams<{ rfcId: string }>();
  const navigate = useNavigate();
  const { currentUser, activeRoleId } = useAuthStore();

  const [rfc] = useState<RFC | null>(() => {
    return rfcId ? rfcService.getById(rfcId) || null : null;
  });

  const [projectEcsList] = useState<ECS[]>(() => {
    if (!rfcId) return [];
    const foundRfc = rfcService.getById(rfcId);
    return foundRfc ? ecsService.getAll(foundRfc.projectId) : [];
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ reportId: string; nextStatus: string } | null>(null);

  // Form states inicializados de forma determinística
  const [effortHours, setEffortHours] = useState<number>(16);
  const [estimatedCost, setEstimatedCost] = useState<number>(1200);
  const [scheduleImpactDays, setScheduleImpactDays] = useState<number>(3);
  const [technicalSummary, setTechnicalSummary] = useState<string>('');
  const [selectedEcsIds, setSelectedEcsIds] = useState<string[]>(() => {
    return rfc?.affectedEcsId ? [rfc.affectedEcsId] : [];
  });
  const [technicalRisk, setTechnicalRisk] = useState<TechnicalRiskLevel>('MEDIO');
  const [identifiedRisks, setIdentifiedRisks] = useState<string[]>([
    'Riesgo de regresión en endpoints dependientes.',
  ]);
  const [customRiskInput, setCustomRiskInput] = useState<string>('');
  const [recommendation, setRecommendation] = useState<ImpactRecommendation>(() => {
    return rfc?.classification === 'CAMBIO_MAYOR' ? 'PROCEDE_MAYOR' : 'PROCEDE_MENOR';
  });
  const [proposedClassification, setProposedClassification] = useState<ChangeClassification>(() => {
    return rfc?.classification || 'CAMBIO_MAYOR';
  });
  const [rollbackPlan, setRollbackPlan] = useState<string>(
    'Restauración de versión anterior desde Biblioteca Maestra y reversión de scripts de base de datos.'
  );

  const availableCommonRisks = [
    'Riesgo de regresión en endpoints dependientes.',
    'Afectación a latencia o concurrencia en horas pico.',
    'Bloqueo transaccional o migración de esquemas en base de datos.',
    'Incompatibilidad con librerías o dependencias externas.',
    'Requiere actualización de certificados o secretos de seguridad.',
  ];

  if (!rfc) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Expediente de RFC no encontrado</span>
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

  // Comprobaciones de Seguridad y SoD
  const isOriginalRequester = currentUser && rfc.requesterId === currentUser.id;
  const isProjectAuthorized = currentUser && currentUser.assignedProjectIds?.includes(rfc.projectId);
  const isValidStatus = rfc.status === 'CLASIFICADA' || rfc.status === 'EN_ANALISIS_TECNICO';
  const isAlreadyEvaluated = Boolean(rfc.impactAnalysisId);

  // Manejo de riesgos dinámicos
  const toggleRisk = (risk: string) => {
    if (identifiedRisks.includes(risk)) {
      setIdentifiedRisks(identifiedRisks.filter((r) => r !== risk));
    } else {
      setIdentifiedRisks([...identifiedRisks, risk]);
    }
  };

  const addCustomRisk = () => {
    const trimmed = customRiskInput.trim();
    if (trimmed && !identifiedRisks.includes(trimmed)) {
      setIdentifiedRisks([...identifiedRisks, trimmed]);
      setCustomRiskInput('');
    }
  };

  const toggleEcsSelection = (ecsId: string) => {
    if (selectedEcsIds.includes(ecsId)) {
      if (selectedEcsIds.length === 1) return; // Mínimo 1 ECS
      setSelectedEcsIds(selectedEcsIds.filter((id) => id !== ecsId));
    } else {
      setSelectedEcsIds([...selectedEcsIds, ecsId]);
    }
  };

  const handleClassificationChange = (cls: ChangeClassification) => {
    setProposedClassification(cls);
    if (cls === 'CAMBIO_MAYOR') {
      setRecommendation('PROCEDE_MAYOR');
    } else {
      setRecommendation('PROCEDE_MENOR');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser) {
      setFormError('Sesión no válida.');
      return;
    }

    if (effortHours <= 0) {
      setFormError('El esfuerzo técnico debe ser mayor a 0 horas.');
      return;
    }
    if (estimatedCost < 0) {
      setFormError('El costo estimado no puede ser negativo.');
      return;
    }
    if (scheduleImpactDays < 0) {
      setFormError('El impacto en días no puede ser negativo.');
      return;
    }
    if (technicalSummary.trim().length < 15) {
      setFormError('La fundamentación técnica debe contener al menos 15 caracteres.');
      return;
    }
    if (selectedEcsIds.length === 0) {
      setFormError('Debe seleccionar al menos un Elemento de Configuración (ECS) afectado.');
      return;
    }

    try {
      setSubmitting(true);
      const result = impactAnalysisService.registerAnalysis(
        {
          rfcId: rfc.id,
          effortHours,
          estimatedCost,
          scheduleImpactDays,
          technicalSummary,
          affectedEcsIds: selectedEcsIds,
          technicalRisk,
          identifiedRisks,
          recommendation,
          proposedClassification,
          rollbackPlan,
        },
        currentUser
      );

      setSuccessResult({
        reportId: result.report.id,
        nextStatus: result.updatedRfc.status,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setFormError(error.message || 'Error al registrar el análisis de impacto.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Cabecera y Navegación Contextual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-upt-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-upt-muted mb-1">
            <Link to="/rfcs" className="hover:text-upt-primary">Bandeja de RFCs</Link>
            <span>/</span>
            <Link to={`/rfcs/${rfc.id}`} className="hover:text-upt-primary font-mono">{rfc.code}</Link>
            <span>/</span>
            <span className="text-upt-primary font-semibold">Análisis de Impacto Técnico</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-upt-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-upt-secondary" />
            Evaluación de Impacto Técnico (CU-06)
          </h1>
          <p className="text-xs text-upt-muted mt-0.5">
            Evaluación de la Triple Restricción, dependencias arquitectónicas y clasificación normativa (RN-05).
          </p>
        </div>

        <Link
          to={`/rfcs/${rfc.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-upt-border text-xs font-medium text-upt-text hover:bg-upt-bg transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Expediente
        </Link>
      </div>

      {/* BLOQUEO 1: Aislamiento Multitenant */}
      {!isProjectAuthorized && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Lock className="w-5 h-5 text-amber-700" />
            <span>Acceso Denegado por Aislamiento de Proyecto</span>
          </div>
          <p className="text-xs leading-relaxed">
            Su cuenta no cuenta con asignación al proyecto <strong>{rfc.projectName}</strong> ({rfc.projectId}).
            No tiene autorización para evaluar expedientes fuera de sus proyectos asignados.
          </p>
        </div>
      )}

      {/* BLOQUEO 2: Antiautoevaluación SoD */}
      {isOriginalRequester && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-red-700" />
            <span>Incompatibilidad Normativa por Segregación de Funciones (RN-05)</span>
          </div>
          <p className="text-xs leading-relaxed">
            Usted figura como el <strong>Solicitante original</strong> ({rfc.requesterName}) de esta RFC.
            Por mandato estricto de segregación de funciones, quien origina un requerimiento tiene prohibido dictaminar
            o evaluar técnicamente su propio impacto técnico.
          </p>
        </div>
      )}

      {/* BLOQUEO 3: Estado No Válido */}
      {!isValidStatus && (
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Clock className="w-5 h-5 text-blue-700" />
            <span>Expediente no disponible para evaluación técnica</span>
          </div>
          <p className="text-xs leading-relaxed">
            El expediente se encuentra en estado <strong>{rfc.status}</strong>. Solo las solicitudes en estado{' '}
            <strong>CLASIFICADA</strong> (admitidas formalmente por el Gestor) o <strong>EN_ANALISIS_TECNICO</strong>{' '}
            pueden ser evaluadas técnicamente.
          </p>
        </div>
      )}

      {/* BLOQUEO 4: Ya cuenta con análisis congelado */}
      {isAlreadyEvaluated && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>Informe Técnico de Impacto ya Emitido y Congelado</span>
          </div>
          <p className="text-xs leading-relaxed">
            Este expediente ya cuenta con un informe técnico formal registrado (<strong>{rfc.impactAnalysisId}</strong>).
            Conforme a las políticas de integridad, el dictamen emitido queda inmutable en la bitácora.
          </p>
          <div className="pt-2">
            <Link
              to={`/rfcs/${rfc.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs"
            >
              Consultar Informe en Expediente
            </Link>
          </div>
        </div>
      )}

      {/* Modal / Banner de Éxito al Emitir */}
      {successResult && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-emerald-950 text-base">
                ¡Informe Técnico de Impacto Emitido con Éxito!
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                El informe <strong>{successResult.reportId}</strong> fue registrado formalmente y firmado por{' '}
                <strong>{currentUser?.fullName}</strong>. El estado del expediente ha transicionado a{' '}
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {successResult.nextStatus}
                </span>.
              </p>
              <p className="text-[11px] text-emerald-700 italic">
                {proposedClassification === 'CAMBIO_MAYOR'
                  ? 'El expediente fue derivado a la bandeja del Comité de Control de Cambios (CCB) para deliberación formal mediante CU-07.'
                  : 'El expediente quedó clasificado como Cambio Menor, listo para autorización mediante Doble Llave Delegada (CU-30).'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
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
              Ir a Bandeja de RFCs
            </button>
          </div>
        </div>
      )}

      {/* FORMULARIO DE EVALUACIÓN TÉCNICA (Visible solo si cumple condiciones) */}
      {!successResult && !isAlreadyEvaluated && isValidStatus && !isOriginalRequester && isProjectAuthorized && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tarjeta de Contexto del Requerimiento Original */}
          <div className="p-5 rounded-2xl bg-upt-surface border border-upt-border shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-upt-border pb-3">
              <div>
                <span className="text-[10px] font-mono text-upt-muted uppercase tracking-wider block">
                  Expediente de Referencia:
                </span>
                <span className="font-bold text-sm text-upt-primary">{rfc.code} — {rfc.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                  Proyecto: {rfc.projectName}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                  Prioridad: {rfc.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-upt-muted font-medium">Descripción del Solicitante ({rfc.requesterName}):</span>
                <p className="text-upt-text-secondary bg-upt-bg p-2.5 rounded-xl border border-upt-border leading-relaxed">
                  {rfc.description}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-upt-muted font-medium">Notas de Admisión del Gestor ({rfc.admittedBy || 'Gestor'}):</span>
                <p className="text-upt-text-secondary bg-upt-bg p-2.5 rounded-xl border border-upt-border leading-relaxed">
                  {rfc.admissionNotes || 'Solicitud formalmente admitida para evaluación de impacto técnico.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 1: Estimaciones Cuantitativas de Triple Restricción */}
          <div className="p-6 rounded-2xl bg-white border border-upt-border shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-upt-border pb-3">
              <Sparkles className="w-5 h-5 text-upt-secondary" />
              <div>
                <h2 className="text-sm font-bold text-upt-primary uppercase tracking-wider">
                  1. Estimación Cuantitativa de la Triple Restricción
                </h2>
                <p className="text-xs text-upt-muted">
                  Cálculo de impacto sobre esfuerzo de desarrollo, presupuesto y ruta crítica de entrega.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Esfuerzo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-upt-text flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Esfuerzo Técnico (Horas-Hombre) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={effortHours}
                    onChange={(e) => setEffortHours(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-upt-border text-sm font-mono text-upt-text focus:outline-hidden focus:ring-2 focus:ring-upt-primary"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-upt-muted font-mono">hrs</span>
                </div>
                <span className="text-[10px] text-upt-muted">Incluye desarrollo, pruebas unitarias e integración.</span>
              </div>

              {/* Costo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-upt-text flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" /> Presupuesto Estimado (S/.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-upt-muted font-mono">S/.</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-upt-border text-sm font-mono text-upt-text focus:outline-hidden focus:ring-2 focus:ring-upt-primary"
                    required
                  />
                </div>
                <span className="text-[10px] text-upt-muted">Costo operativo directo y recursos técnicos.</span>
              </div>

              {/* Cronograma */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-upt-text flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" /> Impacto en Cronograma (Días Útiles) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={scheduleImpactDays}
                    onChange={(e) => setScheduleImpactDays(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-upt-border text-sm font-mono text-upt-text focus:outline-hidden focus:ring-2 focus:ring-upt-primary"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-upt-muted font-mono">días</span>
                </div>
                <span className="text-[10px] text-upt-muted">Afectación proyectada a la fecha de entrega.</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Elementos de Configuración (ECS) y Dependencias */}
          <div className="p-6 rounded-2xl bg-white border border-upt-border shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-upt-border pb-3">
              <Layers className="w-5 h-5 text-upt-secondary" />
              <div>
                <h2 className="text-sm font-bold text-upt-primary uppercase tracking-wider">
                  2. Alcance Arquitectónico y Elementos de Configuración (ECS)
                </h2>
                <p className="text-xs text-upt-muted">
                  Seleccione los ECS directamente modificados y aquellos con riesgo de regresión o dependencias cruzadas.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-upt-text block">
                Catálogo de ECS del Proyecto ({rfc.projectName}):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-2 rounded-xl border border-upt-border bg-upt-bg/40">
                {projectEcsList.map((ecs) => {
                  const isSelected = selectedEcsIds.includes(ecs.id);
                  const isPrimary = ecs.id === rfc.affectedEcsId;
                  return (
                    <button
                      type="button"
                      key={ecs.id}
                      onClick={() => toggleEcsSelection(ecs.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-upt-primary bg-blue-50/70 text-upt-primary'
                          : 'border-upt-border bg-white hover:bg-slate-50 text-upt-text'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // controlado por onClick del botón
                        className="mt-1 text-upt-primary rounded"
                      />
                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs">{ecs.code}</span>
                          {isPrimary && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                              Primario RFC
                            </span>
                          )}
                        </div>
                        <div className="text-xs truncate font-medium">{ecs.name}</div>
                        <div className="text-[10px] text-upt-muted truncate">{ecs.type} &bull; {ecs.filePath}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-upt-muted block">
                Seleccionados: {selectedEcsIds.length} Elemento(s) de Configuración de Software.
              </span>
            </div>

            {/* Fundamentación Técnica */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-upt-text">
                  Resumen y Fundamentación Técnica del Impacto Arquitectónico *
                </label>
                <span className={`text-[11px] font-mono ${technicalSummary.length < 15 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {technicalSummary.length}/15 caracteres mínimos
                </span>
              </div>
              <textarea
                rows={4}
                value={technicalSummary}
                onChange={(e) => setTechnicalSummary(e.target.value)}
                placeholder="Detalle el impacto en puertos de servicio, modelos de persistencia, concurrencia, interfaces públicas o bibliotecas compartidas..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-upt-border text-xs sm:text-sm text-upt-text focus:outline-hidden focus:ring-2 focus:ring-upt-primary leading-relaxed"
                required
              />
            </div>
          </div>

          {/* SECCIÓN 3: Gestión de Riesgos Técnicos y Rollback */}
          <div className="p-6 rounded-2xl bg-white border border-upt-border shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-upt-border pb-3">
              <ShieldAlert className="w-5 h-5 text-upt-secondary" />
              <div>
                <h2 className="text-sm font-bold text-upt-primary uppercase tracking-wider">
                  3. Evaluación de Riesgos y Plan de Rollback
                </h2>
                <p className="text-xs text-upt-muted">
                  Nivel de severidad técnica y estrategia de contingencia ante fallas en integración.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-xs font-semibold text-upt-text block">
                  Nivel de Riesgo Técnico Global:
                </label>
                <div className="space-y-2">
                  {(['BAJO', 'MEDIO', 'ALTO'] as TechnicalRiskLevel[]).map((level) => (
                    <label
                      key={level}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                        technicalRisk === level
                          ? level === 'ALTO'
                            ? 'border-red-500 bg-red-50 font-bold text-red-900'
                            : level === 'MEDIO'
                            ? 'border-amber-500 bg-amber-50 font-bold text-amber-900'
                            : 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900'
                          : 'border-upt-border hover:bg-slate-50 text-upt-text'
                      }`}
                    >
                      <input
                        type="radio"
                        name="technicalRisk"
                        value={level}
                        checked={technicalRisk === level}
                        onChange={() => setTechnicalRisk(level)}
                      />
                      <span className="text-xs">{level} RIESGO</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Checklist de riesgos identificados */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold text-upt-text block">
                  Riesgos Técnicos Específicos Identificados:
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 rounded-xl border border-upt-border bg-upt-bg/30 text-xs">
                  {availableCommonRisks.map((risk) => (
                    <label key={risk} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={identifiedRisks.includes(risk)}
                        onChange={() => toggleRisk(risk)}
                        className="rounded text-upt-primary"
                      />
                      <span className="text-upt-text-secondary">{risk}</span>
                    </label>
                  ))}
                </div>

                {/* Agregar riesgo personalizado */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customRiskInput}
                    onChange={(e) => setCustomRiskInput(e.target.value)}
                    placeholder="Agregar otro riesgo identificado..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-upt-border text-xs text-upt-text focus:outline-hidden focus:ring-1 focus:ring-upt-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomRisk();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomRisk}
                    className="px-3 py-1.5 rounded-lg bg-upt-secondary hover:bg-upt-secondary-hover text-white text-xs font-semibold"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Plan de Rollback */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-upt-text flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-upt-muted" /> Plan Preliminar de Rollback / Contingencia:
              </label>
              <textarea
                rows={2}
                value={rollbackPlan}
                onChange={(e) => setRollbackPlan(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-upt-border text-xs text-upt-text focus:outline-hidden focus:ring-2 focus:ring-upt-primary leading-relaxed"
                placeholder="Estrategia de retroceso técnico si las pruebas de QA fallan..."
              />
            </div>
          </div>

          {/* SECCIÓN 4: Dictamen Técnico y Bifurcación de Clasificación */}
          <div className="p-6 rounded-2xl bg-white border border-upt-border shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-upt-border pb-3">
              <CheckCircle2 className="w-5 h-5 text-upt-secondary" />
              <div>
                <h2 className="text-sm font-bold text-upt-primary uppercase tracking-wider">
                  4. Dictamen Técnico y Clasificación Normativa (RN-05)
                </h2>
                <p className="text-xs text-upt-muted">
                  Bifurcación del ciclo de vida: Cambios Menores derivan a Doble Llave; Cambios Mayores derivan a CCB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tarjeta Cambio Menor */}
              <div
                onClick={() => handleClassificationChange('CAMBIO_MENOR')}
                className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all space-y-2 ${
                  proposedClassification === 'CAMBIO_MENOR'
                    ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-upt-border hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-blue-900">
                    Cambio Menor (Delegado - CU-30)
                  </span>
                  <input
                    type="radio"
                    name="classification"
                    value="CAMBIO_MENOR"
                    checked={proposedClassification === 'CAMBIO_MENOR'}
                    onChange={() => handleClassificationChange('CAMBIO_MENOR')}
                  />
                </div>
                <p className="text-xs text-blue-950/80 leading-relaxed">
                  Afectación acotada a la configuración local o documentación. No compromete contratos de API críticos,
                  esquemas transaccionales ni presupuesto sustancial.
                </p>
                <div className="pt-1 text-[11px] font-medium text-blue-800 flex items-center gap-1">
                  <span>&bull; Deriva a:</span>
                  <span className="font-semibold underline">Doble Llave Gestor + Arquitecto (CU-30)</span>
                </div>
              </div>

              {/* Tarjeta Cambio Mayor */}
              <div
                onClick={() => handleClassificationChange('CAMBIO_MAYOR')}
                className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all space-y-2 ${
                  proposedClassification === 'CAMBIO_MAYOR'
                    ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                    : 'border-upt-border hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-purple-900">
                    Cambio Mayor (Requiere CCB - CU-07)
                  </span>
                  <input
                    type="radio"
                    name="classification"
                    value="CAMBIO_MAYOR"
                    checked={proposedClassification === 'CAMBIO_MAYOR'}
                    onChange={() => handleClassificationChange('CAMBIO_MAYOR')}
                  />
                </div>
                <p className="text-xs text-purple-950/80 leading-relaxed">
                  Modifica la línea base de la arquitectura, seguridad, contratos de integración o supera los umbrales
                  de esfuerzo y presupuesto. Requiere evaluación colegiada.
                </p>
                <div className="pt-1 text-[11px] font-medium text-purple-800 flex items-center gap-1">
                  <span>&bull; Deriva a:</span>
                  <span className="font-semibold underline">Comité de Control de Cambios CCB (CU-07)</span>
                </div>
              </div>
            </div>

            {/* Recomendación Formal del Arquitecto */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-upt-text block">
                Dictamen Técnico Final del Arquitecto:
              </label>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as ImpactRecommendation)}
                className="w-full sm:w-1/2 px-3 py-2 rounded-xl border border-upt-border text-xs text-upt-text bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-upt-primary"
              >
                <option value="PROCEDE_MAYOR">PROCEDE TÉCNICAMENTE (Clasificado como Cambio Mayor)</option>
                <option value="PROCEDE_MENOR">PROCEDE TÉCNICAMENTE (Clasificado como Cambio Menor)</option>
                <option value="RECHAZO_TECNICO">INVIABLE TÉCNICAMENTE (Recomendar Rechazo por Riesgo Arquitectónico)</option>
              </select>
            </div>
          </div>

          {/* Errores del formulario */}
          {formError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Barra de Acciones */}
          <div className="pt-4 border-t border-upt-border flex flex-wrap items-center justify-between gap-3">
            <Link
              to={`/rfcs/${rfc.id}`}
              className="px-4 py-2 rounded-xl border border-upt-border text-xs font-semibold text-upt-muted hover:text-upt-text hover:bg-upt-bg transition-colors"
            >
              Cancelar y Salir
            </Link>

            <button
              type="submit"
              disabled={submitting || activeRoleId !== 'PU-03'}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-upt-primary hover:bg-upt-primary-hover text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Firmando y Registrando...' : 'Firmar y Emitir Informe Técnico (CU-06)'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
