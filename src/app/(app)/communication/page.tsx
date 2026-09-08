'use client'

import { useEffect, useState } from 'react'
import { Check, Megaphone, Send, Smartphone } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession } from '@/lib/auth/session'
import { repo, staffById } from '@/lib/data/repository'
import type { Announcement, MessageChannel } from '@/lib/data/types'
import { formatDate } from '@/lib/utils'
import {
  Badge, Button, Card, CardHeader, Field, Input, PageHeader, Progress,
  Select, Skeleton, Textarea, Toast,
} from '@/components/ui'

const CHANNELS: { id: MessageChannel; labelKey: 'msg.channelPortal' | 'msg.channelWhatsapp' | 'msg.channelSms' }[] = [
  { id: 'portal', labelKey: 'msg.channelPortal' },
  { id: 'whatsapp', labelKey: 'msg.channelWhatsapp' },
  { id: 'sms', labelKey: 'msg.channelSms' },
]

export default function CommunicationPage() {
  const { t, locale } = usePrefs()
  const { user } = useSession()

  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [standard, setStandard] = useState<string>('')
  const [recipientCount, setRecipientCount] = useState(0)
  const [channels, setChannels] = useState<MessageChannel[]>(['portal', 'whatsapp'])
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    repo.getAnnouncements().then((a) => {
      setItems(a)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    let alive = true
    repo.getStudents(standard ? { standard: Number(standard) } : undefined).then((students) => {
      if (!alive) return
      setRecipientCount(students.length)
    })
    return () => {
      alive = false
    }
  }, [standard])

  function toggleChannel(c: MessageChannel) {
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    )
  }

  async function send() {
    if (!title.trim() || !body.trim() || !user) return
    setSending(true)
    await repo.sendAnnouncement({
      title: title.trim(),
      body: body.trim(),
      standard: standard ? Number(standard) : null,
      channels,
      sentBy: user.id,
    })
    setSending(false)
    setTitle('')
    setBody('')
    setToast(`${t('msg.sent')} · ${recipientCount} ${t('msg.recipients')}`)
    setItems(await repo.getAnnouncements())
  }

  const canSend = title.trim().length > 2 && body.trim().length > 5 && channels.length > 0

  return (
    <>
      <PageHeader
        eyebrow={`${items.length} ${locale === 'ta' ? 'அறிவிப்புகள்' : 'announcements'}`}
        title={t('msg.title')}
        description={
          locale === 'ta'
            ? 'ஒரே இடத்திலிருந்து பள்ளி முழுவதற்கும் அல்லது ஒரு வகுப்புக்கும் செய்தி அனுப்பவும் — செயலி மற்றும் வாட்ஸ்அப்பில்.'
            : 'One place for every school message — reaching parents in the app and on WhatsApp, with delivery tracking.'
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_1fr]">
        {/* ── Composer ────────────────────────────────── */}
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader title={t('msg.compose')} hint={t('msg.whatsappNote')} />
          <div className="space-y-3.5 p-4">
            <Field label={t('msg.subjectLine')}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  locale === 'ta'
                    ? 'எ.கா. அரையாண்டுத் தேர்வு அட்டவணை'
                    : 'e.g. Half-Yearly examination timetable'
                }
              />
            </Field>

            <Field label={t('msg.body')} hint={`${body.length} / 1000`}>
              <Textarea
                rows={6}
                maxLength={1000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  locale === 'ta'
                    ? 'பெற்றோருக்கான செய்தியை இங்கே எழுதுங்கள்…'
                    : 'Write the message parents will receive…'
                }
              />
            </Field>

            <Field label={t('msg.audience')}>
              <Select value={standard} onChange={(e) => setStandard(e.target.value)}>
                <option value="">{t('msg.allParents')}</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {t('common.class')} {n}
                  </option>
                ))}
              </Select>
            </Field>

            <div>
              <span className="label mb-1.5 block">
                {locale === 'ta' ? 'அனுப்பும் வழி' : 'Channels'}
              </span>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => {
                  const on = channels.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleChannel(c.id)}
                      aria-pressed={on}
                      className={`flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold ring-focus transition-all duration-200 ease-soft ${
                        on
                          ? 'border-forest/40 bg-forest-dim text-forest-2'
                          : 'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink'
                      }`}
                    >
                      {on ? <Check size={13} aria-hidden /> : <Smartphone size={13} aria-hidden />}
                      {t(c.labelKey)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="well flex items-center justify-between px-3.5 py-3">
              <span className="text-xs text-ink-2">{t('msg.recipients')}</span>
              <span className="tabular font-display text-xl font-semibold text-ink">
                {recipientCount}
              </span>
            </div>

            <Button onClick={send} disabled={!canSend} loading={sending} className="w-full">
              <Send size={15} aria-hidden />
              {t('common.send')}
            </Button>
          </div>
        </Card>

        {/* ── Sent history ────────────────────────────── */}
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
            : items.map((a) => {
                const readPct = a.recipients ? (a.read / a.recipients) * 100 : 0
                const sender = staffById(a.sent_by)
                return (
                  <Card key={a.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-lavender/35 text-forest-2"
                        aria-hidden
                      >
                        <Megaphone size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-ink">{a.title}</h3>
                          {a.standard && (
                            <Badge tone="info">
                              {t('common.class')} {a.standard}
                            </Badge>
                          )}
                          {a.channels.map((c) => (
                            <Badge key={c} tone={c === 'whatsapp' ? 'leaf' : 'neutral'}>
                              {c === 'whatsapp' ? 'WhatsApp' : c === 'sms' ? 'SMS' : 'App'}
                            </Badge>
                          ))}
                        </div>

                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{a.body}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs text-ink-3">
                          <span>{formatDate(a.sent_at, 'long')}</span>
                          {sender && <span>{sender.name}</span>}
                          <span className="tabular">
                            {a.recipients} {t('msg.recipients')}
                          </span>
                          <span className="tabular text-leaf-ink">
                            {a.delivered} {t('msg.delivered')}
                          </span>
                        </div>

                        {/* Read-through is the number that tells you whether the
                            message actually landed, so it gets the bar. */}
                        <div className="mt-2.5 flex items-center gap-2.5">
                          <Progress
                            value={readPct}
                            tone={readPct >= 60 ? 'leaf' : 'clay'}
                            size="sm"
                            className="flex-1"
                            label={`${a.title} — ${t('msg.read')}`}
                          />
                          <span className="tabular text-2xs font-semibold text-ink-2">
                            {Math.round(readPct)}% {t('msg.read')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )
}
