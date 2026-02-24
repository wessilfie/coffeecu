export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid #ccd9e8',
        padding: '2.25rem 1.5rem',
        textAlign: 'center',
        background: 'linear-gradient(to bottom, #f7f3eb, #f2ecdf)',
      }}
    >
      <nav
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <a
          href="mailto:hi@coffeeatcu.com"
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.875rem',
            color: 'var(--color-columbia)',
            textDecoration: 'none',
          }}
        >
          Contact
        </a>
        <a
          href="/#how-it-works"
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.875rem',
            color: 'var(--color-columbia)',
            textDecoration: 'none',
          }}
        >
          How it works
        </a>
      </nav>
      <p
        style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: '0.68rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        Built for the Columbia community. Maintained by{' '}
        <a
          href="https://essilfie.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-columbia)', textDecoration: 'none' }}
        >
          Will Essilfie
        </a>
        {' '}© 2026
      </p>
    </footer>
  );
}
