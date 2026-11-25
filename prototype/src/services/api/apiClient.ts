/**
 * TraceFlow SCM — Cliente HTTP para Integración con Backend NestJS (Hito DB-01)
 * ADR-006: Sesiones Opacas en Servidor con Cookie HttpOnly y SameSite
 */

export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  error?: string;
}

export class TraceFlowApiError extends Error {
  statusCode: number;
  errorType?: string;
  path?: string;

  constructor(statusCode: number, message: string, errorType?: string, path?: string) {
    super(message);
    this.name = 'TraceFlowApiError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.path = path;
  }
}

// Detección segura de variables de entorno compatible con Vite y Node.js (test runners)
const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const val = (import.meta as any).env[key];
    if (val !== undefined && val !== '') return val;
  }
  const proc = (globalThis as any).process;
  if (proc && proc.env) {
    const val = proc.env[key];
    if (val !== undefined && val !== '') return val;
  }
  return defaultValue;
};

export const SERVICE_MODE = getEnvVar('VITE_SERVICE_MODE', 'mock') as 'mock' | 'api';
export const API_BASE_URL = getEnvVar('VITE_API_BASE_URL', 'http://localhost:3001/api/v1');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Protección anti-CSRF adicional
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Mandatorio para enviar y recibir cookie HttpOnly tf_session
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        statusCode: response.status,
        timestamp: new Date().toISOString(),
        path: endpoint,
        message: response.statusText || 'Error en petición HTTP',
      };
    }

    if (response.status === 401) {
      throw new TraceFlowApiError(401, errorData.message || 'Sesión no autorizada o expirada.', 'Unauthorized', endpoint);
    }

    if (response.status === 403) {
      throw new TraceFlowApiError(403, errorData.message || 'Acceso prohibido por reglas SoD o aislamiento de proyecto.', 'Forbidden', endpoint);
    }

    throw new TraceFlowApiError(response.status, errorData.message || 'Error en servicio backend.', errorData.error, endpoint);
  }

  return response.json();
}

export const authApi = {
  login: async (email: string, password: string, requestedRoleId?: string) => {
    return request<{ message: string; user: any; sessionToken?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, requestedRoleId }),
    });
  },

  getMe: async () => {
    return request<{ user: any }>('/auth/me', {
      method: 'GET',
    });
  },

  logout: async () => {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },
};

export const projectsApi = {
  getProjects: async () => {
    return request<{ total: number; data: any[] }>('/projects', {
      method: 'GET',
    });
  },

  getProjectById: async (id: string) => {
    return request<{ data: any }>(`/projects/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  },
};

export const rfcsApi = {
  getRfcs: async (projectId?: string) => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return request<{ total: number; data: any[] }>(`/rfcs${query}`, {
      method: 'GET',
    });
  },

  getRfcById: async (id: string) => {
    return request<{ data: any }>(`/rfcs/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  },

  createRfc: async (dto: { projectId: string; targetEcsId: string; title: string; description: string; justification: string; priority: string }) => {
    return request<{ message: string; data: any }>('/rfcs', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};
