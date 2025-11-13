import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, BarChart3, Clock, TrendingUp, Users, Calendar } from 'lucide-react';
import { PhoneTest } from '../components/PhoneTest.jsx';

export function Home() {
  // Mock data for recent episodes
  const recentEpisodes = [
    {
      id: 1,
      patient: 'María González P.',
      date: '2024-01-15',
      diagnosis: 'Hipertensión arterial',
      status: 'completed',
      result: 'applies',
    },
    {
      id: 2,
      patient: 'Juan Carlos M.',
      date: '2024-01-14',
      diagnosis: 'Diabetes tipo 2',
      status: 'evaluating',
      result: null,
    },
    {
      id: 3,
      patient: 'Ana López R.',
      date: '2024-01-13',
      diagnosis: 'Insuficiencia cardíaca',
      status: 'completed',
      result: 'not_applies',
    },
  ];

  // Mock stats
  const stats = [
    { label: 'Registros este mes', value: '24', icon: FileText, change: '+12%' },
    { label: 'Evaluaciones pendientes', value: '3', icon: Clock, change: '-8%' },
    { label: 'Tasa de cumplimiento', value: '87%', icon: TrendingUp, change: '+5%' },
    { label: 'Pacientes únicos', value: '18', icon: Users, change: '+3%' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completado</span>;
      case 'evaluating':
        return <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Evaluando</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Borrador</span>;
    }
  };

  const getResultBadge = (result) => {
    if (!result) return null;

    switch (result) {
      case 'applies':
        return <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Aplica</span>;
      case 'not_applies':
        return <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">No aplica</span>;
      case 'uncertain':
        return <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Incierto</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido al sistema de registro y evaluación médica
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <span className={`text-sm font-medium ${
                      stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/registros/nuevo"
          className="card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 transition-colors">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Nuevo Registro</h3>
              <p className="text-gray-600">Crear un nuevo episodio médico</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Presione <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt+N</kbd> para acceder rápidamente
          </div>
        </Link>

        <Link
          to="/registros"
          className="card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center group-hover:bg-secondary/90 transition-colors">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mis Registros</h3>
              <p className="text-gray-600">Ver historial de episodios</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Presione <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt+H</kbd> para acceder rápidamente
          </div>
        </Link>

        <Link
          to="/analitica"
          className="card hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center group-hover:bg-accent/90 transition-colors">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Análisis</h3>
              <p className="text-gray-600">Estadísticas y tendencias</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Presione <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt+A</kbd> para acceder rápidamente
          </div>
        </Link>
      </div>

      {/* Recent episodes */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Últimos Episodios</h2>
          <Link
            to="/registros"
            className="text-sm text-primary hover:text-primary/80"
          >
            Ver todos
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diagnóstico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resultado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentEpisodes.map((episode) => (
                <tr key={episode.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {episode.patient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(episode.date).toLocaleDateString('es-CL')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {episode.diagnosis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(episode.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getResultBadge(episode.result)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
