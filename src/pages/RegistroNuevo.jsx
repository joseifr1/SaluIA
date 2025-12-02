import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Stethoscope, User, FileText, CheckCircle } from 'lucide-react';
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
    title: 'Diagnóstico Médico',
    description: 'Motivo de consulta, anamnesis y diagnóstico',
    icon: Stethoscope,
    schema: diagnosisSchema,
  },
  {
    id: 'evaluation',
    title: 'Evaluación IA',
    description: 'Análisis automático del caso',
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
  const [observacionesMedico, setObservacionesMedico] = useState('');
  const [rutValidation, setRutValidation] = useState({ isValid: null, message: '' });
  const navigate = useNavigate();

  const currentStepData = STEPS[currentStep - 1];
  
  const form = useForm({
    resolver: currentStepData.schema ? zodResolver(currentStepData.schema) : undefined,
    defaultValues: formData[currentStepData.id] || {},
  });

  const { handleSubmit, formState: { errors }, watch, setValue } = form;

  const examOptions = ['Hemograma', 'Glicemia', 'Creatinina', 'Electrolitos', 'ECG', 'Ecocardiograma'];
  const imageOptions = ['Radiografía tórax', 'TAC tórax', 'Resonancia magnética', 'Ecotomografía'];

  // Funciones para formatear fecha DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    // Si viene en formato YYYY-MM-DD (de input type="date")
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    // Si ya viene en formato DD/MM/YYYY, devolverlo tal cual
    return dateString;
  };

  const parseDateFromDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    // Si ya está en formato YYYY-MM-DD, devolverlo
    if (dateString.includes('-') && dateString.length === 10) {
      return dateString;
    }
    // Parsear DD/MM/YYYY a YYYY-MM-DD para el backend
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

  // Función para calcular el dígito verificador del RUT (solo para validación)
  const calculateRUTVerifier = (rutBody) => {
    if (!rutBody || rutBody.length === 0) return '';
    
    let sum = 0;
    let multiplier = 2;
    
    // Calcular desde el final hacia el inicio
    for (let i = rutBody.length - 1; i >= 0; i--) {
      sum += parseInt(rutBody[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'k' : (11 - remainder).toString();
    
    return calculatedDV;
  };

  // Función para validar si el dígito verificador es correcto
  const isValidRUTVerifier = (rut) => {
    if (!rut || rut.length < 8) return null; // No validar si es muy corto
    
    // Remover puntos y guión, solo números y K/k
    const cleanValue = rut.replace(/[^0-9kK]/g, '');
    
    if (cleanValue.length < 8) return null;
    
    // Separar cuerpo y dígito verificador
    let rutBody = '';
    let verifier = '';
    
    if (cleanValue.slice(-1).toLowerCase() === 'k') {
      rutBody = cleanValue.slice(0, -1);
      verifier = 'k';
    } else if (cleanValue.length >= 8) {
      // Tomar los últimos 1-2 caracteres como DV
      // Normalmente es 1, pero puede ser 2 en casos especiales
      if (cleanValue.length === 9) {
        rutBody = cleanValue.slice(0, 8);
        verifier = cleanValue.slice(8, 9);
      } else if (cleanValue.length === 8) {
        rutBody = cleanValue.slice(0, 7);
        verifier = cleanValue.slice(7, 8);
      } else {
        return null;
      }
    } else {
      return null;
    }
    
    if (!rutBody || !verifier) return null;
    
    // Calcular el DV esperado
    const calculatedDV = calculateRUTVerifier(rutBody);
    
    // Comparar con el DV ingresado
    return verifier.toLowerCase() === calculatedDV.toLowerCase();
  };

  // Función para formatear RUT con puntos y guión (sin calcular DV automáticamente)
  const formatRUT = (value) => {
    if (!value) return '';
    
    // Remover todo excepto números y K/k
    let cleanValue = value.replace(/[^0-9kK]/g, '');
    
    if (cleanValue.length === 0) return '';
    
    // Separar cuerpo y dígito verificador
    let rutBody = '';
    let verifier = '';
    
    // Si el último carácter es K o k, es el dígito verificador
    if (cleanValue.slice(-1).toLowerCase() === 'k') {
      rutBody = cleanValue.slice(0, -1);
      verifier = 'k';
    } else if (cleanValue.length >= 9) {
      // Si tiene 9 o más dígitos, los primeros 8 son el cuerpo y el último es el DV
      rutBody = cleanValue.slice(0, 8);
      verifier = cleanValue.slice(8, 9);
    } else if (cleanValue.length === 8) {
      // Si tiene 8 dígitos, los primeros 7 son el cuerpo y el último es el DV
      rutBody = cleanValue.slice(0, 7);
      verifier = cleanValue.slice(7, 8);
    } else {
      // Menos de 8 dígitos, solo mostrar el cuerpo sin DV
      rutBody = cleanValue;
    }
    
    // Formatear el cuerpo con puntos cada 3 dígitos desde la derecha
    let formatted = '';
    if (rutBody.length > 0) {
      const reversed = rutBody.split('').reverse().join('');
      const chunks = [];
      for (let i = 0; i < reversed.length; i += 3) {
        chunks.push(reversed.slice(i, i + 3));
      }
      formatted = chunks.join('.').split('').reverse().join('');
    }
    
    // Agregar el dígito verificador con guión si existe
    if (verifier) {
      formatted += '-' + verifier.toLowerCase();
    }
    
    return formatted;
  };

  // Handler para cambios en el campo RUT
  const handleRUTChange = (e) => {
    const inputValue = e.target.value;
    
    // Si el usuario está borrando y el valor está vacío, limpiar el campo
    if (!inputValue || inputValue.trim() === '') {
      setValue('rut', '', { shouldValidate: true });
      setRutValidation({ isValid: null, message: '' });
      return;
    }
    
    // Remover todo excepto números y K/k (esto maneja tanto entrada nueva como edición de valor formateado)
    const cleanValue = inputValue.replace(/[^0-9kK]/g, '');
    
    // Limitar a 10 caracteres máximo (8 dígitos cuerpo + 2 para DV)
    const limited = cleanValue.slice(0, 10);
    
    // Formatear el RUT (sin calcular DV automáticamente)
    const formatted = formatRUT(limited);
    
    // Validar el dígito verificador si el RUT está completo
    const isValid = isValidRUTVerifier(formatted);
    if (isValid !== null) {
      if (!isValid) {
        setRutValidation({ 
          isValid: false, 
          message: 'El dígito verificador es incorrecto' 
        });
      } else {
        setRutValidation({ 
          isValid: true, 
          message: '' 
        });
      }
    } else {
      setRutValidation({ isValid: null, message: '' });
    }
    
    // Guardar el valor formateado en el formulario
    setValue('rut', formatted, { shouldValidate: true });
  };

  // Función para normalizar teléfono (sin espacios, para validación): +56912345678
  const normalizePhone = (value) => {
    if (!value) return '';
    
    // Remover todo excepto números y el signo +
    let cleanValue = value.replace(/[^0-9+]/g, '');
    
    // Extraer todos los dígitos
    const allDigits = cleanValue.replace(/[^0-9]/g, '');
    
    // Si no hay dígitos, retornar vacío
    if (allDigits.length === 0) return '';
    
    // Determinar los dígitos del número de teléfono
    let phoneDigits = '';
    
    if (allDigits.startsWith('56') && allDigits.length > 2) {
      // El usuario escribió 56 seguido del número, tomar solo los dígitos después de 56
      phoneDigits = allDigits.substring(2);
    } else if (allDigits.startsWith('56') && allDigits.length === 2) {
      // Solo escribió "56", retornar +56
      return '+56';
    } else {
      // El usuario está escribiendo directamente el número (9 dígitos)
      phoneDigits = allDigits;
    }
    
    // Limitar a 9 dígitos (formato chileno)
    const limitedDigits = phoneDigits.slice(0, 9);
    
    // Retornar en formato normalizado: +56 + 9 dígitos sin espacios
    return '+56' + limitedDigits;
  };

  // Función para formatear teléfono para mostrar (con espacios): +56 9 1234 5678
  const formatPhoneDisplay = (value) => {
    if (!value) return '';
    
    // Normalizar primero para obtener el formato base
    const normalized = normalizePhone(value);
    
    if (!normalized || normalized === '+56') return normalized;
    
    // Extraer los 9 dígitos después de +56
    const digits = normalized.replace(/[^0-9]/g, '').substring(2);
    
    if (digits.length === 0) return '+56';
    
    // Formatear como +56 9 1234 5678
    let formatted = '+56';
    if (digits.length > 0) {
      formatted += ' ' + digits[0];
    }
    if (digits.length > 1) {
      formatted += ' ' + digits.slice(1, 5);
    }
    if (digits.length > 5) {
      formatted += ' ' + digits.slice(5, 9);
    }
    
    return formatted;
  };

  // Handler para cambios en el campo teléfono
  const handlePhoneChange = (e) => {
    const inputValue = e.target.value;
    
    // Si el usuario está borrando y el valor está vacío, limpiar el campo
    if (!inputValue || inputValue.trim() === '') {
      setValue('phone', '', { shouldValidate: true });
      return;
    }
    
    // Normalizar el teléfono (sin espacios) para guardar en el formulario
    // Esto asegura que pase la validación que espera +56 seguido de 9 dígitos sin espacios
    const normalized = normalizePhone(inputValue);
    
    // Guardar el valor normalizado (sin espacios) en el formulario
    setValue('phone', normalized, { shouldValidate: true });
  };

  const handleDateChange = (value) => {
    // Remover todo excepto números
    const numbers = value.replace(/\D/g, '');
    
    // Limitar a 8 dígitos (DDMMYYYY)
    const limited = numbers.slice(0, 8);
    
    // Formatear como DD/MM/YYYY
    let formatted = '';
    if (limited.length > 0) {
      formatted = limited.slice(0, 2);
    }
    if (limited.length > 2) {
      formatted += '/' + limited.slice(2, 4);
    }
    if (limited.length > 4) {
      formatted += '/' + limited.slice(4, 8);
    }
    
    setValue('birthDate', formatted);
  };

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


  // Función para formatear signos vitales a texto
  const formatSignosVitales = (data) => {
    const signos = [];
    
    if (data.presion_sistolica) {
      signos.push(`Presión arterial sistólica: ${data.presion_sistolica}`);
    }
    if (data.presion_diastolica) {
      signos.push(`Presión arterial diastólica: ${data.presion_diastolica}`);
    }
    if (data.presion_media) {
      signos.push(`Presión arterial media: ${data.presion_media}`);
    }
    if (data.temperatura) {
      signos.push(`Temperatura: ${data.temperatura}°C`);
    }
    if (data.saturacion_oxigeno) {
      signos.push(`Saturación oxígeno: ${data.saturacion_oxigeno}%`);
    }
    if (data.frecuencia_cardiaca) {
      signos.push(`Frecuencia cardíaca: ${data.frecuencia_cardiaca} lpm`);
    }
    if (data.frecuencia_respiratoria) {
      signos.push(`Frecuencia respiratoria: ${data.frecuencia_respiratoria} rpm`);
    }
    if (data.tipo_cama) {
      signos.push(`Tipo de cama: ${data.tipo_cama}`);
    }
    if (data.glasgow) {
      signos.push(`Glasgow: ${data.glasgow}`);
    }
    if (data.fio2) {
      signos.push(`FIO2: ${data.fio2}%`);
    }
    if (data.ges !== null && data.ges !== undefined) {
      signos.push(`GES: ${data.ges ? 'Sí' : 'No'}`);
    }
    
    return signos.join(', ');
  };

  const submitDiagnostico = async (data) => {
    setLoading(true);
    try {
      // Formatear signos vitales a texto
      const signosVitalesTexto = formatSignosVitales(data);
      
      // --- 1️⃣ Crear diagnóstico (o usar el episodio ya existente) ---
      const episodioId = formData.episodio?.id;
      const diagnosticoPayload = {
        id_episodio: episodioId,
        diagnostico: data.diagnostico || '',
        motivo_consulta: data.motivo_consulta || '',
        condicion_clinica: data.condicion_clinica || '',
        anamnesis: data.anamnesis || '',
        triage: data.triage ? String(data.triage) : '',
        signos_vitales: signosVitalesTexto || '', // Incluye tipo_cama y ges dentro del string
        examenes: data.examenes || '',
        laboratorios: data.laboratorios || '',
        imagenes: data.imagenes || '',
        id_usuario: 1 // TODO: reemplazar por el ID real del usuario logueado
      };

      console.log('📋 Enviando diagnóstico:', diagnosticoPayload);
      const diagnosticoResponse = await apiClient.createDiagnostico(diagnosticoPayload);
      console.log('✅ Diagnóstico creado:', diagnosticoResponse);

      // --- 2️⃣ Procesar la evaluación IA asociada ---
      console.log('🤖 Solicitando procesamiento IA...');
      const iaResponse = await apiClient.procesarEvaluacionIA(diagnosticoResponse.id);
      console.log('✅ Evaluación IA generada:', iaResponse);

      // El endpoint de generación debería devolverte el id_eval_ia creado
      const idEvaluacion = iaResponse.id_eval_ia || iaResponse.evaluacion_guardada?.id_eval_ia;
      if (!idEvaluacion) {
        throw new Error('No se recibió el id_eval_ia en la respuesta del servidor');
      }

      navigate(`/evaluacion/resultado/${idEvaluacion}`);

    } catch (error) {
      console.error('❌ Error al registrar diagnóstico o evaluación IA:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const submitPatientData = async (data) => {
    setLoading(true);
    try {
      // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD para el backend
      const fechaFormateada = parseDateFromDDMMYYYY(data.birthDate || '') || data.birthDate || '';
      
      // Mapear datos del formulario a la estructura que espera la API
      const apiData = {
        rut: data.rut || '',
        nombre: data.firstName || '',
        apellido: data.lastName || '',
        fecha_nacimiento: fechaFormateada,
        sexo: data.gender || '',
        telefono: data.phone || '',
        email: data.email || '',
        aseguradora: data.healthInsurance || ''
      };
      
      console.log('🔍 Verificando si el RUT ya existe:', apiData.rut);
      
      // Buscar paciente por RUT
      let pacienteExistente = null;
      let pacienteId = null;
      
      try {
        const pacientes = await apiClient.getPacientes({ rut: apiData.rut });
        // Si la respuesta es un array, buscar el paciente con el RUT
        if (Array.isArray(pacientes)) {
          pacienteExistente = pacientes.find(p => p.rut === apiData.rut || p.rut?.replace(/[.-]/g, '') === apiData.rut?.replace(/[.-]/g, ''));
        } else if (pacientes && pacientes.rut === apiData.rut) {
          pacienteExistente = pacientes;
        }
        
        if (pacienteExistente) {
          // El paciente puede tener id o id_paciente dependiendo de la respuesta
          pacienteId = pacienteExistente.id || pacienteExistente.id_paciente;
          console.log('✅ Paciente encontrado con RUT:', apiData.rut, pacienteExistente);
          console.log('🆔 ID del paciente:', pacienteId);
        }
      } catch (searchError) {
        console.log('⚠️ No se pudo buscar paciente por RUT, continuando con creación:', searchError.message);
      }
      
      // Si el paciente existe, verificar si hay cambios y crear nuevo episodio
      if (pacienteExistente && pacienteId) {
        console.log('👤 Paciente existente detectado, verificando cambios...');
        
        // Comparar datos para ver si hay cambios
        const hayCambios = 
          pacienteExistente.nombre !== apiData.nombre ||
          pacienteExistente.apellido !== apiData.apellido ||
          pacienteExistente.fecha_nacimiento !== apiData.fecha_nacimiento ||
          pacienteExistente.sexo !== apiData.sexo ||
          pacienteExistente.telefono !== apiData.telefono ||
          pacienteExistente.email !== apiData.email ||
          pacienteExistente.aseguradora !== apiData.aseguradora;
        
        if (hayCambios) {
          console.log('📝 Actualizando datos del paciente:', pacienteId);
          try {
            await apiClient.updatePaciente(pacienteId, apiData);
            console.log('✅ Paciente actualizado exitosamente');
          } catch (updateError) {
            console.error('⚠️ Error al actualizar paciente:', updateError);
            // Continuar aunque falle la actualización
          }
        } else {
          console.log('ℹ️ No hay cambios en los datos del paciente');
        }
        
        // SIEMPRE crear un nuevo episodio para el paciente existente
        const episodioData = {
          id_paciente: pacienteId,
          centro: 'UC Christus',
          fecha_adm: new Date().toISOString().split('T')[0],
          estado: 'Pendiente'
        };
        
        console.log('📝 Creando nuevo episodio para paciente existente:', episodioData);
        const episodioResponse = await apiClient.createEpisodio(episodioData);
        const episodioId = episodioResponse.id;
        console.log('✅ Nuevo episodio creado:', episodioId);
        
        // Guardar datos incluyendo el ID del episodio
        setFormData(prev => ({
          ...prev,
          patient: { ...data, id: pacienteId },
          episodio: { id: episodioId }
        }));
        
        setCurrentStep(currentStep + 1);
        setLoading(false);
        return; // Salir temprano - NO crear paciente nuevo
      }
      
      // Si el paciente NO existe, crear uno nuevo
      console.log('📝 Creando nuevo paciente:', apiData);
      const response = await apiClient.createPatient(apiData);
      console.log('✅ Paciente creado exitosamente:', response);
      
      pacienteId = response.id || response.paciente?.id;
      
      // Crear episodio para el paciente
      const episodioData = {
        id_paciente: pacienteId,
        centro: 'UC Christus',
        fecha_adm: new Date().toISOString().split('T')[0],
        estado: 'Pendiente'
      };
      
      console.log('📝 Creando episodio:', episodioData);
      const episodioResponse = await apiClient.createEpisodio(episodioData);
      console.log('✅ Episodio creado exitosamente:', episodioResponse);
      
      // Guardar datos incluyendo el ID del episodio
      setFormData(prev => ({
        ...prev,
        patient: { ...data, id: pacienteId },
        episodio: { id: episodioResponse.id }
      }));
      
      setCurrentStep(currentStep + 1);
      
    } catch (error) {
      console.error('❌ Error en submitPatientData:', error);
      alert('Error al procesar datos del paciente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitRegistration = async (data) => {
    setLoading(true);
    try {
      // Mapear datos del formulario a la estructura que espera la API
      const patientData = formData.patient || {};
      // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD para el backend
      const fechaFormateada = parseDateFromDDMMYYYY(patientData.birthDate || '') || patientData.birthDate || '';
      
      const apiData = {
        rut: patientData.rut || '',
        nombre: patientData.firstName || '',
        apellido: patientData.lastName || '',
        fecha_nacimiento: fechaFormateada,
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
            onChange={handleRUTChange}
            placeholder="Ingrese solo números (ej: 207067822)"
            className={`input text-base h-12 px-4 ${
              rutValidation.isValid === false 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : rutValidation.isValid === true
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                : ''
            }`}
            maxLength={12}
          />
          {errors.rut && <p className="text-sm text-red-600">{errors.rut.message}</p>}
          {rutValidation.isValid === false && !errors.rut && (
            <p className="text-sm text-red-600">{rutValidation.message}</p>
          )}
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
            className="input text-base h-12 px-4"
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
            className="input text-base h-12 px-4"
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
            type="text"
            placeholder="DD/MM/YYYY"
            value={formatDateToDDMMYYYY(watch('birthDate') || '')}
            onChange={(e) => handleDateChange(e.target.value)}
            className="input text-base h-12 px-4"
            maxLength={10}
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
            className="input text-base h-12 px-4"
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
            className="input text-base h-12 px-4"
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
            value={formatPhoneDisplay(watch('phone') || '')}
            onChange={handlePhoneChange}
            placeholder="Ingrese solo números (ej: 912345678)"
            className="input text-base h-12 px-4"
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
            className="input text-base h-12 px-4"
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>
    </div>
  );

  const renderDiagnosisStep = () => (
    <div className="space-y-6">
      {/* Triage */}
      <div className="space-y-2">
        <label htmlFor="triage" className="block text-base font-bold text-gray-700 mb-3">
          Triage *
        </label>
        <div className="flex gap-0 rounded-lg overflow-hidden border border-gray-300">
          {[
            { value: 1, label: 'RESUCITACIÓN', color: 'red' },
            { value: 2, label: 'EMERGENCIA', color: 'orange' },
            { value: 3, label: 'URGENCIA', color: 'yellow' },
            { value: 4, label: 'URGENCIA MENOR', color: 'green' },
            { value: 5, label: 'SIN URGENCIA', color: 'blue' }
          ].map(({ value, label, color }) => {
            const isSelected = watch('triage') === value;
            const colorClasses = {
              red: isSelected 
                ? 'bg-red-600 text-white' 
                : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
              orange: isSelected 
                ? 'bg-orange-500 text-white' 
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200',
              yellow: isSelected 
                ? 'bg-yellow-400 text-gray-900' 
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
              green: isSelected 
                ? 'bg-green-500 text-white' 
                : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
              blue: isSelected 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
            };
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('triage', value, { shouldValidate: true })}
                className={`flex-1 py-4 px-2 text-center font-semibold text-sm transition-all ${
                  colorClasses[color]
                } ${
                  value === 1 ? 'rounded-l-lg' : ''
                } ${
                  value === 5 ? 'rounded-r-lg' : ''
                } border-r border-gray-300 last:border-r-0`}
              >
                <div className="font-bold text-lg mb-1">{value}</div>
                <div className="text-xs">{label}</div>
              </button>
            );
          })}
        </div>
        {errors.triage && (
          <p className="text-sm text-red-600">{errors.triage.message}</p>
        )}
      </div>

      {/* Motivo de Consulta */}
      <div>
        <label className="block text-base font-bold text-gray-700 mb-3">
          Motivo de Consulta *
        </label>
        <textarea
          value={watch('motivo_consulta') || ''}
          onChange={(e) => setValue('motivo_consulta', e.target.value)}
          placeholder="Describa el motivo de la consulta..."
          className="input min-h-[150px] resize-y w-full text-base p-4"
          rows={6}
        />
        {errors.motivo_consulta && (
          <p className="mt-2 text-sm text-red-600">{errors.motivo_consulta.message}</p>
        )}
      </div>

      {/* Condición Clínica */}
      <div>
        <label className="block text-base font-bold text-gray-700 mb-3">
          Condición Clínica *
        </label>
        <textarea
          value={watch('condicion_clinica') || ''}
          onChange={(e) => setValue('condicion_clinica', e.target.value)}
          placeholder="Describa la condición clínica actual..."
          className="input min-h-[150px] resize-y w-full text-base p-4"
          rows={6}
        />
        {errors.condicion_clinica && (
          <p className="mt-2 text-sm text-red-600">{errors.condicion_clinica.message}</p>
        )}
      </div>

      {/* Anamnesis */}
      <div>
        <label className="block text-base font-bold text-gray-700 mb-3">
          Anamnesis *
        </label>
        <textarea
          value={watch('anamnesis') || ''}
          onChange={(e) => setValue('anamnesis', e.target.value)}
          placeholder="Historia clínica del paciente..."
          className="input min-h-[150px] resize-y w-full text-base p-4"
          rows={6}
        />
        {errors.anamnesis && (
          <p className="mt-2 text-sm text-red-600">{errors.anamnesis.message}</p>
        )}
      </div>

      {/* Signos Vitales */}
      <div>
        <label className="block text-base font-bold text-gray-700 mb-4">
          Signos Vitales
        </label>
        
        {/* Signos Vitales Principales (Obligatorios) */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Signos Vitales Principales *</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {/* Temperatura Corporal */}
            <div className="flex flex-col h-full">
              <label className="block text-sm font-medium text-gray-700 mb-2 h-[40px] flex items-start">
                Temperatura Corporal (°C) *
              </label>
              <input
                type="number"
                step="0.1"
                value={watch('temperatura') ?? ''}
                onChange={(e) => setValue('temperatura', e.target.value ? Number(e.target.value) : undefined, { shouldValidate: true })}
                placeholder="36.5"
                className="input text-base h-12 px-4"
              />
              {errors.temperatura && (
                <p className="mt-1 text-sm text-red-600">{errors.temperatura.message}</p>
              )}
            </div>

            {/* Pulso / Frecuencia Cardíaca */}
            <div className="flex flex-col h-full">
              <label className="block text-sm font-medium text-gray-700 mb-2 h-[40px] flex items-start">
                Pulso (lpm) *
              </label>
              <input
                type="number"
                value={watch('frecuencia_cardiaca') ?? ''}
                onChange={(e) => setValue('frecuencia_cardiaca', e.target.value ? Number(e.target.value) : undefined, { shouldValidate: true })}
                placeholder="72"
                className="input text-base h-12 px-2"
              />
              {errors.frecuencia_cardiaca && (
                <p className="mt-1 text-sm text-red-600">{errors.frecuencia_cardiaca.message}</p>
              )}
            </div>

            {/* Frecuencia Respiratoria */}
            <div className="flex flex-col h-full">
              <label className="block text-sm font-medium text-gray-700 mb-2 h-[40px] flex items-start">
                Frecuencia Respiratoria (rpm) *
              </label>
              <input
                type="number"
                value={watch('frecuencia_respiratoria') ?? ''}
                onChange={(e) => setValue('frecuencia_respiratoria', e.target.value ? Number(e.target.value) : undefined, { shouldValidate: true })}
                placeholder="16"
                className="input text-base h-12 px-4"
              />
              {errors.frecuencia_respiratoria && (
                <p className="mt-1 text-sm text-red-600">{errors.frecuencia_respiratoria.message}</p>
              )}
            </div>

            {/* Presión Arterial Media */}
            <div className="flex flex-col h-full">
              <label className="block text-sm font-medium text-gray-700 mb-2 h-[40px] flex items-start">
                Presión Arterial Media (mmHg) *
              </label>
              <input
                type="number"
                value={watch('presion_media') ?? ''}
                onChange={(e) => setValue('presion_media', e.target.value ? Number(e.target.value) : undefined, { shouldValidate: true })}
                placeholder="93"
                className="input text-base h-12 px-4"
              />
              {errors.presion_media && (
                <p className="mt-1 text-sm text-red-600">{errors.presion_media.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Otros Signos Vitales (Opcionales) */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3">Otros Signos Vitales</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Presión Arterial Sistólica y Diastólica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Presión Arterial Sistólica (mmHg)
              </label>
              <input
                type="number"
                value={watch('presion_sistolica') || ''}
                onChange={(e) => setValue('presion_sistolica', e.target.value ? Number(e.target.value) : null)}
                placeholder="120"
                className="input text-base h-12 px-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Presión Arterial Diastólica (mmHg)
              </label>
              <input
                type="number"
                value={watch('presion_diastolica') || ''}
                onChange={(e) => setValue('presion_diastolica', e.target.value ? Number(e.target.value) : null)}
                placeholder="80"
                className="input text-base h-12 px-4"
              />
            </div>

            {/* Saturación Oxígeno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saturación Oxígeno (%)
              </label>
              <input
                type="number"
                value={watch('saturacion_oxigeno') || ''}
                onChange={(e) => setValue('saturacion_oxigeno', e.target.value ? Number(e.target.value) : null)}
                placeholder="98"
                className="input text-base h-12 px-4"
              />
            </div>

            {/* Glasgow */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Glasgow
              </label>
              <input
                type="number"
                min="3"
                max="15"
                value={watch('glasgow') || ''}
                onChange={(e) => setValue('glasgow', e.target.value ? Number(e.target.value) : null)}
                placeholder="15"
                className="input text-base h-12 px-4"
              />
            </div>

            {/* FIO2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FIO2 (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={watch('fio2') || ''}
                onChange={(e) => setValue('fio2', e.target.value ? Number(e.target.value) : null)}
                placeholder="21"
                className="input text-base h-12 px-4"
              />
            </div>
          </div>
        </div>

        {/* Datos Clínicos Administrativos */}
        <div className="mb-6">
          <label className="block text-base font-bold text-gray-700 mb-3">Datos Clínicos Administrativos</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Cama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cama *
              </label>
              <input
                type="text"
                value={watch('tipo_cama') || ''}
                onChange={(e) => setValue('tipo_cama', e.target.value, { shouldValidate: true })}
                placeholder="Ej: UCI, UTI, etc."
                className="input text-base h-12 px-4"
              />
              {errors.tipo_cama && (
                <p className="mt-1 text-sm text-red-600">{errors.tipo_cama.message}</p>
              )}
            </div>

            {/* GES */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GES *
              </label>
              <select
                value={watch('ges') === true ? 'true' : watch('ges') === false ? 'false' : ''}
                onChange={(e) => setValue('ges', e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined, { shouldValidate: true })}
                className="input text-base h-12 px-4"
              >
                <option value="">Seleccionar</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
              {errors.ges && (
                <p className="mt-1 text-sm text-red-600">{errors.ges.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exámenes */}
      <div>
        <label className="block text-base font-bold text-gray-700 mb-3">
          Exámenes
        </label>
        <textarea
          value={watch('examenes') || ''}
          onChange={(e) => setValue('examenes', e.target.value)}
          placeholder="Exámenes físicos realizados..."
          className="input min-h-[120px] resize-y w-full text-base p-4"
          rows={5}
        />
      </div>

      {/* Laboratorios */}
      <div>
        <label className="block text-base font-bold text-gray-700 mb-3">
          Laboratorios
        </label>
        <textarea
          value={watch('laboratorios') || ''}
          onChange={(e) => setValue('laboratorios', e.target.value)}
          placeholder="Resultados de laboratorio..."
          className="input min-h-[120px] resize-y w-full text-base p-4"
          rows={5}
        />
      </div>

      {/* Imágenes */}
      <div>
        <label className="block text-base font-bold text-gray-700 mb-3">
          Imágenes
        </label>
        <textarea
          value={watch('imagenes') || ''}
          onChange={(e) => setValue('imagenes', e.target.value)}
          placeholder="Radiografías, ecografías, tomografías, etc..."
          className="input min-h-[120px] resize-y w-full text-base p-4"
          rows={5}
        />
      </div>

      {/* Diagnóstico */}
      <div>
        <label className="block text-base font-bold text-gray-700 mb-3">
          Diagnóstico *
        </label>
        <textarea
          value={watch('diagnostico') || ''}
          onChange={(e) => setValue('diagnostico', e.target.value)}
          placeholder="Diagnóstico final..."
          className="input min-h-[150px] resize-y w-full text-base p-4"
          rows={6}
        />
        {errors.diagnostico && (
          <p className="mt-2 text-sm text-red-600">{errors.diagnostico.message}</p>
        )}
      </div>

    </div>
  );

  const submitLeyUrgencia = async (decision) => {
    setLoading(true);
    try {
      const evaluacionData = {
        id_episodio: formData.episodio?.id,
        id_eval_ia: formData.evaluacionIA?.id_eval_ia,
        id_medico: 1, // TODO: Obtener ID del médico logueado
        pertinencia_medico: true, // Boolean: true/false
        observaciones: observacionesMedico 
          ? `Decisión médica: ${decision}. Observaciones: ${observacionesMedico}` 
          : `Decisión médica: ${decision}`,
        estado_aseguradora: 'Pendiente',
        sugerencia_ia: formData.evaluacionIA?.pertinencia_ia ? 'Activar' : 'No activar'
      };
      
      console.log('formData completo:', formData);
      console.log('formData.episodio:', formData.episodio);
      console.log('formData.evaluacionIA:', formData.evaluacionIA);
      
      console.log('Enviando decisión de Ley de Urgencia:', evaluacionData);
      console.log('URL completa:', `${apiClient.baseURL}/evaluacion-ley-urgencia`);
      
      const response = await apiClient.createEvaluacionLeyUrgencia(evaluacionData);
      console.log('Evaluación Ley de Urgencia creada:', response);
      
      alert(`Decisión registrada exitosamente: ${decision}`);
      navigate('/registros');
      
    } catch (error) {
      console.error('Error registrando decisión:', error);
      console.error('Error completo:', error);
      
      // Si es error de conexión, usar datos mock
      if (error.message.includes('No se puede conectar al servidor') || error.message.includes('Load failed')) {
        console.log('Backend no disponible, usando datos mock');
        const mockResponse = {
          id: Math.floor(Math.random() * 1000) + 1,
          message: 'Decisión registrada (modo demo)',
        };
        
        console.log('Decisión registrada en modo demo:', mockResponse);
        alert(`Decisión registrada exitosamente (modo demo): ${decision}`);
        navigate('/registros');
      } else {
        console.error('Error específico:', error.message);
        console.error('Error status:', error.status);
        alert(`Error al registrar decisión: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderEvaluationStep = () => {
    const evaluacionIA = formData.evaluacionIA;
    const diagnosis = formData.diagnosis;
    
    // Debug: ver qué contiene evaluacionIA
    console.log('renderEvaluationStep - evaluacionIA:', evaluacionIA);
    console.log('renderEvaluationStep - recomendaciones:', evaluacionIA?.recomendaciones);
    
    return (
      <div className="space-y-6">
        {/* Información del Diagnóstico */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
            Diagnóstico Analizado
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Fila superior: Paciente y RUT */}
            <div>
              <span className="font-bold text-gray-700">Paciente:</span>
              <span className="ml-2 text-gray-600">
                {formData.patient?.firstName} {formData.patient?.lastName}
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-700">RUT:</span>
              <span className="ml-2 text-gray-600">{formData.patient?.rut}</span>
            </div>
            {/* Fila inferior: Motivo de Consulta y Diagnóstico */}
            <div>
              <span className="font-bold text-gray-700">Motivo de Consulta:</span>
              <p className="ml-2 text-gray-600 mt-1">{diagnosis?.motivo_consulta}</p>
            </div>
            <div>
              <span className="font-bold text-gray-700">Diagnóstico:</span>
              <p className="ml-2 text-gray-600 mt-1">{diagnosis?.diagnostico}</p>
            </div>
          </div>
        </div>

        {/* Resultados de la IA */}
        {evaluacionIA && (
          <div className="space-y-4">
            {/* Estado de la Evaluación */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-900">Estado de la Evaluación</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  evaluacionIA.pertinencia_ia 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {evaluacionIA.pertinencia_ia ? 'Pertinente' : 'No Pertinente'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Modelo:</span>
                  <span className="ml-2 text-blue-700">{evaluacionIA.modelo}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Confianza:</span>
                  <span className="ml-2 text-blue-700">{(evaluacionIA.confianza * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Fecha:</span>
                  <span className="ml-2 text-blue-700">
                    {new Date(evaluacionIA.fecha_evaluacion).toLocaleDateString()}
                  </span>
                </div>
                {evaluacionIA.tiempo_respuesta !== null && evaluacionIA.tiempo_respuesta !== undefined && (
                  <div>
                    <span className="font-medium text-blue-800">Tiempo de Respuesta:</span>
                    <span className="ml-2 text-blue-700">
                      {typeof evaluacionIA.tiempo_respuesta === 'number' 
                        ? `${evaluacionIA.tiempo_respuesta.toFixed(2)}s`
                        : evaluacionIA.tiempo_respuesta
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Criterios de Evaluación y Fuentes Utilizadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Criterios de Evaluación */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Criterios de Evaluación</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {evaluacionIA.criterios}
                </p>
              </div>

              {/* Fuentes Utilizadas */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Fuentes Utilizadas</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {evaluacionIA.fuentes_utilizadas}
                </p>
              </div>
            </div>

            {/* Recomendaciones */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">Recomendaciones de la IA</h4>
              {evaluacionIA.recomendaciones && evaluacionIA.recomendaciones.length > 0 ? (
                <ul className="space-y-2">
                  {evaluacionIA.recomendaciones.map((recomendacion, index) => (
                    <li key={index} className="flex items-start text-sm text-green-800">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {recomendacion}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-green-700 italic">No hay recomendaciones disponibles</p>
              )}
            </div>

            {/* Información Adicional */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Nivel de Riesgo Paciente</h4>
                <span className="text-yellow-800 font-medium">{evaluacionIA.riesgo || 'Bajo'}</span>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Tiempo Estimado de Atención</h4>
                <span className="text-purple-800 font-medium">{evaluacionIA.tiempo_estimado || '24-48 horas'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Decisión de Ley de Urgencia y Observaciones */}
        <div className="grid grid-cols-2 gap-4">
          {/* Decisión de Ley de Urgencia */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              ¿Aceptar recomendación de la IA?
            </h4>
            <p className="text-gray-600 text-sm text-center mb-6">
              Basándose en la evaluación de la IA, tome la decisión final sobre la activación de la Ley de Urgencia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={() => submitLeyUrgencia('SÍ - Activar Ley de Urgencia')}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SÍ
              </button>
              
              <button
                type="button"
                onClick={() => submitLeyUrgencia('NO - No activar Ley de Urgencia')}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                NO
              </button>
              
              <button
                type="button"
                onClick={() => submitLeyUrgencia('PENDIENTE - Dejar pendiente la activación')}
                disabled={loading}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dejar Pendiente
              </button>
            </div>
          </div>

          {/* Observaciones Medico */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Observaciones Medico
            </h4>
            <textarea
              value={observacionesMedico}
              onChange={(e) => setObservacionesMedico(e.target.value)}
              placeholder="Ingrese sus observaciones aquí..."
              className="input w-full min-h-[150px] resize-y"
              rows={6}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-700">
                <strong>Disclaimer:</strong> El médico es el único responsable de la decisión de activar o no la Ley de Urgencia. 
                La evaluación de la IA es únicamente una herramienta de apoyo y no reemplaza el criterio médico profesional.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
              className="input text-base h-12 px-4"
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
              className="input text-base h-12 px-4"
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
              className="input text-base h-12 px-4"
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
              className="input text-base h-12 px-4"
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
              className="input text-base h-12 px-4"
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
      case 3: return renderEvaluationStep();
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

      <form onSubmit={handleSubmit(
        currentStep === 3 ? submitRegistration : 
        currentStep === 1 ? submitPatientData : 
        currentStep === 2 ? submitDiagnostico : 
        onStepSubmit
      )} className="space-y-8">
        <div className="card">
          {currentStep !== 3 && (
            <div className="flex items-center gap-3 mb-6">
              {React.createElement(currentStepData.icon, { className: 'w-6 h-6 text-primary' })}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{currentStepData.title}</h2>
                <p className="text-gray-600">{currentStepData.description}</p>
              </div>
            </div>
          )}

          {renderCurrentStep()}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
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
            type="submit"
            disabled={loading}
            className="btn btn-primary text-lg px-8 py-4 font-semibold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all"
          >
          {currentStep === 2 ? (
            loading ? (
              'Generando respuesta con IA...'
            ) : (
              'Evaluar con IA'
            )
            ) : currentStep === 4 ? (
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