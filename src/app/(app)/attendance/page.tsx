'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, CheckCheck, Clock3, MessageSquareText, RotateCcw, WifiOff, X } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession } from '@/lib/auth/session'
import { repo } from '@/lib/data/repository'
import type { AttendanceStatus, ClassSection, Student } from '@/lib/data/types'
import { cn, formatDate, todayISO } from '@/lib/utils'
import {
  Badge, Button, Card, ConfirmDialog, Empty, PageHeader, Progress, SearchInput,
  Select, Skeleton, Toast,
} from '@/components/ui'

type Marks = Record<string, AttendanceStatus>

const QUEUE_KEY = 'palli.attendance.queue'

/* The three states, in the order a teacher thinks about them. Present is
   first and largest because it is the answer ~90% of the time. */
const STATUSES: { value: AttendanceStatus; icon: typeof Check; labelKey: 'att.present' | 'att.late' | 'att.absent' }[] = [
  { value: 'present', icon: Check, labelKey: 'att.present' },
  { value: 'late', icon: Clock3, labelKey: 'att.late' },
  { value: 'absent', icon: X, labelKey: 'att.absent' },
]

const MARK_STYLE: Record<AttendanceStatus, string> = {
  present: 'border-leaf bg-leaf text-white',
  late: 'border-clay bg-clay text-white',
  absent: 'border-danger bg-danger text-white',
}

const HOVER_STYLE: Record<AttendanceStatus, string> = {
  present: 'hover:border-leaf/50 hover:text-leaf',
  late: 'hover:border-clay/50 hover:text-clay',
  absent: 'hover:border-danger/50 hover:text-danger',
}

const ROW_TINT: Record<AttendanceStatus, string> = {
  present: 'bg-mint/[0.14]',
  late: 'bg-butter/[0.18]',
  absent: 'bg-blush/[0.18]',
}

