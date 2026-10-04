# SAVJ — Reference Repository Licenses & Attribution

> This document records the license inspection, architectural pattern decisions,
> and attribution requirements for each reference repository used during the
> design of SAVJ. It was produced as required by the SAVJ specification (§ 1).

---

## Policy

1. **Never assume that code can be copied merely because a repository is public.**
2. Before adopting any code pattern: inspect the LICENSE file.
3. If a repository has no LICENSE file, treat it as **All Rights Reserved** by default.
4. When in doubt, implement equivalent functionality from scratch.
5. Preserve required attribution notices where MIT/Apache code is incorporated.
6. Document every decision here.

---

## 1. DailyWork

| Field | Value |
|-------|-------|
| **Repository** | https://github.com/Chainucha/dailywork |
| **Local path** | `dailywork-main/dailywork-main/` |
| **License** | MIT License |
| **Copyright** | Copyright (c) 2026 Chainucha |
| **License file present?** | ✅ Yes — `LICENSE` at repo root |

### MIT License Terms (Summary)
- ✅ Permission to use, copy, modify, merge, distribute, sublicense, sell
- ✅ No royalty or fee required
- ⚠️ Must include copyright notice and license text in all copies or substantial portions

### Patterns Adopted as Architecture References (not direct code copies)

| Pattern | Description | SAVJ Adaptation | Code copied? |
|---------|-------------|-----------------|--------------|
| Layered backend architecture | `routers/` → `services/` → data layer | Adopted for SAVJ API | No — implement from scratch |
| Supabase Auth + JWKS JWT validation | JWT RS256/HS256 fallback, PyJWKClient | SAVJ uses own JWT with bcrypt/Argon2 | No |
| `pydantic-settings` typed config | `Settings(BaseSettings)` pattern | Adopted verbatim pattern | No — standard library usage |
| Riverpod + repository pattern | Flutter `StateNotifierProvider`, abstract repos | Adopted architecture | No — implement from scratch |
| `optional_current_user` guard | Returns `None` instead of 401 for public endpoints | Adopted concept | No |
| Hive offline cache with stale-data banner | `JobCacheProvider` staleness detection | Adapted for task feed | No |
| Phone OTP dev-bypass mode | `DEV_WORKER_PHONE`, `DEV_BYPASS_OTP` | Adopted for SAVJ dev mode | No |
| `slowapi` rate limiting | Per-route rate limits, stricter for `/auth/*` | Adopted | No |
| PostGIS `ST_DWithin` geo-queries | Radius search for nearby jobs | Adopted for task discovery | No |

### Attribution Note
If any MIT-licensed code from this repository is incorporated directly (not just the pattern),
the following attribution must appear in `docs/references.md` and in an `ATTRIBUTIONS` file:

> Portions of SAVJ are inspired by DailyWork by Chainucha, licensed under the MIT License.
> Copyright (c) 2026 Chainucha. See `docs/references.md` for details.

---

## 2. Volunteer Cleanup Network (VCN)

| Field | Value |
|-------|-------|
| **Repository** | https://github.com/adityamoolya/volunteer-cleanup-network |
| **Local path** | `volunteer-cleanup-network-main/volunteer-cleanup-network-main/` |
| **License** | ⚠️ **No LICENSE file found** |
| **License file present?** | ❌ No |

### Decision
Because no LICENSE file is present, the repository is treated as **All Rights Reserved** under
copyright law. No code may be directly copied.

Architectural patterns (ideas, structures, API shapes) are not copyrightable and may be
studied and used as inspiration. Only the literal expression of code is protected.

### Patterns Used as Inspiration Only (no code copied)

| Pattern | Description | SAVJ Adaptation |
|---------|-------------|-----------------|
| Self-contained `auth/` module | Drop-in: `models.py`, `schemas.py`, `dependencies.py`, `routers/`, `utils/` | SAVJ implements its own auth module with same principle |
| Dual-token auth flow | JWT 15-min access + 30-day rotating refresh; Redis-cached; SHA-256 hash in DB | SAVJ implements independently |
| Dio AuthInterceptor | Auto-refresh on 401, force-logout stream | SAVJ implements independently in Flutter |
| ML microservice sidecar | ONNX classifier as separate Docker container reachable over Docker bridge | SAVJ AI service uses same Docker pattern |
| Background ML classification | `BackgroundTasks` fires ML call after post creation | SAVJ adapts with Celery task |
| Volunteer task lifecycle state machine | `OPEN → IN_PROGRESS → PENDING_APPROVAL → COMPLETED` | SAVJ extends to 10 states |
| GPS proximity check-in | Server-side lat/lon validation against event coordinates | SAVJ adopts server-side validation principle |
| Points + badges server-side | Achievement calculation is never trusted from client | SAVJ rule: server awards all points/badges |
| Admin ban system | `is_banned` flag checked on every authenticated request | SAVJ adopts |
| Firebase FCM + stale-token cleanup | `notify_user_async()` removes dead FCM tokens | SAVJ implements independently |
| Before/after photo evidence workflow | Phase 1: author photo; Phase 2: volunteer before; Phase 3: after + proof | SAVJ adapts for community events |
| Production deployment pattern | EC2 + Nginx + Certbot + Docker Compose + DuckDNS | SAVJ `docs/deployment.md` references this pattern |

---

## 3. EcoConnect

| Field | Value |
|-------|-------|
| **Repository** | https://github.com/Kaleshi26/EcoConnect-App |
| **Local path** | `EcoConnect-App-main/EcoConnect-App-main/` |
| **License** | ⚠️ **No LICENSE file found** |
| **License file present?** | ❌ No |

