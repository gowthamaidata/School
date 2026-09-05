/**
 * Deterministic demo dataset for a Tamil Nadu matriculation school.
 *
 * Everything here is generated from a fixed seed, so the numbers you rehearse
 * a demo with are the numbers the principal sees. Nothing is random at runtime.
 *
 * This is clearly-labelled sample data. Replace it with a real school by
 * switching NEXT_PUBLIC_DATA_MODE to "supabase".
 */

import { seededRandom } from '@/lib/utils'
import type {
  Announcement,
  AttendanceRecord,
  AttendanceSummary,
  ClassSection,
  Exam,
  FeeRecord,
  FeeStructure,
  Homework,
  Mark,
  School,
  Staff,
  Student,
  Subject,
} from './types'

const rand = seededRandom(20260904)

/* ── Name pools ─────────────────────────────────────────── */
const BOY_NAMES: [string, string][] = [
  ['Aravind', 'அரவிந்த்'], ['Karthik', 'கார்த்திக்'], ['Dinesh', 'தினேஷ்'],
  ['Surya', 'சூர்யா'], ['Vignesh', 'விக்னேஷ்'], ['Praveen', 'பிரவீன்'],
  ['Ashwin', 'அஸ்வின்'], ['Bharath', 'பரத்'], ['Gokul', 'கோகுல்'],
  ['Hariharan', 'ஹரிஹரன்'], ['Jeevan', 'ஜீவன்'], ['Kavin', 'கவின்'],
  ['Logesh', 'லோகேஷ்'], ['Manoj', 'மனோஜ்'], ['Naveen', 'நவீன்'],
  ['Prasanth', 'பிரசாந்த்'], ['Rajesh', 'ராஜேஷ்'], ['Sanjay', 'சஞ்சய்'],
  ['Tharun', 'தருண்'], ['Vimal', 'விமல்'], ['Yuvaraj', 'யுவராஜ்'],
  ['Arun', 'அருண்'], ['Balaji', 'பாலாஜி'], ['Chandru', 'சந்துரு'],
  ['Deepak', 'தீபக்'], ['Ganesh', 'கணேஷ்'], ['Harish', 'ஹரிஷ்'],
  ['Iniyan', 'இனியன்'], ['Kamalesh', 'கமலேஷ்'], ['Mohan', 'மோகன்'],
  ['Nithish', 'நிதிஷ்'], ['Pandiyan', 'பாண்டியன்'], ['Ragul', 'ராகுல்'],
  ['Sathish', 'சதீஷ்'], ['Tamilarasan', 'தமிழரசன்'], ['Venkatesh', 'வெங்கடேஷ்'],
  ['Adhithya', 'ஆதித்யா'], ['Barani', 'பரணி'], ['Chezhian', 'செழியன்'],
  ['Muthukumar', 'முத்துக்குமார்'],
]

const GIRL_NAMES: [string, string][] = [
  ['Aishwarya', 'ஐஸ்வர்யா'], ['Bhuvana', 'புவனா'], ['Deepika', 'தீபிகா'],
  ['Elakkiya', 'இலக்கியா'], ['Gayathri', 'காயத்ரி'], ['Harini', 'ஹரிணி'],
  ['Janani', 'ஜனனி'], ['Kavya', 'காவ்யா'], ['Lakshmi', 'லட்சுமி'],
  ['Meena', 'மீனா'], ['Nandhini', 'நந்தினி'], ['Oviya', 'ஓவியா'],
  ['Priya', 'பிரியா'], ['Ramya', 'ரம்யா'], ['Sowmya', 'சௌம்யா'],
  ['Thamarai', 'தாமரை'], ['Uma', 'உமா'], ['Vaishnavi', 'வைஷ்ணவி'],
  ['Yazhini', 'யாழினி'], ['Abinaya', 'அபிநயா'], ['Divya', 'திவ்யா'],
  ['Gowri', 'கௌரி'], ['Indhu', 'இந்து'], ['Kalaivani', 'கலைவாணி'],
  ['Malathi', 'மாலதி'], ['Nivetha', 'நிவேதா'], ['Pavithra', 'பவித்ரா'],
  ['Revathi', 'ரேவதி'], ['Sangeetha', 'சங்கீதா'], ['Tharani', 'தரணி'],
  ['Vidhya', 'வித்யா'], ['Yuvasri', 'யுவஸ்ரீ'], ['Charulatha', 'சாருலதா'],
  ['Ilakkiya', 'இலக்கியா'], ['Keerthana', 'கீர்த்தனா'], ['Monisha', 'மோனிஷா'],
  ['Nithya', 'நித்யா'], ['Poornima', 'பூர்ணிமா'], ['Swetha', 'ஸ்வேதா'],
  ['Vennila', 'வெண்ணிலா'],
]

