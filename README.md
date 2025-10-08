# Krishi Sakhi

AI-powered personal crop companion focused on farmer usability, offline-first access (PWA), and multilingual support. This monorepo contains a Next.js 14 client and an Express/Prisma API server with PostgreSQL.

- Frontend: Next.js 14 (App Router), React 18, Tailwind CSS, next-pwa, next-i18next, Zustand
- Backend: Node.js ≥18, Express 4, Prisma ORM, PostgreSQL, JWT (pino/helmet/cors/rate limits)
- Integrations: Open‑Meteo (weather, no key), optional LLM (Gemini via Google Gen AI), optional Twilio for SMS/OTP, optional data.gov.in pincode


## Repository structure

```text path=null start=null
SIH PROT/
├─ client/                     # Next.js 14 PWA
│  ├─ public/                  # Icons, manifest.json, locales/, service worker
│  ├─ src/app/                 # App Router pages (auth, admin, weather, pest, chat, dashboard, etc.)
│  ├─ src/components/          # UI (PWA helpers, voice, bottom nav), reusable primitives
│  ├─ src/services/            # Axios client + feature services (auth, weather, market, pest, admin, etc.)
│  ├─ src/lib/                 # i18n, theme, TTS, data-saver utilities
│  ├─ next.config.js           # PWA + i18n + dev proxy (rewrites /api → :4000)
│  └─ tailwind.config.js       # Tailwind theme (brand colors)
│
├─ server/                     # Express API + Prisma
│  ├─ src/index.ts             # HTTP server (env.PORT)
│  ├─ src/app.ts               # Express app: security, CORS, rate limits, routers
│  ├─ src/config/              # environment (zod), prisma, jwt
│  ├─ src/api/routes/          # /api/* route mounts (auth, admin, weather, pest, market, farms, schemes, grievances, etc.)
│  ├─ src/api/controllers/     # Request handlers per feature
│  ├─ src/middleware/          # auth (JWT), rateLimit
│  ├─ src/services/            # Domain services (WeatherService, AdvisoryEngine, ChatService, etc.)
│  └─ src/database/            # Prisma schema + migrations + seeds
│
├─ docker-compose.yml          # Local Postgres service
├─ PROJECT_STRUCTURE.md        # Broader, forward-looking structure reference
├─ HARDWARE_INTEGRATION.md     # Rationale + future IoT ingestion plan
├─ TESTING.md                  # Testing strategy & examples
└─ WARP.md                     # Quickstart and troubleshooting notes
```


## Quick start (local development)

Prerequisites
- Node.js ≥ 18.17
- Docker (for local Postgres)

1) Install dependencies
```bash path=null start=null
cd server && npm install
cd ../client && npm install
```

2) Start Postgres (detached)
```bash path=null start=null
docker compose up -d postgres
```

3) Configure environment for the server
- Copy server/.env.example → server/.env and fill in values (see “Configuration” below)

4) Generate Prisma client and run migrations
```bash path=null start=null
cd server
npm run prisma:generate
npm run prisma:migrate
```

5) Run dev servers (in two terminals)
```bash path=null start=null
# Terminal A - backend (http://localhost:4000)
cd server && npm run dev

# Terminal B - frontend (http://localhost:3000)
cd client && npm run dev
```

