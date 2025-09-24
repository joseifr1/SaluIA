import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, ArrowRight, ArrowLeft, Stethoscope, User, FileText, CheckCircle } from 'lucide-react';
import { Stepper } from '../components/Stepper.jsx';
import { FormField } from '../components/FormField.jsx';
import { Chip } from '../components/Chip.jsx';
import { PATIENT_FIELDS, CLINICAL_FIELDS, DIAGNOSIS_FIELD } from '../lib/fields.js';
import { patientSchema, clinicalSchema, diagnosisSchema } from '../lib/zod-schemas.js';

const STEPS = [
  {
    id: 'patient',
    title: 'Datos del Paciente',
    description: 'Información básica y de contacto',
    icon: User,
    schema: patientSchema,
  },
  {
    id: 'diagnosis',
    title: 'Diagnóstico',
    description: 'Diagnóstico CIE-10 y descripción',
    icon: Stethoscope,
    schema: diagnosisSchema,
  },
  {
    id: 'clinical',
    title: 'Parámetros Clínicos',
    description: 'Signos vitales y exámenes',
    icon: FileText,
    schema: clinicalSchema,
  },
  {
    id: 'review',
    title: 'Revisión y Envío',
    description: 'Confirmar información',
    icon: CheckCircle,
    schema: null,
  },
];

