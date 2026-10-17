import ApiError from '../utils/ApiError.js';

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      }
    );

    if (error) {
      const details = error.details.map((item) => ({
        field: item.path.join('.'),
        message: item.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }

    if (value.body) {
      req.body = value.body;
    }
    if (value.query) {
      req.query = value.query;
    }
    if (value.params) {
      req.params = value.params;
    }

    return next();
  };
}

export default validate;
