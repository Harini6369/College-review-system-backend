import Joi from 'joi';
import { empty } from './common.js';

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .messages({
    'string.pattern.base': 'password must contain at least one letter and one number',
  });

const registerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(80).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password: password.required(),
    role: Joi.string().valid('teacher', 'student').default('student'),
  }).required(),
  query: empty,
  params: empty,
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required(),
  }).required(),
  query: empty,
  params: empty,
});

const meSchema = Joi.object({
  body: Joi.object().max(0).default({}),
  query: empty,
  params: empty,
});

export { registerSchema, loginSchema, meSchema };
