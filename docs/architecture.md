# SAVJ — System Architecture Document

> **Version:** 1.0
> **Status:** Approved for implementation

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SAVJ CLIENTS                             │
│                                                                 │
│   ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│   │ Flutter Mobile  │  │  Next.js Web App │  │ Next.js Admin│ │
│   │ (Android-first) │  │  (public users)  │  │  Dashboard   │ │
│   └────────┬────────┘  └────────┬─────────┘  └──────┬───────┘ │
└────────────┼────────────────────┼──────────────────-─┼─────────┘
             │                   │                     │
             └─────────────────HTTPS─────────────────-─┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│  NGINX (TLS termination,        │          rate limiting)        │
└────────────────────────────────┼────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                     FastAPI Backend (Python 3.12)               │
│                                                                 │
│   /api/v1/auth    /tasks    /applications    /community         │
│   /events         /workers  /reviews         /payments          │
│   /messages       /badges   /impact          /admin             │
│   /notifications  /reports  /ai  /search                       │
│                                                                 │
│   JWT Authentication + Argon2 + RBAC Middleware                │
│   Pydantic v2 Validation • slowapi rate limiting               │
└────────────┬───────────────┬──────────────┬─────────────────────┘
             │               │              │
    ┌────────▼──────┐  ┌─────▼────┐  ┌─────▼────────────────┐
    │  PostgreSQL   │  │  Redis   │  │   Celery Workers     │
    │  15 + PostGIS │  │ (Upstash)│  │  (notifications,     │
    │               │  │          │  │   ML tasks,          │
    │  Alembic      │  │  Token   │  │   badge calc,        │
    │  Migrations   │  │  cache   │  │   payments)          │
    │               │  │  Pub/sub │  │                      │
    └───────────────┘  └──────────┘  └──────────────────────┘
                                              │
             ┌────────────────────────────────┼──────────────────┐
             │                                │                  │
    ┌────────▼─────────┐  ┌───────────────────▼────┐  ┌─────────▼──────┐
    │   AI Microservice│  │  MinIO (S3-compatible) │  │ Firebase (FCM) │
    │  (YOLO/ONNX)     │  │  Object Storage        │  │ Push Notifs    │
    │  :8001           │  │  (images, evidence)    │  │                │
    └──────────────────┘  └────────────────────────┘  └────────────────┘
```

---

## 2. Technology Decisions

### 2.1 Backend: FastAPI (Python 3.12)

**Why FastAPI:**
- Async-native for I/O-intensive workloads (DB queries, S3 uploads, AI calls)
- Auto-generated OpenAPI / Swagger documentation
- Pydantic v2 for strict input validation
- All three FastAPI reference repos demonstrate its suitability
- Strong ecosystem (SQLAlchemy, Alembic, Celery, slowapi)

**Why Python 3.12:**
- Latest stable Python with performance improvements
- Consistent with all reference repos

---

### 2.2 Database: PostgreSQL 15 + PostGIS 3

**Why PostgreSQL:**
- ACID-compliant, production-grade
- PostGIS extension for geospatial radius queries (task discovery, event check-in)
- Support for GEOGRAPHY type, `ST_DWithin`, `ST_Distance`
- Full-text search support (task search)
- UUID v4 primary keys via `gen_random_uuid()`

**Why PostGIS specifically:**
- Task discovery query: `WHERE ST_DWithin(location::geography, ST_MakePoint(lon, lat)::geography, radius_meters)`
- Check-in validation: server-side distance check — never trusting client GPS
- All three reference backend repos with geo features use PostGIS

---

### 2.3 ORM: SQLAlchemy 2.0 (async)

**Why SQLAlchemy 2.0:**
- Full async support with `asyncpg` driver
- Type-safe model declarations
- `selectinload` for efficient eager loading of relationships
- Required for Alembic migration support

**Why not Supabase SDK as primary ORM:**
- Supabase SDK is a query builder, not an ORM — less control
- Alembic requires SQLAlchemy models
- TaskMarket and VCN both use SQLAlchemy successfully

---

### 2.4 Migrations: Alembic

**Why Alembic:**
- Versioned schema migrations (required for production-safe schema evolution)
- Auto-generates migration files from SQLAlchemy model changes
- TaskMarket reference demonstrates Alembic works well in this stack
- VCN used auto-create (not production-safe) — we avoid this pattern

---

### 2.5 Cache & Sessions: Redis (Upstash)

**Why Redis:**
- O(1) refresh token lookup (faster than DB query on every request)
- WebSocket pub/sub fan-out for chat
- Celery broker

**Why Upstash:**
- Serverless Redis — no Redis server to manage in development
- Free tier suitable for university demo
- HTTP REST API fallback

---

### 2.6 Authentication: Custom JWT Module

**Why custom (not Supabase Auth):**
- Keeps all business logic server-side without third-party dependency
- Argon2id password hashing
- 15-min access tokens + 30-day rotating refresh tokens
- Redis-cached refresh validation
- SHA-256 hash stored in DB (raw token never in DB)
- Reusable auth module pattern (from VCN inspiration)

**Token lifecycle:**
```
Access token:   JWT HS256, 15 min, stateless
Refresh token:  secrets.token_urlsafe(64), 30 days
                → client holds raw token
                → server stores SHA-256 hash in Redis (fast) + DB (audit)
                → on refresh: old revoked, new issued (rotation)
                → on logout: Redis key deleted immediately
                → on ban: is_banned checked on every request
