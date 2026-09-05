/**
 * Data repository.
 *
 * The whole app talks to this interface and nothing else. `demo` mode serves
 * the built-in seed from memory; `supabase` mode runs the same queries against
 * Postgres with Row-Level Security. Swapping between them is one env var and
 * requires no changes in any component.
 */

import { gradeFor, pct, todayISO } from '@/lib/utils'
import type {
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary,
  ClassAttendanceRow,
  ClassSection,
  DashboardStats,
  Exam,
  FeeRecord,
  Mark,
  School,
  SessionUser,
  Staff,
  Student,
  Subject,
} from './types'

import { supabaseRepo } from './supabase-repo'
import {
  ANNOUNCEMENTS,
  ATTENDANCE_SUMMARY,
  CURRENT_TERM,
  DAILY_ATTENDANCE,
  EXAMS,
  FEE_RECORDS,
  MARKS,
  SCHOOL,
  SECTIONS,
  STAFF,
  STUDENTS,
  SUBJECTS,
  subjectsForStandard,
} from './seed'

export const DATA_MODE: 'demo' | 'supabase' =
  process.env.NEXT_PUBLIC_DATA_MODE === 'supabase' ? 'supabase' : 'demo'

export const IS_DEMO = DATA_MODE === 'demo'

/* ══════════════════════════════════════════════════════════
   Mutable in-memory store (demo mode)
   Changes made during a demo stick until the tab is reloaded,
   which is exactly what you want when showing a principal.
   ══════════════════════════════════════════════════════════ */
const store = {
  attendance: [...DAILY_ATTENDANCE],
  fees: [...FEE_RECORDS],
  marks: [...MARKS],
  announcements: [...ANNOUNCEMENTS],
}

const delay = (ms = 90) => new Promise((r) => setTimeout(r, ms))

/* ── Derived helpers ────────────────────────────────────── */

export function sectionById(id: string): ClassSection | undefined {
  return SECTIONS.find((s) => s.id === id)
}

export function studentById(id: string): Student | undefined {
  return STUDENTS.find((s) => s.id === id)
}

export function staffById(id: string): Staff | undefined {
  return STAFF.find((s) => s.id === id)
}

export function subjectById(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id)
}

/* ══════════════════════════════════════════════════════════
   Public repository API
   ══════════════════════════════════════════════════════════ */

