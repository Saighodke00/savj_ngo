# SAVJ — Architecture Decisions Log

> This file records every significant architecture decision made during SAVJ development.
> When an ambiguity in the specification is resolved by a best-judgment call,
> it is documented here. This prevents silent invention of major features.

---

## Decision Format

```
### DEC-NNN: [Short title]
Date: YYYY-MM-DD
Phase: Phase N
Status: DECIDED | PENDING | SUPERSEDED
Context: Why this decision was needed
Options considered: What alternatives were evaluated
Decision: What was chosen
Rationale: Why
Consequences: What this means for future development
```

---

## DEC-001: Auth Method — Email/Password in MVP (Phone OTP deferred)

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The SAVJ spec (§20) says "Email + password OR phone OTP" and leaves the MVP choice open.
DailyWork uses phone OTP via Supabase Auth. VCN uses email + password.

**Options considered:**
1. Phone OTP (requires SMS gateway: Twilio, Fast2SMS, MSG91)
2. Email + password (requires SMTP service only)
3. Both

**Decision:** Email + password for MVP. Phone is an optional field stored for future OTP.

**Rationale:**
- SMS gateways require paid accounts and phone number registration in India
- Phone OTP adds operational complexity for a university demo
- Email + password is sufficient to demonstrate the complete workflow
- Architecture is designed so phone OTP can be added later without changing the auth module

**Consequences:**
- `users.phone` exists in schema but OTP-based login is not implemented in MVP
- `POST /api/v1/auth/send-otp` and `verify-otp` endpoints are stubbed but not active
- Future: add Fast2SMS or Twilio integration to activate OTP

---

## DEC-002: Maps Provider — flutter_map (OpenStreetMap) in MVP

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec says "Use a provider abstraction. Avoid hardcoding map provider logic everywhere."
Google Maps Flutter requires a paid API key (free tier has strict limits).
OpenStreetMap via `flutter_map` is free and API-key-less.

**Options considered:**
1. Google Maps Flutter — best UX, requires API key and billing account
2. flutter_map + OpenStreetMap tiles — free, good enough for demo
3. Mapbox — free tier, requires API key

**Decision:** `flutter_map` with OpenStreetMap tiles for MVP.

**Rationale:**
- No API key required — no billing risk during demo
- `flutter_map` is actively maintained and supports markers, polygons, tile layers
- A `MapService` abstraction is created so Google Maps can be swapped in later
- The spec explicitly says use a provider abstraction

**Consequences:**
- OpenStreetMap tiles may be slightly slower than Google Maps
- No Street View or Google-specific features
- `MapProvider` interface in `core/maps/` allows future provider swap

---

## DEC-003: Push Notifications — Mock Mode in MVP

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
Firebase FCM requires `google-services.json` which contains a real Firebase project key.
For the university demo, all notification logic is implemented but with mock mode.

**Decision:** Implement full `NotificationService` interface. Default `USE_MOCK_NOTIFICATION=true` in dev.

**Rationale:**
- The architecture is complete and can be tested with real FCM by setting `USE_MOCK_NOTIFICATION=false`
- No Firebase billing concern during development
- Mock mode logs notification payloads to console so flows can be verified

**Consequences:**
- In-app notifications (stored in DB, fetched by mobile) work fully even in mock mode
- Push notifications (device wakeup) require real FCM setup for production demo

---

## DEC-004: Payment — Mock Mode Only in MVP

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec (§25) explicitly states: "Initially implement MOCK PAYMENT MODE so the entire workflow can be demonstrated without real money."

**Decision:** `MockPaymentProvider` is the default. `RazorpayProvider` stub created but not wired.

**Rationale:**
- Razorpay requires business registration, RBI compliance, and test credentials
- Mock payment demonstrates the complete escrow flow (create → authorize → capture → release)
- Full audit trail is created even in mock mode

**Consequences:**
- `PAYMENT_MODE=mock` in `.env.example`
- `RazorpayProvider` stub is created with TODO comments for future integration
- All money flows are end-to-end audited even in mock mode

---

## DEC-005: Admin 2FA — Architecture Ready, Not Implemented in MVP

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec (§21) says "2FA-ready architecture" for admin. Implementing full TOTP requires additional libraries and UX.

**Decision:** Admin auth flow includes a `mfa_secret` column and `mfa_enabled` flag but 2FA is not active.

**Rationale:**
- "2FA-ready architecture" means the data model supports it
- Active 2FA implementation is non-trivial to test in a demo environment
- Admin accounts for university demo are created by seed script with strong passwords

