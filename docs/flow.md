# SAVJ — User Flow Documentation

> All user journeys in SAVJ. This document defines the complete expected behavior
> for every primary workflow. Screens are referenced by their logical name;
> implementation is in the mobile and web apps.

---

## SECTION A — AUTHENTICATION FLOWS

---

### A1. Registration

```
Splash Screen
  └─ First-time user (no stored token)
       └─ Onboarding Screen (3 slides: Earn / Contribute / One Identity)
            └─ "Get Started" → Register Screen

Register Screen
  ├─ Enter: Full Name
  ├─ Enter: Email
  ├─ Enter: Password (strength indicator)
  ├─ Enter: Confirm Password
  ├─ Enter: Phone (optional in MVP)
  ├─ Accept: Terms and Privacy Policy
  └─ Tap: Register

  → API: POST /api/v1/auth/register
  → Server:
      ├─ Validate inputs (Pydantic)
      ├─ Check email not already registered
      ├─ Hash password with Argon2id
      ├─ Create user row (id, email, name, phone, created_at)
      ├─ Assign default capability: customer
      ├─ Send verification email (or skip in dev mode)
      └─ Return: { access_token, refresh_token, user }

  → Navigate: Home Screen (as Customer)
```

---

### A2. Login

```
Login Screen
  ├─ Enter: Email
  ├─ Enter: Password
  └─ Tap: Login

  → API: POST /api/v1/auth/login
  → Server:
      ├─ Look up user by email
      ├─ Verify Argon2 hash
      ├─ Check account not suspended/banned
      ├─ Issue access token (15 min)
      ├─ Issue refresh token (30 days, hashed, stored in Redis + DB)
      └─ Return: { access_token, refresh_token, user, capabilities[] }

  → Store tokens in flutter_secure_storage / localStorage
  → Navigate: Home Screen (role-aware redirect)
```

---

### A3. Token Refresh (Automatic)

```
Any API call returns 401
  └─ Dio AuthInterceptor intercepts
       └─ POST /api/v1/auth/refresh { refresh_token }
            ├─ Server validates hash vs Redis + DB
            ├─ Issues new access token
            ├─ Rotates refresh token (old revoked)
            └─ Returns: { access_token, refresh_token }

  ├─ On success: retry original request with new access token
  └─ On failure (refresh also invalid):
       └─ Broadcast force-logout → navigate to Login Screen
```

---

### A4. Logout

```
Profile Screen → "Logout"
  → API: POST /api/v1/auth/logout { refresh_token }
  → Server:
      ├─ Delete Redis key for refresh token
      └─ Mark refresh token revoked in DB

  → Clear flutter_secure_storage
  → Navigate: Login Screen
```

---

### A5. Forgot Password

```
Login Screen → "Forgot Password?"
  └─ Forgot Password Screen
       └─ Enter email
            → API: POST /api/v1/auth/forgot-password
            → Server: send reset email with signed link
            → Show: "Check your email"

  ─── User clicks link in email ───

  Reset Password Screen
  ├─ Enter new password
  ├─ Confirm new password
  └─ Tap: Reset

  → API: POST /api/v1/auth/reset-password { token, new_password }
  → Server: validate token, update hash, invalidate all refresh tokens
  → Navigate: Login Screen
```

---

## SECTION B — PROFILE FLOWS

---

### B1. View Own Profile

```
Bottom Nav → Profile
  → Load: GET /api/v1/users/me
  → Display:
      ┌─────────────────────────────┐
      │  [Avatar]  Name             │
      │  Bio  •  Location           │
      │                             │
      │  WORK REPUTATION            │
      │  ★ 4.8  │  12 tasks  │ 96% │
      │                             │
      │  CIVIC IMPACT               │
      │  37 hrs  │ 15 drives        │
      │  847 pts │ 12 badges        │
      │                             │
      │  [Badges]  [Timeline]       │
      └─────────────────────────────┘
```

---

### B2. Unlock Worker Capability

