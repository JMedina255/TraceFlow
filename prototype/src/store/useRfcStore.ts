import { create } from 'zustand';
import type { RFC, CreateRfcDTO, SubsanarRfcDTO, User } from '../types';
import { INITIAL_RFCS } from '../data/initialRfcs';
import { storageService } from '../services/storage.service';
import { rfcService } from '../services/rfc.service';

interface RfcState {
  rfcs: RFC[];
  getRfcsByProject: (projectId: string) => RFC[];
  getRfcById: (rfcId: string) => RFC | undefined;
  reloadRfcs: () => void;
  createRfc: (dto: CreateRfcDTO, user: User) => RFC;
  admitRfc: (rfcId: string, notes: string, user: User) => RFC;
  observeRfc: (rfcId: string, observations: string, user: User) => RFC;
  dismissRfc: (rfcId: string, reason: string, user: User) => RFC;
  subsanarRfc: (rfcId: string, dto: SubsanarRfcDTO, user: User) => RFC;
}

const STORAGE_KEY_RFCS = 'rfcs';

const loadRfcs = (): RFC[] => {
  return storageService.get<RFC[]>(STORAGE_KEY_RFCS, INITIAL_RFCS);
};

export const useRfcStore = create<RfcState>((set, get) => ({
  rfcs: loadRfcs(),

  getRfcsByProject: (projectId: string) => {
    return get().rfcs.filter((r) => r.projectId === projectId);
  },

  getRfcById: (rfcId: string) => {
    return get().rfcs.find((r) => r.id === rfcId || r.code === rfcId);
  },

  reloadRfcs: () => {
    set({ rfcs: loadRfcs() });
  },

  createRfc: (dto: CreateRfcDTO, user: User) => {
    const newRfc = rfcService.create(dto, user);
    set((state) => ({ rfcs: [newRfc, ...state.rfcs] }));
    return newRfc;
  },

  admitRfc: (rfcId: string, notes: string, user: User) => {
    const updated = rfcService.admit(rfcId, notes, user);
    set((state) => ({
      rfcs: state.rfcs.map((r) => (r.id === updated.id ? updated : r)),
    }));
    return updated;
  },

  observeRfc: (rfcId: string, observations: string, user: User) => {
    const updated = rfcService.observe(rfcId, observations, user);
    set((state) => ({
      rfcs: state.rfcs.map((r) => (r.id === updated.id ? updated : r)),
    }));
    return updated;
  },

  dismissRfc: (rfcId: string, reason: string, user: User) => {
    const updated = rfcService.dismiss(rfcId, reason, user);
    set((state) => ({
      rfcs: state.rfcs.map((r) => (r.id === updated.id ? updated : r)),
    }));
    return updated;
  },

  subsanarRfc: (rfcId: string, dto: SubsanarRfcDTO, user: User) => {
    const updated = rfcService.subsanar(rfcId, dto, user);
    set((state) => ({
      rfcs: state.rfcs.map((r) => (r.id === updated.id ? updated : r)),
    }));
    return updated;
  },
}));

