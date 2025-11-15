/**
 * Supabase Server Client for API Routes
 * Creates authenticated Supabase client for server-side operations
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Create Supabase client for API routes with cookie-based auth
 */
export function createClient() {
  const cookieStore = cookies()

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: cookieStore
          .getAll()
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join('; '),
      },
    },
  })
}
