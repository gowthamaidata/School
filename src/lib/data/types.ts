/**
 * Domain model.
 *
 * Every tenant-scoped row carries `school_id`. In Supabase this column is the
 * key that Row-Level Security policies filter on, so a teacher at school A can
 * never read a row belonging to school B — enforced in the database, not the UI.
 */

export type Role = 'principal' | 'correspondent' | 'admin' | 'teacher' | 'parent'

export type Board = 'matriculation' | 'cbse' | 'state' | 'icse'

export type AttendanceStatus = 'present' | 'absent' | 'late'

export type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue'

export type MessageChannel = 'portal' | 'whatsapp' | 'sms'

/* ── Tenant ─────────────────────────────────────────────── */
export interface School {
  id: string
  name: string
  name_ta: string
  board: Board
  city: string
  district: string
  phone: string
  email: string
  address: string
  academic_year: string
  /** UDISE+ code — every recognised Indian school has one. */
  udise_code: string
  logo_text: string
  working_days_this_term: number
  term_fee_target: number
}

/* ── People ─────────────────────────────────────────────── */
export interface Staff {
  id: string
  school_id: string
  name: string
  role: Role
  designation: string
  designation_ta: string
  phone: string
  email: string
  subjects: string[]
  /** Section ids where this person is the class teacher. */
  class_teacher_of: string[]
  joined_on: string
}

export interface ClassSection {
  id: string
  school_id: string
  /** 1–12 */
  standard: number
  section: string
  /** Display: "8-A" */
  label: string
  class_teacher_id: string | null
  room: string
  strength: number
}

export interface Student {
  id: string
  school_id: string
  admission_no: string
  name: string
  name_ta: string
  roll_no: number
  section_id: string
  gender: 'M' | 'F'
  dob: string
  blood_group: string
  father_name: string
  mother_name: string
  guardian_phone: string
  guardian_email: string
  address: string
  transport_route: string | null
  admitted_on: string
  active: boolean
}

/* ── Attendance ─────────────────────────────────────────── */
export interface AttendanceRecord {
  id: string
  school_id: string
  student_id: string
  section_id: string
  date: string
  status: AttendanceStatus
  marked_by: string
  marked_at: string
}

/** Rolled-up per-student attendance for the current term. */
export interface AttendanceSummary {
  student_id: string
  present: number
  absent: number
  late: number
  total: number
  percentage: number
}

/* ── Fees ───────────────────────────────────────────────── */
export interface FeeStructure {
  id: string
  school_id: string
  standard: number
  term: number
  label: string
  amount: number
  due_date: string
}

export interface FeeRecord {
  id: string
  school_id: string
  student_id: string
  term: number
  amount_due: number
  amount_paid: number
  status: FeeStatus
  due_date: string
  paid_on: string | null
  /** UPI / Cash / Cheque / Bank transfer */
  method: string | null
  receipt_no: string | null
}

/* ── Exams ──────────────────────────────────────────────── */
export interface Exam {
  id: string
  school_id: string
  name: string
  name_ta: string
  term: number
  start_date: string
  end_date: string
  standards: number[]
  published: boolean
}

export interface Subject {
  id: string
  school_id: string
  code: string
  name: string
  name_ta: string
  standards: number[]
  max_marks: number
  pass_marks: number
}

export interface Mark {
  id: string
  school_id: string
  exam_id: string
  student_id: string
  subject_id: string
  marks_obtained: number | null
  /** true when the student missed the paper */
  absent: boolean
  entered_by: string
}

/* ── Communication ──────────────────────────────────────── */
export interface Announcement {
  id: string
  school_id: string
  title: string
  body: string
  /** null = whole school */
  section_id: string | null
  standard: number | null
  channels: MessageChannel[]
  sent_by: string
  sent_at: string
  recipients: number
  delivered: number
  read: number
}

/* ── Session ────────────────────────────────────────────── */
export interface SessionUser {
  id: string
  school_id: string
  name: string
  role: Role
  designation: string
  /** Set when role === 'parent' — the child they can see. */
  student_id?: string
  /** Sections a teacher is allowed to mark attendance for. */
  section_ids?: string[]
  email: string
}

/* ── Aggregates used by the dashboard ───────────────────── */
export interface DashboardStats {
  total_students: number
  present_today: number
  absent_today: number
  attendance_pct: number
  sections_marked: number
  sections_total: number
  fees_collected: number
  fees_target: number
  fees_outstanding: number
  collection_pct: number
  defaulter_count: number
  low_attendance_count: number
}

export interface ClassAttendanceRow {
  section_id: string
  label: string
  strength: number
  present: number
  absent: number
  percentage: number
  marked: boolean
}