const demoRepo = {
  /* ── School & reference data ─────────────────────────── */
  async getSchool(): Promise<School> {
    await delay(30)
    const name = process.env.NEXT_PUBLIC_SCHOOL_NAME
    const city = process.env.NEXT_PUBLIC_SCHOOL_CITY
    return { ...SCHOOL, ...(name ? { name } : {}), ...(city ? { city } : {}) }
  },

  async getSections(): Promise<ClassSection[]> {
    await delay(30)
    return SECTIONS
  },

  async getSubjects(): Promise<Subject[]> {
    await delay(20)
    return SUBJECTS
  },

  async getStaff(): Promise<Staff[]> {
    await delay(40)
    return STAFF
  },

  /* ── Students ────────────────────────────────────────── */
  async getStudents(filter?: {
    sectionId?: string
    standard?: number
    query?: string
  }): Promise<Student[]> {
    await delay(60)
    let out = STUDENTS.filter((s) => s.active)

    if (filter?.sectionId) out = out.filter((s) => s.section_id === filter.sectionId)
    if (filter?.standard) {
      const ids = SECTIONS.filter((x) => x.standard === filter.standard).map((x) => x.id)
      out = out.filter((s) => ids.includes(s.section_id))
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase().trim()
      out = out.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.name_ta.includes(q) ||
          s.admission_no.toLowerCase().includes(q) ||
          s.father_name.toLowerCase().includes(q) ||
          s.guardian_phone.includes(q),
      )
    }
    return out
  },

  async getStudent(id: string): Promise<Student | null> {
    await delay(30)
    return STUDENTS.find((s) => s.id === id) ?? null
  },

  /* ── Attendance ──────────────────────────────────────── */
  async getAttendanceForSection(
    sectionId: string,
    date: string,
  ): Promise<AttendanceRecord[]> {
    await delay(60)
    return store.attendance.filter((a) => a.section_id === sectionId && a.date === date)
  },

  async saveAttendance(input: {
    sectionId: string
    date: string
    markedBy: string
    entries: { studentId: string; status: AttendanceStatus }[]
  }): Promise<{ saved: number; absentees: Student[] }> {
    await delay(320)

    // Remove any existing rows for this section/date, then insert fresh.
    store.attendance = store.attendance.filter(
      (a) => !(a.section_id === input.sectionId && a.date === input.date),
    )

    for (const e of input.entries) {
      store.attendance.push({
        id: `att_${e.studentId}_${input.date}`,
        school_id: SCHOOL.id,
        student_id: e.studentId,
        section_id: input.sectionId,
        date: input.date,
        status: e.status,
        marked_by: input.markedBy,
        marked_at: new Date().toISOString(),
      })
    }

    const absentees = input.entries
      .filter((e) => e.status === 'absent')
      .map((e) => studentById(e.studentId))
      .filter((s): s is Student => Boolean(s))

    return { saved: input.entries.length, absentees }
  },

  async getAttendanceSummary(studentId: string): Promise<AttendanceSummary> {
    await delay(20)
    return (
      ATTENDANCE_SUMMARY[studentId] ?? {
        student_id: studentId,
        present: 0, absent: 0, late: 0, total: 0, percentage: 0,
      }
    )
  },

  async getLowAttendanceStudents(threshold = 75): Promise<
    { student: Student; summary: AttendanceSummary; section: ClassSection }[]
  > {
    await delay(70)
    return Object.values(ATTENDANCE_SUMMARY)
      .filter((s) => s.percentage < threshold)
      .map((summary) => {
        const student = studentById(summary.student_id)!
        return { student, summary, section: sectionById(student.section_id)! }
      })
      .filter((r) => Boolean(r.student))
      .sort((a, b) => a.summary.percentage - b.summary.percentage)
  },

  async getClassAttendanceToday(date = todayISO()): Promise<ClassAttendanceRow[]> {
    await delay(80)
    return SECTIONS.map((sec) => {
      const rows = store.attendance.filter(
        (a) => a.section_id === sec.id && a.date === date,
      )
      const present = rows.filter((r) => r.status !== 'absent').length
      const absent = rows.filter((r) => r.status === 'absent').length
      return {
        section_id: sec.id,
        label: sec.label,
        strength: sec.strength,
        present,
        absent,
        percentage: rows.length ? pct(present, rows.length) : 0,
        marked: rows.length > 0,
      }
    })
  },

  /* ── Fees ────────────────────────────────────────────── */
  async getFeeRecords(filter?: {
    term?: number
    status?: FeeRecord['status'] | 'unpaid'
    sectionId?: string
    query?: string
  }): Promise<{ record: FeeRecord; student: Student; section: ClassSection }[]> {
    await delay(90)
    let rows = store.fees

    if (filter?.term) rows = rows.filter((f) => f.term === filter.term)
    if (filter?.status === 'unpaid') {
      rows = rows.filter((f) => f.status !== 'paid')
    } else if (filter?.status) {
      rows = rows.filter((f) => f.status === filter.status)
    }

    let joined = rows
      .map((record) => {
        const student = studentById(record.student_id)
        if (!student) return null
        return { record, student, section: sectionById(student.section_id)! }
      })
      .filter((r): r is { record: FeeRecord; student: Student; section: ClassSection } =>
        Boolean(r),
      )

    if (filter?.sectionId) {
      joined = joined.filter((r) => r.section.id === filter.sectionId)
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase().trim()
      joined = joined.filter(
        (r) =>
          r.student.name.toLowerCase().includes(q) ||
          r.student.admission_no.toLowerCase().includes(q) ||
          r.student.guardian_phone.includes(q),
      )
    }
    return joined
  },

  async getFeeRecordsForStudent(studentId: string): Promise<FeeRecord[]> {
    await delay(30)
    return store.fees.filter((f) => f.student_id === studentId).sort((a, b) => a.term - b.term)
  },

  async recordPayment(input: {
    feeId: string
    amount: number
    method: string
  }): Promise<FeeRecord | null> {
    await delay(280)
    const rec = store.fees.find((f) => f.id === input.feeId)
    if (!rec) return null

    rec.amount_paid = Math.min(rec.amount_due, rec.amount_paid + input.amount)
    rec.status = rec.amount_paid >= rec.amount_due ? 'paid' : 'partial'
    rec.paid_on = todayISO()
    rec.method = input.method
    rec.receipt_no = rec.receipt_no ?? `RC${9000 + Math.floor(Math.random() * 999)}`
    return rec
  },

  async sendFeeReminders(term = CURRENT_TERM): Promise<number> {
    await delay(600)
    return store.fees.filter((f) => f.term === term && f.status !== 'paid').length
  },

  /* ── Exams & marks ───────────────────────────────────── */
  async getExams(): Promise<Exam[]> {
    await delay(30)
    return EXAMS
  },

  async getMarks(examId: string, sectionId: string): Promise<Mark[]> {
    await delay(90)
    const studentIds = STUDENTS.filter((s) => s.section_id === sectionId).map((s) => s.id)
    return store.marks.filter(
      (m) => m.exam_id === examId && studentIds.includes(m.student_id),
    )
  },

  async saveMarks(
    entries: { examId: string; studentId: string; subjectId: string; marks: number | null }[],
  ): Promise<number> {
    await delay(320)
    for (const e of entries) {
      const existing = store.marks.find(
        (m) =>
          m.exam_id === e.examId &&
          m.student_id === e.studentId &&
          m.subject_id === e.subjectId,
      )
      if (existing) {
        existing.marks_obtained = e.marks
        existing.absent = e.marks === null
      } else {
        store.marks.push({
          id: `mk_${e.examId}_${e.studentId}_${e.subjectId}`,
          school_id: SCHOOL.id,
          exam_id: e.examId,
          student_id: e.studentId,
          subject_id: e.subjectId,
          marks_obtained: e.marks,
          absent: e.marks === null,
          entered_by: 'stf_005',
        })
      }
    }
    return entries.length
  },

  /**
   * Full report card payload: subject rows, totals, grade, class rank
   * and attendance — everything the printed sheet needs.
   */
  async getReportCard(studentId: string, examId: string) {
    await delay(140)
    const student = studentById(studentId)
    if (!student) return null
    const section = sectionById(student.section_id)!
    const exam = EXAMS.find((e) => e.id === examId)!
    const subjects = subjectsForStandard(section.standard)

    const rows = subjects.map((sub) => {
      const mark = store.marks.find(
        (m) => m.exam_id === examId && m.student_id === studentId && m.subject_id === sub.id,
      )
      const obtained = mark?.absent ? null : (mark?.marks_obtained ?? null)
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

    // Rank within the section for this exam.
    const classmates = STUDENTS.filter((s) => s.section_id === student.section_id)
    const totals = classmates
      .map((c) => {
        const t = store.marks
          .filter((m) => m.exam_id === examId && m.student_id === c.id && !m.absent)
          .reduce((s, m) => s + (m.marks_obtained ?? 0), 0)
        return { id: c.id, t }
      })
      .sort((a, b) => b.t - a.t)
    const rank = totals.findIndex((x) => x.id === studentId) + 1

    const summary = ATTENDANCE_SUMMARY[studentId]

    return {
      student,
      section,
      exam,
      rows,
      total,
      maxTotal,
      percentage,
      grade: gradeFor(percentage),
      rank,
      classSize: classmates.length,
      passed: rows.every((r) => r.obtained === null || r.passed),
      attendance: summary,
      classTeacher: staffById(section.class_teacher_id ?? '')?.name ?? '—',
    }
  },

  /* ── Communication ───────────────────────────────────── */
  async getAnnouncements(limit?: number): Promise<Announcement[]> {
    await delay(50)
    const sorted = [...store.announcements].sort(
      (a, b) => +new Date(b.sent_at) - +new Date(a.sent_at),
    )
    return limit ? sorted.slice(0, limit) : sorted
  },

  async sendAnnouncement(input: {
    title: string
    body: string
    standard: number | null
    channels: Announcement['channels']
    sentBy: string
  }): Promise<Announcement> {
    await delay(700)
    const recipients = input.standard
      ? STUDENTS.filter(
          (s) => sectionById(s.section_id)?.standard === input.standard,
        ).length
      : STUDENTS.length

    const ann: Announcement = {
      id: `ann_${Date.now()}`,
      school_id: SCHOOL.id,
      title: input.title,
      body: input.body,
      section_id: null,
      standard: input.standard,
      channels: input.channels,
      sent_by: input.sentBy,
      sent_at: new Date().toISOString(),
      recipients,
      delivered: Math.round(recipients * 0.99),
      read: 0,
    }
    store.announcements.unshift(ann)
    return ann
  },

  /* ── Dashboard aggregate ─────────────────────────────── */
  async getDashboardStats(date = todayISO()): Promise<DashboardStats> {
    await delay(120)

    const todayRows = store.attendance.filter((a) => a.date === date)
    const present = todayRows.filter((r) => r.status !== 'absent').length
    const absent = todayRows.filter((r) => r.status === 'absent').length
    const markedSections = new Set(todayRows.map((r) => r.section_id)).size

    const termFees = store.fees.filter((f) => f.term === CURRENT_TERM)
    const collected = termFees.reduce((s, f) => s + f.amount_paid, 0)
    const target = termFees.reduce((s, f) => s + f.amount_due, 0)
    const defaulters = termFees.filter((f) => f.status !== 'paid').length

    const lowAttendance = Object.values(ATTENDANCE_SUMMARY).filter(
      (s) => s.percentage < 75,
    ).length

    return {
      total_students: STUDENTS.length,
      present_today: present,
      absent_today: absent,
      attendance_pct: todayRows.length ? pct(present, todayRows.length) : 0,
      sections_marked: markedSections,
      sections_total: SECTIONS.length,
      fees_collected: collected,
      fees_target: target,
      fees_outstanding: target - collected,
      collection_pct: pct(collected, target),
      defaulter_count: defaulters,
      low_attendance_count: lowAttendance,
    }
  },

  /** 6-month fee collection series for the dashboard chart. */
  async getCollectionTrend(): Promise<{ month: string; amount: number }[]> {
    await delay(40)
    const paid = store.fees.filter((f) => f.paid_on)
    const buckets = new Map<string, number>()
    for (const f of paid) {
      const key = f.paid_on!.slice(0, 7)
      buckets.set(key, (buckets.get(key) ?? 0) + f.amount_paid)
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        month: new Date(`${month}-01`).toLocaleDateString('en-IN', { month: 'short' }),
        amount,
      }))
  },

  /* ── Demo sessions ───────────────────────────────────── */
  async getDemoUsers(): Promise<SessionUser[]> {
    await delay(20)
    const principal = STAFF.find((s) => s.role === 'principal')!
    const correspondent = STAFF.find((s) => s.role === 'correspondent')!
    const admin = STAFF.find((s) => s.designation === 'Accountant')!
    const teacher = STAFF.find((s) => s.role === 'teacher')!
    // A parent whose child has something worth looking at.
    const child = STUDENTS.find(
      (s) => (ATTENDANCE_SUMMARY[s.id]?.percentage ?? 100) < 88,
    ) ?? STUDENTS[0]

    return [
      {
        id: principal.id, school_id: SCHOOL.id, name: principal.name,
        role: 'principal', designation: principal.designation, email: principal.email,
      },
      {
        id: correspondent.id, school_id: SCHOOL.id, name: correspondent.name,
        role: 'correspondent', designation: correspondent.designation, email: correspondent.email,
      },
      {
        id: admin.id, school_id: SCHOOL.id, name: admin.name,
        role: 'admin', designation: admin.designation, email: admin.email,
      },
      {
        id: teacher.id, school_id: SCHOOL.id, name: teacher.name,
        role: 'teacher', designation: teacher.designation, email: teacher.email,
        section_ids: teacher.class_teacher_of,
      },
      {
        id: `par_${child.id}`, school_id: SCHOOL.id,
        name: child.father_name, role: 'parent',
        designation: `Parent of ${child.name}`, email: child.guardian_email,
        student_id: child.id,
      },
    ]
  },
}

/**
 * The repository the whole app talks to.
 *
 * Demo mode serves the in-memory seed; Supabase mode runs the same operations
 * against Postgres with RLS. The two implementations share a surface, so no
 * component ever knows which one it is using.
 */
export const repo = (IS_DEMO
  ? demoRepo
  : (supabaseRepo as unknown as typeof demoRepo)) as typeof demoRepo

export { demoRepo }
export { CURRENT_TERM, SCHOOL, SECTIONS, STAFF, STUDENTS, SUBJECTS, subjectsForStandard }
