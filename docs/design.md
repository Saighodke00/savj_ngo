# SAVJ — Design System

> This document defines the complete visual language, component library,
> and design principles for SAVJ across mobile (Flutter) and web (Next.js).

---

## 1. Brand Identity

**Product Name:** SAVJ

**Tagline:** "Earn. Contribute. Build your community."

**Core personality:**
- Trustworthy — not flashy or gimmicky
- Community-oriented — warm without being childish
- Environmental — connected to nature/green without greenwashing
- Professional — suitable for a real earning platform
- Accessible — readable at any skill or tech level

---

## 2. Color Palette

### Primary Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `primary-600` | `#2563EB` | 37, 99, 235 | Primary action buttons, links, active nav |
| `primary-500` | `#3B82F6` | 59, 130, 246 | Hover states, badges |
| `primary-100` | `#DBEAFE` | 219, 234, 254 | Chips, tags, badges background |
| `primary-50`  | `#EFF6FF` | 239, 246, 255 | Section backgrounds |

### Community / Environment Colors

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `green-600` | `#16A34A` | 22, 163, 74 | Volunteer, community, impact elements |
| `green-500` | `#22C55E` | 34, 197, 94 | Progress indicators, eco stats |
| `green-100` | `#DCFCE7` | 220, 252, 231 | Community badges, event chips |
| `green-50`  | `#F0FDF4` | 240, 253, 244 | Community section backgrounds |

### Status Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `status-open`       | `#2563EB` | Task status: OPEN |
| `status-matched`    | `#9333EA` | Task status: MATCHED |
| `status-progress`   | `#D97706` | Task status: IN_PROGRESS |
| `status-review`     | `#0891B2` | Task status: SUBMITTED_FOR_REVIEW |
| `status-completed`  | `#16A34A` | Task status: COMPLETED |
| `status-cancelled`  | `#6B7280` | Task status: CANCELLED |
| `status-disputed`   | `#DC2626` | Task status: DISPUTED |

### Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-950` | `#0A0A0A` | Primary text (dark) |
| `neutral-900` | `#171717` | Headings |
| `neutral-700` | `#404040` | Body text |
| `neutral-500` | `#737373` | Secondary text, placeholders |
| `neutral-300` | `#D4D4D4` | Borders, dividers |
| `neutral-200` | `#E5E5E5` | Input borders |
| `neutral-100` | `#F5F5F5` | Card backgrounds |
| `neutral-50`  | `#FAFAFA` | Page backgrounds |
| `white`       | `#FFFFFF` | Cards, surfaces |

### Alert Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `error-600`   | `#DC2626` | Error messages |
| `error-50`    | `#FEF2F2` | Error background |
| `warning-600` | `#D97706` | Warnings, urgency |
| `warning-50`  | `#FFFBEB` | Warning background |
| `success-600` | `#16A34A` | Success messages |
| `success-50`  | `#F0FDF4` | Success background |
| `info-600`    | `#2563EB` | Info messages |
| `info-50`     | `#EFF6FF` | Info background |

### AI Suggestion Color (distinct, clearly not action)

| Token | Hex | Usage |
|-------|-----|-------|
| `ai-accent`  | `#7C3AED` | AI suggestion labels, AI badge |
| `ai-bg`      | `#F5F3FF` | AI suggestion card background |
| `ai-border`  | `#C4B5FD` | AI suggestion card border |

---

## 3. Typography

**Font families:**

| Role | Font | Fallback |
|------|------|---------|
| Heading | `Inter` | `system-ui`, `sans-serif` |
| Body | `Inter` | `system-ui`, `sans-serif` |
| Monospace | `JetBrains Mono` | `monospace` |

**Scale (web — rem, mobile — sp):**

| Token | Size | Weight | Line-height | Usage |
|-------|------|--------|-------------|-------|
| `display-lg` | 36px / 28sp | 700 | 1.1 | Hero headings |
| `display-sm` | 28px / 24sp | 700 | 1.2 | Page titles |
| `heading-lg`  | 22px / 20sp | 600 | 1.3 | Section headings |
| `heading-md`  | 18px / 18sp | 600 | 1.4 | Card titles |
| `heading-sm`  | 16px / 16sp | 600 | 1.4 | Sub-headings |
| `body-lg`     | 16px / 16sp | 400 | 1.6 | Body copy |
| `body-md`     | 14px / 14sp | 400 | 1.6 | Standard text |
| `body-sm`     | 12px / 12sp | 400 | 1.5 | Captions, meta |
| `label`       | 14px / 14sp | 500 | 1.4 | Form labels |
| `button`      | 14px / 14sp | 600 | 1   | Button text |
| `badge`       | 11px / 11sp | 600 | 1   | Status badges |

