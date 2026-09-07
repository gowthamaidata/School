'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Download, Search, Upload, Users } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { repo } from '@/lib/data/repository'
import type { ClassSection, Student } from '@/lib/data/types'
import {
  Avatar, Badge, Button, Card, CardHeader, Empty, Input, Modal, PageHeader,
  Select, Skeleton, Table, Td, Th,
} from '@/components/ui'

export default function StudentsPage() {
  const { t, locale } = usePrefs()
  const router = useRouter()

  const [students, setStudents] = useState<Student[]>([])
  const [sections, setSections] = useState<ClassSection[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    repo.getSections().then(setSections)
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    const id = setTimeout(() => {
      repo
        .getStudents({ query: query || undefined, sectionId: sectionId || undefined })
        .then((s) => {
          if (alive) {
            setStudents(s)
            setLoading(false)
          }
        })
    }, query ? 220 : 0)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [query, sectionId])

  const sectionMap = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s])),
    [sections],
  )

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
        eyebrow={`${students.length} ${locale === 'ta' ? 'மாணவர்கள்' : 'students'}`}
        title={t('stu.title')}
        description={
          locale === 'ta'
            ? 'மாணவர் விவரங்கள், பெற்றோர் தொடர்பு, வருகை மற்றும் கட்டண நிலை.'
            : 'Student records, guardian contacts, attendance and fee status in one place.'
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download size={15} />
              CSV
            </Button>
            <Button size="sm" onClick={() => setImportOpen(true)}>
              <Upload size={15} />
              {t('stu.importExcel')}
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <div className="grid gap-2.5 p-3.5 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('common.search')}
              placeholder={
                locale === 'ta'
                  ? 'பெயர், சேர்க்கை எண், தந்தை பெயர் அல்லது தொலைபேசி'
                  : 'Name, admission no., father name or phone'
              }
              className="pl-9"
            />
          </div>
          <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)} aria-label={t('att.selectClass')}>
            <option value="">{t('common.all')} — {t('common.class')}</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {t('common.class')} {s.label} ({s.strength})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title={t('stu.title')}
          hint={`${students.length} ${locale === 'ta' ? 'பதிவுகள்' : 'records'}`}
        />
        {loading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <Empty
            title={t('common.noResults')}
            hint={locale === 'ta' ? 'வேறு தேடலை முயற்சிக்கவும்' : 'Try a different search'}
            icon={<Users size={22} />}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.name')}</Th>
                <Th>{t('common.class')}</Th>
                <Th>{t('stu.admissionNo')}</Th>
                <Th>{t('stu.father')}</Th>
                <Th>{t('common.phone')}</Th>
                <Th align="center">{t('stu.bloodGroup')}</Th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 250).map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer transition-colors hover:bg-surface-2"
                  onClick={() => router.push(`/students/${s.id}`)}
                  role="link"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') router.push(`/students/${s.id}`)
                  }}
                >
                  <Td>
                    <Link
                      href={`/students/${s.id}`}
                      className="flex items-center gap-2.5 ring-focus"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Avatar name={s.name} size={32} />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink">
                          {locale === 'ta' ? s.name_ta : s.name}
                        </div>
                        <div className="truncate text-2xs text-ink-3">
                          {locale === 'ta' ? s.name : s.name_ta}
                        </div>
                      </div>
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
                  <Td className="max-w-[180px] truncate">{s.father_name}</Td>
                  <Td>
                    <a
                      href={`tel:${s.guardian_phone}`}
                      className="font-mono text-xs text-forest hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {s.guardian_phone}
                    </a>
                  </Td>
                  <Td align="center">
                    <Badge tone="neutral">{s.blood_group}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {students.length > 250 && (
          <div className="border-t border-line px-4 py-2.5 text-center text-xs text-ink-3">
            {locale === 'ta'
              ? `முதல் 250 காட்டப்படுகிறது (மொத்தம் ${students.length}).`
              : `Showing first 250 of ${students.length}. Filter by class to narrow down.`}
          </div>
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
        <div className="space-y-4 text-sm text-ink-2">
          <p>
            {locale === 'ta'
              ? 'உங்கள் தற்போதைய எக்செல் கோப்பை கீழ்க்கண்ட நெடுவரிசைகளுடன் CSV ஆக சேமித்து பதிவேற்றவும். முதல் வரி தலைப்பாக இருக்க வேண்டும்.'
              : 'Save your existing Excel sheet as CSV with these columns and upload it. The first row must be the header.'}
          </p>

          <div className="thin-scroll overflow-x-auto rounded border border-line bg-surface-2 p-3">
            <code className="whitespace-pre font-mono text-2xs leading-relaxed text-ink-2">
              {`admission_no,name,name_tamil,class,section,roll_no,gender,dob,
father_name,mother_name,guardian_phone,address,blood_group

TN260001,Aravind M,அரவிந்த் மு,8,A,1,M,2012-04-11,
Murugan S,Kalpana M,9843012345,"12, Gandhipuram, Coimbatore",O+`}
            </code>
          </div>

          <div className="rounded border border-clay/30 bg-clay-dim p-3 text-xs">
            <strong className="text-ink">
              {locale === 'ta' ? 'குறிப்பு:' : 'Note:'}
            </strong>{' '}
            {locale === 'ta'
              ? 'செயல்விளக்க முறையில் இறக்குமதி முடக்கப்பட்டுள்ளது. Supabase இணைக்கப்பட்ட பிறகு இது இயங்கும் — பள்ளியின் முழுத் தரவையும் ஒரே முறையில் ஏற்றலாம்.'
              : 'Import is disabled in demo mode. It activates once Supabase is connected — then a full school roll can be loaded in one pass.'}
          </div>

          <Button variant="outline" onClick={exportCsv} className="w-full">
            <Download size={15} />
            {locale === 'ta' ? 'மாதிரி வடிவத்தைப் பதிவிறக்கு' : 'Download a sample in this format'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
