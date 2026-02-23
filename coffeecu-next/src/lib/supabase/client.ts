import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client (anon key only — safe to expose)
// Uses singleton pattern to prevent multiple GoTrueClient instances
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
