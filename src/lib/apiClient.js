import { API_CONFIG } from './constants.js';

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(response.status, error.message || 'Error en la solicitud');
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ApiError(408, 'Tiempo de espera agotado');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, 'Error de conexión');
    }
  }

  // Authentication
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Records
  async getRecords(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.request(`/records?${searchParams}`);
  }

  async getRecord(id) {
    return this.request(`/records/${id}`);
  }

  async createRecord(data) {
    return this.request('/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecord(id, data) {
    return this.request(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async saveDraft(data) {
    return this.request('/records/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Evaluation
  async evaluateCase(id) {
    return this.request(`/evaluate/${id}`, {
      method: 'POST',
    });
  }

  async finalizeCase(id, data) {
    return this.request(`/finalize/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Analytics
  async getAnalytics(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.request(`/analytics?${searchParams}`);
  }

  // Admin
  async getUsers(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.request(`/admin/users?${searchParams}`);
  }

  async approveUser(userId) {
    return this.request(`/admin/users/${userId}/approve`, {
      method: 'POST',
    });
  }

  async rejectUser(userId) {
    return this.request(`/admin/users/${userId}/reject`, {
      method: 'POST',
    });
  }

  async disableUser(userId) {
    return this.request(`/admin/users/${userId}/disable`, {
      method: 'POST',
    });
  }

  // Utilities
  async searchDiagnosis(query) {
    return this.request(`/cie10/search?q=${encodeURIComponent(query)}`);
  }
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiClient = new ApiClient();
export { ApiError };