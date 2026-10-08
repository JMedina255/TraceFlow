import type { Project } from '../types';
import { INITIAL_PROJECTS } from '../data/initialProjects';
import { storageService } from './storage.service';

const STORAGE_KEY = 'projects';

export const projectService = {
  getAll(): Project[] {
    return storageService.get<Project[]>(STORAGE_KEY, INITIAL_PROJECTS);
  },

  getById(id: string): Project | undefined {
    const list = this.getAll();
    return list.find((p) => p.id === id);
  },

  getByCode(code: string): Project | undefined {
    const list = this.getAll();
    return list.find((p) => p.code === code);
  },
};
