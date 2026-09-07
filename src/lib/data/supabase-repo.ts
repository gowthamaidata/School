/**
 * Supabase-backed repository.
 *
 * Implements the same surface as the demo repository, so switching
 * NEXT_PUBLIC_DATA_MODE from "demo" to "supabase" needs no component changes.
 *
 * ── STATUS ────────────────────────────────────────────────────────────
 * The queries here are written against the schema in supabase/01_schema.sql
 * and rely on the policies in supabase/02_rls.sql. They have NOT yet been
 * exercised against a live project — this file exists so that wiring up your
 * first real school is an afternoon of verification rather than a rewrite.
 * Work through docs/SUPABASE.md when you get there; expect to fix a column
 * name or two, not the structure.
 * ──────────────────────────────────────────────────────────────────────
 *
 * Note that RLS does most of the filtering. Queries deliberately do NOT add
 * `.eq('school_id', ...)` everywhere: the policy already restricts rows to the
 * caller's school, and duplicating that in the client invites the mistake of
 * trusting the client-side filter.
 */

import { gradeFor, pct, todayISO } from '@/lib/utils'
import { getSupabase, unwrap } from './supabase-client'
import type {
  Announcement, AttendanceRecord, AttendanceStatus, AttendanceSummary,
  ClassAttendanceRow, ClassSection, DashboardStats, Exam, FeeRecord, Homework,
  HomeworkCoverageRow, Mark, School, SessionUser, Staff, Student, Subject,
} from './types'

const sb = () => getSupabase()

/* ── Row mappers ────────────────────────────────────────────────── */
/* The database uses snake_case; the app's types already do too, so most
   of these are pass-throughs with a couple of computed fields. */

function toSection(r: Record<string, unknown>): ClassSection {
  return {
    id: r.id as string,
    school_id: r.school_id as string,
    standard: r.standard as number,
    section: r.section as string,
    label: (r.label as string) ?? `${r.standard}-${r.section}`,
    class_teacher_id: (r.class_teacher_id as string) ?? null,
    room: (r.room as string) ?? '',
    strength: (r.strength as number) ?? 0,
  }
}

function toStaff(r: Record<string, unknown>): Staff {
  return {
    id: r.id as string,
    school_id: r.school_id as string,
    name: r.full_name as string,
    role: r.role as Staff['role'],
    designation: (r.designation as string) ?? '',
    designation_ta: (r.designation_ta as string) ?? '',
    phone: (r.phone as string) ?? '',
    email: (r.email as string) ?? '',
    subjects: (r.subjects as string[]) ?? [],
    class_teacher_of: (r.class_teacher_of as string[]) ?? [],
    joined_on: (r.joined_on as string) ?? '',
  }
}

