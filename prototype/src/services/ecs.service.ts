import type { ECS, LibraryType } from '../types';
import { INITIAL_ECS } from '../data/initialEcs';
import { storageService } from './storage.service';

const STORAGE_KEY = 'ecs';

export const ecsService = {
  getAll(projectId?: string): ECS[] {
    const all = storageService.get<ECS[]>(STORAGE_KEY, INITIAL_ECS);
    if (!projectId) return all;
    return all.filter((e) => e.projectId === projectId);
  },

  getById(id: string): ECS | undefined {
    const all = this.getAll();
    return all.find((e) => e.id === id);
  },

  getByLibrary(library: LibraryType, projectId?: string): ECS[] {
    const all = this.getAll(projectId);
    return all.filter((e) => e.currentLibrary === library);
  },
};
