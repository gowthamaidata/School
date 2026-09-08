'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ArrowRight, ArrowUpRight, BadgeIndianRupee, CalendarCheck2,
  CheckCircle2, Clock, Megaphone, Sparkles, TrendingUp, Users,
} from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession } from '@/lib/auth/session'
import { repo, SCHOOL, CURRENT_TERM } from '@/lib/data/repository'
import type {
  Announcement, ClassAttendanceRow, DashboardStats, AttendanceSummary,
  ClassSection, Student,
} from '@/lib/data/types'
import { formatDate, formatINR, formatNumber } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, ChartFrame, CountUp, Empty, ErrorState, Progress,
  ProgressRing, Segmented, Skeleton, Stat, Toast,
} from '@/components/ui'
import { HeatGrid, TrendChart, type HeatCell, type TrendPoint } from '@/components/charts'

type LowRow = { student: Student; summary: AttendanceSummary; section: ClassSection }
type ClassFilter = 'all' | 'attention' | 'unmarked'

/** Time-of-day greeting — small touch, but it is what makes a dashboard feel
 *  addressed to a person rather than printed for a role. */
function greetingKey(): 'greet.morning' | 'greet.afternoon' | 'greet.evening' {
  const h = new Date().getHours()
  if (h < 12) return 'greet.morning'
  if (h < 17) return 'greet.afternoon'
  return 'greet.evening'
}

