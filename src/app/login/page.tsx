import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEV_BYPASS } from '@/lib/dev-bypass';
import LoginForm from './LoginForm';
import LoginQuote from './LoginQuote';

export const metadata = {
  title: 'Sign In — Coffee@CU',
  description: 'Sign in to Coffee@CU with your Columbia University email.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; mode?: string; redirect?: string }>;
}) {
  const params = await searchParams;

  // Redirect already-authenticated users
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/profile');
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{`
        .login-panel-left  { width: 100%; }
        .login-panel-right { display: none; }
        @media (min-width: 1024px) {
          .login-panel-left  { width: 520px; flex-shrink: 0; }
          .login-panel-right { display: flex !important; }
        }
      `}</style>

      {/* ——— Left: form ——— */}
      <div
        className="login-panel-left"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'var(--color-limestone)',
          padding: '2rem clamp(1.5rem, 5vw, 3rem)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          {/* Back link */}
          <div style={{ marginBottom: '0.75rem' }}>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <span aria-hidden="true">&larr;</span> Back to home
            </Link>
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h1
              className="heading-display"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3rem)',
                color: 'var(--color-ink)',
                margin: 0,
                lineHeight: 1.05,
                letterSpacing: '-0.02em'
              }}
            >
              Coffee@CU
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.5rem',
              }}
            >
              Meet the Columbia community, one coffee at a time.
            </p>
          </div>

          {/* Card */}
          <div
            style={{
              background: 'var(--color-white)',
              border: '1px solid var(--color-mist)',
              borderRadius: '24px',
              padding: '2rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >

            <Suspense fallback={null}>
              <LoginForm
                initialEmail={params.email}
                initialMode={params.mode === 'signup' ? 'sign_up' : undefined}
                initialRedirect={params.redirect}
              />
            </Suspense>
          </div>

          {/* Footer note */}
          <p
            style={{
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              marginTop: '0.75rem',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              fontFamily: 'var(--font-body)',
            }}
          >
            At this time, joining Coffee@CU requires an active Columbia or Barnard email address (including @gsb.columbia.edu and other subdomains).
          </p>
        </div>
      </div>

      {/* ——— Right: social proof ——— */}
      <div
        className="login-panel-right grain-overlay"
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(150deg, #012a61 0%, #00418c 54%, #0d5eac 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(3rem, 6vw, 5rem) clamp(2.5rem, 5vw, 4rem)',
        }}
      >
        {/* Decorative left border */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: 'linear-gradient(to bottom, transparent, rgba(117,170,219,0.7), transparent)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '480px' }}>
          <LoginQuote />
        </div>
      </div>
    </main>
  );
}
