'use client'

import { useEffect, useMemo, useState } from 'react'
import { GraduationCap, Phone } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { repo } from '@/lib/data/repository'
import type { ClassSection, Staff } from '@/lib/data/types'
import { formatDate } from '@/lib/utils'
import {
  Avatar, Badge, Button, Card, Empty, PageHeader, SearchInput, Select, Skeleton,
} from '@/components/ui'

export default function StaffPage() {
  const { t, locale } = usePrefs()

  const [staff, setStaff] = useState<Staff[]>([])
  const [sections, setSections] = useState<ClassSection[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    Promise.all([repo.getStaff(), repo.getSections()]).then(([s, sec]) => {
      setStaff(s)
      setSections(sec)
      setLoading(false)
    })
  }, [])

  const sectionLabel = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s.label])),
    [sections],
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return staff.filter((s) => {
      if (role && s.role !== role) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        s.subjects.some((sub) => sub.toLowerCase().includes(q)) ||
        s.phone.includes(q)
      )
    })
  }, [staff, query, role])

  const counts = useMemo(
    () => ({
      teachers: staff.filter((s) => s.role === 'teacher').length,
      admin: staff.filter((s) => s.role === 'admin').length,
      total: staff.length,
    }),
    [staff],
  )

  return (
    <>
      <PageHeader
        eyebrow={`${counts.total} ${locale === 'ta' ? 'பணியாளர்கள்' : 'staff members'}`}
        title={t('staff.title')}
        description={
          locale === 'ta'
            ? `${counts.teachers} ஆசிரியர்கள் · ${counts.admin} அலுவலகப் பணியாளர்கள்`
            : `${counts.teachers} teaching staff · ${counts.admin} office staff`
        }
      />

      <Card className="mb-4">
        <div className="grid gap-2.5 p-3.5 sm:grid-cols-[1fr_200px]">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            label={t('common.search')}
            placeholder={
              locale === 'ta' ? 'பெயர், பாடம் அல்லது பதவி' : 'Name, subject or designation'
            }
          />
          <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label={t('common.filter')}>
            <option value="">{t('common.all')}</option>
            <option value="teacher">{t('role.teacher')}</option>
            <option value="admin">{t('role.admin')}</option>
            <option value="principal">{t('role.principal')}</option>
            <option value="correspondent">{t('role.correspondent')}</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[148px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <Empty
            title={t('common.noResults')}
            hint={
              locale === 'ta'
                ? 'வேறு பெயரையோ பாடத்தையோ முயற்சிக்கவும்.'
                : 'Try another name, subject or designation.'
            }
            icon={<GraduationCap size={26} />}
            action={
              query || role ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    setRole('')
                  }}
                >
                  {t('common.clearFilters')}
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        /* A staff directory is a set of people, not a spreadsheet — cards
           carry a face, a role and a phone number in one glance, and they
           reflow to one column on a phone without a horizontal scroll. */
        <ul className="stagger-in grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.id}>
              <Card className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={s.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[15px] font-semibold text-ink">
                      {s.name}
                    </div>
                    <div className="truncate text-xs text-ink-2">
                      {locale === 'ta' ? s.designation_ta : s.designation}
                    </div>
                    <div className="mt-0.5 text-2xs text-ink-3">
                      {locale === 'ta' ? 'சேர்ந்த நாள்' : 'Joined'} {formatDate(s.joined_on)}
                    </div>
                  </div>
                  {s.class_teacher_of.length > 0 && (
                    <Badge tone="forest" className="shrink-0">
                      {s.class_teacher_of.map((id) => sectionLabel[id] ?? id).join(', ')}
                    </Badge>
                  )}
                </div>

                {s.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.subjects.map((sub) => (
                      <Badge key={sub} tone="neutral">
                        {sub}
                      </Badge>
                    ))}
                  </div>
                )}

                <a
                  href={`tel:${s.phone}`}
                  className="mt-auto inline-flex items-center gap-2 rounded-md bg-surface-2/70 px-3 py-2 font-mono text-xs text-forest ring-focus transition-colors hover:bg-surface-3"
                >
                  <Phone size={13} aria-hidden />
                  {s.phone}
                </a>
              </Card>
            </li>
          ))}
        </ul>
      )}

    </>
  )
}
