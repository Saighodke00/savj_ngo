# SAVJ — Database Schema

> Complete table definitions, types, constraints, indexes, and relationships.
> All monetary values in INTEGER paise. All PKs are UUID.
> PostGIS extension required. Alembic manages all migrations.

---

## Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "postgis";     -- GEOGRAPHY type, ST_DWithin
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Full-text trigram search
```

---

## 1. USERS & AUTHENTICATION

---

### `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Lowercase stored |
| `phone` | `VARCHAR(20)` | UNIQUE, NULLABLE | E.164 format |
| `password_hash` | `VARCHAR(500)` | NOT NULL | Argon2id |
| `full_name` | `VARCHAR(100)` | NOT NULL | |
| `display_name` | `VARCHAR(50)` | NULLABLE | Short name for display |
| `avatar_url` | `TEXT` | NULLABLE | Object storage URL |
| `bio` | `TEXT` | NULLABLE | Max 500 chars (app-level) |
| `is_verified` | `BOOLEAN` | DEFAULT false | Email/phone verified |
| `is_active` | `BOOLEAN` | DEFAULT true | Soft deactivation |
| `is_banned` | `BOOLEAN` | DEFAULT false | Permanent ban |
| `suspended_until` | `TIMESTAMPTZ` | NULLABLE | Temporary suspension |
| `fcm_token` | `TEXT` | NULLABLE | Firebase push token |
| `fcm_token_updated_at` | `TIMESTAMPTZ` | NULLABLE | For stale-token cleanup |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Auto-update trigger |
| `last_login_at` | `TIMESTAMPTZ` | NULLABLE | |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Soft delete |

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_is_banned ON users(is_banned) WHERE is_banned = true;
```

---

### `user_roles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `role` | `VARCHAR(20)` | NOT NULL | enum: USER, WORKER, VOLUNTEER, ORGANIZER, ADMIN, MODERATOR, SUPPORT |
| `granted_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `granted_by` | `UUID` | FK → users.id, NULLABLE | Admin who granted |

**Constraints:**
```sql
UNIQUE (user_id, role)
CHECK (role IN ('USER','WORKER','VOLUNTEER','ORGANIZER','ADMIN','MODERATOR','SUPPORT'))
```

**Index:** `CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);`

---

### `refresh_tokens`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `token_hash` | `VARCHAR(64)` | NOT NULL | SHA-256 of raw token |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | 30 days from creation |
| `revoked_at` | `TIMESTAMPTZ` | NULLABLE | Set on logout/rotation |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Indexes:**
```sql
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

---

### `oauth_accounts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `provider` | `VARCHAR(30)` | NOT NULL | 'google', 'github' |
| `provider_user_id` | `VARCHAR(100)` | NOT NULL | |
| `access_token` | `TEXT` | NULLABLE | Provider access token |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Constraint:** `UNIQUE(provider, provider_user_id)`

---

### `password_reset_tokens`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `token_hash` | `VARCHAR(64)` | NOT NULL | SHA-256 of email link token |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | 1 hour from creation |
| `used_at` | `TIMESTAMPTZ` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

## 2. PROFILES

---

### `worker_profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE, UNIQUE | |
| `headline` | `VARCHAR(150)` | NULLABLE | e.g., "Expert gardener, 3 yrs exp" |
| `service_radius_km` | `INTEGER` | DEFAULT 5 | How far worker will travel |
| `avg_rating` | `NUMERIC(3,2)` | DEFAULT 0.00 | Cached average, recomputed |
| `total_reviews` | `INTEGER` | DEFAULT 0 | Cached count |
| `completed_tasks` | `INTEGER` | DEFAULT 0 | Cached count |
| `completion_rate` | `NUMERIC(5,2)` | DEFAULT 0.00 | % as decimal (96.50) |
| `response_rate` | `NUMERIC(5,2)` | DEFAULT 0.00 | % responded within 24h |
| `total_earned_paise` | `BIGINT` | DEFAULT 0 | Integer paise |
| `is_identity_verified` | `BOOLEAN` | DEFAULT false | KYC (future) |
| `identity_verified_at` | `TIMESTAMPTZ` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `CREATE INDEX idx_worker_profiles_radius ON worker_profiles(service_radius_km);`

---

