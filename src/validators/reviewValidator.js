import Joi from 'joi';
import { objectId, pagination, empty } from './common.js';

const rating = Joi.number().integer().min(1).max(5);
const comment = Joi.string().trim().min(1).max(2000);

const createReviewSchema = Joi.object({
  body: Joi.object({
    collegeId: objectId.required(),
    rating: rating.required(),
    comment: comment.required(),
  }).required(),
  query: empty,
  params: empty,
});

const updateReviewSchema = Joi.object({
  body: Joi.object({
    id: objectId.required(),
    rating,
    comment,
  })
    .or('rating', 'comment')
    .required(),
  query: empty,
  params: empty,
});

const reviewIdBodySchema = Joi.object({
  body: Joi.object({
    id: objectId.required(),
  }).required(),
  query: empty,
  params: empty,
});

const listReviewsSchema = Joi.object({
  body: Joi.object({
    ...pagination,
    collegeId: objectId,
    userId: objectId,
    rating,
    search: Joi.string().trim().max(200).allow(''),
    sortBy: Joi.string().valid('createdAt', 'rating').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }).default({}),
  query: empty,
  params: empty,
});

const listCollegeReviewsSchema = Joi.object({
  body: Joi.object({
    collegeId: objectId.required(),
    ...pagination,
    rating,
    search: Joi.string().trim().max(200).allow(''),
    sortBy: Joi.string().valid('createdAt', 'rating').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }).required(),
  query: empty,
  params: empty,
});

export {
  createReviewSchema,
  updateReviewSchema,
  reviewIdBodySchema,
  listReviewsSchema,
  listCollegeReviewsSchema,
};
