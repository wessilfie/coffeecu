import Link from 'next/link';

export default function NotFound() {
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
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <p
          className="label-mono"
          style={{
            color: 'var(--color-columbia)',
            marginBottom: '0.75rem',
            fontSize: '0.65rem',
          }}
        >
          404 — Page not found
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--color-ink)',
            margin: '0 0 1rem',
            lineHeight: 1.1,
          }}
        >
          Lost on campus?
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '1rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.65,
            marginBottom: '2rem',
          }}
        >
          This page doesn&rsquo;t exist. Maybe the coffee meeting already happened.
        </p>

        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
