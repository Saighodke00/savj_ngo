# SAVJ — COMPLETE PROJECT CONCEPT & BUILD SPECIFICATION

## 1. Project Name

# SAVJ

### Tagline

**GET IT DONE. EARN. GIVE BACK.**

SAVJ is a community-powered platform that connects people who **need small/local tasks completed** with people who are **willing to complete those tasks for an agreed price**.

At the same time, SAVJ gives people a place to participate in **community and environmental activities** and build a visible record of their contribution.

The platform combines:

### 🟦 GET IT DONE
Post a task that you need someone to complete.

### 🟨 EARN
Find nearby tasks and earn money by completing them.

### 🟩 GIVE BACK
Participate in community drives and earn verified impact points, volunteer hours, badges and medals.

---

## 2. The Core Idea

Imagine someone looks outside their house and sees a messy backyard.

Normally they might:
- ask friends
- search Google
- call a local service
- negotiate prices
- wait for someone to come

SAVJ makes this much simpler.

They open SAVJ → click **POST A TASK** → take a picture → write a description → set a price (e.g. ₹200) → choose a date → add location → click **POST TASK**.

Now people nearby who are willing to do that job can see it. One person applies. The customer accepts them. The worker completes the task and uploads completion proof. The customer approves it. Transaction completed. Both users review each other.

That's the primary SAVJ experience.

---

## 3. The Second Half of SAVJ

SAVJ also encourages people to contribute to their community:

- 🌊 Lake Cleanup — "Sunday Lake Cleanup — 50 volunteers needed"
- 🌳 Plantation Drive — "Plant 500 trees with your community"
- 🗑️ Community Cleanup — "Clean the neighborhood park"
- 🌱 Environmental Activities — "Urban gardening and tree-care drive"
- 🤝 Community Service — "Community support activity"

After verified participation, their profile shows:
- **12 Community Drives**
- **38 Volunteer Hours**
- **420 Impact Points**
- **7 Badges**

This is the user's **SAVJ Impact Profile**.

---

## 4. What Makes SAVJ Different

SAVJ is NOT a job website, Urban Company clone, Fiverr clone, LinkedIn, Facebook, volunteering website, or e-commerce site.

The key combination is:
```
LOCAL TASKS + MICRO-EARNING + COMMUNITY IMPACT
```

One person can be:
- **Customer**: "I need someone to clean my backyard."
- **Worker**: "I want to earn ₹200 by cleaning someone's backyard."
- **Volunteer**: "I want to participate in the lake cleanup."

The **same account** does all three.

---

## 5. The Main SAVJ Philosophy

```
GET IT DONE → Someone needs help.
EARN        → Someone else can help and earn.
GIVE BACK   → Everyone can contribute to their community.
```

This should be visible throughout the application.

---

## 6. Who Uses SAVJ?

### User (Primary)
- Post tasks / Find tasks / Apply / Complete tasks / Earn money
- Join community events / Earn impact points / Earn badges
- Review others
- No separate customer/worker accounts — one account does both

### Organizer
- Approved person/org responsible for community activities
- Create/submit/manage events, view participants, verify participation

### Admin
- Manage users, tasks, reports, approve events/organizers
- Manage categories, badges, disputes, platform settings

### Moderator
- Handle reports, inappropriate content, task/community moderation
- Without full admin access

---

## 7. Main Website Structure

Three major experiences:

**A. TASK MARKETPLACE** — Getting things done and earning

**B. COMMUNITY** — Volunteering and social/environmental participation

**C. PERSONAL PROFILE** — Work reputation + civic impact

---

## 8. Home Page

Hero message:
```
NEED SOMETHING DONE?
Show us.

Take a picture → Describe it → Set your price → Get it done.

[ POST A TASK ]    [ FIND WORK ]    [ GIVE BACK ]
```

Visual: Large task photos, rounded cards, photo-first presentation. Real people doing real things.

---

## 9. Main Navigation

Desktop:
```
SAVJ    Home  Tasks  Community  How It Works    [Notifications] [Messages] [Profile]
```

Mobile:
```
Home | Tasks | [+] | Community | Profile
```

The central `+` = **POST TASK** (most important action).

---

## 10. Post Task Experience (7 Steps)

1. **SHOW US** — Large camera/photo area. Take Photo or Upload Photo.
2. **WHAT DO YOU NEED?** — Text area description.
3. **HOW MUCH WILL YOU PAY?** — Large `₹ 200` input.
4. **WHEN?** — Today / Tomorrow / Choose Date.
5. **WHERE?** — Current location or manual entry.
6. **CATEGORY** — Cleaning / Gardening / Moving / Repairs / Delivery / Pet Care / Home Help / Car Cleaning / Other.
7. **REVIEW** — Show task summary → **POST TASK**.

This should feel dramatically easier than a traditional service-request form.

---

## 11. AI Feature

After user uploads a picture, AI optionally suggests:
- **Detected Task**: Backyard Cleaning
- **Estimated Effort**: Medium
- **Suggested Price**: ₹150–₹300