export default function DashboardPage() {
  const { t, locale } = usePrefs()
  const { user, can } = useSession()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [classRows, setClassRows] = useState<ClassAttendanceRow[]>([])
  const [low, setLow] = useState<LowRow[]>([])
  const [trend, setTrend] = useState<{ month: string; amount: number }[]>([])
  const [news, setNews] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [classFilter, setClassFilter] = useState<ClassFilter>('all')

  const load = useCallback(() => {
    setLoading(true)
    setFailed(false)
    return Promise.all([
      repo.getDashboardStats(),
      repo.getClassAttendanceToday(),
      repo.getLowAttendanceStudents(75),
      repo.getCollectionTrend(),
      repo.getAnnouncements(4),
    ])
      .then(([s, c, l, tr, n]) => {
        setStats(s)
        setClassRows(c)
        setLow(l)
        setTrend(tr)
        setNews(n)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[dashboard] load failed', err)
        setFailed(true)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let alive = true
    // The guard keeps a late response from a unmounted screen out of state.
    load().then(() => {
      if (!alive) return
    })
    return () => {
      alive = false
    }
  }, [load])

  async function handleRemind() {
    setSending(true)
    try {
      const n = await repo.sendFeeReminders(CURRENT_TERM)
      setToast(t('fee.remindersSent', { n }))
    } finally {
      setSending(false)
    }
  }

  const pendingClasses = useMemo(() => classRows.filter((c) => !c.marked), [classRows])
  const markedClasses = useMemo(() => classRows.filter((c) => c.marked), [classRows])

  const heatCells: HeatCell[] = useMemo(() => {
    const rows =
      classFilter === 'unmarked'
        ? pendingClasses
        : classFilter === 'attention'
          ? classRows.filter((c) => !c.marked || c.percentage < 85)
          : classRows
    return rows.map((c) => ({
      id: c.section_id,
      label: `${t('common.class')} ${c.label}`,
      value: c.marked ? c.percentage : null,
      detail: c.marked
        ? `${c.present}/${c.present + c.absent} ${t('att.present').toLowerCase()}`
        : t('dash.notMarkedYet'),
    }))
  }, [classRows, classFilter, pendingClasses, t])

  const trendPoints: TrendPoint[] = useMemo(
    () =>
      trend.map((d) => ({
        label: d.month,
        value: d.amount,
        display: formatINR(d.amount),
      })),
    [trend],
  )

  const monthlyTarget = useMemo(
    () => (stats && trend.length ? stats.fees_target / Math.max(3, trend.length) : undefined),
    [stats, trend.length],
  )

  /* ── The action queue: only what is genuinely actionable today ── */
  const actions = useMemo(() => {
    if (!stats) return []
    const list: {
      id: string
      tone: 'clay' | 'danger' | 'info'
      icon: React.ReactNode
      title: string
      detail: string
      cta: React.ReactNode
    }[] = []

    if (pendingClasses.length > 0 && can('mark_attendance')) {
      list.push({
        id: 'attendance',
        tone: 'clay',
        icon: <Clock size={18} />,
        title: t('dash.notMarkedYet'),
        detail: `${pendingClasses.length} ${t('dash.classesPending')} — ${pendingClasses
          .slice(0, 4)
          .map((c) => c.label)
          .join(', ')}${pendingClasses.length > 4 ? ' …' : ''}`,
        cta: (
          <Link href="/attendance">
            <Button size="sm" variant="outline">
              {t('dash.pendingClasses')}
            </Button>
          </Link>
        ),
      })
    }

    if (stats.defaulter_count > 0 && can('manage_fees')) {
      list.push({
        id: 'fees',
        tone: 'info',
        icon: <BadgeIndianRupee size={18} />,
        title: t('dash.feeDefaulters'),
        detail: `${formatNumber(stats.defaulter_count)} ${t('common.families')} · ${formatINR(
          stats.fees_outstanding,
          { compact: true },
        )} ${t('fee.outstanding').toLowerCase()}`,
        cta: (
          <Button size="sm" onClick={handleRemind} loading={sending}>
            {t('dash.sendReminders')}
          </Button>
        ),
      })
    }

    if (low.length > 0) {
      list.push({
        id: 'low',
        tone: 'danger',
        icon: <AlertTriangle size={18} />,
        title: t('dash.lowAttendance'),
        detail: `${low.length} ${t('common.students')} · ${t('dash.lowAttendanceHelp')}`,
        cta: (
          <Link href="#low-attendance">
            <Button size="sm" variant="outline">
              {t('dash.reviewStudents')}
            </Button>
          </Link>
        ),
      })
    }

    return list
    // handleRemind is stable enough for this list; sending is what changes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, pendingClasses, low.length, can, t, sending])

  const firstName = user?.name?.split(' ')[0] ?? ''

  if (failed) {
    return (
      <Card className="mt-6">
        <ErrorState
          title={t('common.error')}
          hint={t('common.errorHint')}
          onRetry={load}
          retryLabel={t('common.retry')}
        />
      </Card>
    )
  }

  return (
    <>
      {/* ══ Hero: greeting, the one number that matters, and the state of
             the day in a sentence. Everything else on the page supports it. ══ */}
      <section className="mb-5 overflow-hidden rounded-2xl border border-line bg-surface shadow-card sm:mb-6">
        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          {/* Soft pastel wash — depth without a heavy panel. */}
          <div
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-lavender/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-mint/20 blur-3xl"
            aria-hidden
          />

          <div className="relative min-w-0 flex-1">
            <div className="label mb-2">
              {formatDate(new Date().toISOString(), 'day')} · {SCHOOL.academic_year}
            </div>
            <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[34px]">
              {t(greetingKey())}
              {firstName ? `, ${firstName}` : ''}
            </h1>

            {loading || !stats ? (
              <Skeleton className="mt-3 h-5 w-80 max-w-full" />
            ) : (
              <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-ink-2">
                {locale === 'ta' ? (
                  <>
                    இன்று <strong className="font-semibold text-ink">{formatNumber(stats.present_today)}</strong>{' '}
                    மாணவர்கள் வகுப்பில் உள்ளனர்.{' '}
                    {pendingClasses.length > 0
                      ? `${pendingClasses.length} வகுப்புகள் இன்னும் பதிவு செய்யப்படவில்லை.`
                      : 'அனைத்து வகுப்புகளும் பதிவு செய்யப்பட்டுவிட்டன.'}
                  </>
                ) : (
                  <>
                    <strong className="font-semibold text-ink">
                      {formatNumber(stats.present_today)}
                    </strong>{' '}
                    of {formatNumber(stats.present_today + stats.absent_today)} students marked so
                    far are in class.{' '}
                    {pendingClasses.length > 0
                      ? `${pendingClasses.length} of ${classRows.length} classes still to mark.`
                      : 'Every class has been marked today.'}
                  </>
                )}
              </p>
            )}
          </div>

          {/* The hero figure. Exactly one on the page. */}
          <div className="relative flex shrink-0 items-center gap-5 sm:gap-7">
            {loading || !stats ? (
              <Skeleton className="h-[104px] w-[104px] rounded-full" />
            ) : (
              <>
                <ProgressRing
                  value={stats.attendance_pct}
                  size={104}
                  stroke={9}
                  showValue={false}
                  tone={
                    stats.attendance_pct >= 90 ? 'leaf' : stats.attendance_pct >= 80 ? 'clay' : 'danger'
                  }
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <div className="label">{t('dash.attendanceToday')}</div>
                  <div className="tabular font-display text-[44px] font-semibold leading-none text-ink">
                    <CountUp value={stats.attendance_pct} decimals={1} />
                    <span className="text-2xl text-ink-3">%</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <Badge tone="leaf" dot>
                      {formatNumber(stats.present_today)} {t('att.present')}
                    </Badge>
                    <Badge tone="danger" dot>
                      {formatNumber(stats.absent_today)} {t('att.absent')}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Marking progress reads as a single continuous bar across the school. */}
        {!loading && stats && classRows.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-surface-2/40 px-5 py-3 sm:px-7">
            <span className="label">{t('dash.classwiseAttendance')}</span>
            <Progress
              value={(markedClasses.length / classRows.length) * 100}
              tone="forest"
              size="sm"
              className="min-w-[8rem] flex-1"
              label={t('dash.classwiseAttendance')}
            />
            <span className="tabular text-xs font-semibold text-ink-2">
              {markedClasses.length}/{classRows.length} {t('dash.marked')}
            </span>
          </div>
        )}
      </section>

      {/* ══ Needs you today — the queue, not a wall of widgets ══ */}
      <section className="mb-5 sm:mb-6" aria-labelledby="needs-you">
        <h2 id="needs-you" className="label mb-2.5 flex items-center gap-2">
          <Sparkles size={13} className="text-forest" aria-hidden />
          {t('dash.needsYou')}
        </h2>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[86px]" />
            ))}
          </div>
        ) : actions.length === 0 ? (
          <Card className="flex items-center gap-4 p-4 sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-mint/45 text-leaf">
              <CheckCircle2 size={20} />
            </span>
            <div className="min-w-0">
              <div className="font-display text-[15px] font-semibold text-ink">
                {t('dash.allClear')}
              </div>
              <p className="mt-0.5 text-sm text-ink-2">{t('dash.allClearHint')}</p>
            </div>
          </Card>
        ) : (
          <div className="stagger-in grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {actions.map((a) => (
              <Card key={a.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <span
                    className={
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill ' +
                      (a.tone === 'clay'
                        ? 'bg-peach/45 text-clay'
                        : a.tone === 'danger'
                          ? 'bg-blush/45 text-danger'
                          : 'bg-sky/40 text-info')
                    }
                    aria-hidden
                  >
                    {a.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-snug text-ink">{a.title}</div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-2">{a.detail}</p>
                  </div>
                </div>
                <div className="mt-auto flex justify-end">{a.cta}</div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ══ Supporting numbers ══ */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:mb-6">
        {loading || !stats ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[132px]" />)
        ) : (
          <>
            <Stat
              label={t('dash.feeCollected')}
              value={formatINR(stats.fees_collected, { compact: true })}
              tone="leaf"
              icon={<BadgeIndianRupee size={17} />}
              sub={
                <>
                  <span className="tabular">
                    {stats.collection_pct}% {t('dash.ofTarget')} ·{' '}
                    {formatINR(stats.fees_target, { compact: true })}
                  </span>
                  <Progress
                    value={stats.collection_pct}
                    className="mt-2"
                    tone={stats.collection_pct >= 70 ? 'leaf' : 'clay'}
                    label={t('fee.collectionRate')}
                  />
                </>
              }
            />
            <Stat
              label={t('dash.feePending')}
              value={formatINR(stats.fees_outstanding, { compact: true })}
              tone="clay"
              icon={<Clock size={17} />}
              sub={
                <span className="tabular">
                  {formatNumber(stats.defaulter_count)} {t('common.families')} · {t('fee.term')}{' '}
                  {CURRENT_TERM}
                </span>
              }
            />
            <Stat
              label={t('dash.totalStudents')}
              value={<CountUp value={stats.total_students} />}
              tone="info"
              icon={<Users size={17} />}
              sub={
                <span className="tabular">
                  {classRows.length} {t('common.sections')} · {t('common.class')} 1–12
                </span>
              }
            />
          </>
        )}
      </div>

      {/* ══ Attendance across the school ══ */}
      <Card className="mb-5 overflow-hidden sm:mb-6">
        <CardHeader
          icon={<CalendarCheck2 size={15} />}
          title={t('dash.attendanceByGrade')}
          hint={formatDate(new Date().toISOString(), 'long')}
          action={
            <div className="flex items-center gap-2">
              <Segmented
                size="sm"
                label={t('common.filter')}
                value={classFilter}
                onChange={setClassFilter}
                className="hidden sm:inline-flex"
                options={[
                  { value: 'all', label: t('common.all'), count: classRows.length },
                  {
                    value: 'attention',
                    label: locale === 'ta' ? 'கவனம்' : 'Watch',
                    count: classRows.filter((c) => !c.marked || c.percentage < 85).length,
                  },
                  {
                    value: 'unmarked',
                    label: locale === 'ta' ? 'பதிவில்லை' : 'Unmarked',
                    count: pendingClasses.length,
                  },
                ]}
              />
              <Link
                href="/attendance"
                className="flex shrink-0 items-center gap-1 rounded-pill px-2 py-1 text-xs font-semibold text-forest ring-focus hover:underline"
              >
                {t('common.viewAll')} <ArrowUpRight size={13} aria-hidden />
              </Link>
            </div>
          }
        />
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-[66px]" />
              ))}
            </div>
          ) : heatCells.length === 0 ? (
            <Empty
              title={locale === 'ta' ? 'இந்த வடிகட்டியில் வகுப்புகள் இல்லை' : 'No classes in this filter'}
              hint={locale === 'ta' ? 'வடிகட்டியை மாற்றிப் பாருங்கள்.' : 'Try a different filter above.'}
              icon={<CheckCircle2 size={24} />}
            />
          ) : (
            <>
              <HeatGrid cells={heatCells} />
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-2xs text-ink-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-mint/70" aria-hidden /> 90%+
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-butter/70" aria-hidden /> 80–89%
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blush/70" aria-hidden /> {locale === 'ta' ? '80%க்குக் கீழ்' : 'Below 80%'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-line-strong" aria-hidden />{' '}
                  {t('dash.notMarkedYet')}
                </span>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* ══ Collection trend ══ */}
        <div className="lg:col-span-3">
          {loading ? (
            <Skeleton className="h-[340px]" />
          ) : (
            <ChartFrame
              title={t('dash.collectionTrend')}
              hint={`${SCHOOL.academic_year} · ${locale === 'ta' ? 'மாதவாரியாக' : 'by month'}`}
              action={<TrendingUp size={15} className="text-ink-3" aria-hidden />}
              data={trendPoints.map((p) => ({ label: p.label, value: p.display }))}
            >
              {trendPoints.length === 0 ? (
                <Empty
                  title={locale === 'ta' ? 'இன்னும் வசூல் இல்லை' : 'No collections yet'}
                  hint={
                    locale === 'ta'
                      ? 'பணம் பதிவு செய்யத் தொடங்கியதும் இங்கே போக்கு தெரியும்.'
                      : 'Once payments are recorded, the monthly trend appears here.'
                  }
                  icon={<TrendingUp size={24} />}
                />
              ) : (
                <TrendChart
                  points={trendPoints}
                  reference={monthlyTarget}
                  referenceLabel={
                    monthlyTarget
                      ? `${t('dash.target')} ≈ ${formatINR(monthlyTarget, { compact: true })}/${locale === 'ta' ? 'மாதம்' : 'mo'}`
                      : undefined
                  }
                />
              )}
            </ChartFrame>
          )}
        </div>

        {/* ══ Students who need following up ══ */}
        <Card id="low-attendance" className="flex flex-col overflow-hidden lg:col-span-2">
          <CardHeader
            icon={<AlertTriangle size={15} />}
            title={t('dash.lowAttendance')}
            hint={t('dash.lowAttendanceHelp')}
            action={low.length > 0 ? <Badge tone="danger">{low.length}</Badge> : undefined}
          />
          <div className="thin-scroll max-h-[360px] flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : low.length === 0 ? (
              <Empty
                title={locale === 'ta' ? 'எச்சரிக்கை இல்லை' : 'No one below 75%'}
                hint={
                  locale === 'ta'
                    ? 'அனைத்து மாணவர்களும் தேர்வெழுதத் தகுதியான வருகையில் உள்ளனர்.'
                    : 'Every student is above the board’s exam-eligibility threshold.'
                }
                icon={<CheckCircle2 size={24} />}
              />
            ) : (
              <ul>
                {low.slice(0, 15).map(({ student, summary, section }) => (
                  <li key={student.id}>
                    <Link
                      href={`/students/${student.id}`}
                      className="flex items-center gap-3 border-b border-line px-4 py-3 ring-focus transition-colors last:border-0 hover:bg-surface-2/70 sm:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">
                          {locale === 'ta' ? student.name_ta : student.name}
                        </div>
                        <div className="truncate text-2xs text-ink-3">
                          {t('common.class')} {section.label} ·{' '}
                          <span className="font-mono">{student.admission_no}</span>
                        </div>
                      </div>
                      <div className="w-20 shrink-0 text-right">
                        <div className="tabular text-sm font-semibold text-danger">
                          {summary.percentage}%
                        </div>
                        <Progress
                          value={summary.percentage}
                          tone="danger"
                          size="sm"
                          className="mt-1"
                          label={`${student.name} ${t('stu.attendanceRate')}`}
                        />
                      </div>
                      <ArrowRight size={14} className="shrink-0 text-ink-3" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {low.length > 15 && (
            <Link
              href="/students"
              className="border-t border-line px-5 py-3 text-center text-xs font-semibold text-forest ring-focus hover:underline"
            >
              {t('common.viewAll')} ({low.length})
            </Link>
          )}
        </Card>
      </div>

      {/* ══ What the school has been told lately ══ */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader
          icon={<Megaphone size={15} />}
          title={t('dash.recentActivity')}
          action={
            <Link
              href="/communication"
              className="flex items-center gap-1 rounded-pill px-2 py-1 text-xs font-semibold text-forest ring-focus hover:underline"
            >
              {t('common.viewAll')} <ArrowUpRight size={13} aria-hidden />
            </Link>
          }
        />
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : news.length === 0 ? (
          <Empty
            title={locale === 'ta' ? 'அறிவிப்புகள் இல்லை' : 'No announcements yet'}
            icon={<Megaphone size={24} />}
          />
        ) : (
          /* A timeline rather than a list — the rail carries the sequence,
             so each row can stay quiet. */
          <ol className="stagger-in relative px-5 py-4">
            <span className="absolute bottom-6 left-[1.6rem] top-6 w-px bg-line" aria-hidden />
            {news.map((a) => (
              <li key={a.id} className="relative flex gap-4 py-2.5">
                <span
                  className="relative z-10 mt-1 flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-surface ring-2 ring-line"
                  aria-hidden
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-forest" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-snug text-ink">{a.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-ink-3">
                    <span>{formatDate(a.sent_at)}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular">
                      {a.delivered}/{a.recipients} {t('msg.delivered')}
                    </span>
                    {a.channels.includes('whatsapp') && <Badge tone="leaf">WhatsApp</Badge>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