export const supabaseRepo = {
  /* ── School & reference data ─────────────────────────── */
  async getSchool(): Promise<School> {
    const rows = unwrap(await sb().from('schools').select('*').limit(1))
    const r = (rows as Record<string, unknown>[])[0]
    if (!r) throw new Error('No school row visible. Check that your profile row has the right school_id.')
    return {
      id: r.id as string,
      name: r.name as string,
      name_ta: (r.name_ta as string) ?? (r.name as string),
      board: r.board as School['board'],
      city: (r.city as string) ?? '',
      district: (r.district as string) ?? '',
      phone: (r.phone as string) ?? '',
      email: (r.email as string) ?? '',
      address: (r.address as string) ?? '',
      academic_year: r.academic_year as string,
      udise_code: (r.udise_code as string) ?? '',
      logo_text: (r.logo_text as string) ?? 'TN',
      working_days_this_term: (r.working_days_term as number) ?? 58,
      term_fee_target: 0,
    }
  },

  async getSections(): Promise<ClassSection[]> {
    const rows = unwrap(
      await sb()
        .from('sections')
        .select('*, students(count)')
        .order('standard')
        .order('section'),
    ) as Record<string, unknown>[]

    return rows.map((r) => {
      const counts = r.students as { count: number }[] | undefined
      return toSection({ ...r, strength: counts?.[0]?.count ?? 0 })
    })
  },

  async getSubjects(): Promise<Subject[]> {
    return unwrap(await sb().from('subjects').select('*').order('code')) as Subject[]
  },

  async getStaff(): Promise<Staff[]> {
    const [profiles, sections] = await Promise.all([
      sb().from('profiles').select('*').neq('role', 'parent').order('full_name'),
      sb().from('sections').select('id, class_teacher_id'),
    ])

    const secRows = unwrap(sections) as { id: string; class_teacher_id: string | null }[]
    const byTeacher = new Map<string, string[]>()
    for (const s of secRows) {
      if (!s.class_teacher_id) continue
      byTeacher.set(s.class_teacher_id, [...(byTeacher.get(s.class_teacher_id) ?? []), s.id])
    }

    return (unwrap(profiles) as Record<string, unknown>[]).map((r) =>
      toStaff({ ...r, class_teacher_of: byTeacher.get(r.id as string) ?? [] }),
    )
  },

  /* ── Students ────────────────────────────────────────── */
  async getStudents(filter?: {
    sectionId?: string
    standard?: number
    query?: string
  }): Promise<Student[]> {
    let q = sb().from('students').select('*').eq('active', true)

    if (filter?.sectionId) q = q.eq('section_id', filter.sectionId)
    if (filter?.query) {
      const term = filter.query.replace(/[%,]/g, '')
      q = q.or(
        [
          `name.ilike.%${term}%`,
          `name_ta.ilike.%${term}%`,
          `admission_no.ilike.%${term}%`,
          `father_name.ilike.%${term}%`,
          `guardian_phone.ilike.%${term}%`,
        ].join(','),
      )
    }

    let rows = unwrap(await q.order('roll_no').limit(1000)) as Student[]

    // `standard` lives on sections, so filter after the join rather than
    // forcing an inner-join syntax that fights with the search `or`.
    if (filter?.standard) {
      const secs = unwrap(
        await sb().from('sections').select('id').eq('standard', filter.standard),
      ) as { id: string }[]
      const ids = new Set(secs.map((s) => s.id))
      rows = rows.filter((s) => ids.has(s.section_id))
    }
    return rows
  },

  async getStudent(id: string): Promise<Student | null> {
    const rows = unwrap(await sb().from('students').select('*').eq('id', id).limit(1)) as Student[]
    return rows[0] ?? null
  },

  /* ── Attendance ──────────────────────────────────────── */
  async getAttendanceForSection(sectionId: string, date: string): Promise<AttendanceRecord[]> {
    return unwrap(
      await sb().from('attendance').select('*').eq('section_id', sectionId).eq('date', date),
    ) as AttendanceRecord[]
  },

  async saveAttendance(input: {
    sectionId: string
    date: string
    markedBy: string
    entries: { studentId: string; status: AttendanceStatus }[]
  }): Promise<{ saved: number; absentees: Student[] }> {
    const schoolId = (await this.getSchool()).id

    const rows = input.entries.map((e) => ({
      school_id: schoolId,
      student_id: e.studentId,
      section_id: input.sectionId,
      date: input.date,
      status: e.status,
      marked_by: input.markedBy,
      marked_at: new Date().toISOString(),
    }))

    // (student_id, date) is unique, so re-submitting a class corrects it.
    unwrap(await sb().from('attendance').upsert(rows, { onConflict: 'student_id,date' }).select('id'))

    const absentIds = input.entries.filter((e) => e.status === 'absent').map((e) => e.studentId)
    const absentees = absentIds.length
      ? ((unwrap(await sb().from('students').select('*').in('id', absentIds)) as Student[]) ?? [])
      : []

    return { saved: rows.length, absentees }
  },

  async getAttendanceSummary(studentId: string): Promise<AttendanceSummary> {
    const rows = unwrap(
      await sb().from('attendance').select('status').eq('student_id', studentId),
    ) as { status: AttendanceStatus }[]

    const present = rows.filter((r) => r.status !== 'absent').length
    const absent = rows.filter((r) => r.status === 'absent').length
    const late = rows.filter((r) => r.status === 'late').length

    return {
      student_id: studentId,
      present,
      absent,
      late,
      total: rows.length,
      percentage: pct(present, rows.length),
    }
  },

  async getLowAttendanceStudents(threshold = 75) {
    // Aggregating per student in the client would mean pulling every row.
    // Create this view once (see docs/SUPABASE.md) and the work stays in PG:
    //
    //   create or replace view attendance_summary as
    //   select school_id, student_id,
    //          count(*) filter (where status <> 'absent') as present,
    //          count(*) filter (where status = 'absent')  as absent,
    //          count(*) filter (where status = 'late')    as late,
    //          count(*)                                   as total,
    //          round(100.0 * count(*) filter (where status <> 'absent')
    //                / nullif(count(*),0), 1)             as percentage
    //   from attendance group by school_id, student_id;
    const rows = unwrap(
      await sb()
        .from('attendance_summary')
        .select('*, students(*), students(sections(*))')
        .lt('percentage', threshold)
        .order('percentage', { ascending: true })
        .limit(100),
    ) as Record<string, unknown>[]

    return rows
      .map((r) => {
        const student = r.students as Student | null
        if (!student) return null
        const section = (student as unknown as { sections?: Record<string, unknown> }).sections
        return {
          student,
          summary: {
            student_id: r.student_id as string,
            present: r.present as number,
            absent: r.absent as number,
            late: r.late as number,
            total: r.total as number,
            percentage: Number(r.percentage),
          },
          section: section ? toSection(section) : ({} as ClassSection),
        }
      })
      .filter(Boolean) as { student: Student; summary: AttendanceSummary; section: ClassSection }[]
  },

  async getClassAttendanceToday(date = todayISO()): Promise<ClassAttendanceRow[]> {
    const [sections, records] = await Promise.all([
      this.getSections(),
      sb().from('attendance').select('section_id, status').eq('date', date),
    ])
    const rows = unwrap(records) as { section_id: string; status: AttendanceStatus }[]

    return sections.map((sec) => {
      const mine = rows.filter((r) => r.section_id === sec.id)
      const present = mine.filter((r) => r.status !== 'absent').length
      const absent = mine.filter((r) => r.status === 'absent').length
      return {
        section_id: sec.id,
        label: sec.label,
        strength: sec.strength,
        present,
        absent,
        percentage: mine.length ? pct(present, mine.length) : 0,
        marked: mine.length > 0,
      }
    })
  },

  /* ── Fees ────────────────────────────────────────────── */
  async getFeeRecords(filter?: {
    term?: number
    status?: FeeRecord['status'] | 'unpaid'
    sectionId?: string
    query?: string
  }) {
    let q = sb().from('fee_records').select('*, students(*, sections(*))')

    if (filter?.term) q = q.eq('term', filter.term)
    if (filter?.status === 'unpaid') q = q.neq('status', 'paid')
    else if (filter?.status) q = q.eq('status', filter.status)

    const rows = unwrap(await q.limit(2000)) as Record<string, unknown>[]

    let joined = rows
      .map((r) => {
        const student = r.students as (Student & { sections?: Record<string, unknown> }) | null
        if (!student) return null
        const { sections, ...rest } = student
        return {
          record: r as unknown as FeeRecord,
          student: rest as Student,
          section: sections ? toSection(sections) : ({} as ClassSection),
        }
      })
      .filter(Boolean) as { record: FeeRecord; student: Student; section: ClassSection }[]

    if (filter?.sectionId) joined = joined.filter((r) => r.section.id === filter.sectionId)
    if (filter?.query) {
      const term = filter.query.toLowerCase().trim()
      joined = joined.filter(
        (r) =>
          r.student.name.toLowerCase().includes(term) ||
          r.student.admission_no.toLowerCase().includes(term) ||
          (r.student.guardian_phone ?? '').includes(term),
      )
    }
    return joined
  },

  async getFeeRecordsForStudent(studentId: string): Promise<FeeRecord[]> {
    return unwrap(
      await sb().from('fee_records').select('*').eq('student_id', studentId).order('term'),
    ) as FeeRecord[]
  },

  async recordPayment(input: { feeId: string; amount: number; method: string }) {
    const existing = unwrap(
      await sb().from('fee_records').select('*').eq('id', input.feeId).limit(1),
    ) as FeeRecord[]
    const rec = existing[0]
    if (!rec) return null

    const paid = Math.min(rec.amount_due, Number(rec.amount_paid) + input.amount)

    // status is set by the fee_status_trigger in 01_schema.sql, not here —
    // that keeps "paid" from ever disagreeing with the amount.
    const updated = unwrap(
      await sb()
        .from('fee_records')
        .update({
          amount_paid: paid,
          paid_on: todayISO(),
          method: input.method,
          receipt_no: rec.receipt_no ?? `RC${Date.now().toString().slice(-6)}`,
        })
        .eq('id', input.feeId)
        .select('*'),
    ) as FeeRecord[]

    return updated[0] ?? null
  },

  async sendFeeReminders(term: number): Promise<number> {
    // Counting here; actual WhatsApp dispatch belongs in a server route or an
    // Edge Function so the API token never reaches the browser.
    const rows = unwrap(
      await sb().from('fee_records').select('id').eq('term', term).neq('status', 'paid'),
    ) as { id: string }[]
    return rows.length
  },

  /* ── Exams & marks ───────────────────────────────────── */
  async getExams(): Promise<Exam[]> {
    return unwrap(await sb().from('exams').select('*').order('start_date')) as Exam[]
  },

  async getMarks(examId: string, sectionId: string): Promise<Mark[]> {
    const students = unwrap(
      await sb().from('students').select('id').eq('section_id', sectionId),
    ) as { id: string }[]
    if (students.length === 0) return []

    return unwrap(
      await sb()
        .from('marks')
        .select('*')
        .eq('exam_id', examId)
        .in('student_id', students.map((s) => s.id)),
    ) as Mark[]
  },

  async saveMarks(
    entries: { examId: string; studentId: string; subjectId: string; marks: number | null }[],
  ): Promise<number> {
    const schoolId = (await this.getSchool()).id
    const rows = entries.map((e) => ({
      school_id: schoolId,
      exam_id: e.examId,
      student_id: e.studentId,
      subject_id: e.subjectId,
      marks_obtained: e.marks,
      absent: e.marks === null,
      updated_at: new Date().toISOString(),
    }))

    unwrap(
      await sb()
        .from('marks')
        .upsert(rows, { onConflict: 'exam_id,student_id,subject_id' })
        .select('id'),
    )
    return rows.length
  },

  async getReportCard(studentId: string, examId: string) {
    const student = await this.getStudent(studentId)
    if (!student) return null

    const [sections, exams, subjects, marks, summary] = await Promise.all([
      this.getSections(),
      this.getExams(),
      this.getSubjects(),
      sb().from('marks').select('*').eq('exam_id', examId).eq('student_id', studentId),
      this.getAttendanceSummary(studentId),
    ])

    const section = sections.find((s) => s.id === student.section_id)
    const exam = exams.find((e) => e.id === examId)
    if (!section || !exam) return null

    const myMarks = unwrap(marks) as Mark[]
    const mySubjects = subjects.filter((s) => s.standards.includes(section.standard))

    const rows = mySubjects.map((sub) => {
      const m = myMarks.find((x) => x.subject_id === sub.id)
      const obtained = m?.absent ? null : (m?.marks_obtained ?? null)
      return {
        subject: sub,
        obtained,
        max: sub.max_marks,
        grade: obtained === null ? '—' : gradeFor((obtained / sub.max_marks) * 100),
        passed: obtained !== null && obtained >= sub.pass_marks,
      }
    })

    const attempted = rows.filter((r) => r.obtained !== null)
    const total = attempted.reduce((s, r) => s + (r.obtained ?? 0), 0)
    const maxTotal = attempted.reduce((s, r) => s + r.max, 0)
    const percentage = maxTotal ? Math.round((total / maxTotal) * 1000) / 10 : 0

    // Rank within the section.
    const classmates = unwrap(
      await sb().from('students').select('id').eq('section_id', student.section_id),
    ) as { id: string }[]

    const classMarks = unwrap(
      await sb()
        .from('marks')
        .select('student_id, marks_obtained, absent')
        .eq('exam_id', examId)
        .in('student_id', classmates.map((c) => c.id)),
    ) as { student_id: string; marks_obtained: number | null; absent: boolean }[]

    const totals = new Map<string, number>()
    for (const m of classMarks) {
      if (m.absent) continue
      totals.set(m.student_id, (totals.get(m.student_id) ?? 0) + Number(m.marks_obtained ?? 0))
    }
    const ranked = Array.from(totals.entries()).sort((a, b) => b[1] - a[1])
    const rank = ranked.findIndex(([id]) => id === studentId) + 1

    const staff = await this.getStaff()

    return {
      student,
      section,
      exam,
      rows,
      total,
      maxTotal,
      percentage,
      grade: gradeFor(percentage),
      rank: rank || classmates.length,
      classSize: classmates.length,
      passed: rows.every((r) => r.obtained === null || r.passed),
      attendance: summary,
      classTeacher: staff.find((s) => s.id === section.class_teacher_id)?.name ?? '—',
    }
  },

  /* ── Communication ───────────────────────────────────── */
  async getAnnouncements(limit?: number): Promise<Announcement[]> {
    let q = sb().from('announcements').select('*').order('sent_at', { ascending: false })
    if (limit) q = q.limit(limit)
    return unwrap(await q) as Announcement[]
  },

  async sendAnnouncement(input: {
    title: string
    body: string
    standard: number | null
    channels: Announcement['channels']
    sentBy: string
  }): Promise<Announcement> {
    const schoolId = (await this.getSchool()).id

    let countQuery = sb().from('students').select('id', { count: 'exact', head: true }).eq('active', true)
    if (input.standard) {
      const secs = unwrap(
        await sb().from('sections').select('id').eq('standard', input.standard),
      ) as { id: string }[]
      countQuery = countQuery.in('section_id', secs.map((s) => s.id))
    }
    const { count } = await countQuery
    const recipients = count ?? 0

    const inserted = unwrap(
      await sb()
        .from('announcements')
        .insert({
          school_id: schoolId,
          title: input.title,
          body: input.body,
          standard: input.standard,
          channels: input.channels,
          sent_by: input.sentBy,
          recipients,
          delivered: 0,
          read: 0,
        })
        .select('*'),
    ) as Announcement[]

    // Actual WhatsApp/SMS dispatch goes in a server route or Edge Function,
    // which then updates `delivered`. See docs/WHATSAPP.md.
    return inserted[0]
  },

  /* ── Dashboard ───────────────────────────────────────── */
  async getDashboardStats(date = todayISO()): Promise<DashboardStats> {
    const school = await this.getSchool()
    const currentTerm = Number(process.env.NEXT_PUBLIC_CURRENT_TERM ?? '1') || 1

    const [studentCount, todayRows, feeRows, sections, lowRows] = await Promise.all([
      sb().from('students').select('id', { count: 'exact', head: true }).eq('active', true),
      sb().from('attendance').select('status, section_id').eq('date', date),
      sb().from('fee_records').select('amount_due, amount_paid, status').eq('term', currentTerm),
      this.getSections(),
      sb().from('attendance_summary').select('student_id', { count: 'exact', head: true }).lt('percentage', 75),
    ])

    const att = unwrap(todayRows) as { status: AttendanceStatus; section_id: string }[]
    const present = att.filter((r) => r.status !== 'absent').length
    const absent = att.filter((r) => r.status === 'absent').length

    const fees = unwrap(feeRows) as { amount_due: number; amount_paid: number; status: string }[]
    const collected = fees.reduce((s, f) => s + Number(f.amount_paid), 0)
    const target = fees.reduce((s, f) => s + Number(f.amount_due), 0)

    return {
      total_students: studentCount.count ?? 0,
      present_today: present,
      absent_today: absent,
      attendance_pct: att.length ? pct(present, att.length) : 0,
      sections_marked: new Set(att.map((r) => r.section_id)).size,
      sections_total: sections.length,
      fees_collected: collected,
      fees_target: target || school.term_fee_target,
      fees_outstanding: target - collected,
      collection_pct: pct(collected, target),
      defaulter_count: fees.filter((f) => f.status !== 'paid').length,
      low_attendance_count: lowRows.count ?? 0,
    }
  },

  async getCollectionTrend(): Promise<{ month: string; amount: number }[]> {
    const rows = unwrap(
      await sb().from('fee_records').select('paid_on, amount_paid').not('paid_on', 'is', null),
    ) as { paid_on: string; amount_paid: number }[]

    const buckets = new Map<string, number>()
    for (const r of rows) {
      const key = r.paid_on.slice(0, 7)
      buckets.set(key, (buckets.get(key) ?? 0) + Number(r.amount_paid))
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        month: new Date(`${month}-01`).toLocaleDateString('en-IN', { month: 'short' }),
        amount,
      }))
  },

  /** In Supabase mode people sign in for real, so there are no demo users. */
  async getDemoUsers(): Promise<SessionUser[]> {
    return []
  },

  /* ── Real auth ───────────────────────────────────────── */
  async signInWithPassword(email: string, password: string): Promise<SessionUser> {
    const { data, error } = await sb().auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Sign-in returned no user')

    const profiles = unwrap(
      await sb().from('profiles').select('*').eq('id', data.user.id).limit(1),
    ) as Record<string, unknown>[]
    const p = profiles[0]
    if (!p) throw new Error('Signed in, but this account has no profile row yet.')

    const sections = unwrap(
      await sb().from('sections').select('id').eq('class_teacher_id', data.user.id),
    ) as { id: string }[]

    let studentId: string | undefined
    if (p.role === 'parent') {
      const wards = unwrap(
        await sb().from('guardians').select('student_id').eq('profile_id', data.user.id).limit(1),
      ) as { student_id: string }[]
      studentId = wards[0]?.student_id
    }

    return {
      id: p.id as string,
      school_id: p.school_id as string,
      name: p.full_name as string,
      role: p.role as SessionUser['role'],
      designation: (p.designation as string) ?? '',
      email: (p.email as string) ?? data.user.email ?? '',
      section_ids: sections.map((s) => s.id),
      ...(studentId ? { student_id: studentId } : {}),
    }
  },

  async signOut(): Promise<void> {
    await sb().auth.signOut()
  },

  /* ── Homework ──────────────────────────────────────────────── */

  async getHomework(opts: {
    sectionId?: string
    onOrAfter?: string
    limit?: number
  } = {}): Promise<Homework[]> {
    let q = sb()
      .from('homework')
      .select('*')
      .order('assigned_on', { ascending: false })
      .order('created_at', { ascending: false })

    if (opts.sectionId) q = q.eq('section_id', opts.sectionId)
    if (opts.onOrAfter) q = q.gte('assigned_on', opts.onOrAfter)
    if (opts.limit) q = q.limit(opts.limit)

    return unwrap(await q) as Homework[]
  },

  /**
   * A parent's view. The RLS policy already limits homework to sections their
   * child sits in, so this only needs the student's own section to order the
   * result — it is not what enforces the boundary.
   */
  async getHomeworkForStudent(studentId: string, limit = 20): Promise<Homework[]> {
    const student = unwrap(
      await sb().from('students').select('section_id').eq('id', studentId).single(),
    ) as { section_id: string } | null
    if (!student) return []

    return unwrap(
      await sb()
        .from('homework')
        .select('*')
        .eq('section_id', student.section_id)
        .order('assigned_on', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit),
    ) as Homework[]
  },

  async saveHomework(input: {
    sectionId: string
    subjectId: string
    title: string
    description: string
    dueOn: string
    assignedBy: string
    assignedOn?: string
  }): Promise<Homework> {
    const schoolId = (await this.getSchool()).id

    return unwrap(
      await sb()
        .from('homework')
        .insert({
          school_id: schoolId,
          section_id: input.sectionId,
          subject_id: input.subjectId,
          title: input.title.trim(),
          description: input.description.trim(),
          assigned_on: input.assignedOn ?? todayISO(),
          due_on: input.dueOn,
          assigned_by: input.assignedBy,
        })
        .select()
        .single(),
    ) as Homework
  },

  async deleteHomework(id: string): Promise<void> {
    unwrap(await sb().from('homework').delete().eq('id', id))
  },

  /**
   * Which sections have homework posted for a day.
   *
   * Every section is returned, including the ones with nothing — a coverage
   * view that silently omits the classes that did not post would hide exactly
   * the thing it exists to surface.
   */
  async getHomeworkCoverage(date?: string): Promise<HomeworkCoverageRow[]> {
    const day = date ?? todayISO()

    const [sections, rows] = await Promise.all([
      sb().from('sections').select('id,standard,section,label').order('standard'),
      sb()
        .from('homework')
        .select('section_id, subjects(name)')
        .eq('assigned_on', day),
    ])

    const secs = unwrap(sections) as { id: string; label: string }[]
    // PostgREST returns an embedded one-to-one as an object on some versions
    // and a single-element array on others, so normalise rather than assume.
    const hw = unwrap(rows) as {
      section_id: string
      subjects: { name: string } | { name: string }[] | null
    }[]

    const subjectName = (s: (typeof hw)[number]['subjects']): string => {
      if (!s) return ''
      return Array.isArray(s) ? (s[0]?.name ?? '') : s.name
    }

    return secs.map((sec) => {
      const mine = hw.filter((h) => h.section_id === sec.id)
      return {
        section_id: sec.id,
        label: sec.label,
        count: mine.length,
        subjects: mine.map((h) => subjectName(h.subjects)).filter(Boolean),
      }
    })
  },
}