### `worker_skills`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `worker_id` | `UUID` | FK → worker_profiles.id ON DELETE CASCADE | |
| `skill` | `VARCHAR(100)` | NOT NULL | Free-text or from preset |
| `category_id` | `UUID` | FK → categories.id, NULLABLE | If mapped to a category |

**Constraint:** `UNIQUE(worker_id, skill)`

---

### `portfolio_photos`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `worker_id` | `UUID` | FK → worker_profiles.id ON DELETE CASCADE | |
| `image_url` | `TEXT` | NOT NULL | |
| `thumbnail_url` | `TEXT` | NULLABLE | |
| `caption` | `VARCHAR(200)` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `volunteer_profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE, UNIQUE | |
| `total_hours` | `NUMERIC(8,2)` | DEFAULT 0 | Calculated in hours |
| `civic_points` | `INTEGER` | DEFAULT 0 | |
| `environmental_points` | `INTEGER` | DEFAULT 0 | |
| `total_drives` | `INTEGER` | DEFAULT 0 | Cached count |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `organizer_profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE, UNIQUE | |
| `organization_name` | `VARCHAR(100)` | NOT NULL | |
| `organization_type` | `VARCHAR(50)` | NULLABLE | NGO, RWA, School, etc. |
| `description` | `TEXT` | NULLABLE | |
| `website` | `VARCHAR(255)` | NULLABLE | |
| `status` | `VARCHAR(20)` | DEFAULT 'PENDING' | PENDING, APPROVED, REJECTED |
| `reviewed_by` | `UUID` | FK → users.id, NULLABLE | Admin who reviewed |
| `reviewed_at` | `TIMESTAMPTZ` | NULLABLE | |
| `rejection_reason` | `TEXT` | NULLABLE | |
| `events_created` | `INTEGER` | DEFAULT 0 | Cached |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Constraint:** `CHECK (status IN ('PENDING','APPROVED','REJECTED','SUSPENDED'))`

---

### `addresses`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `label` | `VARCHAR(50)` | NULLABLE | 'Home', 'Office' |
| `address_line1` | `VARCHAR(200)` | NOT NULL | |
| `address_line2` | `VARCHAR(200)` | NULLABLE | |
| `city` | `VARCHAR(100)` | NOT NULL | |
| `state` | `VARCHAR(100)` | NOT NULL | |
| `pincode` | `VARCHAR(10)` | NOT NULL | |
| `location` | `GEOGRAPHY(POINT, 4326)` | NOT NULL | PostGIS |
| `is_default` | `BOOLEAN` | DEFAULT false | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `CREATE INDEX idx_addresses_location ON addresses USING GIST(location);`

---

## 3. TASK MARKETPLACE

---

### `categories`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | |
| `slug` | `VARCHAR(100)` | NOT NULL, UNIQUE | URL-safe |
| `parent_id` | `UUID` | FK → categories.id, NULLABLE | Sub-categories |
| `description` | `TEXT` | NULLABLE | |
| `icon` | `VARCHAR(50)` | NULLABLE | Icon name |
| `is_active` | `BOOLEAN` | DEFAULT true | |
| `sort_order` | `INTEGER` | DEFAULT 0 | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `tasks`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `customer_id` | `UUID` | FK → users.id ON DELETE RESTRICT | |
| `title` | `VARCHAR(200)` | NOT NULL | |
| `description` | `TEXT` | NOT NULL | Min 20 chars (app-level) |
| `category_id` | `UUID` | FK → categories.id | |
| `budget_paise` | `INTEGER` | NOT NULL | CHECK > 0 |
| `location` | `GEOGRAPHY(POINT, 4326)` | NOT NULL | PostGIS |
| `location_label` | `VARCHAR(200)` | NULLABLE | Human-readable area |
| `visibility_radius_km` | `INTEGER` | DEFAULT 5 | |
| `status` | `VARCHAR(30)` | DEFAULT 'DRAFT' | FSM-controlled |
| `urgency` | `VARCHAR(20)` | DEFAULT 'NORMAL' | NORMAL, URGENT, VERY_URGENT |
| `preferred_date` | `DATE` | NULLABLE | |
| `preferred_time` | `TIME` | NULLABLE | |
| `estimated_duration_minutes` | `INTEGER` | NULLABLE | |
| `instructions` | `TEXT` | NULLABLE | |
| `safety_notes` | `TEXT` | NULLABLE | |
| `ai_suggested_category` | `UUID` | FK → categories.id, NULLABLE | AI suggestion stored |
| `ai_confidence` | `NUMERIC(5,4)` | NULLABLE | 0.0 – 1.0 |
| `ai_suggested_min_paise` | `INTEGER` | NULLABLE | |
| `ai_suggested_max_paise` | `INTEGER` | NULLABLE | |
| `ai_detected_objects` | `JSONB` | NULLABLE | `["leaves","plastic"]` |
| `views_count` | `INTEGER` | DEFAULT 0 | |
| `applications_count` | `INTEGER` | DEFAULT 0 | Cached |
| `expires_at` | `TIMESTAMPTZ` | NULLABLE | Auto-expire open tasks |
| `completed_at` | `TIMESTAMPTZ` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Soft delete |

