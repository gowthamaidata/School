'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, NotebookPen, Plus, Trash2, TriangleAlert } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession } from '@/lib/auth/session'
import { repo, SECTIONS, staffById, subjectById, subjectsForStandard } from '@/lib/data/repository'
import type { Homework, HomeworkCoverageRow } from '@/lib/data/types'
import { formatDate, todayISO } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, ConfirmDialog, Empty, Field, IconButton, Input,
  PageHeader, Select, Skeleton, Textarea, Toast,
} from '@/components/ui'

/** Tomorrow in YYYY-MM-DD — the default due date, because it nearly always is. */
function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** A week back, so the list shows what was set recently without going stale. */
function weekAgoISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().slice(0, 10)
}

export default function HomeworkPage() {
  const { t, locale } = usePrefs()
  const { user, can } = useSession()

  // A teacher is scoped to their own sections; office roles see all of them.
  const mySections = useMemo(() => {
    if (!user) return []
    if (user.role === 'teacher' && user.section_ids?.length) {
      return SECTIONS.filter((s) => user.section_ids!.includes(s.id))
    }
    return SECTIONS
  }, [user])

  const [sectionId, setSectionId] = useState('')
  const [items, setItems] = useState<Homework[]>([])
  const [coverage, setCoverage] = useState<HomeworkCoverageRow[]>([])
  const [loading, setLoading] = useState(true)

  const [subjectId, setSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [dueOn, setDueOn] = useState(tomorrowISO())
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Default to the first section this user is allowed to post for.
  useEffect(() => {
    if (!sectionId && mySections.length > 0) setSectionId(mySections[0].id)
  }, [mySections, sectionId])

  const section = SECTIONS.find((s) => s.id === sectionId)
  const subjects = section ? subjectsForStandard(section.standard) : []

  // Keep the subject valid when the class changes — a Std 3 class has no Physics.
  useEffect(() => {
    if (subjects.length === 0) return
    if (!subjects.some((s) => s.id === subjectId)) setSubjectId(subjects[0].id)
  }, [subjects, subjectId])

  const load = useCallback(async () => {
    if (!sectionId) return
    setLoading(true)
    const [rows, cov] = await Promise.all([
      repo.getHomework({ sectionId, onOrAfter: weekAgoISO() }),
      repo.getHomeworkCoverage(),
    ])
    setItems(rows)
    setCoverage(cov)
    setLoading(false)
  }, [sectionId])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    if (!user || !sectionId || !subjectId) return
    setSaving(true)
    try {
      await repo.saveHomework({
        sectionId,
        subjectId,
        title: title.trim(),
        description: body.trim(),
        dueOn,
        assignedBy: user.id,
      })
      setTitle('')
      setBody('')
      setDueOn(tomorrowISO())
      setToast(`${t('hw.posted')} · ${t('common.class')} ${section?.label ?? ''}`)
      load()
    } catch (err) {
      console.error('[homework] save failed', err)
      setToast(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await repo.deleteHomework(id)
    setToast(t('hw.deleted'))
    load()
  }

  const canSave = title.trim().length > 2 && body.trim().length > 4 && !!subjectId

  const today = todayISO()
  const todaysItems = items.filter((h) => h.assigned_on === today)
  const earlier = items.filter((h) => h.assigned_on !== today)
  const pendingClasses = coverage.filter((c) => c.count === 0)

  // Only office roles get the school-wide compliance view. A teacher seeing
  // which of their colleagues has not posted is a staffroom problem.
  const showCoverage = can('view_dashboard') && user?.role !== 'teacher'

  return (
    <>
      <PageHeader
        eyebrow={`${formatDate(today, 'day')} · ${items.length} ${t('hw.itemsThisWeek')}`}
        title={t('hw.title')}
        description={
          locale === 'ta'
            ? 'வகுப்புக்கு வீட்டுப்பாடம் பதிவிடுங்கள் — பெற்றோர் உடனடியாகச் செயலியில் பார்ப்பார்கள்.'
            : 'Post the work for a class. Parents see it in the app the moment you save.'
        }
      />

      {/* ── Principal's view: who has not posted today ──── */}
      {showCoverage && (
        <Card
          className={`mb-4 flex flex-wrap items-center gap-3 p-4 ${
            pendingClasses.length > 0 ? 'border-clay/25 bg-clay-dim' : ''
          }`}
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-pill ${
              pendingClasses.length > 0 ? 'bg-peach/50 text-clay' : 'bg-mint/45 text-leaf'
            }`}
            aria-hidden
          >
            <TriangleAlert size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">{t('hw.coverage')}</div>
            <div className="text-xs text-ink-2">
              {pendingClasses.length === 0 ? (
                t('hw.allPosted')
              ) : (
                <>
                  <span className="tabular font-semibold">{pendingClasses.length}</span>{' '}
                  {t('hw.classesPending')} —{' '}
                  <span className="font-mono">
                    {pendingClasses.slice(0, 6).map((c) => c.label).join(', ')}
                    {pendingClasses.length > 6 && ' …'}
                  </span>
                </>
              )}
            </div>
          </div>
          <Badge tone={pendingClasses.length > 0 ? 'clay' : 'leaf'} dot>
            {coverage.length - pendingClasses.length}/{coverage.length}
          </Badge>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_1fr]">
        {/* ── Composer ─────────────────────────────────── */}
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader title={t('hw.assign')} hint={t('hw.parentsNotified')} />
          <div className="space-y-3.5 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('hw.selectClass')}>
                <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)} aria-label={t('hw.selectClass')}>
                  {mySections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {t('common.class')} {s.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t('hw.subject')}>
                <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label={t('hw.subject')}>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {locale === 'ta' ? s.name_ta : s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label={t('hw.workTitle')}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('hw.placeholderTitle')}
                maxLength={90}
              />
            </Field>

            <Field label={t('hw.details')} hint={`${body.length} / 600`}>
              <Textarea
                rows={5}
                maxLength={600}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('hw.placeholderBody')}
              />
            </Field>

            <Field label={t('hw.dueOn')}>
              <Input type="date" value={dueOn} min={today} onChange={(e) => setDueOn(e.target.value)} />
            </Field>

            <Button onClick={save} disabled={!canSave} loading={saving} className="w-full">
              <Plus size={15} aria-hidden />
              {t('hw.assign')}
            </Button>
          </div>
        </Card>

        {/* ── What this class already has ──────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={t('hw.todaysWork')}
              hint={section ? `${t('common.class')} ${section.label} · ${formatDate(today, 'long')}` : undefined}
              action={<Badge tone={todaysItems.length > 0 ? 'leaf' : 'neutral'}>{todaysItems.length}</Badge>}
            />
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : todaysItems.length === 0 ? (
              <Empty
                title={t('hw.noneToday')}
                hint={
                  locale === 'ta'
                    ? 'இடதுபுறம் உள்ள படிவத்தில் இன்றைய பணியைப் பதிவிடுங்கள்.'
                    : 'Use the composer to post today’s work — parents see it instantly.'
                }
                icon={<NotebookPen size={26} />}
              />
            ) : (
              <div className="divide-y divide-line">
                {todaysItems.map((h) => (
                  <HomeworkRow key={h.id} hw={h} onDelete={() => setDeleteId(h.id)} />
                ))}
              </div>
            )}
          </Card>

          {earlier.length > 0 && (
            <Card>
              <CardHeader title={t('hw.recent')} action={<Badge tone="neutral">{earlier.length}</Badge>} />
              <div className="divide-y divide-line">
                {earlier.map((h) => (
                  <HomeworkRow key={h.id} hw={h} onDelete={() => setDeleteId(h.id)} muted />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return
          await remove(deleteId)
          setDeleteId(null)
        }}
        title={t('common.areYouSure')}
        description={locale === 'ta' ? 'இந்த வீட்டுப்பாடத்தை நீக்கவா?' : 'Remove this homework item?'}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
      />
    </>
  )
}

/* ── One homework entry ───────────────────────────────── */
function HomeworkRow({
  hw,
  onDelete,
  muted = false,
}: {
  hw: Homework
  onDelete: () => void
  muted?: boolean
}) {
  const { t, locale } = usePrefs()
  const subject = subjectById(hw.subject_id)
  const teacher = staffById(hw.assigned_by)
  const today = todayISO()

  // Past work is history, not a problem: only flag "overdue" on rows the
  // teacher is still looking at as current. Older entries just show a date.
  const dueTone = muted ? 'neutral' : hw.due_on < today ? 'danger' : hw.due_on === today ? 'clay' : 'neutral'
  const dueLabel =
    !muted && hw.due_on < today
      ? t('hw.overdue')
      : !muted && hw.due_on === today
        ? t('hw.dueToday')
        : `${t('hw.dueOn')} ${formatDate(hw.due_on)}`

  return (
    <div
      /* Earlier work is de-emphasised by its section heading and by the
         quieter icon, not by dimming the whole row — blanket opacity took
         its text under the contrast floor. */
      className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/50 sm:px-5"
    >
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

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-ink-3">
          <span>{formatDate(hw.assigned_on)}</span>
          <span aria-hidden>·</span>
          <Badge tone={dueTone}>{dueLabel}</Badge>
          {teacher && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{teacher.name}</span>
            </>
          )}
        </div>
      </div>

      <IconButton
        label={`${t('hw.delete')} — ${hw.title}`}
        tone="danger"
        size="sm"
        onClick={onDelete}
        className="opacity-100 transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 size={15} aria-hidden />
      </IconButton>
    </div>
  )
}
