import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 * Uses implicit flow (not PKCE) — avoids the code-challenge OTP expiry
 * issue with @supabase/ssr 0.8.x + Supabase cloud GoTrue.
 * After email confirmation Supabase redirects with #access_token in the hash;
 * AuthCallbackClient reads that hash directly via setSession().
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
      },
    },
  );
}
