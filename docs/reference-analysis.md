# SAVJ — Reference Repository Analysis & Architecture Recommendation

> **Purpose:** This document analyses the four reference repositories included in the
> workspace and distils them into a recommended architecture for the SAVJ application.
> No application code has been written yet.

---

## 1. Reference Repository Summary

### 1.1 EcoConnect (`EcoConnect-App-main`)

| Attribute | Detail |
|-----------|--------|
| **Type** | Mobile frontend only (no custom backend) |
| **Stack** | React Native 0.81 + Expo 54 + TypeScript |
| **Navigation** | Expo Router v6 (file-based, role-aware redirects) |
| **State** | React Context (AuthContext, CurrencyContext, NotificationContext) |
| **Backend** | Firebase Auth + Firestore + Firebase Storage |
| **Media** | Cloudinary upload utility |
| **Styling** | NativeWind v4 (Tailwind on React Native) |
| **Roles** | Volunteer, Organizer, Sponsor, Waste Collector, Researcher |
| **Key patterns** | Role-based dashboard routing, Firestore real-time subscriptions, multi-currency context, per-role tab groups |

**What it contributes to SAVJ:**
- Role-based navigation architecture (multiple distinct user types)
- Firebase as a ready BaaS option (Auth + Firestore + Storage)
- Expo Router file-based routing convention
- Multi-role tab layout pattern

---

### 1.2 DailyWork (`dailywork-main`)

| Attribute | Detail |
|-----------|--------|
| **Type** | Full-stack: Flutter (Android-first) + FastAPI + Supabase PostgreSQL |
| **Frontend** | Flutter/Dart, Riverpod state management, `go_router`, Hive offline cache |
| **Backend** | FastAPI async, Pydantic v2, `pydantic-settings`, `slowapi` rate limiting |
| **Database** | Supabase (PostgreSQL 15 + PostGIS), Supabase Auth |
| **Auth** | Phone OTP via Supabase Auth; JWT JWKS RS256 + HS256 fallback; role guards via `require_worker`/`require_employer` |
| **Geo** | PostGIS `ST_DWithin` radius queries; OpenStreetMap / Nominatim |
| **Architecture layers** | `routers/` → `services/` (business logic) → Supabase SDK |
| **Dev bypass** | Dev phone numbers with hardcoded OTP for local testing |
| **Key patterns** | Service-layer separation (HTTP ↔ business logic ↔ data), Riverpod provider tree, repository pattern with abstract/API implementations, offline Hive cache with stale-data banner |

**What it contributes to SAVJ:**
- Most mature FastAPI layered architecture (routers → services)
- Supabase Auth + JWKS JWT validation pattern
- Riverpod as a production-grade Flutter state solution
- Hive offline cache strategy
- `pydantic-settings` for typed config
- PostGIS geo-query pattern for location-aware features

---

### 1.3 Task Marketplace API (`task-marketplace-api-main`)

| Attribute | Detail |
|-----------|--------|
| **Type** | Backend only (FastAPI + PostgreSQL) |
| **Stack** | FastAPI async, SQLAlchemy 2.0 ORM (async), Alembic migrations, Celery + Redis, MinIO (S3-compatible), Docker Compose |
| **Auth** | JWT (python-jose) + Argon2 password hashing; access + refresh tokens |
| **Real-time** | WebSocket rooms (`JobChatHub`), Redis pub/sub fan-out |
| **Background tasks** | Celery + Redis for notifications, payment processing, cleanup |
| **Payments** | Escrow flow (funds held until completion) |
| **Geo** | PostGIS radius queries |
| **Key patterns** | SQLAlchemy 2.0 ORM (preferred over raw Supabase SDK), Alembic for schema migrations, WebSocket + Redis fan-out, Celery for heavy async work |

**What it contributes to SAVJ:**
- SQLAlchemy 2.0 async ORM as a more maintainable DB layer
- Alembic migration management (essential for production)
- WebSocket + Redis fan-out for real-time features
- Celery task queue pattern for background work
- Escrow payment abstraction pattern
- Docker Compose multi-service orchestration

---

### 1.4 Volunteer Cleanup Network (`volunteer-cleanup-network-main`)

