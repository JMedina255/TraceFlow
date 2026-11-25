import { Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dtos/login.dto.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { loadConfig } from '../../config/configuration.js';
import type { AuthenticatedUser } from '../../common/types/index.js';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'TraceFlow Client';

    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
      loginDto.requestedRoleId,
      ip,
      userAgent,
    );

    const config = loadConfig();

    // Establecer Cookie HttpOnly con Identificador Opaco (ADR-006)
    res.cookie('tf_session', result.sessionToken, {
      httpOnly: true,
      secure: config.sessionCookieSecure,
      sameSite: config.sessionCookieSameSite,
      path: '/',
      maxAge: config.sessionTtlMinutes * 60 * 1000,
    });

    return {
      message: 'Inicio de sesión exitoso.',
      user: result.user,
      sessionToken: result.sessionToken, // También devuelto para compatibilidad de encabezado si aplica
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionToken = req.cookies?.tf_session || req.headers['x-session-token'];
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'TraceFlow Client';

    if (sessionToken) {
      await this.authService.logout(sessionToken, ip, userAgent);
    }

    res.clearCookie('tf_session', { path: '/' });

    return {
      message: 'Sesión cerrada exitosamente.',
    };
  }
}
