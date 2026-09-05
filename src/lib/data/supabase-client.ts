import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser Supabase client.
 *
 * Only the anon key is ever shipped here. That key is safe to expose *because*
 * Row-Level Security is on — see supabase/02_rls.sql. If you ever disable RLS
 * on a table, that table becomes world-readable to anyone who opens devtools.
 * The service-role key must never appear in this file or anywhere under src/.
 */

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Supabase mode is on but NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. ' +
        'Set them in .env.local (and in Vercel → Settings → Environment Variables), ' +
        'or set NEXT_PUBLIC_DATA_MODE=demo to run on the built-in sample data.',
    )
  }

  client = createBrowserClient(url, anonKey)
  return client
}

/** Throws with the Postgres message intact — RLS denials are easier to read that way. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return (res.data ?? []) as T
}