**Constraints:**
```sql
CHECK (status IN ('DRAFT','OPEN','APPLICATIONS_OPEN','MATCHED','IN_PROGRESS',
                  'SUBMITTED_FOR_REVIEW','COMPLETED','CANCELLED','DISPUTED','EXPIRED'))
CHECK (urgency IN ('NORMAL','URGENT','VERY_URGENT'))
CHECK (budget_paise > 0)
CHECK (visibility_radius_km BETWEEN 1 AND 50)
```

**Indexes:**
```sql
CREATE INDEX idx_tasks_location ON tasks USING GIST(location);
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_customer_id ON tasks(customer_id);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_status_created ON tasks(status, created_at DESC) WHERE deleted_at IS NULL;
```

**Full-text search index:**
```sql
CREATE INDEX idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || description));
```

---

### `task_images`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE CASCADE | |
| `image_url` | `TEXT` | NOT NULL | |
| `thumbnail_url` | `TEXT` | NULLABLE | |
| `image_type` | `VARCHAR(20)` | DEFAULT 'TASK_PHOTO' | TASK_PHOTO, COMPLETION_PROOF |
| `sort_order` | `INTEGER` | DEFAULT 0 | |
| `uploaded_by` | `UUID` | FK → users.id | |
| `uploaded_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `CREATE INDEX idx_task_images_task_id ON task_images(task_id);`

---

### `task_applications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE CASCADE | |
| `worker_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `status` | `VARCHAR(20)` | DEFAULT 'PENDING' | |
| `cover_note` | `TEXT` | NULLABLE | Worker's note |
| `applied_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `responded_at` | `TIMESTAMPTZ` | NULLABLE | When customer responded |

**Constraints:**
```sql
UNIQUE(task_id, worker_id)
CHECK (status IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN','CANCELLED'))
```

**Indexes:**
```sql
CREATE INDEX idx_applications_task_id ON task_applications(task_id);
CREATE INDEX idx_applications_worker_id ON task_applications(worker_id);
CREATE INDEX idx_applications_status ON task_applications(status);
```

---

### `task_assignments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE CASCADE, UNIQUE | One assignment per task |
| `worker_id` | `UUID` | FK → users.id | |
| `application_id` | `UUID` | FK → task_applications.id | |
| `assigned_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `started_at` | `TIMESTAMPTZ` | NULLABLE | |
| `submitted_at` | `TIMESTAMPTZ` | NULLABLE | Proof submitted |
| `completed_at` | `TIMESTAMPTZ` | NULLABLE | |

---

### `task_status_history`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE CASCADE | |
| `from_status` | `VARCHAR(30)` | NULLABLE | |
| `to_status` | `VARCHAR(30)` | NOT NULL | |
| `changed_by` | `UUID` | FK → users.id | |
| `reason` | `TEXT` | NULLABLE | For cancellations/disputes |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `CREATE INDEX idx_status_history_task_id ON task_status_history(task_id);`

---

### `task_completion_evidence`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE CASCADE, UNIQUE | |
| `worker_id` | `UUID` | FK → users.id | |
| `notes` | `TEXT` | NULLABLE | |
| `submitted_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

(Images stored in `task_images` with `image_type = 'COMPLETION_PROOF'`)

---

