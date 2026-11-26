import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { GitHubController } from './github.controller.js';
import { GitHubService } from './github.service.js';
import { GitHubRepository } from './github.repository.js';
import {
  IGitHubApiClient,
  HttpGitHubApiClient,
  MockGitHubApiClient,
} from './github-api.client.js';

export function createGitHubApiClient(): IGitHubApiClient {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const clientMode = process.env.GITHUB_CLIENT_MODE || '';
  const allowMock = process.env.ALLOW_MOCK_GITHUB === 'true';
  const isTest = nodeEnv === 'test';
  const dbMode = process.env.DATABASE_MODE || 'mock';

  // SEC-01: Prohibición absoluta de GitHub mock en producción y validación de consistencia
  if (nodeEnv === 'production') {
    if (clientMode === 'mock' || allowMock) {
      throw new Error(
        'CONFIG_ERROR: El cliente mock de GitHub está estrictamente prohibido en entorno de producción.'
      );
    }
    if (dbMode === 'mock') {
      throw new Error(
        'CONFIG_ERROR: Configuración inconsistente: No se permite DATABASE_MODE=mock en entorno de producción.'
      );
    }
    const appId = process.env.GITHUB_APP_ID;
    const privateKey =
      process.env.GITHUB_APP_PRIVATE_KEY || process.env.GITHUB_APP_PRIVATE_KEY_PATH;

    if (!appId || !privateKey) {
      throw new Error(
        'CONFIG_ERROR: Configuración incompleta de GitHub App: En producción se requieren credenciales válidas (GITHUB_APP_ID y GITHUB_APP_PRIVATE_KEY).'
      );
    }
    return new HttpGitHubApiClient();
  }

  // Si se solicita modo en vivo o es PostgreSQL operativo sin autorización explícita de mock en test/dev
  const isOperationalPostgres = dbMode === 'postgres' && !isTest && !allowMock;

  if (clientMode === 'live' || isOperationalPostgres) {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey =
      process.env.GITHUB_APP_PRIVATE_KEY || process.env.GITHUB_APP_PRIVATE_KEY_PATH;

    if (!appId || !privateKey) {
      throw new Error(
        'CONFIG_ERROR: Configuración incompleta de GitHub App (se requieren GITHUB_APP_ID y GITHUB_APP_PRIVATE_KEY) en modo operativo.'
      );
    }
    return new HttpGitHubApiClient();
  }

  // Permitir mocks únicamente en entornos de prueba o desarrollo explícitamente autorizados
  if (isTest || allowMock || (nodeEnv !== 'production' && clientMode === 'mock')) {
    return new MockGitHubApiClient();
  }

  // Fail-closed si está en postgres sin autorización explícita de mock
  if (dbMode === 'postgres') {
    throw new Error(
      'CONFIG_ERROR: Modo mock de GitHub no autorizado en entorno PostgreSQL operativo. Establezca ALLOW_MOCK_GITHUB=true explícitamente para pruebas.'
    );
  }

  return new MockGitHubApiClient();
}

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => AuthModule),
    AuditModule,
    forwardRef(() => OrganizationsModule),
    forwardRef(() => ProjectsModule),
  ],
  controllers: [GitHubController],
  providers: [
    GitHubRepository,
    GitHubService,
    {
      provide: 'IGitHubApiClient',
      useFactory: createGitHubApiClient,
    },
  ],
  exports: [GitHubService, GitHubRepository, 'IGitHubApiClient'],
})
export class GitHubModule {}
