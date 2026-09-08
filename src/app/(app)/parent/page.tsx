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
  Avatar, Badge, Button, Card, CardHeader, Empty, Modal, Progress, Skeleton, Stat,
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
      {/* ── Who this is about. A parent opens the app for one child, so the
             child — not the school — is the header. ── */}
      <section className="mb-5 overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card sm:mb-6 sm:p-6">
        <div className="relative flex flex-wrap items-center gap-4">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-peach/25 blur-3xl"
            aria-hidden
          />
          <Avatar name={student.name} size={64} ring />
          <div className="relative min-w-0 flex-1">
            <div className="label mb-1">
              {t('par.greeting')}, {student.father_name.split(' ')[0]}
            </div>
            <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[30px]">
              {locale === 'ta' ? student.name_ta : student.name}
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              {t('common.class')} {section?.label ?? ''} ·{' '}
              <span className="font-mono text-xs">{student.admission_no}</span> ·{' '}
              {locale === 'ta' ? SCHOOL.name_ta : SCHOOL.name}
            </p>
          </div>
          {report && (
            <Link href={`/report-card/${student.id}?exam=${exam?.id}`} className="relative shrink-0">
              <Button variant="outline" size="sm">
                <FileText size={14} aria-hidden />
                {t('par.viewReportCard')}
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* ── Three things a parent actually checks ──────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={t('par.attendanceSummary')}
          value={`${attPct}%`}
          tone={attPct >= 90 ? 'leaf' : attPct >= 75 ? 'clay' : 'danger'}
          icon={<CalendarCheck2 size={17} />}
          sub={
            <>
              <span className="tabular">
                {summary?.present ?? 0} / {summary?.total ?? 0}{' '}
                {locale === 'ta' ? 'நாட்கள் வருகை' : 'days present'}
              </span>
              <Progress
                value={attPct}
                tone={attPct >= 75 ? 'leaf' : 'danger'}
                className="mt-2"
                label={t('par.attendanceSummary')}
              />
            </>
          }
        />

        <Stat
          label={t('par.feeDue')}
          value={outstanding > 0 ? formatINR(outstanding) : formatINR(0)}
          tone={outstanding > 0 ? 'danger' : 'leaf'}
          icon={<Wallet size={17} />}
          sub={
            outstanding > 0 && nextDue
              ? `${t('fee.term')} ${nextDue.term} · ${t('fee.dueDate')} ${formatDate(nextDue.due_date)}`
              : t('par.noDues')
          }
        />

        <Stat
          label={t('par.latestMarks')}
          value={report ? `${report.percentage}%` : '—'}
          tone={
            !report ? 'neutral' : report.percentage >= 75 ? 'leaf' : report.percentage >= 50 ? 'clay' : 'danger'
          }
          icon={<FileText size={17} />}
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
        <Card className="mt-3 flex flex-wrap items-center gap-3 border-clay/25 bg-clay-dim p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-peach/50 text-clay" aria-hidden>
            <Wallet size={18} />
          </span>
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
            <Badge tone={todaysHomework.length > 0 ? 'leaf' : 'neutral'}>
              {todaysHomework.length} {t('common.today').toLowerCase()}
            </Badge>
          }
        />

        {todaysHomework.length === 0 ? (
          <Empty
            title={t('hw.noneToday')}
            hint={
              locale === 'ta'
                ? 'ஆசிரியர் பதிவிட்டவுடன் இங்கே தெரியும்.'
                : 'It appears here the moment the teacher posts it.'
            }
            icon={<NotebookPen size={26} />}
          />
        ) : (
          <div className="divide-y divide-line">
            {todaysHomework.map((h) => (
              <ParentHomeworkRow key={h.id} hw={h} />
            ))}
          </div>
        )}

        {earlierHomework.length > 0 && (
          <div className="border-t border-line">
            <div className="label px-4 pt-3.5 sm:px-5">{t('hw.recent')}</div>
            <div className="divide-y divide-line">
              {earlierHomework.slice(0, 5).map((h) => (
                <ParentHomeworkRow key={h.id} hw={h} muted />
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
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
                        tone={pctv >= 60 ? 'leaf' : pctv >= 35 ? 'clay' : 'danger'}
                        size="sm"
                        className="mt-2"
                        label={locale === 'ta' ? r.subject.name_ta : r.subject.name}
                      />
                    </div>
                    <div className="text-right">
                      <div className="tabular text-sm font-bold text-ink">
                        {r.obtained ?? t('exam.absent')}
                        <span className="text-2xs font-normal text-ink-3">/{r.max}</span>
                      </div>
                      <Badge tone={r.obtained === null ? 'neutral' : r.passed ? 'leaf' : 'danger'}>
                        {r.obtained === null ? '—' : gradeFor(pctv)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between bg-surface-2/70 px-4 py-3.5">
                <span className="text-sm font-semibold text-ink">{t('rc.totalMarks')}</span>
                <span className="tabular font-display text-xl font-semibold text-ink">
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
                    <div className="text-2xs text-ink-3">
                      {t('fee.dueDate')} {formatDate(f.due_date)}
                      {f.receipt_no && <span className="font-mono"> · {f.receipt_no}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-sm font-semibold text-ink">
                      {formatINR(f.amount_due)}
                    </div>
                    <Badge
                      tone={
                        f.status === 'paid'
                          ? 'leaf'
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
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-sky/35 text-info" aria-hidden>
                      <Megaphone size={13} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold leading-snug text-ink">
                        {a.title}
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink-2">
                        {a.body}
                      </p>
                      <div className="mt-1.5 text-2xs text-ink-3">{formatDate(a.sent_at, 'long')}</div>
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
  const dueTone = muted ? 'neutral' : hw.due_on < today ? 'danger' : hw.due_on === today ? 'clay' : 'leaf'
  const dueLabel =
    !muted && hw.due_on < today
      ? t('hw.overdue')
      : !muted && hw.due_on === today
        ? t('hw.dueToday')
        : `${t('hw.dueOn')} ${formatDate(hw.due_on)}`

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill ${
          muted ? 'bg-surface-2 text-ink-3' : 'bg-lavender/35 text-forest-ink'
        }`}
        aria-hidden
      >
        <BookOpen size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{locale === 'ta' ? subject?.name_ta : subject?.name}</Badge>
          <h3 className="text-sm font-semibold leading-snug text-ink">{hw.title}</h3>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{hw.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs text-ink-3">
          <span>
            {t('hw.assignedOn')} {formatDate(hw.assigned_on)}
          </span>
          <Badge tone={dueTone}>{dueLabel}</Badge>
        </div>
      </div>
    </div>
  )
}
