-- ═══════════════════════════════════════════════════════════════════
--  Palli — School Management  ·  Schema
--
--  Run this FIRST, in the Supabase SQL Editor.
--  Then run 02_rls.sql, then (optionally) 03_seed.sql.
--
--  Multi-tenancy model: one shared database, every tenant-scoped table
--  carries school_id, and Row-Level Security filters on it. This is
--  simpler and far cheaper to operate than a database per school, and
--  it is enforced in Postgres — not in application code — so a bug in
--  the UI cannot leak one school's data to another.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── Enums ─────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum
    ('correspondent','principal','admin','teacher','parent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present','absent','late');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fee_status as enum ('paid','partial','pending','overdue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type board_type as enum ('matriculation','cbse','state','icse');
exception when duplicate_object then null; end $$;

-- ── Tenant root ───────────────────────────────────────────────────
create table if not exists schools (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  name_ta           text,
  board             board_type not null default 'matriculation',
  city              text not null,
  district          text,
  phone             text,
  email             text,
  address           text,
  udise_code        text,
  logo_text         text default 'TN',
  academic_year     text not null,
  current_term      int  not null default 1,
  working_days_term int  not null default 58,
  created_at        timestamptz not null default now()
);

-- ── People ────────────────────────────────────────────────────────
-- Mirrors auth.users. The id IS the Supabase auth uid, which is what
-- makes the RLS policies in 02_rls.sql cheap to evaluate.
create table if not exists profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  school_id      uuid not null references schools(id) on delete cascade,
  full_name      text not null,
  role           user_role not null,
  designation    text,
  designation_ta text,
  phone          text,
  email          text,
  subjects       text[] default '{}',
  joined_on      date,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists profiles_school_idx on profiles(school_id);
create index if not exists profiles_role_idx   on profiles(school_id, role);

-- ── Academic structure ────────────────────────────────────────────
create table if not exists sections (
  id               uuid primary key default uuid_generate_v4(),
  school_id        uuid not null references schools(id) on delete cascade,
  standard         int  not null check (standard between 1 and 12),
  section          text not null,
  label            text generated always as (standard::text || '-' || section) stored,
  class_teacher_id uuid references profiles(id) on delete set null,
  room             text,
  academic_year    text not null,
  unique (school_id, standard, section, academic_year)
);
create index if not exists sections_school_idx on sections(school_id);

create table if not exists subjects (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid not null references schools(id) on delete cascade,
  code       text not null,
  name       text not null,
  name_ta    text,
  standards  int[] not null default '{}',
  max_marks  int not null default 100,
  pass_marks int not null default 35,
  unique (school_id, code)
);
create index if not exists subjects_school_idx on subjects(school_id);

-- ── Students ──────────────────────────────────────────────────────
create table if not exists students (
  id              uuid primary key default uuid_generate_v4(),
  school_id       uuid not null references schools(id) on delete cascade,
  section_id      uuid not null references sections(id) on delete restrict,
  admission_no    text not null,
  name            text not null,
  name_ta         text,
  roll_no         int,
  gender          char(1) check (gender in ('M','F','O')),
  dob             date,
  blood_group     text,
  father_name     text,
  mother_name     text,
  guardian_phone  text,
  guardian_email  text,
  address         text,
  transport_route text,
  admitted_on     date,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (school_id, admission_no)
);
create index if not exists students_school_idx  on students(school_id);
create index if not exists students_section_idx on students(section_id);

-- Links a parent's login to the children they may see.
create table if not exists guardians (
  id          uuid primary key default uuid_generate_v4(),
  school_id   uuid not null references schools(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  relation    text default 'parent',
  unique (profile_id, student_id)
);
create index if not exists guardians_profile_idx on guardians(profile_id);
create index if not exists guardians_student_idx on guardians(student_id);

-- ── Attendance ────────────────────────────────────────────────────
create table if not exists attendance (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid not null references schools(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  section_id uuid not null references sections(id) on delete cascade,
  date       date not null,
  status     attendance_status not null,
  marked_by  uuid references profiles(id) on delete set null,
  marked_at  timestamptz not null default now(),
  unique (student_id, date)
);
create index if not exists attendance_lookup_idx  on attendance(school_id, date);
create index if not exists attendance_section_idx on attendance(section_id, date);
create index if not exists attendance_student_idx on attendance(student_id);

-- ── Fees ──────────────────────────────────────────────────────────
create table if not exists fee_structures (
  id        uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools(id) on delete cascade,
  standard  int  not null,
  term      int  not null,
  label     text not null,
  amount    numeric(10,2) not null,
  due_date  date not null,
  unique (school_id, standard, term)
);

create table if not exists fee_records (
  id          uuid primary key default uuid_generate_v4(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  term        int not null,
  amount_due  numeric(10,2) not null,
  amount_paid numeric(10,2) not null default 0,
  status      fee_status not null default 'pending',
  due_date    date not null,
  paid_on     date,
  method      text,
  receipt_no  text,
  updated_at  timestamptz not null default now(),
  unique (student_id, term)
);
create index if not exists fee_school_idx  on fee_records(school_id, term);
create index if not exists fee_status_idx  on fee_records(school_id, status);
create index if not exists fee_student_idx on fee_records(student_id);

-- Keep status consistent with the amounts, so no client can write a
-- row that says "paid" while carrying a zero payment.
create or replace function sync_fee_status() returns trigger
language plpgsql as $$
begin
  if new.amount_paid >= new.amount_due then
    new.status := 'paid';
  elsif new.amount_paid > 0 then
    new.status := 'partial';
  elsif new.due_date < current_date then
    new.status := 'overdue';
  else
    new.status := 'pending';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists fee_status_trigger on fee_records;
create trigger fee_status_trigger
  before insert or update on fee_records
  for each row execute function sync_fee_status();

-- ── Exams ─────────────────────────────────────────────────────────
create table if not exists exams (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid not null references schools(id) on delete cascade,
  name       text not null,
  name_ta    text,
  term       int not null,
  start_date date,
  end_date   date,
  standards  int[] not null default '{}',
  published  boolean not null default false
);
create index if not exists exams_school_idx on exams(school_id);

create table if not exists marks (
  id             uuid primary key default uuid_generate_v4(),
  school_id      uuid not null references schools(id) on delete cascade,
  exam_id        uuid not null references exams(id) on delete cascade,
  student_id     uuid not null references students(id) on delete cascade,
  subject_id     uuid not null references subjects(id) on delete cascade,
  marks_obtained numeric(5,2),
  absent         boolean not null default false,
  entered_by     uuid references profiles(id) on delete set null,
  updated_at     timestamptz not null default now(),
  unique (exam_id, student_id, subject_id)
);
create index if not exists marks_exam_idx    on marks(exam_id);
create index if not exists marks_student_idx on marks(student_id);

-- ── Communication ─────────────────────────────────────────────────
create table if not exists announcements (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid not null references schools(id) on delete cascade,
  title      text not null,
  body       text not null,
  standard   int,
  section_id uuid references sections(id) on delete set null,
  channels   text[] not null default '{portal}',
  sent_by    uuid references profiles(id) on delete set null,
  sent_at    timestamptz not null default now(),
  recipients int not null default 0,
  delivered  int not null default 0,
  read       int not null default 0
);
create index if not exists announcements_school_idx on announcements(school_id, sent_at desc);

-- ── Homework ──────────────────────────────────────────────────────
-- Always scoped to one section, never a whole standard: 8-A and 8-B are
-- taught by different teachers and get different work.
create table if not exists homework (
  id          uuid primary key default uuid_generate_v4(),
  school_id   uuid not null references schools(id) on delete cascade,
  section_id  uuid not null references sections(id) on delete cascade,
  subject_id  uuid not null references subjects(id) on delete cascade,
  title       text not null,
  description text not null default '',
  assigned_on date not null default current_date,
  due_on      date not null,
  assigned_by uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  -- Work cannot be due before it was set.
  constraint homework_due_after_assigned check (due_on >= assigned_on)
);
create index if not exists homework_section_idx on homework(section_id, assigned_on desc);
create index if not exists homework_school_idx  on homework(school_id, assigned_on desc);

-- ── Audit trail ───────────────────────────────────────────────────
-- The DPDP Act expects you to be able to show who touched student data.
create table if not exists audit_log (
  id          bigserial primary key,
  school_id   uuid references schools(id) on delete cascade,
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  detail      jsonb,
  ip          inet,
  created_at  timestamptz not null default now()
);
create index if not exists audit_school_idx on audit_log(school_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════
--  Helper functions used by the RLS policies in 02_rls.sql.
--  SECURITY DEFINER + a fixed search_path so a policy can read the
--  caller's profile without recursing into profiles' own policies.
-- ═══════════════════════════════════════════════════════════════════

create or replace function current_school_id() returns uuid
language sql stable security definer set search_path = public as $$
  select school_id from profiles where id = auth.uid()
$$;

create or replace function current_role_name() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('correspondent','principal','admin','teacher')
     from profiles where id = auth.uid()),
    false)
$$;

create or replace function is_office() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('correspondent','principal','admin')
     from profiles where id = auth.uid()),
    false)
$$;

-- True when the caller is the class teacher of that section.
create or replace function teaches_section(sec uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from sections s
    where s.id = sec and s.class_teacher_id = auth.uid()
  )
$$;

-- True when the caller is a guardian of that student.
create or replace function guards_student(stu uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from guardians g
    where g.student_id = stu and g.profile_id = auth.uid()
  )
$$;

-- True when the caller is a guardian of any student in that section.
-- Homework is per-section, so a parent's read access is checked against the
-- section their child sits in rather than against each student row.
create or replace function guards_section(sec uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from guardians g
    join students s on s.id = g.student_id
    where g.profile_id = auth.uid()
      and s.section_id = sec
      and s.active
  )
$$;
