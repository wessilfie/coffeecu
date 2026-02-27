'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { isAllowedDomain } from '@/lib/constants';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    async function handleAuth() {
      const code = searchParams.get('code');
      const supabaseError = searchParams.get('error');

      if (supabaseError) {
        // Supabase sends ?error= when the link is expired or already used
        router.replace('/login?error=link_expired');
        return;
      }

      if (code) {
        // PKCE flow: server generated a code, exchange it for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('[auth/callback] exchangeCodeForSession:', exchangeError.message);
          const isVerifierMissing = exchangeError.message?.toLowerCase().includes('verifier');
          router.replace(
            isVerifierMissing ? '/login?error=wrong_device' : '/login?error=auth_failed',
          );
          return;
        }
      } else {
        // No ?code= in URL — the token may be in the URL hash (#access_token=...).
        // supabase-js automatically processes hash fragments when getSession() is called.
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.replace('/login?error=missing_code');
          return;
        }
      }

      // Domain check — Columbia/Barnard only
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email && !isAllowedDomain(user.email)) {
        await supabase.auth.signOut();
        router.replace(`/login?error=domain&email=${encodeURIComponent(user.email)}`);
        return;
      }

      // Redirect to profile — profile page handles the new-user → /onboarding redirect
      router.replace('/profile');
    }

    handleAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-limestone)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body), serif',
          color: 'var(--color-text-muted)',
          fontStyle: 'italic',
        }}
      >
        Signing you in…
      </p>
    </div>
  );
}