**Consequences:**
- `users.mfa_secret` and `users.mfa_enabled` exist in schema
- `POST /api/v1/auth/admin/verify-mfa` endpoint is stubbed
- 2FA can be activated by implementing a TOTP library (pyotp) in a future phase

---

## DEC-006: Google OAuth — Deferred to Post-MVP

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec (§20) says "Support Google OAuth optionally."

**Decision:** OAuth endpoints stubbed but not active. `oauth_accounts` table exists in schema.

**Rationale:**
- Google OAuth requires domain verification and OAuth consent screen approval
- Not needed for core workflow demonstration
- `oauth_accounts` table and `OAuthProvider` abstraction are in place for future

---

## DEC-007: Disputes — Basic Implementation in MVP

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec (§26) requires disputes. Full dispute resolution with partial payments is complex.

**Decision:** Dispute workflow is implemented with status states but financial resolution is manual (admin action in MVP).

**Rationale:**
- A full automated dispute resolution system requires escrow logic and legal compliance
- For MVP: a dispute freezes payment, notifies admin, and admin manually resolves
- The `payments.status = 'DISPUTED'` state and admin override functionality is implemented

---

## DEC-008: Volunteer Hours Rounding Policy

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec doesn't specify how partial volunteer hours are calculated/displayed.

**Decision:** Hours are stored as `NUMERIC(8,2)` (e.g., 2.75 hours). Displayed as "2h 45m" in UI.

**Rationale:**
- Precise decimal hours allow accurate aggregation over time
- Display layer converts to hours + minutes for readability
- "37 volunteer hours" in profile is the sum of all `impact_records.amount` where `record_type = 'VOLUNTEER_HOURS'`

---

## DEC-009: Task Discovery — Show All OPEN Tasks in Radius

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec says workers see nearby tasks. Workers also have a `service_radius_km` preference.

**Decision:** Task feed shows tasks where the task's `visibility_radius_km` circle intersects with the worker's location. Workers can additionally filter by their own preferred radius.

**Rationale:**
- A task posted with 5km radius should be visible to workers within 5km
- Worker's `service_radius_km` is an additional personal filter, not the only filter
- Server filters by task radius, not worker radius (more tasks visible = better UX)

---

## DEC-010: Community Event Approval Timing

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec says events require admin approval before going public. No SLA is specified.

**Decision:** Events remain in `PENDING_APPROVAL` until an admin acts. Admin dashboard shows pending events prominently. No auto-approval.

**Rationale:**
- Preventing fake or harmful events requires human review
- Auto-approval could allow spam or dangerous events
- Admin can approve same-day for demo purposes

**Consequences:**
- Organizers must plan ahead for event creation
- Admin dashboard shows pending event count as a metric

---

## DEC-011: Saved Languages / Multilingual

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
India has 22 official languages. The spec doesn't address multilingual support.

**Decision:** English only in MVP. Schema and UI are not localized. Multilingual is post-MVP.

---

## DEC-012: Worker Identity Verification — Stub Only

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec mentions "identity verification status" for workers. Full KYC is complex.

**Decision:** `worker_profiles.is_identity_verified` flag exists and is displayed on profiles. Actual KYC flow is out of MVP scope.

**Rationale:**
- KYC in India requires Aadhaar/PAN verification, which involves government APIs
- Out of scope for university project
- Flag allows admin to manually mark a test worker as "verified" in the seed data

---

## DEC-013: File Storage Abstraction

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec says "Use object storage abstraction" with MinIO for local dev.

**Decision:** `StorageService` interface with `MinIOProvider` for dev. AWS S3 and Cloudinary can be swapped by changing one config value and implementing the interface.

---

## DEC-014: Chat — WebSocket Optional in MVP

**Date:** 2026-10-01
**Phase:** Phase 2 (Documentation)
**Status:** DECIDED

**Context:**
The spec says "Optional WebSocket real-time messaging." The full WebSocket + Redis fan-out is complex infrastructure.

**Decision:** Chat messages are stored in DB and retrieved via polling (5-second interval) in MVP. WebSocket upgrade is Phase 15 work.

**Rationale:**
- Polling every 5 seconds is sufficient for task-scoped chat (not high-frequency)
- WebSocket requires Redis pub/sub, which adds infrastructure complexity
- The `messages` table and API endpoints are identical whether polling or WebSocket
- `GET /api/v1/messages/task/{task_id}?since={timestamp}` supports efficient polling

**Consequences:**
- Chat is slightly less "real-time" than WebSocket (up to 5-second lag)
- Phase 15 upgrades the same endpoints to WebSocket without changing the data model

---

*Last updated: Phase 2 (Documentation) — 2026-10-01*
*Next update expected after: Phase 3 (Database + Auth)*
