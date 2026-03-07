'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { DEV_BYPASS } from '@/lib/dev-bypass';

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(DEV_BYPASS);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Initial check
    void supabase.auth.getUser().then((res: { data: { user: any } }) => {
      setIsLoggedIn(!!res.data.user || (DEV_BYPASS && !res.data.user));
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setIsLoggedIn(!!session?.user || DEV_BYPASS);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      <p
        style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: '0.68rem',
          letterSpacing: '0.01em',
          color: 'var(--color-text-muted)',
        }}
      >
        Built for the Columbia community. Maintained by{' '}
        <a
          href={isLoggedIn ? "/?open=will" : "https://essilfie.com"}
          target={isLoggedIn ? undefined : "_blank"}
          rel={isLoggedIn ? undefined : "noopener noreferrer"}
          style={{ color: 'var(--color-columbia)', textDecoration: 'none' }}
        >
          Will Essilfie
        </a>
        {' '}© 2026
      </p>
    </footer>
  );
}
