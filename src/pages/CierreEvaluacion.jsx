import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle, XCircle, MessageSquare, Mail, ArrowRight, AlertTriangle, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';

export function CierreEvaluacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') || 'accept';
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      observations: '',
      feedback: '',
      notifyEmail: true,
      decision: action === 'reject' ? 'rejected' : 'accepted',
    },
  });

  useEffect(() => {
    loadEvaluationData();
  }, [id]);

  const loadEvaluationData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      // El ID es el id_episodio, obtener datos del registro
      const registros = await apiClient.getRegistros();
      console.log('Registros obtenidos:', registros);
      const registro = registros.find(r => r.id === parseInt(id));
      console.log('Registro encontrado:', registro);

      if (!registro) {
        throw new Error('Episodio no encontrado');
      }

      // Verificar que tenemos id_eval_ia
      if (!registro.id_eval_ia) {
        console.warn('No hay evaluación IA para este episodio:', registro);
        throw new Error('Este episodio no tiene una evaluación IA. Debe crear y evaluar un diagnóstico primero.');
      }

      // Obtener evaluación IA para obtener más detalles
      let evaluacionIA = null;
      try {
        evaluacionIA = await apiClient.request(`/evaluacion-ia/${registro.id_eval_ia}`);
        console.log('Evaluación IA obtenida:', evaluacionIA);
      } catch (err) {
        console.error('Error obteniendo evaluación IA:', err);
        throw new Error('No se pudo obtener la evaluación IA. Por favor, intente nuevamente.');
      }

      const año = registro.date ? new Date(registro.date).getFullYear() : new Date().getFullYear();
      const numeroEpisodio = `EP-${año}-${String(registro.id).padStart(3, '0')}`;

      const evaluationData = {
        id: id,
        id_episodio: registro.id,
        id_eval_ia: registro.id_eval_ia,
        patient: {
          name: registro.patient || 'N/A',
          email: '', // No está disponible en el registro
        },
        episode: numeroEpisodio,
        result: evaluacionIA?.pertinencia_ia ? 'applies' : 'not_applies',
        confidence: evaluacionIA?.confianza ? Math.round(evaluacionIA.confianza * 100) : 0,
      };

      console.log('Datos de evaluación a guardar:', evaluationData);
      setEvaluation(evaluationData);
      return evaluationData;
    } catch (err) {
      console.error('Error cargando evaluación:', err);
      setError(err.message || 'Error al cargar la evaluación');
      throw err; // Re-lanzar para que el llamador pueda manejarlo
    } finally {
      setLoadingData(false);
    }
  };

  const isRejecting = action === 'reject' || watch('decision') === 'rejected';

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      console.log('Datos de evaluation actual:', evaluation);
      console.log('id_episodio:', evaluation?.id_episodio);
      console.log('id_eval_ia:', evaluation?.id_eval_ia);

      // Si no hay evaluación cargada o faltan datos, intentar cargarla de nuevo
      let currentEvaluation = evaluation;
      if (!currentEvaluation || !currentEvaluation.id_episodio || !currentEvaluation.id_eval_ia) {
        console.log('Recargando datos de evaluación...');
        currentEvaluation = await loadEvaluationData();
        if (!currentEvaluation || !currentEvaluation.id_episodio || !currentEvaluation.id_eval_ia) {
          throw new Error('No se pudo cargar la información completa de la evaluación. Por favor, intente nuevamente.');
        }
      }

      // Validar que tenemos los datos necesarios
      if (!currentEvaluation.id_episodio) {
        throw new Error('No se encontró el ID del episodio. Por favor, intente nuevamente.');
      }

      if (!currentEvaluation.id_eval_ia) {
        throw new Error('No se encontró la evaluación IA para este episodio. Asegúrese de que el diagnóstico haya sido evaluado por la IA primero.');
      }

      // Determinar pertinencia_medico basado en la decisión
      const pertinencia_medico = data.decision === 'accepted';

      const evaluacionData = {
        id_episodio: currentEvaluation.id_episodio,
        id_eval_ia: currentEvaluation.id_eval_ia,
        id_medico: 1, // TODO: Obtener ID del médico logueado
        pertinencia_medico: pertinencia_medico,
        observaciones: data.observations || '',
        estado_aseguradora: 'Pendiente',
        sugerencia_ia: currentEvaluation.result === 'applies' ? 'Activar' : 'No activar'
      };

      console.log('Creando evaluación médica con datos:', evaluacionData);

      const response = await apiClient.createEvaluacionLeyUrgencia(evaluacionData);
      console.log('Evaluación médica creada exitosamente:', response);

      // Navegar de vuelta a la página de resultado para que se actualice
      navigate(`/evaluacion/resultado/${id}`, {
        state: {
          message: `Caso ${currentEvaluation.episode} ${data.decision === 'accepted' ? 'aceptado' : 'rechazado'} exitosamente.`,
          refresh: true, // Flag para indicar que debe recargar
        },
      });
    } catch (error) {
      console.error('Error finalizando caso:', error);
      alert('Error al finalizar el caso: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de evaluación...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-800">Error: {error || 'No se pudo cargar la evaluación'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 btn btn-outline"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cierre de Evaluación</h1>
        <p className="mt-2 text-gray-600">
          Complete el proceso de evaluación del episodio {evaluation.episode}
        </p>
      </div>

      {/* Patient info summary */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Caso</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Paciente</p>
            <p className="font-medium">{evaluation.patient.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Episodio</p>
            <p className="font-medium">{evaluation.episode}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Resultado IA</p>
            <div className="flex items-center gap-2">
              {evaluation.result === 'applies' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {evaluation.result === 'applies' ? 'Aplica' : 'No Aplica'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Confianza</p>
            <p className="font-medium">{evaluation.confidence}%</p>
          </div>
        </div>
      </div>

      {/* Decision form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Decision selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Decisión Final</h2>
          <p className="text-gray-600 mb-4">
            Seleccione su decisión final sobre la activación de la Ley para este caso:
          </p>

          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                {...register('decision')}
                type="radio"
                value="accepted"
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
              />
              <div className="ml-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">Aceptar Activación de Ley</p>
                  <p className="text-sm text-gray-500">
                    El caso cumple con los criterios y se procede con la activación
                  </p>
                </div>
              </div>
            </label>

            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                {...register('decision')}
                type="radio"
                value="rejected"
                className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
              />
              <div className="ml-3 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">Rechazar Activación de Ley</p>
                  <p className="text-sm text-gray-500">
                    El caso no cumple con los criterios requeridos
                  </p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Observations */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Observaciones Clínicas
          </h2>
          <p className="text-gray-600 mb-4">
            {isRejecting
              ? 'Documente las razones por las cuales rechaza la activación de la Ley:'
              : 'Agregue observaciones adicionales sobre este caso (opcional):'
            }
          </p>

          <textarea
            {...register('observations', {
              required: isRejecting ? 'Las observaciones son requeridas al rechazar un caso' : false,
            })}
            placeholder={isRejecting
              ? 'Explique las razones médicas para rechazar la activación de la Ley...'
              : 'Observaciones adicionales sobre el caso...'
            }
            rows={4}
            className="input min-h-[100px] resize-y"
          />
          {errors.observations && (
            <p className="text-sm text-red-600">{errors.observations.message}</p>
          )}
        </div>

        {/* AI Feedback */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback sobre la IA</h2>
          <p className="text-gray-600 mb-4">
            Su feedback ayuda a mejorar la precisión del sistema de evaluación automática:
          </p>

          <textarea
            {...register('feedback')}
            placeholder="¿Qué tan precisa fue la evaluación de la IA? ¿Hay aspectos que podrían mejorarse?..."
            rows={3}
            className="input min-h-[100px] resize-y"
          />
        </div>

        {/* Notification settings */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configuración de Notificaciones
          </h2>

          <label className="flex items-start gap-3">
            <input
              {...register('notifyEmail')}
              type="checkbox"
              className="mt-1 w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">Notificar por correo electrónico</p>
              <p className="text-sm text-gray-500">
                Enviar notificación de la decisión final a: {evaluation.patient.email}
              </p>
            </div>
          </label>
        </div>

        {/* Warning for rejection */}
        {isRejecting && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Confirmación Requerida</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Está rechazando la activación de la Ley para este caso. Asegúrese de que las observaciones
                  documenten claramente las razones médicas para esta decisión.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`btn ${isRejecting ? 'btn-outline text-red-600 border-red-300 hover:bg-red-50' : 'btn-primary'}`}
          >
            {loading ? (
              'Procesando...'
            ) : (
              <>
                {isRejecting ? 'Rechazar Caso' : 'Finalizar Proceso'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
