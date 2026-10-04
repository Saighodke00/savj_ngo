# SAVJ — Product Requirements Document (PRD)

> **Version:** 1.0 — MVP
> **Status:** Approved for implementation
> **Classification:** Internal

---

## 1. Problem Statement

India's informal local economy runs on word-of-mouth and trust networks. Someone who needs their backyard cleaned, groceries picked up, or furniture assembled has no reliable way to find a trusted nearby person quickly — and the nearby person with time and skills has no structured way to find paid micro-work.

Simultaneously, cities across India face environmental degradation — dirty lakes, littered parks, dying trees — while civic-minded people who want to help have no coordinated, verifiable, rewarding way to contribute.

**SAVJ solves both problems on one platform:**
- A structured local marketplace for small paid tasks
- A verified community participation system for civic and environmental drives

What makes SAVJ different: **both contributions — earning money through tasks and building community through volunteering — build one unified reputation profile**.

---

## 2. Product Positioning

> "A hyperlocal platform where people can earn through local tasks and build verified community impact through civic and environmental participation."

SAVJ is NOT simply a gig app. It is NOT simply a volunteer management tool.

SAVJ is a **dual-mode contribution platform** that gives every user one identity with two dimensions:

| Dimension | Mode | Measures |
|-----------|------|---------|
| **EARN** | Paid task marketplace | Money earned, task rating, completion rate |
| **CONTRIBUTE** | Community drives | Volunteer hours, civic points, badges, impact |

---

## 3. Target Users

### Primary Users (Public Platform)

| User Type | Who They Are | Primary Need |
|-----------|-------------|--------------|
| **Customer** | Homeowner, professional, busy person needing small local help | Post a task, get it done fast |
| **Worker** | Skilled or semi-skilled local person with time to earn | Find nearby paid work |
| **Volunteer** | Civic-minded person wanting to make a local difference | Find events, build verified impact record |
| **Organizer** | NGO lead, RWA member, civic group admin | Create and manage community drives |

### Secondary Users (Internal Platform)

| User Type | Who They Are |
|-----------|-------------|
| **Admin** | Platform operator, full access |
| **Moderator** | Reviews reported content, enforces rules |
| **Support Staff** | Handles user complaints, disputes |

---

## 4. Value Proposition

### For Customers
- Find trusted nearby help within minutes
- Photo-first task creation — no lengthy forms
- Transparent worker profiles with real ratings
- Safe mock payment (real payment integration ready)

### For Workers
- Discover local paid work by distance and category
- Build a verified work reputation
- Earn civic points alongside task earnings
- Improve community while earning

### For Volunteers
- Verified volunteer hours — not just a self-reported claim
- GPS + QR check-in ensures authenticity
- Gamified badges and medals for sustained participation
- Shareable civic impact profile

### For Organizers
- Structured event creation with admin approval
- Volunteer tracking and verification tools
- Impact reports for drives they organize

---

## 5. Core Features

### 5.1 Task Marketplace
- Photo-first task creation (camera → AI classification → confirm → publish)
- Task discovery with geo-filter (PostGIS radius search)
- Worker application and customer acceptance
- Task lifecycle: DRAFT → OPEN → MATCHED → IN_PROGRESS → SUBMITTED_FOR_REVIEW → COMPLETED
- Completion proof upload (photos + notes)
- Mutual ratings after completion
- Mock payment abstraction (Razorpay-ready architecture)
- Task-scoped chat between customer and accepted worker

### 5.2 Community Drives
- Event types: lake cleaning, park cleaning, plantation, beach/river cleanup, awareness campaigns, community repair
- Admin-approved event publication
- GPS + QR check-in verification (server-side)
- Before/after evidence photos
- Volunteer hour calculation (check-in to check-out)
- Civic points and environmental impact points (server-side calculation)
- Event participation record per volunteer

### 5.3 Unified Identity & Reputation
- One account, multiple capabilities
- Single profile showing WORK REPUTATION and CIVIC IMPACT separately
- Badges, medals, achievements (server-side awarded)
- Leaderboard (community impact)
- Impact timeline

### 5.4 AI Module
- Image-based task classification
- Object detection from task photos
- Category suggestion (clearly labeled as AI suggestion)
- Complexity estimate (Low / Medium / High)
- Suggested price range (user always has final control)
- AI unavailability degrades gracefully — manual entry always available

