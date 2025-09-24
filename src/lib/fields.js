import { FIELD_TYPES } from './constants.js';

// Patient Basic Fields
export const PATIENT_FIELDS = [
  {
    id: 'rut',
    label: 'RUT',
    type: FIELD_TYPES.RUT,
    required: false, // cambiar a true al final,
    placeholder: '12.345.678-9',
    validation: 'rut',
  },
  {
    id: 'firstName', 
    label: 'Nombres',
    type: FIELD_TYPES.TEXT,
    required: false, // cambiar a true al final,
    placeholder: 'Juan Carlos',
    validation: 'firstName',
  },
  {
    id: 'lastName',
    label: 'Apellidos', 
    type: FIELD_TYPES.TEXT,
    required: false, // cambiar a true al final,
    placeholder: 'Pérez González',
    validation: 'lastName',
  },
  {
    id: 'birthDate',
    label: 'Fecha de Nacimiento',
    type: FIELD_TYPES.DATE,
    required: false, // cambiar a true al final
    validation: 'birthDate',
  },
  {
    id: 'gender',
    label: 'Sexo',
    type: FIELD_TYPES.SELECT,
    required: false, // cambiar a true al final,
    options: [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Femenino' },
      { value: 'O', label: 'Otro' },
    ],
    validation: 'gender',
  },
  {
    id: 'healthInsurance',
    label: 'Previsión',
    type: FIELD_TYPES.SELECT,
    required: false, // cambiar a true al final,
    options: [
      { value: 'fonasa', label: 'FONASA' },
      { value: 'isapre', label: 'ISAPRE' },
      { value: 'particular', label: 'Particular' },
      { value: 'otro', label: 'Otro' },
    ],
    validation: 'healthInsurance',
  },
  {
    id: 'phone',
    label: 'Teléfono',
    type: FIELD_TYPES.PHONE,
    required: false, // cambiar a true al final,
    placeholder: '+56 9 1234 5678',
    validation: 'phone',
  },
  {
    id: 'email',
    label: 'Email',
    type: FIELD_TYPES.EMAIL,
    required: false,
    placeholder: 'paciente@ejemplo.cl',
    validation: 'email',
  },
];

// Clinical Parameters Fields
export const CLINICAL_FIELDS = [
  {
    id: 'bloodPressure',
    label: 'Presión Arterial',
    type: FIELD_TYPES.TEXT,
    placeholder: '120/80',
    unit: 'mmHg',
    validation: 'bloodPressure',
  },
  {
    id: 'heartRate', 
    label: 'Frecuencia Cardíaca',
    type: FIELD_TYPES.NUMBER,
    placeholder: '72',
    unit: 'lpm',
    validation: 'heartRate',
  },
  {
    id: 'respiratoryRate',
    label: 'Frecuencia Respiratoria', 
    type: FIELD_TYPES.NUMBER,
    placeholder: '16',
    unit: 'rpm',
    validation: 'respiratoryRate',
  },
  {
    id: 'temperature',
    label: 'Temperatura',
    type: FIELD_TYPES.NUMBER,
    placeholder: '36.5',
    unit: '°C',
    step: 0.1,
    validation: 'temperature',
  },
  {
    id: 'oxygenSaturation',
    label: 'Saturación de Oxígeno',
    type: FIELD_TYPES.NUMBER,
    placeholder: '98',
    unit: '%',
    validation: 'oxygenSaturation',
  },
];

// Diagnosis Field
export const DIAGNOSIS_FIELD = {
  id: 'diagnosis',
  label: 'Diagnóstico CIE-10',
  type: 'autocomplete',
  required: true,
  placeholder: 'Buscar diagnóstico...',
  validation: 'diagnosis',
};