---

## 4. Spacing System

8-point grid system.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px  | Tiny gaps within components |
| `space-2` | 8px  | Component internal padding (small) |
| `space-3` | 12px | List item padding |
| `space-4` | 16px | Standard component padding |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section padding (horizontal) |
| `space-8` | 32px | Section vertical spacing |
| `space-10`| 40px | Large section gaps |
| `space-12`| 48px | Page vertical sections |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm`  | 4px  | Badges, chips, tags |
| `radius-md`  | 8px  | Input fields, buttons |
| `radius-lg`  | 12px | Cards |
| `radius-xl`  | 16px | Bottom sheets, modals |
| `radius-full`| 9999px | Avatars, pill badges |

> **Rule:** Do NOT make every element rounded like a toy app.
> Cards use `radius-lg` (12px). Buttons use `radius-md` (8px). Inputs use `radius-md`.
> Avatars use `radius-full`. Containers use `radius-sm` or `radius-md` only.

---

## 6. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift (chips, tags) |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.07)` | Cards |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.10)` | Floating elements, dropdowns |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.12)` | Modals, bottom sheets |

---

## 7. Components

### 7.1 Buttons

**Primary Button** (main actions: Publish, Apply, Join, Accept)
```
Background: primary-600
Text: white  |  Font: button (14px, 600)
Padding: 12px 24px  |  Radius: radius-md
Height: 48px (mobile), 44px (web)
Hover: primary-500  |  Active: primary-700
Disabled: neutral-300 bg, neutral-500 text
```

**Secondary Button** (less important: Cancel, View Details)
```
Background: white
Border: 1px solid neutral-300
Text: neutral-900  |  Font: button
Padding: 12px 24px  |  Radius: radius-md
Hover: neutral-50
```

**Community Button** (join event, volunteer actions)
```
Background: green-600
Text: white  |  same sizing as primary
Hover: green-700
```

**Danger Button** (delete, ban)
```
Background: error-600
Text: white
Only used in admin dashboard and destructive confirmations
```

**Ghost Button / Text Button**
```
No background, no border
Text: primary-600
Padding: 8px 12px
Used for: inline links, secondary navigation actions
```

**Icon Button** (floating, map actions)
```
Background: white  |  Shadow: shadow-md
Border: 1px solid neutral-200
Radius: radius-md
Width/Height: 44px (mobile min tap target ≥ 48dp with padding)
```

---

### 7.2 Task Card

```
┌────────────────────────────────────────┐
│ [Photo 16:9 ratio, radius top-lg]      │
├────────────────────────────────────────┤
│ 🏷 Backyard Cleaning          [URGENT] │
│ Remove leaves and plastic waste…       │
│                                        │
│ ₹200        📍 1.8 km        Today    │
│                                        │
│ ⭐ Customer 4.7   •  Posted 2h ago     │
└────────────────────────────────────────┘
Background: white
Shadow: shadow-md
Radius: radius-lg
Padding: 0 (image flush) + space-4 (content)
```

**Status badge** (top-right corner of card):
```
OPEN:      primary-100 bg, primary-600 text
MATCHED:   purple-100 bg, purple-600 text
IN PROGRESS: warning-50 bg, warning-600 text
COMPLETED:  success-50 bg, success-600 text
```

---

### 7.3 Community Event Card

```
┌────────────────────────────────────────┐
│ [Cover Image]                          │
│              🌿 LAKE CLEANUP DRIVE     │
├────────────────────────────────────────┤
│ 📅 Saturday, 8:00 AM                  │
│ 📍 Local Lake  •  3.2 km away         │
│ 👥 42 / 60 volunteers                  │
│ 🎯 Expected: 100 kg waste removed      │
│                                        │
│ [Join Drive]                           │
└────────────────────────────────────────┘
Border-left: 3px solid green-600 (accent)
```

---

### 7.4 Profile Summary Card

