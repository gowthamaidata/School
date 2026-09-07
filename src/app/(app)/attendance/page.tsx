'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, CheckCheck, Clock3, MessageSquareText, WifiOff, X } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession } from '@/lib/auth/session'
import { repo } from '@/lib/data/repository'
import type { AttendanceStatus, ClassSection, Student } from '@/lib/data/types'
import { formatDate, todayISO } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, ConfirmDialog, PageHeader, Select, Skeleton, Toast,
} from '@/components/ui'

type Marks = Record<string, AttendanceStatus>

const QUEUE_KEY = 'palli.attendance.queue'

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
  const [toast, setToast] = useState<{ msg: string; tone?: 'forest' | 'clay' } | null>(null)
  const [online, setOnline] = useState(true)
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)

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

  const counts = useMemo(() => {
    const vals = Object.values(marks)
    return {
      present: vals.filter((v) => v === 'present').length,
      absent: vals.filter((v) => v === 'absent').length,
      late: vals.filter((v) => v === 'late').length,
      done: vals.length,
    }
  }, [marks])

  const complete = students.length > 0 && counts.done === students.length

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
        setToast({
          msg:
            locale === 'ta'
              ? 'ஆஃப்லைன் சேமிப்பில் சிக்கல். இணையம் திரும்பும் போது மீண்டும் சமர்ப்பிக்கவும்.'
              : 'Offline save failed. Please submit again when internet is back.',
          tone: 'clay',
        })
      }
      setSaving(false)
      setAlreadyMarked(true)
      setToast({ msg: t('att.offlineNote'), tone: 'clay' })
      return
    }

    const { absentees } = await repo.saveAttendance({
      sectionId,
      date,
      markedBy: user.id,
      entries,
    })

    setSaving(false)
    setAlreadyMarked(true)
    setToast({
      msg:
        absentees.length > 0
          ? `${t('att.submitted')} · ${absentees.length} ${
              locale === 'ta' ? 'பெற்றோருக்கு அறிவிப்பு' : 'parents notified'
            }`
          : t('att.submitted'),
    })
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
            ? 'மாணவரின் பெயரைத் தட்டி வருகையைக் குறிக்கவும். சமர்ப்பித்ததும் வராதவர்களின் பெற்றோருக்குச் செய்தி செல்லும்.'
            : 'Tap a name to mark. Parents of absent students are messaged the moment you submit.'
        }
      />

      {/* ── Class picker + counters ─────────────────────── */}
      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-end">
          <div className="sm:w-56">
            <label htmlFor="attendance-section" className="label-mono mb-1.5 block">
              {t('att.selectClass')}
            </label>
            <Select id="attendance-section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {t('common.class')} {s.label} · {s.strength}{' '}
                  {locale === 'ta' ? 'மாணவர்' : 'students'}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Badge tone="forest">
              {t('att.present')} {counts.present}
            </Badge>
            <Badge tone="danger">
              {t('att.absent')} {counts.absent}
            </Badge>
            <Badge tone="clay">
              {t('att.late')} {counts.late}
            </Badge>
            <Badge tone="neutral">
              {counts.done}/{students.length}
            </Badge>

            {timing && (
              <span className="tabular ml-auto flex items-center gap-1.5 rounded-pill bg-forest-dim px-2 py-1 font-mono text-xs font-semibold text-forest">
                <Clock3 size={13} />
                {seconds}s
              </span>
            )}
            {!online && (
              <Badge tone="clay" className="ml-auto">
                <WifiOff size={11} /> Offline
              </Badge>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => setConfirmAllOpen(true)} disabled={loading}>
            <CheckCheck size={15} />
            {t('att.markAllPresent')}
          </Button>
        </div>

        {alreadyMarked && (
          <div className="flex items-center gap-2 border-t border-line bg-forest-dim px-3.5 py-2 text-xs text-forest">
            <Check size={14} className="animate-bounce-check" />
            {t('att.alreadyMarked')}
            {finalTime !== null && (
              <span className="tabular ml-auto font-mono font-semibold">
                {seconds}s
              </span>
            )}
          </div>
        )}
      </Card>

      {/* ── Roster ──────────────────────────────────────── */}
      {/* Extra bottom padding clears the submit bar and the mobile tab bar. */}
      <Card className="mb-24 lg:mb-16">
        <CardHeader
          title={`${t('common.class')} ${section?.label ?? ''}`}
          hint={section?.room}
          action={
            <span className="label-mono">
              {students.length} {locale === 'ta' ? 'மாணவர்' : 'students'}
            </span>
          }
        />

        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {students.map((s) => {
              const mark = marks[s.id]
              return (
                <li key={s.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="tabular w-7 shrink-0 font-mono text-xs text-ink-3">
                    {s.roll_no}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {locale === 'ta' ? s.name_ta : s.name}
                    </div>
                    <div className="truncate font-mono text-2xs text-ink-3">
                      {s.admission_no}
                    </div>
                  </div>

                  {/* Three big targets — sized for a thumb, not a mouse */}
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setMark(s.id, 'present')}
                      aria-label={`${t('att.present')} — ${s.name}`}
                      className={`flex h-10 w-10 items-center justify-center rounded border ring-focus transition-colors ${
                        mark === 'present'
                          ? 'border-forest bg-forest text-white'
                          : 'border-line bg-surface text-ink-3 hover:border-forest/40 hover:text-forest'
                      }`}
                    >
                      <Check size={17} />
                    </button>
                    <button
                      onClick={() => setMark(s.id, 'late')}
                      aria-label={`${t('att.late')} — ${s.name}`}
                      className={`flex h-10 w-10 items-center justify-center rounded border ring-focus transition-colors ${
                        mark === 'late'
                          ? 'border-clay bg-clay text-white'
                          : 'border-line bg-surface text-ink-3 hover:border-clay/40 hover:text-clay'
                      }`}
                    >
                      <Clock3 size={16} />
                    </button>
                    <button
                      onClick={() => setMark(s.id, 'absent')}
                      aria-label={`${t('att.absent')} — ${s.name}`}
                      className={`flex h-10 w-10 items-center justify-center rounded border ring-focus transition-colors ${
                        mark === 'absent'
                          ? 'border-danger bg-danger text-white'
                          : 'border-line bg-surface text-ink-3 hover:border-danger/40 hover:text-danger'
                      }`}
                    >
                      <X size={17} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* ── Sticky submit bar ───────────────────────────── */}
      <div className="no-print glass fixed inset-x-0 bottom-14 z-20 border-t border-line bg-surface/95 px-4 py-2.5 shadow-lift lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-ink">
              {complete
                ? locale === 'ta'
                  ? 'சமர்ப்பிக்கத் தயார்'
                  : 'Ready to submit'
                : `${students.length - counts.done} ${
                    locale === 'ta' ? 'மாணவர் மீதம்' : 'students left'
                  }`}
            </div>
            <div className="flex items-center gap-1 text-2xs text-ink-3">
              <MessageSquareText size={11} />
              {t('att.parentsNotified')}
            </div>
          </div>
          <Button onClick={submit} disabled={!complete || saving} size="md">
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
