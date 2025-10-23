import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { loginSchema } from '../lib/zod-schemas.js';
import { authService } from '../lib/auth.js';
import clsx from 'clsx';

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberDevice: false,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      await authService.login({ email: data.email, password: data.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Red de Salud UC•CHRISTUS
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Inicie sesión en su cuenta
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {error && (
            <div 
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error de autenticación
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="su.email@uc.cl"
                  disabled={loading}
                  className="input"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={loading}
                  className="input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...register('rememberDevice')}
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="rememberDevice" className="ml-2 block text-sm text-gray-900">
                Recordar este dispositivo
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  'w-full btn btn-primary',
                  loading && 'opacity-75 cursor-not-allowed'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <Link
                to="/recuperar-password"
                className="text-sm text-primary hover:text-primary/80"
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>
          </div>

          {/* Development helper */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-2">Credenciales de prueba:</p>
            <p className="text-xs text-blue-700">Email: admin@uc.cl</p>
            <p className="text-xs text-blue-700">Contraseña: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}