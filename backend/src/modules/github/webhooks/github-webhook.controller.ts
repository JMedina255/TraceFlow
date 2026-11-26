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
} from '@nestjs/common';
import { GitHubWebhookService } from './github-webhook.service.js';

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
    // Si express con rawBody: true capturó el buffer original en req.rawBody
    const rawBody =
      req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(payload));

    const result = await this.webhookService.handleWebhook(headers, rawBody, payload);

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
    @Param('id') _projectId: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: any,
    @Body() payload: any
  ) {
    const rawBody =
      req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(payload));

    const result = await this.webhookService.handleWebhook(headers, rawBody, payload);

    return {
      message: 'Evento webhook de proyecto GitHub recibido exitosamente',
      data: result,
    };
  }
}