### Decision
Same as VCN: treat as **All Rights Reserved**. No code copying permitted.

### Patterns Used as Inspiration Only

| Pattern | Description | SAVJ Adaptation |
|---------|-------------|-----------------|
| Role-based Expo Router file-based navigation | Tab groups per role under `volunteer/`, `sponsor/`, `organizer/` | SAVJ Flutter uses GoRouter with role-based redirect guards |
| Multi-capability user concept | One Firebase user, multiple role tabs | SAVJ implements capability model: one account, multiple unlocked capabilities |
| AuthContext stream | Firebase auth listener updates global state | SAVJ Riverpod `authProvider` bootstraps on app start |
| CurrencyContext | Formatting + conversion provider | SAVJ uses locale-specific INR formatting utility |
| NotificationContext | User preferences stored in Firestore | SAVJ stores notification preferences per user in PostgreSQL |
| Role-specific dashboard routing | After login, redirect to role-specific home | SAVJ GoRouter redirect reads `user.primaryRole` |

---

## 4. Task Marketplace API

| Field | Value |
|-------|-------|
| **Repository** | https://github.com/Gotodataru/task-marketplace-api |
| **Local path** | `task-marketplace-api-main/task-marketplace-api-main/` |
| **License** | ⚠️ **No LICENSE file found** |
| **License file present?** | ❌ No |

### Decision
Treat as **All Rights Reserved**. No code copying permitted.

### Patterns Used as Inspiration Only

| Pattern | Description | SAVJ Adaptation |
|---------|-------------|-----------------|
| SQLAlchemy 2.0 async ORM | `create_async_engine`, `async_sessionmaker`, `async_session` | SAVJ backend uses SQLAlchemy 2.0 independently |
| Alembic migrations | Versioned schema migrations | SAVJ uses Alembic; migration files are original |
| Celery + Redis task queue | `celery_app.py`, `tasks.py` | SAVJ creates own Celery config |
| WebSocket hub + Redis pub/sub | `JobChatHub`, `broadcast_chat`, `start_redis_listener` | SAVJ chat implements independently |
| Argon2 password hashing | `passlib.hash.argon2` | SAVJ uses `argon2-cffi` independently |
| Payment escrow abstraction | `create_payment()`, `capture()`, `release()` interface | SAVJ PaymentService interface mirrors this separation |
| Docker Compose multi-service | `backend`, `db`, `redis`, `minio` services | SAVJ `docker-compose.yml` is independently written |
| MinIO S3-compatible storage | `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY` | SAVJ uses same env var conventions |
| OpenAPI spec exported | `openapi.json` | SAVJ exports OpenAPI similarly |
| `pool_pre_ping=True` | SQLAlchemy connection health check | SAVJ adopts in `engine` config |

---

## 5. Summary Decision Table

| Feature | Reference | Pattern Useful? | SAVJ Action | Code copied? | Legal concern? |
|---------|-----------|----------------|-------------|-------------|---------------|
| FastAPI app factory | DailyWork + VCN + TaskMarket | ✅ Yes | Implement from scratch | ❌ No | None |
| JWT dual-token auth | VCN (All Rights Reserved) | ✅ Yes | Implement from scratch | ❌ No | None |
| Supabase Auth JWKS | DailyWork (MIT) | ✅ Yes | Not using Supabase; own JWT | ❌ No | None |
| Riverpod state | DailyWork (MIT) | ✅ Yes | Implement from scratch | ❌ No | None |
| GoRouter role guards | DailyWork (MIT) | ✅ Yes | Implement from scratch | ❌ No | None |
| PostGIS radius query | DailyWork + TaskMarket | ✅ Yes | Implement from scratch | ❌ No | None |
| Task lifecycle FSM | VCN + TaskMarket | ✅ Yes | Implement from scratch (10 states) | ❌ No | None |
| GPS check-in verification | VCN (All Rights Reserved) | ✅ Yes | Implement from scratch | ❌ No | None |
| ML sidecar Docker service | VCN (All Rights Reserved) | ✅ Yes | Independent implementation | ❌ No | None |
| Celery + Redis queue | TaskMarket (All Rights Reserved) | ✅ Yes | Implement from scratch | ❌ No | None |
| SQLAlchemy 2.0 + Alembic | TaskMarket (All Rights Reserved) | ✅ Yes | Implement from scratch | ❌ No | None |
| Gamification points/badges | VCN (All Rights Reserved) | ✅ Yes | Implement from scratch | ❌ No | None |
| Admin ban/moderation | VCN (All Rights Reserved) | ✅ Yes | Implement from scratch | ❌ No | None |
| WebSocket + Redis pub/sub | TaskMarket (All Rights Reserved) | ✅ Yes | Implement from scratch | ❌ No | None |
| Role-based nav (multi-role) | EcoConnect (All Rights Reserved) | ✅ Yes | Implement from scratch | ❌ No | None |
| Payment abstraction layer | TaskMarket (All Rights Reserved) | ✅ Yes | Interface inspired by, not copied | ❌ No | None |
| Drop-in auth module | VCN (All Rights Reserved) | ✅ Yes | Implement from scratch | ❌ No | None |

---

## 6. Attribution File Requirement

If any MIT-licensed code from DailyWork is incorporated (directly, not just the pattern),
the file `ATTRIBUTIONS.md` at the project root must include:

```
SAVJ Attributions

DailyWork (MIT License)
Copyright (c) 2026 Chainucha
https://github.com/Chainucha/dailywork
Used as: [describe specific code used]
```

**Current status:** No direct code has been copied. Attribution file not yet required.
This document must be updated if direct inclusion occurs in later phases.

---

*Last updated: Phase 1 (Documentation) — before any application code was written.*
