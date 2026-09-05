-- ═══════════════════════════════════════════════════════════════════
--  Palli — Row-Level Security
--
--  Run this SECOND, after 01_schema.sql.
--
--  The rules, in plain words:
--    · Nobody sees any row belonging to another school. Ever.
--    · Office staff (correspondent / principal / admin) see their whole school.
--    · A teacher sees their school's students, but may only WRITE attendance
--      and marks for the sections they actually teach.
--    · A parent sees only their own child's rows, and writes nothing.
--
--  These are enforced by Postgres. Even if someone got hold of the anon
--  key and queried the REST API directly, they would still only see rows
--  their JWT entitles them to.
-- ═══════════════════════════════════════════════════════════════════

alter table schools       enable row level security;
alter table profiles      enable row level security;
alter table sections      enable row level security;
alter table subjects      enable row level security;
alter table students      enable row level security;
alter table guardians     enable row level security;
alter table attendance    enable row level security;
alter table fee_structures enable row level security;
alter table fee_records   enable row level security;
alter table exams         enable row level security;
alter table marks         enable row level security;
alter table announcements enable row level security;
alter table audit_log     enable row level security;

-- ── schools ───────────────────────────────────────────────────────
drop policy if exists schools_read on schools;
create policy schools_read on schools
  for select using (id = current_school_id());

drop policy if exists schools_write on schools;
create policy schools_write on schools
  for update using (id = current_school_id() and is_office());

-- ── profiles ──────────────────────────────────────────────────────
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles
  for select using (
    id = auth.uid()                                   -- always see yourself
    or (school_id = current_school_id() and is_staff())
  );

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
  for update using (id = auth.uid());

drop policy if exists profiles_office_manage on profiles;
create policy profiles_office_manage on profiles
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

-- ── sections & subjects (reference data) ──────────────────────────
drop policy if exists sections_read on sections;
create policy sections_read on sections
  for select using (school_id = current_school_id());

drop policy if exists sections_manage on sections;
create policy sections_manage on sections
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

drop policy if exists subjects_read on subjects;
create policy subjects_read on subjects
  for select using (school_id = current_school_id());

drop policy if exists subjects_manage on subjects;
create policy subjects_manage on subjects
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

-- ── students ──────────────────────────────────────────────────────
-- Staff see the school roll; a parent sees only their own children.
drop policy if exists students_read on students;
create policy students_read on students
  for select using (
    school_id = current_school_id()
    and (is_staff() or guards_student(id))
  );

drop policy if exists students_manage on students;
create policy students_manage on students
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

-- ── guardians ─────────────────────────────────────────────────────
drop policy if exists guardians_read on guardians;
create policy guardians_read on guardians
  for select using (
    profile_id = auth.uid()
    or (school_id = current_school_id() and is_staff())
  );

drop policy if exists guardians_manage on guardians;
create policy guardians_manage on guardians
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

-- ── attendance ────────────────────────────────────────────────────
drop policy if exists attendance_read on attendance;
create policy attendance_read on attendance
  for select using (
    school_id = current_school_id()
    and (is_staff() or guards_student(student_id))
  );

-- Office staff may correct any class. A teacher may only write their own.
drop policy if exists attendance_write_office on attendance;
create policy attendance_write_office on attendance
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

drop policy if exists attendance_write_teacher on attendance;
create policy attendance_write_teacher on attendance
  for all using (
    school_id = current_school_id()
    and current_role_name() = 'teacher'
    and teaches_section(section_id)
  )
  with check (
    school_id = current_school_id()
    and current_role_name() = 'teacher'
    and teaches_section(section_id)
  );

-- ── fees ──────────────────────────────────────────────────────────
drop policy if exists fee_structures_read on fee_structures;
create policy fee_structures_read on fee_structures
  for select using (school_id = current_school_id());

drop policy if exists fee_structures_manage on fee_structures;
create policy fee_structures_manage on fee_structures
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

-- Money is deliberately narrower than the rest: teachers cannot see it.
drop policy if exists fee_records_read on fee_records;
create policy fee_records_read on fee_records
  for select using (
    school_id = current_school_id()
    and (is_office() or guards_student(student_id))
  );

drop policy if exists fee_records_manage on fee_records;
create policy fee_records_manage on fee_records
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

-- ── exams & marks ─────────────────────────────────────────────────
drop policy if exists exams_read on exams;
create policy exams_read on exams
  for select using (school_id = current_school_id());

drop policy if exists exams_manage on exams;
create policy exams_manage on exams
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

-- A parent only sees marks once the exam is published.
drop policy if exists marks_read on marks;
create policy marks_read on marks
  for select using (
    school_id = current_school_id()
    and (
      is_staff()
      or (
        guards_student(student_id)
        and exists (select 1 from exams e where e.id = exam_id and e.published)
      )
    )
  );

drop policy if exists marks_write_office on marks;
create policy marks_write_office on marks
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

drop policy if exists marks_write_teacher on marks;
create policy marks_write_teacher on marks
  for all using (
    school_id = current_school_id()
    and current_role_name() = 'teacher'
    and exists (
      select 1 from students s
      where s.id = student_id and teaches_section(s.section_id)
    )
  )
  with check (
    school_id = current_school_id()
    and current_role_name() = 'teacher'
    and exists (
      select 1 from students s
      where s.id = student_id and teaches_section(s.section_id)
    )
  );

-- ── announcements ─────────────────────────────────────────────────
-- Everyone in the school reads them; only office staff send them.
drop policy if exists announcements_read on announcements;
create policy announcements_read on announcements
  for select using (school_id = current_school_id());

drop policy if exists announcements_manage on announcements;
create policy announcements_manage on announcements
  for all using (school_id = current_school_id() and is_office())
  with check (school_id = current_school_id() and is_office());

-- ── audit log ─────────────────────────────────────────────────────
-- Append-only from the app's point of view: readable by the principal,
-- writable by any authenticated user, never updatable or deletable.
drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log
  for select using (school_id = current_school_id() and is_office());

drop policy if exists audit_insert on audit_log;
create policy audit_insert on audit_log
  for insert with check (school_id = current_school_id());

-- ═══════════════════════════════════════════════════════════════════
--  Sanity check after running this file:
--
--    select tablename, rowsecurity
--    from pg_tables where schemaname = 'public';
--
--  Every application table must show rowsecurity = true. If any shows
--  false, that table is readable by anyone holding the anon key.
-- ═══════════════════════════════════════════════════════════════════