### `saved_tasks`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE CASCADE | |
| `saved_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**PK:** `(user_id, task_id)`

---

## 4. REVIEWS & RATINGS

---

### `reviews`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE CASCADE | |
| `reviewer_id` | `UUID` | FK → users.id | |
| `reviewee_id` | `UUID` | FK → users.id | |
| `role_of_reviewer` | `VARCHAR(20)` | NOT NULL | 'CUSTOMER', 'WORKER' |
| `rating` | `SMALLINT` | NOT NULL | CHECK 1-5 |
| `review_text` | `TEXT` | NULLABLE | Max 1000 chars |
| `is_public` | `BOOLEAN` | DEFAULT true | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Constraints:**
```sql
UNIQUE(task_id, reviewer_id)  -- one review per party per task
CHECK (rating BETWEEN 1 AND 5)
CHECK (role_of_reviewer IN ('CUSTOMER','WORKER'))
CHECK (reviewer_id != reviewee_id)
```

**Index:** `CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);`

---

## 5. PAYMENTS

---

### `payments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE RESTRICT, UNIQUE | |
| `customer_id` | `UUID` | FK → users.id | |
| `worker_id` | `UUID` | FK → users.id | |
| `amount_paise` | `INTEGER` | NOT NULL, CHECK > 0 | |
| `platform_fee_paise` | `INTEGER` | DEFAULT 0 | Future: take a cut |
| `worker_payout_paise` | `INTEGER` | NOT NULL | `amount - platform_fee` |
| `status` | `VARCHAR(30)` | DEFAULT 'PENDING' | |
| `provider` | `VARCHAR(30)` | DEFAULT 'MOCK' | 'MOCK', 'RAZORPAY' |
| `provider_payment_id` | `VARCHAR(100)` | NULLABLE | External reference |
| `authorized_at` | `TIMESTAMPTZ` | NULLABLE | |
| `captured_at` | `TIMESTAMPTZ` | NULLABLE | |
| `released_at` | `TIMESTAMPTZ` | NULLABLE | |
| `refunded_at` | `TIMESTAMPTZ` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Constraints:**
```sql
CHECK (status IN ('PENDING','AUTHORIZED','CAPTURED','RELEASED','REFUNDED','FAILED','DISPUTED'))
CHECK (worker_payout_paise = amount_paise - platform_fee_paise)
```

---

### `payment_transactions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | Audit log of every state change |
| `payment_id` | `UUID` | FK → payments.id ON DELETE CASCADE | |
| `type` | `VARCHAR(30)` | NOT NULL | AUTHORIZE, CAPTURE, RELEASE, REFUND, FAIL |
| `amount_paise` | `INTEGER` | NOT NULL | |
| `from_status` | `VARCHAR(30)` | NOT NULL | |
| `to_status` | `VARCHAR(30)` | NOT NULL | |
| `actor_id` | `UUID` | FK → users.id, NULLABLE | Who triggered |
| `metadata` | `JSONB` | NULLABLE | Provider response data |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

## 6. COMMUNITY DRIVES

---

### `community_events`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `organizer_id` | `UUID` | FK → users.id ON DELETE RESTRICT | |
| `title` | `VARCHAR(200)` | NOT NULL | |
| `description` | `TEXT` | NOT NULL | |
| `event_type` | `VARCHAR(50)` | NOT NULL | LAKE_CLEANING, PARK_CLEANING, etc. |
| `cover_image_url` | `TEXT` | NULLABLE | |
| `location` | `GEOGRAPHY(POINT, 4326)` | NOT NULL | |
| `location_label` | `VARCHAR(300)` | NOT NULL | Human-readable |
| `meeting_point_description` | `TEXT` | NULLABLE | |
| `status` | `VARCHAR(30)` | DEFAULT 'PENDING_APPROVAL' | |
| `event_date` | `DATE` | NOT NULL | |
| `start_time` | `TIME` | NOT NULL | |
| `end_time` | `TIME` | NOT NULL | |
| `max_volunteers` | `INTEGER` | NOT NULL | |
| `min_volunteers_required` | `INTEGER` | DEFAULT 1 | |
| `current_volunteers` | `INTEGER` | DEFAULT 0 | Cached |
| `checkin_radius_meters` | `INTEGER` | DEFAULT 100 | Server-side GPS validation |
| `qr_code_token` | `VARCHAR(64)` | NULLABLE, UNIQUE | HMAC-signed |
| `qr_code_url` | `TEXT` | NULLABLE | QR image |
| `instructions` | `TEXT` | NULLABLE | |
| `safety_information` | `TEXT` | NULLABLE | |
| `base_civic_points` | `INTEGER` | DEFAULT 50 | Minimum points for participation |
| `base_env_points` | `INTEGER` | DEFAULT 25 | Environmental points |
| `impact_target_kg` | `INTEGER` | NULLABLE | Expected waste kg |
| `impact_target_trees` | `INTEGER` | NULLABLE | Expected trees planted |
| `impact_achieved_kg` | `INTEGER` | NULLABLE | Actual (post-event) |
| `impact_achieved_trees` | `INTEGER` | NULLABLE | Actual (post-event) |
| `approved_by` | `UUID` | FK → users.id, NULLABLE | Admin |
| `approved_at` | `TIMESTAMPTZ` | NULLABLE | |
| `rejection_reason` | `TEXT` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Constraints:**
```sql
CHECK (status IN ('PENDING_APPROVAL','APPROVED','OPEN','IN_PROGRESS','COMPLETED',
                  'CANCELLED','REJECTED'))
CHECK (event_type IN ('LAKE_CLEANING','PARK_CLEANING','PLANTATION','BEACH_CLEANUP',
                      'ROADSIDE_CLEANUP','WASTE_COLLECTION','AWARENESS_CAMPAIGN',
                      'COMMUNITY_REPAIR','OTHER'))
CHECK (end_time > start_time)
CHECK (max_volunteers > 0)
```

