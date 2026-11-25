import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { CanonicalRoleId } from '../types/index.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<CanonicalRoleId[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.activeRoleId) {
      throw new ForbiddenException('Acceso denegado: Usuario sin rol activo especificado.');
    }

    const hasRole = requiredRoles.includes(user.activeRoleId);
    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado: El rol activo '${user.activeRoleId}' no está autorizado para esta operación (Requiere: ${requiredRoles.join(', ')}).`
      );
    }

    return true;
  }
}
