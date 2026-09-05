'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileText, Phone, MessageSquare } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { repo } from '@/lib/data/repository'
import type {
  AttendanceSummary, ClassSection, Exam, FeeRecord, Student,
} from '@/lib/data/types'
import { formatDate, formatINR } from '@/lib/utils'
import {
  Avatar, Badge, Button, Card, CardHeader, PageHeader, Progress, Skeleton, Stat, Table, Td, Th,
} from '@/components/ui'

const STATUS_TONE = {
  paid: 'forest', partial: 'clay', pending: 'neutral', overdue: 'danger',
} as const

export default function StudentDetailPage() {
  const { t, locale } = usePrefs()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [student, setStudent] = useState<Student | null>(null)
  const [section, setSection] = useState<ClassSection | null>(null)
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      const s = await repo.getStudent(id)
      if (!alive || !s) {
        setLoading(false)
        return
      }
      const [secs, sum, f, ex] = await Promise.all([
        repo.getSections(),
        repo.getAttendanceSummary(s.id),
        repo.getFeeRecordsForStudent(s.id),
        repo.getExams(),
      ])
      if (!alive) return
      setStudent(s)
      setSection(secs.find((x) => x.id === s.section_id) ?? null)
      setSummary(sum)
      setFees(f)
      setExams(ex.filter((e) => e.published))
      setLoading(false)
    }
    load()
    return () => {
      alive = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!student) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-ink-2">{t('common.noResults')}</p>
        <Link href="/students" className="mt-3 inline-block text-sm text-forest hover:underline">
          ← {t('stu.title')}
        </Link>
      </Card>
    )
  }

  const outstanding = fees.reduce((s, f) => s + (f.amount_due - f.amount_paid), 0)
  const details: [string, string][] = [
    [t('stu.admissionNo'), student.admission_no],
    [t('common.class'), `${section?.label ?? '—'} · ${t('att.rollNo')} ${student.roll_no}`],
    [t('stu.dob'), formatDate(student.dob, 'long')],
    [t('stu.bloodGroup'), student.blood_group],
    [t('stu.father'), student.father_name],
    [t('stu.mother'), student.mother_name],
    [t('stu.guardianPhone'), student.guardian_phone],
    [t('stu.address'), student.address],
  ]

  return (
    <>
      <Link
        href="/students"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-3 hover:text-forest"
      >
        <ArrowLeft size={14} />
        {t('stu.title')}
      </Link>

      <PageHeader
        eyebrow={`${section?.label ?? ''} · ${student.admission_no}`}
        title={locale === 'ta' ? student.name_ta : student.name}
        description={locale === 'ta' ? student.name : student.name_ta}
        action={
          <div className="flex gap-2">
            <a href={`tel:${student.guardian_phone}`}>
              <Button variant="outline" size="sm">
                <Phone size={14} />
                {locale === 'ta' ? 'அழை' : 'Call'}
              </Button>
            </a>
            <a
              href={`https://wa.me/91${student.guardian_phone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <MessageSquare size={14} />
                WhatsApp
              </Button>
            </a>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={t('stu.attendanceRate')}
          value={`${summary?.percentage ?? 0}%`}
          tone={
            (summary?.percentage ?? 0) >= 90
              ? 'forest'
              : (summary?.percentage ?? 0) >= 75
                ? 'clay'
                : 'danger'
          }
          sub={
            <>
              <span className="tabular">
                {summary?.present ?? 0}/{summary?.total ?? 0}{' '}
                {locale === 'ta' ? 'நாட்கள்' : 'days'}
              </span>
              <Progress
                value={summary?.percentage ?? 0}
                className="mt-1.5"
                tone={(summary?.percentage ?? 0) >= 75 ? 'forest' : 'danger'}
              />
            </>
          }
        />
        <Stat
          label={t('stu.feeStatus')}
          value={outstanding > 0 ? formatINR(outstanding, { compact: true }) : t('par.noDues')}
          tone={outstanding > 0 ? 'danger' : 'forest'}
          sub={
            outstanding > 0
              ? locale === 'ta'
                ? 'நிலுவைத் தொகை'
                : 'outstanding across terms'
              : locale === 'ta'
                ? 'அனைத்துப் பருவங்களும் செலுத்தப்பட்டது'
                : 'all terms cleared'
          }
        />
        <Stat
          label={locale === 'ta' ? 'தாமதம்' : 'Late arrivals'}
          value={summary?.late ?? 0}
          tone="clay"
          sub={locale === 'ta' ? 'இப்பருவத்தில்' : 'this term'}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ── Profile ─────────────────────────────────── */}
        <Card>
          <CardHeader title={t('stu.profile')} />
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar name={student.name} size={48} />
            <div className="min-w-0">
              <div className="font-semibold text-ink">
                {locale === 'ta' ? student.name_ta : student.name}
              </div>
              <div className="font-mono text-2xs text-ink-3">
                {student.gender === 'M'
                  ? locale === 'ta' ? 'ஆண்' : 'Male'
                  : locale === 'ta' ? 'பெண்' : 'Female'}{' '}
                · {locale === 'ta' ? 'சேர்ந்த நாள்' : 'Admitted'}{' '}
                {formatDate(student.admitted_on)}
              </div>
            </div>
          </div>
          <dl className="divide-y divide-line">
            {details.map(([k, v]) => (
              <div key={k} className="flex gap-3 px-4 py-2.5 text-sm">
                <dt className="w-32 shrink-0 text-ink-3">{k}</dt>
                <dd className="min-w-0 flex-1 font-medium text-ink">{v}</dd>
              </div>
            ))}
            {student.transport_route && (
              <div className="flex gap-3 px-4 py-2.5 text-sm">
                <dt className="w-32 shrink-0 text-ink-3">
                  {locale === 'ta' ? 'போக்குவரத்து' : 'Transport'}
                </dt>
                <dd className="font-medium text-ink">{student.transport_route}</dd>
              </div>
            )}
          </dl>
        </Card>

        <div className="space-y-4">
          {/* ── Fees ──────────────────────────────────── */}
          <Card className="overflow-hidden">
            <CardHeader title={t('fee.title')} />
            <Table>
              <thead>
                <tr>
                  <Th>{t('fee.term')}</Th>
                  <Th align="right">{t('common.amount')}</Th>
                  <Th align="right">{t('fee.paid')}</Th>
                  <Th>{t('common.status')}</Th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id}>
                    <Td>
                      {t('fee.term')} {f.term}
                    </Td>
                    <Td align="right" className="tabular">
                      {formatINR(f.amount_due)}
                    </Td>
                    <Td align="right" className="tabular">
                      {f.amount_paid > 0 ? formatINR(f.amount_paid) : '—'}
                    </Td>
                    <Td>
                      <Badge tone={STATUS_TONE[f.status]}>{t(`fee.${f.status}`)}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* ── Report cards ──────────────────────────── */}
          <Card>
            <CardHeader title={t('nav.reportCards')} />
            <div className="divide-y divide-line">
              {exams.map((e) => (
                <Link
                  key={e.id}
                  href={`/report-card/${student.id}?exam=${e.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
                >
                  <FileText size={16} className="shrink-0 text-ink-3" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {locale === 'ta' ? e.name_ta : e.name}
                    </div>
                    <div className="font-mono text-2xs text-ink-3">
                      {formatDate(e.start_date)} — {formatDate(e.end_date)}
                    </div>
                  </div>
                  <Badge tone="forest">{t('exam.generateReportCard')}</Badge>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