```

---

### 2.7 Background Tasks: Celery + Redis

**Why Celery:**
- FastAPI's `BackgroundTasks` is in-process — dies with server restart
- Celery tasks survive server restarts, retry on failure
- Required for: ML classification, badge recalculation, payment processing, push notifications

**Tasks that use Celery:**
- `classify_task_images` — after task creation
- `verify_checkin_evidence` — after check-in photo upload
- `calculate_volunteer_points` — after organizer verification
- `recalculate_badges` — after any impacting event
- `send_push_notification` — to avoid blocking API response
- `process_mock_payment` — payment state machine

---

### 2.8 Real-time: WebSocket + Redis Pub/Sub

**Architecture:**
```
Client A ──→ FastAPI WS endpoint ──→ ChatHub (in-memory room map)
                                         │
                               Redis pub/sub "chat_fanout"
                                         │
                                  All FastAPI workers
                                         │
                                   ChatHub.broadcast_local
                                         │
                              Client B WebSocket connection
```

**Scope:** Task-scoped chat only (Customer ↔ assigned Worker). Not a public forum.

---

### 2.9 Object Storage: MinIO (dev) / S3-compatible (prod)

**Why MinIO:**
- S3-compatible API — same code works against any S3 provider
- Runs locally in Docker Compose
- No cost for development

**Storage bucket structure:**
```
savj-uploads/
  profile-photos/
  task-images/
  task-evidence/
  event-covers/
  event-evidence/
  ai-analysis-cache/
```

**Image processing (before storage):**
- Validate MIME type (JPEG, PNG, WebP only)
- Validate file size (max 10 MB)
- Resize to max 1920×1080
- Convert to WebP (quality 85)
- Generate thumbnail (400×300 WebP)
- Store both: original-webp key + thumbnail key

---

### 2.10 AI Microservice (Python, FastAPI)

**Why separate microservice:**
- AI models are large; isolating them prevents the main API from bloating
- Can scale independently
- Can be replaced (ONNX → API → SaaS) without touching main API
- Sibling Docker container pattern (from VCN)

**Endpoints:**
```
POST /classify          { image_urls } → { category, objects, complexity, price_range, confidence }
POST /price-estimate    { category, complexity, location } → { min, max }
GET  /health
```

**Initial implementation:**
- YOLOv8n ONNX for object detection
- Rule-based category mapping from detected objects
- Rule-based price ranges per category + complexity

**Failure behavior:**
- If AI service unavailable → API returns 200 with `{ ai_available: false }`
- Task creation continues with manual user input
- Never block task creation on AI

---

### 2.11 Mobile: Flutter (Dart 3+)

**Why Flutter:**
- DailyWork and VCN both demonstrate production-quality Flutter apps
- Android-first (target user demographic)
- Single codebase across Android and iOS
- Dart 3 with sound null safety

**Architecture: Clean Architecture (simplified)**
```
lib/
  core/          → infrastructure (auth, network, storage, theme, router)
  features/      → feature modules (auth, tasks, community, profile…)
    [feature]/
      data/      → repositories (API + local cache)
      domain/    → models + business rules
      ui/        → screens + widgets + providers
  shared/        → common widgets, utils, constants
