import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Activity, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { userRegisterSchema } from '../lib/zod-schemas.js';
import { apiClient } from '../lib/apiClient.js';
import { TextInput } from '../components/TextInput.jsx';
import clsx from 'clsx';
import { USER_ROLES } from '../lib/constants.js';

export function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const redirectTimer = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userRegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      // Prepare payload for backend
      const payload = {
        nombre: data.firstName,
        apellido: data.lastName,
        email: data.email,
        rol: data.role,
        password: data.password,
      };

      // POST to /api/usuarios/registro
      const res = await apiClient.request('/usuarios/registro', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

        // On success, show a gentle notification and redirect after a short delay
        const successMsg = (res && res.message) ? res.message : 'Su solicitud fue enviada, se está procesando su acceso';
        setSuccessMessage(successMsg);
        // Auto-redirect after 10 seconds
        redirectTimer.current = setTimeout(() => navigate('/login'), 10000);
    } catch (err) {
      // apiClient throws ApiError with message; backend may return { error: '...' }
      if (err && err.message) {
        setError(err.message);
      } else if (err && err.error) {
        setError(err.error);
      } else {
        setError('Error al crear usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">Registro de Usuario</h1>
        <p className="mt-2 text-center text-sm text-gray-600">Cree una cuenta nueva</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3" role="alert">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {successMessage ? (
            <div className="mb-6 p-8 bg-blue-50 border border-blue-200 rounded-lg flex flex-col items-center gap-4 text-center">
              <CheckCircle className="w-12 h-12 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">{successMessage}</h3>
              <p className="text-sm text-blue-700">Su solicitud está pendiente de aprobación. Serás redirigido al login en unos segundos.</p>
              <div className="mt-3">
                <button type="button" onClick={() => navigate('/login')} className="btn btn-primary">
                  Ir al login
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <div className="mt-1">
                  <TextInput {...register('firstName')} placeholder="Nombre" error={errors.firstName?.message} disabled={loading} />
                </div>
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <div className="mt-1">
                  <TextInput {...register('lastName')} placeholder="Apellido" error={errors.lastName?.message} disabled={loading} />
                </div>
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Rol</label>
              <div className="mt-1">
                <select {...register('role')} className="input" disabled={loading}>
                  <option value="">Seleccionar rol...</option>
                  <option value={USER_ROLES.ADMIN}>Administrador</option>
                  <option value={USER_ROLES.DOCTOR}>Médico</option>
                  <option value={USER_ROLES.NURSE}>Enfermero/a</option>
                </select>
              </div>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
              <div className="mt-1">
                <TextInput {...register('email')} type="email" placeholder="su.email@uc.cl" error={errors.email?.message} disabled={loading} />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 relative">
                <TextInput {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" error={errors.password?.message} disabled={loading} className="pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center" disabled={loading} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <button type="submit" disabled={loading} className={clsx('w-full btn btn-primary', loading && 'opacity-75 cursor-not-allowed')}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear cuenta'
                )}
              </button>
            </div>
          </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:text-primary/80">¿Ya tienes cuenta? Inicia sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