```
Profile → "Become a Worker" (if not already worker)
  └─ Worker Profile Setup Screen
       ├─ Enter: Skills (multi-select + custom)
       ├─ Enter: Categories (what kind of tasks)
       ├─ Enter: Service area radius (1-20 km)
       ├─ Upload: Portfolio photos (optional)
       └─ Tap: Save

  → API: POST /api/v1/workers/profile
  → Server:
      ├─ Create worker_profiles row
      ├─ Add WORKER to user capabilities
      └─ Return: worker profile

  → Profile now shows Worker Dashboard option
  → Worker appears in search results
```

---

### B3. Apply for Organizer Capability

```
Community → "Become an Organizer"
  └─ Organizer Application Screen
       ├─ Enter: Organization/group name
       ├─ Enter: Description
       ├─ Enter: Past events or experience
       └─ Tap: Submit Application

  → API: POST /api/v1/organizers/apply
  → Server: create organizer_profiles row with status=PENDING
  → Admin review required (see Admin Flow G1)
  → Notify user when approved/rejected
```

---

## SECTION C — PAID TASK MARKETPLACE (CUSTOMER FLOWS)

---

### C1. Create Task (Photo-First)

```
Home → "+ Post a Task" button (primary CTA)
  └─ Task Creation — STEP 1
       ┌────────────────────────────────────┐
       │  "Show us what needs to be done."  │
       │                                    │
       │  [📷 Take Photo]  [🖼 Upload]       │
       └────────────────────────────────────┘

STEP 1: Photo
  ├─ Take photo with camera
  ├─ Or select from gallery
  ├─ Multiple photos supported (max 5)
  └─ → Upload to object storage
       → API: POST /api/v1/ai/classify { image_urls }
            → AI Service analyzes photos
            → Returns: { category, objects, complexity, price_range, confidence }

STEP 2: AI Suggestions (clearly labeled)
  ┌────────────────────────────────────┐
  │  📸 AI Analysis (suggestion only)  │
  │                                    │
  │  Suggested category:               │
  │  🏷 Backyard Cleaning              │
  │                                    │
  │  Detected objects:                 │
  │  • leaves • plastic • grass        │
  │                                    │
  │  Complexity: Medium                │
  │                                    │
  │  Suggested price range:            │
  │  ₹150 – ₹300                       │
  │                                    │
  │  [Use this] [Change category]      │
  └────────────────────────────────────┘

STEP 3: Description
  ├─ Title (auto-filled from AI, editable)
  ├─ Description (free text, min 20 chars)
  └─ AI cannot write description automatically (user always writes it)

STEP 4: Category
  ├─ Pre-selected by AI (editable)
  └─ Dropdown with all categories

STEP 5: Budget
  ├─ Enter amount in ₹ (INR)
  ├─ Show AI suggested range as reference
  └─ User sets final price (not AI)

STEP 6: Location
  ├─ Use current location
  ├─ Or pin on map
  └─ Set visibility radius (1–20 km, default 5 km)

STEP 7: Additional Details (optional but encouraged)
  ├─ Preferred date
  ├─ Preferred time
  ├─ Estimated duration
  ├─ Urgency (Normal / Urgent / Very Urgent)
  └─ Safety notes

STEP 8: Review & Publish
  ├─ Show all task details
  └─ Tap: Publish

  → API: POST /api/v1/tasks
  → Server:
      ├─ Validate all fields
      ├─ Verify image URLs belong to this user
      ├─ Store task with status=OPEN
      ├─ Create task_status_history entry
      └─ Return: task

  → Navigate: Task Detail Screen (own task)
  → Workers within radius are notified
```

---

### C2. View My Tasks (Customer)

```
Home → "My Tasks" tab
  → GET /api/v1/tasks/mine?role=customer
  → List of tasks with status badges
  → Tap any task → Task Detail Screen
```

---

### C3. View & Accept Applications

