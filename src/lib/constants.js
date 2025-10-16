// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api',
  TIMEOUT: 10000,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Red de Salud UC•CHRISTUS',
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID || '',
  VERSION: '1.0.0',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  PENDING: 'pending',
};

// Registration Status
export const REGISTRATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  EVALUATING: 'evaluating',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
};

// Evaluation Results
export const EVALUATION_RESULTS = {
  APPLIES: 'applies',
  NOT_APPLIES: 'not_applies',
  UNCERTAIN: 'uncertain',
};

// Navigation Items
export const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Inicio', path: '/', icon: 'Home', shortcut: null },
  { id: 'new-record', label: 'Nuevo Registro', path: '/registros/nuevo', icon: 'Plus', shortcut: '' },
  { id: 'records', label: 'Mis Registros', path: '/registros', icon: 'FileText', shortcut: '' },
  { id: 'analytics', label: 'Análisis', path: '/analitica', icon: 'BarChart3', shortcut: '' },
  { id: 'help', label: 'Ayuda', path: '/ayuda', icon: 'HelpCircle', shortcut: null },
  { id: 'admin', label: 'Administración', path: '/admin/usuarios', icon: 'Settings', shortcut: null, adminOnly: true },
];

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  'Alt+N': '/registros/nuevo',
  'Alt+H': '/registros',
  'Alt+A': '/analitica',
  '/': 'search',
};

// Form Field Types
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  DATE: 'date',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  TEXTAREA: 'textarea',
  RUT: 'rut',
  PHONE: 'phone',
};
