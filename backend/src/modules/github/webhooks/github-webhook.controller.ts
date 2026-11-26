import {
  Controller,
  Post,
  Headers,
  Req,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Inject,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { GitHubWebhookService } from './github-webhook.service.js';

const MAX_WEBHOOK_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Controller('github')
export class GitHubWebhookController {
  constructor(
    @Inject(GitHubWebhookService) private readonly webhookService: GitHubWebhookService
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: any,
    @Body() payload: any
  ) {
    // H04B-R06: Exigir Buffer de cuerpo crudo sin fallback a JSON.stringify()
    if (!req?.rawBody || !Buffer.isBuffer(req.rawBody)) {
      throw new BadRequestException(
        'Cuerpo HTTP crudo (rawBody Buffer) no disponible o no es un Buffer válido. Se requiere para verificación criptográfica.'
      );
    }

    if (req.rawBody.length > MAX_WEBHOOK_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        'El tamaño del payload del webhook excede el límite permitido (5 MB).'
      );
    }

    const result = await this.webhookService.handleWebhook(headers, req.rawBody, payload);

    return {
      message: 'Evento webhook de GitHub recibido exitosamente',
      data: result,
    };
  }
}

@Controller('projects/:id/github')
export class GitHubProjectWebhookController {
  constructor(
    @Inject(GitHubWebhookService) private readonly webhookService: GitHubWebhookService
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.ACCEPTED)
  async handleProjectWebhook(
    @Param('id') projectId: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: any,
    @Body() payload: any
  ) {
    // H04B-R06: Exigir Buffer de cuerpo crudo sin fallback a JSON.stringify()
    if (!req?.rawBody || !Buffer.isBuffer(req.rawBody)) {
      throw new BadRequestException(
        'Cuerpo HTTP crudo (rawBody Buffer) no disponible o no es un Buffer válido. Se requiere para verificación criptográfica.'
      );
    }

    if (req.rawBody.length > MAX_WEBHOOK_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        'El tamaño del payload del webhook excede el límite permitido (5 MB).'
      );
    }

    const result = await this.webhookService.handleWebhook(headers, req.rawBody, payload, projectId);

    return {
      message: 'Evento webhook de proyecto GitHub recibido exitosamente',
      data: result,
    };
  }
}
