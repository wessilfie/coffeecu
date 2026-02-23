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
        Made for the Columbia community by{' '}
        <a
          href="https://adicu.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-columbia)', textDecoration: 'none' }}
        >
          ADI
        </a>{' '}
        &amp;{' '}
        <a
          href="https://www.columbiaspectator.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-columbia)', textDecoration: 'none' }}
        >
          The Lion
        </a>
        {' '}— © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