const SURNAMES: [string, string][] = [
  ['Murugan', 'முருகன்'], ['Selvam', 'செல்வம்'], ['Rajendran', 'ராஜேந்திரன்'],
  ['Krishnan', 'கிருஷ்ணன்'], ['Natarajan', 'நடராஜன்'], ['Sundaram', 'சுந்தரம்'],
  ['Ganesan', 'கணேசன்'], ['Palanisamy', 'பழனிசாமி'], ['Kandasamy', 'கந்தசாமி'],
  ['Ramasamy', 'ராமசாமி'], ['Subramanian', 'சுப்ரமணியன்'], ['Venkatesan', 'வெங்கடேசன்'],
  ['Arumugam', 'ஆறுமுகம்'], ['Duraisamy', 'துரைசாமி'], ['Ilangovan', 'இளங்கோவன்'],
  ['Jayaraman', 'ஜெயராமன்'], ['Manickam', 'மாணிக்கம்'], ['Perumal', 'பெருமாள்'],
  ['Sivakumar', 'சிவகுமார்'], ['Thangavel', 'தங்கவேல்'],
]

const MOTHER_NAMES = [
  'Kalpana', 'Vasanthi', 'Jayanthi', 'Saroja', 'Amudha', 'Rajeswari',
  'Kanchana', 'Vijaya', 'Sumathi', 'Bhuvaneswari', 'Latha', 'Chitra',
  'Anandhi', 'Selvi', 'Devi', 'Padma', 'Usha', 'Geetha',
]

const AREAS = [
  'Gandhipuram', 'RS Puram', 'Peelamedu', 'Saibaba Colony', 'Singanallur',
  'Ganapathy', 'Ramanathapuram', 'Kuniamuthur', 'Vadavalli', 'Thudiyalur',
  'Sundarapuram', 'Kavundampalayam',
]

const BLOOD = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B+', 'O+', 'A+', 'B+']

const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
const between = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))

/* ── School ─────────────────────────────────────────────── */
export const SCHOOL: School = {
  id: 'sch_demo_001',
  name: 'Thamizh Nilam Matriculation Higher Secondary School',
  name_ta: 'தமிழ் நிலம் மெட்ரிகுலேஷன் மேல்நிலைப் பள்ளி',
  board: 'matriculation',
  city: 'Coimbatore',
  district: 'Coimbatore',
  phone: '0422 246 8800',
  email: 'office@thamizhnilam.demo',
  address: '14, Trichy Road, Ramanathapuram, Coimbatore — 641045',
  academic_year: '2026–2027',
  udise_code: '33091200000',
  logo_text: 'TN',
  working_days_this_term: 58,
  term_fee_target: 0, // computed below
}

/* ── Subjects ───────────────────────────────────────────── */
export const SUBJECTS: Subject[] = [
  { id: 'sub_ta', school_id: SCHOOL.id, code: 'TAM', name: 'Tamil', name_ta: 'தமிழ்', standards: [1,2,3,4,5,6,7,8,9,10], max_marks: 100, pass_marks: 35 },
  { id: 'sub_en', school_id: SCHOOL.id, code: 'ENG', name: 'English', name_ta: 'ஆங்கிலம்', standards: [1,2,3,4,5,6,7,8,9,10,11,12], max_marks: 100, pass_marks: 35 },
  { id: 'sub_ma', school_id: SCHOOL.id, code: 'MAT', name: 'Mathematics', name_ta: 'கணிதம்', standards: [1,2,3,4,5,6,7,8,9,10,11,12], max_marks: 100, pass_marks: 35 },
  { id: 'sub_sc', school_id: SCHOOL.id, code: 'SCI', name: 'Science', name_ta: 'அறிவியல்', standards: [1,2,3,4,5,6,7,8,9,10], max_marks: 100, pass_marks: 35 },
  { id: 'sub_ss', school_id: SCHOOL.id, code: 'SOC', name: 'Social Science', name_ta: 'சமூக அறிவியல்', standards: [1,2,3,4,5,6,7,8,9,10], max_marks: 100, pass_marks: 35 },
  { id: 'sub_cs', school_id: SCHOOL.id, code: 'CSC', name: 'Computer Science', name_ta: 'கணினி அறிவியல்', standards: [6,7,8,9,10,11,12], max_marks: 100, pass_marks: 35 },
  { id: 'sub_ph', school_id: SCHOOL.id, code: 'PHY', name: 'Physics', name_ta: 'இயற்பியல்', standards: [11,12], max_marks: 100, pass_marks: 35 },
  { id: 'sub_ch', school_id: SCHOOL.id, code: 'CHE', name: 'Chemistry', name_ta: 'வேதியியல்', standards: [11,12], max_marks: 100, pass_marks: 35 },
  { id: 'sub_bi', school_id: SCHOOL.id, code: 'BIO', name: 'Biology', name_ta: 'உயிரியல்', standards: [11,12], max_marks: 100, pass_marks: 35 },
]

