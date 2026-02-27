'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { isAllowedDomain } from '@/lib/constants';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function handleAuth() {
      // Supabase may send errors in query params (some versions) or hash (others)
      const queryError = searchParams.get('error');
      const hash = window.location.hash.slice(1);
      const hashParams = new URLSearchParams(hash);
      const hashError = hashParams.get('error');

      if (queryError || hashError) {
        console.error('[auth/callback] error:', queryError ?? hashError);
        router.replace('/login?error=link_expired');
        return;
      }

      const code = searchParams.get('code');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') ?? '';

      if (accessToken) {
        // Implicit flow — token arrived in the URL hash fragment
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('[auth/callback] setSession error:', error.message);
          router.replace('/login?error=auth_failed');
          return;
        }
      } else if (code) {
        // PKCE flow fallback — token arrived as ?code= query param
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[auth/callback] exchangeCodeForSession error:', error.message);
          const isVerifierMissing = error.message?.toLowerCase().includes('verifier');
          router.replace(
            isVerifierMissing ? '/login?error=wrong_device' : '/login?error=auth_failed',
          );
          return;
        }
      } else {
        router.replace('/login?error=missing_code');
        return;
      }

      // Domain check — Columbia/Barnard only
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && !isAllowedDomain(user.email)) {
        await supabase.auth.signOut();
        router.replace(`/login?error=domain&email=${encodeURIComponent(user.email)}`);
        return;
      }

      // Profile page handles new-user → /onboarding redirect
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
