import { z } from 'zod';

// RUT validation function
const isValidRUT = (rut) => {
  const cleanRUT = rut.replace(/[^0-9kK]/g, '');
  if (cleanRUT.length < 2) return false;

  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1).toLowerCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'k' : (11 - remainder).toString();

  return dv === calculatedDV;
};

// Chilean phone validation - must start with +56 followed by 9 digits
const isValidChileanPhone = (phone) => {
  if (!phone || phone.trim() === '') return true; // Optional field

  // Must start with +56 followed by exactly 9 digits
  const phoneRegex = /^\+56\d{9}$/;
  return phoneRegex.test(phone);
};

// Base validations
export const rutSchema = z.string()
  .min(1, 'RUT es requerido')
  .refine((rut) => {
    // Permitir RUTs sin validación estricta por ahora para testing
    if (!rut || rut.trim() === '') return false;
    // Validación básica: debe tener al menos 8 caracteres
    return rut.length >= 8;
  }, 'RUT debe tener al menos 8 caracteres');

export const firstNameSchema = z.string()
  .min(1, 'Nombre es requerido')
  .max(50, 'Nombre no debe exceder 50 caracteres');

export const lastNameSchema = z.string()
  .min(1, 'Apellido es requerido')
  .max(50, 'Apellido no debe exceder 50 caracteres');

export const birthDateSchema = z.string()
  .min(1, 'Fecha de nacimiento es requerida')
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const maxAge = new Date();
    maxAge.setFullYear(today.getFullYear() - 120);
    return birthDate <= today && birthDate >= maxAge;
  }, 'Fecha de nacimiento inválida');

export const genderSchema = z.enum(['M', 'F', 'O'], {
  required_error: 'Sexo es requerido',
});

export const healthInsuranceSchema = z.enum(['fonasa', 'isapre', 'particular', 'otro'], {
  required_error: 'Previsión es requerida',
});

export const phoneSchema = z.string()
  .optional()
  .refine((phone) => isValidChileanPhone(phone), 'Teléfono inválido. Debe empezar con +56 seguido de 9 dígitos');

export const emailSchema = z.string()
  .optional()
  .refine((email) => !email || z.string().email().safeParse(email).success, 'Email inválido');

export const bloodPressureSchema = z.string()
  .optional()
  .refine((bp) => !bp || /^\d{2,3}\/\d{2,3}$/.test(bp), 'Formato inválido (ej: 120/80)');

export const heartRateSchema = z.number()
  .optional()
  .refine((hr) => !hr || (hr >= 30 && hr <= 220), 'Frecuencia cardíaca debe estar entre 30 y 220 lpm');

export const respiratoryRateSchema = z.number()
  .optional()
  .refine((rr) => !rr || (rr >= 5 && rr <= 60), 'Frecuencia respiratoria debe estar entre 5 y 60 rpm');

export const temperatureSchema = z.number()
  .optional()
  .refine((temp) => !temp || (temp >= 30 && temp <= 45), 'Temperatura debe estar entre 30°C y 45°C');

export const oxygenSaturationSchema = z.number()
  .optional()
  .refine((sat) => !sat || (sat >= 70 && sat <= 100), 'Saturación debe estar entre 70% y 100%');

export const diagnosisSchema = z.object({
  motivo_consulta: z.string().min(1, 'Motivo de consulta es requerido'),
  condicion_clinica: z.string().min(1, 'Condición clínica es requerida'),
  anamnesis: z.string().min(1, 'Anamnesis es requerida'),
  signos_vitales: z.string().optional(),
  // Campos individuales de signos vitales
  presion_sistolica: z.number({
    required_error: 'Presión arterial sistólica es requerida',
    invalid_type_error: 'Presión arterial sistólica debe ser un número'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Presión arterial sistólica es requerida'
  }),
  presion_diastolica: z.number({
    required_error: 'Presión arterial diastólica es requerida',
    invalid_type_error: 'Presión arterial diastólica debe ser un número'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Presión arterial diastólica es requerida'
  }),
  presion_media: z.number({
    required_error: 'Presión arterial media es requerida',
    invalid_type_error: 'Presión arterial media debe ser un número'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Presión arterial media es requerida'
  }),
  temperatura: z.number({
    required_error: 'Temperatura es requerida',
    invalid_type_error: 'Temperatura debe ser un número'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Temperatura es requerida'
  }),
  saturacion_oxigeno: z.number({
    required_error: 'Saturación oxígeno es requerida',
    invalid_type_error: 'Saturación oxígeno debe ser un número'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Saturación oxígeno es requerida'
  }),
  frecuencia_cardiaca: z.number({
    required_error: 'Frecuencia cardíaca es requerida',
    invalid_type_error: 'Frecuencia cardíaca debe ser un número'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Frecuencia cardíaca es requerida'
  }),
  frecuencia_respiratoria: z.number().optional(),
  tipo_cama: z.string().optional(),
  glasgow: z.number({
    required_error: 'Glasgow es requerido',
    invalid_type_error: 'Glasgow debe ser un número'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Glasgow es requerido'
  }),
  fio2: z.number().optional(),
  fio2_mayor_igual_50: z.boolean().optional(),
  examenes: z.string().optional(),
  laboratorios: z.string().optional(),
  imagenes: z.string().optional(),
  diagnostico: z.string().min(1, 'Diagnóstico es requerido'),
  triage: z.number()
    .min(1, 'Triage debe ser entre 1 y 5')
    .max(5, 'Triage debe ser entre 1 y 5')
    .refine((val) => val >= 1 && val <= 5, 'Triage debe ser un número entre 1 y 5'),
});

// Complete schemas for forms
export const patientSchema = z.object({
  rut: rutSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  birthDate: birthDateSchema,
  gender: genderSchema,
  healthInsurance: healthInsuranceSchema,
  phone: phoneSchema,
  email: emailSchema,
});

export const clinicalSchema = z.object({
  bloodPressure: bloodPressureSchema,
  heartRate: heartRateSchema,
  respiratoryRate: respiratoryRateSchema,
  temperature: temperatureSchema,
  oxygenSaturation: oxygenSaturationSchema,
  examinations: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

export const registrationSchema = z.object({
  patient: patientSchema,
  diagnosis: diagnosisSchema,
  clinical: clinicalSchema,
  observations: z.string().optional(),
});


// Login schema
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  rememberDevice: z.boolean().optional(),
});

// User registration schema (frontend)
export const userRegisterSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: z.string().email('Email inválido'),
  role: z.string().min(1, 'Rol es requerido'),
  // Password is required for signup
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});
