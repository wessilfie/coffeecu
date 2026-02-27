import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DEV_BYPASS } from '@/lib/dev-bypass';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign In — Coffee@CU',
  description: 'Sign in to Coffee@CU with your Columbia University email.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; mode?: string }>;
}) {
  const params = await searchParams;

  if (!DEV_BYPASS) {
    // Redirect already-authenticated users
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect('/profile');
    }
  }

  const quotes = [
    {
      text: 'I met one of my closest friends on Coffee@CU. We\'re still close nearly a decade later.',
      attr: 'Columbia alum',
    },
    {
      text: 'I\'m getting married to someone I met for tea once on here.',
      attr: 'Columbia alum',
    },
    {
      text: 'Had one Zoom call with a professor I found on here. It completely changed the direction of my research.',
      attr: 'GSAS student',
    },
    {
      text: 'I\'ve wanted to find other folks looking to get into entrepreneurship. Coffee@CU is helping me meet others in that space I might not have met otherwise.',
      attr: 'CBS \'26 MBA candidate',
    },
    {
      text: 'I already go to Dear Mama midday; will be nice to have some others to meet over there.',
      attr: 'CBS \'26 EMBA candidate',
    },
  ];

  // Rotate by hour so it changes throughout the day without hydration issues
  const quote = quotes[new Date().getHours() % quotes.length];

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
                fontFamily: 'var(--font-body), serif',
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
            <p
              className="label-mono"
              style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}
            >
              Columbia University
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display), serif',
                fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                fontWeight: 600,
                color: 'var(--color-ink)',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Coffee@CU
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body), serif',
                fontSize: '0.9375rem',
                color: 'var(--color-text-muted)',
                marginTop: '0.5rem',
                fontStyle: 'italic',
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
              borderRadius: '6px',
              padding: '1.5rem',
              boxShadow: '0 4px 24px rgba(26,20,16,0.08)',
            }}
          >
            {DEV_BYPASS ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p
                  className="label-mono"
                  style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: '0.65rem' }}
                >
                  Dev mode — no real auth required
                </p>
                <a
                  href="/"
                  className="btn-primary"
                  style={{ width: '100%', display: 'block', textAlign: 'center' }}
                >
                  Enter as Dev User
                </a>
                <a
                  href="/profile"
                  className="btn-ghost"
                  style={{ width: '100%', display: 'block', textAlign: 'center', marginTop: '0.75rem' }}
                >
                  Go to Profile
                </a>
              </div>
            ) : (
              <Suspense fallback={null}>
                <LoginForm
                  initialEmail={params.email}
                  initialMode={params.mode === 'signup' ? 'sign_up' : undefined}
                />
              </Suspense>
            )}
          </div>

          {/* Footer note */}
          <p
            className="label-mono"
            style={{
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              marginTop: '0.75rem',
              fontSize: '0.65rem',
              lineHeight: 1.6,
            }}
          >
            For Columbia University students, faculty &amp; alumni only.
            <br />
            @columbia.edu and @barnard.edu addresses accepted.
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
          <blockquote style={{ margin: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-display), serif',
                fontStyle: 'italic',
                fontSize: 'clamp(1.625rem, 3vw, 2.25rem)',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.97)',
                lineHeight: 1.35,
                marginBottom: '1.25rem',
              }}
            >
              &ldquo;{quote.text}&rdquo;
            </p>
            <footer
              style={{
                fontFamily: 'var(--font-body), serif',
                fontSize: '0.8125rem',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {quote.attr}
            </footer>
          </blockquote>

          {/* Bottom badge */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <p className="label-mono" style={{ color: 'rgba(117,170,219,0.6)', fontSize: '0.65rem' }}>
              Built by Columbians, for Columbians
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body), serif',
                fontSize: '0.8125rem',
                color: 'rgba(255,255,255,0.35)',
                marginTop: '0.25rem',
              }}
            >
              @columbia.edu and @barnard.edu only
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
