import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, ArrowRight, ArrowLeft, Stethoscope, User, FileText, CheckCircle } from 'lucide-react';
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
      const currentData = form.getValues();
      
      // Si estamos en el paso de paciente, mapear a la estructura de la API
      if (currentStepData.id === 'patient') {
        const apiData = {
          rut: currentData.rut || '',
          nombre: currentData.firstName || '',
          apellido: currentData.lastName || '',
          fecha_nacimiento: currentData.birthDate || '',
          sexo: currentData.gender || '',
          telefono: currentData.phone || '',
          email: currentData.email || '',
          aseguradora: currentData.healthInsurance || '',
          status: 'draft'
        };
        
        await apiClient.saveDraft(apiData);
      } else {
        // Para otros pasos, usar la estructura original
        const draftData = {
          ...formData,
          [currentStepData.id]: currentData,
          status: 'draft',
          step: currentStep
        };
        
        await apiClient.saveDraft(draftData);
      }
      
      console.log('Borrador guardado exitosamente');
      alert('Borrador guardado exitosamente');
    } catch (error) {
      console.error('Error guardando borrador:', error);
      alert('Error al guardar borrador: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitPatientData = async (data) => {
    setLoading(true);
    try {
      // Mapear datos del formulario a la estructura que espera la API
      const apiData = {
        rut: data.rut || '',
        nombre: data.firstName || '',
        apellido: data.lastName || '',
        fecha_nacimiento: data.birthDate || '',
        sexo: data.gender || '',
        telefono: data.phone || '',
        email: data.email || '',
        aseguradora: data.healthInsurance || ''
      };
      
      console.log('Enviando datos del paciente a la API:', apiData);
      console.log('URL completa:', `${apiClient.baseURL}/pacientes`);
      
      // POST real al backend usando el endpoint de pacientes
      const response = await apiClient.createPatient(apiData);
      console.log('Paciente creado exitosamente:', response);
      
      // Guardar datos y avanzar al siguiente paso
      setFormData(prev => ({
        ...prev,
        patient: data,
      }));
      
      setCurrentStep(currentStep + 1);
      
      alert('Paciente creado exitosamente');
    } catch (error) {
      console.error('Error creando paciente:', error);
      
      // Si es error de conexión, usar datos mock
      if (error.message.includes('No se puede conectar al servidor') || error.message.includes('Load failed')) {
        console.log('Backend no disponible o endpoint incorrecto, usando datos mock');
        console.log('Error específico:', error.message);
        console.log('Verifique que el endpoint /pacientes esté disponible en http://127.0.0.1:8000');
        
        // Simular respuesta exitosa
        const mockResponse = {
          id: Math.floor(Math.random() * 1000) + 1,
          message: 'Paciente creado (modo demo)',
          ...apiData
        };
        
        console.log('Paciente creado en modo demo:', mockResponse);
        
        // Guardar datos y avanzar al siguiente paso
        setFormData(prev => ({
          ...prev,
          patient: data,
        }));
        
        setCurrentStep(currentStep + 1);
        
        alert('Paciente creado exitosamente (modo demo - verifique endpoint /pacientes en http://127.0.0.1:8000)');
      } else {
        alert('Error al crear paciente: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async (data) => {
    setLoading(true);
    try {
      // Mapear datos del formulario a la estructura que espera la API
      const patientData = formData.patient || {};
      const apiData = {
        rut: patientData.rut || '',
        nombre: patientData.firstName || '',
        apellido: patientData.lastName || '',
        fecha_nacimiento: patientData.birthDate || '',
        sexo: patientData.gender || '',
        telefono: patientData.phone || '',
        email: patientData.email || '',
        aseguradora: patientData.healthInsurance || ''
      };
      
      console.log('Enviando datos a la API:', apiData);
      
      // POST real al backend
      const response = await apiClient.createRecord(apiData);
      console.log('Registro enviado exitosamente:', response);
      
      // Navigate to evaluation con el ID real del registro
      navigate(`/evaluacion/resultado/${response.id}`);
    } catch (error) {
      console.error('Error enviando registro:', error);
      alert('Error al enviar registro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPatientStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RUT */}
        <div className="space-y-2">
          <label htmlFor="rut" className="block text-sm font-medium text-gray-700">
            RUT
          </label>
          <input
            id="rut"
            type="text"
            value={watch('rut') || ''}
            onChange={(e) => setValue('rut', e.target.value)}
            placeholder="12.345.678-9"
            className="input"
          />
          {errors.rut && <p className="text-sm text-red-600">{errors.rut.message}</p>}
        </div>

        {/* Nombres */}
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            Nombres
          </label>
          <input
            id="firstName"
            type="text"
            value={watch('firstName') || ''}
            onChange={(e) => setValue('firstName', e.target.value)}
            placeholder="Juan Carlos"
            className="input"
          />
          {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message}</p>}
        </div>

        {/* Apellidos */}
        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Apellidos
          </label>
          <input
            id="lastName"
            type="text"
            value={watch('lastName') || ''}
            onChange={(e) => setValue('lastName', e.target.value)}
            placeholder="Pérez González"
            className="input"
          />
          {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message}</p>}
        </div>

        {/* Fecha de Nacimiento */}
        <div className="space-y-2">
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
            Fecha de Nacimiento
          </label>
          <input
            id="birthDate"
            type="date"
            value={watch('birthDate') || ''}
            onChange={(e) => setValue('birthDate', e.target.value)}
            className="input"
          />
          {errors.birthDate && <p className="text-sm text-red-600">{errors.birthDate.message}</p>}
        </div>

        {/* Sexo */}
        <div className="space-y-2">
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            Sexo
          </label>
          <select
            id="gender"
            value={watch('gender') || ''}
            onChange={(e) => setValue('gender', e.target.value)}
            className="input"
          >
            <option value="">Seleccionar sexo</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
          {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
        </div>

        {/* Previsión */}
        <div className="space-y-2">
          <label htmlFor="healthInsurance" className="block text-sm font-medium text-gray-700">
            Previsión
          </label>
          <select
            id="healthInsurance"
            value={watch('healthInsurance') || ''}
            onChange={(e) => setValue('healthInsurance', e.target.value)}
            className="input"
          >
            <option value="">Seleccionar previsión</option>
            <option value="fonasa">FONASA</option>
            <option value="isapre">ISAPRE</option>
            <option value="particular">Particular</option>
            <option value="otro">Otro</option>
          </select>
          {errors.healthInsurance && <p className="text-sm text-red-600">{errors.healthInsurance.message}</p>}
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Teléfono
          </label>
          <input
            id="phone"
            type="tel"
            value={watch('phone') || ''}
            onChange={(e) => setValue('phone', e.target.value)}
            placeholder="+56 9 1234 5678"
            className="input"
          />
          {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={watch('email') || ''}
            onChange={(e) => setValue('email', e.target.value)}
            placeholder="paciente@ejemplo.cl"
            className="input"
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
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
          {/* Presión Arterial */}
          <div className="space-y-2">
            <label htmlFor="bloodPressure" className="block text-sm font-medium text-gray-700">
              Presión Arterial
            </label>
            <input
              id="bloodPressure"
              type="text"
              value={watch('bloodPressure') || ''}
              onChange={(e) => setValue('bloodPressure', e.target.value)}
              placeholder="120/80"
              className="input"
            />
            {errors.bloodPressure && <p className="text-sm text-red-600">{errors.bloodPressure.message}</p>}
          </div>

          {/* Frecuencia Cardíaca */}
          <div className="space-y-2">
            <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700">
              Frecuencia Cardíaca
            </label>
            <input
              id="heartRate"
              type="number"
              value={watch('heartRate') || ''}
              onChange={(e) => setValue('heartRate', e.target.value)}
              placeholder="72"
              className="input"
            />
            {errors.heartRate && <p className="text-sm text-red-600">{errors.heartRate.message}</p>}
          </div>

          {/* Frecuencia Respiratoria */}
          <div className="space-y-2">
            <label htmlFor="respiratoryRate" className="block text-sm font-medium text-gray-700">
              Frecuencia Respiratoria
            </label>
            <input
              id="respiratoryRate"
              type="number"
              value={watch('respiratoryRate') || ''}
              onChange={(e) => setValue('respiratoryRate', e.target.value)}
              placeholder="16"
              className="input"
            />
            {errors.respiratoryRate && <p className="text-sm text-red-600">{errors.respiratoryRate.message}</p>}
          </div>

          {/* Temperatura */}
          <div className="space-y-2">
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
              Temperatura
            </label>
            <input
              id="temperature"
              type="number"
              step="0.1"
              value={watch('temperature') || ''}
              onChange={(e) => setValue('temperature', e.target.value)}
              placeholder="36.5"
              className="input"
            />
            {errors.temperature && <p className="text-sm text-red-600">{errors.temperature.message}</p>}
          </div>

          {/* Saturación de Oxígeno */}
          <div className="space-y-2">
            <label htmlFor="oxygenSaturation" className="block text-sm font-medium text-gray-700">
              Saturación de Oxígeno
            </label>
            <input
              id="oxygenSaturation"
              type="number"
              value={watch('oxygenSaturation') || ''}
              onChange={(e) => setValue('oxygenSaturation', e.target.value)}
              placeholder="98"
              className="input"
            />
            {errors.oxygenSaturation && <p className="text-sm text-red-600">{errors.oxygenSaturation.message}</p>}
          </div>
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
                <span
                  key={exam}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                >
                  {exam}
                  <button
                    type="button"
                    onClick={() => setSelectedExams(prev => prev.filter(e => e !== exam))}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10"
                  >
                    ×
                  </button>
                </span>
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
                <span
                  key={image}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-secondary/10 text-secondary"
                >
                  {image}
                  <button
                    type="button"
                    onClick={() => setSelectedImages(prev => prev.filter(i => i !== image))}
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10"
                  >
                    ×
                  </button>
                </span>
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

      {/* Stepper simplificado */}
      <nav className="mb-8">
        <ol className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            const isClickable = stepNumber <= currentStep;

            return (
              <li key={step.id} className="flex-1">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={isClickable ? () => goToStep(stepNumber) : undefined}
                    disabled={!isClickable}
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                      isActive ? 'bg-primary text-white' :
                      isCompleted ? 'bg-green-500 text-white' :
                      'bg-gray-200 text-gray-500 hover:bg-gray-300 cursor-pointer'
                    }`}
                  >
                    {isCompleted ? '✓' : stepNumber}
                  </button>
                  
                  <div className="ml-3 min-w-0 flex-1">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  </div>

                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ml-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={handleSubmit(currentStep === 4 ? submitRegistration : (currentStep === 1 ? submitPatientData : onStepSubmit))} className="space-y-8">
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