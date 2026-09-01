# Life Tracker — Personal Life OS

A full-stack, single-admin (extensible to multi-user) app to track your days,
goals, routines, media, time, money, and health — with AI-generated summaries
and a monthly emailed report.

## Stack (all free-tier to start)

| Piece            | Tech                          | Why |
|-------------------|--------------------------------|-----|
| Frontend + API    | Next.js 14 (App Router)       | one codebase, responsive by default, free on Vercel |
| Database          | PostgreSQL via Neon           | relational — needed for goals/streaks/monthly rollups |
| ORM               | Prisma                        | type-safe schema, easy migrations |
| Media storage     | Supabase Storage               | free tier, **no credit card required to sign up**, handles 0–100s of files/day |
| Auth              | NextAuth (Credentials)        | secure single login now, multi-user later without rewrite |
| AI                | Anthropic API (Claude)        | daily/monthly summaries, suggestions, categorization |
| Email             | Resend + Vercel Cron          | automatic monthly report on the 1st |
| Charts            | Recharts                      | time/money/health trend visualizations |

## What's built in this scaffold (Phase 0 + start of Phase 1)

- Full Prisma schema covering **every** feature you listed: days, meals, goals,
  routines, media, time logs, money logs, health logs, mood logs, hobby logs.
- Login (NextAuth + hashed password).
- Responsive dashboard shell (mobile + desktop nav).
- Today's log page (work done, meals, time wasted, notes) wired to a real API route.
- AI summary generation helper (`lib/ai.js`) — daily + monthly.
- Monthly email cron job wired to Resend + Vercel Cron.
- R2 signed-upload helper for photos/videos (upload straight from browser to storage).

## New features added

- **AI provider toggle** — every AI call (`lib/ai.js`) takes a `provider`
  ("claude" or "gemini"); the Quick Add widget has buttons to switch. Needs
  both `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` set to use both.
- **Private/hidden folder** (`app/hidden`) — PIN-protected (separate from your
  login password, bcrypt-hashed, stored on `User.hiddenPinHash`). Media items
  flagged `isHidden: true` only show here, never in the normal gallery.
- **Goal Maker** (`app/goals`) — add/track up to 50 goals/year with a progress
  slider; enforces the 50-goal cap server-side.
- **Sick-day / bad-day support** — "Having a bad/sick day" button generates a
  warm, non-clinical comforting message and logs a mood entry, without giving
  medical advice or pushing productivity when you're unwell.
- **Natural-language quick add** (`app/api/quick-add`) — type something like
  "Gym today done 1hr" and the AI classifies it (routine/work/goal/meal/
  time/money/health/mood/hobby) and writes it straight into the right table.
  Supports an attached photo URL too.

## Round 3 fixes/additions (design + bugs + new features)

1. **Login page redesigned** — gradient background, card layout, loading spinner on sign-in.
2. **AI crash fixed** — every AI function now defaults to `provider = "gemini"`; the Anthropic client is created lazily and only errors if you explicitly pick Claude without an API key set.
3. **Navbar added app-wide** (`components/Navbar.js`) — back button, all pages linked, logout button, and a working dark/light theme toggle (saved in localStorage, driven by CSS variables in `globals.css`).
4. **Loading indicators everywhere** — `components/Spinner.js` + `BusyButton` used on every async button (login, Quick Add, routine generation, reports) so clicks feel responsive instead of frozen.
5. **Dashboard rebuilt** (`/dashboard` + `/api/overview`) — real today's summary, top active goals with progress bars, a single combined "today" card (work/meals/time/hobby all in one place), and quick links.
6. **AI period summaries** (`/reports` + `/api/reports`) — pick Day / Week / Month / Year and any date; returns a summary, patterns noticed, and a concrete "key areas to improve" list.
7. **AI routine builder** (`/routine` + `/api/routine`) — describe your plan in plain text (like the schedule you shared), pick how many days it should run, and AI turns it into a checkable daily routine with streaks.
8. **Detailed task entries** (`/timelog` + `/api/task` + new `TaskEntry`/`TaskItem` tables) — log something like "DSA, 9pm, 90 min" with a sub-checklist of questions/items; combines with meals, mood, hobbies, and photos into one **full-day timeline** view.
9. **Reminders** (`components/Reminders.js`) — browser notifications: hourly nudge to log something, and a check on load for whether yesterday has zero entries. This only works while the app is open in a tab — a true background/push reminder needs a PWA/mobile app or a server push service (Firebase Cloud Messaging, OneSignal, etc.) — a bigger next step if you want it.

## Round 4 — architecture rework (schedule-based tracking)

Big shift: from freeform activity logging to a real **15-minute time-block schedule** — matching how you actually plan your day.

