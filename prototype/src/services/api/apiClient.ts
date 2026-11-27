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

export interface AdminUserRecord {
  id: string;
  code: string;
  username: string;
  email: string;
  fullName: string;
  organization: string;
  position: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  primaryRoleCode: string;
  assignedRoleCodes: string[];
  assignedProjectCodes: string[];
  canCreateProjects: boolean;
  projectCreationAuthorizedBy: string | null;
  projectCreationAuthorizedAt: string | null;
  githubUsername: string | null;
  githubUserId: number | null;
  githubIdentityStatus: 'UNVERIFIED' | 'DECLARED' | 'VERIFIED';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUsersSummary {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
  authorizedProjectManagers: number;
}

export interface UserInvitationRecord {
  id: string;
  channel: 'EMAIL' | 'GITHUB';
  email?: string | null;
  github_username?: string | null;
  organization_id?: string | null;
  organization_code?: string | null;
  organization_name?: string | null;
  project_id?: string | null;
  intended_role_id: number;
  intended_role_code?: string;
  intended_role_name?: string;
  status: 'PENDING' | 'CANCELLED' | 'EXPIRED' | 'ACCEPTED';
  invited_by: string;
  invited_by_code?: string;
  invited_by_name?: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

export interface OrganizationRecord {
  id: string;
  code: string;
  name: string;
  slug: string;
  legal_name?: string | null;
  tax_id?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  created_at: string;
}

export interface OrganizationMemberRecord {
  id: string;
  organization_id: string;
  user_id: string;
  role_in_org: 'OWNER' | 'ADMIN' | 'MEMBER' | 'AUDITOR';
  status: 'ACTIVE' | 'SUSPENDED';
  joined_at: string;
  user_code?: string;
  user_full_name?: string;
  user_email?: string;
}

export const adminApi = {
  listUsers: async (params?: {
    search?: string;
    status?: string;
    role?: string;
    canCreateProjects?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.role) query.set('role', params.role);
    if (params?.canCreateProjects !== undefined && params.canCreateProjects !== '') {
      query.set('canCreateProjects', params.canCreateProjects);
    }
    const qs = query.toString();
    return request<{ total: number; summary: AdminUsersSummary; data: AdminUserRecord[] }>(
      `/admin/users${qs ? `?${qs}` : ''}`,
      { method: 'GET' }
    );
  },

  getUserDetail: async (id: string) => {
    return request<{ data: AdminUserRecord }>(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  },

  createUser: async (dto: {
    fullName: string;
    email: string;
    username?: string;
    position?: string;
    organization?: string;
    organizationId?: string;
    githubUsername?: string;
    password: string;
    status?: string;
    roleCodes?: string[];
    primaryRoleCode?: string;
    authorizeProjectCreation?: boolean;
  }) => {
    return request<{ message: string; data: AdminUserRecord }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateUser: async (
    id: string,
    dto: { fullName?: string; position?: string; organization?: string; githubUsername?: string }
  ) => {
    return request<{ message: string; data: AdminUserRecord }>(
      `/admin/users/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }
    );
  },

  updateUserStatus: async (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE', reason?: string) => {
    return request<{ message: string; data: AdminUserRecord }>(
      `/admin/users/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }
    );
  },

  updateUserRoles: async (id: string, roleCodes: string[], primaryRoleCode?: string) => {
    return request<{ message: string; data: AdminUserRecord }>(
      `/admin/users/${encodeURIComponent(id)}/roles`,
      {
        method: 'PUT',
        body: JSON.stringify({ roleCodes, primaryRoleCode }),
      }
    );
  },

  updateProjectCreationAuth: async (id: string, authorized: boolean, reason?: string) => {
    return request<{ message: string; data: AdminUserRecord }>(
      `/admin/users/${encodeURIComponent(id)}/project-creation-auth`,
      {
        method: 'PATCH',
        body: JSON.stringify({ authorized, reason }),
      }
    );
  },

  listInvitations: async (params?: { status?: string; channel?: string; organizationId?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.channel) query.set('channel', params.channel);
    if (params?.organizationId) query.set('organizationId', params.organizationId);
    const qs = query.toString();
    return request<{ total: number; data: UserInvitationRecord[] }>(
      `/admin/invitations${qs ? `?${qs}` : ''}`,
      { method: 'GET' }
    );
  },

  createInvitation: async (dto: {
    channel: 'EMAIL' | 'GITHUB';
    email?: string;
    githubUsername?: string;
    intendedRoleCode: string;
    organizationId?: string;
    notes?: string;
  }) => {
    return request<{ message: string; data: UserInvitationRecord }>('/admin/invitations', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  updateInvitationStatus: async (
    id: string,
    status: 'CANCELLED' | 'EXPIRED',
    reason?: string
  ) => {
    return request<{ message: string; data: UserInvitationRecord }>(
      `/admin/invitations/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }
    );
  },
};

export const organizationsApi = {
  getOrganizations: async () => {
    return request<{ total: number; data: OrganizationRecord[] }>('/organizations', {
      method: 'GET',
    });
  },

  createOrganization: async (dto: {
    code: string;
    name: string;
    slug: string;
    legalName?: string;
    taxId?: string;
  }) => {
    return request<{ message: string; data: OrganizationRecord }>('/organizations', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  getMembers: async (idOrSlug: string) => {
    return request<{ total: number; data: OrganizationMemberRecord[] }>(
      `/organizations/${encodeURIComponent(idOrSlug)}/members`,
      { method: 'GET' }
    );
  },

  addMember: async (
    idOrSlug: string,
    dto: { userCodeOrEmailOrId: string; roleInOrg?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'AUDITOR' }
  ) => {
    return request<{ message: string; data: OrganizationMemberRecord }>(
      `/organizations/${encodeURIComponent(idOrSlug)}/members`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    );
  },

  updateMemberStatus: async (
    idOrSlug: string,
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED'
  ) => {
    return request<{ message: string; data: OrganizationMemberRecord }>(
      `/organizations/${encodeURIComponent(idOrSlug)}/members/${encodeURIComponent(userId)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
  },
};
