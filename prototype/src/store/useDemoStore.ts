import { create } from 'zustand';
import { storageService } from '../services/storage.service';
import { INITIAL_PROJECTS } from '../data/initialProjects';
import { INITIAL_RFCS } from '../data/initialRfcs';
import { INITIAL_ECS } from '../data/initialEcs';
import { INITIAL_ECNS } from '../data/initialEcns';
import { INITIAL_INCIDENTS } from '../data/initialIncidents';
import { INITIAL_BASELINES } from '../data/initialBaselines';
import { INITIAL_AUDIT_EVENTS } from '../data/initialAudit';
import { useAuthStore } from './useAuthStore';
import { useProjectStore } from './useProjectStore';
import { useRfcStore } from './useRfcStore';

interface DemoState {
  isInitialized: boolean;
  initDemoData: () => void;
  resetAllDemoData: () => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  isInitialized: false,

  initDemoData: () => {
    // Si no existen las claves básicas, poblar con las semillas iniciales
    if (!storageService.get('projects', null)) {
      storageService.set('projects', INITIAL_PROJECTS);
    }
    if (!storageService.get('rfcs', null)) {
      storageService.set('rfcs', INITIAL_RFCS);
    }
    if (!storageService.get('ecs', null)) {
      storageService.set('ecs', INITIAL_ECS);
    }
    if (!storageService.get('ecns', null)) {
      storageService.set('ecns', INITIAL_ECNS);
    }
    if (!storageService.get('incidents', null)) {
      storageService.set('incidents', INITIAL_INCIDENTS);
    }
    if (!storageService.get('baselines', null)) {
      storageService.set('baselines', INITIAL_BASELINES);
    }
    if (!storageService.get('audit_events', null)) {
      storageService.set('audit_events', INITIAL_AUDIT_EVENTS);
    }

    set({ isInitialized: true });
  },

  resetAllDemoData: () => {
    // Limpieza completa del almacenamiento local
    storageService.clearAll();

    // Re-sembrado de colecciones iniciales
    storageService.set('projects', INITIAL_PROJECTS);
    storageService.set('rfcs', INITIAL_RFCS);
    storageService.set('ecs', INITIAL_ECS);
    storageService.set('ecns', INITIAL_ECNS);
    storageService.set('incidents', INITIAL_INCIDENTS);
    storageService.set('baselines', INITIAL_BASELINES);
    storageService.set('audit_events', INITIAL_AUDIT_EVENTS);

    // Notificar y recargar stores dependientes
    useProjectStore.getState().reloadProjects();
    useRfcStore.getState().reloadRfcs();
    useAuthStore.getState().switchUser('USR-001');

    set({ isInitialized: true });
  },
}));
