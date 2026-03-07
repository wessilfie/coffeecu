'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Mail, Lock, AlertCircle, Check, X } from 'lucide-react';
import { isAllowedDomain } from '@/lib/constants';

type AuthMode = 'sign_in' | 'sign_up';

const DOMAIN_ERRORS: Record<string, string> = {
  domain: 'Coffee@CU is for Columbia University community members only. Please use your Columbia or Barnard email address.',
  auth_failed: 'Authentication failed. Please try again.',
  missing_code: 'This sign-in link is invalid. Please request a new one.',
  link_expired: 'This sign-in link has expired or already been used. If you already confirmed your email, sign in with your password below. Otherwise, enter your email to get a new link.',
  wrong_device: 'Please open the sign-in link on the same browser where you created your account, or sign in again here.',
  no_email: 'Could not read your email address. Please try again.',
};

export default function LoginForm({
  initialEmail,
  initialMode,
  initialRedirect,
}: {
  initialEmail?: string;
  initialMode?: 'sign_in' | 'sign_up';
  initialRedirect?: string;
}) {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const errorEmail = searchParams.get('email'); // used only in OAuth error banner

  // Read email + mode directly from URL — more reliable than Suspense-wrapped prop
  const urlEmail = searchParams.get('email');
  const urlMode = searchParams.get('mode');
  const urlSchool = searchParams.get('school');

  // Persist the referral school so it survives the Supabase email auth flow
  useEffect(() => {
    if (urlSchool) {
      sessionStorage.setItem('referral_school', urlSchool);
    }
  }, [urlSchool]);

  const [mode, setMode] = useState<AuthMode>(
    initialMode ?? (urlMode === 'signup' ? 'sign_up' : 'sign_in')
  );
  const [email, setEmail] = useState(initialEmail ?? urlEmail ?? '');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const supabase = createSupabaseBrowserClient();

  const domainError = errorParam ? (DOMAIN_ERRORS[errorParam] ?? 'Something went wrong. Please try again.') : null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setInfoMessage('');

    // Client-side domain check (UX feedback only — server enforces too)
    if (!isAllowedDomain(email)) {
      setStatus('error');
      setMessage('Coffee@CU is for Columbia University community members. Please use your Columbia email (e.g. @columbia.edu, @gsb.columbia.edu, @barnard.edu).');
      return;
    }

    if (mode === 'sign_up' && !passwordMeetsRequirements(password)) {
      setStatus('error');
      setMessage('Your password must include an uppercase letter, a lowercase letter, a number, and a symbol (e.g. !@#$).');
      return;
    }

    if (mode === 'sign_up') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: initialRedirect
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(initialRedirect)}`
            : `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        if (error.message.includes('already registered')) {
          setMode('sign_in');
          setStatus('idle');
          setInfoMessage('An account with this email already exists. Enter your password below to sign in.');
        } else {
          setStatus('error');
          setMessage(error.message);
        }
      } else if (!data.user?.identities?.length) {
        // Supabase silently "succeeded" but sent no real confirmation — duplicate account
        setMode('sign_in');
        setStatus('idle');
        setInfoMessage('An account with this email already exists. Enter your password below to sign in.');
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
        window.location.href = initialRedirect || '/';
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
            onClick={() => { setStatus('idle'); setMode('sign_in'); setMessage(''); setInfoMessage(''); }}
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

      {/* Informational banner (e.g. duplicate email auto-switch) */}
      {infoMessage && (
        <div style={{
          display: 'flex',
          gap: '0.625rem',
          alignItems: 'flex-start',
          padding: '0.75rem 1rem',
          background: 'rgba(0,63,138,0.06)',
          border: '1px solid rgba(0,63,138,0.2)',
          borderRadius: '4px',
          marginBottom: '1.5rem',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '0.7rem',
            color: 'var(--color-columbia)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {infoMessage}
          </p>
        </div>
      )}

      {/* Email/password form */}
      <form onSubmit={handleEmailAuth}>
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="auth-email" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-ink)' }}>
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
              style={{
                paddingLeft: '2.5rem',
                fontFamily: 'var(--font-body)',
                borderRadius: '8px',
                border: '1px solid var(--color-mist)',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                backgroundColor: '#FAFAF9',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label" htmlFor="auth-password" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-ink)' }}>
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
              style={{
                paddingLeft: '2.5rem',
                fontFamily: 'var(--font-body)',
                borderRadius: '8px',
                border: '1px solid var(--color-mist)',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                backgroundColor: '#FAFAF9',
              }}
            />
          </div>

          {/* Password requirements — only shown during sign-up once the user starts typing */}
          {mode === 'sign_up' && password.length > 0 && (
            <PasswordRequirements password={password} />
          )}
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
          style={{
            width: '100%',
            opacity: status === 'loading' ? 0.7 : 1,
            borderRadius: '8px',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            padding: '0.875rem',
            marginTop: '0.5rem',
          }}
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
              onClick={() => { setMode('sign_up'); setMessage(''); setInfoMessage(''); setStatus('idle'); }}
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
              onClick={() => { setMode('sign_in'); setMessage(''); setInfoMessage(''); setStatus('idle'); }}
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

// ─── Password helpers ────────────────────────────────────────────────────────

const REQUIREMENTS = [
  { key: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'digit', label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { key: 'symbol', label: 'Symbol (e.g. !@#$)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function passwordMeetsRequirements(p: string) {
  return REQUIREMENTS.every(r => r.test(p));
}

function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul
      style={{
        margin: '0.5rem 0 0',
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
      }}
    >
      {REQUIREMENTS.map(req => {
        const met = req.test(password);
        return (
          <li
            key={req.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-body), serif',
              color: met ? '#1C5C3A' : 'var(--color-text-muted)',
              transition: 'color 0.15s',
            }}
          >
            {met
              ? <Check size={11} color="#1C5C3A" strokeWidth={2.5} />
              : <X size={11} color="var(--color-text-muted)" strokeWidth={2} />
            }
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}