```
┌────────────────────────────────────────┐
│  [Avatar 56px]  Name                   │
│                 Bio line               │
│                 📍 Location            │
├────────────────────────────────────────┤
│  WORK REPUTATION      CIVIC IMPACT     │
│  ★ 4.8                🌱 37 hrs        │
│  42 tasks             15 drives        │
│  96% completion       847 pts          │
└────────────────────────────────────────┘
```

> **Rule:** Never combine work and civic scores into one number.
> They are displayed in two separate columns with different colors.
> Work: `primary-600` accents. Civic: `green-600` accents.

---

### 7.5 AI Suggestion Card

```
┌─────────────────────────────────────── ┐
│ 🤖 AI Analysis  (Suggestion only)       │
│ ─────────────────────────────────────  │
│ Category:  Backyard Cleaning            │
│ Objects:   leaves • plastic • grass     │
│ Complexity: Medium                      │
│ Price range: ₹150 – ₹300               │
│ Confidence: High                        │
│                                         │
│ [Use suggestion]   [Change manually]    │
└─────────────────────────────────────── ┘
Background: ai-bg (#F5F3FF)
Border: 1px solid ai-border
Border-left: 3px solid ai-accent
```

**Rule:** AI suggestion card must use `ai-accent` purple, never primary blue.
This ensures users always know AI output is separate from their own actions.

---

### 7.6 Badge Component

```
┌─────────┐
│  [Icon] │  Badge name
│   🌿    │  Description
│         │  Rarity: ★ Rare
└─────────┘
Locked badges: neutral-200 bg, neutral-400 icon (grayscale)
Unlocked badges: full color, gold border for medals
```

---

### 7.7 Status Badge (Inline)

```
OPEN         → bg: primary-100,  text: primary-700,  dot: primary-500
IN PROGRESS  → bg: warning-50,   text: warning-700,  dot: warning-500
COMPLETED    → bg: success-50,   text: success-700,  dot: success-500
CANCELLED    → bg: neutral-100,  text: neutral-600,  dot: neutral-400
DISPUTED     → bg: error-50,     text: error-700,    dot: error-500
```

---

### 7.8 Input Fields

```
Label: label (14px, 500) — neutral-700 — above input
Input:
  Height: 48px (mobile), 44px (web)
  Padding: 12px 16px
  Border: 1px solid neutral-200
  Radius: radius-md
  Background: white
  Placeholder color: neutral-400
  Focus: border primary-500, box-shadow 0 0 0 3px primary-100
  Error: border error-600, box-shadow 0 0 0 3px error-50
Error message: body-sm, error-600, below input
Helper text: body-sm, neutral-500, below input
```

---

### 7.9 Navigation

**Mobile Bottom Nav:**
```
5 tabs: Home | Tasks | Community | Notifications | Profile
Active tab: primary-600 icon + label
Inactive: neutral-400
Badge on Notifications: error-600, white number
```

**Web Top Nav:**
```
Logo + nav links + CTA "Post a Task" (primary button)
Mobile: hamburger → slide-in drawer
```

**Admin Sidebar:**
```
Fixed left sidebar, 240px wide
Dark background: neutral-900
Active item: primary-500 left border + primary-50 background
Sections separated by neutral-700 dividers
```

---

### 7.10 Forms

**Multi-step form (task creation):**
```
Step indicator at top:
  ● ─── ● ─── ○ ─── ○ ─── ○
  1     2     3     4     5
  Photo AI    Desc  Budget Publish

Active: primary-600
Completed: success-600 with checkmark
Incomplete: neutral-300
```

**Validation:**
- Show errors inline, not as toast-only
- Real-time validation on blur (not on every keystroke)
- Submit button disabled until required fields valid

---

## 8. Loading States

**Skeleton screens** (preferred over spinners for list views):
```
Background: neutral-100
Shimmer: animated gradient left → right
Use for: task cards, event cards, profile sections
```

**Spinner** (for actions):
```
Size: 24px
Color: primary-500
Use for: button loading states, page transitions
```

**Pull-to-refresh** (mobile):
```
Standard Flutter RefreshIndicator
Color: primary-500
```

---

## 9. Empty States

