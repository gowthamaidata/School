# Going live with a real school

Do this **after** a school has signed, not before. Demo mode costs nothing;
Supabase Pro is ~$25/month, and there's no reason to pay it while you're still
selling.

Budget half a day for the first school.

---

## 1. Create the project

1. Sign up at <https://supabase.com> (free tier is fine to start)
2. **New project** → name it after the school
3. **Region: Mumbai (`ap-south-1`)** — this matters for latency and for being
   able to tell a principal their data is stored in India
4. Save the database password somewhere safe; you cannot recover it later

### The free-tier pause

Supabase pauses free projects after 7 days of inactivity, and resuming takes
2–5 minutes. If a principal asks for a demo tomorrow and your project is
paused, you are standing there watching a spinner.

Two defences:

- Keep demos on `NEXT_PUBLIC_DATA_MODE=demo`, which needs no database at all
- Set up a free <https://uptimerobot.com> monitor pinging your app every 5
  minutes, which keeps the project awake

Once a school is paying, upgrade to Pro and the problem disappears.

---

## 2. Run the SQL

Supabase Dashboard → **SQL Editor** → **New query**. Run these in order,
one file at a time, checking each succeeds before the next:

1. `supabase/01_schema.sql` — tables, enums, triggers, RLS helper functions
2. `supabase/02_rls.sql` — the Row-Level Security policies
3. `supabase/03_seed.sql` — subjects, sections, fee terms, exam calendar
   (**edit the school details at the top before running**)

### Verify RLS is actually on

This is the check that matters. Run:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

**Every application table must show `rowsecurity = true`.** Any table showing
`false` is readable by anyone who opens devtools and copies your anon key. If
you see a `false`, re-run `02_rls.sql` and find out why it didn't apply.

### Add the attendance summary view

`getLowAttendanceStudents` and the dashboard's low-attendance count both read a
view. Create it:

```sql
create or replace view attendance_summary as
select
  school_id,
  student_id,
  count(*) filter (where status <> 'absent') as present,
  count(*) filter (where status = 'absent')  as absent,
  count(*) filter (where status = 'late')    as late,
  count(*)                                   as total,
  round(100.0 * count(*) filter (where status <> 'absent')
        / nullif(count(*), 0), 1)            as percentage
from attendance
group by school_id, student_id;

-- Views don't inherit RLS from their tables; make it respect the caller.
alter view attendance_summary set (security_invoker = on);
```

That last line is important. Without it the view runs as its owner and
bypasses every policy underneath.

---

## 3. Create the first login

Supabase Dashboard → **Authentication → Users → Add user**. Create the
principal's account with a real email and a temporary password.

Copy the new user's UUID, then in the SQL editor:

```sql
insert into profiles (id, school_id, full_name, role, designation, email)
values (
  '<paste-the-auth-user-uuid>',
  (select id from schools limit 1),
  'Lalitha Raghavan',
  'principal',
  'Principal',
  'principal@theschool.in'
);
```

The `profiles.id` **must** equal the `auth.users.id`. Every RLS policy resolves
the caller's school through that link, so if it's wrong the user will sign in
successfully and then see nothing at all.

Repeat for the office admin and each class teacher. For teachers, also set them
as class teacher of their section:

```sql
update sections
set class_teacher_id = '<teacher-profile-uuid>'
where standard = 8 and section = 'A';
```

That is what lets a teacher write attendance for 8-A and nothing else.

---

## 4. Import the student roll

The school's data is in Excel. That is normal and it is fine.

**Step 1** — get a clean CSV with these columns:

```
admission_no, name, name_ta, standard, section, roll_no, gender, dob,
father_name, mother_name, guardian_phone, address, blood_group
```

**Step 2** — import into a staging table:

```sql
create table staging_students (
  admission_no text, name text, name_ta text,
  standard int, section text, roll_no int,
  gender text, dob date, father_name text, mother_name text,
  guardian_phone text, address text, blood_group text
);
```

Then Dashboard → **Table Editor → staging_students → Import data from CSV**.

**Step 3** — move it into `students`, resolving the section:

```sql
insert into students (
  school_id, section_id, admission_no, name, name_ta, roll_no,
  gender, dob, father_name, mother_name, guardian_phone,
  address, blood_group, admitted_on, active
)
select
  sec.school_id, sec.id, t.admission_no, t.name, t.name_ta, t.roll_no,
  upper(left(t.gender, 1)), t.dob, t.father_name, t.mother_name,
  t.guardian_phone, t.address, t.blood_group, current_date, true
from staging_students t
join sections sec
  on sec.standard = t.standard
 and sec.section  = t.section
 and sec.school_id = (select id from schools limit 1)
on conflict (school_id, admission_no) do nothing;

drop table staging_students;
```

**Step 4** — generate this term's fee records:

```sql
insert into fee_records (school_id, student_id, term, amount_due, due_date)
select s.school_id, s.id, f.term, f.amount, f.due_date
from students s
join sections sec on sec.id = s.section_id
join fee_structures f
  on f.school_id = s.school_id and f.standard = sec.standard
where s.active
on conflict (student_id, term) do nothing;
```

**Step 5** — link parents to children, once parent accounts exist:

```sql
insert into guardians (school_id, profile_id, student_id, relation)
values (
  (select id from schools limit 1),
  '<parent-profile-uuid>',
  '<student-uuid>',
  'father'
);
```

---

## 5. Point the app at it

`.env.local` for local work, and Vercel → **Settings → Environment Variables**
for production:

```bash
NEXT_PUBLIC_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Get both from Supabase → **Project Settings → API**.

> **The anon key is safe in the browser** — that is what it's for, and it is why
> RLS has to be correct. The **service role key is not**. It bypasses every
> policy. Never put it in a `NEXT_PUBLIC_` variable, never import it into
> anything under `src/`, and only use it in server-side code.

Redeploy. The app now reads and writes real data.

---

## 6. Verify before letting anyone in

Work through this properly. A tenancy bug found by a customer is not
recoverable.

- [ ] Sign in as the principal — the dashboard shows the real student count
- [ ] Sign in as a teacher — they can mark attendance **only** for their section
- [ ] As that teacher, try to write attendance for another section; it must fail
- [ ] Sign in as a parent — they see exactly one child, and no fee data for others
- [ ] Create a second school row and a user in it; confirm neither can see the other's students
- [ ] Record a fee payment; confirm `status` flips to `paid` on its own (the trigger)
- [ ] Print a report card and check the letterhead and totals
- [ ] Mark attendance with the phone in airplane mode; confirm it syncs after

---

## What is still not wired

Two things the app models but does not yet actually do:

**WhatsApp.** Announcements and fee reminders record intent and count
recipients; no message is dispatched. Real delivery needs Meta's WhatsApp
Business API and a server route (or Supabase Edge Function) holding the token —
it must never reach the browser. Message templates need pre-approval by Meta,
which takes a few days, so start that early.

**Online payments.** Fees are recorded by the office. Parents paying in-app
needs Razorpay, a server route to create orders, and a webhook to confirm them.
Razorpay charges ~2% per transaction and nothing monthly, so it costs nothing
until it's used.

Both are deliberately deferred — neither is needed to run a pilot, and both are
easier to build once you have a real school telling you how they want it.

---

## A note on the adapter

`src/lib/data/supabase-repo.ts` is written against this schema but has not been
run against a live project. When you first switch modes, expect to fix a column
name or a join, not to rewrite the file. Work through the checklist above one
screen at a time and fix what breaks — the structure is sound, the details need
your first real database to shake out.

---

## Homework

The `homework` table is created by `01_schema.sql` and secured by
`02_rls.sql`. Both files are idempotent — `create table if not exists`,
`create or replace function`, `drop policy if exists` — so if you ran an
earlier version of them, simply run both again to add homework. Nothing
already in the database is dropped or rewritten.

Two things are worth knowing about its policy:

- **Reads** are allowed for any staff member in the school, and for parents
  whose child sits in that *section*. A parent of a 6-B child cannot read
  9-A's homework, and that boundary is enforced by the `guards_section()`
  helper in Postgres rather than by the app.
- **Writes** are allowed for office roles across every section, and for a
  class teacher only on their own section — the same rule attendance uses.

To verify tenancy after import, sign in as a parent and run:

```sql
select count(*) from homework;
```

You should see only the rows for that child's section. If you see the whole
school's homework, RLS is not on — re-run `02_rls.sql`.
