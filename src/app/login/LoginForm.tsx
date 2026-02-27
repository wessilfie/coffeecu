'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { isAllowedDomain } from '@/lib/constants';

type AuthMode = 'sign_in' | 'sign_up';

const DOMAIN_ERRORS: Record<string, string> = {
  domain: 'Coffee@CU is for Columbia University community members only. Please sign in with your @columbia.edu or @barnard.edu address.',
  auth_failed: 'Authentication failed. Please try again.',
  missing_code: 'This sign-in link is invalid. Please request a new one.',
  link_expired: 'This sign-in link has expired or already been used. Please sign in again to get a new one.',
  wrong_device: 'Please open the sign-in link on the same browser where you created your account, or sign in again here.',
  no_email: 'Could not read your email address. Please try again.',
};

export default function LoginForm({
  initialEmail,
  initialMode,
}: {
  initialEmail?: string;
  initialMode?: 'sign_in' | 'sign_up';
}) {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const errorEmail = searchParams.get('email'); // used only in OAuth error banner

  // Read email + mode directly from URL — more reliable than Suspense-wrapped prop
  const urlEmail = searchParams.get('email');
  const urlMode = searchParams.get('mode');

  const [mode, setMode] = useState<AuthMode>(
    initialMode ?? (urlMode === 'signup' ? 'sign_up' : 'sign_in')
  );
  const [email, setEmail] = useState(initialEmail ?? urlEmail ?? '');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const domainError = errorParam ? (DOMAIN_ERRORS[errorParam] ?? 'Something went wrong. Please try again.') : null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    // Client-side domain check (UX feedback only — server enforces too)
    if (!isAllowedDomain(email)) {
      setStatus('error');
      setMessage('Coffee@CU is for Columbia University community members. Please use your @columbia.edu or @barnard.edu address.');
      return;
    }

    if (mode === 'sign_up') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setStatus('error');
        setMessage(error.message);
      } else {
        setStatus('success');
        setMessage('');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus('error');
        setMessage(
          error.message.includes('Invalid login credentials')
            ? 'Incorrect email or password.'
            : error.message,
        );
      } else {
        window.location.href = '/profile';
      }
    }
  };

  if (status === 'success') {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '2rem 0',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#D4E8D4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <Mail size={22} color="#1C5C3A" />
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display), serif',
            fontSize: '1.625rem',
            fontWeight: 400,
            color: 'var(--color-ink)',
            marginBottom: '0.75rem',
          }}
        >
          Check your Columbia email
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.9375rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.65,
            maxWidth: '340px',
            margin: '0 auto 1rem',
          }}
        >
          We sent a confirmation link to <strong>{email}</strong>.
          Click it and you&rsquo;ll be signed in automatically.
        </p>
        <p
          style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', fontFamily: 'var(--font-body), serif' }}
        >
          Check your spam folder if it doesn&rsquo;t arrive within a minute.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Already confirmed?{' '}
          <button
            type="button"
            onClick={() => { setStatus('idle'); setMode('sign_in'); setMessage(''); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-columbia)',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Sign in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* URL-based error (from OAuth callback) */}
      {domainError && (
        <div
          style={{
            display: 'flex',
            gap: '0.625rem',
            alignItems: 'flex-start',
            padding: '0.75rem 1rem',
            background: 'rgba(155,28,28,0.06)',
            border: '1px solid rgba(155,28,28,0.2)',
            borderRadius: '4px',
            marginBottom: '1.5rem',
          }}
        >
          <AlertCircle size={15} color="var(--color-error)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p
            style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.7rem',
              color: 'var(--color-error)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {domainError}
            {errorEmail && (
              <span style={{ display: 'block', marginTop: '0.25rem', opacity: 0.8 }}>
                Signed in as: {errorEmail}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Email/password form */}
      <form onSubmit={handleEmailAuth}>
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="auth-email">
            Columbia Email *
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={14}
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              id="auth-email"
              type="email"
              className="form-input"
              placeholder="uni@columbia.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="auth-password">
            Password *
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={14}
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              id="auth-password"
              type="password"
              className="form-input"
              placeholder={mode === 'sign_up' ? 'Create a password' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'sign_up' ? 'new-password' : 'current-password'}
              minLength={8}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {status === 'error' && message && (
          <p
            style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.7rem',
              color: 'var(--color-error)',
              marginBottom: '1rem',
              padding: '0.625rem 0.75rem',
              background: 'rgba(155,28,28,0.06)',
              borderRadius: '4px',
              border: '1px solid rgba(155,28,28,0.2)',
            }}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={status === 'loading'}
          style={{ width: '100%', opacity: status === 'loading' ? 0.7 : 1 }}
        >
          {status === 'loading'
            ? 'Please wait...'
            : mode === 'sign_up'
            ? 'Create Account'
            : 'Sign In'}
        </button>
      </form>

      {/* Mode toggle */}
      <p
        style={{
          marginTop: '0.875rem',
          textAlign: 'center',
          fontFamily: 'var(--font-body), serif',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
        }}
      >
        {mode === 'sign_in' ? (
          <>
            New to Coffee@CU?{' '}
            <button
              type="button"
              onClick={() => { setMode('sign_up'); setMessage(''); setStatus('idle'); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-columbia)',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { setMode('sign_in'); setMessage(''); setStatus('idle'); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-columbia)',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
