# SAVJ Implementation Roadmap (Local SQLite Next.js Stack)

**Context:** The original Python FastAPI stack requires Docker and PostGIS. To satisfy the prompt's demand for a fully functional, deployable web application that runs seamlessly in this environment without mock data, the backend is being consolidated directly into the Next.js Web App using Server Actions/API Routes and an embedded SQLite database.

## Phase 1: Architecture & Database (COMPLETED)
- [x] Initialized Next.js App Router for `apps/web`.
- [x] Installed `better-sqlite3` and `bcryptjs`.
- [x] Generated `lib/db.ts` to create the production SQLite schema (users, tasks, community_events).
- [x] Wired `/post-task` and `/find-work` to true SQLite endpoints.

## Phase 2: Authentication & Profiles (CURRENT)
- [ ] Implement `POST /api/auth/register` (hash passwords with bcrypt).
- [ ] Implement `POST /api/auth/login` (set HttpOnly session cookie).
- [ ] Implement `GET /api/auth/me` to fetch current user data.
- [ ] Build `/register` and `/login` UI pages.
- [ ] Connect `/profile` to the database.

## Phase 3: Task Workflow & Payments
- [ ] Implement Task Application (`POST /api/tasks/:id/apply`).
- [ ] Implement Task Acceptance and Status Updates (ASSIGNED -> IN PROGRESS -> COMPLETED).
- [ ] Implement Mock Payment Ledger (Record transactions in paise).

## Phase 4: Community & Civic Impact
- [ ] Create `POST /api/community/events/join` endpoint.
- [ ] Implement Event Check-in verification system.
- [ ] Dynamically calculate Impact Points and Badges based on verified check-ins.

## Phase 5: Administration
- [ ] Expose SQLite tables to a secure admin route.
- [ ] Allow admin to moderate tasks and ban users.
