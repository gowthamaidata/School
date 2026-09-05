'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { repo, SCHOOL } from '@/lib/data/repository'
import type { Exam } from '@/lib/data/types'
import { formatDate, ordinal } from '@/lib/utils'
import { Badge, Button, Card, Select, Skeleton } from '@/components/ui'

type Report = NonNullable<Awaited<ReturnType<typeof repo.getReportCard>>>

function ReportCardInner() {
  const { t, locale } = usePrefs()
  const params = useParams<{ id: string }>()
  const search = useSearchParams()

  const [exams, setExams] = useState<Exam[]>([])
  const [examId, setExamId] = useState(search.get('exam') ?? '')
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    repo.getExams().then((e) => {
      const published = e.filter((x) => x.published)
      setExams(published)
      if (!examId && published[0]) setExamId(published[0].id)
    })
  }, [examId])

  useEffect(() => {
    if (!examId) return
    let alive = true
    setLoading(true)
    repo.getReportCard(params.id, examId).then((r) => {
      if (alive) {
        setReport(r)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [params.id, examId])

  if (loading || !report) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  const { student, section, exam, rows, total, maxTotal, percentage, grade, rank, classSize } = report
  const attendancePct = report.attendance?.percentage ?? 0

  const remark =
    percentage >= 85
      ? locale === 'ta'
        ? 'சிறப்பான செயல்பாடு. இதே முனைப்புடன் தொடரவும்.'
        : 'Excellent performance. Keep up this consistency.'
      : percentage >= 70
        ? locale === 'ta'
          ? 'நல்ல முன்னேற்றம். மேலும் கவனம் செலுத்தினால் சிறப்பாக இருக்கும்.'
          : 'Good progress. A little more focus will lift these further.'
        : percentage >= 50
          ? locale === 'ta'
            ? 'திருப்திகரம். பலவீனமான பாடங்களில் கூடுதல் பயிற்சி தேவை.'
            : 'Satisfactory. Needs extra practice in the weaker subjects.'
          : locale === 'ta'
            ? 'கூடுதல் கவனமும் வீட்டுப் பயிற்சியும் தேவை. பெற்றோர் ஆசிரியரைச் சந்திக்கவும்.'
            : 'Needs sustained attention and home support. Please meet the class teacher.'

  return (
    <>
      {/* ── Controls (hidden on print) ──────────────────── */}
      <div className="no-print">
        <Link
          href={`/students/${student.id}`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-3 hover:text-forest"
        >
          <ArrowLeft size={14} />
          {student.name}
        </Link>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label-mono mb-1">{t('rc.progressReport')}</div>
            <h1 className="font-serif text-2xl font-bold text-ink">{t('rc.title')}</h1>
          </div>
          <div className="flex items-end gap-2">
            <div className="w-52">
              <span className="label-mono mb-1.5 block">{t('exam.examination')}</span>
              <Select value={examId} onChange={(e) => setExamId(e.target.value)}>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {locale === 'ta' ? e.name_ta : e.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={() => window.print()}>
              <Printer size={15} />
              {t('common.print')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── The sheet ───────────────────────────────────── */}
      <Card className="print-area mx-auto max-w-[820px] p-6 sm:p-9">
        {/* Letterhead */}
        <header className="border-b-2 border-forest pb-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded bg-forest font-serif text-base font-bold text-white">
              {SCHOOL.logo_text}
            </span>
            <div>
              <h2 className="font-serif text-xl font-bold leading-tight text-ink">
                {locale === 'ta' ? SCHOOL.name_ta : SCHOOL.name}
              </h2>
              <p className="text-xs text-ink-2">{SCHOOL.address}</p>
              <p className="font-mono text-2xs text-ink-3">
                {SCHOOL.phone} · UDISE {SCHOOL.udise_code}
              </p>
            </div>
          </div>
          <div className="mt-3 inline-block border border-line px-4 py-1 font-mono text-xs uppercase tracking-[0.18em] text-ink-2">
            {t('rc.progressReport')} · {t('rc.academicYear')} {SCHOOL.academic_year}
          </div>
        </header>

        {/* Student meta */}
        <section className="grid grid-cols-2 gap-x-8 gap-y-1.5 border-b border-line py-4 text-sm sm:grid-cols-3">
          {[
            [t('common.name'), locale === 'ta' ? student.name_ta : student.name],
            [t('stu.admissionNo'), student.admission_no],
            [t('common.class'), `${section.label} · ${t('att.rollNo')} ${student.roll_no}`],
            [t('exam.examination'), locale === 'ta' ? exam.name_ta : exam.name],
            [t('stu.father'), student.father_name],
            [t('common.date'), formatDate(exam.end_date, 'long')],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="label-mono">{k}</div>
              <div className="font-medium text-ink">{v}</div>
            </div>
          ))}
        </section>

        {/* Marks table */}
        <section className="py-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-forest text-white">
                <th className="border border-forest px-3 py-2 text-left font-semibold">
                  {t('exam.subject')}
                </th>
                <th className="border border-forest px-3 py-2 text-center font-semibold">
                  {t('exam.maxMarks')}
                </th>
                <th className="border border-forest px-3 py-2 text-center font-semibold">
                  {t('exam.marksObtained')}
                </th>
                <th className="border border-forest px-3 py-2 text-center font-semibold">
                  {t('exam.grade')}
                </th>
                <th className="border border-forest px-3 py-2 text-center font-semibold">
                  {t('rc.result')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.subject.id}>
                  <td className="border border-line px-3 py-1.5 font-medium text-ink">
                    {locale === 'ta' ? r.subject.name_ta : r.subject.name}
                  </td>
                  <td className="tabular border border-line px-3 py-1.5 text-center text-ink-2">
                    {r.max}
                  </td>
                  <td className="tabular border border-line px-3 py-1.5 text-center font-semibold text-ink">
                    {r.obtained ?? t('exam.absent')}
                  </td>
                  <td className="border border-line px-3 py-1.5 text-center font-mono text-xs">
                    {r.grade}
                  </td>
                  <td
                    className={`border border-line px-3 py-1.5 text-center text-xs font-semibold ${
                      r.obtained === null
                        ? 'text-ink-3'
                        : r.passed
                          ? 'text-forest'
                          : 'text-danger'
                    }`}
                  >
                    {r.obtained === null ? '—' : r.passed ? t('rc.pass') : t('rc.fail')}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface-2 font-bold">
                <td className="border border-line px-3 py-2 text-ink">{t('rc.totalMarks')}</td>
                <td className="tabular border border-line px-3 py-2 text-center text-ink">
                  {maxTotal}
                </td>
                <td className="tabular border border-line px-3 py-2 text-center text-ink">
                  {total}
                </td>
                <td className="border border-line px-3 py-2 text-center font-mono text-xs text-ink">
                  {grade}
                </td>
                <td
                  className={`border border-line px-3 py-2 text-center text-xs ${
                    report.passed ? 'text-forest' : 'text-danger'
                  }`}
                >
                  {report.passed ? t('rc.pass') : t('rc.fail')}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Summary strip */}
        <section className="grid grid-cols-2 gap-2 border-y border-line py-3 sm:grid-cols-4">
          {[
            { label: t('rc.percentage'), value: `${percentage}%` },
            { label: t('exam.rank'), value: `${ordinal(rank)} / ${classSize}` },
            { label: t('exam.grade'), value: grade },
            {
              label: t('rc.daysPresent'),
              value: `${report.attendance?.present ?? 0}/${report.attendance?.total ?? 0}`,
            },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="label-mono">{s.label}</div>
              <div className="tabular font-serif text-xl font-bold text-ink">{s.value}</div>
            </div>
          ))}
        </section>

        {/* Attendance + remarks */}
        <section className="grid gap-4 py-4 sm:grid-cols-2">
          <div>
            <div className="label-mono mb-1.5">{t('stu.attendanceRate')}</div>
            <div className="flex items-baseline gap-2">
              <span className="tabular font-serif text-2xl font-bold text-ink">
                {attendancePct}%
              </span>
              <Badge tone={attendancePct >= 75 ? 'forest' : 'danger'}>
                {attendancePct >= 75
                  ? locale === 'ta' ? 'போதுமானது' : 'Eligible'
                  : locale === 'ta' ? '75%க்குக் கீழ்' : 'Below 75%'}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-ink-3">
              {t('rc.workingDays')}: {report.attendance?.total ?? 0} ·{' '}
              {t('att.absent')}: {report.attendance?.absent ?? 0}
            </p>
          </div>
          <div>
            <div className="label-mono mb-1.5">{t('rc.remarks')}</div>
            <p className="min-h-[48px] border-b border-dashed border-line pb-2 text-sm leading-relaxed text-ink-2">
              {remark}
            </p>
          </div>
        </section>

        {/* Signatures */}
        <footer className="grid grid-cols-3 gap-4 pt-10 text-center">
          {[
            [t('rc.classTeacher'), report.classTeacher],
            [t('rc.principalSign'), ''],
            [t('rc.parentSign'), ''],
          ].map(([role, name]) => (
            <div key={role}>
              <div className="mx-auto mb-1.5 border-t border-ink-3" />
              <div className="text-xs font-semibold text-ink">{role}</div>
              {name && <div className="text-2xs text-ink-3">{name}</div>}
            </div>
          ))}
        </footer>
      </Card>
    </>
  )
}

export default function ReportCardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <ReportCardInner />
    </Suspense>
  )
}
