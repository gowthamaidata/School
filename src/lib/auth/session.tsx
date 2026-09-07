'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { repo, IS_DEMO } from '@/lib/data/repository'
import { getSupabase } from '@/lib/data/supabase-client'
import type { Role, SessionUser } from '@/lib/data/types'

interface SessionValue {
  user: SessionUser | null
  loading: boolean
  signIn: (user: SessionUser) => void
  signOut: () => void
  /** Route-level capability check. */
  can: (capability: Capability) => boolean
}

/** Coarse capabilities — mirrors the RLS policies in supabase/rls.sql. */
export type Capability =
  | 'view_dashboard'
  | 'mark_attendance'
  | 'view_all_students'
  | 'manage_fees'
  | 'enter_marks'
  | 'send_announcements'
  | 'view_staff'
  | 'assign_homework'
  | 'view_own_child'

const MATRIX: Record<Role, Capability[]> = {
  correspondent: [
    'view_dashboard', 'view_all_students', 'manage_fees', 'send_announcements',
    'view_staff', 'enter_marks', 'mark_attendance', 'assign_homework',
  ],
  principal: [
    'view_dashboard', 'view_all_students', 'manage_fees', 'send_announcements',
    'view_staff', 'enter_marks', 'mark_attendance', 'assign_homework',
  ],
  // Office staff (Accountant, Office Superintendent) run fees, records and
  // announcements. Attendance and marks belong to the class teacher, so
  // those capabilities are deliberately absent here — enforced both in the
  // nav (AppShell hides the link) and by the route guard in AppShell (a
  // direct visit to /attendance bounces back), not just by hiding a link.
  admin: [
    'view_dashboard', 'view_all_students', 'manage_fees', 'send_announcements',
    'view_staff',
  ],
  // Teachers live in their classroom, not in whole-school numbers. No
  // dashboard — attendance is their landing page instead (see
  // homeRouteFor below and the sign-in redirect in src/app/page.tsx).
  teacher: ['mark_attendance', 'enter_marks', 'view_all_students', 'assign_homework'],
  parent: ['view_own_child'],
}

/**
 * Where a role lands after sign-in (and where AppShell's route guard sends
 * anyone who ends up somewhere their role can't access — a stale bookmark,
 * the PWA's "Mark attendance" shortcut, browser back/forward, etc).
 */
export function homeRouteFor(role: Role): string {
  if (role === 'parent') return '/parent'
  if (role === 'teacher') return '/attendance'
  return '/dashboard'
}

const SessionContext = createContext<SessionValue | null>(null)
const STORAGE_KEY = 'palli.session'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as SessionUser
          if (!cancelled && parsed?.id && parsed?.role) {
            setUser(parsed)
            setLoading(false)
            return
          }
        }
      } catch {
        console.warn('[session] localStorage restore failed; continuing as signed-out')
      }

      if (!IS_DEMO) {
        // Supabase auth sessions are managed by @supabase/supabase-js; we still
        // keep local app role/session metadata in STORAGE_KEY for route guards.
      }
      if (!cancelled) setLoading(false)
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(
    (u: SessionUser) => {
      setUser(u)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      } catch {
        console.warn('[session] localStorage save failed; session will be non-persistent')
      }
      router.push(homeRouteFor(u.role))
    },
    [router],
  )

  const signOut = useCallback(() => {
    setUser(null)
    if (!IS_DEMO) {
      getSupabase().auth.signOut().catch((err) => {
        console.warn('[session] supabase signOut failed', err)
      })
    }
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      console.warn('[session] localStorage cleanup failed on sign-out')
    }
    router.push('/')
  }, [router])

  const can = useCallback(
    (capability: Capability) => {
      if (!user) return false
      return MATRIX[user.role]?.includes(capability) ?? false
    },
    [user],
  )

  return (
    <SessionContext.Provider value={{ user, loading, signIn, signOut, can }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}

/** Convenience for demo sign-in buttons. Exposes a loading flag so callers can
 * distinguish "still fetching" from "genuinely no demo users" (e.g. in
 * supabase mode, where getDemoUsers() legitimately returns an empty list). */
export function useDemoUsers() {
  const [users, setUsers] = useState<SessionUser[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    repo.getDemoUsers().then((u) => {
      if (!alive) return
      setUsers(u)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])
  return { users, loading }
}
