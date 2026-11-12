// Centralized API Client for ASTRAFLAME
// Handles REST calls to the backend, environment baseURL configuration, headers, and typed responses.

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  count?: number;
  message?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  setAuthToken(token: string | null) {
    this.token = token;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}/${endpoint.replace(/^\//, '')}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error: (json && json.error) || `HTTP error ${response.status}: ${response.statusText}`,
          code: (json && json.code) || `STATUS_${response.status}`,
        };
      }

      return json as ApiResponse<T>;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network request failed',
        code: 'NETWORK_ERROR',
      };
    }
  }

  get<T = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  delete<T = any>(endpoint: string, headers?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// --- Sub-services for domain models ---

export const evidenceAPI = {
  getAll: () => apiClient.get('/evidence'),
  getById: (id: string) => apiClient.get(`/evidence/${encodeURIComponent(id)}`),
  create: (record: any) => apiClient.post('/evidence', record),
  update: (id: string, updates: any) => apiClient.put(`/evidence/${encodeURIComponent(id)}`, updates),
  delete: (id: string) => apiClient.delete(`/evidence/${encodeURIComponent(id)}`),
};

export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
};

export const sourcesAPI = {
  getAll: () => apiClient.get('/sources'),
};

export const scenariosAPI = {
  getAll: () => apiClient.get('/scenarios'),
  create: (scenario: any) => apiClient.post('/scenarios', scenario),
  delete: (id: string) => apiClient.delete(`/scenarios/${encodeURIComponent(id)}`),
};

export const experimentsAPI = {
  getAll: () => apiClient.get('/experiments'),
};

export const materialsAPI = {
  getAll: () => apiClient.get('/materials'),
};

export const authAPI = {
  register: (data: { email: string; password: string; name?: string }) => apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/me'),
};

export const healthAPI = {
  check: () => apiClient.get('/health'),
  getDatabaseHealth: () => apiClient.get('/health/database'),
};

export const analyticsAPI = {
  getFlammability: (materialId?: string, gravityLevel?: string) => {
    const params = new URLSearchParams();
    if (materialId) params.append('materialId', materialId);
    if (gravityLevel) params.append('gravityLevel', gravityLevel);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/analytics/flammability${queryStr}`);
  },
};

export const syncAPI = {
  getStatus: () => apiClient.get('/sync/status'),
  trigger: () => apiClient.post('/sync/trigger'),
};

export const storageAPI = {
  upload: (fileName: string, fileContentBase64: string, contentType?: string) =>
    apiClient.post('/storage/upload', { fileName, fileContentBase64, contentType }),
  listFiles: () => apiClient.get('/storage/files'),
};

