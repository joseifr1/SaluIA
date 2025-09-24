import React from 'react';
import { FileX, Search, Plus } from 'lucide-react';

export function EmptyState({ 
  icon: Icon = FileX,
  title,
  description,
  action,
  className = ''
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action}
    </div>
  );
}

// Specialized empty states
export function NoRecordsFound({ searchQuery, onClear, onCreate }) {
  if (searchQuery) {
    return (
      <EmptyState
        icon={Search}
        title="Sin resultados"
        description={`No se encontraron registros que coincidan con "${searchQuery}"`}
        action={
          <button
            onClick={onClear}
            className="btn btn-outline"
          >
            Limpiar filtros
          </button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={Plus}
      title="No tienes registros"
      description="Comienza creando tu primer registro médico"
      action={
        <button
          onClick={onCreate}
          className="btn btn-primary"
        >
          Crear primer registro
        </button>
      }
    />
  );
}