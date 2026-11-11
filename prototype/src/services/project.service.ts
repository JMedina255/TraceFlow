import type { Project, User, UserAccount } from '../types';
import { INITIAL_PROJECTS } from '../data/initialProjects';
import { storageService } from './storage.service';
import { authService } from './auth.service';

const STORAGE_KEY = 'projects';

export const projectService = {
  getAll(user?: UserAccount | User): Project[] {
    const list = storageService.get<Project[]>(STORAGE_KEY, INITIAL_PROJECTS);
    if (!user) return list;
    return list.filter((p) => authService.canUserAccessProject(user, p.id));
  },

  getById(id: string, user?: UserAccount | User): Project | undefined {
    const list = storageService.get<Project[]>(STORAGE_KEY, INITIAL_PROJECTS);
    const project = list.find((p) => p.id === id);
    if (!project) return undefined;

    if (user && !authService.canUserAccessProject(user, project.id)) {
      return undefined; // Restricción multitenant: proyecto no asignado al usuario
    }

    return project;
  },

  getByCode(code: string, user?: UserAccount | User): Project | undefined {
    const list = storageService.get<Project[]>(STORAGE_KEY, INITIAL_PROJECTS);
    const project = list.find((p) => p.code === code);
    if (!project) return undefined;

    if (user && !authService.canUserAccessProject(user, project.id)) {
      return undefined;
    }

    return project;
  },
};
