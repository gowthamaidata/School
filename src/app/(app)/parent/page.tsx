'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, CalendarCheck2, FileText, Megaphone, NotebookPen, Wallet } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession } from '@/lib/auth/session'
import { repo, SCHOOL, subjectById } from '@/lib/data/repository'
import type {
  Announcement, AttendanceSummary, ClassSection, Exam, FeeRecord, Homework, Student,
} from '@/lib/data/types'
import { formatDate, formatINR, gradeFor, ordinal, todayISO } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, Empty, Modal, PageHeader, Progress, Skeleton, Stat,
} from '@/components/ui'

type Report = NonNullable<Awaited<ReturnType<typeof repo.getReportCard>>>

export default function ParentPage() {
  const { t, locale } = usePrefs()
  const { user } = useSession()

  const [student, setStudent] = useState<Student | null>(null)
  const [section, setSection] = useState<ClassSection | null>(null)
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [news, setNews] = useState<Announcement[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [payOpen, setPayOpen] = useState(false)

  useEffect(() => {
    if (!user?.student_id) return
    let alive = true

    async function load(studentId: string) {
      const s = await repo.getStudent(studentId)
      if (!s || !alive) return
      const [secs, sum, f, exams, ann, hw] = await Promise.all([
        repo.getSections(),
        repo.getAttendanceSummary(s.id),
        repo.getFeeRecordsForStudent(s.id),
        repo.getExams(),
        repo.getAnnouncements(5),
        repo.getHomeworkForStudent(s.id, 12),
      ])
      const latest = exams.filter((e) => e.published).at(-1) ?? null
      const rc = latest ? await repo.getReportCard(s.id, latest.id) : null
      if (!alive) return

      setStudent(s)
      setSection(secs.find((x) => x.id === s.section_id) ?? null)
      setSummary(sum)
      setFees(f)
      setExam(latest)
      setReport(rc)
      setNews(ann)
      setHomework(hw)
      setLoading(false)
    }

    load(user.student_id)
    return () => {
      alive = false
    }
  }, [user])

  if (loading || !student) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const outstanding = fees.reduce((s, f) => s + (f.amount_due - f.amount_paid), 0)
  const nextDue = fees.find((f) => f.status !== 'paid')
  const attPct = summary?.percentage ?? 0

  const today = todayISO()
  const todaysHomework = homework.filter((h) => h.assigned_on === today)
  const earlierHomework = homework.filter((h) => h.assigned_on !== today)

  return (
    <>
      <PageHeader
        eyebrow={`${t('par.greeting')}, ${student.father_name.split(' ')[0]}`}
        title={locale === 'ta' ? student.name_ta : student.name}
        description={`${t('common.class')} ${section?.label ?? ''} · ${student.admission_no} · ${
          locale === 'ta' ? SCHOOL.name_ta : SCHOOL.name
        }`}
      />

      {/* ── Three things a parent actually checks ──────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={t('par.attendanceSummary')}
          value={`${attPct}%`}
          tone={attPct >= 90 ? 'forest' : attPct >= 75 ? 'clay' : 'danger'}
          icon={<CalendarCheck2 size={16} />}
          sub={
            <>
              <span className="tabular">
                {summary?.present ?? 0} / {summary?.total ?? 0}{' '}
                {locale === 'ta' ? 'நாட்கள் வருகை' : 'days present'}
              </span>
              <Progress
                value={attPct}
                tone={attPct >= 75 ? 'forest' : 'danger'}
                className="mt-1.5"
              />
            </>
          }
        />

        <Stat
          label={t('par.feeDue')}
          value={outstanding > 0 ? formatINR(outstanding) : t('par.noDues')}
          tone={outstanding > 0 ? 'danger' : 'forest'}
          icon={<Wallet size={16} />}
          sub={
            nextDue
              ? `${t('fee.term')} ${nextDue.term} · ${t('fee.dueDate')} ${formatDate(nextDue.due_date)}`
              : locale === 'ta'
                ? 'நன்றி'
                : 'Thank you'
          }
        />

        <Stat
          label={t('par.latestMarks')}
          value={report ? `${report.percentage}%` : '—'}
          tone={
            !report ? 'neutral' : report.percentage >= 75 ? 'forest' : report.percentage >= 50 ? 'clay' : 'danger'
          }
          icon={<FileText size={16} />}
          sub={
            report
              ? `${t('exam.grade')} ${report.grade} · ${t('exam.rank')} ${ordinal(report.rank)}/${report.classSize}`
              : locale === 'ta'
                ? 'முடிவுகள் இன்னும் இல்லை'
                : 'No results yet'
          }
        />
      </div>

      {outstanding > 0 && (
        <Card className="mt-3 flex flex-wrap items-center gap-3 border-clay/30 bg-clay-dim p-3.5">
          <Wallet size={18} className="shrink-0 text-clay" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">
              {formatINR(outstanding)} {t('par.feeDue').toLowerCase()}
            </div>
            <div className="text-xs text-ink-2">
              {nextDue
                ? `${t('fee.dueDate')}: ${formatDate(nextDue.due_date, 'long')}`
                : ''}
            </div>
          </div>
          <Button size="sm" onClick={() => setPayOpen(true)}>
            {t('par.payNow')}
          </Button>
        </Card>
      )}

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={t('par.payNow')}
        footer={
          <Button variant="secondary" onClick={() => setPayOpen(false)}>
            {t('common.close')}
          </Button>
        }
      >
        <div className="space-y-3 text-sm text-ink-2">
          <p>
            {locale === 'ta'
              ? 'ஆன்லைன் கட்டண செலுத்தல் விரைவில் வழங்கப்படும். தற்போது, தயவுசெய்து பள்ளி அலுவலகத்தை தொடர்பு கொள்ளவும்:'
              : 'Online payment is coming soon. For now, please contact the school office to settle this due:'}
          </p>
          <div className="rounded-md bg-surface-2 p-3">
            <div className="font-semibold text-ink">{locale === 'ta' ? SCHOOL.name_ta : SCHOOL.name}</div>
            <div className="mt-1 text-ink-2">{SCHOOL.phone}</div>
          </div>
          {nextDue && (
            <p className="text-xs text-ink-3">
              {t('fee.dueDate')}: {formatDate(nextDue.due_date, 'long')} · {formatINR(outstanding)}
            </p>
          )}
        </div>
      </Modal>

      {/* ── Homework — the reason a parent opens this daily ── */}
      <Card className="mt-4">
        <CardHeader
          title={t('par.homework')}
          hint={`${t('common.class')} ${section?.label ?? ''} · ${formatDate(todayISO(), 'long')}`}
          action={
            <Badge tone={todaysHomework.length > 0 ? 'forest' : 'neutral'}>
              {todaysHomework.length} {t('common.today').toLowerCase()}
            </Badge>
          }
        />

        {todaysHomework.length === 0 ? (
          <Empty title={t('hw.noneToday')} icon={<NotebookPen size={22} />} />
        ) : (
          <div className="divide-y divide-line">
            {todaysHomework.map((h) => (
              <ParentHomeworkRow key={h.id} hw={h} />
            ))}
          </div>
        )}

        {earlierHomework.length > 0 && (
          <div className="border-t border-line">
            <div className="label-mono px-4 pt-3">{t('hw.recent')}</div>
            <div className="divide-y divide-line">
              {earlierHomework.slice(0, 5).map((h) => (
                <ParentHomeworkRow key={h.id} hw={h} muted />
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ── Latest results ──────────────────────────── */}
        <Card>
          <CardHeader
            title={t('par.latestMarks')}
            hint={exam ? (locale === 'ta' ? exam.name_ta : exam.name) : undefined}
            action={
              report && (
                <Link href={`/report-card/${student.id}?exam=${exam?.id}`}>
                  <Button size="sm" variant="outline">
                    {t('par.viewReportCard')}
                  </Button>
                </Link>
              )
            }
          />
          {report ? (
            <div className="divide-y divide-line">
              {report.rows.map((r) => {
                const pctv = r.obtained === null ? 0 : (r.obtained / r.max) * 100
                return (
                  <div key={r.subject.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-ink">
                        {locale === 'ta' ? r.subject.name_ta : r.subject.name}
                      </div>
                      <Progress
                        value={pctv}
                        tone={pctv >= 60 ? 'forest' : pctv >= 35 ? 'clay' : 'danger'}
                        className="mt-1.5"
                      />
                    </div>
                    <div className="text-right">
                      <div className="tabular text-sm font-bold text-ink">
                        {r.obtained ?? t('exam.absent')}
                        <span className="text-2xs font-normal text-ink-3">/{r.max}</span>
                      </div>
                      <Badge tone={r.obtained === null ? 'neutral' : r.passed ? 'forest' : 'danger'}>
                        {r.obtained === null ? '—' : gradeFor(pctv)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between bg-surface-2 px-4 py-3">
                <span className="text-sm font-semibold text-ink">{t('rc.totalMarks')}</span>
                <span className="tabular font-serif text-lg font-bold text-ink">
                  {report.total}
                  <span className="text-xs font-normal text-ink-3">/{report.maxTotal}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-ink-3">
              {locale === 'ta' ? 'முடிவுகள் இன்னும் வெளியிடப்படவில்லை' : 'Results not published yet'}
            </div>
          )}
        </Card>

        {/* ── Fee history + announcements ─────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader title={t('fee.title')} />
            <div className="divide-y divide-line">
              {fees.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-ink">
                      {t('fee.term')} {f.term}
                    </div>
                    <div className="font-mono text-2xs text-ink-3">
                      {t('fee.dueDate')} {formatDate(f.due_date)}
                      {f.receipt_no && ` · ${f.receipt_no}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-sm font-semibold text-ink">
                      {formatINR(f.amount_due)}
                    </div>
                    <Badge
                      tone={
                        f.status === 'paid'
                          ? 'forest'
                          : f.status === 'partial'
                            ? 'clay'
                            : f.status === 'overdue'
                              ? 'danger'
                              : 'neutral'
                      }
                    >
                      {t(`fee.${f.status}`)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('par.announcements')} />
            <div className="divide-y divide-line">
              {news.map((a) => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Megaphone size={14} className="mt-0.5 shrink-0 text-ink-3" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold leading-snug text-ink">
                        {a.title}
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink-2">
                        {a.body}
                      </p>
                      <div className="mt-1.5 font-mono text-2xs text-ink-3">
                        {formatDate(a.sent_at, 'long')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ── One homework entry, as a parent sees it ───────────── */
function ParentHomeworkRow({ hw, muted = false }: { hw: Homework; muted?: boolean }) {
  const { t, locale } = usePrefs()
  const subject = subjectById(hw.subject_id)
  const today = todayISO()

  // Work from earlier in the week has already been handed in; marking all of
  // it red would train a parent to ignore the colour entirely.
  const dueTone = muted ? 'neutral' : hw.due_on < today ? 'danger' : hw.due_on === today ? 'clay' : 'forest'
  const dueLabel =
    !muted && hw.due_on < today
      ? t('hw.overdue')
      : !muted && hw.due_on === today
        ? t('hw.dueToday')
        : `${t('hw.dueOn')} ${formatDate(hw.due_on)}`

  return (
    <div className={`flex items-start gap-3 px-4 py-3 ${muted ? 'opacity-75' : ''}`}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-forest-dim text-forest">
        <BookOpen size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{locale === 'ta' ? subject?.name_ta : subject?.name}</Badge>
          <h3 className="text-sm font-semibold leading-snug text-ink">{hw.title}</h3>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-2">{hw.description}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-2xs text-ink-3">
          <span>
            {t('hw.assignedOn')} {formatDate(hw.assigned_on)}
          </span>
          <Badge tone={dueTone}>{dueLabel}</Badge>
        </div>
      </div>
    </div>
  )
}
