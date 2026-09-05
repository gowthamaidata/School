'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileText, Save, TrendingUp } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession } from '@/lib/auth/session'
import { repo, subjectsForStandard } from '@/lib/data/repository'
import type { ClassSection, Exam, Mark, Student, Subject } from '@/lib/data/types'
import { formatDate, gradeFor } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, Input, PageHeader, Select, Skeleton, Stat, Table, Td, Th, Toast,
} from '@/components/ui'

export default function ExamsPage() {
  const { t, locale } = usePrefs()
  const { user } = useSession()

  const [exams, setExams] = useState<Exam[]>([])
  const [sections, setSections] = useState<ClassSection[]>([])
  const [examId, setExamId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([repo.getExams(), repo.getSections()]).then(([e, s]) => {
      setExams(e)
      setSections(s)
      setExamId(e.find((x) => x.published)?.id ?? e[0]?.id ?? '')
      const mine = user?.section_ids?.[0]
      setSectionId(mine && s.some((x) => x.id === mine) ? mine : s[7]?.id ?? s[0]?.id ?? '')
    })
  }, [user])

  const section = sections.find((s) => s.id === sectionId)
  const subjects: Subject[] = useMemo(
    () => (section ? subjectsForStandard(section.standard) : []),
    [section],
  )

  useEffect(() => {
    if (subjects.length && !subjects.some((s) => s.id === subjectId)) {
      setSubjectId(subjects[0].id)
    }
  }, [subjects, subjectId])

  const load = useCallback(async () => {
    if (!examId || !sectionId) return
    setLoading(true)
    const [roster, ms] = await Promise.all([
      repo.getStudents({ sectionId }),
      repo.getMarks(examId, sectionId),
    ])
    setStudents(roster)
    setMarks(ms)
    setLoading(false)
  }, [examId, sectionId])

  useEffect(() => {
    load()
  }, [load])

  // Seed the editable draft from saved marks whenever the subject changes.
  useEffect(() => {
    if (!subjectId) return
    const d: Record<string, string> = {}
    for (const s of students) {
      const m = marks.find((x) => x.student_id === s.id && x.subject_id === subjectId)
      d[s.id] = m?.absent ? 'AB' : m?.marks_obtained != null ? String(m.marks_obtained) : ''
    }
    setDraft(d)
  }, [subjectId, students, marks])

  const subject = subjects.find((s) => s.id === subjectId)
  const maxMarks = subject?.max_marks ?? 100
  const passMarks = subject?.pass_marks ?? 35

  const stats = useMemo(() => {
    const values = Object.values(draft)
      .filter((v) => v !== '' && v.toUpperCase() !== 'AB')
      .map(Number)
      .filter((n) => !Number.isNaN(n))
    if (values.length === 0) return { avg: 0, pass: 0, top: 0, entered: 0 }
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const pass = (values.filter((v) => v >= passMarks).length / values.length) * 100
    return {
      avg: Math.round(avg * 10) / 10,
      pass: Math.round(pass),
      top: Math.max(...values),
      entered: values.length,
    }
  }, [draft, passMarks])

  async function save() {
    if (!examId || !subjectId) return
    setSaving(true)
    const entries = students.map((s) => {
      const raw = (draft[s.id] ?? '').trim()
      const isAbsent = raw.toUpperCase() === 'AB'
      const n = Number(raw)
      return {
        examId,
        studentId: s.id,
        subjectId,
        marks: isAbsent || raw === '' || Number.isNaN(n) ? null : Math.min(maxMarks, Math.max(0, n)),
      }
    })
    await repo.saveMarks(entries)
    setSaving(false)
    setToast(`${t('common.saved')} · ${subject?.name}`)
    await load()
  }

  return (
    <>
      <PageHeader
        eyebrow={exams.find((e) => e.id === examId)?.name}
        title={t('exam.title')}
        description={
          locale === 'ta'
            ? 'பாடவாரியாக மதிப்பெண்களைப் பதிவு செய்யுங்கள். சேமித்ததும் மதிப்பெண் அட்டை தானாகத் தயாராகும்.'
            : 'Enter marks subject by subject. Report cards build themselves the moment you save.'
        }
      />

      {/* ── Selectors ───────────────────────────────────── */}
      <Card className="mb-4">
        <div className="grid gap-2.5 p-3.5 sm:grid-cols-3">
          <div>
            <span className="label-mono mb-1.5 block">{t('exam.examination')}</span>
            <Select value={examId} onChange={(e) => setExamId(e.target.value)}>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {locale === 'ta' ? e.name_ta : e.name}
                  {!e.published ? ' (draft)' : ''}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <span className="label-mono mb-1.5 block">{t('common.class')}</span>
            <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {t('common.class')} {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <span className="label-mono mb-1.5 block">{t('exam.subject')}</span>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {locale === 'ta' ? s.name_ta : s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Class stats ─────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={t('exam.classAverage')}
          value={stats.avg}
          tone={stats.avg >= 60 ? 'forest' : stats.avg >= 45 ? 'clay' : 'danger'}
          sub={`${locale === 'ta' ? 'அதிகபட்சம்' : 'out of'} ${maxMarks}`}
          icon={<TrendingUp size={16} />}
        />
        <Stat
          label={t('exam.passPercent')}
          value={`${stats.pass}%`}
          tone={stats.pass >= 90 ? 'forest' : stats.pass >= 70 ? 'clay' : 'danger'}
          sub={`${locale === 'ta' ? 'தேர்ச்சி மதிப்பெண்' : 'pass mark'} ${passMarks}`}
        />
        <Stat
          label={locale === 'ta' ? 'உயர்ந்த மதிப்பெண்' : 'Highest'}
          value={stats.top}
          tone="info"
          sub={gradeFor((stats.top / maxMarks) * 100)}
        />
        <Stat
          label={locale === 'ta' ? 'பதிவு செய்யப்பட்டது' : 'Entered'}
          value={`${stats.entered}/${students.length}`}
          tone="neutral"
          sub={locale === 'ta' ? 'மாணவர்கள்' : 'students'}
        />
      </div>

      {/* ── Marks grid ──────────────────────────────────── */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader
          title={`${t('exam.enterMarks')} — ${
            locale === 'ta' ? subject?.name_ta : subject?.name
          }`}
          hint={`${t('common.class')} ${section?.label ?? ''} · ${t('exam.maxMarks')} ${maxMarks} · ${
            locale === 'ta' ? 'வரவில்லை என்றால் AB' : 'type AB if absent'
          }`}
          action={
            <Button size="sm" onClick={save} disabled={saving || loading}>
              <Save size={14} />
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          }
        />

        {loading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('att.rollNo')}</Th>
                <Th>{t('common.name')}</Th>
                <Th align="center">{t('exam.marksObtained')}</Th>
                <Th align="center">{t('exam.grade')}</Th>
                <Th align="right">{t('nav.reportCards')}</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const raw = draft[s.id] ?? ''
                const isAb = raw.toUpperCase() === 'AB'
                const n = Number(raw)
                const valid = raw !== '' && !isAb && !Number.isNaN(n)
                const grade = valid ? gradeFor((n / maxMarks) * 100) : isAb ? 'AB' : '—'
                const failed = valid && n < passMarks

                return (
                  <tr key={s.id} className="hover:bg-surface-2">
                    <Td>
                      <span className="tabular font-mono text-xs text-ink-3">{s.roll_no}</span>
                    </Td>
                    <Td>
                      <div className="font-medium text-ink">
                        {locale === 'ta' ? s.name_ta : s.name}
                      </div>
                      <div className="font-mono text-2xs text-ink-3">{s.admission_no}</div>
                    </Td>
                    <Td align="center">
                      <Input
                        value={raw}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, [s.id]: e.target.value }))
                        }
                        inputMode="numeric"
                        maxLength={3}
                        placeholder="—"
                        aria-label={`${t('exam.marksObtained')} ${s.name}`}
                        className={`mx-auto h-9 w-20 text-center font-mono tabular ${
                          failed ? 'border-danger/50 text-danger' : ''
                        }`}
                      />
                    </Td>
                    <Td align="center">
                      {grade === '—' ? (
                        <span className="text-ink-3">—</span>
                      ) : (
                        <Badge tone={isAb ? 'neutral' : failed ? 'danger' : 'forest'}>
                          {grade}
                        </Badge>
                      )}
                    </Td>
                    <Td align="right">
                      <Link href={`/report-card/${s.id}?exam=${examId}`}>
                        <Button size="sm" variant="ghost">
                          <FileText size={14} />
                        </Button>
                      </Link>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ── Exam schedule ───────────────────────────────── */}
      <Card className="mt-4">
        <CardHeader title={t('dash.upcomingExams')} />
        <div className="divide-y divide-line">
          {exams.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">
                  {locale === 'ta' ? e.name_ta : e.name}
                </div>
                <div className="font-mono text-2xs text-ink-3">
                  {formatDate(e.start_date)} — {formatDate(e.end_date)} · {t('fee.term')} {e.term}
                </div>
              </div>
              <Badge tone={e.published ? 'forest' : 'clay'}>
                {e.published
                  ? locale === 'ta' ? 'வெளியிடப்பட்டது' : 'Published'
                  : locale === 'ta' ? 'திட்டமிடப்பட்டது' : 'Scheduled'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