```
Task Detail Screen → "Applications" tab
  → GET /api/v1/tasks/{id}/applications
  → List of worker applications showing:
      ├─ Worker name and photo
      ├─ Worker rating and task count
      ├─ Worker skills
      └─ Application note

  For each applicant:
  → Tap: "View Profile" → Worker Public Profile
  → Tap: "Accept"

  → API: POST /api/v1/applications/{id}/accept
  → Server:
      ├─ Change application status: ACCEPTED
      ├─ Change all other applications for this task: REJECTED
      ├─ Change task status: DRAFT → MATCHED
      ├─ Create task_assignments row
      ├─ Notify accepted worker
      ├─ Notify rejected workers
      └─ Return: updated task
```

---

### C4. Approve Completion

```
Task Detail Screen (status = SUBMITTED_FOR_REVIEW)
  ├─ View worker's completion photos
  ├─ View worker's notes
  ├─ Optional: Open task chat with worker
  └─ Choose action:

  [✓ Approve] → API: POST /api/v1/tasks/{id}/approve
      → Server:
          ├─ Change task status: COMPLETED
          ├─ Trigger mock payment: release ₹amount to worker
          ├─ Create payment_transactions entry
          ├─ Notify worker (payment released)
          └─ Prompt customer to rate worker

  [⚠ Dispute] → API: POST /api/v1/tasks/{id}/dispute
      → Create dispute record
      → Status: DISPUTED
      → Admin notified

Review Modal:
  ├─ Star rating (1-5)
  ├─ Optional written review
  └─ Tap: Submit → POST /api/v1/reviews
```

---

## SECTION D — PAID TASK MARKETPLACE (WORKER FLOWS)

---

### D1. Browse Nearby Tasks

```
Worker Dashboard → "Find Work" tab
  ← GET /api/v1/tasks?lat=X&lon=Y&radius=5&status=OPEN
  → Filter options:
      ├─ Distance (1-20 km slider)
      ├─ Category (multi-select)
      ├─ Budget (min-max range)
      ├─ Date (today/this week/any)
      └─ Urgency

  → List of Task Cards:
      ┌────────────────────────────────┐
      │ [Photo]  BACKYARD CLEANING     │
      │          📍 1.8 km away        │
      │          ₹200  •  Today        │
      │          ⭐ Customer 4.7        │
      │          [View Task]           │
      └────────────────────────────────┘
```

---

### D2. Apply for Task

```
Task Detail Screen
  ├─ View all task photos
  ├─ Read description
  ├─ See budget, location, date, urgency
  ├─ See customer rating and posted tasks count
  └─ Tap: "Apply"

  Apply Modal:
  ├─ Optional: add a note to customer
  └─ Tap: Confirm Application

  → API: POST /api/v1/tasks/{id}/apply
  → Server:
      ├─ Check worker has WORKER capability
      ├─ Check not already applied
      ├─ Check task status is OPEN
      ├─ Create task_applications row (status=PENDING)
      ├─ Notify customer
      └─ Return: application

  → Button becomes "Application Sent"
```

---

### D3. Start Task

```
Worker Dashboard → My Applications → Accepted
  → Task Detail Screen (status = MATCHED)
  → Tap: "Start Task"

  → API: POST /api/v1/tasks/{id}/start
  → Server:
      ├─ Change task status: MATCHED → IN_PROGRESS
      ├─ Record started_at timestamp
      ├─ Notify customer
      └─ Return: updated task
```

---

### D4. Submit Completion Proof

```
Task Detail Screen (status = IN_PROGRESS)
  → Tap: "Mark as Complete"

  Proof Upload Screen:
  ├─ Take/upload completion photos (min 1)
  ├─ Enter notes (optional)
  └─ Tap: Submit Proof

  → Upload photos → object storage
  → API: POST /api/v1/tasks/{id}/submit-proof
  → Server:
      ├─ Change task status: IN_PROGRESS → SUBMITTED_FOR_REVIEW
      ├─ Create task_completion_evidence record
      ├─ Notify customer to review
      └─ Return: updated task
```

---

### D5. Post-Completion Rating

```
After task COMPLETED:
  → Rating Prompt (shown to worker)
  ├─ Rate customer (1-5 stars)
  ├─ Optional review text
  └─ Submit → POST /api/v1/reviews
```

---

## SECTION E — COMMUNITY DRIVE FLOWS (ORGANIZER)

---

### E1. Create Community Event

