import { create } from 'zustand';
import type { Project, User } from '../types';
import { INITIAL_PROJECTS } from '../data/initialProjects';
import { storageService } from '../services/storage.service';
import { traceFlowAdapter } from '../services/api/apiAdapter';
import { useAuthStore } from './useAuthStore';

interface ProjectState {
  projects: Project[];
  activeProject: Project;
  setActiveProject: (projectId: string, user?: User) => void;
  reloadProjects: () => void;
  loadProjectsFromApi: (user?: User) => Promise<Project[]>;
}

const STORAGE_KEY_PROJECT_ID = 'active_project_id';
const STORAGE_KEY_PROJECTS = 'projects';

const getInitialProjectList = (): Project[] => {
  return storageService.get<Project[]>(STORAGE_KEY_PROJECTS, INITIAL_PROJECTS);
};

const getInitialActiveProject = (projects: Project[]): Project => {
  const savedId = storageService.get<string | null>(STORAGE_KEY_PROJECT_ID, null);
  if (savedId) {
    const found = projects.find((p) => p.id === savedId);
    if (found) return found;
  }
  return projects[0]; // Pasarela de Pagos Core por defecto
};

const initialProjects = getInitialProjectList();

export const useProjectStore = create<ProjectState>((set) => ({
  projects: initialProjects,
  activeProject: getInitialActiveProject(initialProjects),

  setActiveProject: (projectId: string, user?: User) => {
    set((state) => {
      const targetUser = user || useAuthStore.getState().currentUser;
      if (targetUser && targetUser.assignedProjectIds && targetUser.assignedProjectIds.length > 0) {
        if (!targetUser.assignedProjectIds.includes(projectId)) {
          console.warn(
            `[Multitenancy Security] Intento no autorizado de conmutar al proyecto ${projectId} por el usuario ${targetUser.fullName}.`
          );
          return state; // Rechazar conmutación no autorizada
        }
      }

      const selected = state.projects.find((p) => p.id === projectId);
      if (!selected) return state;

      storageService.set(STORAGE_KEY_PROJECT_ID, selected.id);
      return { activeProject: selected };
    });
  },

  reloadProjects: () => {
    const updated = getInitialProjectList();
    set({
      projects: updated,
      activeProject: getInitialActiveProject(updated),
    });
  },

  loadProjectsFromApi: async (user?: User): Promise<Project[]> => {
    try {
      const list = await traceFlowAdapter.projects.getAll(user);
      if (list && list.length > 0) {
        set((state) => ({
          projects: list,
          activeProject: list.find((p) => p.id === state.activeProject?.id) || list[0],
        }));
      }
      return list;
    } catch (err) {
      console.warn('[useProjectStore] Fallo al cargar proyectos desde traceFlowAdapter:', err);
      return getInitialProjectList();
    }
  },
}));
