// import express, { NextFunction, Request, Response } from 'express';
// import helmet from 'helmet';
// import cors, { CorsOptions } from 'cors';
// import morgan from 'morgan';
// import pinoHttp from 'pino-http';
// import compression from 'compression';
// import { env } from './config/environment';
// import { generalLimiter, authLimiter, llmLimiter } from './middleware/rateLimit';
// import { logger } from './utils/logger';

// /**
//  * Express application configuration
//  * - Security headers (helmet)
//  * - CORS (configurable via env.CORS_ORIGIN)
//  * - Body parsing (JSON + URL-encoded)
//  * - Request logging (morgan)
//  * - Basic rate limiting
//  * - Health check endpoint
//  * - 404 and centralized error handling
//  */
// const app = express();

// // Trust reverse proxy headers (X-Forwarded-*) when deployed behind proxies
// app.set('trust proxy', 1);

// // Security hardening and cleanliness
// app.disable('x-powered-by');
// app.use(helmet({
//   contentSecurityPolicy: env.NODE_ENV === 'production' ? {
//     useDefaults: true,
//     directives: {
//       defaultSrc: ["'self'"],
//       connectSrc: ["'self'"],
//       imgSrc: ["'self'", 'data:', 'https:'],
//       scriptSrc: ["'self'"],
//       styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
//       fontSrc: ["'self'", 'https:', 'data:'],
//       objectSrc: ["'none'"],
//       frameAncestors: ["'none'"],
//     },
//   } : false,
//   crossOriginEmbedderPolicy: false, // for compatibility
// }));

// // Configure CORS: allow multiple comma-separated origins or '*'
// const allowedOrigins = (env.CORS_ORIGIN || '*')
//   .split(',')
//   .map((o) => o.trim())
//   .filter(Boolean);

// const corsOptions: CorsOptions = {
//   origin: (origin, callback) => {
//     // Allow same-origin or explicit allow-list (prod must not use *)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.includes('*') && env.NODE_ENV !== 'production') return callback(null, true);
//     if (allowedOrigins.includes(origin)) return callback(null, true);
//     // Allow any ngrok tunnel during local/dev testing
//     if (env.NODE_ENV !== 'production' && typeof origin === 'string' && /\.ngrok(-free)?\.app$/i.test(new URL(origin).host)) {
//       return callback(null, true);
//     }
//     return callback(new Error('Not allowed by CORS'));
//   },
//   credentials: true,
// };
// app.use(cors(corsOptions));

// // Compression + Body parsers
// app.use(compression({ threshold: '1kb' }));
// app.use(express.json({ limit: '1mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Request logging (pino + morgan for concise dev output)
// app.use(pinoHttp({
//   logger,
//   genReqId: (req: any, _res: any) => {
//     const existing = (req.headers['x-request-id'] as string) || undefined;
//     if (existing) return existing;
//     // pino-http will populate request id if not provided
//     return undefined as unknown as string;
//   },
// } as any));
// app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// // Basic rate limiting
// app.use(generalLimiter);


// // Health check for uptime probes and CI
// app.get('/health', (_req: Request, res: Response) => {
//   return res.status(200).json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
// });

// // Root landing route with helpful API info
// app.get('/', (_req: Request, res: Response) => {
//   return res.status(200).json({
//     name: 'krishi-mitra API',
//     status: 'ok',
//     env: env.NODE_ENV,
//     timestamp: new Date().toISOString(),
//     endpoints: [
//       '/health',
//       '/api/auth',
//       '/api/admin',
//       '/api/admin/analytics',
//       '/api/admin/geo-analytics',
//       '/api/users',
//       '/api/locations'
//     ],
//     // In development, hint where the client runs
//     client: env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined
//   });
// });

// // TODO: Mount feature routes here as they are implemented
// import { authRouter } from './api/routes/auth';
// import { adminRouter } from './api/routes/admin';
// import { adminAnalyticsRouter } from './api/routes/adminAnalytics';
// import { adminBroadcastRouter } from './api/routes/adminBroadcast';
// import { usersPublicRouter } from './api/routes/usersPublic';
// import { usersMeRouter } from './api/routes/usersMe';
// import { locationsRouter } from './api/routes/locations';
// import { adminGeoAnalyticsRouter } from './api/routes/adminGeoAnalytics';
// import { weatherRouter } from './api/routes/weather';
// import { alertsRouter } from './api/routes/alerts';
// import { chatRouter } from './api/routes/chat';
// import { pestRouter } from './api/routes/pest';
// import { advisoryRouter } from './api/routes/advisory';
// import { marketRouter } from './api/routes/market';
// app.use('/api/auth', authLimiter, authRouter);
// app.use('/api/admin', adminRouter);
// app.use('/api/admin/analytics', adminAnalyticsRouter);
// app.use('/api/admin/geo-analytics', adminGeoAnalyticsRouter);
// app.use('/api/admin', adminBroadcastRouter);
// app.use('/api/users', usersPublicRouter);
// app.use('/api/users', usersMeRouter);
// app.use('/api/locations', locationsRouter);
// app.use('/api/weather', weatherRouter);
// app.use('/api/advisory', advisoryRouter);
// app.use('/api/market', marketRouter);
// app.use('/api/alerts', alertsRouter);
// app.use('/api/chat', llmLimiter, chatRouter);
// app.use('/api/predict', llmLimiter, pestRouter);
// // app.use('/api/users', userRouter);