1. **Side drawer navigation** (`components/Navbar.js`) — hamburger menu, slides open/closed, all pages listed.
2. **Wasted time is now 100% auto-calculated** — `/api/schedule` sums every 15-min block you've filled, subtracts your sleep window (from profile), and whatever's left over in the 24 hours is wasted time. You never type a wasted-time number again.
3. **Day Schedule page** (`/schedule`) — the new core screen. Add time blocks (e.g. 9:00–9:15, "Deep work"), each can have a sub-checklist (e.g. DSA → 5 questions), each sub-item can carry a photo. A live timetable shows the whole day, styled like the schedule table you shared.
4. **Repeat schedule to week/month** — "Copy to week/month" button on `/schedule` duplicates a full day's blocks forward N days in one click.
5. **Office auto-fill + leave** — set default office hours/days in Settings; the office block auto-appears on workdays unless you mark that day as leave (`/schedule` → "Mark as leave").
6. **Onboarding + Settings** (`/onboarding`, `/settings`) — new users are walked through height/weight/salary/office hours/sleep window before their first dashboard view. Everything is editable later in Settings; salary changes are recorded in `SalaryHistory` with the date they took effect, so past months keep their original number.
7. **Downloadable/uploadable day template** — `/schedule` → "Download template" gets a CSV; fill it offline and "Upload filled CSV" brings it back in. Every row is validated before anything saves — if any row has a bad time or missing activity, **nothing is saved** and you get a specific error per row (e.g. "Row 3: invalid startTime").
8. **Filter & Export** (`/export`) — view or download (CSV) everything logged for any day/week/month/year.
9. **AI daily summary now actually wired up** — `/daily` has a "Generate" button that calls `/api/daily/summary`, which pulls the day's schedule + logs and saves a real AI summary to the day record. Errors (e.g. missing API key) now show on-screen instead of failing silently.
10. **Admin panel updated** — `ScheduleBlock` and `LeaveDay` added to the browsable/deletable types; `TaskEntry`/`TaskItem` removed (replaced by schedule blocks).

### Note on admin privacy
Admin access was already restricted to only you — there's no signup form, and every query is scoped to the logged-in user's ID. No code change was needed there; flagging this explicitly since you asked.

## Round 5 — real bug fixes + the full 13-point list + new asks

### Real bugs found and fixed (not guesses — traced from your actual error logs)
- **`gemini-3.5-flash`** — confirmed real and current (Gemini 2.0/2.5 were retired). Updated everywhere.
- **`/api/timelog` crash** — root cause was a leftover `prisma.taskEntry` call from before `TaskEntry` was replaced by `ScheduleBlock` in Round 4. I never updated this one file. Fixed, and audited the whole codebase for any other leftover references (found none).
- **Literal `\u2013`/`\u2014` unicode escapes** — several new files had escape sequences that don't work inside JSX text (only inside JS strings). Found and fixed across every file.