User remains in full control — can change title, description, category, price, date.

---

## 12. Task Feed

Photo-first card layout:
```
┌───────────────────────────────┐
│ [BACKYARD PHOTO]              │
│ Backyard Cleaning             │
│ Remove leaves & waste         │
│ ₹200                          │
│ 2.4 km • Today                │
│        VIEW TASK →            │
└───────────────────────────────┘
```

---

## 13. Task Filters

- **Distance**: Nearby / 1km / 5km / 10km / 25km
- **Category**: Cleaning / Gardening / Repair / Moving / Delivery / etc.
- **Price**: Lowest / Highest / Custom range
- **Date**: Today / Tomorrow / This week

---

## 14. Task Details Page

Shows: Large image, title, price, posted date, distance, description, when, approximate location, poster profile (name, rating, completed tasks count).

Worker sees: **APPLY FOR TASK**

---

## 15. Application Flow

Worker clicks Apply → enters "Why are you a good fit?" + proposed completion date → submits.

Customer receives notification → sees all applicants.

---

## 16. Customer View: Applicants

```
┌──────────────────────────────┐
│ [PHOTO]  Aman                │
│          ★ 4.8               │
│          18 tasks completed  │
│ "I can complete this today." │
│ [ VIEW PROFILE ]             │
│ [ ACCEPT ] [ REJECT ]        │
└──────────────────────────────┘
```

---

## 17. Worker Profile (Trust Layer)

Visible to customers before accepting:
- Profile photo, name, rating, completed tasks
- Skills, reviews, approximate location
- Work history, community contribution

---

## 18. Task Lifecycle

```
DRAFT → OPEN → APPLICATIONS → ASSIGNED → IN PROGRESS → SUBMITTED → COMPLETED
```

Alternative states: `CANCELLED`, `DISPUTED`, `EXPIRED`

---

## 19. Worker Experience / Dashboard

Shows:
- Active tasks (in progress)
- Upcoming tasks
- Completed tasks
- **YOUR EARNINGS: ₹4,250**

---

## 20. Completion Flow

Worker clicks **SUBMIT COMPLETION** → uploads completion photo + optional note.

Customer receives notification → sees **APPROVE** or **DISPUTE**.

---

## 21. Payment

For MVP: demo/mock transaction clearly labeled **DEMO PAYMENT**. Never pretend a real transfer happened.

The agreed price is always part of the task record. Payment status shown clearly: `RELEASED`.

Real payment gateway can be integrated later.

---

## 22. Reviews

After completion, both parties rate each other (★★★★★) and leave a review. Builds the SAVJ reputation system.

---

## 23. Community Section

Visual style different from marketplace.

```
DO SOMETHING GOOD TOGETHER.

🌊 LAKE CLEANUP     Sunday • 8:00 AM  • 120 joined  [ JOIN ]
🌳 TREE PLANTATION  Saturday • 7:00 AM • 84 joined   [ JOIN ]
🧹 PARK CLEANUP     Sunday • 9:00 AM  • 43 joined    [ JOIN ]
```

---

## 24. Community Event Details

Shows: event photo, title, organizer, date, time, location, description, participants, volunteer requirement, instructions, expected impact.

Button: **JOIN DRIVE**

---

## 25. Participation & Check-in

After joining:
```
YOU'RE IN! — LAKE CLEANUP — Sunday 8:00 AM
[ ADD TO CALENDAR ]  [ CHECK IN ]
```

Verification mechanisms: QR code / event code / organizer verification / GPS-assisted.

---

## 26. Community Proof

User submits photos + notes. Organizer verifies. Only then does activity count toward impact.

---

## 27. Impact System

Every verified community activity generates:
- **Volunteer Hours**
- **Impact Points**
- **Badges**
- **Medals**

Example: `+4 volunteer hours`, `+20 impact points`, `Badge progress: 3/5 cleanup activities`

---

## 28. Badges

- 🌱 **FIRST STEP** — First community activity
- 🌊 **WATER GUARDIAN** — 5 cleanup drives
- 🌳 **GREEN HAND** — 10 plantation activities
- 🤝 **COMMUNITY BUILDER** — 25 community activities
- 🏆 **SAVJ CHAMPION** — 100 verified volunteer hours

---

## 29. Profile Design

Not a normal social-media profile. Shows **YOUR SAVJ STORY**:

```
WORK
★ 4.8 | 23 Tasks Completed | ₹8,450 Earned

IMPACT
12 Community Drives | 38 Volunteer Hours | 420 Impact Points

BADGES
🌱  🌊  🌳  🤝

ACTIVITY TIMELINE
✓ Completed Backyard Cleaning — ₹200 earned
🌊 Joined Lake Cleanup — +20 impact
🌳 Plantation Drive — +30 impact
🏆 Earned Water Guardian badge
```

---

## 30. Dashboard (Post-Login)

