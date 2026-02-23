import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign In — Coffee@CU',
  description: 'Sign in to Coffee@CU with your Columbia University email.',
};

export default async function LoginPage() {
  // Redirect already-authenticated users
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/profile');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-limestone)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p
            className="label-mono"
            style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}
          >
            Columbia University
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 'clamp(2rem, 5vw, 2.75rem)',
              fontWeight: 400,
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
            padding: '2rem',
            boxShadow: '0 4px 24px rgba(26,20,16,0.08)',
          }}
        >
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer note */}
        <p
          className="label-mono"
          style={{
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            marginTop: '1.5rem',
            fontSize: '0.65rem',
            lineHeight: 1.6,
          }}
        >
          For Columbia University students, faculty &amp; alumni only.
          <br />
          @columbia.edu and @barnard.edu addresses accepted.
        </p>
      </div>
    </main>
  );
}
