import Joi from 'joi';
import { objectId, pagination, empty } from './common.js';

const website = Joi.string()
  .trim()
  .uri({ scheme: ['http', 'https'] })
  .max(2048)
  .allow(null, '')
  .optional();

const createCollegeSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().trim().min(2).max(160).required(),
    description: Joi.string().trim().min(1).max(2000).required(),
    location: Joi.string().trim().min(2).max(160).required(),
    website,
  }).required(),
  query: empty,
  params: empty,
});

const updateCollegeSchema = Joi.object({
  body: Joi.object({
    id: objectId.required(),
    name: Joi.string().trim().min(2).max(160),
    description: Joi.string().trim().min(1).max(2000),
    location: Joi.string().trim().min(2).max(160),
    website,
  })
    .or('name', 'description', 'location', 'website')
    .required(),
  query: empty,
  params: empty,
});

const listCollegesSchema = Joi.object({
  body: Joi.object({
    ...pagination,
    search: Joi.string().trim().max(160).allow(''),
    location: Joi.string().trim().max(160).allow(''),
    sortBy: Joi.string().valid('name', 'createdAt', 'averageRating').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }).default({}),
  query: empty,
  params: empty,
});

const collegeIdBodySchema = Joi.object({
  body: Joi.object({
    id: objectId.required(),
  }).required(),
  query: empty,
  params: empty,
});

export {
  createCollegeSchema,
  updateCollegeSchema,
  listCollegesSchema,
  collegeIdBodySchema,
};
