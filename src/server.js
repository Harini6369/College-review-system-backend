import env from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import app from './app.js';

async function start() {
  await connectDatabase(env.mongodbUri);

  if (env.seedOnStart) {
    const { runSeed } = await import('./scripts/seed.js');
    await runSeed();
  }

  const server = app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start server');
  console.error(err.message);
  process.exit(1);
});
