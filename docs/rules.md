# SAVJ — Agent Coding Rules

> **IMPORTANT:** This file controls all AI coding agents working on the SAVJ codebase.
> Every agent MUST read and follow these rules before writing any code.
> Non-compliance will result in broken architecture, security holes, or legal issues.

---

## PART 1 — MANDATORY PRE-CODING CHECKS

Before writing ANY application code:

### Rule 1: Read the PRD first
Read `docs/prd.md` fully before coding any feature.
- Confirm the feature is in MVP scope (§6 of prd.md)
- Confirm the feature is NOT in the out-of-scope list (§7 of prd.md)
- If a feature is not in the PRD, it must NOT be implemented without explicit user approval

### Rule 2: Read the architecture before changing the stack
Read `docs/architecture.md` before:
- Adding a new service
- Adding a new database
- Changing an existing technology choice
- Adding infrastructure components

If you want to change the stack: document the reason in `docs/decisions.md` and get explicit approval.

### Rule 3: Read the schema before any database change
Read `docs/schema.md` before:
- Adding a new table
- Adding a new column
- Changing a column type or constraint
- Adding or removing an index

After any schema change: create an Alembic migration. Never use `create_all()` or `drop_all()` in production code.

### Rule 4: Never invent APIs
Only implement API endpoints that are documented in `docs/api.md`.
If a new endpoint is needed: document it first, then implement it.
Never create undocumented side-effects in existing endpoints.

### Rule 5: Read the design system before creating UI
Read `docs/design.md` before:
- Creating any new screen
- Adding any new component
- Choosing colors, fonts, or spacing
- Designing any form or interaction

Never hard-code colors as hex values in component code. Use design tokens.

---

## PART 2 — DATABASE RULES

### Rule 6: Never change database schema silently
All schema changes require:
1. Update to `docs/schema.md`
2. A new Alembic migration file
3. A comment in the migration explaining why

If you run `alembic revision --autogenerate`, review the generated migration before applying.
Never apply a migration that drops production data without explicit confirmation.

### Rule 7: Use integer paise for all money
```python
# CORRECT:
amount_paise: int = 20000  # ₹200

# WRONG:
amount_rupees: float = 200.00  # Never use float for money
```

### Rule 8: Use UUID primary keys
```python
# CORRECT:
id: UUID = Field(default_factory=uuid4)

# WRONG:
id: int  # Never use sequential integers as PKs
```

### Rule 9: Never store raw sensitive data
- Passwords: always Argon2id hash, never plaintext, never bcrypt MD5
- Refresh tokens: always SHA-256 hash in DB, raw token only sent to client
- Payment data: never store card numbers, CVV, or raw bank data
- GPS coordinates: store in audit tables only, never expose publicly

### Rule 10: Use parameterized queries
SQLAlchemy ORM parameterizes queries automatically.
Never construct raw SQL strings from user input:
```python
# CORRECT:
result = await db.execute(select(Task).where(Task.id == task_id))

# WRONG:
result = await db.execute(f"SELECT * FROM tasks WHERE id = '{task_id}'")
```

---

## PART 3 — AUTHORIZATION RULES

### Rule 11: Never bypass authorization
Every route that accesses user-specific data must check ownership.
```python
# CORRECT:
task = await get_task_or_404(task_id, db)
if task.customer_id != current_user.id:
    raise HTTPException(403, "Forbidden")

# WRONG:
task = await get_task_or_404(task_id, db)
return task  # anyone can see anyone's task
```

### Rule 12: Never trust client-side role values
```python
# CORRECT:
user = await get_current_user(credentials)  # from JWT, verified server-side
if "WORKER" not in user.roles:
    raise HTTPException(403)

# WRONG:
role = request.headers.get("X-User-Role")  # never trust this
```

### Rule 13: Never trust client-side prices
```python
# CORRECT:
task = await get_task(task_id, db)
amount = task.budget_paise  # from database

# WRONG:
amount = request.body.amount_paise  # user could send 0
```

### Rule 14: Never trust client-side task status
All task state transitions happen in `TaskService.transition_status()`.
A router must never directly set `task.status = "COMPLETED"`.
All transitions go through the state machine with validation.

### Rule 15: Never trust client-side GPS for check-in
```python
# CORRECT:
distance = calculate_distance_meters(
    event.location, user_lat, user_lon
)
if distance > event.checkin_radius_meters:
    raise HTTPException(400, "TOO_FAR_FROM_EVENT")

# WRONG:
if request.body.user_confirmed_location:  # never trust this
    award_checkin()
```

