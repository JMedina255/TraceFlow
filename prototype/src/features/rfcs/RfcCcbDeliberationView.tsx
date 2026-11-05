import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertTriangle,
  Building2,
  Layers,
  Lock,
  MinusCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { rfcService } from '../../services/rfc.service';
import { impactAnalysisService } from '../../services/impactAnalysis.service';
import { ccbService } from '../../services/ccb.service';
import { minorApprovalService } from '../../services/minorApproval.service';
import type {
  CcbVoteDecision,
  CcbSession,
  CcbVote,
  CcbResolution,
  CcbVoteTally,
  TechnicalImpactReport,
  RFC,
} from '../../types';

export const RfcCcbDeliberationView: React.FC = () => {
  const { rfcId } = useParams<{ rfcId: string }>();
  const navigate = useNavigate();
  const { currentUser, activeRoleId } = useAuthStore();

  // Inicialización sincrónica perezosa para evitar advertencias de ciclo de vida
  const [initialData] = useState<{
    rfc: RFC | undefined;
    report: TechnicalImpactReport | undefined;
    session: CcbSession | undefined;
    votes: CcbVote[];
    tally: CcbVoteTally;
    resolution: CcbResolution | undefined;
    authorizedMembers: Array<{ id: string; fullName: string; roleLabel?: string }>;
    initialError: string | null;
  }>(() => {
    if (!rfcId) {
      return {
        rfc: undefined,
        report: undefined,
        session: undefined,
        votes: [],
        tally: { approve: 0, reject: 0, abstain: 0, total: 0 },
        resolution: undefined,
        authorizedMembers: [],
        initialError: 'Identificador de solicitud no especificado en la ruta.',
      };
    }

    const foundRfc = rfcService.getById(rfcId);
    if (!foundRfc) {
      return {
        rfc: undefined,
        report: undefined,
        session: undefined,
        votes: [],
        tally: { approve: 0, reject: 0, abstain: 0, total: 0 },
        resolution: undefined,
        authorizedMembers: [],
        initialError: `Solicitud de cambio '${rfcId}' no encontrada en el sistema.`,
      };
    }

    // Precondición: estado EN_EVALUACION
    if (foundRfc.status !== 'EN_EVALUACION') {
      return {
        rfc: foundRfc,
        report: undefined,
        session: undefined,
        votes: [],
        tally: { approve: 0, reject: 0, abstain: 0, total: 0 },
        resolution: undefined,
        authorizedMembers: [],
        initialError: `La solicitud ${foundRfc.code} se encuentra en estado '${foundRfc.status}'. La deliberación del CCB exige que el expediente se encuentre en estado 'EN_EVALUACION'.`,
      };
    }

    // Precondición: CAMBIO_MAYOR
    if (foundRfc.classification !== 'CAMBIO_MAYOR') {
      return {
        rfc: foundRfc,
        report: undefined,
        session: undefined,
        votes: [],
        tally: { approve: 0, reject: 0, abstain: 0, total: 0 },
        resolution: undefined,
        authorizedMembers: [],
        initialError: `La solicitud ${foundRfc.code} está clasificada como '${foundRfc.classification || 'SIN_CLASIFICAR'}'. La deliberación del CCB aplica exclusivamente a Cambios Mayores.`,
      };
    }

    // Precondición: Informe Técnico emitido
    if (!foundRfc.impactAnalysisId) {
      return {
        rfc: foundRfc,
        report: undefined,
        session: undefined,
        votes: [],
        tally: { approve: 0, reject: 0, abstain: 0, total: 0 },
        resolution: undefined,
        authorizedMembers: [],
        initialError: `La solicitud ${foundRfc.code} carece de Informe Técnico de Impacto emitido por Arquitectura (requisito previo obligatorio).`,
      };
    }

    const techReport = impactAnalysisService.getById(foundRfc.impactAnalysisId);
    if (!techReport) {
      return {
        rfc: foundRfc,
        report: undefined,
        session: undefined,
        votes: [],
        tally: { approve: 0, reject: 0, abstain: 0, total: 0 },
        resolution: undefined,
        authorizedMembers: [],
        initialError: `No se localizó el informe técnico '${foundRfc.impactAnalysisId}' en el repositorio.`,
      };
    }

    // Obtener o aperturar sesión CCB
    let ccbSession = ccbService.getSessionByRfcId(foundRfc.id);
    if (!ccbSession && currentUser && activeRoleId === 'PU-04') {
      try {
        const opened = ccbService.openSession({ rfcId: foundRfc.id }, currentUser);
        ccbSession = opened.session;
      } catch (err) {
        return {
          rfc: foundRfc,
          report: techReport,
          session: undefined,
          votes: [],
          tally: { approve: 0, reject: 0, abstain: 0, total: 0 },
          resolution: undefined,
          authorizedMembers: [],
          initialError: err instanceof Error ? err.message : 'Error al convocar la sesión del CCB.',
        };
      }
    }

    const votes = ccbSession ? ccbService.getVotesBySessionId(ccbSession.id) : [];
    const tally = ccbSession ? ccbService.getVoteTally(ccbSession.id) : { approve: 0, reject: 0, abstain: 0, total: 0 };
    const resolution = ccbSession ? ccbService.getResolutionBySessionId(ccbSession.id) : undefined;
    const members = ccbService.getAuthorizedMembers(foundRfc.projectId).map((m) => ({
      id: m.id,
      fullName: m.fullName,
      roleLabel: m.cargo || m.position || 'Miembro del CCB',
    }));

    return {
      rfc: foundRfc,
      report: techReport,
      session: ccbSession,
      votes,
      tally,
      resolution,
      authorizedMembers: members,
      initialError: null,
    };
  });

  const [rfc] = useState<RFC | undefined>(initialData.rfc);
  const [report] = useState<TechnicalImpactReport | undefined>(initialData.report);
  const [session, setSession] = useState<CcbSession | undefined>(initialData.session);
  const [votes, setVotes] = useState<CcbVote[]>(initialData.votes);
  const [tally, setTally] = useState<CcbVoteTally>(initialData.tally);
  const [resolution, setResolution] = useState<CcbResolution | undefined>(initialData.resolution);
  const [members] = useState(initialData.authorizedMembers);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialData.initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Formulario de votación
  const [voteDecision, setVoteDecision] = useState<CcbVoteDecision>('APROBAR');
  const [voteJustification, setVoteJustification] = useState<string>('');
  const [observations, setObservations] = useState<string>(
    initialData.resolution?.justification || 'Deliberación colegiada del CCB. Expediente analizado con informe técnico de impacto.'
  );

  // Verificaciones de Segregación de Funciones (SoD) y permisos del usuario actual
  const isCcbMember = activeRoleId === 'PU-04';
  const hasProjectAccess = rfc && currentUser ? currentUser.assignedProjectIds.includes(rfc.projectId) : false;
  const isSelfRequester = rfc && currentUser ? rfc.requesterId === currentUser.id : false;
  const userExistingVote = currentUser && session ? votes.find((v) => v.voterUserId === currentUser.id) : undefined;
  const hasAlreadyVoted = Boolean(userExistingVote);

  // Historial previo de reescalamiento (si vino de CU-30)
  const minorApprovals = rfc ? minorApprovalService.getByRfcId(rfc.id) : [];
  const reescalationRecord = minorApprovals.find((a) => a.escalateToCcb);

  // Handler para emitir voto individual
  const handleRegisterVote = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!session || !currentUser) {
      setErrorMessage('No hay una sesión activa o sesión de usuario disponible.');
      return;
    }

    const trimmedJustification = voteJustification.trim();
    if (!trimmedJustification || trimmedJustification.length < 10) {
      setErrorMessage('La fundamentación de su voto es obligatoria y debe contener al menos 10 caracteres.');
      return;
    }

    try {
      const result = ccbService.registerVote(
        {
          sessionId: session.id,
          decision: voteDecision,
          justification: trimmedJustification,
        },
        currentUser
      );

      setVotes(ccbService.getVotesBySessionId(session.id));
      setTally(result.tally);
      setSession(result.session);
      setSuccessMessage(`Su voto (${result.vote.decision}) fue registrado formalmente con identificador ${result.vote.id}.`);
      setVoteJustification('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al registrar el voto en el comité.');
    }
  };

  // Handler para guardar borrador de acta
  const handleSaveDraftResolution = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!session || !currentUser) return;

    try {
      const result = ccbService.generateDraftResolution(
        {
          sessionId: session.id,
          resolution: 'PENDIENTE',
          justification: observations,
        },
        currentUser
      );
      setResolution(result.resolution);
      setSuccessMessage(`Borrador de acta ${result.resolution.id} actualizado con el conteo de votos.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al actualizar el borrador de acta.');
    }
  };

  // Handler para formalización definitiva (demostración de la salvaguarda de gobernanza)
  const handleTryFinalize = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!session || !currentUser) return;

    try {
      ccbService.finalizeResolution(session.id, currentUser);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error de gobernanza.');
    }
  };

  // Pantalla de error de precondición inicial
  if (!rfc || errorMessage && !session) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in py-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rfcs')}
            className="p-2 text-upt-muted hover:text-upt-text hover:bg-upt-bg rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-upt-primary">Sala de Deliberación CCB</h1>
            <p className="text-xs text-upt-muted">Comité de Control de Cambios</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Expediente no elegible para Deliberación del CCB</h3>
              <p className="text-xs leading-relaxed text-amber-900">{errorMessage}</p>
            </div>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <Link
              to="/rfcs"
              className="px-4 py-2 bg-white text-xs font-semibold text-upt-text border border-amber-300 rounded-lg hover:bg-amber-100/50 transition-colors"
            >
              Volver a la Bandeja de Solicitudes
            </Link>
            {rfc && (
              <Link
                to={`/rfcs/${rfc.id}`}
                className="px-4 py-2 bg-purple-700 text-xs font-semibold text-white rounded-lg hover:bg-purple-800 transition-colors"
              >
                Ver Expediente {rfc.code}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in py-4">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-upt-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/rfcs/${rfc.id}`)}
            className="p-2 text-upt-muted hover:text-upt-text hover:bg-upt-bg rounded-lg transition-colors shrink-0"
            title="Volver al Expediente"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-upt-primary bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                {rfc.code}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                CAMBIO MAYOR
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono">
                {session?.id || 'Sesión CCB'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-upt-primary mt-1">
              Sala de Deliberación y Votación Colegiada
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to={`/rfcs/${rfc.id}`}
            className="px-3 py-1.5 rounded-lg border border-upt-border text-xs font-semibold text-upt-text hover:bg-upt-bg transition-colors"
          >
            Ver Expediente
          </Link>
        </div>
      </div>

      {/* Banner de mensajes de éxito o error */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-950 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alerta de cambio reescalado desde CU-30 (si aplica) */}
      {reescalationRecord && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-1 text-amber-950 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Solicitud Reescalada formalmente a Cambio Mayor</span>
          </div>
          <p className="leading-relaxed text-amber-900">
            Esta solicitud inició originalmente como Cambio Menor, pero fue reescalada por la Autoridad Delegada (
            {reescalationRecord.userName}) por no reunir los criterios de bajo riesgo. El expediente fue elevado al CCB
            para evaluación colegiada integral.
          </p>
          <p className="italic text-amber-800 pt-1 font-mono text-[11px]">
            Motivo de reescalamiento: "{reescalationRecord.justification}"
          </p>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECCIÓN A: EXPEDIENTE Y RESUMEN EJECUTIVO */}
      {/* ===================================================================== */}
      <div className="p-5 rounded-2xl bg-white border border-upt-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-upt-border pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-700" />
            <h3 className="text-sm font-bold text-upt-primary">Sección A — Expediente del Cambio</h3>
          </div>
          <span className="text-xs font-mono text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
            Estado: {rfc.status}
          </span>
        </div>

        <div className="space-y-2">
          <h4 className="text-base font-bold text-upt-text">{rfc.title}</h4>
          <p className="text-xs text-upt-text-secondary leading-relaxed bg-upt-bg/40 p-3 rounded-xl border border-upt-border/60">
            {rfc.description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-upt-border/60 font-mono">
          <div>
            <span className="text-upt-muted block text-[11px]">Proyecto:</span>
            <span className="font-semibold text-upt-text flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
              {rfc.projectName} ({rfc.projectId})
            </span>
          </div>
          <div>
            <span className="text-upt-muted block text-[11px]">Solicitante:</span>
            <span className="font-semibold text-upt-text">{rfc.requesterName}</span>
          </div>
          <div>
            <span className="text-upt-muted block text-[11px]">Elemento de Configuración (ECS):</span>
            <span className="font-semibold text-purple-900 flex items-center gap-1.5 mt-0.5">
              <Layers className="w-3.5 h-3.5 text-purple-700" />
              {rfc.affectedEcsName}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECCIÓN B: INFORME TÉCNICO DE IMPACTO (ARQUITECTURA) */}
      {/* ===================================================================== */}
      {report && (
        <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-upt-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-700" />
              <div>
                <h3 className="text-sm font-bold text-upt-primary">Sección B — Informe Técnico de Impacto</h3>
                <p className="text-[11px] text-upt-muted">Dictamen emitido por Arquitectura ({report.id})</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-0.5 rounded bg-purple-100 text-purple-900 font-bold border border-purple-200">
                Riesgo: {report.technicalRisk}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                {report.recommendation}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold text-upt-primary block">Resumen de Evaluación Técnica:</span>
            <p className="text-xs text-upt-text-secondary leading-relaxed bg-purple-50/40 p-3 rounded-xl border border-purple-100">
              {report.technicalSummary}
            </p>
          </div>

          {/* Métricas de Triple Restricción */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
              <span className="text-upt-muted text-[11px] block">Esfuerzo Estimado</span>
              <span className="text-sm font-bold text-upt-primary font-mono">{report.estimatedEffortHours} horas</span>
            </div>
            <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
              <span className="text-upt-muted text-[11px] block">Presupuesto Estimado</span>
              <span className="text-sm font-bold text-emerald-800 font-mono">S/. {report.estimatedCost.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-upt-bg/50 border border-upt-border">
              <span className="text-upt-muted text-[11px] block">Afectación de Plazo</span>
              <span className="text-sm font-bold text-amber-900 font-mono">+{report.estimatedDurationDays} días</span>
            </div>
          </div>

          {/* Riesgos Identificados */}
          {report.identifiedRisks && report.identifiedRisks.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-upt-primary block">Riesgos Técnicos y Operativos:</span>
              <ul className="list-disc list-inside text-xs text-upt-text-secondary space-y-1 bg-white p-3 rounded-xl border border-upt-border">
                {report.identifiedRisks.map((risk, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECCIÓN C: INTEGRANTES AUTORIZADOS DEL COMITÉ */}
      {/* ===================================================================== */}
      <div className="p-5 rounded-2xl bg-white border border-upt-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-upt-border pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-700" />
            <div>
              <h3 className="text-sm font-bold text-upt-primary">Sección C — Integrantes del Comité CCB</h3>
              <p className="text-[11px] text-upt-muted">Cuentas activas registradas con rol PU-04 para este proyecto</p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
            {members.length} Miembro(s) Registrado(s)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {members.map((member) => {
            const memberVoted = votes.some((v) => v.voterUserId === member.id);
            return (
              <div
                key={member.id}
                className="p-3.5 rounded-xl border border-upt-border bg-upt-bg/30 flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-upt-text block">{member.fullName}</span>
                  <span className="text-[11px] text-upt-muted block">{member.roleLabel}</span>
                  <span className="text-[10px] font-mono text-purple-800 font-semibold">{member.id}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    memberVoted
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  {memberVoted ? 'VOTÓ' : 'PENDIENTE'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <span>
            <strong>Observación de Catálogo Demostrativo:</strong> En la configuración actual del prototipo figura 1
            integrante con rol PU-04 activo para este proyecto. Las especificaciones de quórum y mayoría están en
            proceso de regulación formal.
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECCIÓN D: EMISIÓN DEL VOTO INDIVIDUAL */}
      {/* ===================================================================== */}
      <div className="p-5 rounded-2xl bg-white border border-purple-300 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-upt-border pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-700" />
            <div>
              <h3 className="text-sm font-bold text-upt-primary">Sección D — Registro de Decisión Individual</h3>
              <p className="text-[11px] text-upt-muted">Voto del integrante autenticado en el Comité CCB</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
            Votante: {currentUser?.fullName || 'Desconocido'} ({activeRoleId || 'Sin rol'})
          </span>
        </div>

        {/* Verificaciones SoD y restricciones para votar */}
        {!isCcbMember ? (
          <div className="p-4 rounded-xl bg-upt-bg border border-upt-border text-xs text-upt-muted space-y-1">
            <span className="font-bold text-upt-text block">Atribución Restringida</span>
            <p>
              Su rol actual ({activeRoleId || 'Sin rol'}) no posee facultades para emitir votos en el Comité de Control
              de Cambios. Esta acción está reservada al rol PU-04.
            </p>
          </div>
        ) : !hasProjectAccess ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
            <span className="font-bold block">Aislamiento por Proyecto</span>
            <p>Usted no tiene asignado el proyecto ({rfc.projectId}) correspondiente a esta solicitud de cambio.</p>
          </div>
        ) : isSelfRequester ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <span className="font-bold block flex items-center gap-1.5 text-amber-900">
              <Lock className="w-4 h-4" /> Segregación SoD: Conflicto de Interés (RN-01)
            </span>
            <p>
              Usted es el solicitante original de este requerimiento y tiene prohibido votar en el comité sobre su propia
              solicitud.
            </p>
          </div>
        ) : hasAlreadyVoted ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 text-emerald-950">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Voto Individual Ya Registrado
              </span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                {userExistingVote?.decision}
              </span>
            </div>
            <p className="italic text-emerald-900 bg-white/70 p-2.5 rounded-lg border border-emerald-200">
              "{userExistingVote?.justification}"
            </p>
            <span className="text-[10px] text-emerald-800 font-mono block">
              Registrado: {userExistingVote?.votedAt ? new Date(userExistingVote.votedAt).toLocaleString('es-PE') : '--'}
            </span>
          </div>
        ) : (
          /* Formulario activo de votación */
          <form onSubmit={handleRegisterVote} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-upt-primary block">Seleccione su Decisión Formal:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    voteDecision === 'APROBAR'
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300'
                      : 'bg-white border-upt-border hover:bg-upt-bg/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      APROBAR CAMBIO
                    </span>
                    <input
                      type="radio"
                      name="decision"
                      value="APROBAR"
                      checked={voteDecision === 'APROBAR'}
                      onChange={() => setVoteDecision('APROBAR')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-emerald-800 leading-tight">
                    Dictamen favorable para formalizar la Orden ECN.
                  </span>
                </label>

                <label
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    voteDecision === 'RECHAZAR'
                      ? 'bg-red-50 border-red-400 ring-2 ring-red-300'
                      : 'bg-white border-upt-border hover:bg-upt-bg/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-950 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-600" />
                      RECHAZAR CAMBIO
                    </span>
                    <input
                      type="radio"
                      name="decision"
                      value="RECHAZAR"
                      checked={voteDecision === 'RECHAZAR'}
                      onChange={() => setVoteDecision('RECHAZAR')}
                      className="text-red-600 focus:ring-red-500"
                    />
                  </div>
                  <span className="text-[11px] text-red-800 leading-tight">
                    Inviable por costo, plazo, riesgo o desalineación.
                  </span>
                </label>

                <label
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    voteDecision === 'ABSTENCION'
                      ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-300'
                      : 'bg-white border-upt-border hover:bg-upt-bg/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
                      <MinusCircle className="w-4 h-4 text-gray-600" />
                      ABSTENCIÓN
                    </span>
                    <input
                      type="radio"
                      name="decision"
                      value="ABSTENCION"
                      checked={voteDecision === 'ABSTENCION'}
                      onChange={() => setVoteDecision('ABSTENCION')}
                      className="text-gray-600 focus:ring-gray-500"
                    />
                  </div>
                  <span className="text-[11px] text-gray-700 leading-tight">
                    Abstención fundamentada sin cómputo de voto dirimente.
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-upt-primary block">
                Fundamentación Formal del Voto (Obligatorio, mínimo 10 caracteres):
              </label>
              <textarea
                value={voteJustification}
                onChange={(e) => setVoteJustification(e.target.value)}
                placeholder="Describa el sustento estratégico, técnico o contractual de su voto..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-upt-border focus:outline-none focus:ring-2 focus:ring-purple-400 font-sans"
              />
              <span className="text-[11px] text-upt-muted font-mono block">
                Caracteres ingresados: {voteJustification.trim().length} / mínimo 10
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={voteJustification.trim().length < 10}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Registrar Mi Voto en Sesión
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ===================================================================== */}
      {/* SECCIÓN E: ESCRUTINIO, VOTOS EMITIDOS Y ACTA RESOLUTIVA */}
      {/* ===================================================================== */}
      <div className="p-5 rounded-2xl bg-white border border-upt-border shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-upt-border pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-700" />
            <div>
              <h3 className="text-sm font-bold text-upt-primary">Sección E — Escrutinio y Acta de Sesión</h3>
              <p className="text-[11px] text-upt-muted">Conteo de votos emitidos y borrador de acta formal</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {tally.approve} Favor
            </span>
            <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
              {tally.reject} Contra
            </span>
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
              {tally.abstain} Abst.
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
              {tally.total} Total
            </span>
          </div>
        </div>

        {/* Tabla de Votos Registrados */}
        {votes.length === 0 ? (
          <div className="p-6 rounded-xl bg-upt-bg/40 border border-upt-border text-center text-xs text-upt-muted space-y-1">
            <Clock className="w-6 h-6 text-upt-muted mx-auto" />
            <p className="font-semibold text-upt-text">Aún no se han emitido votos en esta sesión</p>
            <p>Los integrantes autorizados del CCB formularán sus decisiones en este panel.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="text-xs font-bold text-upt-primary block">Votos Registrados en el Acta:</span>
            <div className="space-y-2">
              {votes.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl border border-upt-border bg-white space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-upt-text">{v.voterUserName}</span>
                      <span className="text-[10px] font-mono text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {v.voterRoleId}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        v.decision === 'APROBAR'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : v.decision === 'RECHAZAR'
                          ? 'bg-red-100 text-red-900 border border-red-200'
                          : 'bg-gray-100 text-gray-900 border border-gray-200'
                      }`}
                    >
                      {v.decision}
                    </span>
                  </div>
                  <p className="text-xs text-upt-text-secondary italic bg-upt-bg/30 p-2 rounded-lg border border-upt-border/60">
                    "{v.justification}"
                  </p>
                  <span className="text-[10px] text-upt-muted font-mono block">
                    ID: {v.id} | Fecha: {new Date(v.votedAt).toLocaleString('es-PE')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Borrador de Acta y Salvaguarda de Gobernanza */}
        <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-950 block">Borrador de Acta Resolutiva del CCB</span>
            <span className="text-[10px] font-mono font-bold bg-white text-purple-900 px-2.5 py-0.5 rounded border border-purple-300">
              {resolution?.id || 'ACTA-BORRADOR'}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-purple-900 block">Observaciones y Acuerdos de Sesión:</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
            />
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveDraftResolution}
              disabled={!isCcbMember}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-purple-300 text-purple-900 hover:bg-purple-100/50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Guardar Borrador de Acta
            </button>

            {/* Aviso de Gobernanza Administrativa */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTryFinalize}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Emitir Resolución Definitiva
              </button>
            </div>
          </div>

          {/* Cartel Administrativo de Gobernanza */}
          <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-950 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Aviso de Gobernanza Colegiada:</strong> La formalización definitiva de la resolución del CCB y su
              transición automática a estado de cierre se encuentra salvaguardada a la espera de la reglamentación
              corporativa de cuórum y mayorías por la Dirección del Proyecto. Los votos y el borrador de acta se
              mantienen debidamente custodiados en el sistema bajo el estado <strong>En Evaluación</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