| Attribute | Detail |
|-----------|--------|
| **Type** | Full-stack: Flutter + FastAPI + SQLAlchemy + ML microservice |
| **Frontend** | Flutter, Provider (simple state), Dio + interceptors, `flutter_secure_storage`, Google Maps |
| **Backend** | FastAPI async, SQLAlchemy 2.0 (SQLite dev / PostgreSQL prod), Alembic-free (auto-create), self-contained `auth/` module |
| **Auth** | Email/password; JWT HS256 (15-min access) + rotating refresh tokens (30-day); Redis (Upstash) refresh cache; OAuth via Supabase JWT bridge |
| **Notifications** | Firebase Cloud Messaging (FCM) via `firebase-admin`, stale-token cleanup |
| **Media** | Cloudinary (image resize → WebP → CDN) with mock mode |
| **ML** | YOLOv8/ONNX trash classifier as a sibling Docker microservice |
| **Deployment** | AWS EC2 + Nginx + Certbot HTTPS + DuckDNS |
| **Gamification** | Points system, leaderboard, rewards catalog, redemption requests |
| **Key patterns** | Self-contained auth module (drop-in reusable), background ML tasks, multi-phase task lifecycle state machine, admin role guard, Dio interceptor auto-refresh |

**What it contributes to SAVJ:**
- Most complete production deployment diagram (EC2 + Nginx + Docker + HTTPS)
- Reusable auth module pattern
- Gamification data model (points, leaderboard, rewards)
- Dio interceptor token refresh pattern for Flutter
- Background ML integration pattern
- Mock mode patterns (images, notifications) for local dev

---

## 2. Cross-Cutting Patterns (What All Four Agree On)

| Pattern | Consensus |
|---------|-----------|
| **Backend framework** | FastAPI (async, Python 3.11+) — used by 3 of 4; Firebase by EcoConnect |
| **API style** | REST; JWT Bearer tokens |
| **Flutter as mobile client** | DailyWork + VCN; EcoConnect uses React Native |
| **PostgreSQL** | DailyWork (Supabase), TaskMarket (Docker), VCN (SQLite→PG) |
| **JWT dual-token** | Access (short-lived) + Refresh (rotated, cached in Redis) |
| **Role-based access** | All four use role guards on routes |
| **Location features** | PostGIS geo-queries in DailyWork & TaskMarket |
| **Image storage** | Cloudinary (EcoConnect, VCN); MinIO (TaskMarket) |
| **Offline / caching** | Hive (DailyWork), Redis (TaskMarket, VCN auth) |
| **Background tasks** | FastAPI `BackgroundTasks` (VCN, DailyWork); Celery (TaskMarket) |
| **Docker** | All three FastAPI projects ship Docker Compose |
| **Swagger off in prod** | DailyWork explicitly disables docs in production |

---

## 3. Identified Strengths & Weaknesses per Repo

### DailyWork — Strongest Backend Architecture
✅ Best layered architecture (routers → services → data)  
✅ Supabase Auth + JWKS JWT (enterprise-grade, no custom key mgmt)  
✅ `pydantic-settings` typed config  
✅ Offline-first Flutter with Hive  
✅ Rate limiting (slowapi)  
⚠️ No Alembic migrations (relies on Supabase dashboard)  
⚠️ Supabase SDK as DB layer — less control than SQLAlchemy ORM  

### Task Marketplace — Best Infrastructure
✅ SQLAlchemy 2.0 ORM + Alembic migrations (proper versioned schema)  
✅ Celery + Redis for scalable background work  
✅ WebSocket + Redis fan-out for real-time  
✅ Escrow payment model  
✅ Full Docker Compose  
⚠️ No Flutter frontend  
⚠️ Backend ~70% complete  

### Volunteer Cleanup Network — Best Full-Stack Example
✅ Complete production deployment story (EC2 + Nginx + Certbot + Docker)  
✅ Reusable drop-in `auth/` module  
✅ ML microservice sidecar pattern  
✅ Gamification loop (points, leaderboard, rewards)  
✅ Dio interceptor auto-refresh  
✅ Mock modes for all external services  
⚠️ Uses `Provider` (basic) instead of Riverpod  
⚠️ No Alembic (auto-creates tables on startup — not prod-safe for migrations)  
⚠️ CORS allow_origins=[] (hardcoded empty in main.py — mobile dev assumption)  

