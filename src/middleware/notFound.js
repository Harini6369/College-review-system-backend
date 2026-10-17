import ApiError from '../utils/ApiError.js';

function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

export default notFound;
