export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--color-mist)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-courier), monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        Made with love for the Columbia community. Maintained by{' '}
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
