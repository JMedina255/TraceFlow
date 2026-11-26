import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { Injectable, Logger } from '@nestjs/common';
import type { GitHubRepoDetails } from './github.entity.js';

export interface IGitHubApiClient {
  generateAppJwt(): string;
  getInstallationAccessToken(installationId: number): Promise<{ token: string; expiresAt: string }>;
  listInstallationRepositories(installationId: number): Promise<GitHubRepoDetails[]>;
  getRepository(owner: string, repo: string, installationId?: number): Promise<GitHubRepoDetails>;
  validateRepoDraft(dto: { name: string; owner: string; visibility: string }): { valid: boolean; errors?: string[] };
}

@Injectable()
export class HttpGitHubApiClient implements IGitHubApiClient {
  private readonly logger = new Logger(HttpGitHubApiClient.name);
  private readonly tokenCache = new Map<number, { token: string; expiresAt: number }>();

  private getPrivateKey(): string | null {
    if (process.env.GITHUB_APP_PRIVATE_KEY) {
      return process.env.GITHUB_APP_PRIVATE_KEY;
    }
    if (process.env.GITHUB_APP_PRIVATE_KEY_PATH && fs.existsSync(process.env.GITHUB_APP_PRIVATE_KEY_PATH)) {
      return fs.readFileSync(process.env.GITHUB_APP_PRIVATE_KEY_PATH, 'utf8');
    }
    return null;
  }

  generateAppJwt(): string {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = this.getPrivateKey();

    if (!appId || !privateKey) {
      throw new Error(
        '[GitHubAuthError] Credenciales incompletas de GitHub App: GITHUB_APP_ID o GITHUB_APP_PRIVATE_KEY ausentes.'
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // 60 segundos en el pasado para drift de reloj
      exp: now + 600, // Máximo 10 minutos según documentación GitHub
      iss: appId,
    };

    const header = { alg: 'RS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${encodedHeader}.${encodedPayload}`);
    const signature = sign.sign(privateKey, 'base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  async getInstallationAccessToken(installationId: number): Promise<{ token: string; expiresAt: string }> {
    // 1. Revisar caché en memoria (reutilizar si faltan más de 5 minutos para expirar)
    const cached = this.tokenCache.get(installationId);
    const nowMs = Date.now();
    if (cached && cached.expiresAt - nowMs > 5 * 60 * 1000) {
      return {
        token: cached.token,
        expiresAt: new Date(cached.expiresAt).toISOString(),
      };
    }

    // 2. Generar JWT de GitHub App bajo demanda
    const appJwt = this.generateAppJwt();

    // 3. Solicitar Installation Access Token a la API de GitHub
    const url = `https://api.github.com/app/installations/${installationId}/access_tokens`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${appJwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`Error al solicitar token de instalación ${installationId}: ${errText}`);
      throw new Error(`[GitHubApiError ${response.status}] No se pudo generar token para la instalación ${installationId}`);
    }

    const data: any = await response.json();
    const expiresAtMs = new Date(data.expires_at).getTime();

    // 4. Guardar exclusivamente en caché en memoria (CERO almacenamiento en PostgreSQL)
    this.tokenCache.set(installationId, {
      token: data.token,
      expiresAt: expiresAtMs,
    });

    return {
      token: data.token,
      expiresAt: data.expires_at,
    };
  }

  async listInstallationRepositories(installationId: number): Promise<GitHubRepoDetails[]> {
    const { token } = await this.getInstallationAccessToken(installationId);
    const url = 'https://api.github.com/installation/repositories?per_page=100';

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`[GitHubApiError ${response.status}] Error al listar repositorios de la instalación ${installationId}`);
    }

    const data: any = await response.json();
    return (data.repositories || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      owner: {
        login: r.owner.login,
        id: r.owner.id,
        type: r.owner.type,
      },
      private: r.private,
      default_branch: r.default_branch || 'main',
      visibility: r.visibility || (r.private ? 'private' : 'public'),
      permissions: {
        admin: r.permissions?.admin ?? false,
        push: r.permissions?.push ?? false,
        pull: r.permissions?.pull ?? true,
      },
      html_url: r.html_url,
      description: r.description,
    }));
  }

  async getRepository(owner: string, repo: string, installationId?: number): Promise<GitHubRepoDetails> {
    let authHeader = '';
    if (installationId) {
      const { token } = await this.getInstallationAccessToken(installationId);
      authHeader = `token ${token}`;
    } else {
      const appJwt = this.generateAppJwt();
      authHeader = `Bearer ${appJwt}`;
    }

    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: authHeader,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status === 404) {
      const error: any = new Error(`Repositorio '${owner}/${repo}' no encontrado en GitHub.`);
      error.code = 'REPO_NOT_FOUND';
      throw error;
    }

    if (!response.ok) {
      const error: any = new Error(`[GitHubApiError ${response.status}] Error al consultar repositorio '${owner}/${repo}'.`);
      error.status = response.status;
      throw error;
    }

    const r: any = await response.json();
    return {
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      owner: {
        login: r.owner.login,
        id: r.owner.id,
        type: r.owner.type,
      },
      private: r.private,
      default_branch: r.default_branch || 'main',
      visibility: r.visibility || (r.private ? 'private' : 'public'),
      permissions: {
        admin: r.permissions?.admin ?? false,
        push: r.permissions?.push ?? false,
        pull: r.permissions?.pull ?? true,
      },
      html_url: r.html_url,
      description: r.description,
    };
  }

  validateRepoDraft(dto: { name: string; owner: string; visibility: string }): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!dto.name || !/^[a-zA-Z0-9_.-]+$/.test(dto.name)) {
      errors.push('El nombre del repositorio solo puede contener caracteres alfanuméricos, guiones y puntos.');
    }
    if (dto.name && dto.name.length > 100) {
      errors.push('El nombre del repositorio no puede exceder 100 caracteres.');
    }
    if (!['public', 'private', 'internal'].includes(dto.visibility)) {
      errors.push("La visibilidad debe ser 'public', 'private' o 'internal'.");
    }
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

