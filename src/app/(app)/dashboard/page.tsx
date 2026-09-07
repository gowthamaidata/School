'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, ArrowUpRight, BadgeIndianRupee, CalendarCheck2,
  CircleAlert, Users, TrendingUp, Clock,
} from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { repo, SCHOOL, CURRENT_TERM } from '@/lib/data/repository'
import type {
  Announcement, ClassAttendanceRow, DashboardStats, AttendanceSummary,
  ClassSection, Student,
} from '@/lib/data/types'
import { formatDate, formatINR, formatNumber } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, CountUp, Empty, PageHeader, Progress, ProgressRing, Skeleton, Stat, Toast,
} from '@/components/ui'

type LowRow = { student: Student; summary: AttendanceSummary; section: ClassSection }

export default function DashboardPage() {
  const { t, locale } = usePrefs()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [classRows, setClassRows] = useState<ClassAttendanceRow[]>([])
  const [low, setLow] = useState<LowRow[]>([])
  const [trend, setTrend] = useState<{ month: string; amount: number }[]>([])
  const [news, setNews] = useState<Announcement[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([
      repo.getDashboardStats(),
      repo.getClassAttendanceToday(),
      repo.getLowAttendanceStudents(75),
      repo.getCollectionTrend(),
      repo.getAnnouncements(3),
    ]).then(([s, c, l, tr, n]) => {
      if (!alive) return
      setStats(s)
      setClassRows(c)
      setLow(l)
      setTrend(tr)
      setNews(n)
    })
    return () => {
      alive = false
    }
  }, [])

  async function handleRemind() {
    setSending(true)
    const n = await repo.sendFeeReminders(CURRENT_TERM)
    setSending(false)
    setToast(t('fee.remindersSent', { n }))
  }

  const pendingClasses = classRows.filter((c) => !c.marked)
  const maxTrend = Math.max(1, ...trend.map((d) => d.amount))

  return (
    <>
      <PageHeader
        eyebrow={`${formatDate(new Date().toISOString(), 'day')} · ${SCHOOL.academic_year}`}
        title={t('dash.title')}
        description={locale === 'ta' ? SCHOOL.name_ta : SCHOOL.name}
      />

      {/* ── Headline stats ──────────────────────────────── */}
      {!stats ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label={t('dash.attendanceToday')}
            value={
              <span>
                <CountUp value={stats.attendance_pct} />%
              </span>
            }
            tone={stats.attendance_pct >= 90 ? 'forest' : stats.attendance_pct >= 80 ? 'clay' : 'danger'}
            icon={<ProgressRing value={stats.attendance_pct} size={36} stroke={5} tone={stats.attendance_pct >= 90 ? 'forest' : stats.attendance_pct >= 80 ? 'clay' : 'danger'} />}
            sub={
              <span className="tabular">
                {formatNumber(stats.present_today)} {t('dash.presentToday')} ·{' '}
                <span className="text-danger">{formatNumber(stats.absent_today)}</span>{' '}
                {t('att.absent').toLowerCase()}
              </span>
            }
          />
          <Stat
            label={t('dash.feeCollected')}
            value={formatINR(stats.fees_collected, { compact: true })}
            tone={stats.collection_pct >= 70 ? 'forest' : 'clay'}
            icon={<BadgeIndianRupee size={16} />}
            sub={
              <>
                <span className="tabular">
                  {stats.collection_pct}% {t('dash.ofTarget')}
                </span>
                <Progress value={stats.collection_pct} className="mt-1.5" tone="forest" />
              </>
            }
          />
          <Stat
            label={t('dash.feePending')}
            value={formatINR(stats.fees_outstanding, { compact: true })}
            tone="danger"
            icon={<CircleAlert size={16} />}
            sub={
              <span className="tabular">
                {stats.defaulter_count} {locale === 'ta' ? 'குடும்பங்கள்' : 'families'} ·{' '}
                {t('fee.term')} {CURRENT_TERM}
              </span>
            }
          />
          <Stat
            label={t('dash.totalStudents')}
            value={<CountUp value={stats.total_students} />}
            tone="info"
            icon={<Users size={16} />}
            sub={
              <span className="tabular">
                {classRows.length} {locale === 'ta' ? 'வகுப்புகள்' : 'sections'} ·{' '}
                {t('common.class')} 1–12
              </span>
            }
          />
        </div>
      )}

      {/* ── Action strip: what needs the principal today ── */}
      {stats && (pendingClasses.length > 0 || stats.defaulter_count > 0) && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {pendingClasses.length > 0 && (
            <Card className="flex items-center gap-3 border-clay/30 bg-clay-dim p-3.5">
              <Clock size={18} className="shrink-0 text-clay" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink">
                  {t('dash.notMarkedYet')}
                </div>
                <div className="truncate text-xs text-ink-2">
                  <span className="tabular font-semibold">{pendingClasses.length}</span>{' '}
                  {t('dash.classesPending')} —{' '}
                  {pendingClasses.slice(0, 4).map((c) => c.label).join(', ')}
                  {pendingClasses.length > 4 && ' …'}
                </div>
              </div>
              <Link href="/attendance">
                <Button size="sm" variant="outline">
                  {t('nav.attendance')}
                </Button>
              </Link>
            </Card>
          )}

          {stats.defaulter_count > 0 && (
            <Card className="flex items-center gap-3 p-3.5">
              <BadgeIndianRupee size={18} className="shrink-0 text-ink-3" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink">{t('dash.feeDefaulters')}</div>
                <div className="truncate text-xs text-ink-2">
                  <span className="tabular font-semibold">{stats.defaulter_count}</span>{' '}
                  {locale === 'ta'
                    ? 'குடும்பங்களுக்கு நினைவூட்டல் அனுப்பலாம்'
                    : 'families can be reminded in one tap'}
                </div>
              </div>
              <Button size="sm" onClick={handleRemind} disabled={sending}>
                {sending ? t('common.saving') : t('dash.sendReminders')}
              </Button>
            </Card>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* ── Attendance by class ───────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={t('dash.classwiseAttendance')}
            hint={formatDate(new Date().toISOString(), 'long')}
            action={
              <Link
                href="/attendance"
                className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
              >
                {t('common.viewAll')} <ArrowUpRight size={13} />
              </Link>
            }
          />
          <div className="p-3">
            {classRows.length === 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <div className="stagger-in grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {classRows.map((c) => (
                  <div
                    key={c.section_id}
                    className={`rounded border p-2.5 ${
                      !c.marked
                        ? 'border-dashed border-line-strong bg-surface-2/60'
                        : 'border-line bg-surface'
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xs font-semibold text-ink">
                        {c.label}
                      </span>
                      {c.marked ? (
                        <span
                          className={`tabular text-sm font-bold ${
                            c.percentage >= 90
                              ? 'text-forest'
                              : c.percentage >= 80
                                ? 'text-clay'
                                : 'text-danger'
                          }`}
                        >
                          {c.percentage}%
                        </span>
                      ) : (
                        <span className="font-mono text-2xs uppercase tracking-wide text-ink-3">
                          —
                        </span>
                      )}
                    </div>
                    {c.marked ? (
                      <>
                        <Progress
                          value={c.percentage}
                          tone={c.percentage >= 90 ? 'forest' : c.percentage >= 80 ? 'clay' : 'danger'}
                          className="mt-1.5"
                        />
                        <div className="tabular mt-1.5 text-2xs text-ink-3">
                          {c.present}/{c.present + c.absent} {t('att.present').toLowerCase()}
                        </div>
                      </>
                    ) : (
                      <div className="mt-2 text-2xs text-ink-3">{t('dash.notMarkedYet')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── Low attendance alerts ─────────────────────── */}
        <Card>
          <CardHeader
            title={t('dash.lowAttendance')}
            hint={t('dash.lowAttendanceHelp')}
            action={<Badge tone="danger">{low.length}</Badge>}
          />
          <div className="max-h-[340px] overflow-y-auto thin-scroll">
            {low.length === 0 ? (
              <Empty
                title={locale === 'ta' ? 'எச்சரிக்கை இல்லை' : 'No alerts'}
                icon={<AlertTriangle size={22} />}
              />
            ) : (
              low.slice(0, 12).map(({ student, summary, section }) => (
                <Link
                  key={student.id}
                  href={`/students/${student.id}`}
                  className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0 hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">
                      {locale === 'ta' ? student.name_ta : student.name}
                    </div>
                    <div className="font-mono text-2xs text-ink-3">
                      {section.label} · {student.admission_no}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-sm font-bold text-danger">
                      {summary.percentage}%
                    </div>
                    <div className="tabular text-2xs text-ink-3">
                      {summary.absent} {locale === 'ta' ? 'நாள் இல்லை' : 'days out'}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* ── Collection trend ──────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={t('dash.collectionTrend')}
            hint={`${SCHOOL.academic_year} · ${locale === 'ta' ? 'மாதவாரியாக' : 'by month'}`}
            action={<TrendingUp size={15} className="text-ink-3" />}
          />
          <div className="p-4">
            {trend.length === 0 ? (
              <Skeleton className="h-40" />
            ) : (
              <div className="stagger-in flex h-44 items-stretch gap-3">
                {trend.map((d) => (
                  <div
                    key={d.month}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                    title={`${d.month}: ${formatINR(d.amount)}`}
                  >
                    <span className="tabular text-2xs font-medium text-ink-2">
                      {formatINR(d.amount, { compact: true })}
                    </span>
                    {/* The bar lives in its own flex-1 track so its percentage
                        height resolves against a real box, not an auto one. */}
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-forest/85 transition-[height] duration-500"
                        style={{ height: `${Math.max(4, (d.amount / maxTrend) * 100)}%` }}
                      />
                    </div>
                    <span className="label-mono">{d.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* ── Recent announcements ──────────────────────── */}
        <Card>
          <CardHeader
            title={t('dash.recentActivity')}
            action={
              <Link
                href="/communication"
                className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline"
              >
                {t('common.viewAll')} <ArrowUpRight size={13} />
              </Link>
            }
          />
          <div>
            <div className="stagger-in">
              {news.map((a) => (
              <div key={a.id} className="border-b border-line px-4 py-3 last:border-0">
                <div className="text-[13px] font-semibold leading-snug text-ink">{a.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-2xs text-ink-3">
                  <span>{formatDate(a.sent_at)}</span>
                  <span>·</span>
                  <span className="tabular">
                    {a.delivered}/{a.recipients} {t('msg.delivered')}
                  </span>
                  {a.channels.includes('whatsapp') && (
                    <Badge tone="forest">WhatsApp</Badge>
                  )}
                </div>
              </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
