import { create } from 'zustand';
import type { Project } from '../types';
import { INITIAL_PROJECTS } from '../data/initialProjects';
import { storageService } from '../services/storage.service';

interface ProjectState {
  projects: Project[];
  activeProject: Project;
  setActiveProject: (projectId: string) => void;
  reloadProjects: () => void;
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

  setActiveProject: (projectId: string) => {
    set((state) => {
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
}));
