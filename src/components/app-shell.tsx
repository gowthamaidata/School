'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BadgeIndianRupee, BookOpenCheck, CalendarCheck2, GraduationCap, LayoutDashboard,
  LogOut, Megaphone, Menu, Moon, MoreHorizontal, NotebookPen, Search, Settings, Sun,
  Users, X, Languages, UserRound, type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { usePrefs } from '@/lib/i18n/provider'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import { useSession, homeRouteFor, type Capability } from '@/lib/auth/session'
import { IS_DEMO, SCHOOL } from '@/lib/data/repository'
import { Avatar, Badge } from '@/components/ui'
import { CommandPalette, useCommandPalette, type CommandItem } from '@/components/command-palette'

type NavGroup = 'daily' | 'academics' | 'office' | 'people'

interface NavItem {
  href: string
  labelKey: TranslationKey
  icon: LucideIcon
  capability: Capability
  group: NavGroup
}

/**
 * Navigation is grouped by *when* a person reaches for it, not by data model:
 * the things touched every single morning sit at the top and never move, and
 * the reference sections sit below them. On a phone the first four of a role's
 * permitted items become the tab bar; everything else lives behind "More".
 */
const NAV: NavItem[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, capability: 'view_dashboard', group: 'daily' },
  { href: '/attendance', labelKey: 'nav.attendance', icon: CalendarCheck2, capability: 'mark_attendance', group: 'daily' },
  { href: '/homework', labelKey: 'nav.homework', icon: NotebookPen, capability: 'assign_homework', group: 'daily' },
  { href: '/communication', labelKey: 'nav.communication', icon: Megaphone, capability: 'send_announcements', group: 'daily' },
  { href: '/exams', labelKey: 'nav.exams', icon: BookOpenCheck, capability: 'enter_marks', group: 'academics' },
  { href: '/students', labelKey: 'nav.students', icon: Users, capability: 'view_all_students', group: 'people' },
  { href: '/staff', labelKey: 'nav.staff', icon: GraduationCap, capability: 'view_staff', group: 'people' },
  { href: '/fees', labelKey: 'nav.fees', icon: BadgeIndianRupee, capability: 'manage_fees', group: 'office' },
]

const PARENT_NAV: NavItem[] = [
  { href: '/parent', labelKey: 'nav.myChild', icon: UserRound, capability: 'view_own_child', group: 'daily' },
]

const GROUP_LABEL: Record<NavGroup, TranslationKey> = {
  daily: 'nav.groupDaily',
  academics: 'nav.groupAcademics',
  people: 'nav.groupPeople',
  office: 'nav.groupOffice',
}

const GROUP_ORDER: NavGroup[] = ['daily', 'academics', 'people', 'office']

/**
 * Every capability-gated route in the app, regardless of which sidebar shows
 * it. The route guard in AppShell checks a visited path against this full
 * list — not just the current role's own nav — so a parent typing /dashboard
 * or a teacher typing /fees is caught even though their sidebar never links
 * there in the first place.
 */
const ALL_GATED_ROUTES: NavItem[] = [...NAV, ...PARENT_NAV]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

/**
 * Declared at module scope, not inside AppShell. A component defined in a
 * render body is a new component type every render, which remounts the whole
 * nav subtree and loses focus state.
 */
