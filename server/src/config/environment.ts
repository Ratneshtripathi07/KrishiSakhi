// server/src/config/environment.ts
// Centralized environment variable management with safe defaults for dev
// and strict validation for production environments.

import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('dev_secret_change_me'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Database (Prisma will use DATABASE_URL)
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    .default('postgresql://postgres:postgres@localhost:5432/krishi_mitra?schema=public'),

  // Twilio (optional in demo mode)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),

  // Feature flags
  DEMO_MODE: z.coerce.boolean().default(true), // allows OTP bypass for demo

  // Admin settings
  ADMIN_ALLOWED_DOMAINS: z.string().default('kerala.gov.in,punjab.gov.in,up.gov.in'),
  ADMIN_DEMO_EMAIL: z.string().email().optional(),
  ADMIN_DEMO_PASSWORD: z.string().optional(),
  ADMIN_DEMO_OTP: z.string().default('000000'),

  // Location fallback dataset (offline)
  LOCATION_FALLBACK_FILE: z.string().optional(),
  LOCATION_FALLBACK_STATES: z.string().optional(),

  // Weather (Open-Meteo; no API key required)
  WEATHER_UNITS: z.enum(['metric', 'imperial', 'standard']).default('metric'),
  WEATHER_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  WEATHER_DEFAULT_LAT: z.coerce.number().optional(),
  WEATHER_DEFAULT_LON: z.coerce.number().optional(),

  // Gen AI provider for chat/pest (optional; demo fallback if unset)
  GEN_AI_PROVIDER: z.string().default('gemini'),
  GEN_AI_API_KEY: z.string().optional(),
  GEN_AI_MODEL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // In production, fail fast if env invalid
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  // In dev/test, log and continue with defaults
  // eslint-disable-next-line no-console
  console.warn('[env] Using defaults due to validation issues:', parsed.error.flatten().fieldErrors);
}

export const env = parsed.success ? parsed.data : EnvSchema.parse({});

// Production guardrails (warn on insecure defaults)
if (parsed.success && parsed.data.NODE_ENV === 'production') {
  const cors = parsed.data.CORS_ORIGIN || '*';
  if (cors.includes('*')) {
    // eslint-disable-next-line no-console
    console.warn('[env] CORS_ORIGIN is "*" in production. Set specific origins for better security.');
  }
}
