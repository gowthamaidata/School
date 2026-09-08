'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BellRing, IndianRupee, Printer, Receipt, Wallet } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { repo, CURRENT_TERM, SCHOOL } from '@/lib/data/repository'
import type { ClassSection, FeeRecord, Student } from '@/lib/data/types'
import { cn, formatDate, formatINR, formatNumber } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, Empty, Field, Input, Modal, PageHeader, Pagination,
  Progress, SearchInput, Segmented, Select, Skeleton, Stat, Table, Td, Th, Toast, type Tone,
} from '@/components/ui'

type Row = { record: FeeRecord; student: Student; section: ClassSection }

const STATUS_TONE: Record<FeeRecord['status'], Tone> = {
  paid: 'leaf',
  partial: 'clay',
  pending: 'neutral',
  overdue: 'danger',
}

const PAGE_SIZE = 30

export default function FeesPage() {
  const { t, locale } = usePrefs()

  const [rows, setRows] = useState<Row[]>([])
  const [sections, setSections] = useState<ClassSection[]>([])
  const [loading, setLoading] = useState(true)
  const [term, setTerm] = useState(CURRENT_TERM)
  const [status, setStatus] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [sectionId, setSectionId] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const [payRow, setPayRow] = useState<Row | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payError, setPayError] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState('UPI')
  const [receipt, setReceipt] = useState<Row | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone?: Tone } | null>(null)

  useEffect(() => {
    repo.getSections().then(setSections)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const data = await repo.getFeeRecords({
      term,
      status: status === 'all' ? undefined : status === 'unpaid' ? 'unpaid' : 'paid',
      sectionId: sectionId || undefined,
      query: query || undefined,
    })
    setRows(data)
    setPage(0)
    setLoading(false)
  }, [term, status, sectionId, query])

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

  const pageRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [rows, page],
  )

  const filtered = Boolean(query || sectionId || status !== 'all')

  function openPayment(r: Row) {
    setPayRow(r)
    setPayError(null)
    setPayAmount(String(r.record.amount_due - r.record.amount_paid))
  }

  async function submitPayment() {
    if (!payRow) return
    const amount = Number(payAmount)
    const outstanding = payRow.record.amount_due - payRow.record.amount_paid
    if (!amount || amount <= 0) {
      setPayError(
        locale === 'ta' ? 'செல்லுபடியாகும் தொகையை உள்ளிடவும்.' : 'Enter a valid payment amount.',
      )
      return
    }
    if (amount > outstanding) {
      setPayError(
        locale === 'ta'
          ? `நிலுவைத் தொகையை (${formatINR(outstanding)}) விட அதிகமாக இருக்கக் கூடாது.`
          : `Cannot exceed the outstanding balance of ${formatINR(outstanding)}.`,
      )
      return
    }
    setBusy(true)
    try {
      await repo.recordPayment({ feeId: payRow.record.id, amount, method: payMethod })
      const name = locale === 'ta' ? payRow.student.name_ta : payRow.student.name
      setPayRow(null)
      setPayAmount('')
      setToast({ msg: `${t('common.saved')} · ${formatINR(amount)} — ${name}` })
      await load()
    } catch (err) {
      console.error('[fees] payment failed', err)
      setToast({ msg: t('common.error'), tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  async function remindAll() {
    setBusy(true)
    try {
      const n = await repo.sendFeeReminders(term)
      setToast({ msg: t('fee.remindersSent', { n }) })
    } finally {
      setBusy(false)
    }
  }

  /* One row's money story, reused by the table and the mobile cards. */
  function paidRatio(r: Row) {
    return r.record.amount_due ? (r.record.amount_paid / r.record.amount_due) * 100 : 0
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
          <Button onClick={remindAll} loading={busy} disabled={totals.unpaidCount === 0}>
            <BellRing size={15} aria-hidden />
            {t('fee.remindPending')}
          </Button>
        }
      />

      {/* ── Summary ─────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label={t('dash.feeCollected')}
          value={formatINR(totals.paid, { compact: true })}
          tone="leaf"
          icon={<Wallet size={17} />}
          sub={
            <>
              <span className="tabular">
                {totals.due ? Math.round((totals.paid / totals.due) * 100) : 0}%{' '}
                {t('fee.collectionRate').toLowerCase()}
              </span>
              <Progress
                value={totals.due ? (totals.paid / totals.due) * 100 : 0}
                tone="leaf"
                className="mt-2"
                label={t('fee.collectionRate')}
              />
            </>
          }
        />
        <Stat
          label={t('fee.outstanding')}
          value={formatINR(totals.outstanding, { compact: true })}
          tone="danger"
          icon={<IndianRupee size={17} />}
          sub={`${formatNumber(totals.unpaidCount)} ${t('common.families')}`}
        />
        <Stat
          label={locale === 'ta' ? 'மொத்தத் தேவை' : 'Total billed'}
          value={formatINR(totals.due, { compact: true })}
          tone="info"
          icon={<Receipt size={17} />}
          sub={`${formatNumber(rows.length)} ${t('common.records')}`}
        />
        <Stat
          label={t('fee.dueDate')}
          value={rows[0] ? formatDate(rows[0].record.due_date) : '—'}
          tone="clay"
          sub={`${t('fee.term')} ${term}`}
        />
      </div>

      {/* ── Filters: the two that get used constantly are visible controls,
             the rarer ones stay as selects. ───────────────── */}
      <Card className="mt-4">
        <div className="flex flex-col gap-3 p-3.5 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            label={t('common.search')}
            placeholder={
              locale === 'ta' ? 'பெயர் / சேர்க்கை எண் / தொலைபேசி' : 'Name, admission no. or phone'
            }
            className="min-w-0 flex-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label={t('common.status')}
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'unpaid', label: t('fee.pending') },
                { value: 'paid', label: t('fee.paid') },
              ]}
            />
            <Select
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              aria-label={t('fee.term')}
              className="w-32"
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {t('fee.term')} {n}
                </option>
              ))}
            </Select>
            <Select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              aria-label={t('att.selectClass')}
              className="w-40"
            >
              <option value="">
                {t('common.all')} — {t('common.class')}
              </option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {t('common.class')} {s.label}
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
                  setStatus('all')
                }}
              >
                {t('common.clearFilters')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Records ─────────────────────────────────────── */}
      <Card className="mt-4 overflow-hidden">
        <CardHeader
          icon={<Wallet size={15} />}
          title={`${t('fee.term')} ${term}`}
          hint={`${rows.length} ${t('common.records')}`}
        />
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Empty
            title={t('common.noResults')}
            hint={
              locale === 'ta'
                ? 'வடிகட்டியை மாற்றி அல்லது நீக்கிப் பாருங்கள்.'
                : 'Try a different search, or clear the filters.'
            }
            icon={<Receipt size={26} />}
            action={
              filtered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    setSectionId('')
                    setStatus('all')
                  }}
                >
                  {t('common.clearFilters')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Mobile: one card per family, money first. */}
            <ul className="divide-y divide-line lg:hidden">
              {pageRows.map((r) => (
                <li key={r.record.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">
                        {locale === 'ta' ? r.student.name_ta : r.student.name}
                      </div>
                      <div className="truncate text-2xs text-ink-3">
                        {t('common.class')} {r.section.label} ·{' '}
                        <span className="font-mono">{r.student.admission_no}</span>
                      </div>
                    </div>
                    <Badge tone={STATUS_TONE[r.record.status]} dot>
                      {t(`fee.${r.record.status}`)}
                    </Badge>
                  </div>
                  <div className="tabular mt-2.5 flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-ink">
                      {formatINR(r.record.amount_paid)}
                      <span className="text-ink-3"> / {formatINR(r.record.amount_due)}</span>
                    </span>
                    {r.record.amount_paid < r.record.amount_due && (
                      <span className="text-xs font-semibold text-danger">
                        {formatINR(r.record.amount_due - r.record.amount_paid)}{' '}
                        {t('fee.outstanding').toLowerCase()}
                      </span>
                    )}
                  </div>
                  <Progress
                    value={paidRatio(r)}
                    tone={r.record.status === 'paid' ? 'leaf' : 'clay'}
                    size="sm"
                    className="mt-2"
                    label={`${r.student.name} ${t('fee.paid')}`}
                  />
                  <div className="mt-3 flex gap-2">
                    {r.record.status !== 'paid' && (
                      <Button size="sm" variant="outline" onClick={() => openPayment(r)}>
                        {t('fee.collectPayment')}
                      </Button>
                    )}
                    {r.record.amount_paid > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => setReceipt(r)}>
                        <Printer size={14} aria-hidden />
                        {t('fee.receipt')}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden lg:block">
              <Table caption={t('fee.title')}>
                <thead>
                  <tr>
                    <Th>{t('common.name')}</Th>
                    <Th>{t('common.class')}</Th>
                    <Th>{t('fee.paid')}</Th>
                    <Th align="right">{t('common.amount')}</Th>
                    <Th>{t('common.status')}</Th>
                    <Th align="right">{t('common.actions')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.record.id} className="transition-colors hover:bg-surface-2/70">
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
                      {/* Paid-vs-due as a bar: the ratio is the thing people
                          are actually scanning for, and two currency columns
                          made them do the arithmetic themselves. */}
                      <Td className="w-56">
                        <div className="tabular flex items-baseline justify-between text-xs">
                          <span
                            className={cn(
                              'font-semibold',
                              r.record.amount_paid > 0 ? 'text-ink' : 'text-ink-3',
                            )}
                          >
                            {r.record.amount_paid > 0 ? formatINR(r.record.amount_paid) : '—'}
                          </span>
                          {r.record.amount_paid < r.record.amount_due && (
                            <span className="text-danger">
                              −{formatINR(r.record.amount_due - r.record.amount_paid)}
                            </span>
                          )}
                        </div>
                        {/* Only part-paid rows get a bar. A full green bar on
                            every settled row is ink that says nothing the
                            status pill has not already said. */}
                        {r.record.status !== 'paid' && (
                          <Progress
                            value={paidRatio(r)}
                            tone="clay"
                            size="sm"
                            className="mt-1.5"
                            label={`${r.student.name} ${t('fee.paid')}`}
                          />
                        )}
                      </Td>
                      <Td align="right" className="tabular font-medium text-ink">
                        {formatINR(r.record.amount_due)}
                      </Td>
                      <Td>
                        <Badge tone={STATUS_TONE[r.record.status]} dot>
                          {t(`fee.${r.record.status}`)}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <div className="flex justify-end gap-1.5">
                          {r.record.status !== 'paid' && (
                            <Button size="sm" variant="outline" onClick={() => openPayment(r)}>
                              {t('fee.collectPayment')}
                            </Button>
                          )}
                          {r.record.amount_paid > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReceipt(r)}
                              aria-label={`${t('fee.receipt')} — ${r.student.name}`}
                            >
                              <Printer size={14} aria-hidden />
                            </Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={rows.length}
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

      {/* ── Record payment ──────────────────────────────── */}
      <Modal
        open={Boolean(payRow)}
        onClose={() => setPayRow(null)}
        title={t('fee.collectPayment')}
        description={payRow ? `${t('common.class')} ${payRow.section.label}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayRow(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitPayment} loading={busy}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        {payRow && (
          <div className="space-y-4">
            <div className="well p-3.5">
              <div className="font-semibold text-ink">
                {locale === 'ta' ? payRow.student.name_ta : payRow.student.name}
              </div>
              <div className="font-mono text-2xs text-ink-3">
                {payRow.student.admission_no} · {t('common.class')} {payRow.section.label}
              </div>
              <div className="tabular mt-3 flex items-baseline justify-between border-t border-line pt-2.5 text-sm">
                <span className="text-ink-2">{t('fee.outstanding')}</span>
                <span className="font-display text-lg font-semibold text-danger">
                  {formatINR(payRow.record.amount_due - payRow.record.amount_paid)}
                </span>
              </div>
            </div>

            <Field label={t('common.amount')} error={payError ?? undefined} htmlFor="pay-amount">
              <Input
                id="pay-amount"
                type="number"
                inputMode="numeric"
                min={1}
                max={payRow.record.amount_due - payRow.record.amount_paid}
                invalid={Boolean(payError)}
                value={payAmount}
                onChange={(e) => {
                  setPayAmount(e.target.value)
                  setPayError(null)
                }}
              />
            </Field>

            <Field label={locale === 'ta' ? 'செலுத்தும் முறை' : 'Payment method'} htmlFor="pay-method">
              <Select id="pay-method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
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
              <Printer size={15} aria-hidden />
              {t('common.print')}
            </Button>
          </>
        }
      >
        {receipt && (
          <div className="print-area rounded-md border border-line p-5 text-ink">
            <div className="border-b border-line pb-3 text-center">
              <div className="font-display text-lg font-bold">{SCHOOL.name}</div>
              <div className="text-xs text-ink-2">{SCHOOL.address}</div>
              <div className="font-mono text-2xs text-ink-3">
                {SCHOOL.phone} · UDISE {SCHOOL.udise_code}
              </div>
            </div>

            <div className="py-3 text-center font-mono text-xs uppercase tracking-[0.2em]">
              Fee Receipt
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
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
                <div key={k} className="flex justify-between gap-3 border-b border-line py-1.5">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 space-y-1.5 text-sm">
              <div className="tabular flex justify-between">
                <span className="text-ink-2">{t('common.total')}</span>
                <span>{formatINR(receipt.record.amount_due)}</span>
              </div>
              <div className="tabular flex justify-between border-t border-line pt-2 text-base font-bold">
                <span>{t('fee.paid')}</span>
                <span className="text-leaf">{formatINR(receipt.record.amount_paid)}</span>
              </div>
              {receipt.record.amount_paid < receipt.record.amount_due && (
                <div className="tabular flex justify-between text-danger">
                  <span>{t('fee.outstanding')}</span>
                  <span>{formatINR(receipt.record.amount_due - receipt.record.amount_paid)}</span>
                </div>
              )}
            </div>

            <div className="mt-10 flex justify-between text-2xs text-ink-3">
              <span>
                {locale === 'ta' ? 'கணினியால் உருவாக்கப்பட்ட ரசீது' : 'Computer-generated receipt'}
              </span>
              <span className="border-t border-line pt-1">
                {locale === 'ta' ? 'அலுவலகக் கையொப்பம்' : 'Office signature'}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast message={toast.msg} tone={toast.tone} onDismiss={() => setToast(null)} />
      )}
    </>
  )
}