@Injectable()
export class MockGitHubApiClient implements IGitHubApiClient {
  private mockRepositories: GitHubRepoDetails[] = [
    {
      id: 101010101,
      name: 'TraceFlow',
      full_name: 'JMedina255/TraceFlow',
      owner: { login: 'JMedina255', id: 101, type: 'User' },
      private: true,
      default_branch: 'main',
      visibility: 'private',
      permissions: { admin: true, push: true, pull: true },
      html_url: 'https://github.com/JMedina255/TraceFlow',
      description: 'TraceFlow SCM Official Repository',
    },
    {
      id: 101010102,
      name: 'TraceFlow-Backend',
      full_name: 'JMedina255/TraceFlow-Backend',
      owner: { login: 'JMedina255', id: 101, type: 'User' },
      private: true,
      default_branch: 'main',
      visibility: 'private',
      permissions: { admin: true, push: true, pull: true },
      html_url: 'https://github.com/JMedina255/TraceFlow-Backend',
      description: 'TraceFlow SCM Backend Repository',
    },
    {
      id: 9001,
      name: 'pasarela-core',
      full_name: 'exodo-org/pasarela-core',
      owner: { login: 'exodo-org', id: 501, type: 'Organization' },
      private: true,
      default_branch: 'main',
      visibility: 'private',
      permissions: { admin: true, push: true, pull: true },
      html_url: 'https://github.com/exodo-org/pasarela-core',
      description: 'Motor transaccional de pagos de ÉXODO S.A.C.',
    },
    {
      id: 9002,
      name: 'traceflow-mobile',
      full_name: 'exodo-org/traceflow-mobile',
      owner: { login: 'exodo-org', id: 501, type: 'Organization' },
      private: true,
      default_branch: 'main',
      visibility: 'private',
      permissions: { admin: false, push: true, pull: true },
      html_url: 'https://github.com/exodo-org/traceflow-mobile',
      description: 'Aplicación móvil de gobernanza SCM',
    },
    {
      id: 9003,
      name: 'repositorio-solo-lectura',
      full_name: 'exodo-org/repositorio-solo-lectura',
      owner: { login: 'exodo-org', id: 501, type: 'Organization' },
      private: false,
      default_branch: 'main',
      visibility: 'public',
      permissions: { admin: false, push: false, pull: true }, // Push deshabilitado (para pruebas negativas)
      html_url: 'https://github.com/exodo-org/repositorio-solo-lectura',
      description: 'Repositorio público con permisos de solo lectura',
    },
    {
      id: 9004,
      name: 'billetera-fintech-repo',
      full_name: 'exodo-org/billetera-fintech-repo',
      owner: { login: 'exodo-org', id: 501, type: 'Organization' },
      private: true,
      default_branch: 'main',
      visibility: 'private',
      permissions: { admin: true, push: true, pull: true },
      html_url: 'https://github.com/exodo-org/billetera-fintech-repo',
      description: 'Repositorio oficial para pruebas de certificación',
    },
  ];