```
┌────────────────────────────────────────┐
│                                        │
│         [Illustration SVG]             │
│                                        │
│   No nearby tasks right now.           │
│   Be the first to post one!            │
│                                        │
│         [Post a Task]                  │
│                                        │
└────────────────────────────────────────┘
Illustration: simple, line-art style, 200px
Heading: heading-md, neutral-700
Body: body-md, neutral-500
CTA: optional primary button
```

Every empty state must have:
1. A relevant illustration (not a generic spinner)
2. A contextual message (not just "No items found")
3. An action to get out of the empty state (where applicable)

---

## 10. Error States

**Inline field error:**
```
Text: body-sm, error-600
Icon: ⚠ before text
Below the field, not as toast
```

**Full-page error:**
```
Icon: large, neutral-300 error icon
Heading: "Something went wrong"
Body: human-readable message (not stack trace)
Action: [Try Again] button
```

**Network error / offline banner:**
```
Fixed banner at top of screen (mobile) or snackbar
Background: warning-600
Text: white
Content: "You're offline. Showing cached content."
```

**404:**
```
"This page doesn't exist."
[Go Home] button
```

**403:**
```
"You don't have permission to view this."
[Go Back] button
```

---

## 11. Animations

**Rule:** Animations must improve understanding, not decorate.

**Allowed:**
- Screen transition: 300ms fade or slide (subtle)
- Card press: 100ms scale-down (0.97)
- Button press: 100ms scale-down (0.95)
- List item appear: 200ms fade-in + 4px translate-y (staggered for first 5 items)
- Bottom sheet: 300ms slide-up
- Badge unlock: confetti particle effect (one-time, then off)
- Status badge: cross-fade on status change

**Not allowed:**
- Loops that distract
- Transitions > 400ms on any interactive element
- Animations that block content loading visibility

---

## 12. Accessibility

**Mobile (Flutter):**
- All interactive elements: `Semantics` widget with label
- Min tap target: 48×48dp (enforced via button sizes)
- Text never below 12sp
- Do not rely on color alone for status (always include text or icon)

**Web (Next.js):**
- All images: `alt` attribute
- All icons used as standalone controls: `aria-label`
- All form inputs: `<label for="">` association
- Focus ring visible (not hidden)
- Keyboard navigable: Tab order logical
- Contrast ratio: ≥ 4.5:1 for body text, ≥ 3:1 for large text

**Color blindness:**
- Status badges always include text label (not color only)
- Charts include patterns in addition to color
- AI suggestion card uses both color and icon to differentiate

---

## 13. Responsive Breakpoints (Web)

| Token | Width | Usage |
|-------|-------|-------|
| `sm`  | 640px  | Mobile landscape |
| `md`  | 768px  | Tablet |
| `lg`  | 1024px | Desktop |
| `xl`  | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

**Admin dashboard:** Desktop-first (lg+). Collapses at sm/md with hamburger.
**Public pages:** Mobile-first. Full grid at lg+.

---

## 14. Dark Mode

**Web:** System preference respected via `prefers-color-scheme`. Manual toggle in profile settings.
**Mobile:** System preference respected. Manual override in app settings.

Dark mode color adjustments:
```
Background: neutral-950 (not pure black)
Card surfaces: neutral-900
Borders: neutral-800
Body text: neutral-100
Secondary text: neutral-400
Primary actions: primary-400 (lighter for contrast on dark bg)
Green: green-400
```

---

## 15. Illustration Style

- Line-art with sparse fills (not flat cartoons, not realistic)
- Human figures present but simple (community, helping)
- Nature elements (leaves, water, plants) for community screens
- City/neighborhood elements (houses, streets) for task screens
- Color: use brand primary and green accents, neutral strokes
- Format: SVG (scalable, accessible with alt text)

---

## 16. Icons

**Source:** `lucide-react` (web), `lucide-flutter` or material icons (mobile)
**Size:** 20px web standard, 24px mobile standard, 16px for inline text icons

Key icon mappings:
```
Task / Work:     briefcase, wrench, clipboard
Community:       users, heart, leaf, recycle
Location:        map-pin, navigation
Budget / Money:  indian-rupee (₹), wallet
Rating:          star, star-half
Time:            clock, calendar
Photo:           camera, image
Check-in:        check-circle, qr-code
Badge:           award, medal
Profile:         user, user-circle
Admin:           shield, settings
Notification:    bell
```
