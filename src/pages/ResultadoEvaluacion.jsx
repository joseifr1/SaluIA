import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ArrowRight, Printer, Download, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';

export function ResultadoEvaluacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluacionMedica, setEvaluacionMedica] = useState(null);

  useEffect(() => {
    loadEvaluationData();
  }, [id]);

  // Recargar cuando se vuelve a la página desde CierreEvaluacion
  useEffect(() => {
    // Si venimos de CierreEvaluacion (location.state tiene refresh), recargar
    if (location.state?.refresh) {
      loadEvaluationData();
      // Limpiar el state para evitar recargas innecesarias
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state]);

  const loadEvaluationData = async () => {
    setLoading(true);
    setError(null);
    try {
      // El ID es el id_episodio, usar el endpoint de registros que tiene toda la información
      const registros = await apiClient.getRegistros();
      const registro = registros.find(r => r.id === parseInt(id));

      if (!registro) {
        throw new Error('Episodio no encontrado');
      }

      // Verificar si ya existe una evaluación médica
      if (registro.id_eval_medica) {
        const evaluacionMedicaExistente = await apiClient.getEvaluacionLeyUrgencia(registro.id_eval_medica);
        setEvaluacionMedica(evaluacionMedicaExistente);
      }

      // Obtener evaluación IA para obtener más detalles
      let evaluacionIA = null;
      if (registro.id_eval_ia) {
        try {
          evaluacionIA = await apiClient.request(`/evaluacion-ia/${registro.id_eval_ia}`);
        } catch (err) {
          console.warn('No se pudo obtener detalles de la evaluación IA:', err);
        }
      }

      // Determinar resultado basado en la evaluación IA
      let result = 'uncertain';
      let confidence = 0;
      if (evaluacionIA) {
        result = evaluacionIA.pertinencia_ia ? 'applies' : 'not_applies';
        confidence = evaluacionIA.confianza ? Math.round(evaluacionIA.confianza * 100) : 0;
      }

      setEvaluation({
        id: id,
        id_eval_ia: registro.id_eval_ia,
        patient: {
          name: registro.patient || 'N/A',
          rut: registro.rut || 'N/A',
          age: registro.age || null,
          gender: 'N/A', // No está en el registro
        },
        episode: registro.episode,
        date: registro.date || new Date().toISOString(),
        professional: registro.professional || 'N/A',
        diagnosis: {
          code: 'N/A', // No está disponible en el registro
          description: registro.diagnosis || 'Sin diagnóstico',
        },
        result: result,
        confidence: confidence,
        criterios: evaluacionIA?.criterios || '',
        justificacion: evaluacionIA?.justificacion || '',
      });
    } catch (err) {
      console.error('Error cargando evaluación:', err);
      setError(err.message || 'Error al cargar la evaluación');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-800">Error: {error || 'No se pudo cargar la evaluación'}</p>
        </div>
      </div>
    );
  }

  // Si ya existe una evaluación médica, no mostrar los botones de aceptar/rechazar
  const yaProcesada = evaluacionMedica !== null;

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
      {evaluation.criterios && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Criterios Evaluados</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{evaluation.criterios}</p>
          </div>
        </div>
      )}

      {/* Justificación */}
      {evaluation.justificacion && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Justificación</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{evaluation.justificacion}</p>
          </div>
        </div>
      )}

      {/* Evaluación médica existente */}
      {yaProcesada && evaluacionMedica && (
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Evaluación Médica Realizada</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-blue-800">Decisión: </span>
              <span className="text-sm text-blue-700">
                {evaluacionMedica.pertinencia_medico ? 'Aplica para Activación de Ley' : 'No Aplica para Activación de Ley'}
              </span>
            </div>
            {evaluacionMedica.observaciones && (
              <div>
                <span className="text-sm font-medium text-blue-800">Observaciones: </span>
                <p className="text-sm text-blue-700 mt-1">{evaluacionMedica.observaciones}</p>
              </div>
            )}
            {evaluacionMedica.medico && (
              <div>
                <span className="text-sm font-medium text-blue-800">Evaluado por: </span>
                <span className="text-sm text-blue-700">
                  {evaluacionMedica.medico.nombre} {evaluacionMedica.medico.apellido}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions - Solo mostrar si no hay evaluación médica */}
      {!yaProcesada && (
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
      )}

      {/* Mensaje si ya fue procesada */}
      {yaProcesada && (
        <div className="card print:hidden bg-gray-50 border-gray-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Evaluación ya procesada</h3>
              <p className="text-sm text-gray-600 mt-1">
                Esta evaluación ya ha sido procesada por un médico. No se pueden realizar cambios adicionales.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