**Indexes:**
```sql
CREATE INDEX idx_events_location ON community_events USING GIST(location);
CREATE INDEX idx_events_status ON community_events(status);
CREATE INDEX idx_events_date ON community_events(event_date);
CREATE INDEX idx_events_organizer_id ON community_events(organizer_id);
```

---

### `event_participants`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `event_id` | `UUID` | FK → community_events.id ON DELETE CASCADE | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `status` | `VARCHAR(30)` | DEFAULT 'REGISTERED' | |
| `civic_points_awarded` | `INTEGER` | NULLABLE | Set after verification |
| `env_points_awarded` | `INTEGER` | NULLABLE | |
| `hours_awarded` | `NUMERIC(5,2)` | NULLABLE | In hours |
| `verified_by` | `UUID` | FK → users.id, NULLABLE | Organizer who verified |
| `verified_at` | `TIMESTAMPTZ` | NULLABLE | |
| `registered_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Constraint:**
```sql
UNIQUE(event_id, user_id)
CHECK (status IN ('REGISTERED','CHECKED_IN','CHECKED_OUT','VERIFIED','ABSENT','REMOVED'))
```

**Index:** `CREATE INDEX idx_participants_event_id ON event_participants(event_id);`

---

### `event_checkins`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `event_id` | `UUID` | FK → community_events.id | |
| `user_id` | `UUID` | FK → users.id | |
| `check_in_time` | `TIMESTAMPTZ` | NOT NULL | |
| `check_out_time` | `TIMESTAMPTZ` | NULLABLE | |
| `check_in_lat` | `DOUBLE PRECISION` | NOT NULL | Stored for audit |
| `check_in_lon` | `DOUBLE PRECISION` | NOT NULL | |
| `check_in_accuracy_m` | `FLOAT` | NULLABLE | Device GPS accuracy |
| `check_in_method` | `VARCHAR(10)` | NOT NULL | 'GPS', 'QR' |
| `check_in_distance_m` | `FLOAT` | NOT NULL | Distance from event at check-in |
| `check_out_lat` | `DOUBLE PRECISION` | NULLABLE | |
| `check_out_lon` | `DOUBLE PRECISION` | NULLABLE | |
| `duration_minutes` | `INTEGER` | NULLABLE | Computed on check-out |

**Note:** Check-in lat/lon are NOT exposed publicly. Internal audit only.

**Constraint:**
```sql
UNIQUE(event_id, user_id)  -- one check-in record per user per event
CHECK (check_in_method IN ('GPS','QR'))
```

---

### `event_evidence`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `event_id` | `UUID` | FK → community_events.id | |
| `user_id` | `UUID` | FK → users.id | |
| `image_url` | `TEXT` | NOT NULL | |
| `thumbnail_url` | `TEXT` | NULLABLE | |
| `evidence_type` | `VARCHAR(30)` | DEFAULT 'DURING_CLEANUP' | |
| `caption` | `VARCHAR(300)` | NULLABLE | |
| `uploaded_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Constraint:** `CHECK (evidence_type IN ('BEFORE','DURING_CLEANUP','AFTER','OTHER'))`

---

