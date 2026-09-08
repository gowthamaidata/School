'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, CalendarCheck2, BadgeIndianRupee, MessageSquareText,
  FileText, ShieldCheck, Smartphone,
} from 'lucide-react'

import { usePrefs } from '@/lib/i18n/provider'
import { useSession, useDemoUsers, homeRouteFor } from '@/lib/auth/session'
import { IS_DEMO, SCHOOL } from '@/lib/data/repository'
import { Avatar, Badge, Skeleton } from '@/components/ui'
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

/** A pastel wash per role, so the sign-in list reads as a friendly palette
 *  rather than one flat column — mint for whole-school roles, sky for
 *  finance, lavender for teaching, peach for family. */
const ROLE_TINT: Record<Role, string> = {
  principal: 'bg-mint/30 group-hover:bg-mint/45',
  correspondent: 'bg-sky/30 group-hover:bg-sky/45',
  admin: 'bg-butter/30 group-hover:bg-butter/45',
  teacher: 'bg-lavender/30 group-hover:bg-lavender/45',
  parent: 'bg-peach/30 group-hover:bg-peach/45',
}

export default function SignInPage() {
  const { t, locale, setLocale } = usePrefs()
  const { user, signIn, loading } = useSession()
  const { users: demoUsers, loading: demoUsersLoading } = useDemoUsers()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace(homeRouteFor(user.role))
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
    <main className="relative z-10 min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ══ Left: what this is ══ */}
      <section className="relative flex flex-col justify-between overflow-hidden bg-forest-2 px-6 py-10 text-white sm:px-10 md:px-12 lg:px-14 lg:py-14">
        {/* Floating washes — depth without weight. */}
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 animate-float rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 animate-float rounded-full bg-white/[0.08] blur-3xl [animation-delay:1.6s]"
          aria-hidden
        />

        <div className="relative animate-fade-up">
          <div className="flex items-center gap-3">
            {/* Solid white plate rather than a translucent one: the brand
                initials are text, and white-on-translucent-purple cannot
                clear 4.5:1 at this size. */}
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white font-display text-base font-bold text-forest-2 shadow-card">
              {SCHOOL.logo_text}
            </span>
            <div>
              <div className="font-display text-xl font-semibold leading-none">{t('app.name')}</div>
              <div className="mt-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-white/90">
                Tamil Nadu · School OS
              </div>
            </div>
          </div>

          <h1 className="mt-12 max-w-lg font-display text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] md:text-[40px] lg:text-[46px]">
            {locale === 'ta'
              ? 'தமிழ்நாட்டுப் பள்ளிகள் உண்மையில் இயங்கும் விதத்திற்காக உருவாக்கப்பட்டது'
              : 'Built for how Tamil Nadu schools actually work'}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/95">
            {locale === 'ta'
              ? 'ஆசிரியர்களுக்கு மொபைலில், பெற்றோருக்கு வாட்ஸ்அப்பில், தலைமையாசிரியருக்கு ஒரே திரையில் முழுப் பள்ளியும்.'
              : 'On mobile for teachers, on WhatsApp for parents, and the whole school on one screen for the principal.'}
          </p>

          <ul className="mt-10 grid max-w-lg gap-x-6 gap-y-4 sm:grid-cols-2">
            {highlights.map(({ icon: Icon, en, ta }, i) => (
              <li
                key={en}
                className="flex animate-fade-up items-start gap-2.5 text-sm leading-snug text-white"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-white/15" aria-hidden>
                  <Icon size={12} />
                </span>
                <span>{locale === 'ta' ? ta : en}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-5 text-2xs font-semibold uppercase tracking-[0.1em] text-white/90">
          <span>Matriculation · CBSE</span>
          <span>English · தமிழ்</span>
          <span>Installable app</span>
        </div>
      </section>

      {/* ══ Right: choose a role ══ */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-8 md:px-10 lg:px-12">
        <div className="w-full max-w-sm animate-fade-up [animation-delay:120ms]">
          <div className="mb-2 flex items-center justify-between">
            <span className="label">{t('auth.signIn')}</span>
            <button
              onClick={() => setLocale(locale === 'en' ? 'ta' : 'en')}
              className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-2 ring-focus transition-all duration-200 ease-soft hover:border-line-strong hover:bg-surface-2 hover:text-ink"
            >
              {locale === 'en' ? 'தமிழில் காட்டு' : 'Show in English'}
            </button>
          </div>

          <h2 className="font-display text-[26px] font-semibold tracking-[-0.02em] text-ink">
            {t('auth.chooseRole')}
          </h2>

          {IS_DEMO && (
            <div className="mt-4 flex items-start gap-2.5 rounded-md border border-clay/20 bg-clay-dim px-3 py-3">
              <Badge tone="clay" dot>
                Demo
              </Badge>
              <p className="text-xs leading-relaxed text-ink-2">{t('auth.demoNote')}</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            {demoUsersLoading &&
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)}

            {!demoUsersLoading && demoUsers.length === 0 && (
              <p className="rounded-md border border-line bg-surface-2 px-3.5 py-3 text-sm text-ink-3">
                {locale === 'ta' ? 'உள்நுழையக் கணக்குகள் இல்லை.' : 'No sign-in accounts available.'}
              </p>
            )}

            {demoUsers.map((u, i) => {
              const blurb = ROLE_BLURB[u.role]
              return (
                <button
                  key={u.id}
                  onClick={() => signIn(u)}
                  style={{ animationDelay: `${i * 55}ms` }}
                  className="group relative flex animate-fade-up items-center gap-3.5 overflow-hidden rounded-lg border border-line bg-surface px-4 py-3.5 text-left shadow-card ring-focus transition-all duration-200 ease-soft hover:-translate-y-[2px] hover:border-forest/25 hover:shadow-lift active:translate-y-0 active:scale-[0.99]"
                >
                  <span
                    className={`absolute inset-0 -z-10 transition-colors duration-300 ${ROLE_TINT[u.role]}`}
                    aria-hidden
                  />
                  <Avatar name={u.name} size={42} ring />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {t(ROLE_KEY[u.role])}
                    </span>
                    <span className="block text-xs leading-snug text-ink-2">
                      {locale === 'ta' ? blurb.ta : blurb.en}
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-ink-3 transition-transform duration-200 ease-soft group-hover:translate-x-1 group-hover:text-forest"
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>

          <p className="mt-7 text-center text-xs leading-relaxed text-ink-3">
            {SCHOOL.name}
            <br />
            <span className="text-2xs font-semibold uppercase tracking-[0.1em]">
              {SCHOOL.academic_year} · {SCHOOL.city}
            </span>
          </p>
        </div>
      </section>
    </main>
  )
}
