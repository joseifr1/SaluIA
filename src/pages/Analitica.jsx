import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Activity, Users, FileText, Clock, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { apiClient } from '../lib/apiClient.js';

export function Analitica() {
  const [dateRange, setDateRange] = useState('last-30-days');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    kpis: {
      compliance: { value: 0, change: 0, total: 0, approved: 0 },
      processed: { value: 0, change: 0, thisMonth: 0, lastMonth: 0 },
      pending: { value: 0, change: 0, current: 0, average: 0 },
      uniquePatients: { value: 0, change: 0, current: 0, lastPeriod: 0 },
    },
    monthlyData: [],
    complianceData: [],
    serviceData: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAnalytics({ dateRange });
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error cargando analytics:', err);
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const { kpiData, monthlyData, complianceData, serviceData } = {
    kpiData: analyticsData.kpis,
    monthlyData: analyticsData.monthlyData || [],
    complianceData: analyticsData.complianceData || [],
    serviceData: analyticsData.serviceData || [],
  };

  const dateRangeOptions = [
    { value: 'last-7-days', label: 'Últimos 7 días' },
    { value: 'last-30-days', label: 'Últimos 30 días' },
    { value: 'last-90-days', label: 'Últimos 90 días' },
    { value: 'this-year', label: 'Este año' },
  ];

  const serviceOptions = [
    { value: 'all', label: 'Todos los servicios' },
    { value: 'cardiology', label: 'Cardiología' },
    { value: 'internal', label: 'Medicina Interna' },
    { value: 'endocrinology', label: 'Endocrinología' },
    { value: 'neurology', label: 'Neurología' },
  ];

  const KPICard = ({ title, value, change, icon: Icon, description, variant = 'default' }) => {
    const isPositive = change > 0;
    const changeColor = variant === 'inverse'
      ? (isPositive ? 'text-red-600' : 'text-green-600')
      : (isPositive ? 'text-green-600' : 'text-red-600');

    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              <span className={`text-sm font-medium flex items-center gap-1 ${changeColor}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change)}%
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Análisis y Estadísticas</h1>
          <p className="mt-2 text-gray-600">
            Métricas de desempeño y tendencias del sistema
          </p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-800 mb-4">Error al cargar estadísticas: {error}</p>
          <button
            onClick={loadAnalytics}
            className="btn btn-outline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Análisis y Estadísticas</h1>
        <p className="mt-2 text-gray-600">
          Métricas de desempeño y tendencias del sistema
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="input"
            >
              {serviceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Cumplimiento de Activación"
          value={`${kpiData.compliance.value}%`}
          change={kpiData.compliance.change}
          icon={Activity}
          description={`${kpiData.compliance.approved} de ${kpiData.compliance.total} activaciones`}
        />

        <KPICard
          title="Registros Procesados"
          value={kpiData.processed.value}
          change={kpiData.processed.change}
          icon={FileText}
          description="Registros este mes"
        />

        <KPICard
          title="Evaluaciones Pendientes"
          value={kpiData.pending.value}
          change={kpiData.pending.change}
          icon={Clock}
          description="Promedio: 5 evaluaciones"
          variant="inverse"
        />

        <KPICard
          title="Pacientes Únicos"
          value={kpiData.uniquePatients.value}
          change={kpiData.uniquePatients.change}
          icon={Users}
          description="Pacientes este período"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Tendencia de Cumplimiento
            </h3>
            <div className="text-sm text-gray-500">
              Últimas 5 semanas
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' })}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  domain={[70, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Cumplimiento']}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('es-CL')}
                />
                <Line
                  type="monotone"
                  dataKey="compliance"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly processing */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Procesamiento Mensual
            </h3>
            <div className="text-sm text-gray-500">
              Últimos 6 meses
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="approved" fill="var(--success)" name="Aprobadas" />
                <Bar dataKey="total" fill="var(--primary)" name="Total" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Service breakdown */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Desglose por Servicio
          </h3>
          <div className="text-sm text-gray-500">
            Período seleccionado
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Registros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aprobados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  % Cumplimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Progreso
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceData.length > 0 ? (
                serviceData.map((service) => {
                  const compliance = Math.round((service.approved / service.total) * 100);
                  return (
                    <tr key={service.service} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {service.service}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {service.total}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {service.approved}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          compliance >= 90 ? 'bg-green-100 text-green-800' :
                          compliance >= 80 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {compliance}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${compliance}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No hay datos disponibles para el período seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
