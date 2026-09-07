# Palli — School Management for Tamil Nadu

Mobile-first school management for Tamil Nadu private schools. Attendance in
under 30 seconds, parent updates on WhatsApp, fee tracking with printable
receipts, and one-click report cards — in **English and தமிழ்**.

Built to be demoed on a phone in a principal's office, and to run for ₹0/month
until a school signs.

---

## What's in it

Eight modules:

| # | Module | What it does |
|---|--------|--------------|
| 1 | **Principal dashboard** | Today's attendance %, fee collection vs target, low-attendance alerts, classes still unmarked, collection trend |
| 2 | **Attendance** | Three-tap marking per student, live stopwatch, works offline, flags students below 75% |
| 3 | **Fees** | Per-term tracking, record payments, printable receipts, one-tap reminders to every pending family |
| 4 | **Parent messages** | Compose once, deliver to the app + WhatsApp + SMS, with read/delivery tracking |
| 5 | **Exams & marks** | Subject-by-subject entry, live class average and pass %, auto grades |
| 6 | **Report cards** | A4 print-ready progress report with rank, grades, attendance and signature blocks |
| 7 | **Directories & roles** | Students, staff, and five roles with different access — enforced in the database |
| 8 | **Homework** | Teachers post the day's work per class; parents see it instantly. Principals see which classes have not posted |

Plus: bilingual EN/தமிழ் throughout, light and dark themes, and installable as
an app on any Android phone, iPhone or desktop.

### 2026 UI refresh

The app now ships with a full soft-pastel UI system:

- Cream/off-white base with mint, lavender, peach, sky and butter accents
- Generous rounded corners across cards, inputs, buttons, nav and modals
- Lightweight frosted-glass surfaces and diffused shadows
- Rounded, friendly typography (Nunito + Quicksand + Noto Sans Tamil)
- Animated page transitions, staggered list reveals, shimmer skeletons, and
  animated dashboard counters/progress indicators

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. It runs immediately on built-in sample data for a
fictional 521-student Coimbatore matriculation school — no database, no signup,
no internet needed. Pick any role on the sign-in screen.

---

## The two data modes

This is the important idea in the codebase.

| Mode | What it uses | When |
|------|--------------|------|
| `demo` *(default)* | Built-in seeded dataset held in memory | Demos, development, walking into a school with no wifi |
| `supabase` | Your Postgres database with Row-Level Security | Once a school signs |

Set it in `.env.local`:

```bash
NEXT_PUBLIC_DATA_MODE=demo
# Optional in supabase mode; controls dashboard term-based fee metrics
NEXT_PUBLIC_CURRENT_TERM=1
```

Every component talks to `src/lib/data/repository.ts` and nothing else. That file
picks the implementation. **Switching modes needs no component changes** — see
[`docs/SUPABASE.md`](docs/SUPABASE.md) for going live.

The demo data is deterministic: it is generated from a fixed seed, so the numbers
you rehearse with are the numbers the principal sees. Changes you make during a
demo (marking a class, recording a payment) persist until you reload the tab.

---

## Deploying

Full walkthrough in [`docs/DEPLOY.md`](docs/DEPLOY.md). The short version:

1. Push this repo to GitHub
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Add one environment variable: `NEXT_PUBLIC_DATA_MODE` = `demo`
4. Deploy

You get a live HTTPS URL in about 90 seconds. Free tier, no card.

---

## Cost to run

| Service | Free tier | You pay when |
|---------|-----------|--------------|
| Vercel | 100 GB bandwidth/month | Never, at demo scale |
| Supabase | 500 MB Postgres, 50k users | First school signs (~$25/mo) |
| GitHub | Unlimited private repos | Never |
| WhatsApp Business API | 1,000 conversations/month | Beyond ~1 school's messaging |

**Demo mode costs ₹0/month**, because it needs no database at all.

---

## Tech

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — one repo, no separate backend
- **Tailwind CSS** with a token-based design system
- **Supabase** (Postgres + Auth + RLS) for production data
- **PWA** — installable, offline-capable, no app store fees
- No UI framework dependency; the component primitives are in `src/components/ui`

Multi-tenancy is one shared database with `school_id` on every table and
Row-Level Security filtering on it. Enforced in Postgres, not in application
code — a bug in the UI cannot leak one school's data to another.

---

## Project layout

```
src/
├── app/
│   ├── page.tsx              Sign-in / role picker
│   └── (app)/                Everything behind auth
│       ├── dashboard/        Principal view
│       ├── attendance/       Teacher marking
│       ├── students/         Directory + profiles
│       ├── fees/             Collection + receipts
│       ├── exams/            Marks entry
│       ├── report-card/[id]/ Printable A4 report
│       ├── communication/    Parent announcements
│       ├── homework/         Daily work per class
│       ├── staff/            Staff directory
│       ├── parent/           Parent portal
│       └── settings/         Language, theme, install
├── components/
│   ├── ui/                   Design-system primitives
│   └── app-shell.tsx         Sidebar, mobile nav, route guard
└── lib/
    ├── data/
    │   ├── types.ts          Domain model
    │   ├── seed.ts           Deterministic demo dataset
    │   ├── repository.ts     The interface everything uses
    │   └── supabase-repo.ts  Production implementation
    ├── i18n/                 EN/தமிழ் dictionary + provider
    └── auth/session.tsx      Roles and capabilities

supabase/
├── 01_schema.sql             Tables, enums, triggers, helper functions
├── 02_rls.sql                Row-Level Security policies
└── 03_seed.sql               Starter reference data for a real school

docs/
├── DEPLOY.md                 GitHub → Vercel
├── SUPABASE.md               Going live with a real school
├── DEMO_SCRIPT.md            The 20-minute principal demo
└── CUSTOMISE.md              Rebranding for a specific school
```

---

## Scripts

```bash
npm run dev         # Development server
npm run build       # Production build
npm start           # Serve the production build
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
```

CI runs typecheck, lint and build on every push — see `.github/workflows/ci.yml`.

---

## Before a real school uses this

Demo mode is a sales tool. Production needs three things wired up, in this order:

1. **Supabase** — run the three SQL files, import the student roll ([`docs/SUPABASE.md`](docs/SUPABASE.md))
2. **WhatsApp Business API** — the app records intent to send; actual dispatch belongs in a server route so the token never reaches the browser
3. **Razorpay** — for parents paying fees in-app rather than the office recording them

The Supabase adapter in `src/lib/data/supabase-repo.ts` is written against the
schema but has not yet been exercised against a live project. Expect to verify a
column name or two, not to rewrite it.