### 5.5 Admin Dashboard
- Full user/task/event management
- Moderation queue
- Organizer approval workflow
- Category management
- Badge management
- Analytics and reporting
- Audit logs

---

## 6. MVP Scope

The following must be working end-to-end before the project is considered complete:

### ✅ MVP INCLUDED

**Authentication:**
- Email + password registration and login
- JWT access + refresh token
- Password hashing (Argon2)
- Phone number (optional field, not OTP in MVP — decision documented in `decisions.md`)
- Profile creation

**Task Marketplace:**
- Create task with photos, description, budget, category, location
- AI-assisted classification (with graceful fallback)
- Nearby task feed (PostGIS radius)
- Worker application
- Customer acceptance
- Task lifecycle state machine
- Completion proof upload
- Mock payment flow (end-to-end)
- Mutual ratings

**Community Drives:**
- Create event (organizer → admin approval required)
- Event discovery feed
- Join event
- GPS check-in (server-side validation)
- QR check-in (alternative)
- Evidence photo upload
- Check-out
- Volunteer hours calculation
- Civic and environmental points award
- Badge progression

**Admin Dashboard (web):**
- User management (view, suspend, ban, restore)
- Task management (view, cancel, intervene)
- Community event approval
- Category management
- Basic moderation queue
- Basic analytics dashboard

**Mobile App:**
- All user flows for authentication, task marketplace, and community

**Web App:**
- Landing page + auth + task marketplace + community events

**AI Service:**
- Image classification (YOLO/ONNX or rule-based fallback)
- Category suggestion API
- Price range suggestion API
- Graceful degradation

---

## 7. Out of Scope for MVP

| Feature | Reason |
|---------|--------|
| Real payment gateway (Razorpay) | Architecture ready; not needed for demo |
| Cryptocurrency / blockchain | Out of scope permanently for MVP |
| Video calls | Not needed for use case |
| Public forums / social feed | Scope expansion risk |
| Complex recommendation engine | ML data not yet available |
| Background verification marketplace | Regulatory complexity |
| Real-time video evidence | Storage/bandwidth cost |
| International payments | India-first |
| Subscription plans | Post-MVP monetization |
| Complex accounting system | Not a finance app |
| Autonomous AI pricing | Explicitly prohibited by spec |
| AI chatbot | Not needed |

---

## 8. User Roles & Capabilities Model

SAVJ uses a **capabilities model** rather than mutually exclusive roles.

| Capability | How Acquired | Can Do |
|-----------|-------------|--------|
| **Customer** | Default — any registered user | Post tasks, hire workers |
| **Worker** | Complete worker profile | Apply for tasks, earn money |
| **Volunteer** | Join any community event | Earn volunteer hours, civic points |
| **Organizer** | Apply + admin approval | Create community events |

Internal roles (not customer-facing):

| Role | Notes |
|------|-------|
| **Admin** | Full platform access; separate login at `/admin` |
| **Moderator** | Content moderation; restricted admin access |
| **Support** | User dispute handling; restricted access |

One user can hold multiple capabilities. Example: User A can simultaneously post tasks (customer), work tasks (worker), join drives (volunteer), and create events (organizer if approved).

---

## 9. Functional Requirements

### Authentication
- FR-AUTH-001: Users must be able to register with email + password
- FR-AUTH-002: Passwords must be hashed with Argon2
- FR-AUTH-003: JWT access token expires in 15 minutes
- FR-AUTH-004: Refresh tokens expire in 30 days and rotate on use
- FR-AUTH-005: Refresh tokens are stored as SHA-256 hashes in PostgreSQL and cached in Redis
- FR-AUTH-006: Admin login is separate (`/admin/login`) and inaccessible to normal users
- FR-AUTH-007: RBAC is enforced server-side; client-side role values are never trusted
- FR-AUTH-008: Email verification must be sent on registration

### Task Marketplace
- FR-TASK-001: Customers can create tasks with photos, description, budget, location
- FR-TASK-002: AI classifies uploaded photos and suggests category + price range
- FR-TASK-003: AI suggestions are clearly labeled and user always overrides them
- FR-TASK-004: Tasks appear in worker feeds filtered by server-side geo-query (PostGIS)
- FR-TASK-005: Workers can apply; customers can view and compare applicants
- FR-TASK-006: Customer accepts one worker; other applications are automatically rejected
- FR-TASK-007: Task lifecycle follows the state machine defined in §23 of the spec
- FR-TASK-008: Workers upload completion photo and notes
- FR-TASK-009: Customer approves and mock payment releases
- FR-TASK-010: Both parties rate each other after completion
- FR-TASK-011: Task prices are stored in paise (integer); never floating-point
- FR-TASK-012: Neither customer nor worker can manipulate task status server-side

