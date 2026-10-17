import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import env from './config/env.js';
import routes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import openapi from './docs/openapi.js';
import { sendSuccess } from './utils/apiResponse.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: env.corsOrigin,
  credentials: env.corsOrigin !== '*',
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(mongoSanitize());

const healthHandler = (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return sendSuccess(res, {
    message: 'Service healthy',
    data: {
      status: 'ok',
      uptime: process.uptime(),
      environment: env.nodeEnv,
      database: states[mongoose.connection.readyState] || 'unknown',
      timestamp: new Date().toISOString(),
    },
  });
};

app.post('/health', healthHandler);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));
app.get('/openapi.json', (req, res) => res.json(openapi));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