```

**State management: Riverpod 2.x**
- `StateNotifierProvider` for complex state (auth, task list, chat)
- `FutureProvider` for one-time fetches
- `AsyncNotifierProvider` for paginated feeds
- Repository pattern with abstract interfaces (testable)

**Navigation: GoRouter**
- Role-aware redirect guards (read `authProvider.state` on route change)
- Deep link support for notifications
- Route definitions in `core/router/`

**Offline cache: Hive**
- Cache: categories, recent task feed, own profile, nearby events
- Stale-data banner when offline
- Never falsely confirm a server action without API response

---

### 2.12 Web App: Next.js 15 (App Router)

**Why Next.js:**
- Specified in SAVJ spec
- Server-side rendering for public pages (SEO for task marketplace landing)
- App Router (RSC) for efficient data loading
- TypeScript strict mode

**Used for:** Public landing page, user auth, task marketplace, community events, user profiles, notifications, messages

**Mobile-first pages:** Landing, tasks, events, profiles
**Desktop-first pages:** Admin dashboard (separate app or `apps/admin/`)

---

### 2.13 Admin Dashboard: Next.js (separate app)

**Why separate from public web:**
- Completely isolated — admin bundle never shipped to public users
- Separate deployment (can use HTTP basic auth at infra level as first layer)
- Desktop-first layout

---

### 2.14 Push Notifications: Firebase Cloud Messaging

**Why Firebase FCM:**
- Free tier sufficient for university demo
- Android native integration
- `firebase-admin` Python SDK for server-side sends
- Stale token cleanup (from VCN pattern)

**Architecture:**
- `NotificationService` interface in FastAPI
- `FirebasePushProvider` implements it
- `MockPushProvider` for local dev (logs to console)
- Celery task `send_push_notification` wraps the service
- Switch provider by changing one config value

---

### 2.15 Maps

**Mobile:** `google_maps_flutter` or `flutter_map` (OpenStreetMap, free)
- **Decision:** `flutter_map` for MVP (no API key required), see `decisions.md`

**Web:** Leaflet.js with OpenStreetMap tiles

**Features needed:**
- Task location display on map
- Nearby tasks clustered on map
- Community event location
- User's current location (for radius)
- Meeting point for events

---

### 2.16 Payments (Mock in MVP)

**Architecture:**
```
PaymentService (interface)
  ├── create_payment(amount_paise, task_id, customer_id, worker_id) → PaymentRecord
  ├── authorize_payment(payment_id) → bool
  ├── capture_payment(payment_id) → bool
  ├── release_payment(payment_id) → bool
  └── refund_payment(payment_id, amount_paise) → bool

MockPaymentProvider (implements PaymentService)
  → Simulates escrow flow
  → All transitions succeed after 2-second delay
  → Creates full audit trail in payment_transactions

RazorpayProvider (stub, for future)
  → Same interface
  → Razorpay SDK calls
