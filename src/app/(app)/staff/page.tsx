'use client'

import { useEffect, useMemo, useState } from 'react'
import { GraduationCap, Phone, Search } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { repo } from '@/lib/data/repository'
import type { ClassSection, Staff } from '@/lib/data/types'
import { formatDate } from '@/lib/utils'
import {
  Avatar, Badge, Card, CardHeader, Empty, Input, PageHeader, Select, Skeleton, Table, Td, Th,
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
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                locale === 'ta' ? 'பெயர், பாடம் அல்லது பதவி' : 'Name, subject or designation'
              }
              className="pl-9"
            />
          </div>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">{t('common.all')}</option>
            <option value="teacher">{t('role.teacher')}</option>
            <option value="admin">{t('role.admin')}</option>
            <option value="principal">{t('role.principal')}</option>
            <option value="correspondent">{t('role.correspondent')}</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title={t('staff.title')}
          hint={`${filtered.length} ${locale === 'ta' ? 'பதிவுகள்' : 'records'}`}
        />
        {loading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Empty title={t('common.noResults')} icon={<GraduationCap size={22} />} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.name')}</Th>
                <Th>{t('staff.designation')}</Th>
                <Th>{t('staff.subjects')}</Th>
                <Th>{t('staff.classTeacherOf')}</Th>
                <Th>{t('common.phone')}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-surface-2">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.name} size={32} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">{s.name}</div>
                        <div className="font-mono text-2xs text-ink-3">
                          {locale === 'ta' ? 'சேர்ந்த நாள்' : 'Joined'}{' '}
                          {formatDate(s.joined_on)}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>{locale === 'ta' ? s.designation_ta : s.designation}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {s.subjects.length === 0 ? (
                        <span className="text-ink-3">—</span>
                      ) : (
                        s.subjects.map((sub) => (
                          <Badge key={sub} tone="neutral">
                            {sub}
                          </Badge>
                        ))
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {s.class_teacher_of.length === 0 ? (
                        <span className="text-ink-3">—</span>
                      ) : (
                        s.class_teacher_of.map((id) => (
                          <Badge key={id} tone="forest">
                            {sectionLabel[id] ?? id}
                          </Badge>
                        ))
                      )}
                    </div>
                  </Td>
                  <Td>
                    <a
                      href={`tel:${s.phone}`}
                      className="flex items-center gap-1.5 font-mono text-xs text-forest hover:underline"
                    >
                      <Phone size={12} />
                      {s.phone}
                    </a>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
