import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, Settings, Contrast, Type } from 'lucide-react';
import { NAVIGATION_ITEMS, KEYBOARD_SHORTCUTS } from '../lib/constants.js';
import { authService } from '../lib/auth.js';
import * as LucideIcons from 'lucide-react';
import clsx from 'clsx';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = authService.subscribe(setUser);
    authService.getCurrentUser().then(setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      const key = `${e.altKey ? 'Alt+' : ''}${e.key}`;
      const shortcut = KEYBOARD_SHORTCUTS[key];
      
      if (shortcut) {
        e.preventDefault();
        if (shortcut === 'search') {
          // Focus search input if exists
          const searchInput = document.querySelector('[data-search]');
          if (searchInput) {
            searchInput.focus();
          }
        } else {
          navigate(shortcut);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    // Apply accessibility preferences
    document.documentElement.setAttribute('data-theme', highContrast ? 'high-contrast' : 'default');
    document.documentElement.setAttribute('data-text-size', largeText ? 'large' : 'default');
  }, [highContrast, largeText]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const filteredNavItems = NAVIGATION_ITEMS.filter(item => 
    !item.adminOnly || (user?.role === 'admin')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="skip-to-content"
      >
        Saltar al contenido principal
      </a>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo and menu toggle */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
              aria-label="Abrir menú de navegación"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <LucideIcons.Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Red de Salud UC•CHRISTUS
              </span>
            </Link>
          </div>

          {/* System status and user menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sistema operativo</span>
            </div>

            <button
              type="button"
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 relative"
              aria-label="Notificaciones"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Menú de usuario"
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                </div>

                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accesibilidad
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setHighContrast(!highContrast)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Contrast className="w-4 h-4" />
                      Alto contraste
                    </div>
                    <div className={clsx(
                      'w-6 h-3 rounded-full transition-colors',
                      highContrast ? 'bg-primary' : 'bg-gray-300'
                    )}>
                      <div className={clsx(
                        'w-3 h-3 bg-white rounded-full shadow-sm transition-transform',
                        highContrast ? 'translate-x-3' : 'translate-x-0'
                      )}></div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLargeText(!largeText)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Texto grande
                    </div>
                    <div className={clsx(
                      'w-6 h-3 rounded-full transition-colors',
                      largeText ? 'bg-primary' : 'bg-gray-300'
                    )}>
                      <div className={clsx(
                        'w-3 h-3 bg-white rounded-full shadow-sm transition-transform',
                        largeText ? 'translate-x-3' : 'translate-x-0'
                      )}></div>
                    </div>
                  </button>
                </div>

                <div className="border-t border-gray-100 p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                  <div className="px-3 py-2 text-xs text-gray-500">
                    Recuerde cerrar sesión al terminar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out mt-16',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <nav 
          id="sidebar"
          className="h-full px-4 py-6 overflow-y-auto"
          role="navigation"
          aria-label="Navegación principal"
        >
          <ul className="space-y-2" role="menubar">
            {filteredNavItems.map((item) => {
              const Icon = LucideIcons[item.icon];
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <li key={item.id} role="none">
                  <Link
                    to={item.path}
                    className={clsx('sidebar-item', isActive && 'active')}
                    onClick={() => setSidebarOpen(false)}
                    role="menuitem"
                    title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="ml-auto text-xs text-gray-400">
                        {item.shortcut}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 mt-16"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <main
        id="main-content"
        className={clsx(
          'transition-all duration-300 ease-in-out pt-16',
          sidebarOpen ? 'ml-64' : 'ml-0'
        )}
        role="main"
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}