import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                sameSite: 'none',
                secure: true,
              })
            );
          } catch {
            // Server Component read-only context
          }
        },
      },
    }
  );
}

/**
 * Service role client — bypasses RLS entirely.
 * Use ONLY in server-side API routes, never in client components.
 * FAILS CLOSED: throws an error if the service role key is not a valid JWT.
 * Never falls back to the anon key for privileged operations.
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // A real Supabase service role key is a JWT and starts with "eyJ"
  if (!serviceKey.startsWith('eyJ')) {
    throw new Error(
      '[DETARA] SUPABASE_SERVICE_ROLE_KEY is not configured or is a placeholder. ' +
      'Set the real service role key in your environment variables. '+ 'Server-side privileged operations cannot proceed without it.'
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