### Community Drives
- FR-COMM-001: Organizers (approved) can create community events
- FR-COMM-002: Events require admin approval before going public
- FR-COMM-003: Volunteers can browse and join approved events
- FR-COMM-004: Check-in requires GPS proximity validation (server-side, ≤100m)
- FR-COMM-005: QR code is an alternative check-in method
- FR-COMM-006: Volunteer hours are calculated from check-in to check-out timestamps
- FR-COMM-007: Points are awarded server-side; never from client input
- FR-COMM-008: Evidence photos can be uploaded during participation
- FR-COMM-009: Organizer confirms participation before points are finalized
- FR-COMM-010: Exact volunteer GPS coordinates are not exposed publicly

### AI Service
- FR-AI-001: AI service is a separate microservice, not embedded in FastAPI
- FR-AI-002: If AI is unavailable, task creation continues without AI (manual entry)
- FR-AI-003: AI never automatically sets the final price or category
- FR-AI-004: AI confidence is reported alongside suggestions
- FR-AI-005: Low-confidence suggestions are shown with a warning

### Admin
- FR-ADMIN-001: Admin dashboard is accessible only to authenticated admin/moderator users
- FR-ADMIN-002: Every admin action creates an audit log entry
- FR-ADMIN-003: Admins can suspend, ban, or restore users
- FR-ADMIN-004: Admins can approve/reject community events and organizer requests
- FR-ADMIN-005: Admins can manage task categories and badges

---

## 10. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | API response time (p95) | < 500ms for read operations |
| NFR-002 | Task feed pagination | Max 20 tasks per page |
| NFR-003 | Image upload size limit | Max 10 MB per image, resize to WebP |
| NFR-004 | Mobile app cold start | < 3 seconds to interactive |
| NFR-005 | Password hashing | Argon2id, ≥ 2 iterations |
| NFR-006 | Auth rate limiting | Login: 10/min; OTP: 3/min; Registration: 5/min |
| NFR-007 | Task creation rate limiting | 10 tasks/hour per user |
| NFR-008 | Uptime (demo environment) | Best-effort |
| NFR-009 | Offline support | Task feed and profile cached locally (Hive) |
| NFR-010 | Accessibility | WCAG 2.1 AA (web); large tap targets ≥ 48dp (mobile) |

---

## 11. Success Metrics (University CEP)

The following demonstration must work end-to-end:

1. User registers and logs in
2. Creates a task with a real photo, description, budget, and location
3. AI classifies the image and suggests a category
4. A second user (worker) logs in and discovers the task by location
5. Worker applies; customer accepts
6. Worker starts task, uploads proof, marks complete
7. Customer approves; mock payment releases ₹200
8. Both rate each other; work reputation updates
9. Worker joins a community event, GPS check-in succeeds
10. Evidence uploaded; organizer approves
11. Volunteer hours, points, and badge awarded
12. Profile displays WORK REPUTATION and CIVIC IMPACT separately
13. Admin dashboard shows all activity and can moderate

---

## 12. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| AI service unavailable | Medium | Graceful fallback to manual entry |
| GPS spoofing for check-in | Medium | Server-side validation + accuracy field |
| Payment integration complexity | High | Mock payment mode in MVP |
| Fake volunteer participation | Medium | Dual verification (GPS + QR) + evidence |
| Scope creep | High | Strict MVP boundary enforcement |
| Performance under load | Low (demo) | Pagination + indexes + lazy loading |

---

## 13. Assumptions

1. The target environment is India (INR currency, Indian phone number formats)
2. Mobile platform priority: Android-first (Flutter)
3. Students will have access to an Android device or emulator for testing
4. Demo will run on local Docker Compose (no cloud deployment required for university submission)
5. Real payment is not required for university demonstration
6. English is the primary language (multilingual is future scope)
7. The AI service may use a pre-trained ONNX model (YOLOv8n or similar)

---

*Document version 1.0 — frozen before Phase 3 (database + backend) begins.*
