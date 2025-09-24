import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="text-6xl font-bold text-gray-900 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Página no encontrada
        </h1>
        <p className="text-gray-600 mb-8">
          La página que está buscando no existe o ha sido movida.
        </p>
        
        <div className="space-y-4">
      Invalid input:    <Link
            to="/"
            className="btn btn-primary inline-flex items-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al inicio
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline inline-flex items-center ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
}