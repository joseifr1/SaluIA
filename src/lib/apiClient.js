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

      // Mejorar mensaje de error de conexión
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new ApiError(500, 'No se puede conectar al servidor. Verifique que el backend esté ejecutándose en http://localhost:8000');
      }

      throw new ApiError(500, 'Error de conexión: ' + error.message);
    }
  }

  // Authentication
  async login(credentials) {
    // Backend expects /api/auth/login and returns { access_token, user }
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    // No explicit logout endpoint in backend; clear token client-side
    this.setToken(null);
    return Promise.resolve({});
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Records
  async getRecords(params = {}) {
    const searchParams = new URLSearchParams(params);
    return this.request(`/records?${searchParams}`);
  }

  async getRegistros() {
    return this.request('/registros');
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

  async createPatient(data) {
    return this.request('/pacientes', {
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

  async createEpisodio(data) {
    return this.request('/episodios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createDiagnostico(data) {
    return this.request('/diagnosticos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async procesarEvaluacionIA(data) {
    return this.request('/evaluacion', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createEvaluacionIA(data) {
    return this.request('/evaluacion-ia', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEvaluacionesLeyUrgencia() {
    return this.request('/evaluacion-ley-urgencia');
  }

  async getEvaluacionLeyUrgencia(id) {
    return this.request(`/evaluacion-ley-urgencia/${id}`);
  }

  async createEvaluacionLeyUrgencia(data) {
    return this.request('/evaluacion-ley-urgencia', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveDraft(data) {
    return this.request('/borradores', {
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
