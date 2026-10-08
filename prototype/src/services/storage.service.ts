/**
 * Servicio de almacenamiento local con versionamiento y tolerancia a fallos.
 */

const STORAGE_VERSION = 'traceflow_demo_v1';

export const storageService = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(`${STORAGE_VERSION}_${key}`);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[storageService] Error recuperando ${key}, usando valor por defecto:`, err);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${STORAGE_VERSION}_${key}`, JSON.stringify(value));
    } catch (err) {
      console.error(`[storageService] Error persistiendo ${key}:`, err);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`${STORAGE_VERSION}_${key}`);
    } catch (err) {
      console.error(`[storageService] Error eliminando ${key}:`, err);
    }
  },

  clearAll(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_VERSION)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.error('[storageService] Error limpiando estado demo:', err);
    }
  },
};
