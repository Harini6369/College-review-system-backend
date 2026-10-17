import Joi from 'joi';

const objectId = Joi.string()
  .hex()
  .length(24)
  .messages({
    'string.hex': 'must be a valid MongoDB ObjectId',
    'string.length': 'must be a valid MongoDB ObjectId',
  });

const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
};

const empty = Joi.object().max(0);

export { objectId, pagination, empty };