export function RegistroNuevo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [diagnosisOptions] = useState([
    { code: 'I10', description: 'Hipertensión arterial primaria' },
    { code: 'E11', description: 'Diabetes mellitus tipo 2' },
    { code: 'I50', description: 'Insuficiencia cardíaca' },
    { code: 'J44', description: 'Enfermedad pulmonar obstructiva crónica' },
  ]);
  const [selectedExams, setSelectedExams] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentStepData = STEPS[currentStep - 1];
  
  const form = useForm({
    resolver: currentStepData.schema ? zodResolver(currentStepData.schema) : undefined,
    defaultValues: formData[currentStepData.id] || {},
  });

  const { handleSubmit, formState: { errors }, watch, setValue } = form;

  const examOptions = ['Hemograma', 'Glicemia', 'Creatinina', 'Electrolitos', 'ECG', 'Ecocardiograma'];
  const imageOptions = ['Radiografía tórax', 'TAC tórax', 'Resonancia magnética', 'Ecotomografía'];

  const onStepSubmit = (data) => {
    setFormData(prev => ({
      ...prev,
      [currentStepData.id]: data,
    }));

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToStep = (step) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveDraft = async () => {
    setLoading(true);
    try {
      // Mock save draft
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app: await apiClient.saveDraft({ ...formData, [currentStepData.id]: form.getValues() });
      console.log('Borrador guardado', { ...formData, [currentStepData.id]: form.getValues() });
    } catch (error) {
      console.error('Error guardando borrador:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async (data) => {
    setLoading(true);
    try {
      const finalData = {
        ...formData,
        clinical: {
          ...data,
          examinations: selectedExams,
          images: selectedImages,
        }
      };
      
      // Mock submit
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Registro enviado:', finalData);
      
      // Navigate to evaluation
      navigate('/evaluacion/resultado/123');
    } catch (error) {
      console.error('Error enviando registro:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPatientStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PATIENT_FIELDS.map(field => (
          <FormField
            key={field.id}
            field={field}
            value={watch(field.id)}
            onChange={(value) => setValue(field.id, value)}
            error={errors[field.id]?.message}
          />
        ))}
      </div>
    </div>
  );

  const renderDiagnosisStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Diagnóstico CIE-10 *
        </label>
        <select
          value={watch('code') || ''}
          onChange={(e) => {
            const selected = diagnosisOptions.find(d => d.code === e.target.value);
            if (selected) {
              setValue('code', selected.code);
              setValue('description', selected.description);
            }
          }}
          className="input"
        >
          <option value="">Seleccionar diagnóstico...</option>
          {diagnosisOptions.map(diagnosis => (
            <option key={diagnosis.code} value={diagnosis.code}>
              {diagnosis.code} - {diagnosis.description}
            </option>
          ))}
        </select>
        {errors.code && (
          <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción adicional
        </label>
        <textarea
          value={watch('additionalNotes') || ''}
          onChange={(e) => setValue('additionalNotes', e.target.value)}
          placeholder="Información adicional sobre el diagnóstico..."
          className="input min-h-[100px] resize-y"
          rows={4}
        />
      </div>
    </div>
  );

  const renderClinicalStep = () => (
    <div className="space-y-8">
      {/* Vital signs */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Signos Vitales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CLINICAL_FIELDS.map(field => (
            <FormField
              key={field.id}
              field={field}
              value={watch(field.id)}
              onChange={(value) => setValue(field.id, value)}
              error={errors[field.id]?.message}
            />
          ))}
        </div>
      </div>

      {/* Examinations */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Exámenes</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {examOptions.map(exam => (
              <button
                key={exam}
                type="button"
                onClick={() => {
                  if (selectedExams.includes(exam)) {
                    setSelectedExams(prev => prev.filter(e => e !== exam));
                  } else {
                    setSelectedExams(prev => [...prev, exam]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedExams.includes(exam)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                }`}
              >
                {exam}
              </button>
            ))}
          </div>
          
          {selectedExams.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedExams.map(exam => (
                <Chip
                  key={exam}
                  onRemove={() => setSelectedExams(prev => prev.filter(e => e !== exam))}
                  variant="primary"
                >
                  {exam}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Images */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Imágenes</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {imageOptions.map(image => (
              <button
                key={image}
                type="button"
                onClick={() => {
                  if (selectedImages.includes(image)) {
                    setSelectedImages(prev => prev.filter(i => i !== image));
                  } else {
                    setSelectedImages(prev => [...prev, image]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedImages.includes(image)
                    ? 'bg-secondary text-white border-secondary'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-secondary'
                }`}
              >
                {image}
              </button>
            ))}
          </div>
          
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedImages.map(image => (
                <Chip
                  key={image}
                  onRemove={() => setSelectedImages(prev => prev.filter(i => i !== image))}
                  variant="secondary"
                >
                  {image}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const patientData = formData.patient || {};
    const diagnosisData = formData.diagnosis || {};
    const clinicalData = formData.clinical || {};

    return (
      <div className="space-y-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Resumen del Registro</h3>
          <p className="text-sm text-blue-700">
            Revise cuidadosamente la información antes de enviar para evaluación con IA.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient info */}
          <div className="card">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Datos del Paciente
            </h4>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">RUT</dt>
                <dd className="text-sm text-gray-900">{patientData.rut}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                <dd className="text-sm text-gray-900">{patientData.firstName} {patientData.lastName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de nacimiento</dt>
                <dd className="text-sm text-gray-900">{patientData.birthDate}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Previsión</dt>
                <dd className="text-sm text-gray-900">{patientData.healthInsurance}</dd>
              </div>
            </dl>
          </div>

          {/* Diagnosis */}
          <div className="card">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Diagnóstico
            </h4>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Código CIE-10</dt>
                <dd className="text-sm text-gray-900">{diagnosisData.code}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                <dd className="text-sm text-gray-900">{diagnosisData.description}</dd>
              </div>
            </dl>
          </div>

          {/* Clinical parameters */}
          <div className="card lg:col-span-2">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Parámetros Clínicos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Presión Arterial</dt>
                  <dd className="text-sm text-gray-900">{clinicalData.bloodPressure || 'No registrado'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Frecuencia Cardíaca</dt>
                  <dd className="text-sm text-gray-900">{clinicalData.heartRate ? `${clinicalData.heartRate} lpm` : 'No registrado'}</dd>
                </div>
              </dl>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Temperatura</dt>
                  <dd className="text-sm text-gray-900">{clinicalData.temperature ? `${clinicalData.temperature}°C` : 'No registrado'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Saturación O₂</dt>
                  <dd className="text-sm text-gray-900">{clinicalData.oxygenSaturation ? `${clinicalData.oxygenSaturation}%` : 'No registrado'}</dd>
                </div>
              </dl>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Exámenes</dt>
                  <dd className="text-sm text-gray-900">
                    {selectedExams.length > 0 ? selectedExams.join(', ') : 'Ninguno seleccionado'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Imágenes</dt>
                  <dd className="text-sm text-gray-900">
                    {selectedImages.length > 0 ? selectedImages.join(', ') : 'Ninguna seleccionada'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderPatientStep();
      case 2: return renderDiagnosisStep();
      case 3: return renderClinicalStep();
      case 4: return renderReviewStep();
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nuevo Registro Médico</h1>
        <p className="mt-2 text-gray-600">
          Complete la información del paciente y parámetros clínicos para evaluación
        </p>
      </div>

      <Stepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      <form onSubmit={handleSubmit(currentStep === 4 ? submitRegistration : onStepSubmit)} className="space-y-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            {React.createElement(currentStepData.icon, { className: 'w-6 h-6 text-primary' })}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{currentStepData.title}</h2>
              <p className="text-gray-600">{currentStepData.description}</p>
            </div>
          </div>

          {renderCurrentStep()}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="btn btn-outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </button>
            )}
            
            <button
              type="button"
              onClick={saveDraft}
              disabled={loading}
              className="btn btn-outline"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar borrador'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {currentStep === 4 ? (
              loading ? 'Enviando...' : 'Evaluar con IA'
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}