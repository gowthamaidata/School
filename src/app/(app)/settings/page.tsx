'use client'

import { useEffect, useState } from 'react'
import { Check, Database, Download, Languages, Moon, School, Smartphone, Sun } from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession } from '@/lib/auth/session'
import { DATA_MODE, IS_DEMO, SCHOOL } from '@/lib/data/repository'
import { LOCALES } from '@/lib/i18n/dictionary'
import { Badge, Button, Card, CardHeader, PageHeader } from '@/components/ui'

/** Minimal shape of the beforeinstallprompt event (not in lib.dom yet). */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function SettingsPage() {
  const { t, locale, setLocale, theme, setTheme } = usePrefs()
  const { user } = useSession()

  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as InstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setInstallEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function install() {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallEvent(null)
  }

  const schoolRows: [string, string][] = [
    [t('common.name'), locale === 'ta' ? SCHOOL.name_ta : SCHOOL.name],
    [locale === 'ta' ? 'வாரியம்' : 'Board', 'Matriculation'],
    [locale === 'ta' ? 'முகவரி' : 'Address', SCHOOL.address],
    [t('common.phone'), SCHOOL.phone],
    ['UDISE', SCHOOL.udise_code],
    [t('rc.academicYear'), SCHOOL.academic_year],
  ]

  return (
    <>
      <PageHeader
        eyebrow={user?.designation}
        title={t('set.title')}
        description={
          locale === 'ta'
            ? 'மொழி, தோற்றம், செயலி நிறுவல் மற்றும் பள்ளி விவரங்கள்.'
            : 'Language, appearance, app installation and school details.'
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Language ────────────────────────────────── */}
        <Card>
          <CardHeader
            title={t('set.language')}
            hint={
              locale === 'ta'
                ? 'ஆசிரியர்கள் விரும்பும் மொழியில் செயலியைப் பயன்படுத்தலாம்'
                : 'Each user can run the app in the language they prefer'
            }
            action={<Languages size={16} className="text-ink-3" aria-hidden />}
          />
          <div className="grid grid-cols-2 gap-2 p-3.5">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={`flex items-center justify-between rounded-md border px-3.5 py-3 text-left ring-focus transition-all duration-200 ease-soft ${
                  locale === l.code
                    ? 'border-forest/40 bg-forest-dim shadow-card'
                    : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2'
                }`}
                aria-pressed={locale === l.code}
              >
                <div>
                  <div className="text-sm font-semibold text-ink">{l.native}</div>
                  <div className="font-mono text-2xs uppercase tracking-wider text-ink-3">{l.code}</div>
                </div>
                {locale === l.code && <Check size={16} className="text-forest" aria-hidden />}
              </button>
            ))}
          </div>
        </Card>

        {/* ── Appearance ──────────────────────────────── */}
        <Card>
          <CardHeader
            title={t('set.theme')}
            hint={
              locale === 'ta'
                ? 'இரவு நேரப் பயன்பாட்டிற்கு இருள் தோற்றம்'
                : 'Dark mode is easier on the eyes for evening work'
            }
            action={
              theme === 'dark' ? (
                <Moon size={16} className="text-ink-3" aria-hidden />
              ) : (
                <Sun size={16} className="text-ink-3" aria-hidden />
              )
            }
          />
          <div className="grid grid-cols-2 gap-2 p-3.5">
            {(['light', 'dark'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                className={`flex items-center justify-between rounded-md border px-3.5 py-3 text-left ring-focus transition-all duration-200 ease-soft ${
                  theme === mode
                    ? 'border-forest/40 bg-forest-dim shadow-card'
                    : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2'
                }`}
                aria-pressed={theme === mode}
              >
                <div className="flex items-center gap-2">
                  {mode === 'light' ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
                  <span className="text-sm font-semibold text-ink">
                    {mode === 'light' ? t('set.themeLight') : t('set.themeDark')}
                  </span>
                </div>
                {theme === mode && <Check size={16} className="text-forest" aria-hidden />}
              </button>
            ))}
          </div>
        </Card>

        {/* ── Install ─────────────────────────────────── */}
        <Card>
          <CardHeader
            title={t('set.installApp')}
            hint={t('set.installHelp')}
            action={<Smartphone size={16} className="text-ink-3" aria-hidden />}
          />
          <div className="p-3.5">
            {installed ? (
              <div className="flex items-center gap-2 rounded-md border border-leaf/25 bg-leaf-dim px-3.5 py-3 text-sm font-medium text-leaf">
                <Check size={16} aria-hidden />
                {locale === 'ta' ? 'செயலி நிறுவப்பட்டுள்ளது' : 'App is installed on this device'}
              </div>
            ) : installEvent ? (
              <Button onClick={install} className="w-full">
                <Download size={15} aria-hidden />
                {t('set.installApp')}
              </Button>
            ) : (
              <div className="space-y-2 text-xs leading-relaxed text-ink-2">
                <p className="font-medium text-ink">
                  {locale === 'ta' ? 'கைமுறையாக நிறுவ:' : 'To install manually:'}
                </p>
                <p>
                  <strong>Android (Chrome):</strong>{' '}
                  {locale === 'ta'
                    ? 'மேல் வலது ⋮ மெனு → "Add to Home screen"'
                    : 'tap the ⋮ menu → “Add to Home screen”'}
                </p>
                <p>
                  <strong>iPhone (Safari):</strong>{' '}
                  {locale === 'ta'
                    ? 'பகிர் பொத்தான் → "Add to Home Screen"'
                    : 'tap Share → “Add to Home Screen”'}
                </p>
                <p>
                  <strong>{locale === 'ta' ? 'கணினி' : 'Desktop'}:</strong>{' '}
                  {locale === 'ta'
                    ? 'முகவரிப் பட்டியில் நிறுவல் ⊕ சின்னத்தை அழுத்தவும்'
                    : 'click the install ⊕ icon in the address bar'}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ── Data source ─────────────────────────────── */}
        <Card>
          <CardHeader
            title={t('set.dataMode')}
            action={<Database size={16} className="text-ink-3" aria-hidden />}
          />
          <div className="space-y-3 p-3.5">
            <div className="well flex items-center justify-between px-3.5 py-3">
              <span className="text-sm text-ink-2">
                {locale === 'ta' ? 'தற்போதைய முறை' : 'Current mode'}
              </span>
              <Badge tone={IS_DEMO ? 'clay' : 'leaf'} dot>
                {DATA_MODE}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-ink-2">
              {IS_DEMO
                ? locale === 'ta'
                  ? 'செயலி உள்ளமைந்த மாதிரித் தரவில் இயங்குகிறது — இணையம் இல்லாமலும் செயல்விளக்கம் காட்டலாம். உண்மைப் பள்ளிக்கு NEXT_PUBLIC_DATA_MODE=supabase என மாற்றி, supabase/schema.sql-ஐ இயக்கவும்.'
                  : 'Running on built-in sample data, so a demo works with no internet and no database. For a real school, set NEXT_PUBLIC_DATA_MODE=supabase and run supabase/schema.sql.'
                : locale === 'ta'
                  ? 'Supabase-உடன் இணைக்கப்பட்டுள்ளது. ஒவ்வொரு அட்டவணையிலும் school_id அடிப்படையில் Row-Level Security செயல்படுகிறது.'
                  : 'Connected to Supabase. Row-Level Security is enforced on every table using school_id.'}
            </p>
          </div>
        </Card>

        {/* ── School profile ──────────────────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={t('set.schoolProfile')}
            action={<School size={16} className="text-ink-3" aria-hidden />}
          />
          <dl className="divide-y divide-line">
            {schoolRows.map(([k, v]) => (
              <div key={k} className="flex gap-4 px-4 py-3 text-sm sm:px-5">
                <dt className="w-40 shrink-0 text-ink-3">{k}</dt>
                <dd className="min-w-0 flex-1 font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  )
}
