import Joi from 'joi';
import { objectId, pagination, empty } from './common.js';

const listUsersSchema = Joi.object({
  body: Joi.object({
    ...pagination,
    search: Joi.string().trim().max(160).allow(''),
    role: Joi.string().valid('admin', 'teacher', 'student'),
  }).default({}),
  query: empty,
  params: empty,
});

const userIdBodySchema = Joi.object({
  body: Joi.object({
    id: objectId.required(),
  }).required(),
  query: empty,
  params: empty,
});

const updateUserRoleSchema = Joi.object({
  body: Joi.object({
    id: objectId.required(),
    role: Joi.string().valid('admin', 'teacher', 'student').required(),
  }).required(),
  query: empty,
  params: empty,
});

export { listUsersSchema, userIdBodySchema, updateUserRoleSchema };
