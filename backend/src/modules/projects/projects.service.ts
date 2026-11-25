import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsRepository, ProjectEntity } from './projects.repository.js';
import type { AuthenticatedUser } from '../../common/types/index.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepo: ProjectsRepository) {}

  async getProjectsForUser(user: AuthenticatedUser): Promise<ProjectEntity[]> {
    const allProjects = await this.projectsRepo.findAll();
    // Aislamiento multitenant estricto (ADR-006 / RBAC_ACCESS_MATRIX Sección 5):
    // Solo se devuelven los proyectos asignados explícitamente al usuario
    return allProjects.filter(
      (p) => user.assignedProjectIds.includes(p.code) || user.assignedProjectIds.includes(p.id)
    );
  }

  async getProjectById(idOrCode: string, user: AuthenticatedUser): Promise<ProjectEntity> {
    const project = await this.projectsRepo.findByIdOrCode(idOrCode);
    if (!project) {
      throw new NotFoundException(`Proyecto '${idOrCode}' no encontrado.`);
    }

    const hasAccess =
      user.assignedProjectIds.includes(project.code) || user.assignedProjectIds.includes(project.id);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Acceso no autorizado: El usuario '${user.code}' no tiene asignado el proyecto '${project.code}'.`
      );
    }

    return project;
  }
}
