import type { RFC, RFCStatus } from '../types';
import { INITIAL_RFCS } from '../data/initialRfcs';
import { storageService } from './storage.service';

const STORAGE_KEY = 'rfcs';

// Matriz oficial de transiciones de estados derivada de DG-11 y TB-07
const ALLOWED_TRANSITIONS: Record<RFCStatus, RFCStatus[]> = {
  REGISTRADA: ['CLASIFICADA', 'EN_SUBSANACION', 'DESESTIMADA'],
  EN_SUBSANACION: ['CLASIFICADA', 'DESESTIMADA'],
  CLASIFICADA: ['EN_ANALISIS_TECNICO'],
  EN_ANALISIS_TECNICO: ['EN_EVALUACION'],
  EN_EVALUACION: ['AUTORIZADA', 'RECHAZADA'],
  AUTORIZADA: ['ORDEN_EMITIDA'],
  ORDEN_EMITIDA: ['EN_IMPLEMENTACION'],
  EN_IMPLEMENTACION: ['EN_PRUEBAS'],
  EN_PRUEBAS: ['EN_ACEPTACION', 'EN_IMPLEMENTACION', 'CANCELADA'],
  EN_ACEPTACION: ['IMPLEMENTADA', 'CANCELADA'],
  DESESTIMADA: [],
  RECHAZADA: [],
  CANCELADA: [],
  IMPLEMENTADA: [],
};

export const rfcService = {
  getAll(projectId?: string): RFC[] {
    const all = storageService.get<RFC[]>(STORAGE_KEY, INITIAL_RFCS);
    if (!projectId) return all;
    return all.filter((r) => r.projectId === projectId);
  },

  getById(id: string): RFC | undefined {
    const all = this.getAll();
    return all.find((r) => r.id === id);
  },

  isTransitionAllowed(fromStatus: RFCStatus, toStatus: RFCStatus): boolean {
    const targets = ALLOWED_TRANSITIONS[fromStatus];
    return targets ? targets.includes(toStatus) : false;
  },

  getAvailableTransitions(currentStatus: RFCStatus): RFCStatus[] {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  },
};