```

**Money storage:** Integer paise only (₹200 = 20000 paise). Never float.

---

## 3. Monorepo Structure

```
SAVJ/
├── apps/
│   ├── mobile/               Flutter (Android-first)
│   ├── web/                  Next.js (public users)
│   └── admin/                Next.js (admin dashboard)
│
├── services/
│   ├── api/                  FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── dependencies.py
│   │   │   ├── auth/
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   ├── routers/
│   │   │   ├── tasks/        Celery tasks
│   │   │   └── realtime.py   WebSocket + Redis pub/sub
│   │   ├── alembic/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── ai/                   AI microservice
│       ├── main.py
│       ├── classifier.py
│       ├── models/           ONNX model files
│       ├── Dockerfile
│       └── requirements.txt
│
├── infrastructure/
│   ├── database/
│   │   └── init/             PostGIS init SQL
│   └── docker/
│       └── nginx.conf
│
├── docs/
│   ├── prd.md
│   ├── flow.md
│   ├── architecture.md       (this file)
│   ├── design.md
│   ├── schema.md
│   ├── rules.md
│   ├── api.md
│   ├── security.md
│   ├── references.md
│   ├── decisions.md
│   └── deployment.md
│
├── scripts/
│   ├── seed.py
│   └── generate_qr.py
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── Makefile
├── .env.example
└── README.md
```

---

## 4. Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://savj:savj@localhost:5432/savj

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET=change-me-to-long-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# Object Storage (MinIO)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=savj-uploads
STORAGE_USE_SSL=false

# AI Service
AI_SERVICE_URL=http://localhost:8001

# Firebase (FCM)
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
USE_MOCK_NOTIFICATION=true

# Payment
PAYMENT_MODE=mock
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Maps
MAP_PROVIDER=openstreetmap

# App
APP_ENV=development
ALLOWED_ORIGINS=*
```

---

## 5. Docker Compose Services

```yaml
services:
  db:
    image: postgis/postgis:15-3.4
    ports: ["5432:5432"]
    environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"

  api:
    build: ./services/api
    ports: ["8000:8000"]
    depends_on: [db, redis, minio]
    volumes: [./services/api:/app]  # hot reload

  ai:
    build: ./services/ai
    ports: ["8001:8001"]

  celery:
    build: ./services/api
    command: celery -A app.tasks.celery_app worker
    depends_on: [redis, db]

  web:
    build: ./apps/web
    ports: ["3000:3000"]

  admin:
    build: ./apps/admin
    ports: ["3001:3001"]
```

---

## 6. API Design Principles

- Base path: `/api/v1`
- All responses: `{ success: bool, data: ..., error: { code, message } }`
- Pagination: `{ items, total, page, page_size, has_more }`
- Auth: `Authorization: Bearer <access_token>`
- HTTP status codes used correctly (200, 201, 204, 400, 401, 403, 404, 409, 422, 500)
- OpenAPI auto-generated, accessible at `/docs` (dev) and `/openapi.json`
- Never expose internal stack traces

---

## 7. Security Architecture

See `docs/security.md` for full detail. Summary:

- All server-side RBAC; never trust client-side role claims
- Pydantic v2 validates all inputs before any DB query
- All task state transitions server-enforced (FSM)
- GPS check-in validated server-side (never trusted from client)
- Points and badges awarded server-side only
- Images validated (MIME, size, content-type header check)
- Rate limiting: login 10/min, OTP 3/min, task creation 10/hour
- SQL injection impossible via SQLAlchemy parameterized queries
- No plaintext passwords; no plaintext refresh tokens stored

---

## 8. Why These Choices (Summary Table)

| Technology | Chosen | Why |
|-----------|--------|-----|
| FastAPI | ✅ | Async, auto-OpenAPI, Pydantic v2 |
| SQLAlchemy 2.0 | ✅ | ORM + Alembic support |
| Alembic | ✅ | Versioned migrations (production-safe) |
| PostgreSQL + PostGIS | ✅ | Geo-queries, ACID, UUID PK |
| Redis | ✅ | Token cache + Celery broker + pub/sub |
| Celery | ✅ | Reliable background task execution |
| Flutter + Riverpod | ✅ | Android-first, best reference match |
| GoRouter | ✅ | Role-aware redirects, deep links |
| Hive | ✅ | Offline cache |
| Next.js + TypeScript | ✅ | Specified in spec |
| MinIO | ✅ | S3-compatible, local dev |
| Firebase FCM | ✅ | Free, Android-native |
| Argon2id | ✅ | Best-practice password hashing |
| flutter_map (OSM) | ✅ | No API key, free tier |
| Mock payment | ✅ | MVP requirement; Razorpay-ready interface |
