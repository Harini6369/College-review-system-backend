import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.isTest ? 1000 : env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many authentication attempts. Please try again later.'));
  },
});

export { authLimiter };
