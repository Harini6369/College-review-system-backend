import mongoose from 'mongoose';

async function connectDatabase(uri, { retries = 10, delayMs = 2000 } = {}) {
  mongoose.set('strictQuery', true);

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri);
      return mongoose.connection;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }
    }
  }

  throw lastError;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export { connectDatabase, disconnectDatabase };
