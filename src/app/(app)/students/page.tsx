'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Download, Phone, Upload, Users } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { repo } from '@/lib/data/repository'
import type { ClassSection, Student } from '@/lib/data/types'
import {
  Avatar, Badge, Button, Card, CardHeader, Empty, Modal, PageHeader, Pagination,
  SearchInput, Select, Skeleton, Table, Td, Th,
} from '@/components/ui'

const PAGE_SIZE = 40

export default function StudentsPage() {
  const { t, locale } = usePrefs()

  const [students, setStudents] = useState<Student[]>([])
  const [sections, setSections] = useState<ClassSection[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    repo.getSections().then(setSections)
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    // Debounced only while typing — changing the class filter should feel
    // instant, and an empty query has nothing to debounce.
    const id = setTimeout(
      () => {
        repo
          .getStudents({ query: query || undefined, sectionId: sectionId || undefined })
          .then((s) => {
            if (!alive) return
            setStudents(s)
            setPage(0)
            setLoading(false)
          })
      },
      query ? 220 : 0,
    )
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [query, sectionId])

  const sectionMap = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s])),
    [sections],
  )

  const pageRows = useMemo(
    () => students.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [students, page],
  )

  const filtered = Boolean(query || sectionId)

  function exportCsv() {
    const header = [
      'admission_no', 'name', 'name_tamil', 'class', 'roll_no', 'gender', 'dob',
      'father_name', 'mother_name', 'guardian_phone', 'address',
    ]
    const lines = students.map((s) =>
      [
        s.admission_no, s.name, s.name_ta, sectionMap[s.section_id]?.label ?? '',
        s.roll_no, s.gender, s.dob, s.father_name, s.mother_name,
        s.guardian_phone, s.address,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        eyebrow={`${students.length} ${t('common.students')}`}
        title={t('stu.title')}
        description={
          locale === 'ta'
            ? 'மாணவர் விவரங்கள், பெற்றோர் தொடர்பு, வருகை மற்றும் கட்டண நிலை.'
            : 'Student records, guardian contacts, attendance and fee status in one place.'
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download size={15} aria-hidden />
              CSV
            </Button>
            <Button size="sm" onClick={() => setImportOpen(true)}>
              <Upload size={15} aria-hidden />
              {t('stu.importExcel')}
            </Button>
          </div>
        }
      />

      {/* ── Filters ─────────────────────────────────────── */}
      <Card className="mb-4">
        <div className="flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            label={t('common.search')}
            placeholder={
              locale === 'ta'
                ? 'பெயர், சேர்க்கை எண், தந்தை பெயர் அல்லது தொலைபேசி'
                : 'Name, admission no., father name or phone'
            }
            className="min-w-0 flex-1"
          />
          <Select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            aria-label={t('att.selectClass')}
            className="sm:w-56"
          >
            <option value="">
              {t('common.all')} — {t('common.class')}
            </option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {t('common.class')} {s.label} ({s.strength})
              </option>
            ))}
          </Select>
          {filtered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setSectionId('')
              }}
            >
              {t('common.clearFilters')}
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          icon={<Users size={15} />}
          title={t('stu.title')}
          hint={`${students.length} ${t('common.records')}`}
        />

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <Empty
            title={t('common.noResults')}
            hint={
              locale === 'ta'
                ? 'வேறு பெயரையோ வகுப்பையோ முயற்சிக்கவும்.'
                : 'Try a different name, or clear the class filter.'
            }
            icon={<Users size={26} />}
            action={
              filtered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    setSectionId('')
                  }}
                >
                  {t('common.clearFilters')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Phones get cards: six columns do not survive a 360px screen,
                and a horizontally scrolling table is worse than a stack. */}
            <ul className="divide-y divide-line sm:hidden">
              {pageRows.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/students/${s.id}`}
                    className="flex items-center gap-3 px-4 py-3 ring-focus transition-colors hover:bg-surface-2/70"
                  >
                    <Avatar name={s.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {locale === 'ta' ? s.name_ta : s.name}
                      </div>
                      <div className="truncate text-2xs text-ink-3">
                        {t('common.class')} {sectionMap[s.section_id]?.label ?? '—'} ·{' '}
                        <span className="font-mono">{s.admission_no}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden sm:block">
              <Table caption={t('stu.title')}>
                <thead>
                  <tr>
                    <Th>{t('common.name')}</Th>
                    <Th>{t('common.class')}</Th>
                    <Th>{t('stu.admissionNo')}</Th>
                    <Th className="hidden lg:table-cell">{t('stu.father')}</Th>
                    <Th>{t('common.phone')}</Th>
                    <Th align="center" className="hidden xl:table-cell">
                      {t('stu.bloodGroup')}
                    </Th>
                    <Th align="right">
                      <span className="sr-only">{t('common.actions')}</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((s) => (
                    <tr key={s.id} className="group transition-colors hover:bg-surface-2/70">
                      <Td>
                        {/* One link per row, stretched across it: the whole row
                            is clickable for a mouse and reachable with one tab
                            stop for the keyboard. */}
                        <Link
                          href={`/students/${s.id}`}
                          className="flex items-center gap-3 ring-focus"
                        >
                          <Avatar name={s.name} size={34} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink">
                              {locale === 'ta' ? s.name_ta : s.name}
                            </span>
                            <span className="block truncate text-2xs text-ink-3">
                              {locale === 'ta' ? s.name : s.name_ta}
                            </span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs">
                          {sectionMap[s.section_id]?.label ?? '—'}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs">{s.admission_no}</span>
                      </Td>
                      <Td className="hidden max-w-[180px] truncate lg:table-cell">{s.father_name}</Td>
                      <Td>
                        <a
                          href={`tel:${s.guardian_phone}`}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-forest ring-focus hover:underline"
                        >
                          <Phone size={12} aria-hidden />
                          {s.guardian_phone}
                        </a>
                      </Td>
                      <Td align="center" className="hidden xl:table-cell">
                        <Badge tone="neutral">{s.blood_group}</Badge>
                      </Td>
                      <Td align="right">
                        <ChevronRight
                          size={16}
                          className="ml-auto text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={students.length}
              onPage={setPage}
              labels={{
                previous: t('common.previous'),
                next: t('common.next'),
                showing: (a, b, n) => t('common.showingOf', { a, b, n }),
              }}
            />
          </>
        )}
      </Card>

      {/* ── Import helper ───────────────────────────────── */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title={t('stu.importExcel')}
        wide
        footer={
          <Button variant="ghost" onClick={() => setImportOpen(false)}>
            {t('common.close')}
          </Button>
        }
      >
        <div className="space-y-4 text-sm leading-relaxed text-ink-2">
          <p>
            {locale === 'ta'
              ? 'உங்கள் தற்போதைய எக்செல் கோப்பை கீழ்க்கண்ட நெடுவரிசைகளுடன் CSV ஆக சேமித்து பதிவேற்றவும். முதல் வரி தலைப்பாக இருக்க வேண்டும்.'
              : 'Save your existing Excel sheet as CSV with these columns and upload it. The first row must be the header.'}
          </p>

          <div className="thin-scroll well overflow-x-auto p-3">
            <code className="whitespace-pre font-mono text-2xs leading-relaxed text-ink-2">
              {`admission_no,name,name_tamil,class,section,roll_no,gender,dob,
father_name,mother_name,guardian_phone,address,blood_group

TN260001,Aravind M,அரவிந்த் மு,8,A,1,M,2012-04-11,
Murugan S,Kalpana M,9843012345,"12, Gandhipuram, Coimbatore",O+`}
            </code>
          </div>

          <div className="rounded-md border border-clay/25 bg-clay-dim p-3 text-xs leading-relaxed">
            <strong className="text-ink">{locale === 'ta' ? 'குறிப்பு:' : 'Note:'}</strong>{' '}
            {locale === 'ta'
              ? 'செயல்விளக்க முறையில் இறக்குமதி முடக்கப்பட்டுள்ளது. Supabase இணைக்கப்பட்ட பிறகு இது இயங்கும் — பள்ளியின் முழுத் தரவையும் ஒரே முறையில் ஏற்றலாம்.'
              : 'Import is disabled in demo mode. It activates once Supabase is connected — then a full school roll can be loaded in one pass.'}
          </div>

          <Button variant="outline" onClick={exportCsv} className="w-full">
            <Download size={15} aria-hidden />
            {locale === 'ta' ? 'மாதிரி வடிவத்தைப் பதிவிறக்கு' : 'Download a sample in this format'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
