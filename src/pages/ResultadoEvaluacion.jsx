import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ArrowRight, Printer, Download } from 'lucide-react';

export function ResultadoEvaluacion() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock evaluation result data
  const evaluation = {
    id,
    patient: {
      name: 'María González Pérez',
      rut: '12.345.678-9',
      age: 65,
      gender: 'Femenino',
    },
    episode: 'EP-2024-001',
    date: '2024-01-15',
    professional: 'Dr. Juan Pérez',
    diagnosis: {
      code: 'I10',
      description: 'Hipertensión arterial primaria',
    },
    result: 'applies',
    confidence: 92,
    criteria: [
      {
        id: 1,
        name: 'Criterios de Edad',
        status: 'met',
        description: 'Paciente mayor de 60 años',
        details: 'La paciente tiene 65 años, cumple con el criterio de edad establecido para la activación de la Ley.',
        weight: 'Alto',
      },
      {
        id: 2,
        name: 'Diagnóstico Principal',
        status: 'met',
        description: 'Diagnóstico incluido en la lista CIE-10',
        details: 'Hipertensión arterial primaria (I10) está incluida en la lista de diagnósticos que califican para la Ley.',
        weight: 'Crítico',
      },
      {
        id: 3,
        name: 'Parámetros Clínicos',
        status: 'met',
        description: 'Valores dentro de rangos establecidos',
        details: 'Presión arterial 160/95 mmHg supera los límites establecidos para hipertensión arterial.',
        weight: 'Alto',
      },
      {
        id: 4,
        name: 'Tratamiento Previo',
        status: 'partial',
        description: 'Evidencia de tratamiento farmacológico',
        details: 'Se observa tratamiento previo con antihipertensivos, pero requiere ajuste de dosis según protocolo.',
        weight: 'Medio',
      },
      {
        id: 5,
        name: 'Comorbilidades',
        status: 'not_met',
        description: 'Evaluación de condiciones asociadas',
        details: 'No se identifican comorbilidades significativas que modifiquen el manejo según protocolos.',
        weight: 'Bajo',
      },
    ],
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'applies':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'not_applies':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'uncertain':
        return <AlertCircle className="w-8 h-8 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getResultText = (result) => {
    switch (result) {
      case 'applies':
        return 'Aplica para Activación de Ley';
      case 'not_applies':
        return 'No Aplica para Activación de Ley';
      case 'uncertain':
        return 'Resultado Incierto - Revisión Manual Requerida';
      default:
        return 'Resultado Desconocido';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'applies':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'not_applies':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'uncertain':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getCriteriaIcon = (status) => {
    switch (status) {
      case 'met':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'not_met':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getCriteriaStatus = (status) => {
    switch (status) {
      case 'met':
        return 'Cumplido';
      case 'partial':
        return 'Parcial';
      case 'not_met':
        return 'No Cumplido';
      default:
        return 'Desconocido';
    }
  };

  const getWeightBadge = (weight) => {
    const colors = {
      'Crítico': 'bg-red-100 text-red-800',
      'Alto': 'bg-orange-100 text-orange-800',
      'Medio': 'bg-yellow-100 text-yellow-800',
      'Bajo': 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[weight] || colors['Bajo']}`}>
        {weight}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Mock PDF export
    console.log('Exportando PDF del resultado de evaluación');
  };

  const handleAccept = () => {
    navigate(`/evaluacion/cierre/${id}`);
  };

  const handleReject = () => {
    navigate(`/evaluacion/cierre/${id}?action=reject`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:max-w-none">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resultado de Evaluación</h1>
          <p className="mt-2 text-gray-600">
            Evaluación automática mediante Inteligencia Artificial
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="btn btn-outline"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </button>
          <button
            onClick={handleExportPDF}
            className="btn btn-outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Patient and episode info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Paciente</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nombre</dt>
              <dd className="text-sm text-gray-900">{evaluation.patient.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">RUT</dt>
              <dd className="text-sm text-gray-900">{evaluation.patient.rut}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Edad</dt>
                <dd className="text-sm text-gray-900">{evaluation.patient.age} años</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sexo</dt>
                <dd className="text-sm text-gray-900">{evaluation.patient.gender}</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Episodio</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Episodio</dt>
              <dd className="text-sm text-gray-900 font-medium">{evaluation.episode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha</dt>
              <dd className="text-sm text-gray-900">{new Date(evaluation.date).toLocaleDateString('es-CL')}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Profesional</dt>
              <dd className="text-sm text-gray-900">{evaluation.professional}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Diagnóstico</dt>
              <dd className="text-sm text-gray-900">
                {evaluation.diagnosis.code} - {evaluation.diagnosis.description}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Evaluation result */}
      <div className={`card ${getResultColor(evaluation.result)}`}>
        <div className="flex items-center gap-4 mb-4">
          {getResultIcon(evaluation.result)}
          <div className="flex-1">
            <h2 className="text-xl font-semibold">
              {getResultText(evaluation.result)}
            </h2>
            <p className="text-sm opacity-90 mt-1">
              Nivel de confianza: {evaluation.confidence}%
            </p>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Recomendación del Sistema</h3>
          <p className="text-sm">
            {evaluation.result === 'applies' 
              ? 'Se recomienda proceder con la activación de la Ley. El caso cumple con los criterios establecidos y presenta un alto nivel de confianza en la evaluación automática.'
              : evaluation.result === 'not_applies'
              ? 'No se recomienda la activación de la Ley para este caso. El paciente no cumple con los criterios mínimos requeridos según los protocolos establecidos.'
              : 'Se requiere revisión manual del caso. La evaluación automática no pudo determinar con certeza si aplica la activación de la Ley.'
            }
          </p>
        </div>
      </div>

      {/* Criteria evaluation */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Evaluación de Criterios</h2>
        
        <div className="space-y-4">
          {evaluation.criteria.map((criterion) => (
            <details key={criterion.id} className="group">
              <summary className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 list-none">
                <div className="flex items-center gap-3">
                  {getCriteriaIcon(criterion.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{criterion.name}</h3>
                      {getWeightBadge(criterion.weight)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {getCriteriaStatus(criterion.status)}
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
              </summary>
              
              <div className="p-4 border-l-4 border-gray-200 ml-4 mt-2">
                <p className="text-sm text-gray-700">{criterion.details}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="card print:hidden">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Disponibles</h2>
        <p className="text-gray-600 mb-6">
          Seleccione la acción apropiada basada en el resultado de la evaluación:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleAccept}
            className="btn btn-primary justify-center"
          >
            Aceptar Recomendación de la Ley
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          
          <button
            onClick={handleReject}
            className="btn btn-outline justify-center"
          >
            Rechazar Recomendación de la Ley
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Información Importante</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• La decisión final es responsabilidad del profesional médico</li>
            <li>• Se registrará la acción tomada para auditoría y seguimiento</li>
            <li>• Es posible proporcionar feedback sobre la evaluación de IA</li>
          </ul>
        </div>
      </div>
    </div>
  );
}