function NavLinks({
  items,
  pathname,
  label,
  onNavigate,
}: {
  items: NavItem[]
  pathname: string
  label: (key: TranslationKey) => string
  onNavigate?: () => void
}) {
  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    items: items.filter((i) => i.group === g),
  })).filter((g) => g.items.length > 0)

  return (
    <nav className="flex flex-col gap-5 px-3" aria-label={label('nav.menu')}>
      {groups.map(({ group, items: groupItems }) => (
        <div key={group}>
          {/* A single-group nav (parents) needs no heading. */}
          {groups.length > 1 && <div className="label mb-1.5 px-2.5">{label(GROUP_LABEL[group])}</div>}
          <ul className="flex flex-col gap-0.5">
            {groupItems.map((item) => {
              const active = isActive(pathname, item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm ring-focus transition-colors duration-200',
                      active
                        ? 'bg-surface-2 font-semibold text-ink'
                        : 'font-medium text-ink-2 hover:bg-surface-2/70 hover:text-ink',
                    )}
                  >
                    {/* Active marker: a soft vertical bar rather than a filled
                        block, so the sidebar stays quiet while still being
                        unambiguous at a glance. */}
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-pill bg-forest transition-all duration-200 ease-soft',
                        active ? 'opacity-100' : 'scale-y-0 opacity-0',
                      )}
                      aria-hidden
                    />
                    <Icon
                      size={18}
                      className={cn('shrink-0 transition-colors', active ? 'text-forest' : 'text-ink-3 group-hover:text-ink-2')}
                    />
                    <span className="truncate">{label(item.labelKey)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, can } = useSession()
  const { t, locale, setLocale, theme, setTheme } = usePrefs()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const palette = useCommandPalette()

  const navList = user?.role === 'parent' ? PARENT_NAV : NAV

  // The nav item (if any) that owns the current route — checked against
  // every gated route in the app, not just the ones this role's sidebar
  // shows. That distinction matters: NAV alone would never catch a parent
  // typing /dashboard, because /dashboard isn't in PARENT_NAV at all, it's
  // simply a route their sidebar never mentions. Most of the app —
  // /settings, /report-card/*, a student's own profile — has no entry here
  // and is open to anyone signed in.
  const currentNavItem = ALL_GATED_ROUTES.find((i) => isActive(pathname, i.href))
  const authorized = !currentNavItem || (!!user && can(currentNavItem.capability))

  // Route guard — bounce anyone without a session back to sign-in, and bounce
  // a signed-in user away from a section their role can't reach. This is what
  // actually stops an Accountant from marking attendance by typing the URL or
  // tapping the PWA's "Mark attendance" shortcut; hiding the nav link alone
  // only stops someone who never tries.
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/')
      return
    }
    if (!authorized) {
      const fallback = navList.find((i) => can(i.capability))
      router.replace(fallback?.href ?? homeRouteFor(user.role))
    }
  }, [loading, user, authorized, navList, can, router])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const items = useMemo(() => navList.filter((i) => can(i.capability)), [navList, can])

  const toggleTheme = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme],
  )
  const toggleLocale = useCallback(
    () => setLocale(locale === 'en' ? 'ta' : 'en'),
    [locale, setLocale],
  )

  const commands: CommandItem[] = useMemo(() => {
    const nav: CommandItem[] = items.map((i) => ({
      id: i.href,
      label: t(i.labelKey),
      group: t('nav.menu'),
      icon: <i.icon size={15} />,
      keywords: i.href,
      run: () => router.push(i.href),
    }))
    return [
      ...nav,
      {
        id: '/settings',
        label: t('set.title'),
        group: t('nav.menu'),
        icon: <Settings size={15} />,
        keywords: 'settings preferences',
        run: () => router.push('/settings'),
      },
      {
        id: 'theme',
        label: theme === 'dark' ? t('set.themeLight') : t('set.themeDark'),
        group: t('set.theme'),
        icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
        keywords: 'theme dark light appearance',
        run: toggleTheme,
      },
      {
        id: 'locale',
        label: locale === 'en' ? 'தமிழ்' : 'English',
        group: t('set.language'),
        icon: <Languages size={15} />,
        keywords: 'language tamil english mozhi',
        run: toggleLocale,
      },
      {
        id: 'signout',
        label: t('nav.signOut'),
        group: t('set.title'),
        icon: <LogOut size={15} />,
        keywords: 'sign out logout exit',
        run: signOut,
      },
    ]
  }, [items, t, router, theme, locale, toggleTheme, toggleLocale, signOut])

  if (loading || !user || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <span className="sr-only">{t('common.loading')}</span>
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-forest" aria-hidden />
      </div>
    )
  }

  /* ── Sidebar content, shared by the desktop rail and the mobile drawer ── */
  const sidebar = (
    <>
      <div className="px-5 pb-4 pt-5">
        <Link href={homeRouteFor(user.role)} className="flex items-center gap-3 rounded-md ring-focus">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest font-display text-sm font-bold text-white shadow-card">
            {SCHOOL.logo_text}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-semibold leading-tight text-ink">
              {t('app.name')}
            </span>
            <span className="block truncate text-xs text-ink-3">{SCHOOL.city}</span>
          </span>
        </Link>
        {IS_DEMO && (
          <Badge tone="clay" dot className="mt-3">
            Demo data
          </Badge>
        )}
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto pb-4">
        <NavLinks
          items={items}
          pathname={pathname}
          label={t}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      {/* Account card — the one place a session lives, on every breakpoint. */}
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-md bg-surface-2/70 p-2.5">
          <Avatar name={user.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold leading-tight text-ink">{user.name}</div>
            <div className="truncate text-2xs text-ink-3">{user.designation}</div>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 rounded-pill p-2 text-ink-3 ring-focus transition-colors hover:bg-surface-3 hover:text-danger"
            title={t('nav.signOut')}
            aria-label={t('nav.signOut')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  )

  /* Phones get four tabs plus "More"; five equal tabs squeeze the labels. */
  const tabItems = items.slice(0, 4)

  return (
    <div className="relative z-10 flex min-h-screen">
      <a href="#main" className="skip-link">
        {t('nav.skipToContent')}
      </a>

      {/* ── Desktop rail ──────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/80 backdrop-blur-md lg:flex">
        {sidebar}
      </aside>

      {/* ── Mobile drawer ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside
            className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[88vw] animate-slide-in flex-col border-r border-line bg-surface shadow-pop"
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.menu')}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-pill p-2 text-ink-3 ring-focus hover:bg-surface-2"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* ── Main column ───────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        {/* One header, two shapes: a utility bar on desktop, a title bar on
            phones. Both are the same height so the page never shifts. */}
        <header className="app-header sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-paper/90 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="-ml-1 rounded-pill p-2 text-ink-2 ring-focus transition-colors hover:bg-surface-2 lg:hidden"
            aria-label={t('nav.openMenu')}
          >
            <Menu size={20} />
          </button>

          <span className="font-display text-base font-semibold text-ink lg:hidden">
            {t('app.name')}
          </span>

          {/* Search opens the palette. On desktop it looks like a field
              (because that is what people expect to click), on mobile it is
              an icon button — the palette itself is the field there. */}
          <button
            onClick={() => palette.setOpen(true)}
            className="ml-auto hidden h-9 w-72 items-center gap-2.5 rounded-pill border border-line bg-surface px-3.5 text-left text-sm text-ink-3 ring-focus transition-colors hover:border-line-strong hover:text-ink-2 lg:flex"
          >
            <Search size={15} className="shrink-0" aria-hidden />
            <span className="flex-1 truncate">{t('nav.searchHint')}</span>
            <kbd className="shrink-0 rounded border border-line px-1.5 font-mono text-2xs">⌘K</kbd>
          </button>
          <button
            onClick={() => palette.setOpen(true)}
            className="ml-auto rounded-pill p-2 text-ink-2 ring-focus transition-colors hover:bg-surface-2 lg:hidden"
            aria-label={t('common.search')}
          >
            <Search size={18} />
          </button>

          <div className="flex items-center gap-0.5 lg:ml-3">
            <button
              onClick={toggleLocale}
              className="rounded-pill px-2.5 py-1.5 text-xs font-semibold text-ink-2 ring-focus transition-colors hover:bg-surface-2 hover:text-ink"
              title={t('set.language')}
              aria-label={t('set.language')}
            >
              {locale === 'en' ? 'தமிழ்' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-pill p-2 text-ink-2 ring-focus transition-colors hover:bg-surface-2 hover:text-ink"
              title={t('set.theme')}
              aria-label={theme === 'dark' ? t('set.themeLight') : t('set.themeDark')}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link
              href="/settings"
              className={cn(
                'rounded-pill p-2 ring-focus transition-colors hover:bg-surface-2 hover:text-ink',
                isActive(pathname, '/settings') ? 'text-forest' : 'text-ink-2',
              )}
              title={t('set.title')}
              aria-label={t('set.title')}
            >
              <Settings size={17} />
            </Link>
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[86rem] flex-1 px-4 py-6 pb-[calc(var(--tabbar)+2rem)] outline-none sm:px-6 lg:px-8 lg:py-8 lg:pb-12"
        >
          {/* Keyed on the route so each screen animates in as its own thing.
              Opacity only, deliberately: `animate-fade-up` leaves a settled
              `transform: translateY(0)` on this element, and a transformed
              ancestor becomes the containing block for its `position: fixed`
              descendants — which silently detached every sticky submit bar
              and toast from the viewport. Sections inside each page still
              carry their own vertical entrance via `.stagger-in`. */}
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        </main>

        {/* ── Mobile tab bar — thumb-reachable, the way teachers hold a phone ── */}
        <nav
          className="no-print fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/90 pb-safe backdrop-blur-md lg:hidden"
          aria-label={t('nav.menu')}
        >
          {tabItems.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-2xs font-medium"
              >
                <span
                  className={cn(
                    'flex h-8 w-full max-w-[3.5rem] items-center justify-center rounded-pill transition-all duration-200 ease-soft',
                    active ? 'bg-forest-dim text-forest' : 'text-ink-3',
                  )}
                >
                  <Icon size={19} />
                </span>
                <span className={cn('max-w-full truncate', active ? 'text-forest' : 'text-ink-3')}>
                  {t(item.labelKey)}
                </span>
              </Link>
            )
          })}
          {items.length > tabItems.length && (
            <button
              onClick={() => setMobileOpen(true)}
              className="relative flex flex-1 flex-col items-center gap-1 px-1 py-2.5 text-2xs font-medium text-ink-3"
            >
              <span className="flex h-8 w-full max-w-[3.5rem] items-center justify-center rounded-pill">
                <MoreHorizontal size={19} />
              </span>
              <span>{t('nav.more')}</span>
            </button>
          )}
        </nav>
      </div>

      <CommandPalette
        open={palette.open}
        onClose={() => palette.setOpen(false)}
        commands={commands}
        canSeeStudents={can('view_all_students')}
        placeholder={t('nav.searchHint')}
      />
    </div>
  )
}