### Rule 16: Admin routes must be separately protected
Never use the same auth dependency for admin routes and user routes.
```python
# CORRECT:
@router.get("/admin/users")
async def list_users(admin: User = Depends(require_admin)):
    ...

# WRONG:
@router.get("/admin/users")
async def list_users(user: User = Depends(get_current_user)):
    if user.is_admin:  # client can set this to True
        ...
```

---

## PART 4 — INPUT VALIDATION RULES

### Rule 17: Validate all user input with Pydantic
```python
# CORRECT:
class CreateTaskRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    budget_paise: int = Field(..., ge=100)  # min ₹1
    description: str = Field(..., min_length=20)

# WRONG:
title = request.body.get("title")  # no validation
```

### Rule 18: Validate uploaded files
Before storing any uploaded file:
1. Check MIME type matches Content-Type header
2. Verify file signature (magic bytes), not just extension
3. Check file size ≤ 10 MB
4. Resize images before storage (max 1920×1080)
5. Convert to WebP format

### Rule 19: TypeScript strict mode (web/admin)
In all TypeScript files:
- `"strict": true` in tsconfig.json — always
- Never use `any` unless documenting exactly why and it is truly unavoidable
- Every function must have a return type annotation
- Every API response must have a typed interface

---

## PART 5 — AI MODULE RULES

### Rule 20: AI never sets final values
The AI service may SUGGEST a category or price range.
It must NEVER set the final value without user confirmation.
```python
# CORRECT:
return {
    "suggested_category": "BACKYARD_CLEANING",
    "confidence": 0.87,
    "suggested_price_min_paise": 15000,
    "suggested_price_max_paise": 30000,
    "is_suggestion_only": True,  # always include this flag
}

# WRONG:
task.category = ai_result.category  # AI cannot set the final category
task.budget = ai_result.price  # AI cannot set the final price
```

### Rule 21: AI failure must degrade gracefully
```python
# CORRECT:
try:
    result = await ai_service.classify(image_urls)
except Exception:
    result = {"ai_available": False, "error": "AI service unavailable"}

return result  # client shows manual entry form

# WRONG:
result = await ai_service.classify(image_urls)  # if this raises, task creation fails
```

### Rule 22: Never present uncertain AI output as fact
If `confidence < 0.6`:
```python
return {
    "suggested_category": category,
    "confidence": 0.45,
    "confidence_label": "LOW",
    "warning": "Low confidence suggestion. Please confirm manually.",
}
```

---

## PART 6 — PAYMENT RULES

### Rule 23: Never implement payment logic in UI components
All payment operations go through `PaymentService`.
No router, no mobile screen, no web component may:
- Calculate a payment amount
- Decide to release payment
- Mark a payment as completed
- Access payment provider APIs directly

```python
# CORRECT:
await payment_service.release_payment(payment_id)

# WRONG (in a router):
payment.status = "RELEASED"
await db.commit()
```

### Rule 24: All payment state transitions are audited
Every payment status change must create a `payment_transactions` row.
This is enforced by the `PaymentService` — never bypass it.

---

## PART 7 — GAMIFICATION RULES

### Rule 25: Points and badges are awarded server-side only
```python
# CORRECT (in VolunteerService):
await award_points(user_id, civic_points=75, env_points=25, event_id=event_id)
await check_and_award_badges(user_id)

# WRONG (in a router based on client request):
if request.body.claim_badge == "ECO_WARRIOR":
    await award_badge(user_id, "ECO_WARRIOR")
```

### Rule 26: Badge criteria must be defined in the database
Badge award calculation reads criteria from the `badges` table.
Never hardcode badge criteria in application logic.

---

## PART 8 — CODE QUALITY RULES

### Rule 27: No massive files
Maximum file sizes:
- Backend router: 200 lines (split by endpoint group if larger)
- Backend service: 300 lines (split if larger)
- Flutter screen: 350 lines (extract widgets if larger)
- Next.js page: 250 lines (extract components if larger)

### Rule 28: No duplicated business logic
Business logic lives in `services/` (backend) or `repositories/` (mobile/web).
Routers are thin HTTP interfaces.
Screens are thin UI layers.
Never duplicate the same logic in multiple places.

### Rule 29: Prefer existing dependencies
Before adding a new package:
1. Check if the functionality exists in already-imported packages
2. If a new package is needed, add it to `requirements.txt` / `pubspec.yaml` / `package.json`
3. Add a comment explaining why it was added