```
Community Tab → "+ Create Drive" (only if ORGANIZER capability)
  └─ Create Event Screen

  STEP 1: Basic Info
  ├─ Title
  ├─ Type (Lake Cleaning / Park Cleaning / Plantation / etc.)
  ├─ Description
  └─ Cover Image

  STEP 2: Location & Time
  ├─ Event location (pin on map)
  ├─ Meeting point description
  ├─ Date
  ├─ Start time
  └─ End time

  STEP 3: Capacity & Requirements
  ├─ Max volunteers
  ├─ Min required volunteers
  ├─ Instructions for volunteers
  ├─ Safety information
  └─ What to bring

  STEP 4: Impact Targets
  ├─ Expected waste collected (kg)
  ├─ Expected trees planted
  └─ Other impact metrics

  STEP 5: Verification Setup
  ├─ Enable GPS check-in
  ├─ Set GPS check-in radius (default 100m)
  ├─ Generate QR code (server-generated)
  └─ Enable photo evidence requirement

  STEP 6: Review & Submit

  → API: POST /api/v1/community/events
  → Server:
      ├─ Validate all fields
      ├─ Create event with status=PENDING_APPROVAL
      ├─ Generate unique QR code for this event
      ├─ Notify admins for review
      └─ Return: event (with PENDING_APPROVAL status)

  → "Your event has been submitted for review."
```

---

### E2. Track Event Participants

```
My Events Screen → Tap Event
  → Event Management Screen
  ├─ Current participants list
  ├─ Check-in status for each volunteer
  ├─ View evidence uploads
  └─ Tap: "Verify participation" for each volunteer
       → POST /api/v1/community/events/{id}/participants/{uid}/verify
       → Server awards points after verification
```

---

## SECTION F — COMMUNITY DRIVE FLOWS (VOLUNTEER)

---

### F1. Browse Events

```
Community Tab → Events Feed
  ← GET /api/v1/community/events?lat=X&lon=Y&radius=20&status=OPEN
  → Filter: category, date, distance

  Event Card:
  ┌────────────────────────────────────┐
  │ [Image]  LAKE CLEANUP DRIVE        │
  │          📅 Saturday, 8:00 AM      │
  │          📍 Local Lake • 3.2 km    │
  │          👥 42 / 60 volunteers     │
  │          🎯 100 kg waste removal   │
  │          [Join Drive]              │
  └────────────────────────────────────┘
```

---

### F2. Join Event

```
Event Detail Screen
  ├─ Full event description
  ├─ Map with event location
  ├─ Organizer profile link
  ├─ Participant count
  └─ Tap: "Join This Drive"

  → API: POST /api/v1/community/events/{id}/join
  → Server:
      ├─ Check event is OPEN and not full
      ├─ Create event_participants row (status=REGISTERED)
      ├─ Notify volunteer (confirmation + event details)
      └─ Return: participant record

  → Button becomes "You're Registered ✓"
  → Event appears in volunteer's "My Events"
```

---

### F3. Event Day Check-In (GPS)

```
Event Day → My Events → Tap Active Event
  → Event Check-In Screen

  [Check In with GPS]
  → Request location permission
  → Get current lat/lon/accuracy from device

  → API: POST /api/v1/community/events/{id}/checkin
      Body: { lat, lon, accuracy, method: "GPS" }

  → Server:
      ├─ Calculate distance from event location
      ├─ If distance > allowed_radius (100m): REJECT
      │    Response: { success: false, error: "TOO_FAR_FROM_EVENT" }
      ├─ If distance ≤ allowed_radius: ACCEPT
      │    ├─ Create event_checkins row
      │    ├─ Store: volunteer_id, event_id, lat, lon, accuracy,
      │    │         check_in_time, method=GPS
      │    ├─ Update participant status: CHECKED_IN
      │    └─ Return: { success: true, check_in_time }
      └─ Note: exact coordinates are NOT returned to other users

  → Show: "You're checked in! ✓ 9:02 AM"
  → "Check Out" button becomes active
```

---

### F4. Event Day Check-In (QR)

