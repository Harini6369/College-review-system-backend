import env from './env.js';

const allowAllOrigins = env.corsOrigin === '*';
const allowedOrigins = allowAllOrigins ? null : new Set(env.corsOrigin);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowAllOrigins || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  credentials: !allowAllOrigins,
};

export default corsOptions;
