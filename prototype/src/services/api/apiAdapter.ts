/**
 * Adaptador Unificado de Servicios: Mock Local vs API Backend Real NestJS
 * Controlado mediante la variable VITE_SERVICE_MODE ('mock' | 'api')
 */
import { SERVICE_MODE, authApi, projectsApi, rfcsApi } from './apiClient';
import { authService } from '../auth.service';
import { projectService } from '../project.service';
import { rfcService } from '../rfc.service';
import type { User, UserAccount, CanonicalRoleId, Project, RFC, CreateRfcDTO } from '../../types';

export const serviceMode = SERVICE_MODE;

export const traceFlowAdapter = {
  getMode(): 'mock' | 'api' {
    return SERVICE_MODE;
  },

  isApiMode(): boolean {
    return SERVICE_MODE === 'api';
  },

  // Flujo 1: Autenticación
  auth: {
    async login(email: string, password: string, requestedRoleId?: CanonicalRoleId) {
      if (SERVICE_MODE === 'api') {
        const res = await authApi.login(email, password, requestedRoleId);
        return res.user;
      }
      // Modo Mock local
      const res = await authService.authenticate(email, password, requestedRoleId);
      return res.sessionUser;
    },

    async getMe() {
      if (SERVICE_MODE === 'api') {
        const res = await authApi.getMe();
        return res.user;
      }
      const session = authService.validatePersistedSession();
      return session ? session.user : null;
    },

    async logout() {
      if (SERVICE_MODE === 'api') {
        await authApi.logout();
      }
      authService.logout();
    },
  },

  // Flujo 2: Proyectos (Multitenant)
  projects: {
    async getAll(user?: UserAccount | User): Promise<Project[]> {
      if (SERVICE_MODE === 'api') {
        const res = await projectsApi.getProjects();
        return res.data;
      }
      return projectService.getAll(user);
    },

    async getById(id: string, user?: UserAccount | User): Promise<Project | undefined> {
      if (SERVICE_MODE === 'api') {
        const res = await projectsApi.getProjectById(id);
        return res.data;
      }
      return projectService.getById(id, user);
    },
  },

  // Flujo 3: Solicitudes de Cambio (RFCs)
  rfcs: {
    async getRfcs(projectId?: string): Promise<RFC[]> {
      if (SERVICE_MODE === 'api') {
        const res = await rfcsApi.getRfcs(projectId);
        return res.data;
      }
      return rfcService.getAll(projectId);
    },

    async getRfcById(id: string): Promise<RFC | undefined> {
      if (SERVICE_MODE === 'api') {
        const res = await rfcsApi.getRfcById(id);
        return res.data;
      }
      return rfcService.getById(id);
    },

    async createRfc(dto: CreateRfcDTO, user: User): Promise<RFC> {
      if (SERVICE_MODE === 'api') {
        const res = await rfcsApi.createRfc({
          projectId: dto.projectId,
          targetEcsId: dto.affectedEcsId,
          title: dto.title,
          description: dto.description,
          justification: dto.justification,
          priority: dto.priority,
        });
        const serverRfc = res.data;
        const hydrated: RFC = {
          id: serverRfc.id,
          code: serverRfc.code,
          projectId: serverRfc.project_id || serverRfc.project_code || dto.projectId,
          projectName: dto.projectId === 'PRJ-001' || dto.projectId === 'b0000001-0000-0000-0000-000000000001' ? 'Pasarela de Pagos Core' : 'Portal Autoservicio Clientes',
          title: serverRfc.title,
          description: serverRfc.description,
          justification: serverRfc.justification,
          proposedSolution: dto.proposedSolution,
          priority: serverRfc.priority,
          category: dto.category || 'CORRECTIVO',
          affectedEcsId: serverRfc.target_ecs_id,
          affectedEcsName: 'Módulo de Autenticación y Firma JWT',
          status: serverRfc.status || 'REGISTRADA',
          requesterId: user.id,
          requesterName: user.fullName,
          requesterEmail: user.email,
          createdAt: serverRfc.created_at || new Date().toISOString(),
          updatedAt: serverRfc.updated_at || new Date().toISOString(),
          attachments: dto.attachments || [],
          timeline: [],
        };
        return hydrated;
      }
      return rfcService.create(dto, user);
    },
  },
};
