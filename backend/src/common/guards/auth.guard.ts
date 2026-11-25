import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionToken = request.cookies?.tf_session || request.headers['x-session-token'];

    if (!sessionToken) {
      throw new UnauthorizedException('No se proporcionó una sesión activa válida.');
    }

    const user = await this.authService.validateSessionToken(sessionToken);
    if (!user) {
      throw new UnauthorizedException('La sesión ha expirado, fue revocada o es inválida.');
    }

    request.user = user;
    return true;
  }
}