### `impact_records`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `event_id` | `UUID` | FK → community_events.id, NULLABLE | If from event |
| `record_type` | `VARCHAR(30)` | NOT NULL | VOLUNTEER_HOURS, CIVIC_POINTS, ENV_POINTS |
| `amount` | `NUMERIC(10,2)` | NOT NULL | Points or hours |
| `description` | `VARCHAR(200)` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `CREATE INDEX idx_impact_records_user_id ON impact_records(user_id);`

---

## 7. GAMIFICATION

---

### `badges`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | e.g., "FIRST STEP" |
| `slug` | `VARCHAR(100)` | NOT NULL, UNIQUE | e.g., "first_step" |
| `description` | `TEXT` | NOT NULL | |
| `icon_url` | `TEXT` | NULLABLE | SVG asset URL |
| `icon_name` | `VARCHAR(50)` | NULLABLE | If using icon library |
| `criteria_type` | `VARCHAR(50)` | NOT NULL | See enum below |
| `criteria_value` | `INTEGER` | NOT NULL | Threshold value |
| `rarity` | `VARCHAR(20)` | DEFAULT 'COMMON' | COMMON, UNCOMMON, RARE, EPIC |
| `points` | `INTEGER` | DEFAULT 0 | Points awarded when badge earned |
| `is_active` | `BOOLEAN` | DEFAULT true | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Criteria types:**
```
FIRST_EVENT, EVENTS_COUNT, CLEANUP_COUNT, PLANTATION_COUNT,
VOLUNTEER_HOURS, ENV_POINTS, CIVIC_POINTS,
TASK_COMPLETED, TASK_COMPLETION_RATE, MONEY_EARNED,
REVIEWS_ABOVE_RATING
```

---

### `user_badges`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `badge_id` | `UUID` | FK → badges.id | |
| `awarded_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `awarded_by` | `VARCHAR(20)` | DEFAULT 'SYSTEM' | 'SYSTEM' or admin user_id |

**Constraint:** `UNIQUE(user_id, badge_id)` — badge awarded only once

---

## 8. NOTIFICATIONS

---

### `notifications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `type` | `VARCHAR(50)` | NOT NULL | See enum below |
| `title` | `VARCHAR(200)` | NOT NULL | |
| `body` | `TEXT` | NOT NULL | |
| `data` | `JSONB` | NULLABLE | Navigation payload |
| `is_read` | `BOOLEAN` | DEFAULT false | |
| `read_at` | `TIMESTAMPTZ` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Types:**
```
NEW_APPLICATION, APPLICATION_ACCEPTED, APPLICATION_REJECTED,
TASK_STARTED, TASK_SUBMITTED, TASK_COMPLETED, PAYMENT_RELEASED,
NEW_REVIEW, EVENT_APPROVED, EVENT_REMINDER, EVENT_JOINED,
CHECKIN_SUCCESS, BADGE_EARNED, ADMIN_MESSAGE, DISPUTE_OPENED
```

**Indexes:**
```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

---

### `device_tokens`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `user_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `token` | `TEXT` | NOT NULL | FCM token |
| `platform` | `VARCHAR(10)` | NOT NULL | 'android', 'ios', 'web' |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Constraint:** `UNIQUE(user_id, token)`

---

## 9. CHAT

---

### `messages`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE CASCADE | Scoped to task |
| `sender_id` | `UUID` | FK → users.id | |
| `content` | `TEXT` | NULLABLE | Text content |
| `image_url` | `TEXT` | NULLABLE | Optional image |
| `message_type` | `VARCHAR(20)` | DEFAULT 'TEXT' | TEXT, IMAGE, SYSTEM |
| `is_read` | `BOOLEAN` | DEFAULT false | |
| `read_at` | `TIMESTAMPTZ` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |
| `deleted_at` | `TIMESTAMPTZ` | NULLABLE | Soft delete |

**Index:** `CREATE INDEX idx_messages_task_id ON messages(task_id, created_at DESC);`

---

## 10. MODERATION & AUDIT

---

