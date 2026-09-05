'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, CalendarCheck2, BadgeIndianRupee, MessageSquareText,
  FileText, ShieldCheck, Smartphone,
} from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession, useDemoUsers } from '@/lib/auth/session'
import { IS_DEMO, SCHOOL } from '@/lib/data/repository'
import { Avatar, Badge } from '@/components/ui'
import type { Role } from '@/lib/data/types'

const ROLE_KEY: Record<Role, Parameters<ReturnType<typeof usePrefs>['t']>[0]> = {
  principal: 'role.principal',
  correspondent: 'role.correspondent',
  admin: 'role.admin',
  teacher: 'role.teacher',
  parent: 'role.parent',
}

const ROLE_BLURB: Record<Role, { en: string; ta: string }> = {
  principal: {
    en: 'Whole-school view: attendance, fees, exam results',
    ta: 'முழுப் பள்ளி பார்வை: வருகை, கட்டணம், தேர்வு முடிவுகள்',
  },
  correspondent: {
    en: 'Management view with financial summary',
    ta: 'நிர்வாகப் பார்வை மற்றும் நிதிச் சுருக்கம்',
  },
  admin: {
    en: 'Fee collection, receipts and student records',
    ta: 'கட்டண வசூல், ரசீதுகள், மாணவர் பதிவுகள்',
  },
  teacher: {
    en: 'Mark attendance and enter marks for your class',
    ta: 'உங்கள் வகுப்பின் வருகை மற்றும் மதிப்பெண் பதிவு',
  },
  parent: {
    en: "See your child's attendance, fees and results",
    ta: 'உங்கள் குழந்தையின் வருகை, கட்டணம், முடிவுகள்',
  },
}

export default function SignInPage() {
  const { t, locale, setLocale } = usePrefs()
  const { user, signIn, loading } = useSession()
  const demoUsers = useDemoUsers()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace(user.role === 'parent' ? '/parent' : '/dashboard')
  }, [loading, user, router])

  const highlights = [
    { icon: CalendarCheck2, en: 'Attendance in 20 seconds', ta: '20 வினாடியில் வருகைப் பதிவு' },
    { icon: MessageSquareText, en: 'Parents updated on WhatsApp', ta: 'வாட்ஸ்அப்பில் பெற்றோருக்குத் தகவல்' },
    { icon: BadgeIndianRupee, en: 'Fee tracking and reminders', ta: 'கட்டணக் கண்காணிப்பு & நினைவூட்டல்' },
    { icon: FileText, en: 'Report cards in one click', ta: 'ஒரே கிளிக்கில் மதிப்பெண் அட்டை' },
    { icon: Smartphone, en: 'Works on any Android phone', ta: 'எந்த ஆண்ட்ராய்டு போனிலும் இயங்கும்' },
    { icon: ShieldCheck, en: 'DPDP-ready student data handling', ta: 'DPDP தரநிலைக்கு ஏற்ற தரவுப் பாதுகாப்பு' },
  ]

  return (
    <div className="relative z-10 min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Left: the pitch ───────────────────────────────── */}
      <section className="relative flex flex-col justify-between bg-forest px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded bg-white/12 font-serif text-base font-bold ring-1 ring-white/20">
              {SCHOOL.logo_text}
            </span>
            <div>
              <div className="font-serif text-xl font-bold leading-none">{t('app.name')}</div>
              <div className="mt-1 font-mono text-2xs uppercase tracking-[0.14em] text-white/55">
                Tamil Nadu · School OS
              </div>
            </div>
          </div>

          <h1 className="mt-10 max-w-lg font-serif text-3xl font-bold leading-[1.15] sm:text-[42px]">
            {locale === 'ta'
              ? 'தமிழ்நாட்டுப் பள்ளிகள் உண்மையில் இயங்கும் விதத்திற்காக உருவாக்கப்பட்டது'
              : 'Built for how Tamil Nadu schools actually work'}
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
            {locale === 'ta'
              ? 'ஆசிரியர்களுக்கு மொபைலில், பெற்றோருக்கு வாட்ஸ்அப்பில், தலைமையாசிரியருக்கு ஒரே திரையில் முழுப் பள்ளியும்.'
              : 'On mobile for teachers, on WhatsApp for parents, and the whole school on one screen for the principal.'}
          </p>

          <ul className="mt-9 grid max-w-lg gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {highlights.map(({ icon: Icon, en, ta }) => (
              <li key={en} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-white/85">
                <Icon size={16} className="mt-0.5 shrink-0 text-white/50" />
                <span>{locale === 'ta' ? ta : en}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/12 pt-5 font-mono text-2xs uppercase tracking-wider text-white/45">
          <span>Matriculation · CBSE</span>
          <span>English · தமிழ்</span>
          <span>Installable app</span>
        </div>
      </section>

      {/* ── Right: sign in ────────────────────────────────── */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="label-mono">{t('auth.signIn')}</span>
            <button
              onClick={() => setLocale(locale === 'en' ? 'ta' : 'en')}
              className="rounded border border-line px-2.5 py-1 text-xs font-semibold text-ink-2 ring-focus hover:bg-surface-2 hover:text-ink"
            >
              {locale === 'en' ? 'தமிழில் காட்டு' : 'Show in English'}
            </button>
          </div>

          <h2 className="font-serif text-2xl font-bold text-ink">{t('auth.chooseRole')}</h2>

          {IS_DEMO && (
            <div className="mt-3 flex items-start gap-2 rounded border border-clay/30 bg-clay-dim px-3 py-2.5">
              <Badge tone="clay">Demo</Badge>
              <p className="text-xs leading-relaxed text-ink-2">{t('auth.demoNote')}</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2">
            {demoUsers.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[62px] animate-pulse rounded-md bg-surface-2" />
              ))}

            {demoUsers.map((u) => {
              const blurb = ROLE_BLURB[u.role]
              return (
                <button
                  key={u.id}
                  onClick={() => signIn(u)}
                  className="group flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-3 text-left ring-focus transition-colors hover:border-forest/40 hover:bg-forest-dim"
                >
                  <Avatar name={u.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-ink">
                        {t(ROLE_KEY[u.role])}
                      </span>
                    </div>
                    <div className="truncate text-xs text-ink-3">
                      {locale === 'ta' ? blurb.ta : blurb.en}
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-forest"
                  />
                </button>
              )
            })}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-ink-3">
            {SCHOOL.name}
            <br />
            <span className="font-mono text-2xs uppercase tracking-wider">
              {SCHOOL.academic_year} · {SCHOOL.city}
            </span>
          </p>
        </div>
      </section>
    </div>
  )
}