  generateAppJwt(): string {
    return 'mock_jwt_header.mock_jwt_payload.mock_signature';
  }

  async getInstallationAccessToken(installationId: number): Promise<{ token: string; expiresAt: string }> {
    if (installationId <= 0) {
      throw new Error(`[GitHubApiError 404] Instalación ${installationId} no encontrada`);
    }
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    return {
      token: `ghs_mockToken_${installationId}_${Date.now()}`,
      expiresAt,
    };
  }

  async listInstallationRepositories(installationId: number): Promise<GitHubRepoDetails[]> {
    if (installationId === 999999) {
      // Simula instalación sin repositorios asignados o permisos revocados
      return [];
    }
    return [...this.mockRepositories];
  }

  async getRepository(owner: string, repo: string, _installationId?: number): Promise<GitHubRepoDetails> {
    const full = `${owner}/${repo}`.toLowerCase();
    const found = this.mockRepositories.find(
      (r) => r.full_name.toLowerCase() === full || (r.owner.login.toLowerCase() === owner.toLowerCase() && r.name.toLowerCase() === repo.toLowerCase())
    );

    if (!found) {
      const error: any = new Error(`Repositorio '${owner}/${repo}' no encontrado en GitHub.`);
      error.code = 'REPO_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    return { ...found };
  }

  validateRepoDraft(dto: { name: string; owner: string; visibility: string }): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!dto.name || !/^[a-zA-Z0-9_.-]+$/.test(dto.name)) {
      errors.push('El nombre del repositorio solo puede contener caracteres alfanuméricos, guiones y puntos.');
    }
    if (dto.name && dto.name.length > 100) {
      errors.push('El nombre del repositorio no puede exceder 100 caracteres.');
    }
    if (!['public', 'private', 'internal'].includes(dto.visibility)) {
      errors.push("La visibilidad debe ser 'public', 'private' o 'internal'.");
    }
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Métodos de apoyo para pruebas TDD
  addMockRepository(repo: GitHubRepoDetails): void {
    this.mockRepositories.push(repo);
  }

  setRepoPermissions(
    owner: string,
    repo: string,
    permissions: { push: boolean; pull: boolean; admin: boolean }
  ): void {
    const full = `${owner}/${repo}`.toLowerCase();
    const found = this.mockRepositories.find(
      (r) =>
        r.full_name.toLowerCase() === full ||
        (r.owner.login.toLowerCase() === owner.toLowerCase() &&
          r.name.toLowerCase() === repo.toLowerCase())
    );
    if (found) {
      found.permissions = permissions;
    }
  }

  resetMockRepositories(): void {
    this.mockRepositories = this.mockRepositories.slice(0, 4);
  }
}
