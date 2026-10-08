import { create } from 'zustand';
import type { RFC } from '../types';
import { INITIAL_RFCS } from '../data/initialRfcs';
import { storageService } from '../services/storage.service';

interface RfcState {
  rfcs: RFC[];
  getRfcsByProject: (projectId: string) => RFC[];
  getRfcById: (rfcId: string) => RFC | undefined;
  reloadRfcs: () => void;
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
}));