// // 404 handler
// app.use((req: Request, res: Response) => {
//   return res.status(404).json({ error: 'Not Found', path: req.path });
// });

// // Centralized error handler
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//   const status = typeof err.status === 'number' ? err.status : 500;
//   const code = err.code || 'INTERNAL_SERVER_ERROR';
//   const message = err.message || 'Internal Server Error';
//   if (env.NODE_ENV !== 'production') {
//     // Log stack traces only in non-production
//     // eslint-disable-next-line no-console
//     console.error('[error]', { code, message, stack: err.stack });
//   }
//   return res.status(status).json({ error: message, code });
// });

// export { app };



import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import compression from 'compression';
import { env } from './config/environment';
import { generalLimiter, authLimiter, llmLimiter } from './middleware/rateLimit';
import { logger } from './utils/logger';
import path from 'path';

/**
 * Express application configuration
 * - Security headers (helmet)
 * - CORS (configurable via env.CORS_ORIGIN)
 * - Body parsing (JSON + URL-encoded)
 * - Request logging (morgan)
 * - Basic rate limiting
 * - Health check endpoint
 * - 404 and centralized error handling
 */
const app = express();

// Trust reverse proxy headers (X-Forwarded-*) when deployed behind proxies
app.set('trust proxy', 1);

// Security hardening and cleanliness
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false, // for compatibility
}));

// Configure CORS: allow multiple comma-separated origins or '*'
const allowedOrigins = (env.CORS_ORIGIN || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: true,
  credentials: true,
};
app.use(cors(corsOptions));

// Compression + Body parsers
app.use(compression({ threshold: '1kb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (pino + morgan for concise dev output)
app.use(pinoHttp({
  logger,
  genReqId: (req: any, _res: any) => {
    const existing = (req.headers['x-request-id'] as string) || undefined;
    if (existing) return existing;
    // pino-http will populate request id if not provided
    return undefined as unknown as string;
  },
} as any));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic rate limiting
app.use(generalLimiter);

// Serve uploads (local disk)
app.use('/uploads', (req, res, next) => { res.setHeader('Cross-Origin-Resource-Policy', 'same-site'); next(); }, express.static(path.resolve(__dirname, './uploads')));

// Health check for uptime probes and CI
app.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok', env: env.NODE_ENV, timestamp: new Date().toISOString() });
});

// Root landing route with helpful API info
app.get('/', (_req: Request, res: Response) => {
  return res.status(200).json({
    name: 'krishi-mitra API',
    status: 'ok',
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health',
      '/api/auth',
      '/api/admin',
      '/api/admin/analytics',
      '/api/admin/geo-analytics',
      '/api/users',
      '/api/locations'
    ],
    // In development, hint where the client runs
    client: env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined
  });
});

// TODO: Mount feature routes here as they are implemented
import { authRouter } from './api/routes/auth';
import { adminRouter } from './api/routes/admin';
import { adminAnalyticsRouter } from './api/routes/adminAnalytics';
import { adminBroadcastRouter } from './api/routes/adminBroadcast';
import { usersPublicRouter } from './api/routes/usersPublic';
import { usersMeRouter } from './api/routes/usersMe';
import { locationsRouter } from './api/routes/locations';
import { adminGeoAnalyticsRouter } from './api/routes/adminGeoAnalytics';
import { weatherRouter } from './api/routes/weather';
import { alertsRouter } from './api/routes/alerts';
import { chatRouter } from './api/routes/chat';
import { pestRouter } from './api/routes/pest';
import { advisoryRouter } from './api/routes/advisory';
import { marketRouter } from './api/routes/market';
import { farmsRouter } from './api/routes/farms';
import { schemesRouter } from './api/routes/schemes';
import { adminSchemesRouter } from './api/routes/adminSchemes';
import { grievancesRouter } from './api/routes/grievances';
import { adminGrievancesRouter } from './api/routes/adminGrievances';
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/analytics', adminAnalyticsRouter);
app.use('/api/admin/geo-analytics', adminGeoAnalyticsRouter);
app.use('/api/admin', adminBroadcastRouter);
app.use('/api/users', usersPublicRouter);
app.use('/api/users', usersMeRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/advisory', advisoryRouter);
app.use('/api/market', marketRouter);
app.use('/api/farms', farmsRouter);
app.use('/api/schemes', schemesRouter);
app.use('/api/admin/schemes', adminSchemesRouter);
app.use('/api/grievances', grievancesRouter);
app.use('/api/admin/grievances', adminGrievancesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/chat', llmLimiter, chatRouter);
app.use('/api/predict', llmLimiter, pestRouter);
// app.use('/api/users', userRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({ error: 'Not Found', path: req.path });
});

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = typeof err.status === 'number' ? err.status : 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Internal Server Error';
  if (env.NODE_ENV !== 'production') {
    // Log stack traces only in non-production
    // eslint-disable-next-line no-console
    console.error('[error]', { code, message, stack: err.stack });
  }
  return res.status(status).json({ error: message, code });
});

export { app };