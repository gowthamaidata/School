-- ═══════════════════════════════════════════════════════════════════
--  Palli — Starter data for a real school
--
--  Run this THIRD, after 01_schema.sql and 02_rls.sql.
--
--  This does NOT recreate the demo school. It gives you the reference
--  rows a real school needs on day one — subjects, sections, fee terms —
--  so you can import the student roll and start using the app.
--
--  Before running: replace the school details in the first INSERT.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. The school ─────────────────────────────────────────────────
insert into schools (
  name, name_ta, board, city, district, phone, email, address,
  udise_code, logo_text, academic_year, current_term, working_days_term
) values (
  'Your School Name Here',
  'உங்கள் பள்ளியின் பெயர்',
  'matriculation',                   -- or 'cbse'
  'Coimbatore',
  'Coimbatore',
  '0422 000 0000',
  'office@yourschool.in',
  'Street, Area, City — PIN',
  '00000000000',                     -- UDISE+ code
  'YS',                              -- 2 letters for the app icon
  '2026-2027',
  1,
  58
)
on conflict do nothing;

-- Everything below hangs off that school.
do $$
declare
  sid uuid;
begin
  select id into sid from schools order by created_at desc limit 1;

  -- ── 2. Subjects (Tamil Nadu matriculation set) ─────────────────
  insert into subjects (school_id, code, name, name_ta, standards, max_marks, pass_marks) values
    (sid,'TAM','Tamil','தமிழ்',              array[1,2,3,4,5,6,7,8,9,10],        100,35),
    (sid,'ENG','English','ஆங்கிலம்',          array[1,2,3,4,5,6,7,8,9,10,11,12], 100,35),
    (sid,'MAT','Mathematics','கணிதம்',        array[1,2,3,4,5,6,7,8,9,10,11,12], 100,35),
    (sid,'SCI','Science','அறிவியல்',          array[1,2,3,4,5,6,7,8,9,10],        100,35),
    (sid,'SOC','Social Science','சமூக அறிவியல்',array[1,2,3,4,5,6,7,8,9,10],      100,35),
    (sid,'CSC','Computer Science','கணினி அறிவியல்',array[6,7,8,9,10,11,12],       100,35),
    (sid,'PHY','Physics','இயற்பியல்',          array[11,12],                      100,35),
    (sid,'CHE','Chemistry','வேதியியல்',        array[11,12],                      100,35),
    (sid,'BIO','Biology','உயிரியல்',           array[11,12],                      100,35)
  on conflict (school_id, code) do nothing;

  -- ── 3. Sections: standards 1–12, sections A and B ──────────────
  -- Add or remove sections to match your school before running.
  insert into sections (school_id, standard, section, room, academic_year)
  select sid, std, sec,
         case when std < 6 then 'Block A' when std < 11 then 'Block B' else 'Block C' end
           || ' · ' || std || sec,
         '2026-2027'
  from generate_series(1,12) as std
  cross join (values ('A'),('B')) as s(sec)
  on conflict (school_id, standard, section, academic_year) do nothing;

  -- ── 4. Fee structure: 3 terms, banded by standard ──────────────
  -- Edit these amounts to your actual fee schedule.
  insert into fee_structures (school_id, standard, term, label, amount, due_date)
  select sid, std, term,
         'Term ' || term || ' fee',
         case
           when std <= 5  then 11500
           when std <= 8  then 14500
           when std <= 10 then 17500
           else 21500
         end,
         case term
           when 1 then date '2026-06-20'
           when 2 then date '2026-09-20'
           else        date '2026-12-20'
         end
  from generate_series(1,12) as std
  cross join generate_series(1,3) as term
  on conflict (school_id, standard, term) do nothing;

  -- ── 5. Exam calendar ───────────────────────────────────────────
  insert into exams (school_id, name, name_ta, term, start_date, end_date, standards, published) values
    (sid,'Quarterly Examination','காலாண்டுத் தேர்வு',   1,'2026-07-13','2026-07-22',array[1,2,3,4,5,6,7,8,9,10,11,12],false),
    (sid,'Half-Yearly Examination','அரையாண்டுத் தேர்வு',2,'2026-10-05','2026-10-16',array[1,2,3,4,5,6,7,8,9,10,11,12],false),
    (sid,'Annual Examination','ஆண்டுத் தேர்வு',         3,'2027-03-10','2027-03-24',array[1,2,3,4,5,6,7,8,9,10,11,12],false)
  on conflict do nothing;
end $$;

-- ═══════════════════════════════════════════════════════════════════
--  NEXT STEPS
--
--  1. Create the first staff login:
--       Supabase Dashboard → Authentication → Users → Add user
--     Then link it to a profile (replace both UUIDs):
--
--       insert into profiles (id, school_id, full_name, role, designation)
--       values (
--         '<auth-user-uuid>',
--         (select id from schools limit 1),
--         'Principal Name',
--         'principal',
--         'Principal'
--       );
--
--  2. Import the student roll. Export your existing Excel sheet as CSV
--     with these columns, then use Supabase → Table Editor → students →
--     Import data from CSV:
--
--       admission_no, name, name_ta, roll_no, gender, dob,
--       father_name, mother_name, guardian_phone, address, blood_group
--
--     You will need to fill section_id and school_id. The easiest route
--     is to import into a staging table, then:
--
--       insert into students (school_id, section_id, admission_no, name, ...)
--       select (select id from schools limit 1),
--              (select id from sections
--                where standard = t.standard and section = t.section
--                  and school_id = (select id from schools limit 1)),
--              t.admission_no, t.name, ...
--       from staging_students t;
--
--  3. Generate this term's fee records from the structure:
--
--       insert into fee_records (school_id, student_id, term, amount_due, due_date)
--       select s.school_id, s.id, f.term, f.amount, f.due_date
--       from students s
--       join sections sec on sec.id = s.section_id
--       join fee_structures f
--         on f.school_id = s.school_id and f.standard = sec.standard
--       where s.active
--       on conflict (student_id, term) do nothing;
--
--  4. Set NEXT_PUBLIC_DATA_MODE=supabase in Vercel and redeploy.
-- ═══════════════════════════════════════════════════════════════════
