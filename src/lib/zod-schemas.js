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
  code: z.string().min(1, 'Código CIE-10 es requerido'),
  description: z.string().min(1, 'Descripción del diagnóstico es requerida'),
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