export default function AttendancePage() {
  const { t, locale } = usePrefs()
  const { user } = useSession()

  const [sections, setSections] = useState<ClassSection[]>([])
  const [sectionId, setSectionId] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks] = useState<Marks>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [alreadyMarked, setAlreadyMarked] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone?: 'forest' | 'danger' } | null>(null)
  const [online, setOnline] = useState(true)
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)
  const [query, setQuery] = useState('')

  // Live stopwatch — starts on first tap, so the demo can show the real number.
  // `startedAt` is a ref (it must not itself trigger renders), but whether the
  // clock is running is state, because the UI reads it during render.
  const [elapsed, setElapsed] = useState(0)
  const [timing, setTiming] = useState(false)
  const startedAt = useRef<number | null>(null)
  const [finalTime, setFinalTime] = useState<number | null>(null)

  const date = todayISO()

  /* ── Online/offline ─────────────────────────────────── */
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  /* ── Load sections; default to the teacher's own class ─ */
  useEffect(() => {
    repo.getSections().then((secs) => {
      setSections(secs)
      const mine = user?.section_ids?.[0]
      setSectionId(mine && secs.some((s) => s.id === mine) ? mine : secs[0]?.id ?? '')
    })
  }, [user])

  /* ── Load roster + any existing marks ───────────────── */
  useEffect(() => {
    if (!sectionId) return
    let alive = true
    setLoading(true)
    setQuery('')
    startedAt.current = null
    setTiming(false)
    setElapsed(0)
    setFinalTime(null)

    Promise.all([
      repo.getStudents({ sectionId }),
      repo.getAttendanceForSection(sectionId, date),
    ]).then(([roster, existing]) => {
      if (!alive) return
      setStudents(roster)
      if (existing.length > 0) {
        const m: Marks = {}
        for (const r of existing) m[r.student_id] = r.status
        setMarks(m)
        setAlreadyMarked(true)
      } else {
        setMarks({})
        setAlreadyMarked(false)
      }
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [sectionId, date])

  /* ── Stopwatch tick ─────────────────────────────────── */
  useEffect(() => {
    if (!timing || finalTime !== null) return
    const id = setInterval(() => {
      if (startedAt.current !== null) setElapsed(Date.now() - startedAt.current)
    }, 100)
    return () => clearInterval(id)
  }, [timing, finalTime])

  const beginTiming = useCallback(() => {
    if (startedAt.current === null) {
      startedAt.current = Date.now()
      setElapsed(0)
      setTiming(true)
    }
  }, [])

  const setMark = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      beginTiming()
      setMarks((m) => ({ ...m, [studentId]: status }))
    },
    [beginTiming],
  )

  const markAllPresent = useCallback(() => {
    beginTiming()
    setMarks(Object.fromEntries(students.map((s) => [s.id, 'present' as AttendanceStatus])))
  }, [students, beginTiming])

  /** Fills only the untouched students — the fastest honest path once a
   *  teacher has picked out the few who are away. */
  const markRestPresent = useCallback(() => {
    beginTiming()
    setMarks((m) => {
      const next = { ...m }
      for (const s of students) if (!next[s.id]) next[s.id] = 'present'
      return next
    })
  }, [students, beginTiming])

  const resetMarks = useCallback(() => {
    setMarks({})
    startedAt.current = null
    setTiming(false)
    setElapsed(0)
    setFinalTime(null)
  }, [])

  const counts = useMemo(() => {
    const vals = Object.values(marks)
    return {
      present: vals.filter((v) => v === 'present').length,
      absent: vals.filter((v) => v === 'absent').length,
      late: vals.filter((v) => v === 'late').length,
      done: vals.length,
    }
  }, [marks])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.name_ta.includes(query.trim()) ||
        s.admission_no.toLowerCase().includes(q) ||
        String(s.roll_no) === q,
    )
  }, [students, query])

  const complete = students.length > 0 && counts.done === students.length
  const remaining = students.length - counts.done

  async function submit() {
    if (!complete || !user) return
    setSaving(true)
    if (startedAt.current !== null) setFinalTime(Date.now() - startedAt.current)

    const entries = students.map((s) => ({
      studentId: s.id,
      status: marks[s.id] ?? ('present' as AttendanceStatus),
    }))

    if (!online) {
      // Queue locally; a real deployment flushes this from the service worker.
      try {
        const q = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
        q.push({ sectionId, date, entries, markedBy: user.id })
        localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
      } catch {
        setSaving(false)
        setToast({
          msg:
            locale === 'ta'
              ? 'ஆஃப்லைன் சேமிப்பில் சிக்கல். இணையம் திரும்பும் போது மீண்டும் சமர்ப்பிக்கவும்.'
              : 'Offline save failed. Please submit again when internet is back.',
          tone: 'danger',
        })
        return
      }
      setSaving(false)
      setAlreadyMarked(true)
      setToast({ msg: t('att.offlineNote') })
      return
    }

    try {
      const { absentees } = await repo.saveAttendance({
        sectionId,
        date,
        markedBy: user.id,
        entries,
      })
      setAlreadyMarked(true)
      setToast({
        msg:
          absentees.length > 0
            ? `${t('att.submitted')} · ${absentees.length} ${
                locale === 'ta' ? 'பெற்றோருக்கு அறிவிப்பு' : 'parents notified'
              }`
            : t('att.submitted'),
      })
    } catch (err) {
      console.error('[attendance] save failed', err)
      setToast({ msg: t('common.error'), tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  const section = sections.find((s) => s.id === sectionId)
  const seconds = ((finalTime ?? elapsed) / 1000).toFixed(1)

  return (
    <>
      <PageHeader
        eyebrow={formatDate(date, 'day')}
        title={t('att.title')}
        description={
          locale === 'ta'
            ? 'மாணவரின் பெயருக்கு அருகில் தட்டி வருகையைக் குறிக்கவும். சமர்ப்பித்ததும் வராதவர்களின் பெற்றோருக்குச் செய்தி செல்லும்.'
            : 'Tap beside a name to mark. Parents of absent students are messaged the moment you submit.'
        }
      />

      {/* ══ Control bar: which class, how far along, and the two shortcuts
             that actually save time. Sticky so it stays reachable while
             scrolling a 40-name roster. ══ */}
      {/* Sticky from `lg` up only: on a phone this bar is tall enough that
          pinning it would cover a third of the roster it is meant to help with. */}
      <Card className="mb-4 overflow-hidden lg:sticky lg:top-14 lg:z-10 lg:shadow-lift">
        <div className="flex flex-col gap-3 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[13rem] flex-1 sm:max-w-xs">
              <label htmlFor="attendance-section" className="label mb-1.5 block">
                {t('att.selectClass')}
              </label>
              <Select
                id="attendance-section"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {t('common.class')} {s.label} · {s.strength} {t('common.students')}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Badge tone="leaf" dot>
                {t('att.present')} {counts.present}
              </Badge>
              <Badge tone="clay" dot>
                {t('att.late')} {counts.late}
              </Badge>
              <Badge tone="danger" dot>
                {t('att.absent')} {counts.absent}
              </Badge>
              {timing && (
                <span className="tabular ml-auto flex items-center gap-1.5 rounded-pill bg-forest-dim px-2.5 py-1 font-mono text-xs font-semibold text-forest">
                  <Clock3 size={13} aria-hidden />
                  {seconds}s
                </span>
              )}
              {!online && (
                <Badge tone="clay" className="ml-auto">
                  <WifiOff size={11} aria-hidden /> Offline
                </Badge>
              )}
            </div>

            <div className="flex shrink-0 gap-2">
              {counts.done > 0 && !complete && (
                <Button variant="outline" size="sm" onClick={markRestPresent}>
                  <CheckCheck size={15} aria-hidden />
                  {t('att.markRestPresent')}
                </Button>
              )}
              {counts.done === 0 ? (
                <Button variant="outline" size="sm" onClick={() => setConfirmAllOpen(true)} disabled={loading}>
                  <CheckCheck size={15} aria-hidden />
                  {t('att.markAllPresent')}
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={resetMarks}>
                  <RotateCcw size={14} aria-hidden />
                  {t('att.clearMarks')}
                </Button>
              )}
            </div>
          </div>

          {/* Progress is the honest answer to "how much is left" — a bar
              beats a fraction buried in a badge. */}
          <div className="flex items-center gap-3">
            <Progress
              value={students.length ? (counts.done / students.length) * 100 : 0}
              tone={complete ? 'leaf' : 'forest'}
              size="sm"
              className="flex-1"
              label={t('att.title')}
            />
            <span className="tabular shrink-0 text-xs font-semibold text-ink-2">
              {complete ? (
                <span className="text-leaf-ink">{t('att.everyoneMarked')}</span>
              ) : (
                <>
                  {remaining} {t('att.remaining')}
                </>
              )}
            </span>
          </div>
        </div>

        {alreadyMarked && (
          <div className="flex items-center gap-2 border-t border-line bg-leaf-dim px-4 py-2.5 text-xs font-medium text-leaf-ink">
            <Check size={14} className="animate-bounce-check" aria-hidden />
            {t('att.alreadyMarked')}
            {finalTime !== null && (
              <span className="tabular ml-auto font-mono font-semibold">
                {t('att.tookSeconds', { n: seconds })}
              </span>
            )}
          </div>
        )}
      </Card>

      {/* ══ Roster ══
          Two columns from `xl` up. The old single full-width row put the
          three controls a long mouse-travel away from the name they belong
          to; keeping each row narrow keeps name and control together. */}
      <section className="mb-28 lg:mb-24">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              {t('common.class')} {section?.label ?? ''}
            </h2>
            <p className="text-xs text-ink-3">
              {section?.room ? `${section.room} · ` : ''}
              {students.length} {t('common.students')}
            </p>
          </div>
          <SearchInput
            value={query}
            onValueChange={setQuery}
            label={t('att.searchStudent')}
            placeholder={t('att.searchStudent')}
            className="w-full sm:w-72"
          />
        </div>

        {loading ? (
          <div className="grid gap-2 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Card>
            <Empty
              title={t('common.noResults')}
              hint={locale === 'ta' ? 'வேறு பெயரை முயற்சிக்கவும்.' : 'Try another name or roll number.'}
              action={
                <Button variant="outline" size="sm" onClick={() => setQuery('')}>
                  {t('common.clearFilters')}
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {visible.map((s) => {
              const mark = marks[s.id]
              return (
                <li
                  key={s.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5 transition-colors duration-200',
                    mark && ROW_TINT[mark],
                  )}
                >
                  <span className="tabular w-6 shrink-0 text-center font-mono text-xs text-ink-3">
                    {s.roll_no}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {locale === 'ta' ? s.name_ta : s.name}
                    </div>
                    <div className="truncate font-mono text-2xs text-ink-3">{s.admission_no}</div>
                  </div>

                  {/* One control, three states — grouped so it reads as a
                      single choice rather than three separate buttons. */}
                  <div
                    className="flex shrink-0 gap-1 rounded-pill bg-surface-2 p-1"
                    role="radiogroup"
                    aria-label={`${t('common.status')} — ${s.name}`}
                  >
                    {STATUSES.map(({ value, icon: Icon, labelKey }) => {
                      const active = mark === value
                      return (
                        <button
                          key={value}
                          role="radio"
                          aria-checked={active}
                          onClick={() => setMark(s.id, value)}
                          aria-label={`${t(labelKey)} — ${s.name}`}
                          title={t(labelKey)}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-pill border transition-all duration-150 ease-soft ring-focus-tight active:scale-90',
                            active
                              ? MARK_STYLE[value]
                              : cn('border-transparent bg-surface text-ink-3', HOVER_STYLE[value]),
                          )}
                        >
                          <Icon size={16} strokeWidth={2.4} aria-hidden />
                        </button>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* ══ Submit bar ══
          Sits above the mobile tab bar and clears it; the roster carries
          matching bottom margin so the last student is never hidden. */}
      <div className="no-print fixed inset-x-0 bottom-[var(--tabbar)] z-20 border-t border-line bg-surface/95 px-4 py-3 pb-safe shadow-lift backdrop-blur-md lg:bottom-0 lg:left-64 lg:px-8">
        <div className="mx-auto flex max-w-[86rem] items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">
              {complete ? t('att.readyToSubmit') : `${remaining} ${t('att.remaining')}`}
            </div>
            {/* The reassurance line is the first thing to go when the bar
                gets tight — the action must never wrap. */}
            <div className="hidden items-center gap-1.5 text-2xs text-ink-3 sm:flex">
              <MessageSquareText size={11} aria-hidden />
              {t('att.parentsNotified')}
            </div>
          </div>
          {!complete && students.length > 0 && (
            <Button variant="outline" size="md" onClick={markRestPresent} className="hidden sm:inline-flex">
              {t('att.markRestPresent')}
            </Button>
          )}
          <Button onClick={submit} disabled={!complete} loading={saving} size="md">
            {saving ? t('common.saving') : t('att.submitAttendance')}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAllOpen}
        onClose={() => setConfirmAllOpen(false)}
        onConfirm={() => {
          markAllPresent()
          setConfirmAllOpen(false)
        }}
        title={t('common.areYouSure')}
        description={
          locale === 'ta'
            ? 'இது அனைவரையும் வருகை என குறிக்கும். முந்தைய குறிகள் மாற்றப்படலாம்.'
            : 'This will mark every student present and may overwrite existing marks.'
        }
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        tone="primary"
      />

      {toast && (
        <Toast message={toast.msg} tone={toast.tone ?? 'forest'} onDismiss={() => setToast(null)} />
      )}
    </>
  )
}