```
Event Check-In Screen → [Scan QR Code]
  → Open QR scanner
  → Scan organizer's QR code (shown at event)

  → Decode QR: contains event_id + time_window + hmac_signature
  → API: POST /api/v1/community/events/{id}/checkin
      Body: { qr_token: "...", method: "QR" }

  → Server:
      ├─ Validate HMAC signature of QR token
      ├─ Validate time window (QR valid for event day only)
      ├─ Record check-in
      └─ Return: { success: true, check_in_time }
```

---

### F5. Upload Evidence

```
Active Event Screen → "Upload Evidence"
  → Camera/gallery → photos during cleanup
  → Optional caption per photo

  → Upload to object storage
  → API: POST /api/v1/community/events/{id}/evidence
      Body: { image_urls, caption, type: "during_cleanup" }
  → Server: create event_evidence records
```

---

### F6. Check Out

```
Event Screen → [Check Out]
  → API: POST /api/v1/community/events/{id}/checkout
  → Server:
      ├─ Record check_out_time
      ├─ Calculate duration = check_out_time - check_in_time (in minutes)
      ├─ Update participant: status = CHECKED_OUT, hours = duration/60
      └─ Return: { check_out_time, duration_minutes, provisional_points }

  → Show: "Thank you! Duration: 2h 45m"
  → Points shown as "Pending organizer verification"
```

---

### F7. Points Award (After Organizer Verification)

```
[After organizer verifies participation]

Server:
  ├─ Calculate civic_points = base_points + duration_factor
  ├─ Calculate env_points (varies by event type)
  ├─ Update impact_records
  ├─ Recalculate badge progress for user
  ├─ Award any newly unlocked badges
  ├─ Notify volunteer: "You earned X points + [badge name] 🏅"
  └─ Update volunteer profile stats

Volunteer Profile:
  CIVIC IMPACT
  +3 volunteer hours
  +75 civic points
  +25 env points
  🏅 "First Step" badge unlocked!
```

---

## SECTION G — ADMIN FLOWS

---

### G1. Admin Login

```
/admin/login (web only)
  ├─ Enter email (admin only accounts)
  ├─ Enter password
  └─ Login

  → API: POST /api/v1/auth/admin/login
  → Server:
      ├─ Verify credentials
      ├─ Verify user has ADMIN or MODERATOR role
      ├─ If normal user attempts: return 403
      └─ Return: { access_token, refresh_token, admin_user }

  → Navigate: Admin Dashboard
```

---

### G2. Approve Community Event

```
Admin Dashboard → Community Events → Pending
  → View event details
  → Review organizer info
  → Tap: Approve or Reject

  [Approve]
  → API: POST /api/v1/admin/events/{id}/approve
  → Server:
      ├─ Change event status: PENDING_APPROVAL → OPEN
      ├─ Create audit_log entry
      └─ Notify organizer

  [Reject]
  → Reason field required
  → API: POST /api/v1/admin/events/{id}/reject { reason }
  → Notify organizer with reason
```

---

### G3. Approve Organizer Application

```
Admin Dashboard → Organizers → Pending
  → View application details
  → [Approve] or [Reject with reason]

  [Approve]
  → Server:
      ├─ Set organizer_profiles.status = APPROVED
      ├─ Add ORGANIZER to user capabilities
      ├─ Create audit_log entry
      └─ Notify user
```

---

### G4. Moderate Reported Content

```
Admin Dashboard → Moderation Queue
  → View reports (task / review / image / user)
  → Tap report → View full context

  Actions:
  [Warn User] → Send warning notification + audit log
  [Remove Content] → Soft-delete + notify user + audit log
  [Suspend User] → Set suspended_until date + notify + audit log
  [Ban User] → Set is_banned=true + notify + audit log
  [Dismiss Report] → Mark report resolved + audit log
```

---

## SECTION H — NOTIFICATION FLOWS

