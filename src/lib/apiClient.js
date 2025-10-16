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

  // --- Pacientes ---
  async getPacientes(params = {}) {
    const search = new URLSearchParams(params).toString();
    return this.request(`/pacientes${search ? `?${search}` : ""}`);
  }

  async getPaciente(id) {
    return this.request(`/pacientes/${id}`);
  }

  async createPaciente(data) {
    console.log('🌐 ApiClient: Creando paciente con datos:', data);
    console.log('🌐 ApiClient: URL base:', this.baseURL);
    console.log('🌐 ApiClient: URL completa:', `${this.baseURL}/pacientes`);

    try {
      const result = await this.request('/pacientes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('🌐 ApiClient: Respuesta exitosa:', result);
      return result;
    } catch (error) {
      console.error('🌐 ApiClient: Error en createPaciente:', error);
      throw error;
    }
  }

  async updatePaciente(id, data) {
    return this.request(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePaciente(id) {
    return this.request(`/pacientes/${id}`, { method: 'DELETE' });
  }

  // --- Episodios ---
  async getEpisodios() {
    console.log('🌐 ApiClient: Obteniendo episodios...');
    try {
      const result = await this.request('/episodios');
      console.log('🌐 ApiClient: Episodios obtenidos:', result);
      return result;
    } catch (error) {
      console.error('🌐 ApiClient: Error obteniendo episodios:', error);
      throw error;
    }
  }

  async createEpisodio(data) {
    console.log('🌐 ApiClient: Creando episodio con datos:', data);
    try {
      const result = await this.request('/episodios', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('🌐 ApiClient: Episodio creado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('🌐 ApiClient: Error en createEpisodio:', error);
      throw error;
    }
  }

  // --- Diagnóstico ---
  async getDiagnosticos() {
    console.log('🌐 ApiClient: Obteniendo diagnósticos...');
    try {
      const result = await this.request('/diagnosticos');
      console.log('🌐 ApiClient: Diagnósticos obtenidos:', result);
      return result;
    } catch (error) {
      console.error('🌐 ApiClient: Error obteniendo diagnósticos:', error);
      throw error;
    }
  }

  async createDiagnostico(data) {
    console.log('🌐 ApiClient: Creando diagnóstico con datos:', data);
    try {
      const result = await this.request('/diagnosticos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('🌐 ApiClient: Diagnóstico creado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('🌐 ApiClient: Error en createDiagnostico:', error);
      throw error;
    }
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