Never add packages for convenience only (e.g., lodash for one utility function).

### Rule 30: Keep contracts synchronized
When changing an API endpoint:
1. Update `docs/api.md`
2. Update the Flutter repository that calls it
3. Update the Next.js API client that calls it
4. Run tests for all three

### Rule 31: Update documentation when architecture changes
After any architectural change:
- Update `docs/architecture.md`
- Update `docs/schema.md` (if DB changed)
- Update `docs/api.md` (if API changed)
- Add entry to `docs/decisions.md`

---

## PART 9 — TESTING RULES

### Rule 32: Write tests for business logic
Every service function must have a unit test.
Every API endpoint must have an integration test.
Authorization must be tested for every protected route.

Minimum test cases per route:
- Valid request (200/201)
- Missing required field (422)
- Unauthorized (401)
- Forbidden (403 — correct user but wrong role)
- IDOR attempt (403 — correct role but wrong user's resource)
- Not found (404)

### Rule 33: Never fabricate test results
Tests must actually run and pass.
Never write a test that passes trivially without exercising the logic:
```python
# WRONG:
def test_create_task():
    assert True  # This tells us nothing
```

---

## PART 10 — SECURITY RULES

### Rule 34: Never commit secrets
Never put in code or committed files:
- JWT secrets
- Database passwords
- API keys (Firebase, Razorpay, etc.)
- MinIO credentials

Use `.env` files (gitignored) and `.env.example` for documentation.

### Rule 35: Never expose private user data
Never return in any API response:
- `password_hash`
- `refresh_token` values stored in DB
- Private GPS history
- `is_banned` / `suspended_until` to normal users
- Admin moderation actions (to the affected user only: notify them; details are internal)
- Other users' email or phone numbers

### Rule 36: Rate limit sensitive endpoints
Required rate limits (enforced via slowapi):
- `POST /api/v1/auth/login` → 10/minute
- `POST /api/v1/auth/register` → 5/minute
- `POST /api/v1/auth/refresh` → 20/minute
- `POST /api/v1/tasks` → 10/hour
- `POST /api/v1/reports` → 5/hour
- `POST /api/v1/community/events/{id}/checkin` → 3/minute

---

## PART 11 — FAILURE & RETRY RULES

### Rule 37: Do not repeatedly retry the same failing approach
If an implementation attempt fails three times with the same error:
1. Stop retrying
2. Write a clear explanation of:
   - What you tried
   - What error occurred
   - Why you think it's failing
   - What you need to proceed
3. Present this to the user

### Rule 38: Never delete working code without understanding dependencies
Before deleting any working function, class, or component:
1. Search the entire codebase for imports/references
2. Confirm nothing depends on it
3. If in doubt, deprecate and comment rather than delete

### Rule 39: Never claim something works unless tested
Do not write:
- "The payment service now works" — unless you've run the payment flow tests
- "Authentication is complete" — unless you've tested login, refresh, and logout

Always specify: "Implemented X. Tested: [describe what was tested]. Remaining: [what still needs testing]."

---

## PART 12 — OFFLINE & NETWORK RULES

### Rule 40: Never show optimistic UI for server mutations without rollback
```dart
// WRONG:
state = state.copyWith(tasks: [...state.tasks, newTask]);
await apiClient.createTask(newTask);  // if this fails, UI is now wrong

// CORRECT:
final result = await apiClient.createTask(newTask);
state = state.copyWith(tasks: [...state.tasks, result]);
```

Exception: Message sending may show "Sending..." optimistically but must rollback on failure.

---

## QUICK REFERENCE CHECKLIST

Before submitting any code:

- [ ] PRD confirms this feature is in MVP scope
- [ ] No unauthorized API endpoints added
- [ ] All routes have ownership/authorization checks
- [ ] All money stored as integer paise
- [ ] All task status changes go through state machine
- [ ] All GPS check-ins validated server-side
- [ ] All points/badges awarded server-side only
- [ ] All payments go through PaymentService
- [ ] AI suggestions clearly labeled, never auto-applied
- [ ] No secrets in code
- [ ] No `any` in TypeScript
- [ ] Pydantic validation on all inputs
- [ ] File upload validation (MIME, size, magic bytes)
- [ ] Tests written and passing
- [ ] Documentation updated if architecture changed
- [ ] Alembic migration created if schema changed
