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
export const rutSchema = z.string({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  })
  .min(1, 'Campo obligatorio')
  .refine((rut) => {
    // Permitir RUTs sin validación estricta por ahora para testing
    if (!rut || rut.trim() === '') return false;
    // Validación básica: debe tener al menos 8 caracteres
    return rut.length >= 8;
  }, 'RUT debe tener al menos 8 caracteres');

export const firstNameSchema = z.string({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  })
  .min(1, 'Campo obligatorio')
  .max(50, 'Nombre no debe exceder 50 caracteres');

export const lastNameSchema = z.string({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  })
  .min(1, 'Campo obligatorio')
  .max(50, 'Apellido no debe exceder 50 caracteres');

export const birthDateSchema = z.string({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  })
  .min(1, 'Campo obligatorio')
  .refine((date) => {
    if (!date) return false;
    
    // Parsear fecha en formato DD/MM/YYYY
    const parts = date.split('/');
    if (parts.length !== 3) return false;
    
    const [day, month, year] = parts.map(Number);
    
    // Validar que los valores sean números válidos
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    
    // Validar rangos básicos
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return false;
    
    // Crear fecha usando el constructor con año, mes (0-indexed), día para evitar problemas de zona horaria
    const dateObj = new Date(year, month - 1, day);
    
    // Verificar que la fecha es válida (evita fechas como 31/02/2000)
    // Si la fecha es inválida, JavaScript ajustará los valores (ej: 31/02 se convierte en 03/03)
    if (dateObj.getDate() !== day || dateObj.getMonth() + 1 !== month || dateObj.getFullYear() !== year) {
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxAge = new Date();
    maxAge.setFullYear(today.getFullYear() - 120);
    maxAge.setHours(0, 0, 0, 0);
    
    dateObj.setHours(0, 0, 0, 0);
    
    return dateObj <= today && dateObj >= maxAge;
  }, 'Fecha de nacimiento inválida. Use formato DD/MM/YYYY');

export const genderSchema = z.enum(['M', 'F', 'O'], {
  required_error: 'Campo obligatorio',
});

export const healthInsuranceSchema = z.enum(['fonasa', 'isapre', 'particular', 'otro'], {
  required_error: 'Campo obligatorio',
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
  motivo_consulta: z.string({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  }).min(1, 'Campo obligatorio'),
  condicion_clinica: z.string({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  }).min(1, 'Campo obligatorio'),
  anamnesis: z.string({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  }).min(1, 'Campo obligatorio'),
  signos_vitales: z.string().optional(),
  // Campos individuales de signos vitales
  presion_sistolica: z.number().optional(),
  presion_diastolica: z.number().optional(),
  presion_media: z.number({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Campo obligatorio'
  }),
  temperatura: z.number({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Campo obligatorio'
  }),
  saturacion_oxigeno: z.number().optional(),
  frecuencia_cardiaca: z.number({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Campo obligatorio'
  }),
  frecuencia_respiratoria: z.number({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Campo obligatorio'
  }),
  tipo_cama: z.string({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  })
    .min(1, 'Campo obligatorio'),
  ges: z.boolean({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  }).refine((val) => val !== null && val !== undefined, {
    message: 'Campo obligatorio'
  }),
  glasgow: z.number().optional(),
  fio2: z.number().optional(),
  examenes: z.string().optional(),
  laboratorios: z.string().optional(),
  imagenes: z.string().optional(),
  diagnostico: z.string({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  }).min(1, 'Campo obligatorio'),
  triage: z.number({
    required_error: 'Campo obligatorio',
    invalid_type_error: 'Campo obligatorio'
  })
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