```
Trigger                              → Notification to
────────────────────────────────────────────────────────
Worker applies to task               → Customer
Customer accepts application         → Worker (accepted)
Customer rejects application         → Worker (rejected)
Worker starts task                   → Customer
Worker submits proof                 → Customer
Customer approves / payment releases → Worker
New review received                  → Reviewed user
Event admin-approved                 → Organizer
Event registration confirmed         → Volunteer
GPS check-in successful              → Volunteer
Badge earned                         → User
Admin warning issued                 → User
Admin message                        → User
Dispute opened                       → Admin + other party
```

---

## SECTION I — SEARCH FLOWS

---

### I1. Task Search

```
Search Screen (tasks)
  ├─ Keyword search
  ├─ Category filter (chips)
  ├─ Distance slider (1-20 km)
  ├─ Budget range (₹0–₹5000)
  ├─ Date filter
  └─ Urgency filter

  → GET /api/v1/tasks/search?q=...&category=...&radius=...
  → Paginated results (20 per page)
  → Infinite scroll / load more
```

---

### I2. Event Search

```
Community Search
  ├─ Keyword
  ├─ Event type
  ├─ Distance
  ├─ Date
  └─ Organizer rating

  → GET /api/v1/community/events/search
```

---

## SECTION J — COMPLETE ACCEPTANCE TEST FLOW

> This is the primary end-to-end test defined in the SAVJ specification.

```
USER A (Customer + Volunteer) ─────────────────────────────

[1] Register → Login → Profile
[2] Create Task:
    Photo: backyard.jpg
    AI suggests: Backyard Cleaning / ₹150–₹300
    User confirms: Backyard Cleaning / ₹200
    Description: "Remove leaves and plastic waste."
    Location: current location
    Publish → status: OPEN

USER B (Worker + Volunteer) ────────────────────────────────

[3] Register → Complete Worker Profile
[4] Browse Nearby Tasks → See "Backyard Cleaning ₹200 1.8km"
[5] Open task → View photos → Apply (optional note)

USER A ─────────────────────────────────────────────────────

[6] Notification: "New application"
[7] View applications → View User B's profile
[8] Accept User B → status: MATCHED → Notify User B

USER B ─────────────────────────────────────────────────────

[9] Notification: "Application accepted"
[10] Task Detail → "Start Task" → status: IN_PROGRESS
[11] Complete work → "Mark as Complete"
[12] Upload completion photo + note
     → status: SUBMITTED_FOR_REVIEW
     → Notify User A

USER A ─────────────────────────────────────────────────────

[13] Notification: "Proof submitted for review"
[14] View completion photos and notes
[15] Approve → status: COMPLETED
     → Mock payment: ₹200 released to User B
     → Notify User B
[16] Rate User B: ★ 4 + "Good work"

USER B ─────────────────────────────────────────────────────

[17] Notification: "Payment received: ₹200"
[18] Rate User A: ★ 5 + "Great customer"
[19] Work Reputation updates:
     - Completed tasks: 1
     - Earnings: ₹200
     - Rating: 4.0 ★

USER B (Community Drive) ───────────────────────────────────

[20] Community Tab → Browse Events
[21] Find: "LAKE CLEANUP DRIVE"
     Saturday 8 AM, 3.2 km away, 42/60 volunteers
[22] Join Drive → Registered

On Event Day:

[23] Check In → GPS: within 100m → ✓ Checked in 8:03 AM
[24] Participate → Upload evidence photos
[25] Check Out → 10:48 AM → Duration: 2h 45m

ORGANIZER ─────────────────────────────────────────────────

[26] View participants → Verify User B's participation

SERVER (automatic after verification) ─────────────────────

[27] Award:
     + 3 volunteer hours (165 min → ~2.75 hrs, rounded to 3)
     + 75 civic points
     + 25 environmental points
     → Check badge criteria

[28] Badge "FIRST STEP" unlocked (first community event)
     → Notify User B

USER B PROFILE ─────────────────────────────────────────────

WORK REPUTATION
★ 4.0  │  1 completed task  │  ₹200 earned  │  100% rate

CIVIC IMPACT
3 volunteer hours  │  1 cleanup drive
100 points  │  1 badge (🏅 First Step)

─────────────────────────────────────────────────────────────
✅ ACCEPTANCE TEST COMPLETE
─────────────────────────────────────────────────────────────
```
