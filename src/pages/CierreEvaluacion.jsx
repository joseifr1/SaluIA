import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle, XCircle, MessageSquare, Mail, ArrowRight, AlertTriangle } from 'lucide-react';
import { Textarea } from '../components/Textarea.jsx';

export function CierreEvaluacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get('action') || 'accept';
  const [loading, setLoading] = useState(false);

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

  // Mock data
  const evaluation = {
    id,
    patient: {
      name: 'María González Pérez',
      email: 'maria.gonzalez@email.cl',
    },
    episode: 'EP-2024-001',
    result: 'applies',
    confidence: 92,
  };

  const isRejecting = action === 'reject' || watch('decision') === 'rejected';

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const finalData = {
        evaluationId: id,
        decision: data.decision,
        observations: data.observations,
        feedback: data.feedback,
        notifyEmail: data.notifyEmail,
        timestamp: new Date().toISOString(),
      };

      console.log('Finalizando caso:', finalData);

      // Navigate back to records
      navigate('/registros', {
        state: {
          message: `Caso ${evaluation.episode} ${data.decision === 'accepted' ? 'aceptado' : 'rechazado'} exitosamente.`,
        },
      });
    } catch (error) {
      console.error('Error finalizando caso:', error);
    } finally {
      setLoading(false);
    }
  };

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

          <Textarea
            {...register('observations', {
              required: isRejecting ? 'Las observaciones son requeridas al rechazar un caso' : false,
            })}
            placeholder={isRejecting
              ? 'Explique las razones médicas para rechazar la activación de la Ley...'
              : 'Observaciones adicionales sobre el caso...'
            }
            rows={4}
            error={errors.observations?.message}
          />
          {errors.observations && (
            <p className="mt-1 text-sm text-red-600">{errors.observations.message}</p>
          )}
        </div>

        {/* AI Feedback */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback sobre la IA</h2>
          <p className="text-gray-600 mb-4">
            Su feedback ayuda a mejorar la precisión del sistema de evaluación automática:
          </p>

          <Textarea
            {...register('feedback')}
            placeholder="¿Qué tan precisa fue la evaluación de la IA? ¿Hay aspectos que podrían mejorarse?..."
            rows={3}
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
