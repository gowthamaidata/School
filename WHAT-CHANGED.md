# Homework module — what changed

Extract this zip **over your existing repo folder**, keeping the folder
structure. It overwrites 15 files and adds 1 new one. Nothing is deleted.

```bash
cd /path/to/your/School        # your repo folder
unzip -o ~/Downloads/palli-homework-update.zip
mv palli-homework-update/* palli-homework-update/.[!.]* . 2>/dev/null
rm -rf palli-homework-update

npm install
npm run build                  # confirm it builds before pushing

git add -A
git commit -m "Add homework module — teachers post, parents see it instantly"
git push
```

Vercel redeploys automatically. Nothing to change in your environment
variables — homework works in demo mode like everything else.

---

## New file

| File | What it is |
|------|-----------|
| `src/app/(app)/homework/page.tsx` | The homework screen — composer on the left, the class's current work on the right, and a coverage strip for principals |

## Changed files

| File | Change |
|------|--------|
| `src/lib/data/types.ts` | Added `Homework` and `HomeworkCoverageRow` |
| `src/lib/data/seed.ts` | Realistic homework for the last 5 school days, written the way a TN teacher words it. Coverage is deliberately incomplete so the principal's alert has something to show |
| `src/lib/data/repository.ts` | `getHomework`, `getHomeworkForStudent`, `saveHomework`, `deleteHomework`, `getHomeworkCoverage` |
| `src/lib/data/supabase-repo.ts` | The same five methods against Postgres |
| `src/lib/auth/session.tsx` | New `assign_homework` capability — teachers, principal, correspondent. Office admin and parents cannot post |
| `src/lib/i18n/dictionary.ts` | ~30 new keys, English and Tamil |
| `src/components/app-shell.tsx` | Homework in the sidebar and the mobile tab bar, right after Attendance |
| `src/app/(app)/parent/page.tsx` | Homework card directly under the stats — the first thing a parent sees |
| `public/manifest.webmanifest` | "Assign homework" as a home-screen shortcut |
| `public/sw.js` | Cache version bumped to `palli-v2` |
| `supabase/01_schema.sql` | `homework` table + the `guards_section()` RLS helper |
| `supabase/02_rls.sql` | Read/write policies for homework |
| `README.md` | Now eight modules |
| `docs/DEMO_SCRIPT.md` | New WOW #6 |
| `docs/SUPABASE.md` | How the homework policy works and how to verify it |

---

## Who can do what

| Role | Homework |
|------|----------|
| Teacher | Posts for **their own sections only** |
| Principal / Correspondent | Posts for any class, and sees which classes have not posted today |
| Office admin | No access — they handle fees and records, not academics |
| Parent | Reads their child's section only, cannot post |

In production this is enforced in Postgres by `guards_section()`, not in the
app. A parent of a 6-B child cannot read 9-A's homework even if the UI had a
bug.

---

## If you have already run the Supabase SQL

Just run `01_schema.sql` and `02_rls.sql` again. Both are written to be
re-runnable — `create table if not exists`, `create or replace function`,
`drop policy if exists` — so nothing already in your database is dropped or
rewritten. If you have not set up Supabase yet, ignore this entirely.

---

## One thing to know about the service worker

Anyone who already installed the demo to their home screen is holding a
cached copy of the old app. The version bump in `sw.js` handles it, but the
new shell lands on their **second** visit after you deploy, not the first.
If you are about to demo on a phone that has the old version installed,
open it once beforehand, then close and reopen it.
