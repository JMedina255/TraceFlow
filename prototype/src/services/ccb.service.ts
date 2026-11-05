import type {
  CcbSession,
  CcbVote,
  CcbResolution,
  CcbVoteTally,
  OpenCcbSessionDTO,
  RegisterCcbVoteDTO,
  GenerateCcbResolutionDTO,
  User,
  RFC,
  UserAccount,
} from '../types';
import { storageService } from './storage.service';
import { authService } from './auth.service';
import { rfcService } from './rfc.service';
import { impactAnalysisService } from './impactAnalysis.service';
import { auditService } from './audit.service';

const SESSIONS_STORAGE_KEY = 'ccb_sessions';
const VOTES_STORAGE_KEY = 'ccb_votes';
const RESOLUTIONS_STORAGE_KEY = 'ccb_resolutions';

export const ccbService = {
  /**
   * Consulta las sesiones CCB registradas.
   */
  getSessions(projectId?: string): CcbSession[] {
    const all = storageService.get<CcbSession[]>(SESSIONS_STORAGE_KEY, []);
    if (!projectId) return all;
    return all.filter((s) => s.projectId === projectId);
  },

  /**
   * Obtiene una sesión por su ID correlativo o por ID de la RFC.
   */
  getSessionById(sessionId: string): CcbSession | undefined {
    const all = this.getSessions();
    return all.find((s) => s.id === sessionId);
  },

  /**
   * Obtiene la sesión activa o histórica vinculada a una RFC.
   */
  getSessionByRfcId(rfcId: string): CcbSession | undefined {
    const all = this.getSessions();
    return all.find((s) => s.rfcId === rfcId);
  },

  /**
   * Consulta los integrantes autorizados del Comité CCB (PU-04) activos en el sistema,
   * opcionalmente filtrados por proyecto asignado.
   */
  getAuthorizedMembers(projectId?: string): UserAccount[] {
    const accounts = authService.getAccounts();
    return accounts.filter((account) => {
      const isCcbMember = account.assignedRoleIds.includes('PU-04') && account.isActive;
      if (!isCcbMember) return false;
      if (projectId) {
        return account.assignedProjectIds.includes(projectId);
      }
      return true;
    });
  },

  /**
   * Genera el siguiente identificador correlativo para sesión CCB (ej. "CCB-2026-0001").
   */
  generateNextSessionId(): string {
    const sessions = this.getSessions();
    const prefix = 'CCB-2026-';
    let max = 0;
    for (const s of sessions) {
      if (s.id.startsWith(prefix)) {
        const num = parseInt(s.id.slice(prefix.length), 10);
        if (!isNaN(num) && num > max) max = num;
      }
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  },

  /**
   * Genera el siguiente identificador correlativo para voto individual (ej. "VOTE-2026-0001").
   */
  generateNextVoteId(): string {
    const votes = storageService.get<CcbVote[]>(VOTES_STORAGE_KEY, []);
    const prefix = 'VOTE-2026-';
    let max = 0;
    for (const v of votes) {
      if (v.id.startsWith(prefix)) {
        const num = parseInt(v.id.slice(prefix.length), 10);
        if (!isNaN(num) && num > max) max = num;
      }
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  },

  /**
   * Genera el siguiente identificador correlativo para acta resolutiva (ej. "ACTA-2026-0001").
   */
  generateNextResolutionId(): string {
    const resolutions = storageService.get<CcbResolution[]>(RESOLUTIONS_STORAGE_KEY, []);
    const prefix = 'ACTA-2026-';
    let max = 0;
    for (const r of resolutions) {
      if (r.id.startsWith(prefix)) {
        const num = parseInt(r.id.slice(prefix.length), 10);
        if (!isNaN(num) && num > max) max = num;
      }
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  },

  /**
   * CU-07: Convocatoria y Apertura de Sesión de Deliberación Colegiada del CCB.
   * Precondición: RFC en EN_EVALUACION con clasificación CAMBIO_MAYOR e informe técnico emitido.
   */
  openSession(
    dto: OpenCcbSessionDTO,
    user: User
  ): { session: CcbSession; updatedRfc: RFC } {
    // 1. Verificación SoD: Solo integrantes del CCB (PU-04) pueden aperturar sesiones colegiadas de evaluación
    if (!authService.isActionAuthorized(user.roleId, 'EVALUAR_CCB')) {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' (${user.roleId}) no posee facultades para convocar o presidir sesiones del Comité de Control de Cambios. Acción reservada a Miembros del CCB (PU-04) conforme a CU-07.`
      );
    }

    // 2. Localización y verificación de existencia del expediente
    const rfc = rfcService.getById(dto.rfcId);
    if (!rfc) {
      throw new Error(`Solicitud de cambio no encontrada: '${dto.rfcId}'.`);
    }

    // 3. Aislamiento multitenant por proyecto
    if (!user.assignedProjectIds.includes(rfc.projectId)) {
      throw new Error(
        `Acceso restringido por proyecto: El usuario '${user.fullName}' no tiene asignado el proyecto '${rfc.projectId}' de la solicitud ${rfc.code}.`
      );
    }

    // 4. Precondición de ciclo de vida normativo (TB-07 Estado 5)
    if (rfc.status !== 'EN_EVALUACION') {
      throw new Error(
        `Transición inválida: La solicitud ${rfc.code} se encuentra en estado '${rfc.status}'. La deliberación del CCB exige que el expediente se encuentre en estado canónico 'EN_EVALUACION'.`
      );
    }

    // 5. Precondición de clasificación: Exclusivo para CAMBIO_MAYOR (CU-07 vs CU-30)
    if (rfc.classification !== 'CAMBIO_MAYOR') {
      throw new Error(
        `Operación inválida: La solicitud ${rfc.code} está clasificada como '${rfc.classification || 'SIN_CLASIFICAR'}'. La deliberación del CCB aplica exclusivamente a solicitudes dictaminadas como CAMBIO_MAYOR.`
      );
    }

    // 6. Precondición técnica: Exigencia de Informe Técnico de Impacto emitido (RN-05)
    if (!rfc.impactAnalysisId) {
      throw new Error(
        `Requisito normativo insatisfecho (RN-05): La solicitud ${rfc.code} carece de Informe Técnico de Impacto emitido por Arquitectura.`
      );
    }
    const report = impactAnalysisService.getById(rfc.impactAnalysisId);
    if (!report) {
      throw new Error(
        `Inconsistencia documental: No se localizó el informe técnico '${rfc.impactAnalysisId}' asociado a la solicitud ${rfc.code}.`
      );
    }

    // 7. Retorno idempotente si ya existe una sesión abierta o en curso para esta RFC
    const existing = this.getSessionByRfcId(rfc.id);
    if (existing) {
      return { session: existing, updatedRfc: rfc };
    }

    // 8. Construcción de nueva sesión
    const newSession: CcbSession = {
      id: this.generateNextSessionId(),
      rfcId: rfc.id,
      rfcCode: rfc.code,
      projectId: rfc.projectId,
      impactReportId: report.id,
      convenedBy: user.id,
      convenedByName: user.fullName,
      openedAt: new Date().toISOString(),
      status: 'ABIERTA',
      participants: [user.id],
    };

    // 9. Persistencia de sesión
    const allSessions = storageService.get<CcbSession[]>(SESSIONS_STORAGE_KEY, []);
    allSessions.unshift(newSession);
    storageService.set(SESSIONS_STORAGE_KEY, allSessions);

    // 10. Actualización referencial en RFC
    const allRfcs = storageService.get<RFC[]>('rfcs', []);
    const rfcIndex = allRfcs.findIndex((r) => r.id === rfc.id);
    let updatedRfc = rfc;
    if (rfcIndex >= 0) {
      allRfcs[rfcIndex] = {
        ...allRfcs[rfcIndex],
        ccbSessionId: newSession.id,
        updatedAt: new Date().toISOString(),
      };
      storageService.set('rfcs', allRfcs);
      updatedRfc = allRfcs[rfcIndex];
    }

    // 11. Auditoría demostrativa
    auditService.record({
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      action: 'CCB_SESION_INICIADA',
      entityType: 'RFC',
      entityId: rfc.id,
      details: `Apertura formal de sesión de deliberación colegiada ${newSession.id} del Comité CCB para la solicitud ${rfc.code}.`,
      ipAddress: '127.0.0.1 (Local Session)',
    });

    return { session: newSession, updatedRfc };
  },

  /**
   * Consulta todos los votos emitidos en una sesión formal del CCB.
   */
  getVotesBySessionId(sessionId: string): CcbVote[] {
    const allVotes = storageService.get<CcbVote[]>(VOTES_STORAGE_KEY, []);
    return allVotes.filter((v) => v.sessionId === sessionId);
  },

  /**
   * Calcula el escrutinio / conteo consolidado de votos de una sesión.
   */
  getVoteTally(sessionId: string): CcbVoteTally {
    const votes = this.getVotesBySessionId(sessionId);
    const tally: CcbVoteTally = {
      approve: 0,
      reject: 0,
      abstain: 0,
      total: votes.length,
    };

    for (const v of votes) {
      if (v.decision === 'APROBAR') tally.approve++;
      else if (v.decision === 'RECHAZAR') tally.reject++;
      else if (v.decision === 'ABSTENCION') tally.abstain++;
    }

    return tally;
  },

  /**
   * CU-07: Registrar Voto Individual Fundamentado de un Miembro del CCB.
   * Exclusivo para usuarios autenticados con rol PU-04 y asignados al proyecto.
   */
  registerVote(
    dto: RegisterCcbVoteDTO,
    user: User
  ): { vote: CcbVote; session: CcbSession; tally: CcbVoteTally } {
    // 1. Verificación SoD: Solo miembros del CCB (PU-04) pueden emitir votos
    if (!authService.isActionAuthorized(user.roleId, 'EVALUAR_CCB')) {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' (${user.roleId}) no posee facultades para emitir votos en el Comité de Control de Cambios (CU-07). Acción exclusiva de PU-04 conforme a TB-09.`
      );
    }

    // 2. Verificar existencia de la sesión CCB
    const session = this.getSessionById(dto.sessionId);
    if (!session) {
      throw new Error(`Sesión de deliberación CCB no encontrada: '${dto.sessionId}'.`);
    }

    if (session.status === 'CERRADA') {
      throw new Error(
        `Operación inválida: La sesión ${session.id} se encuentra cerrada y no admite nuevos votos.`
      );
    }

    // 3. Localizar la RFC
    const rfc = rfcService.getById(session.rfcId);
    if (!rfc) {
      throw new Error(`Solicitud de cambio no encontrada para la sesión: '${session.rfcId}'.`);
    }

    // 4. Aislamiento multitenant por proyecto
    if (!user.assignedProjectIds.includes(rfc.projectId)) {
      throw new Error(
        `Acceso restringido por proyecto: El usuario '${user.fullName}' no tiene asignado el proyecto '${rfc.projectId}' correspondiente a la sesión CCB.`
      );
    }

    // 5. Segregación SoD anti-autoevaluación (RN-01 / RN-03)
    if (rfc.requesterId === user.id) {
      throw new Error(
        `Operación denegada (SoD): El usuario '${user.fullName}' (${user.id}) es el solicitante original de ${rfc.code} y tiene prohibido votar en el CCB sobre su propio requerimiento conforme a RN-01.`
      );
    }

    // 6. Verificación de pertenencia activa al Comité CCB
    const accounts = authService.getAccounts();
    const currentAccount = accounts.find((a) => a.id === user.id);
    if (!currentAccount || !currentAccount.assignedRoleIds.includes('PU-04') || !currentAccount.isActive) {
      throw new Error(
        `Identidad no autorizada: La cuenta '${user.fullName}' (${user.id}) no figura como integrante activo del Comité CCB.`
      );
    }

    // 7. Prevención estricta de votos duplicados por la misma identidad física
    const existingVotes = this.getVotesBySessionId(session.id);
    const alreadyVoted = existingVotes.find((v) => v.voterUserId === user.id);
    if (alreadyVoted) {
      throw new Error(
        `Voto duplicado: El integrante '${user.fullName}' ya ha registrado su voto (${alreadyVoted.decision}) para la sesión ${session.id}. Cada miembro puede votar una única vez.`
      );
    }

    // 8. Validación de opciones válidas de decisión
    const validDecisions: CcbVote['decision'][] = ['APROBAR', 'RECHAZAR', 'ABSTENCION'];
    if (!validDecisions.includes(dto.decision)) {
      throw new Error(
        `Decisión de voto inválida: '${dto.decision}'. Opciones válidas: APROBAR, RECHAZAR, ABSTENCION.`
      );
    }

    // 9. Validación cualitativa de fundamentación obligatoria
    const justification = (dto.justification || '').trim();
    if (!justification || justification.length < 10) {
      throw new Error(
        'La fundamentación del voto es obligatoria y debe contener al menos 10 caracteres descriptivos.'
      );
    }

    // 10. Construcción del registro de voto individual
    const newVote: CcbVote = {
      id: this.generateNextVoteId(),
      sessionId: session.id,
      rfcId: rfc.id,
      voterUserId: user.id,
      voterUserName: user.fullName,
      voterRoleId: 'PU-04',
      decision: dto.decision,
      justification,
      votedAt: new Date().toISOString(),
    };

    // 11. Persistencia del voto
    const allVotes = storageService.get<CcbVote[]>(VOTES_STORAGE_KEY, []);
    allVotes.unshift(newVote);
    storageService.set(VOTES_STORAGE_KEY, allVotes);

    // 12. Actualización de la sesión a estado EN_DELIBERACION y agregado de participantes
    const allSessions = storageService.get<CcbSession[]>(SESSIONS_STORAGE_KEY, []);
    const sIdx = allSessions.findIndex((s) => s.id === session.id);
    let updatedSession = session;
    if (sIdx >= 0) {
      const parts = new Set(allSessions[sIdx].participants);
      parts.add(user.id);
      allSessions[sIdx] = {
        ...allSessions[sIdx],
        status: 'EN_DELIBERACION',
        participants: Array.from(parts),
      };
      storageService.set(SESSIONS_STORAGE_KEY, allSessions);
      updatedSession = allSessions[sIdx];
    }

    // 13. Auditoría demostrativa
    auditService.record({
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      action: 'CCB_VOTO_REGISTRADO',
      entityType: 'RFC',
      entityId: rfc.id,
      details: `Emisión de voto ${newVote.decision} por el miembro CCB ${user.fullName} en sesión ${session.id} (Voto ${newVote.id}).`,
      ipAddress: '127.0.0.1 (Local Session)',
    });

    const tally = this.getVoteTally(session.id);
    return { vote: newVote, session: updatedSession, tally };
  },

  /**
   * Consulta el acta o resolución formal de una sesión.
   */
  getResolutionBySessionId(sessionId: string): CcbResolution | undefined {
    const all = storageService.get<CcbResolution[]>(RESOLUTIONS_STORAGE_KEY, []);
    return all.find((r) => r.sessionId === sessionId);
  },

  /**
   * Genera o actualiza el borrador de acta de deliberación formal del CCB.
   */
  generateDraftResolution(
    dto: GenerateCcbResolutionDTO,
    user: User
  ): { resolution: CcbResolution; session: CcbSession } {
    // 1. Verificación SoD: Solo PU-04 puede gestionar actas del CCB
    if (!authService.isActionAuthorized(user.roleId, 'EVALUAR_CCB')) {
      throw new Error(
        `Operación denegada (SoD): El rol '${user.roleLabel}' (${user.roleId}) no posee facultades para confeccionar actas del CCB.`
      );
    }

    const session = this.getSessionById(dto.sessionId);
    if (!session) {
      throw new Error(`Sesión de deliberación CCB no encontrada: '${dto.sessionId}'.`);
    }

    const rfc = rfcService.getById(session.rfcId);
    if (!rfc) {
      throw new Error(`Solicitud de cambio no encontrada para la sesión: '${session.rfcId}'.`);
    }

    if (!user.assignedProjectIds.includes(rfc.projectId)) {
      throw new Error(`Acceso denegado: El usuario no tiene asignado el proyecto '${rfc.projectId}'.`);
    }

    const votes = this.getVotesBySessionId(session.id);
    const tally = this.getVoteTally(session.id);

    const justification = (dto.justification || '').trim();
    if (!justification || justification.length < 10) {
      throw new Error('Las observaciones del acta de sesión deben contener al menos 10 caracteres descriptivos.');
    }

    const allResolutions = storageService.get<CcbResolution[]>(RESOLUTIONS_STORAGE_KEY, []);
    const existingIndex = allResolutions.findIndex((r) => r.sessionId === session.id);

    const resolution: CcbResolution = {
      id: existingIndex >= 0 ? allResolutions[existingIndex].id : this.generateNextResolutionId(),
      sessionId: session.id,
      rfcId: rfc.id,
      rfcCode: rfc.code,
      projectId: rfc.projectId,
      votes,
      tally,
      resolution: dto.resolution,
      justification,
      issuedBy: user.id,
      issuedByName: user.fullName,
      issuedAt: new Date().toISOString(),
      status: 'BORRADOR',
    };

    if (existingIndex >= 0) {
      allResolutions[existingIndex] = resolution;
    } else {
      allResolutions.unshift(resolution);
    }
    storageService.set(RESOLUTIONS_STORAGE_KEY, allResolutions);

    // Auditoría demostrativa
    auditService.record({
      userId: user.id,
      userName: user.fullName,
      userRole: user.roleLabel,
      action: 'CCB_ACTA_GENERADA',
      entityType: 'RFC',
      entityId: rfc.id,
      details: `Generación de borrador de acta ${resolution.id} para sesión ${session.id} (Dictamen propuesto: ${resolution.resolution}).`,
      ipAddress: '127.0.0.1 (Local Session)',
    });

    return { resolution, session };
  },

  /**
   * Intento de cierre y formalización definitiva de la resolución del CCB.
   *
   * SALVAGUARDA NORMATIVA:
   * Conforme al análisis documental (docs/refactor/CCB_GOVERNANCE_REVIEW.md),
   * no existe una regla legal aprobada de cuórum mínimo ni porcentaje de mayoría.
   * Por tanto, esta operación bloquea la emisión definitiva automática y mantiene
   * la RFC en estado 'EN_EVALUACION' hasta que la Dirección del Proyecto apruebe
   * la norma de gobernanza aplicable.
   */
  finalizeResolution(
    sessionId: string,
    user: User
  ): never {
    if (!authService.isActionAuthorized(user.roleId, 'EVALUAR_CCB')) {
      throw new Error(`Operación denegada (SoD): Exclusivo para Miembros del CCB (PU-04).`);
    }

    const session = this.getSessionById(sessionId);
    if (!session) {
      throw new Error(`Sesión de deliberación CCB no encontrada: '${sessionId}'.`);
    }

    throw new Error(
      `Bloqueo normativo de gobernanza: La formalización y cierre definitivo de resoluciones del CCB se encuentra pendiente de definición y aprobación reglamentaria de cuórum y mayorías por la Dirección del Proyecto. El expediente y los votos permanecen registrados en estado EN_EVALUACION bajo el borrador de acta ${session.id}.`
    );
  },
};
