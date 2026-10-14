import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { testDbConnection } from './config/db.js';
import { initDatabase } from './config/initDb.js';
import { startMaintenanceCron } from './cron/maintenance.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount REST API
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// Start Server
async function bootstrap() {
  console.log('🚀 Starting Blood Donation API Server...');

  // 1. Check / Initialize Database with retries (critical for Docker / VPS startup)
  let dbReady = false;
  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const initSuccess = await initDatabase();
      if (initSuccess) {
        dbReady = true;
        break;
      }
    } catch (err: any) {
      console.warn(`⏳ Waiting for database server... (${err.message})`);
    }
    if (attempt < maxRetries) {
      console.log(`⏳ Database not ready yet, retrying in 3s (attempt ${attempt}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  if (dbReady) {
    await testDbConnection();
  } else {
    console.warn('⚠️ Server starting without confirmed DB connection. Verify your database settings.');
  }

  // 2. Start Maintenance Cron
  startMaintenanceCron();

  // 3. Listen on PORT
  app.listen(PORT, () => {
    console.log(`📡 Backend API is live on http://localhost:${PORT}`);
    console.log(`🔗 API Documentation / Healthcheck: http://localhost:${PORT}/api/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal Bootstrap Error:', err);
});