Personalized, not an admin grid:
```
GOOD MORNING, AMAN 👋

📸 NEED SOMETHING DONE?  →  POST TASK
💰 WANT TO EARN?         →  FIND WORK
🌱 GIVE BACK             →  COMMUNITY
```

Then: Nearby Opportunities | Active Tasks | Upcoming Community Drives | Your Impact

---

## 31. Notifications

- Someone applied to your task
- Your application was accepted
- Your task is now in progress
- Your worker submitted completion
- Payment released
- You earned a new review
- Lake Cleanup starts tomorrow
- Your participation was verified
- 🎉 You earned a new badge!

---

## 32. Messaging

Task-attached conversations between customer and assigned worker.

---

## 33. Admin Panel (Separate)

Dashboard stats: Total Users, Active Tasks, Completed Tasks, Community Events, Volunteer Hours, Impact Points.

Sections: Users / Tasks / Applications / Community / Organizers / Reports / Badges / Categories / Payments / Settings

---

## 34. Database Entities

```
Users, Profiles, Roles
Tasks, Task Images, Applications, Assignments, Completion Evidence
Reviews, Transactions
Community Events, Participants, Check-ins, Event Evidence
Impact Transactions, Badges, User Badges
Notifications, Messages, Reports, Audit Logs
Categories
```

---

## 35. Authentication

- Registration, login, logout, password reset
- Protected routes, sessions, authorization
- One account → can post tasks AND work AND volunteer

---

## 36. Security

Server must validate all permissions. Users must NOT be able to modify from browser devtools:
- price, owner, task status, payment status, impact points, badge, role

---

## 37. UI Design Direction

- **Human** — Real tasks and real people
- **Local** — Nearby opportunities
- **Energetic** — People taking action
- **Trustworthy** — Money and reputation involved
- **Positive** — Community contribution feels rewarding
- **Modern** — Clean contemporary interface

Use: large task photos, rounded cards, strong typography, clear price indicators, location indicators, profile avatars, badge visuals, impact counters, subtle animations, strong CTA buttons.

---

## 38. What the UI Should NOT Look Like

❌ Giant corporate dashboards  
❌ Excessive tables  
❌ Boring gray forms  
❌ 20-field task creation forms  
❌ Generic Bootstrap appearance  
❌ Overly complicated navigation  
❌ Treating every feature as an admin panel  
❌ Excessive text  

---

## 39. Visual Language

- **Task marketplace**: photo-first
- **Community**: event-first
- **Profile**: achievement-first

Three sections have distinct visual identities (GET IT DONE / EARN / GIVE BACK) while belonging to the same brand.

---

## 40. Complete User Journeys

### Customer
Land → Register → Post Task → Upload Photo → Describe → Set Price → Publish → Receive Application → Check Worker Profile → Accept → Worker Completes → Completion Proof → Approve → Payment → Review

### Worker
Register → Set Skills → Find Task → View Photo → See Price → Apply → Get Accepted → Start → Complete → Upload Proof → Get Paid → Get Review

### Volunteer
Community → Find Event → View Details → Join → Check In → Participate → Submit Proof → Verification → Impact Points → Badge

---

## 41. What "DONE" Means

The project is NOT complete when buttons look good or fake cards appear.

It IS complete when:

**User A** can create an account → post a real task with a real image → store it in the database.

**User B** can create an account → find the task → apply.

**User A** can accept User B.

**User B** can upload completion evidence.

**User A** can approve it → transaction recorded → reviews created.

Either user can join a real community event → check in → have participation verified → earn impact points → earn badges → see everything on their profile.

**And all of this must survive: refresh → logout → login → server restart.**

---

## 42. Recommended MVP (CEP Presentation)

### Core Marketplace
- Registration/login, user profile
- Post task + upload image + set price
- Browse tasks, apply, accept worker
- Task status lifecycle
- Completion proof, reviews, demo payment

### Community
- Browse drives, create/join drive
- Check-in, verification
- Impact points, badges, profile impact

### Admin
- Users, tasks, community events
- Reports, basic statistics

---

## 43. The One-Sentence Description

> **"SAVJ is a community-powered platform where people can post local tasks by simply showing and describing what needs to be done with a price, other people can complete those tasks to earn money, and users can also participate in verified community activities to build their social and environmental impact."**

---

## 44. The 10-Second Explanation

> **"SAVJ connects people who need things done with people willing to do them, while rewarding users for giving back to their community."**

---

## 45. The Central SAVJ Loop

```
              PERSON
          /     |     \
      NEED IT  EARN IT  GIVE BACK
          |       |         |
       POST    WORK      JOIN
       TASK    TASK      DRIVE
          |       |         |
       GET IT   GET ₹   GET IMPACT
       DONE
                  ↓
            SAVJ PROFILE
           /              \
      REPUTATION          IMPACT
      Rating              Badges
      Reviews             Medals
      Work History        Volunteer Hours
```

**SAVJ helps you get things done, earn through your skills, and prove that you contribute to the community.**
