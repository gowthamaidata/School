'use client'

import { useEffect, useMemo, useState } from 'react'
import { BellRing, IndianRupee, Printer, Search, Wallet } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { repo, CURRENT_TERM, SCHOOL } from '@/lib/data/repository'
import type { ClassSection, FeeRecord, Student } from '@/lib/data/types'
import { formatDate, formatINR, formatNumber } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, Empty, Field, Input, Modal, PageHeader,
  Progress, Select, Skeleton, Stat, Table, Td, Th, Toast,
} from '@/components/ui'

type Row = { record: FeeRecord; student: Student; section: ClassSection }

const STATUS_TONE = {
  paid: 'forest',
  partial: 'clay',
  pending: 'neutral',
  overdue: 'danger',
} as const

export default function FeesPage() {
  const { t, locale } = usePrefs()

  const [rows, setRows] = useState<Row[]>([])
  const [sections, setSections] = useState<ClassSection[]>([])
  const [loading, setLoading] = useState(true)
  const [term, setTerm] = useState(CURRENT_TERM)
  const [status, setStatus] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [sectionId, setSectionId] = useState('')
  const [query, setQuery] = useState('')

  const [payRow, setPayRow] = useState<Row | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('UPI')
  const [receipt, setReceipt] = useState<Row | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    repo.getSections().then(setSections)
  }, [])

  const load = useMemo(
    () => async () => {
      setLoading(true)
      const data = await repo.getFeeRecords({
        term,
        status: status === 'all' ? undefined : status === 'unpaid' ? 'unpaid' : 'paid',
        sectionId: sectionId || undefined,
        query: query || undefined,
      })
      setRows(data)
      setLoading(false)
    },
    [term, status, sectionId, query],
  )

  useEffect(() => {
    const id = setTimeout(load, query ? 250 : 0)
    return () => clearTimeout(id)
  }, [load, query])

  const totals = useMemo(() => {
    const due = rows.reduce((s, r) => s + r.record.amount_due, 0)
    const paid = rows.reduce((s, r) => s + r.record.amount_paid, 0)
    const unpaidCount = rows.filter((r) => r.record.status !== 'paid').length
    return { due, paid, outstanding: due - paid, unpaidCount }
  }, [rows])

  async function submitPayment() {
    if (!payRow) return
    const amount = Number(payAmount)
    if (!amount || amount <= 0) {
      setToast(locale === 'ta' ? 'செல்லுபடியாகும் தொகையை உள்ளிடவும்.' : 'Enter a valid payment amount.')
      return
    }
    setBusy(true)
    await repo.recordPayment({ feeId: payRow.record.id, amount, method: payMethod })
    setBusy(false)
    setPayRow(null)
    setPayAmount('')
    setToast(
      `${t('common.saved')} · ${formatINR(amount)} — ${
        locale === 'ta' ? payRow.student.name_ta : payRow.student.name
      }`,
    )
    await load()
  }

  async function remindAll() {
    setBusy(true)
    const n = await repo.sendFeeReminders(term)
    setBusy(false)
    setToast(t('fee.remindersSent', { n }))
  }

  return (
    <>
      <PageHeader
        eyebrow={`${t('fee.term')} ${term} · ${SCHOOL.academic_year}`}
        title={t('fee.title')}
        description={
          locale === 'ta'
            ? 'கட்டண நிலையைப் பார்க்கவும், பணத்தைப் பதிவு செய்யவும், நிலுவையுள்ள குடும்பங்களுக்கு ஒரே தட்டலில் நினைவூட்டவும்.'
            : 'See who has paid, record a payment, and remind every pending family in one tap.'
        }
        action={
          <Button onClick={remindAll} disabled={busy || totals.unpaidCount === 0}>
            <BellRing size={15} />
            {busy ? t('common.saving') : t('fee.remindPending')}
          </Button>
        }
      />

      {/* ── Summary ─────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={t('dash.feeCollected')}
          value={formatINR(totals.paid, { compact: true })}
          tone="forest"
          icon={<Wallet size={16} />}
          sub={
            <>
              <span className="tabular">
                {totals.due ? Math.round((totals.paid / totals.due) * 100) : 0}%{' '}
                {t('fee.collectionRate').toLowerCase()}
              </span>
              <Progress
                value={totals.due ? (totals.paid / totals.due) * 100 : 0}
                className="mt-1.5"
              />
            </>
          }
        />
        <Stat
          label={t('fee.outstanding')}
          value={formatINR(totals.outstanding, { compact: true })}
          tone="danger"
          icon={<IndianRupee size={16} />}
          sub={`${totals.unpaidCount} ${locale === 'ta' ? 'குடும்பங்கள்' : 'families pending'}`}
        />
        <Stat
          label={locale === 'ta' ? 'மொத்தத் தேவை' : 'Total billed'}
          value={formatINR(totals.due, { compact: true })}
          tone="info"
          sub={`${formatNumber(rows.length)} ${locale === 'ta' ? 'பதிவுகள்' : 'records'}`}
        />
        <Stat
          label={t('fee.dueDate')}
          value={rows[0] ? formatDate(rows[0].record.due_date) : '—'}
          tone="clay"
          sub={`${t('fee.term')} ${term}`}
        />
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <Card className="mt-4">
        <div className="grid gap-2.5 p-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
                locale === 'ta' ? 'பெயர் / சேர்க்கை எண் / தொலைபேசி' : 'Name, admission no. or phone'
              }
              className="pl-9"
            />
          </div>
          <Select value={term} onChange={(e) => setTerm(Number(e.target.value))} aria-label={t('fee.term')}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {t('fee.term')} {n}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label={t('common.status')}>
            <option value="all">{t('common.all')}</option>
            <option value="unpaid">{t('fee.pending')}</option>
            <option value="paid">{t('fee.paid')}</option>
          </Select>
          <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)} aria-label={t('att.selectClass')}>
            <option value="">{t('common.all')} — {t('common.class')}</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {t('common.class')} {s.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* ── Table ───────────────────────────────────────── */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader
          title={`${t('fee.term')} ${term}`}
          hint={`${rows.length} ${locale === 'ta' ? 'பதிவுகள்' : 'records'}`}
        />
        {loading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Empty title={t('common.noResults')} icon={<Search size={22} />} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t('common.name')}</Th>
                <Th>{t('common.class')}</Th>
                <Th align="right">{t('common.amount')}</Th>
                <Th align="right">{t('fee.paid')}</Th>
                <Th>{t('common.status')}</Th>
                <Th align="right">{t('common.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 200).map((r) => (
                <tr key={r.record.id} className="hover:bg-surface-2">
                  <Td>
                    <div className="font-medium text-ink">
                      {locale === 'ta' ? r.student.name_ta : r.student.name}
                    </div>
                    <div className="font-mono text-2xs text-ink-3">
                      {r.student.admission_no} · {r.student.guardian_phone}
                    </div>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs">{r.section.label}</span>
                  </Td>
                  <Td align="right" className="tabular">
                    {formatINR(r.record.amount_due)}
                  </Td>
                  <Td align="right" className="tabular">
                    {r.record.amount_paid > 0 ? (
                      <span className="font-medium text-forest">
                        {formatINR(r.record.amount_paid)}
                      </span>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[r.record.status]}>{t(`fee.${r.record.status}`)}</Badge>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1.5">
                      {r.record.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPayRow(r)
                            setPayAmount(String(r.record.amount_due - r.record.amount_paid))
                          }}
                        >
                          {t('fee.collectPayment')}
                        </Button>
                      )}
                      {r.record.amount_paid > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => setReceipt(r)} aria-label={t('fee.receipt')}>
                          <Printer size={14} />
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {rows.length > 200 && (
          <div className="border-t border-line px-4 py-2.5 text-center text-xs text-ink-3">
            {locale === 'ta'
              ? `முதல் 200 காட்டப்படுகிறது (மொத்தம் ${rows.length}). வடிகட்டி பயன்படுத்தவும்.`
              : `Showing first 200 of ${rows.length}. Use filters to narrow down.`}
          </div>
        )}
      </Card>

      {/* ── Record payment ──────────────────────────────── */}
      <Modal
        open={Boolean(payRow)}
        onClose={() => setPayRow(null)}
        title={t('fee.collectPayment')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayRow(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitPayment} disabled={busy}>
              {busy ? t('common.saving') : t('common.save')}
            </Button>
          </>
        }
      >
        {payRow && (
          <div className="space-y-3.5">
            <div className="rounded border border-line bg-surface-2 p-3">
              <div className="font-semibold text-ink">
                {locale === 'ta' ? payRow.student.name_ta : payRow.student.name}
              </div>
              <div className="font-mono text-2xs text-ink-3">
                {payRow.student.admission_no} · {t('common.class')} {payRow.section.label}
              </div>
              <div className="tabular mt-2 flex justify-between text-sm">
                <span className="text-ink-2">{t('fee.outstanding')}</span>
                <span className="font-bold text-danger">
                  {formatINR(payRow.record.amount_due - payRow.record.amount_paid)}
                </span>
              </div>
            </div>

            <Field label={t('common.amount')}>
              <Input
                type="number"
                inputMode="numeric"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </Field>

            <Field label={locale === 'ta' ? 'செலுத்தும் முறை' : 'Payment method'}>
              <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option>UPI</option>
                <option>Cash</option>
                <option>Bank transfer</option>
                <option>Cheque</option>
                <option>Card</option>
              </Select>
            </Field>
          </div>
        )}
      </Modal>

      {/* ── Printable receipt ───────────────────────────── */}
      <Modal
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title={t('fee.receipt')}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setReceipt(null)}>
              {t('common.close')}
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={15} />
              {t('common.print')}
            </Button>
          </>
        }
      >
        {receipt && (
          <div className="print-area border border-line p-5 text-ink">
            <div className="border-b border-line pb-3 text-center">
              <div className="font-serif text-lg font-bold">{SCHOOL.name}</div>
              <div className="text-xs text-ink-2">{SCHOOL.address}</div>
              <div className="font-mono text-2xs text-ink-3">
                {SCHOOL.phone} · UDISE {SCHOOL.udise_code}
              </div>
            </div>

            <div className="py-3 text-center font-mono text-xs uppercase tracking-widest">
              Fee Receipt
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                [t('fee.receipt'), receipt.record.receipt_no ?? '—'],
                [t('common.date'), receipt.record.paid_on ? formatDate(receipt.record.paid_on) : '—'],
                [t('common.name'), receipt.student.name],
                [t('stu.admissionNo'), receipt.student.admission_no],
                [t('common.class'), receipt.section.label],
                [t('stu.father'), receipt.student.father_name],
                [t('fee.term'), `${t('fee.term')} ${receipt.record.term}`],
                [locale === 'ta' ? 'முறை' : 'Method', receipt.record.method ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line py-1">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 space-y-1.5 text-sm">
              <div className="tabular flex justify-between">
                <span className="text-ink-2">{t('common.total')}</span>
                <span>{formatINR(receipt.record.amount_due)}</span>
              </div>
              <div className="tabular flex justify-between border-t border-line pt-1.5 text-base font-bold">
                <span>{t('fee.paid')}</span>
                <span className="text-forest">{formatINR(receipt.record.amount_paid)}</span>
              </div>
              {receipt.record.amount_paid < receipt.record.amount_due && (
                <div className="tabular flex justify-between text-danger">
                  <span>{t('fee.outstanding')}</span>
                  <span>
                    {formatINR(receipt.record.amount_due - receipt.record.amount_paid)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between text-2xs text-ink-3">
              <span>
                {locale === 'ta'
                  ? 'கணினியால் உருவாக்கப்பட்ட ரசீது'
                  : 'Computer-generated receipt'}
              </span>
              <span className="border-t border-line pt-1">
                {locale === 'ta' ? 'அலுவலகக் கையொப்பம்' : 'Office signature'}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