By default, the client proxies /api/* to http://localhost:4000 via next.config.js rewrites. You can also set NEXT_PUBLIC_API_BASE on the client to bypass the proxy.


## How the app works (high level)

- Users (farmers) authenticate by phone (OTP). DEMO_MODE allows an OTP bypass (000000) for local/demo use.
- The app captures user profile and farm context (location, soil, crops). It provides:
  - Weather forecasts and advisories (Open‑Meteo) with caching
  - Pest detection (image upload) and chat advisories when an LLM API key is configured
  - Market trends (mock/data service) and simple dashboards
  - Admin analytics, geo analytics, broadcast messaging, and scheme management
  - Grievances (submit + list for the logged-in user)
- The client is a PWA. On supported browsers it can be installed and works offline for core UI and cached data. A data saver mode minimizes bandwidth usage.
- The backend is an Express API mounted under /api/*, using PostgreSQL via Prisma. It includes JWT auth, security headers, structured logs, and rate limits.


## Configuration

Server environment (server/.env) — see server/.env.example for full reference
- NODE_ENV: development | test | production (default: development)
- PORT: HTTP port (default: 4000)
- CORS_ORIGIN: Comma-separated origins (default: *)
- DATABASE_URL: postgresql://postgres:postgres@localhost:5432/krishi_mitra?schema=public
- JWT_SECRET: long random string in production
- JWT_EXPIRES_IN: e.g. 7d
- DEMO_MODE: true|false (true enables OTP bypass 000000 for demo)
- Admin options: ADMIN_ALLOWED_DOMAINS, ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASSWORD, ADMIN_DEMO_OTP
- Weather: WEATHER_UNITS (metric|imperial|standard), WEATHER_CACHE_TTL_SECONDS, WEATHER_DEFAULT_LAT, WEATHER_DEFAULT_LON
- Location fallback (optional): LOCATION_FALLBACK_FILE, LOCATION_FALLBACK_STATES
- Optional SMS: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID
- Optional LLM/GenAI for Chat & Pest: GEN_AI_PROVIDER (gemini), GEN_AI_API_KEY or GEMINI_API_KEY, GEN_AI_MODEL
- Optional data.gov.in pincode: DATA_GOV_API_KEY, DATA_GOV_PINCODE_RESOURCE_ID, DATA_GOV_BASE_URL

Client environment (client/.env.local)
- NEXT_PUBLIC_API_BASE: Set to http://localhost:4000/api (or your tunnel URL) to call the API directly instead of /api rewrite

Example server/.env (do not commit secrets)
```dotenv path=null start=null
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/krishi_mitra?schema=public
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=7d
DEMO_MODE=true

# Optional
ADMIN_ALLOWED_DOMAINS=kerala.gov.in,punjab.gov.in,up.gov.in
ADMIN_DEMO_EMAIL=
ADMIN_DEMO_PASSWORD=
ADMIN_DEMO_OTP=000000

# Weather
WEATHER_UNITS=metric
WEATHER_CACHE_TTL_SECONDS=600

# GenAI (required for chat/pest endpoints)
GEN_AI_PROVIDER=gemini
GEMINI_API_KEY=
GEN_AI_MODEL=

# data.gov.in (optional)
DATA_GOV_API_KEY=
DATA_GOV_PINCODE_RESOURCE_ID=
DATA_GOV_BASE_URL=https://api.data.gov.in/resource

# Offline location fallback (optional)
LOCATION_FALLBACK_FILE="/home/ikrishnaa/SIH PROT/New_DataSet.json"
LOCATION_FALLBACK_STATES=ODISHA,KERALA,PUNJAB,UTTAR PRADESH
```


## Running scripts

Backend (from server/)
- Dev: npm run dev (ts-node via nodemon)
- Build: npm run build (tsc to dist/)
- Start (built): npm start
- Prisma: npm run prisma:generate | npm run prisma:migrate | npm run prisma:deploy
- Lint/Format/Typecheck: npm run lint | npm run format | npm run typecheck
- Tests: npm test | npm run test:watch | npm run test:coverage

Frontend (from client/)
- Dev: npm run dev (Next on :3000)
- Build: npm run build
- Start (built): npm start
- Lint/Tests: npm run lint | npm test | npm run test:coverage

Database (from repo root)
```bash path=null start=null
docker compose up -d postgres
```


## API overview

Mounted in server/src/app.ts
- GET /health — service health
- /api/auth — POST /signup, /otp, /login, /login/password
- /api/admin — POST /login; see also /api/admin/analytics, /api/admin/geo-analytics, /api/admin/grievances, /api/admin/schemes, broadcast
- /api/users — public+me routes (usersPublic/usersMe)
- /api/locations — state/city/constituency helpers (with offline fallback dataset)
- /api/weather — weather forecast (Open‑Meteo)
- /api/advisory — advisory engine endpoints
- /api/market — crop market data/trends
- /api/farms — CRUD farms, task updates; media uploads under /uploads
- /api/schemes — scheme listing; /api/admin/schemes for management
- /api/grievances — submit + list; /api/admin/grievances for management
- /api/alerts — alerts management
- /api/chat — AI chat (requires GEN_AI_API_KEY)
- /api/predict — pest image analysis (requires GEN_AI_API_KEY)

Protected endpoints use Authorization: Bearer <token>. JWT is issued on login.


## PWA and offline behavior (client)

- next-pwa configuration caches the application shell, Next static assets, and images; provides an offline fallback route (/offline)
- Service worker auto-registers in production builds (disabled in development). See client/next.config.js
- Manifest defined in client/public/manifest.json. App is installable; icons present under public/icons
- Data Saver mode reduces network use where possible (images, charts)


## Internationalization (i18n)

- Locales: en, hi, ml, pa (see client/public/locales/*)
- Client is wrapped in I18nProvider. next-i18next and Next i18n settings are configured in next-i18next.config.js and next.config.js


## Database & Prisma

- Schema: server/src/database/schema.prisma
- Migrations: server/src/database/migrations/*
- Typical workflow: start Postgres → prisma:generate → prisma:migrate → run dev


## Security and production hardening

- HTTP security headers via helmet (CSP enabled in production)
- CORS configurable via CORS_ORIGIN (warns against * in production)
- Rate limiting for general/auth/LLM endpoints
- JWT auth middleware protects user/admin routes
- Structured logs with pino (pretty in dev)


## Testing

- Both client and server use Jest. The server also uses Supertest for API specs
- See TESTING.md for examples, coverage, and CI setup
```bash path=null start=null
# Backend
cd server && npm test

# Frontend
cd client && npm test
```


## Deployment notes

- Backend: build and run dist on your platform (ensure DATABASE_URL, JWT_SECRET, etc.)
```bash path=null start=null
cd server
npm run build
NODE_ENV=production PORT=4000 node dist/index.js
```
- Frontend: next build + next start (serve behind your reverse proxy)
- Postgres: use a managed DB or bring your own Postgres; apply prisma:deploy migrations during release
- Ensure GEN_AI_API_KEY is set if enabling /api/chat and /api/predict


## Troubleshooting

- Prisma/DB errors: ensure docker compose Postgres is running and DATABASE_URL matches
- Weather 400s: provide valid lat/lon or state/city; optionally set WEATHER_DEFAULT_LAT/LON
- Admin login forbidden: check ADMIN_ALLOWED_DOMAINS and (for demo OTP) ADMIN_DEMO_EMAIL/ADMIN_DEMO_OTP
- Chat/Pest 503: requires valid GEN_AI_API_KEY (Gemini supported)


## Roadmap & docs

- Feature backlog and PWA polish: FEATURE_BACKLOG_PWA.md
- Additional features and priorities: ADDITIONAL_FEATURES.md
- Hardware integration rationale and future ingestion: HARDWARE_INTEGRATION.md
- Milestones and testing guidance: MILESTONES.md, TESTING.md

