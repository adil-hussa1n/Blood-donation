import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { testDbConnection } from './config/db.js';
import { initDatabase } from './config/initDb.js';
import { startMaintenanceCron } from './cron/maintenance.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Trust reverse proxies (Dokploy, Nginx, Cloudflare) for accurate client IP detection
app.set('trust proxy', 1);

// 1. Helmet HTTP Security Headers (HSTS, clickjacking, X-Content-Type-Options, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    xFrameOptions: { action: 'sameorigin' },
    xContentTypeOptions: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://accounts.google.com',
          'https://pagead2.googlesyndication.com',
          'https://connect.facebook.net',
          'https://*.googlesyndication.com',
          'https://*.google.com',
          'https://*.doubleclick.net',
          'https://ep2.adtrafficquality.google',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://lh3.googleusercontent.com',
          'https://images.unsplash.com',
          'https://www.facebook.com',
          'https://pagead2.googlesyndication.com',
          'https://*.google.com',
          'https://*.doubleclick.net',
          'https://*.googlesyndication.com',
        ],
        connectSrc: ["'self'", 'https:', 'http://localhost:*', 'ws:', 'wss:'],
        frameSrc: [
          "'self'",
          'https://accounts.google.com',
          'https://googleads.g.doubleclick.net',
          'https://*.doubleclick.net',
          'https://ep2.adtrafficquality.google',
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
  })
);

// 2. Disable x-powered-by header to prevent fingerprinting
app.disable('x-powered-by');

// 3. Global DDoS protection rate limiter: Max 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests. Please slow down.' } },
});
app.use('/api', globalLimiter);

// 4. Strict CORS policy (Whitelisted origins only, prevents overly permissive CORS scanner warnings)
const defaultAllowedOrigins = [
  'https://donors.daruntech.com',
  'https://daruntech.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, healthchecks)
      if (!origin) return callback(null, true);

      const envFrontend = process.env.FRONTEND_URL;
      const allowedOrigins = [...defaultAllowedOrigins];
      if (envFrontend && envFrontend !== '*') {
        envFrontend.split(',').forEach((o) => {
          const trimmed = o.trim().replace(/\/+$/, '');
          if (trimmed && !allowedOrigins.includes(trimmed)) {
            allowedOrigins.push(trimmed);
          }
        });
      }

      // Check exact whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check verified domain patterns
      const isDarunTech = origin.endsWith('.daruntech.com');
      const isVercelPreview = origin.endsWith('.vercel.app');
      const isLocalDev =
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin === 'http://localhost' ||
        origin === 'http://127.0.0.1';

      if (isDarunTech || isVercelPreview || isLocalDev) {
        return callback(null, true);
      }

      // Explicitly reject unverified origins
      return callback(new Error('Blocked by CORS policy'));
    },
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
