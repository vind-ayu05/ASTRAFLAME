// ASTRAFLAME Express Backend Server with Production Security Hardening
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { config } from './config/index.ts';
import { apiRouter } from './api/routes.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { startSyncWorker } from './services/syncService.ts';
import { requestSecurityMiddlewares } from './middleware/requestSecurity.ts';
import { checkBlocklist } from './middleware/ipBlocklist.ts';
import { securityMonitorMiddleware } from './middleware/securityMonitor.ts';

const app = express();
const PORT = config.port;

// 0. Trust one reverse proxy layer (Cloudflare / Nginx) for correct req.ip
//    Adjust to 'loopback' or a specific CIDR in production if needed.
app.set('trust proxy', 1);

// 1. Disable X-Powered-By header to avoid fingerprinting
app.disable('x-powered-by');

// 2. HTTP Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'http://localhost:*',
          'http://127.0.0.1:*',
          'https://*.supabase.co',
          'wss://*.supabase.co',
        ],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
  })
);

// 3. Strict CORS configuration
app.use(cors(config.cors));

// 3b. Early security middleware: request ID, UA detection, concurrent limiter, HPP, proto-pollution guard
app.use(requestSecurityMiddlewares);

// 3c. IP blocklist check (block known attackers before any processing)
app.use(checkBlocklist);

// 3d. Security monitor: track failed logins, 404 rates, endpoint enumeration
app.use(securityMonitorMiddleware);

// 4. Request Body Size Limiting (100kb standard JSON limit; storage uploads handle up to 10MB separately)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 5. Mount API router
app.use('/api', apiRouter);

// 6. Centralized error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const server = http.createServer(app);

  // Protect against slow-loris and hanging connections
  server.setTimeout(30_000);           // 30 s request timeout
  server.headersTimeout = 15_000;      // 15 s to receive full headers
  server.keepAliveTimeout = 65_000;    // slightly above Cloudflare's 60 s keepalive

  server.listen(PORT, () => {
    console.log(`[ASTRAFLAME Backend] Running securely on http://localhost:${PORT}`);
    console.log(`[ASTRAFLAME Backend] Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`[ASTRAFLAME Backend] Database diagnostics: http://localhost:${PORT}/api/health/database`);
    console.log(`[ASTRAFLAME Backend] Dashboard stats: http://localhost:${PORT}/api/dashboard/stats`);

    // Start background asynchronous synchronization worker
    startSyncWorker();
  });
}

export default app;
