import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, BarChart3, ArrowRight } from 'lucide-react';

export function Home() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Panel de Control</h1>
        <p className="text-lg text-gray-600">
          Sistema de registro y evaluación médica
        </p>
      </div>

      {/* All actions in one row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nuevo Registro */}
        <Link
          to="/registros/nuevo"
          className="group"
        >
          <div className="card bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-0 h-full">
            <div className="flex flex-col items-center text-center p-6 h-full">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Nuevo Registro</h2>
              <p className="text-white/90 text-sm leading-relaxed mb-4">
                Registrar paciente y diagnóstico médico para obtener una recomendación de la IA sobre pertinencia de la ley de urgencias
              </p>
            </div>
          </div>
        </Link>

        {/* Mis Registros */}
        <Link
          to="/registros"
          className="card hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 border-gray-200 hover:border-primary/30 h-full"
        >
          <div className="flex flex-col p-6 h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Mis Registros</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Revisa el estado de los registros médicos hechos
            </p>
          </div>
        </Link>

        {/* Análisis */}
        <Link
          to="/analitica"
          className="card hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border-2 border-gray-200 hover:border-primary/30 h-full"
        >
          <div className="flex flex-col p-6 h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Análisis</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Ver estadísticas y tendencias del sistema sobre todas las evaluaciones hechas por la IA, junto con la decisión médica y de la aseguradora
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
