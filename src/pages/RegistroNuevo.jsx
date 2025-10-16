import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, ArrowRight, ArrowLeft, Stethoscope, User, FileText, CheckCircle } from 'lucide-react';
import { Stepper } from '../components/Stepper.jsx';
import { FormField } from '../components/FormField.jsx';
import { Chip } from '../components/Chip.jsx';
import { FileUpload } from '../components/FileUpload.jsx';
import { PATIENT_FIELDS, CLINICAL_FIELDS, DIAGNOSIS_FIELD } from '../lib/fields.js';
import { patientSchema, clinicalSchema, diagnosisSchema } from '../lib/zod-schemas.js';
import { apiClient } from '../lib/apiClient.js';

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
  const [patientId, setPatientId] = useState(null);
  const [diagnosisOptions] = useState([
    { code: 'I10', description: 'Hipertensión arterial primaria' },
    { code: 'E11', description: 'Diabetes mellitus tipo 2' },
    { code: 'I50', description: 'Insuficiencia cardíaca' },
    { code: 'J44', description: 'Enfermedad pulmonar obstructiva crónica' },
  ]);
  const [selectedExams, setSelectedExams] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentStepData = STEPS[currentStep - 1];
  const resolver = currentStepData.schema ? zodResolver(currentStepData.schema) : undefined;

  const form = useForm({
    resolver,
    defaultValues: formData[currentStepData.id] || {},
  });

  const { handleSubmit, formState: { errors }, watch, setValue } = form;

  useEffect(() => {
    form.reset(formData[currentStepData.id] || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

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
    if (step === 1 || patientId || step <= currentStep) {
      setCurrentStep(step);
    } else {
      // Evitar avanzar si no existe paciente aún
      console.warn('Primero debe guardar el paciente');
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
      const payload = { ...formData, [currentStepData.id]: form.getValues() };
      await apiClient.saveDraft(payload);
      console.log('Borrador guardado', payload);
    } catch (error) {
      console.error('Error guardando borrador:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePaciente = async (data) => {
    // data corresponde a los valores del paso actual validados
    console.log('🔍 Datos recibidos del formulario:', data);
    setLoading(true);
    try {
      // Mapear campos del frontend a los nombres que espera el backend
      const payload = {
        rut: data.rut,
        nombre: data.firstName,
        apellido: data.lastName,
        fecha_nacimiento: data.birthDate,
        sexo: data.gender,
        telefono: data.phone,
        email: data.email,
        aseguradora: data.healthInsurance
      };

      console.log('📤 Payload a enviar al backend:', payload);

      const created = await apiClient.createPaciente(payload);
      console.log('✅ Respuesta del backend:', created);

      const newId = created?.id ?? created?.id_paciente;
      setPatientId(newId || null);
      setFormData(prev => ({ ...prev, patient: data }));

      console.log('🎉 Paciente guardado exitosamente con ID:', newId);

      // avanzar a diagnóstico
      setCurrentStep(2);
    } catch (error) {
      console.error('❌ Error guardando paciente:', error);
      console.error('❌ Detalles del error:', error.message);
      console.error('❌ Stack trace:', error.stack);
    } finally {
      setLoading(false);
    }
  };

  const onSavePacienteError = (errs) => {
    // Opcional: podrías hacer scroll al primer error o mostrar un toast
    console.warn('❌ Errores de validación:', errs);
    console.warn('❌ Datos del formulario actual:', form.getValues());
  };

  const submitRegistration = async (data) => {
    setLoading(true);
    try {
      // Asegurar que exista paciente (si llega directo al final sin guardarlo)
      let ensuredPatientId = patientId;
      if (!ensuredPatientId) {
        const patientData = formData.patient || {};
        const payload = {
          rut: patientData.rut,
          nombre: patientData.firstName,
          apellido: patientData.lastName,
          fecha_nacimiento: patientData.birthDate,
          sexo: patientData.gender,
          telefono: patientData.phone,
          email: patientData.email,
          aseguradora: patientData.healthInsurance
        };
        const created = await apiClient.createPaciente(payload);
        ensuredPatientId = created?.id ?? created?.id_paciente;
        setPatientId(ensuredPatientId || null);
      }

      // Crear Episodio primero
      const episodioPayload = {
        id_paciente: ensuredPatientId,
        centro: 'Hospital Test',
        fecha_adm: new Date().toISOString(),
        estado: 'activo'
      };
      const episodio = await apiClient.createEpisodio(episodioPayload);
      const episodioId = episodio?.id ?? episodio?.id_episodio;

      console.log('Episodio creado:', episodio);

      // Crear Diagnóstico vinculado al episodio
      const diagnosis = formData.diagnosis || {};
      const diagnosticoPayload = {
        id_episodio: episodioId,
        diagnostico: diagnosis.description || diagnosis.code || 'Diagnóstico pendiente',
        motivo_consulta: diagnosis.additionalNotes || '',
        condicion_clinica: 'Condición clínica pendiente',
        id_usuario: 1 // Usuario por defecto para testing
      };
      const diagnostico = await apiClient.createDiagnostico(diagnosticoPayload);

      // (Opcional) Podrías enviar parámetros clínicos a otro endpoint si corresponde
      // const clinicalPayload = { ...data, examinations: selectedExams, images: selectedImages, paciente_id: paciente?.id };

      console.log('Diagnóstico creado:', diagnostico);

      navigate(`/evaluacion/resultado/${ensuredPatientId ?? '123'}`);
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

      {/* File Upload Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Documentos Adjuntos</h3>
        <FileUpload
          label="Subir documentos médicos (PDF)"
          accept=".pdf"
          multiple={true}
          onFilesChange={setUploadedFiles}
          className="mb-6"
        />
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
                <dd className="text-sm text-gray-900">{(patientData.firstName ?? patientData.nombre ?? '')} {(patientData.lastName ?? patientData.apellido ?? '')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de nacimiento</dt>
                <dd className="text-sm text-gray-900">{patientData.birthDate ?? patientData.fecha_nacimiento ?? ''}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Previsión</dt>
                <dd className="text-sm text-gray-900">{patientData.healthInsurance ?? patientData.prevision ?? patientData.aseguradora ?? ''}</dd>
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
                <div>
                  <dt className="text-sm font-medium text-gray-500">Documentos adjuntos</dt>
                  <dd className="text-sm text-gray-900">
                    {uploadedFiles.length > 0 ? (
                      <div className="space-y-1">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-blue-600">📄 {file.name}</span>
                            {file.uploaded && <span className="text-green-600 text-xs">✓ Subido</span>}
                          </div>
                        ))}
                      </div>
                    ) : 'Ningún documento adjunto'}
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

      <form
        key={currentStep}
        onSubmit={handleSubmit(currentStep === 4 ? submitRegistration : onStepSubmit)}
        className="space-y-8"
      >
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

          {currentStep === 1 ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit(savePaciente, onSavePacienteError)}
              className="btn btn-primary"
            >
              {loading ? 'Guardando...' : 'Guardar paciente'}
            </button>
          ) : (
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
          )}
        </div>
      </form>
    </div>
  );
}