export function subjectsForStandard(standard: number): Subject[] {
  return SUBJECTS.filter((s) => s.standards.includes(standard))
}

/* ── Sections ───────────────────────────────────────────── */
export const SECTIONS: ClassSection[] = (() => {
  const out: ClassSection[] = []
  for (let std = 1; std <= 12; std++) {
    const sections = std <= 10 ? ['A', 'B'] : ['A', 'B']
    for (const sec of sections) {
      out.push({
        id: `sec_${std}${sec}`,
        school_id: SCHOOL.id,
        standard: std,
        section: sec,
        label: `${std}-${sec}`,
        class_teacher_id: null,
        room: `${std < 6 ? 'Block A' : std < 11 ? 'Block B' : 'Block C'} · ${std}${sec}`,
        strength: 0,
      })
    }
  }
  return out
})()

/* ── Staff ──────────────────────────────────────────────── */
const STAFF_SEED: {
  name: string
  role: Staff['role']
  designation: string
  designation_ta: string
  subjects: string[]
}[] = [
  { name: 'Meenakshi Sundaram', role: 'correspondent', designation: 'Correspondent', designation_ta: 'தாளாளர்', subjects: [] },
  { name: 'Lalitha Raghavan', role: 'principal', designation: 'Principal', designation_ta: 'தலைமையாசிரியர்', subjects: [] },
  { name: 'Saravanan Kumar', role: 'admin', designation: 'Office Superintendent', designation_ta: 'அலுவலக கண்காணிப்பாளர்', subjects: [] },
  { name: 'Kavitha Anand', role: 'admin', designation: 'Accountant', designation_ta: 'கணக்காளர்', subjects: [] },
]

const TEACHER_NAMES = [
  'Priya Dharshini', 'Ramesh Babu', 'Anitha Mohan', 'Suresh Kannan',
  'Vijayalakshmi S', 'Karthikeyan M', 'Deepa Rajan', 'Manikandan P',
  'Sudha Ravi', 'Gopinath V', 'Hemalatha K', 'Senthil Kumar',
  'Bhavani Prakash', 'Arun Chelladurai', 'Nirmala Devi', 'Prabhu Shankar',
  'Revathy Natarajan', 'Sathyanarayanan R', 'Uma Maheswari', 'Vetrivel A',
  'Jayashree M', 'Dhanasekaran K', 'Kalaiselvi P', 'Muthu Vel',
]

export const STAFF: Staff[] = (() => {
  const out: Staff[] = []
  STAFF_SEED.forEach((s, i) => {
    out.push({
      id: `stf_${String(i + 1).padStart(3, '0')}`,
      school_id: SCHOOL.id,
      name: s.name,
      role: s.role,
      designation: s.designation,
      designation_ta: s.designation_ta,
      phone: `9${between(400000000, 899999999)}`,
      email: `${s.name.split(' ')[0].toLowerCase()}@thamizhnilam.demo`,
      subjects: s.subjects,
      class_teacher_of: [],
      joined_on: `20${between(10, 20)}-06-01`,
    })
  })

  TEACHER_NAMES.forEach((name, i) => {
    const teachable = SUBJECTS.filter((s) => s.id !== 'sub_bi')
    const mine = [teachable[i % teachable.length].name]
    if (rand() > 0.55) mine.push(teachable[(i + 3) % teachable.length].name)
    out.push({
      id: `stf_${String(out.length + 1).padStart(3, '0')}`,
      school_id: SCHOOL.id,
      name,
      role: 'teacher',
      designation: i < 18 ? 'Graduate Teacher' : 'Post Graduate Teacher',
      designation_ta: i < 18 ? 'பட்டதாரி ஆசிரியர்' : 'முதுகலை ஆசிரியர்',
      phone: `9${between(400000000, 899999999)}`,
      email: `${name.split(' ')[0].toLowerCase()}${i}@thamizhnilam.demo`,
      subjects: mine,
      class_teacher_of: [],
      joined_on: `20${between(14, 24)}-06-01`,
    })
  })

  // Assign one class teacher per section
  const teachers = out.filter((s) => s.role === 'teacher')
  SECTIONS.forEach((sec, i) => {
    const t = teachers[i % teachers.length]
    sec.class_teacher_id = t.id
    t.class_teacher_of.push(sec.id)
  })

  return out
})()

