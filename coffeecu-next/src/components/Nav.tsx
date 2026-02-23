'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

// ============================================================
// Nav — Limestone & Blue
// Clean, minimal header. The Columbia identity speaks quietly.
// ============================================================

export default function Nav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getUser().then((res: { data: { user: User | null } }) => {
      setUser(res.data.user);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--color-columbia)',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
          }}
        >
          <Image
            src="/img/logo.png"
            alt="Coffee@CU"
            width={32}
            height={32}
            style={{ borderRadius: '4px' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: '1.375rem',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.95)',
              letterSpacing: '0.01em',
            }}
          >
            Coffee@CU
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link
            href="mailto:coffeecu@adicu.com?subject=Coffee@CU Question"
            style={{
              fontFamily: 'var(--font-courier), monospace',
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,1)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          >
            Contact
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    style={{
                      fontFamily: 'var(--font-courier), monospace',
                      fontSize: '0.7rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.7)',
                      textDecoration: 'none',
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,1)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      fontFamily: 'var(--font-courier), monospace',
                      fontSize: '0.7rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,0.7)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,1)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary"
                  style={{ fontSize: '0.68rem' }}
                >
                  Sign In
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