### The 13 points
1. **Week/Month/Year view** (`/calendar`) — list of days (week/month) or months (year), click any entry to open that date's full 24-hour schedule on `/schedule`.
2. **Create/edit/delete, backdated** — `/schedule` date picker lets you view/add/delete any date; each block has a delete button.
3. **Time tracker** — auto-calculated worked/wasted/sleep from schedule blocks vs. profile sleep window, unchanged from Round 4, now with the crash fixed.
4. **Goal cap removed** — goals are unlimited now, no hardcoded 50.
5. **Categories + daily photo tracking** — `Category` model, create freely or paste a list ("1. DSA 2. System Design...") to bulk-create; pick per block; each block can carry a photo.
6. **AI reports filterable by category** — `/reports` now has a category dropdown alongside the day/week/month/year picker.
7. **Task upload form** — time + category + description + sub-checklist + photo, all in one form on `/schedule`.
8. **Review-before-save popup** — "Review & Save" opens a confirm modal showing exactly what will be saved, with Edit (go back) and Save buttons.
9. **AI summary + improvement suggestions per period** — unchanged from Round 4, still working, now with real error surfacing if it fails.
10. **Time-wise detail per day/week/month** — `/calendar` (list) + `/schedule` (full day timetable) together cover this.
11. **Design pass** — side drawer, dark/light theme, spinners, and now a proper error-toast system — genuinely more polished than Round 4, though a from-scratch visual redesign (matching your mockup's card style) is still a good next step if you want it.
12. **Reminders, corrected** — in-app notification bell (`components/NotificationBell.js`, `/api/notifications`) shows missed days + stale-goal suggestions right in the navbar; separately, `/api/cron/missed-days` runs daily and emails only once 3 consecutive days are missed (de-duped so it won't spam every day after that).
13. **Smooth UI with real error handling** — `components/Toast.js` gives every AI/save call a proper error popup with a **Retry** button instead of a stuck spinner forever. Wired into Quick Add, Schedule, and Reports; extending to every remaining form is the next incremental step.

### New from this round
- **"Got a free hour" generator** replaces the sick/bad-day button — pulls your last 7 days of activity and suggests something specific and engaging (study-adjacent or just for fun), not generic advice.
- **Time-conflict detection** — Quick Add now parses a stated time range (e.g. "Gym 3pm to 4pm") and checks it against your existing schedule for that day; if it overlaps something, you get a specific error instead of a silent double-booking. Same check runs server-side on `/schedule` too, so it can't be bypassed.
- **11:30 PM daily auto-summary** (`/api/cron/daily-summary`) — generates and saves an AI summary automatically every night, same engine as the manual button, no press needed.

### ⚠️ Timezone note on cron jobs
Vercel cron schedules run in **UTC**. `"30 23 * * *"` (11:30 PM) is UTC time, not your local time. If you're in India (IST, UTC+5:30), you'll need to shift this — e.g. for 11:30 PM IST, use `"0 18 * * *"` in `vercel.json`. Flagging this now so the "11:30 PM" summary doesn't quietly run at the wrong hour.

## Round 6 — sidebar always-on, Money split from BMI

1. **Persistent desktop sidebar** — on desktop (md breakpoint and up), the drawer is now always visible on the left, not a popup. A small "⟨⟨" button lets you hide it (saved in localStorage), with a "⟩⟩" button to bring it back. On mobile, it's still the slide-open/close drawer from before.
2. **Money is now its own page** (`/money`, replacing `/timemoney`) — separate from BMI, which stays on `/health`. Daily entry for amount spent, amount saved, an optional category (Food/Rent/Shopping/etc.), notes. Shows total spent, total saved, a daily-spend bar chart, and a **cumulative savings line chart** so you can actually see your savings grow over time. The old manual "time wasted/productive" fields were removed from this page since time is already auto-calculated from your schedule — no more double entry.

### Also fixed this round
Found and removed several stray, empty, incorrectly-named directories (e.g. a literal folder named `{media,health,...}`) left over from earlier `mkdir` commands that used brace-expansion syntax my shell tool doesn't support the way I assumed. They were empty and harmless, but cleaned up for a tidy repo.

## Status: schema changed again — re-run `npx prisma migrate dev` (MoneyLog.wasted renamed to MoneyLog.spent, plus a category field).

- ✅ Login, responsive dashboard shell
- ✅ Today's log (work/meals/time/notes)
- ✅ Goal Maker (`/goals`) — 50/year cap, progress sliders
- ✅ Media gallery (`/media`) — direct-to-R2 upload, photo or video
- ✅ Private folder (`/hidden`) — separate PIN, hidden media never shows in normal gallery
- ✅ Time & Money (`/timemoney`) — daily log + bar charts (wasted vs. productive/saved)
- ✅ Health (`/health`) — height/weight → auto BMI, mood picker, weight trend chart
- ✅ Monthly Report (`/reports`) — on-demand AI summary (Claude or Gemini) + automatic email on the 1st via cron
- ✅ Admin panel (`/admin`) — browse and permanently delete any record, by type
- ✅ Quick Add on the dashboard — natural-language entry, auto-categorized by AI, with sick/bad-day support

## What's still manual/left for polish (not blocking)

- Prisma migration needs to actually be run against your Neon DB (`npx prisma migrate dev`)
- Bootstrap script for creating your first admin user (bcrypt-hash a password into `User`)
- Routine/streak UI (schema + logic exist in `Routine`/`RoutineLog`, no page yet)
- Auto-categorization is done at quick-add time; a "browse by month/category" view over everything is a nice future add
- Styling pass — current theme is functional dark mode, not final polish

## Setup

```bash
npm install
cp .env.example .env   # fill in the values below
npx prisma migrate dev --name init
npm run dev
```

### Environment variables (`.env`)

```
DATABASE_URL=            # from Neon (neon.tech, free)
NEXTAUTH_SECRET=         # random string, e.g. `openssl rand -base64 32`
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=       # from console.anthropic.com
RESEND_API_KEY=          # from resend.com
CRON_SECRET=             # random string, checked by the monthly cron route
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
```

### Creating your admin login

After `prisma migrate dev`, create yourself a user with a bcrypt-hashed
password (a one-off script or `prisma studio` works fine for this single-user setup).

## Deploying

Push to GitHub → import into Vercel → add the env vars above → deploy.
`vercel.json` already schedules the monthly email cron for the 1st of each month.

## Design notes

- Dark, minimal theme (`tailwind.config.js`) tuned for daily journaling use.
- Mobile-first layout: nav wraps, cards stack to 1 column under `sm`.
- Every table is scoped by `userId` from day one, so adding a second user later
  is a permissions change, not a schema change.