/* ── Students ───────────────────────────────────────────── */
export const STUDENTS: Student[] = (() => {
  const out: Student[] = []
  let admissionCounter = 1

  for (const sec of SECTIONS) {
    const strength = sec.standard <= 10 ? between(19, 26) : between(14, 20)
    sec.strength = strength

    for (let r = 1; r <= strength; r++) {
      const isBoy = rand() > 0.48
      const [first, firstTa] = isBoy ? pick(BOY_NAMES) : pick(GIRL_NAMES)
      const [sur, surTa] = pick(SURNAMES)
      const fatherFirst = pick(BOY_NAMES)[0]
      const birthYear = 2026 - (sec.standard + 5)

      out.push({
        id: `stu_${String(admissionCounter).padStart(4, '0')}`,
        school_id: SCHOOL.id,
        admission_no: `TN${birthYear % 100}${String(admissionCounter).padStart(4, '0')}`,
        name: `${first} ${sur[0]}`,
        name_ta: `${firstTa} ${surTa[0]}`,
        roll_no: r,
        section_id: sec.id,
        gender: isBoy ? 'M' : 'F',
        dob: `${birthYear}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
        blood_group: pick(BLOOD),
        father_name: `${fatherFirst} ${sur}`,
        mother_name: `${pick(MOTHER_NAMES)} ${fatherFirst[0]}`,
        guardian_phone: `9${between(400000000, 899999999)}`,
        guardian_email: `${first.toLowerCase()}.parent${admissionCounter}@example.com`,
        address: `${between(1, 180)}, ${pick(AREAS)}, Coimbatore`,
        transport_route: rand() > 0.62 ? `Route ${between(1, 8)}` : null,
        admitted_on: `20${26 - sec.standard + 1}-06-05`,
        active: true,
      })
      admissionCounter++
    }
  }
  return out
})()

export const TOTAL_STUDENTS = STUDENTS.length

/* ── Attendance ─────────────────────────────────────────── */
/**
 * Stored as (a) a per-student term summary and (b) daily rows for the last
 * 15 school days. Generating 500 × 58 rows up front would bloat memory for
 * no visible benefit.
 */
const WORKING_DAYS = SCHOOL.working_days_this_term

export const ATTENDANCE_SUMMARY: Record<string, AttendanceSummary> = (() => {
  const out: Record<string, AttendanceSummary> = {}
  for (const s of STUDENTS) {
    // Most students attend well; a deliberate tail sits under 75%.
    // The bands overlap enough that no two alerts show the same percentage,
    // which is what real attendance data looks like.
    const roll = rand()
    let absentRate: number
    if (roll > 0.94) {
      // Chronic absentees. The band has to be wide AND evenly spread: with only
      // ~58 working days the percentage is quantised to ~1.7% steps, so a narrow
      // band lands every alert on the same figure, which reads as fabricated.
      absentRate = 0.26 + rand() * 0.42
    } else if (roll > 0.84) {
      absentRate = 0.13 + rand() * 0.12
    } else {
      absentRate = rand() * 0.1
    }

    const absent = Math.max(0, Math.min(WORKING_DAYS, Math.round(WORKING_DAYS * absentRate)))
    const late = Math.round(rand() * 4)
    const present = WORKING_DAYS - absent
    out[s.id] = {
      student_id: s.id,
      present,
      absent,
      late,
      total: WORKING_DAYS,
      percentage: Math.round((present / WORKING_DAYS) * 1000) / 10,
    }
  }
  return out
})()

/** School days going back from today, skipping Sundays. */
export function recentSchoolDays(count: number, from = new Date()): string[] {
  const days: string[] = []
  const d = new Date(from)
  while (days.length < count) {
    if (d.getDay() !== 0) days.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() - 1)
  }
  return days
}

export const DAILY_ATTENDANCE: AttendanceRecord[] = (() => {
  const out: AttendanceRecord[] = []
  const days = recentSchoolDays(15)
  // Today is deliberately left partly unmarked so the demo can show
  // "6 classes pending" and the teacher can complete one live.
  const today = days[0]

  for (const day of days) {
    for (const s of STUDENTS) {
      const sec = SECTIONS.find((x) => x.id === s.section_id)!
      // On today, only the first 18 sections are already marked.
      if (day === today && SECTIONS.indexOf(sec) >= 18) continue

      const summary = ATTENDANCE_SUMMARY[s.id]
      const absentChance = summary.absent / summary.total
      const r = rand()
      const status = r < absentChance ? 'absent' : r < absentChance + 0.03 ? 'late' : 'present'
      out.push({
        id: `att_${s.id}_${day}`,
        school_id: SCHOOL.id,
        student_id: s.id,
        section_id: s.section_id,
        date: day,
        status,
        marked_by: sec.class_teacher_id ?? 'stf_005',
        marked_at: `${day}T09:${String(between(5, 40)).padStart(2, '0')}:00`,
      })
    }
  }
  return out
})()

/* ── Fees ───────────────────────────────────────────────── */
function termFeeFor(standard: number): number {
  if (standard <= 5) return 11500
  if (standard <= 8) return 14500
  if (standard <= 10) return 17500
  return 21500
}

export const CURRENT_TERM = 2

export const FEE_STRUCTURES: FeeStructure[] = (() => {
  const out: FeeStructure[] = []
  for (let std = 1; std <= 12; std++) {
    for (let term = 1; term <= 3; term++) {
      out.push({
        id: `fs_${std}_${term}`,
        school_id: SCHOOL.id,
        standard: std,
        term,
        label: `Term ${term} fee`,
        amount: termFeeFor(std),
        due_date: term === 1 ? '2026-06-20' : term === 2 ? '2026-09-20' : '2026-12-20',
      })
    }
  }
  return out
})()

export const FEE_RECORDS: FeeRecord[] = (() => {
  const out: FeeRecord[] = []
  let receipt = 1000

  for (const s of STUDENTS) {
    const sec = SECTIONS.find((x) => x.id === s.section_id)!
    const amount = termFeeFor(sec.standard)

    for (let term = 1; term <= CURRENT_TERM; term++) {
      const structure = FEE_STRUCTURES.find(
        (f) => f.standard === sec.standard && f.term === term,
      )!

      // Term 1 is nearly fully collected; term 2 is mid-collection.
      const r = rand()
      let status: FeeRecord['status']
      let paid: number

      if (term < CURRENT_TERM) {
        if (r > 0.965) { status = 'overdue'; paid = 0 }
        else if (r > 0.94) { status = 'partial'; paid = Math.round(amount * 0.5 / 500) * 500 }
        else { status = 'paid'; paid = amount }
      } else {
        if (r > 0.72) { status = 'pending'; paid = 0 }
        else if (r > 0.64) { status = 'partial'; paid = Math.round(amount * (0.3 + rand() * 0.3) / 500) * 500 }
        else { status = 'paid'; paid = amount }
      }

      const isPaid = status === 'paid' || status === 'partial'
      // Payments trickle in over two months per term, so the collection
      // trend chart has a real shape rather than two spikes.
      const payMonth = term === 1 ? (rand() > 0.35 ? 6 : 7) : rand() > 0.45 ? 8 : 9
      out.push({
        id: `fee_${s.id}_t${term}`,
        school_id: SCHOOL.id,
        student_id: s.id,
        term,
        amount_due: amount,
        amount_paid: paid,
        status,
        due_date: structure.due_date,
        paid_on: isPaid
          ? `2026-0${payMonth}-${String(between(2, 26)).padStart(2, '0')}`
          : null,
        method: isPaid ? pick(['UPI', 'UPI', 'UPI', 'Cash', 'Bank transfer', 'Cheque']) : null,
        receipt_no: isPaid ? `RC${receipt++}` : null,
      })
    }
  }
  return out
})()

SCHOOL.term_fee_target = FEE_RECORDS.filter((f) => f.term === CURRENT_TERM).reduce(
  (sum, f) => sum + f.amount_due,
  0,
)

/* ── Exams & marks ──────────────────────────────────────── */
export const EXAMS: Exam[] = [
  {
    id: 'exm_q1', school_id: SCHOOL.id, name: 'Quarterly Examination',
    name_ta: 'காலாண்டுத் தேர்வு', term: 1,
    start_date: '2026-07-13', end_date: '2026-07-22',
    standards: [1,2,3,4,5,6,7,8,9,10,11,12], published: true,
  },
  {
    id: 'exm_m1', school_id: SCHOOL.id, name: 'Mid-Term Test',
    name_ta: 'இடைப்பருவத் தேர்வு', term: 2,
    start_date: '2026-08-24', end_date: '2026-08-29',
    standards: [1,2,3,4,5,6,7,8,9,10,11,12], published: true,
  },
  {
    id: 'exm_h1', school_id: SCHOOL.id, name: 'Half-Yearly Examination',
    name_ta: 'அரையாண்டுத் தேர்வு', term: 2,
    start_date: '2026-10-05', end_date: '2026-10-16',
    standards: [1,2,3,4,5,6,7,8,9,10,11,12], published: false,
  },
  {
    id: 'exm_r1', school_id: SCHOOL.id, name: 'Revision Test I',
    name_ta: 'திருப்புதல் தேர்வு I', term: 3,
    start_date: '2026-12-08', end_date: '2026-12-12',
    standards: [10, 12], published: false,
  },
]

export const MARKS: Mark[] = (() => {
  const out: Mark[] = []
  const published = EXAMS.filter((e) => e.published)

  for (const exam of published) {
    for (const s of STUDENTS) {
      const sec = SECTIONS.find((x) => x.id === s.section_id)!
      const subjects = subjectsForStandard(sec.standard)
      // Each student has a latent ability so their subject scores stay coherent
      // across papers. Mixed hard enough that neighbouring admission numbers
      // don't end up with near-identical ability — otherwise a whole class
      // scores within three marks of each other and the data looks fabricated.
      let h = 2166136261
      for (let i = 0; i < s.id.length; i++) {
        h ^= s.id.charCodeAt(i)
        h = Math.imul(h, 16777619)
      }
      h ^= h >>> 13
      h = Math.imul(h, 0x5bd1e995)
      h ^= h >>> 15
      const ability = (h >>> 0) / 4294967296 // 0..1
      const base = 34 + ability * 58

      for (const sub of subjects) {
        const isAbsent = rand() > 0.988
        const noise = (rand() - 0.5) * 26
        const raw = Math.round(base + noise)
        out.push({
          id: `mk_${exam.id}_${s.id}_${sub.id}`,
          school_id: SCHOOL.id,
          exam_id: exam.id,
          student_id: s.id,
          subject_id: sub.id,
          marks_obtained: isAbsent ? null : Math.max(12, Math.min(100, raw)),
          absent: isAbsent,
          entered_by: sec.class_teacher_id ?? 'stf_005',
        })
      }
    }
  }
  return out
})()

/* ── Announcements ──────────────────────────────────────── */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_005', school_id: SCHOOL.id,
    title: 'Half-Yearly Examination timetable released',
    body: 'The Half-Yearly Examination will be held from 5 October to 16 October 2026. The detailed timetable has been shared with class teachers and is available in the parent app. Please ensure your child revises according to the schedule. School will function as usual on all exam days with dispersal at 12:30 PM.',
    section_id: null, standard: null,
    channels: ['portal', 'whatsapp'], sent_by: 'stf_002',
    sent_at: '2026-09-02T10:15:00', recipients: 512, delivered: 507, read: 411,
  },
  {
    id: 'ann_004', school_id: SCHOOL.id,
    title: 'Term 2 fee — last date 20 September',
    body: 'This is a gentle reminder that Term 2 fees are due on 20 September 2026. Payment can be made by UPI, at the school office, or by bank transfer. Kindly quote your ward\'s admission number in the payment reference. For any difficulty please contact the office at 0422 246 8800.',
    section_id: null, standard: null,
    channels: ['portal', 'whatsapp', 'sms'], sent_by: 'stf_004',
    sent_at: '2026-08-30T16:40:00', recipients: 512, delivered: 509, read: 386,
  },
  {
    id: 'ann_003', school_id: SCHOOL.id,
    title: 'Std 10 — extra Mathematics coaching from Monday',
    body: 'Additional Mathematics coaching for Standard 10 students will begin from Monday, 1 September, and will be held every weekday from 3:45 PM to 4:45 PM. Attendance is strongly recommended for students scoring below 60 in the Quarterly Examination. Transport for the late batch will be available on Routes 2, 4 and 6.',
    section_id: null, standard: 10,
    channels: ['portal', 'whatsapp'], sent_by: 'stf_002',
    sent_at: '2026-08-28T09:05:00', recipients: 44, delivered: 44, read: 39,
  },
  {
    id: 'ann_002', school_id: SCHOOL.id,
    title: 'Vinayagar Chaturthi holiday — 15 September',
    body: 'The school will remain closed on Monday, 15 September 2026, on account of Vinayagar Chaturthi. Classes resume on Tuesday, 16 September as per the regular timetable.',
    section_id: null, standard: null,
    channels: ['portal', 'whatsapp'], sent_by: 'stf_003',
    sent_at: '2026-08-25T11:00:00', recipients: 512, delivered: 511, read: 448,
  },
  {
    id: 'ann_001', school_id: SCHOOL.id,
    title: 'Annual Sports Day — 21 November',
    body: 'Our Annual Sports Day will be celebrated on Saturday, 21 November 2026 at the school ground from 8:30 AM. Parents are cordially invited. Students participating in track events should report to their PT instructor for practice sessions beginning next week.',
    section_id: null, standard: null,
    channels: ['portal', 'whatsapp'], sent_by: 'stf_002',
    sent_at: '2026-08-20T14:20:00', recipients: 512, delivered: 505, read: 402,
  },
]

/* ── Homework ───────────────────────────────────────────── */

/**
 * Realistic homework text by subject and standard band. Written the way a
 * Tamil Nadu matriculation teacher actually words it — page numbers, sum
 * ranges, and what to bring tomorrow — because a principal reads these and
 * decides in about four seconds whether the app understands their school.
 */
const HOMEWORK_TEMPLATES: Record<string, { junior: [string, string][]; senior: [string, string][] }> = {
  sub_ta: {
    junior: [
      ['பாடம் 4 — சொல் வகைகள்', 'பக்கம் 38-ல் உள்ள சொற்களை மூன்று முறை எழுதி வரவும். புதிய சொற்கள் ஐந்திற்கு வாக்கியம் அமைக்கவும்.'],
      ['திருக்குறள் மனப்பாடம்', 'அதிகாரம் 4 — அறன் வலியுறுத்தல். முதல் ஐந்து குறள்களை மனப்பாடம் செய்து வரவும். நாளை வகுப்பில் ஒப்புவிக்க வேண்டும்.'],
      ['கடிதம் எழுதுதல்', 'விடுமுறை கேட்டு தலைமை ஆசிரியருக்கு ஒரு கடிதம் எழுதவும். நோட்டுப் புத்தகத்தில் எழுதி வரவும்.'],
    ],
    senior: [
      ['இலக்கணம் — வினைமுற்று', 'பக்கம் 112 முதல் 115 வரை படித்து, பயிற்சி வினாக்கள் 1 முதல் 8 வரை விடையளிக்கவும்.'],
      ['கட்டுரை — சுற்றுச்சூழல் பாதுகாப்பு', 'இருநூறு சொற்களில் கட்டுரை எழுதி வரவும். புள்ளிவிவரங்களைச் சேர்க்கவும்.'],
    ],
  },
  sub_en: {
    junior: [
      ['Unit 3 — Reading comprehension', 'Read the passage on page 42 and answer questions 1 to 6 in your notebook. Underline any five new words and write their meanings.'],
      ['Spelling and dictation', 'Learn the twenty spelling words from page 45. Dictation test tomorrow. Write each word three times.'],
      ['Picture composition', 'Write eight sentences describing the picture on page 51. Use at least three adjectives.'],
    ],
    senior: [
      ['Letter writing — formal', 'Write a letter to the Municipal Commissioner about the poor street lighting near the school. Follow the format on page 88.'],
      ['Grammar — active and passive voice', 'Complete Exercise 5A and 5B on pages 96 and 97. Both to be done in the grammar notebook.'],
      ['Prose — comprehension questions', 'Answer questions 1 to 5 from "The Last Leaf" in about 60 words each.'],
    ],
  },
  sub_ma: {
    junior: [
      ['Multiplication tables 12 to 16', 'Write tables 12 to 16 five times each. Oral test tomorrow morning.'],
      ['Chapter 5 — Fractions', 'Solve sums 1 to 12 from Exercise 5.2 on page 63. Show all working steps.'],
      ['Word problems', 'Solve the eight word problems on page 70. Draw a rough diagram for each one.'],
    ],
    senior: [
      ['Exercise 6.3 — Trigonometry', 'Solve problems 1 to 10 on page 134. Show every step; answers alone will not be accepted.'],
      ['Chapter 4 — Quadratic equations', 'Complete Exercise 4.2 fully. Revise the discriminant formula for the class test on Friday.'],
      ['Coordinate geometry — practice', 'Solve sums 5 to 15 from Exercise 5.4. Bring graph sheets tomorrow.'],
    ],
  },
  sub_sc: {
    junior: [
      ['Chapter 6 — Plants around us', 'Draw and label the parts of a flower. Collect two different leaves and paste them in your record notebook.'],
      ['States of matter', 'Read pages 55 to 58. Write the definitions of solid, liquid and gas with two examples each.'],
      ['Simple experiment', 'Observe what happens to a glass of water kept in sunlight for four hours. Write four sentences on what you noticed.'],
    ],
    senior: [
      ['Chapter 8 — Chemical reactions', 'Write balanced equations for questions 1 to 8 on page 121. Learn the reactivity series.'],
      ['Diagram practice', 'Draw and label the human respiratory system. Neat diagram in the record notebook, to be submitted tomorrow.'],
      ['Numerical problems — Light', 'Solve the six numerical problems on page 145 using the mirror formula.'],
    ],
  },
  sub_ss: {
    junior: [
      ['Chapter 4 — Our state Tamil Nadu', 'Mark the 38 districts on the outline map given. Learn the names of the five neighbouring states.'],
      ['Civics — Local government', 'Answer questions 1 to 5 on page 78. Write four lines about what a Panchayat does.'],
    ],
    senior: [
      ['History — Freedom movement', 'Answer the five-mark questions 1 to 4 from Chapter 7. Write about 100 words for each.'],
      ['Geography — map work', 'On the India outline map, mark the major river systems and the four metropolitan cities. Bring the map tomorrow.'],
      ['Economics — Chapter 3', 'Read pages 88 to 94 and prepare notes on the five sectors of the Indian economy.'],
    ],
  },
  sub_cs: {
    junior: [
      ['MS Word practice', 'Type the paragraph on page 34, make the heading bold and centred, and save the file as your name. Practical test next week.'],
      ['Parts of a computer', 'Draw the block diagram of a computer and label the input, output and processing units.'],
    ],
    senior: [
      ['Python — loops', 'Write programs for questions 1 to 5 on page 102 using for and while loops. Bring your record notebook with output written.'],
      ['SQL practice', 'Write SELECT queries for the eight problems on page 118. Practical session tomorrow in the lab.'],
    ],
  },
  sub_ph: {
    junior: [],
    senior: [
      ['Unit 3 — Laws of motion', 'Solve numerical problems 1 to 8 on page 87. Derive the equation for a body on an inclined plane.'],
      ['Practical record', 'Complete the write-up for the simple pendulum experiment including observations, calculations and the result. Submit tomorrow.'],
    ],
  },
  sub_ch: {
    junior: [],
    senior: [
      ['Unit 5 — Periodic classification', 'Learn the first 30 elements with their symbols and atomic numbers. Test tomorrow.'],
      ['Organic chemistry — nomenclature', 'Name the twelve structures given on page 143 using IUPAC rules. Write in the chemistry notebook.'],
    ],
  },
  sub_bi: {
    junior: [],
    senior: [
      ['Unit 4 — Cell biology', 'Draw a labelled diagram of a plant cell and an animal cell. Write five points of difference between them.'],
      ['Genetics — problems', 'Solve the monohybrid and dihybrid cross problems 1 to 6 on page 129. Draw Punnett squares for each.'],
    ],
  },
}

/**
 * Homework for the last five school days.
 *
 * Coverage is deliberately incomplete: not every section gets homework every
 * day, and a handful of sections have nothing set today. That is what makes
 * the principal's coverage view worth looking at — a screen that always shows
 * 100% tells them nothing.
 */
export const HOMEWORK: Homework[] = (() => {
  const out: Homework[] = []
  const days = recentSchoolDays(5)

  days.forEach((day, dayIndex) => {
    for (const sec of SECTIONS) {
      // Today, a few sections have not posted yet — that is the alert.
      const isToday = dayIndex === 0
      if (isToday && SECTIONS.indexOf(sec) >= 19) continue

      const subjects = subjectsForStandard(sec.standard)
      // One to three subjects set work on a given day, which is how a real
      // timetable falls out — not every teacher gives homework every day.
      const howMany = rand() < 0.25 ? 1 : rand() < 0.75 ? 2 : 3
      const start = Math.floor(rand() * subjects.length)

      for (let k = 0; k < howMany; k++) {
        const subject = subjects[(start + k) % subjects.length]
        const pool = HOMEWORK_TEMPLATES[subject.id]
        if (!pool) continue
        const band = sec.standard <= 8 ? pool.junior : pool.senior
        const list = band.length > 0 ? band : pool.senior.length > 0 ? pool.senior : pool.junior
        if (list.length === 0) continue

        const [title, description] = list[Math.floor(rand() * list.length)]

        // Due the next school day, except weekend work which gets an extra day.
        const assigned = new Date(day)
        const due = new Date(assigned)
        due.setDate(due.getDate() + (assigned.getDay() === 6 ? 2 : 1))

        const teacher =
          STAFF.filter((s) => s.role === 'teacher' && s.subjects.includes(subject.name))[0] ??
          STAFF.find((s) => s.role === 'teacher')!

        out.push({
          id: `hw_${sec.id}_${subject.id}_${day}`,
          school_id: SCHOOL.id,
          section_id: sec.id,
          subject_id: subject.id,
          title,
          description,
          assigned_on: day,
          due_on: due.toISOString().slice(0, 10),
          assigned_by: teacher.id,
          created_at: `${day}T${String(between(14, 17)).padStart(2, '0')}:${String(between(10, 55)).padStart(2, '0')}:00`,
        })
      }
    }
  })

  return out
})()