### `reports`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `reporter_id` | `UUID` | FK → users.id ON DELETE CASCADE | |
| `entity_type` | `VARCHAR(30)` | NOT NULL | TASK, USER, REVIEW, EVENT, IMAGE, MESSAGE |
| `entity_id` | `UUID` | NOT NULL | The reported entity |
| `reason` | `VARCHAR(50)` | NOT NULL | See enum |
| `description` | `TEXT` | NULLABLE | |
| `status` | `VARCHAR(20)` | DEFAULT 'PENDING' | PENDING, UNDER_REVIEW, RESOLVED, DISMISSED |
| `resolved_by` | `UUID` | FK → users.id, NULLABLE | |
| `resolved_at` | `TIMESTAMPTZ` | NULLABLE | |
| `resolution_note` | `TEXT` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Reasons:** SPAM, FRAUD, INAPPROPRIATE_CONTENT, HARASSMENT, FAKE_PARTICIPATION, OTHER

---

### `moderation_actions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `report_id` | `UUID` | FK → reports.id, NULLABLE | |
| `actor_id` | `UUID` | FK → users.id | Admin/Moderator |
| `target_user_id` | `UUID` | FK → users.id, NULLABLE | Affected user |
| `action_type` | `VARCHAR(30)` | NOT NULL | WARN, REMOVE_CONTENT, SUSPEND, BAN, RESTORE |
| `reason` | `TEXT` | NOT NULL | |
| `metadata` | `JSONB` | NULLABLE | e.g., {suspended_until: "..."} |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

### `audit_logs`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `actor_id` | `UUID` | FK → users.id, NULLABLE | NULL = system |
| `action` | `VARCHAR(100)` | NOT NULL | e.g., "APPROVE_EVENT" |
| `entity_type` | `VARCHAR(50)` | NOT NULL | |
| `entity_id` | `UUID` | NULLABLE | |
| `ip_address` | `INET` | NULLABLE | |
| `user_agent` | `TEXT` | NULLABLE | |
| `metadata` | `JSONB` | NULLABLE | Before/after state |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

**Index:** `CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);`
**Index:** `CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);`

---

## 11. AI

---

### `ai_predictions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `UUID` | PK | |
| `task_id` | `UUID` | FK → tasks.id ON DELETE CASCADE, NULLABLE | |
| `request_type` | `VARCHAR(30)` | NOT NULL | CLASSIFY_IMAGE, PRICE_ESTIMATE |
| `input_data` | `JSONB` | NOT NULL | image_urls, category, etc. |
| `output_data` | `JSONB` | NOT NULL | Raw AI response |
| `suggested_category_id` | `UUID` | FK → categories.id, NULLABLE | |
| `confidence` | `NUMERIC(5,4)` | NULLABLE | |
| `model_version` | `VARCHAR(50)` | NULLABLE | |
| `latency_ms` | `INTEGER` | NULLABLE | |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | |

---

## 12. KEY RELATIONSHIPS SUMMARY

```
users ─── 1:1 ──→ worker_profiles
users ─── 1:1 ──→ volunteer_profiles
users ─── 1:1 ──→ organizer_profiles
users ─── 1:N ──→ user_roles
users ─── 1:N ──→ tasks (as customer)
users ─── 1:N ──→ task_applications (as worker)
users ─── 1:N ──→ reviews (as reviewer and reviewee)
tasks ─── 1:N ──→ task_images
tasks ─── 1:N ──→ task_applications
tasks ─── 1:1 ──→ task_assignments
tasks ─── 1:N ──→ task_status_history
tasks ─── 1:1 ──→ payments
tasks ─── 1:1 ──→ task_completion_evidence
community_events ─── 1:N ──→ event_participants
community_events ─── 1:N ──→ event_checkins
community_events ─── 1:N ──→ event_evidence
users ─── M:N ──→ badges (via user_badges)
users ─── 1:N ──→ impact_records
users ─── 1:N ──→ notifications
users ─── 1:N ──→ messages (as sender, scoped to tasks)
users ─── 1:N ──→ audit_logs (as actor)
```

---

## 13. TASK STATUS MACHINE

```
DRAFT ──→ OPEN ──→ MATCHED ──→ IN_PROGRESS ──→ SUBMITTED_FOR_REVIEW ──→ COMPLETED
  │         │         │               │
  │         │         │               └──→ DISPUTED ──→ COMPLETED (resolved)
  │         │         │                            └──→ CANCELLED
  │         │         └──→ CANCELLED (customer cancels before start)
  │         └──→ EXPIRED (auto, no applications after N days)
  └──→ OPEN (publish from draft)

CANCELLED: terminal
COMPLETED: terminal
EXPIRED: terminal
```

**Enforced in:** `TaskService.transition_status()` — any invalid transition raises `InvalidTransitionError`.