### EcoConnect — Best Multi-Role UX Reference
✅ Role-based file-based routing pattern  
✅ Multi-currency, notification preferences contexts  
✅ Firebase simplicity (no custom backend)  
⚠️ No custom backend — can't model complex server logic  
⚠️ React Native instead of Flutter (different from other 3)  
⚠️ Context-based state — not scalable for complex apps  

---

## 4. Inferred SAVJ Application Domain

Based on the four reference repos, SAVJ appears to be a **community-driven, location-aware task/gig marketplace with environmental or social impact**, combining:

- **Multi-role users** (similar to EcoConnect: multiple distinct personas)
- **Task lifecycle management** (similar to VCN's OPEN → IN_PROGRESS → PENDING_APPROVAL → COMPLETED)
- **Location-aware matching** (similar to DailyWork + TaskMarket's PostGIS geo-queries)
- **Gamification / points** (similar to VCN's points + leaderboard + rewards)
- **Media attachments** (photo uploads like VCN)
- **Background AI/ML processing** (trash classifier pattern from VCN)
- **Payment or escrow mechanics** (TaskMarket pattern)
- **Real-time notifications** (FCM push + WebSocket patterns)

---

## 5. Recommended Architecture for SAVJ

### 5.1 High-Level System Diagram

```
                         SAVJ Clients
          ┌──────────────────────────────────────┐
          │  Flutter App (Android-first + iOS)   │
          │  React Native Web (optional admin)   │
          └──────────────────┬───────────────────┘
                             │ HTTPS / WebSocket
          ┌──────────────────▼───────────────────┐
          │           FastAPI Backend            │
          │  /api/v1/auth  /tasks  /users        │
          │  /payments  /reviews  /media  /ws    │
          │  JWT Bearer + Refresh Token Rotation │
          └──────┬──────────┬─────────┬──────────┘
                 │          │         │
     ┌───────────▼──┐ ┌─────▼───┐ ┌──▼──────────┐
     │  PostgreSQL  │ │  Redis  │ │   Celery     │
     │  + PostGIS   │ │(Upstash)│ │  Workers     │
     │  (Supabase   │ │cache +  │ │  (notifs,    │
     │   or Railway)│ │pub/sub  │ │   ML calls,  │
     └──────────────┘ └─────────┘ │   payments)  │
                                  └──────────────┘
                                         │
                             ┌───────────┼────────────┐
                             │           │            │
                    ┌────────▼──┐ ┌──────▼───┐ ┌────▼──────┐
                    │Cloudinary │ │  ML       │ │ Firebase  │
                    │(Images)   │ │Microserv. │ │  (FCM     │
                    │           │ │(ONNX/HTTP)│ │  Push)    │
                    └───────────┘ └──────────┘ └───────────┘

         Production: EC2 + Nginx + Certbot + Docker Compose
```

---

### 5.2 Backend: FastAPI (Python 3.12)

**Decision:** FastAPI async — consensus across all 3 backend repos.

#### Layer Structure (from DailyWork, best pattern)
```
backend/
├── app/
│   ├── main.py               # App factory, lifespan, router registration
│   ├── config.py             # pydantic-settings typed config
│   ├── database.py           # Async SQLAlchemy engine + get_db()
│   ├── dependencies.py       # get_current_user, require_role guards
│   │
│   ├── auth/                 # Drop-in auth module (from VCN pattern)
│   │   ├── models.py         # User, RefreshToken, OAuthAccount, Admin
│   │   ├── schemas.py
│   │   ├── dependencies.py   # JWT guard
│   │   ├── redis_client.py   # Upstash Redis for token cache
│   │   └── routers/
│   │       ├── auth.py       # register, login, refresh, logout, me
│   │       └── oauth.py      # OAuth bridge
│   │
│   ├── models/               # SQLAlchemy ORM models per domain
│   │   ├── task.py           # Task + TaskStatus enum (lifecycle)
│   │   ├── user.py
│   │   ├── review.py
│   │   ├── payment.py        # Escrow model (from TaskMarket)
│   │   └── reward.py         # Points + catalog (from VCN)
│   │
│   ├── schemas/              # Pydantic v2 request/response schemas
│   ├── services/             # Business logic layer (from DailyWork)
│   │   ├── auth_service.py
│   │   ├── task_service.py
│   │   ├── payment_service.py
│   │   └── notification_service.py
│   │
│   ├── routers/              # HTTP interface only (thin)
│   │   ├── auth.py
│   │   ├── tasks.py
│   │   ├── users.py
│   │   ├── payments.py
│   │   ├── reviews.py
│   │   ├── media.py
│   │   └── ws.py             # WebSocket endpoints
│   │
│   ├── tasks/                # Celery async tasks (from TaskMarket)
│   │   ├── celery_app.py
│   │   ├── notifications.py
│   │   ├── ml_tasks.py
│   │   └── payment_tasks.py
│   │
│   └── realtime.py           # WebSocket hub + Redis pub/sub (from TaskMarket)
│
├── alembic/                  # Schema migrations (from TaskMarket)
├── tests/
├── Dockerfile
└── docker-compose.yml
```

#### Key Backend Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **ORM** | SQLAlchemy 2.0 async | More control than raw Supabase SDK; Alembic support |
| **Migrations** | Alembic | Production-safe versioned migrations (TaskMarket pattern) |
| **Auth** | Custom JWT (VCN auth module) + optional Supabase OAuth | Proven, portable, Redis-cached refresh tokens |
| **Geo** | PostGIS + `geoalchemy2` | Both DailyWork & TaskMarket validate this approach |
| **Background tasks** | Celery + Redis | Scale beyond `BackgroundTasks` for ML calls, payments |
| **Real-time** | WebSocket + Redis pub/sub fan-out | TaskMarket's `JobChatHub` pattern |
| **Rate limiting** | `slowapi` | DailyWork pattern; auth endpoints stricter limits |
| **Config** | `pydantic-settings` | DailyWork pattern; typed, validated on startup |
| **Media** | Cloudinary (VCN pattern with WebP resize + mock mode) | Simple CDN, mock for local dev |
| **Notifications** | Firebase Admin SDK (FCM) + stale-token cleanup | VCN's proven implementation |
| **API prefix** | `/api/v1` | DailyWork convention |
| **Docs** | Swagger off in production | DailyWork pattern |

---

### 5.3 Frontend: Flutter (Dart)

**Decision:** Flutter — consensus across DailyWork + VCN (both fully implemented).

#### State Management: Riverpod
- DailyWork uses Riverpod (Riverpod 2.x with StateNotifierProvider)
- VCN uses Provider (simpler but less scalable)
- **Recommendation: Riverpod** — more ergonomic for complex state trees, better testing support

#### Architecture (DailyWork pattern — best structured)
```
lib/
├── main.dart                  # ProviderScope, router, theme
├── core/
│   ├── auth/                  # Token storage (flutter_secure_storage)
│   ├── config/                # API base URL config
│   ├── network/               # Dio client + auth interceptor (VCN pattern)
│   ├── router/                # GoRouter (role-aware redirects)
│   ├── theme/                 # AppTheme, AppColors
│   └── utils/
├── models/                    # Dart data classes
├── repositories/
│   ├── abstract/              # Interfaces (testable)
│   └── api/                   # Dio implementations
├── providers/                 # Riverpod providers
└── screens/
    ├── splash/
    ├── auth/
    └── [role_specific_screens]/
```

#### Key Flutter Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State** | Riverpod 2.x | DailyWork pattern; scales to complex multi-role apps |
| **Navigation** | GoRouter | DailyWork pattern; role-aware redirects |
| **HTTP** | Dio + AuthInterceptor | Both DailyWork & VCN; auto-refresh on 401 |
| **Token storage** | `flutter_secure_storage` | VCN + DailyWork consensus |
| **Offline cache** | Hive | DailyWork's stale-data pattern for job/task feed |
| **Maps** | Google Maps Flutter or `flutter_map` (OSM) | DailyWork uses OSM (free), VCN uses Google Maps |
| **Location** | `geolocator` | Both projects |
| **Image pick** | `image_picker` | Both Flutter projects |
| **Push notifications** | Firebase Messaging + `firebase-admin` backend | VCN pattern |
| **Typography** | Google Fonts (Inter) | VCN uses Inter; modern, clean |
| **Image caching** | `cached_network_image` | Both Flutter projects |

---

### 5.4 Database Schema (Synthesised)

```
users                   # Base user table
worker_profiles         # Role extension (if applicable)
employer_profiles       # Role extension
tasks                   # Core task lifecycle (OPEN→IN_PROGRESS→PENDING→COMPLETED)
task_applications       # Worker applies to task
reviews                 # Mutual rating after completion
payments                # Escrow: amount, status, released_at
notifications           # Push notification records
categories              # Task categorisation
rewards                 # Reward catalog (points system)
redemption_requests     # Points → reward redemptions
refresh_tokens          # JWT refresh token rotation
oauth_accounts          # OAuth bridge (GitHub, Google, etc.)
```

**Geo:** `tasks.location` as `GEOGRAPHY(POINT, 4326)` with GIST index; queries via `ST_DWithin`.

**Lifecycle enum for tasks:**
```
OPEN → IN_PROGRESS → PENDING_APPROVAL → COMPLETED
              └──────────────────────→ CANCELLED
```

---

### 5.5 Infrastructure & Deployment

```
Production (from VCN deployment guide + TaskMarket Docker pattern):

User → DuckDNS / Custom Domain
     → AWS EC2 Elastic IP
       → Security Group (22, 80, 443 only)
         → Nginx (TLS termination, rate limiting)
           → Docker Compose (vcn_network bridge)
             ├── FastAPI Backend :8000
             ├── Celery Worker
             ├── Redis :6379
             └── ML Microservice :6969 (optional)
           → PostgreSQL (AWS RDS or Supabase hosted)

External managed services:
  Cloudinary    – image CDN
  Upstash Redis – serverless Redis (refresh token cache)
  Firebase      – FCM push notifications
```

**Development:**
```
docker-compose up --build
  ├── backend (uvicorn --reload)
  ├── db (PostgreSQL + PostGIS)
  ├── redis
  └── ml (optional sidecar)

Flutter: flutter run → points to http://10.0.2.2:8000
Mock modes: USE_MOCK_CLOUD=True, USE_MOCK_NOTIFICATION=True
```

---

## 6. Architecture Gaps to Resolve Before Building

The following decisions need clarification before code is written:

| # | Open Question | Options Seen in Refs |
|---|---------------|---------------------|
| 1 | **What is SAVJ?** What is the app's name, domain, and primary user roles? | Inferred from refs but not confirmed |
| 2 | **Auth method** — Email/password, phone OTP, or OAuth? | DailyWork: OTP; VCN: email+OAuth; EcoConnect: Firebase Auth |
| 3 | **Primary mobile platform** — Android-first Flutter or cross-platform? | DailyWork: Android-first; VCN: Android |
| 4 | **Payments needed?** Real escrow or symbolic points only? | TaskMarket: real escrow; VCN: points only |
| 5 | **ML/AI features?** Is a trash classifier or similar needed? | VCN has ONNX classifier; others don't |
| 6 | **Database hosting** — Supabase managed or self-hosted PostgreSQL (Railway/RDS)? | DailyWork: Supabase; VCN: Railway/RDS |
| 7 | **Real-time requirements** — WebSocket chat needed or push notifications only? | TaskMarket: WebSocket; VCN: FCM only |
| 8 | **Web admin panel?** | VCN backend README lists this as a TODO |

---

## 7. Recommended Technology Decision Matrix

| Layer | Recommended | Adopted From | Notes |
|-------|-------------|--------------|-------|
| **Backend framework** | FastAPI 0.115+ (Python 3.12) | All 3 FastAPI repos | Async, auto-OpenAPI |
| **ORM** | SQLAlchemy 2.0 async | TaskMarket, VCN | Alembic support |
| **Migrations** | Alembic | TaskMarket | Required for production |
| **Auth storage** | JWT (HS256/RS256) + Redis refresh cache | VCN auth module | Portable, not tied to Supabase |
| **Auth provider** | Supabase Auth (OTP) or custom email | DailyWork / VCN | Decide based on UX |
| **Database** | PostgreSQL 15 + PostGIS 3 | DailyWork, TaskMarket | Geo-queries |
| **Cache / sessions** | Redis (Upstash serverless) | VCN, TaskMarket | Refresh tokens + pub/sub |
| **Background tasks** | Celery + Redis | TaskMarket | For ML, notifications, payments |
| **Real-time** | WebSocket + Redis fan-out | TaskMarket | Job/task status updates |
| **Media storage** | Cloudinary + WebP resize | VCN | Mock mode for dev |
| **Push notifications** | Firebase Admin SDK (FCM) | VCN | Stale token cleanup |
| **Mobile framework** | Flutter (Dart 3+) | DailyWork, VCN | |
| **State management** | Riverpod 2.x | DailyWork | Scales better than Provider |
| **Navigation** | GoRouter | DailyWork | Role-aware guards |
| **HTTP client** | Dio + AuthInterceptor | DailyWork, VCN | Auto-refresh on 401 |
| **Offline cache** | Hive | DailyWork | Task feed with stale-data banner |
| **Token storage** | flutter_secure_storage | DailyWork, VCN | Keychain / Keystore |
| **Container** | Docker Compose | TaskMarket, VCN | Dev + prod parity |
| **Reverse proxy** | Nginx + Certbot | VCN | TLS termination, rate limiting |
| **Hosting** | AWS EC2 (backend) + Supabase/RDS (DB) | VCN | Proven deployment |

---

## 8. Summary

The four repositories form a **complementary blueprint** for SAVJ:

- **EcoConnect** → Role-based UX patterns and multi-role navigation
- **DailyWork** → Best backend layered architecture and Riverpod/repository Flutter pattern
- **Task Marketplace** → Best infrastructure (Alembic, Celery, WebSocket, escrow)
- **Volunteer Cleanup Network** → Best complete full-stack example (auth module, gamification, ML, FCM, deployment)

The recommended SAVJ architecture **synthesises the best of all four**:
a **FastAPI + SQLAlchemy + Alembic + PostgreSQL/PostGIS** backend with a **Celery + Redis** task queue and **WebSocket + Redis** real-time layer, served behind **Nginx + Docker on EC2**, with a **Flutter + Riverpod + GoRouter** mobile client and **Cloudinary + Firebase FCM** for media and push notifications.

All open questions have been resolved. See `docs/decisions.md` for every decision log.

---

## 9. Feature Comparison Matrix (§59 Format)

| Feature | Repository | Useful Pattern | SAVJ Adaptation | Copy Code? | License Concern? | Implementation Decision |
|---------|-----------|----------------|-----------------|-----------|-----------------|------------------------|
| FastAPI app factory + lifespan | DailyWork, VCN, TaskMarket | lifespan context manager for DB init | SAVJ own `main.py` | No | DailyWork MIT; others ARR | Implement from scratch |
| Argon2 password hashing | TaskMarket | `passlib.hash.argon2` | `argon2-cffi` directly | No | ARR | Implement from scratch |
| JWT dual-token auth | VCN | 15-min access, 30-day refresh, rotation | Adopted concept | No | ARR | Implement from scratch |
| Redis refresh token cache | VCN, TaskMarket | SHA-256 in Redis, revoke on logout | Adopted concept | No | ARR | Implement from scratch |
| Supabase JWKS JWT | DailyWork | PyJWKClient RS256 | Not using Supabase; own HS256 | No | MIT | Not needed |
| pydantic-settings config | DailyWork | `Settings(BaseSettings)` | Standard library pattern | No | MIT | Use pattern |
| slowapi rate limiting | DailyWork | per-route rate limits | SAVJ auth + task routes | No | MIT | Implement from scratch |
| SQLAlchemy 2.0 async ORM | VCN, TaskMarket | `create_async_engine`, `async_sessionmaker` | Core SAVJ DB layer | No | ARR | Implement from scratch |
| Alembic migrations | TaskMarket | versioned migration files | Required for SAVJ prod | No | ARR | Implement from scratch |
| PostGIS ST_DWithin radius | DailyWork, TaskMarket | geo radius query | Task feed + event check-in | No | DailyWork MIT; TM ARR | Implement from scratch |
| Routers → Services separation | DailyWork | thin routers, logic in services/ | Core SAVJ backend pattern | No | MIT | Implement from scratch |
| Celery + Redis task queue | TaskMarket | celery_app.py + workers | ML, notifications, payments | No | ARR | Implement from scratch |
| WebSocket + Redis pub/sub | TaskMarket | JobChatHub, broadcast_chat | Phase 15 chat upgrade | No | ARR | Implement from scratch (Phase 15) |
| Payment escrow abstraction | TaskMarket | create/authorize/capture/release | SAVJ PaymentService + MockProvider | No | ARR | Implement from scratch |
| Docker Compose multi-service | TaskMarket, VCN | backend, db, redis, minio services | SAVJ docker-compose.yml | No | ARR | Implement from scratch |
| Drop-in auth/ module | VCN | self-contained models/schemas/deps/routers | SAVJ auth/ module (own code) | No | ARR | Implement from scratch |
| Task lifecycle FSM | VCN, TaskMarket | OPEN→IN_PROGRESS→PENDING→COMPLETED | SAVJ: 10 states, FSM-enforced | No | ARR | Implement from scratch |
| GPS proximity check-in | VCN | server-side lat/lon distance validation | SAVJ event check-in | No | ARR | Implement from scratch |
| Background ML (BackgroundTasks) | VCN | fire ML call after post creation | SAVJ: Celery task instead | No | ARR | Implement from scratch with Celery |
| ML microservice sidecar Docker | VCN | ONNX classifier sibling container | SAVJ AI service | No | ARR | Implement from scratch |
| FCM push + stale token cleanup | VCN | notify_user_async, device token pruning | SAVJ NotificationService | No | ARR | Implement from scratch |
| Points + badges server-side only | VCN | never trust client for point award | Core SAVJ security rule | No | ARR | Implement from scratch |
| Gamification points/badges | VCN | points on resolution, badge criteria | SAVJ extends with dual work+civic | No | ARR | Implement from scratch |
| Admin ban check on every request | VCN | is_banned checked in get_current_user | SAVJ auth dependency | No | ARR | Implement from scratch |
| EC2 + Nginx + Docker production | VCN | deployment guide, certbot, duckdns | SAVJ docs/deployment.md reference | No | ARR | Own config, documented pattern |
| Riverpod StateNotifierProvider | DailyWork | AuthNotifier, authProvider | SAVJ Flutter state | No | MIT | Implement from scratch |
| Repository pattern (abstract+API) | DailyWork | ApiAuthRepository interfaces | SAVJ repository layer | No | MIT | Implement from scratch |
| Hive offline cache + stale banner | DailyWork | JobCacheProvider | SAVJ task feed cache | No | MIT | Implement from scratch |
| GoRouter role-aware redirects | DailyWork | redirect guard reads auth state | SAVJ routing | No | MIT | Implement from scratch |
| Dio AuthInterceptor auto-refresh | DailyWork, VCN | intercept 401, refresh, retry | SAVJ Flutter network layer | No | DailyWork MIT; VCN ARR | Implement from scratch |
| flutter_secure_storage | DailyWork, VCN | keychain/keystore token storage | SAVJ Flutter token store | No | DailyWork MIT | Implement from scratch |
| Multi-role tab navigation | EcoConnect | volunteer/, sponsor/ tab groups | SAVJ GoRouter role guards | No | ARR | Implement from scratch |
| Multi-capability user concept | EcoConnect | one Firebase user, multiple roles | SAVJ capabilities model | No | ARR | Implement from scratch |
| MinIO S3-compatible storage | TaskMarket | MINIO_ENDPOINT, same S3 API | SAVJ StorageService + MinIO | No | ARR | Implement from scratch |

**ARR = All Rights Reserved (no LICENSE file found in repository)**
**MIT = MIT License (direct code use requires attribution)**

*Last updated: Phase 2 (Documentation) — all foundational documents created, no application code written.*
