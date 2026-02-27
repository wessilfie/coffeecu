import Link from 'next/link';
import { Mail } from 'lucide-react';

export const metadata = {
  title: 'Verify Your Email — Coffee@CU',
};

export default function VerifyPage() {
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
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--color-columbia-pale)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.75rem',
          }}
        >
          <Mail size={28} color="var(--color-columbia)" />
        </div>

        {/* Heading */}
        <p
          className="label-mono"
          style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}
        >
          One more step
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display), serif',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: 400,
            color: 'var(--color-ink)',
            margin: '0 0 1.25rem',
            lineHeight: 1.15,
          }}
        >
          Check your Columbia email
        </h1>

        {/* Body */}
        <div
          style={{
            background: 'var(--color-white)',
            border: '1px solid var(--color-mist)',
            borderRadius: '6px',
            padding: '1.75rem 2rem',
            boxShadow: '0 4px 24px rgba(26,20,16,0.06)',
            textAlign: 'left',
            marginBottom: '1.5rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body), serif',
              fontSize: '0.9375rem',
              color: 'var(--color-ink)',
              lineHeight: 1.65,
              margin: '0 0 1rem',
            }}
          >
            We&rsquo;ve sent a verification link to your Columbia email address.
            Click it to confirm your account and continue to your profile.
          </p>

          <hr className="divider" style={{ margin: '1rem 0' }} />

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem',
            }}
          >
            {[
              'The email is from Coffee@CU — check your inbox.',
              'If you don\'t see it within a minute, check your spam or junk folder.',
              'The link expires after 24 hours.',
            ].map((tip, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: '0.625rem',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  className="label-mono"
                  style={{
                    color: 'var(--color-columbia)',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body), serif',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.55,
                  }}
                >
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Already verified?{' '}
          <Link
            href="/login"
            style={{
              color: 'var(--color-columbia)',
              textDecoration: 'underline',
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
