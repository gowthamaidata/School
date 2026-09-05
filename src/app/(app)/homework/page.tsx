'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, NotebookPen, Plus, Trash2, TriangleAlert } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession } from '@/lib/auth/session'
import { repo, SECTIONS, staffById, subjectById, subjectsForStandard } from '@/lib/data/repository'
import type { Homework, HomeworkCoverageRow } from '@/lib/data/types'
import { formatDate, todayISO } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, Empty, Field, Input, PageHeader,
  Select, Skeleton, Textarea, Toast,
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
    await repo.saveHomework({
      sectionId,
      subjectId,
      title: title.trim(),
      description: body.trim(),
      dueOn,
      assignedBy: user.id,
    })
    setSaving(false)
    setTitle('')
    setBody('')
    setDueOn(tomorrowISO())
    setToast(`${t('hw.posted')} · ${section?.label ?? ''}`)
    load()
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
          className={`mb-4 flex flex-wrap items-center gap-3 p-3.5 ${
            pendingClasses.length > 0 ? 'border-clay/30 bg-clay-dim' : ''
          }`}
        >
          <TriangleAlert
            size={18}
            className={`shrink-0 ${pendingClasses.length > 0 ? 'text-clay' : 'text-forest'}`}
          />
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
          <Badge tone={pendingClasses.length > 0 ? 'clay' : 'forest'}>
            {coverage.length - pendingClasses.length}/{coverage.length}
          </Badge>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* ── Composer ─────────────────────────────────── */}
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader title={t('hw.assign')} hint={t('hw.parentsNotified')} />
          <div className="space-y-3.5 p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('hw.selectClass')}>
                <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                  {mySections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {t('common.class')} {s.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={t('hw.subject')}>
                <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
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

            <Button onClick={save} disabled={!canSave || saving} className="w-full">
              <Plus size={15} />
              {saving ? t('common.saving') : t('hw.assign')}
            </Button>
          </div>
        </Card>

        {/* ── What this class already has ──────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={t('hw.todaysWork')}
              hint={section ? `${t('common.class')} ${section.label} · ${formatDate(today, 'long')}` : undefined}
              action={<Badge tone={todaysItems.length > 0 ? 'forest' : 'neutral'}>{todaysItems.length}</Badge>}
            />
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : todaysItems.length === 0 ? (
              <Empty title={t('hw.noneToday')} icon={<NotebookPen size={22} />} />
            ) : (
              <div className="divide-y divide-line">
                {todaysItems.map((h) => (
                  <HomeworkRow key={h.id} hw={h} onDelete={() => remove(h.id)} />
                ))}
              </div>
            )}
          </Card>

          {earlier.length > 0 && (
            <Card>
              <CardHeader title={t('hw.recent')} action={<Badge tone="neutral">{earlier.length}</Badge>} />
              <div className="divide-y divide-line">
                {earlier.map((h) => (
                  <HomeworkRow key={h.id} hw={h} onDelete={() => remove(h.id)} muted />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
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
    <div className={`group flex items-start gap-3 px-4 py-3 ${muted ? 'opacity-80' : ''}`}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-forest-dim text-forest">
        <BookOpen size={15} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{locale === 'ta' ? subject?.name_ta : subject?.name}</Badge>
          <h3 className="text-sm font-semibold leading-snug text-ink">{hw.title}</h3>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-ink-2">{hw.description}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-2xs text-ink-3">
          <span>{formatDate(hw.assigned_on)}</span>
          <span>·</span>
          <Badge tone={dueTone}>{dueLabel}</Badge>
          {teacher && (
            <>
              <span>·</span>
              <span className="truncate">{teacher.name}</span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="shrink-0 rounded p-1.5 text-ink-3 ring-focus hover:bg-surface-2 hover:text-danger"
        title={t('hw.delete')}
        aria-label={t('hw.delete')}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
