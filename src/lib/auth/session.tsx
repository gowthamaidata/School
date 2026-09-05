'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { repo, IS_DEMO } from '@/lib/data/repository'
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
  | 'view_own_child'

const MATRIX: Record<Role, Capability[]> = {
  correspondent: [
    'view_dashboard', 'view_all_students', 'manage_fees', 'send_announcements',
    'view_staff', 'enter_marks', 'mark_attendance',
  ],
  principal: [
    'view_dashboard', 'view_all_students', 'manage_fees', 'send_announcements',
    'view_staff', 'enter_marks', 'mark_attendance',
  ],
  admin: [
    'view_dashboard', 'view_all_students', 'manage_fees', 'send_announcements',
    'view_staff',
  ],
  teacher: ['view_dashboard', 'mark_attendance', 'enter_marks', 'view_all_students'],
  parent: ['view_own_child'],
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
        /* storage blocked — fall through to signed-out */
      }

      if (!IS_DEMO) {
        // In Supabase mode the real session is restored by the Supabase client.
        // See src/lib/data/supabase.ts — wire getSession() here when you go live.
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
        /* non-persistent session is still a usable session */
      }
      router.push(u.role === 'parent' ? '/parent' : '/dashboard')
    },
    [router],
  )

  const signOut = useCallback(() => {
    setUser(null)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* nothing to clean up */
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

/** Convenience for demo sign-in buttons. */
export function useDemoUsers() {
  const [users, setUsers] = useState<SessionUser[]>([])
  useEffect(() => {
    repo.getDemoUsers().then(setUsers)
  }, [])
  return users
}
