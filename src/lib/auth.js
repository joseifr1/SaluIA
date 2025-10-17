import { apiClient } from './apiClient.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  async login(credentials) {
    try {
      const response = await apiClient.login(credentials);
      const token = response.access_token || response.token;
      const user = response.user;
      this.currentUser = {
        id: user.id,
        email: user.email,
        firstName: user.nombre,
        lastName: user.apellido,
        role: user.is_admin ? 'admin' : (user.rol || 'doctor'),
        avatar: null,
        is_admin: !!user.is_admin,
      };
      apiClient.setToken(token);
      this.notify();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await apiClient.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Error during logout:', error);
    } finally {
      this.currentUser = null;
      apiClient.setToken(null);
      this.notify();
    }
  }

  async getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    try {
      const user = await apiClient.getCurrentUser();
      this.currentUser = {
        id: user.id,
        email: user.email,
        firstName: user.nombre,
        lastName: user.apellido,
        role: user.is_admin ? 'admin' : (user.rol || 'doctor'),
        avatar: null,
        is_admin: !!user.is_admin,
      };
      this.notify();
      return this.currentUser;
    } catch (error) {
      // Token might be expired
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      return null;
    }
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  hasRole(role) {
    return this.currentUser?.role === role;
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  // Mock data for development
  async mockLogin(credentials) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (credentials.email === 'admin@uc.cl' && credentials.password === 'admin123') {
      const user = {
        id: 1,
        email: 'admin@uc.cl',
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'admin',
        avatar: null,
      };
      
      this.currentUser = user;
      apiClient.setToken('mock_token_admin');
      this.notify();
      return { user, token: 'mock_token_admin' };
    }

    throw new Error('Credenciales inválidas');
  }
}

export const authService = new AuthService();