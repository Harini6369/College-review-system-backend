import dotenv from 'dotenv';
import Joi from 'joi';

if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  MONGODB_URI: Joi.string().pattern(/^mongodb(\+srv)?:\/\//).required().messages({
    'string.pattern.base': 'MONGODB_URI must be a MongoDB connection string',
  }),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).max(15).default(12),
  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(10),
  ADMIN_NAME: Joi.string().default('System Admin'),
  ADMIN_EMAIL: Joi.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: Joi.string().min(8).optional(),
  SEED_TEACHER_EMAIL: Joi.string().email().default('teacher@example.com'),
  SEED_TEACHER_PASSWORD: Joi.string().min(8).default('Teacher123'),
  SEED_STUDENT_EMAIL: Joi.string().email().default('student@example.com'),
  SEED_STUDENT_PASSWORD: Joi.string().min(8).default('Student123'),
  SEED_STUDENT_TWO_EMAIL: Joi.string().email().default('student2@example.com'),
  SEED_STUDENT_TWO_PASSWORD: Joi.string().min(8).default('Student123'),
}).unknown(true);

const { error, value } = envSchema.validate(process.env, { abortEarly: false, convert: true });

if (error) {
  const details = error.details.map((item) => item.message).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

const corsOrigin = value.CORS_ORIGIN === '*'
  ? '*'
  : value.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);

const env = {
  nodeEnv: value.NODE_ENV,
  isProduction: value.NODE_ENV === 'production',
  isTest: value.NODE_ENV === 'test',
  port: value.PORT,
  mongodbUri: value.MONGODB_URI,
  jwtSecret: value.JWT_SECRET,
  jwtExpiresIn: value.JWT_EXPIRES_IN,
  bcryptSaltRounds: value.BCRYPT_SALT_ROUNDS,
  corsOrigin,
  rateLimitWindowMs: value.RATE_LIMIT_WINDOW_MS,
  rateLimitMax: value.RATE_LIMIT_MAX,
  admin: {
    name: value.ADMIN_NAME,
    email: value.ADMIN_EMAIL.toLowerCase(),
    password: value.ADMIN_PASSWORD,
  },
  seed: {
    teacherEmail: value.SEED_TEACHER_EMAIL.toLowerCase(),
    teacherPassword: value.SEED_TEACHER_PASSWORD,
    studentEmail: value.SEED_STUDENT_EMAIL.toLowerCase(),
    studentPassword: value.SEED_STUDENT_PASSWORD,
    studentTwoEmail: value.SEED_STUDENT_TWO_EMAIL.toLowerCase(),
    studentTwoPassword: value.SEED_STUDENT_TWO_PASSWORD,
  },
};

export default env;
