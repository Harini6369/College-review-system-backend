import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

function isDuplicateKey(err) {
  return err && err.code === 11000;
}

function duplicateMessage(err) {
  const pattern = err.keyPattern || {};
  if (pattern.email) {
    return 'An account with this email already exists';
  }
  if (pattern.nameNormalized || pattern.locationNormalized) {
    return 'A college with this name and location already exists';
  }
  if (pattern.collegeId && pattern.userId) {
    return 'You have already reviewed this college';
  }
  return 'A conflicting resource already exists';
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details || undefined;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
    details = undefined;
  } else if (isDuplicateKey(err)) {
    statusCode = 409;
    message = duplicateMessage(err);
    details = undefined;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or expired token';
    details = undefined;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    details = undefined;
  }

  const isOperational = err.isOperational === true || statusCode < 500;
  if (!isOperational) {
    statusCode = 500;
    message = 'Internal server error';
    details = undefined;
    if (!env.isTest) {
      console.error(err);
    }
  }

  const body = {
    success: false,
    message,
  };

  if (details) {
    body.details = details;
  }

  return res.status(statusCode).json(body);
}

export default errorHandler;
