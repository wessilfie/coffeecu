'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { DEV_BYPASS } from '@/lib/dev-bypass';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

const LION_AVATAR = '/img/LionMascotblack.png';

export default function Nav() {
  const [user, setUser] = useState<User | null>(DEV_BYPASS ? ({ id: 'dev' } as User) : null);
  const [loading, setLoading] = useState(!DEV_BYPASS);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const communitiesRef = useRef<HTMLDivElement>(null);
  const [communitiesOpen, setCommunitiesOpen] = useState(false);
  const supabase = getSupabaseClient();

  // Auth state
  useEffect(() => {
    if (DEV_BYPASS) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) setProfileImageUrl(null);
    });
    supabase.auth.getUser().then((res: { data: { user: User | null } }) => {
      setUser(res.data.user);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch profile image — draft takes precedence over published (matches edit profile form)
  useEffect(() => {
    if (!user || DEV_BYPASS) return;
    (async () => {
      const { data: draft } = await supabase
        .from('draft_profiles')
        .select('image_url')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { image_url?: string | null } | null };
      if (draft?.image_url) { setProfileImageUrl(draft.image_url); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('image_url')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { image_url?: string | null } | null };
      setProfileImageUrl(profile?.image_url ?? null);
    })();
  }, [user, supabase]);

  // Sync nav avatar when profile form uploads a new photo
  useEffect(() => {
    const handler = (e: Event) => {
      const url = (e as CustomEvent<{ url: string }>).detail?.url;
      if (url) setProfileImageUrl(url);
    };
    window.addEventListener('profile-photo-updated', handler);
    return () => window.removeEventListener('profile-photo-updated', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (communitiesRef.current && !communitiesRef.current.contains(e.target as Node)) {
        setCommunitiesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    if (DEV_BYPASS) {
      window.location.href = '/?guest=1';
      return;
    }
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(0, 52, 120, 0.98)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.32)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '64px',
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
            width={34}
            height={34}
            style={{ borderRadius: '6px', border: '1px solid rgba(255,255,255,0.22)' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display), serif',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '0.02em',
              textShadow: '0 1px 2px rgba(0,0,0,0.22)',
            }}
          >
            Coffee@CU
          </span>
        </Link>

        {/* Right nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {!loading && (
            <>
              {user ? (
                /* ——— Logged-in: communities dropdown + avatar + dropdown ——— */
                <>
                {/* Your Communities dropdown */}
                <div ref={communitiesRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setCommunitiesOpen(prev => !prev)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body), serif',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: communitiesOpen ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.82)',
                      padding: 0,
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,1)')}
                    onMouseLeave={e => { if (!communitiesOpen) e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; }}
                  >
                    Your Communities
                    <ChevronDown size={13} style={{ transition: 'transform 150ms ease', transform: communitiesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>

                  {communitiesOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 'calc(100% + 0.625rem)',
                        background: '#ffffff',
                        border: '1px solid #d4dfec',
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px rgba(0,20,60,0.16)',
                        minWidth: '210px',
                        zIndex: 100,
                        overflow: 'hidden',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.65rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#8a9bb0',
                          padding: '0.625rem 1rem 0.25rem',
                          margin: 0,
                        }}
                      >
                        Your communities
                      </p>
                      <Link
                        href="/"
                        onClick={() => setCommunitiesOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.625rem 1rem 0.75rem',
                          fontFamily: 'var(--font-body), serif',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'var(--color-ink)',
                          textDecoration: 'none',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f6f9fd')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--color-columbia)',
                            flexShrink: 0,
                          }}
                        />
                        Columbia University
                      </Link>
                    </div>
                  )}
                </div>

                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setDropdownOpen(prev => !prev)}
                    aria-label="Account menu"
                    aria-expanded={dropdownOpen}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: dropdownOpen
                        ? '2px solid rgba(255,255,255,0.95)'
                        : '2px solid rgba(255,255,255,0.5)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: profileImageUrl ? 'rgba(0,40,100,0.6)' : '#ffffff',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 150ms ease',
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={profileImageUrl ?? LION_AVATAR}
                      alt="Your profile"
                      width={44}
                      height={44}
                      style={{
                        objectFit: profileImageUrl ? 'cover' : 'contain',
                        padding: profileImageUrl ? 0 : '2px',
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 0.625rem)',
                        background: '#ffffff',
                        border: '1px solid #d4dfec',
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px rgba(0,20,60,0.16)',
                        minWidth: '170px',
                        zIndex: 100,
                        overflow: 'hidden',
                      }}
                    >
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'block',
                          padding: '0.75rem 1rem',
                          fontFamily: 'var(--font-body), serif',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'var(--color-ink)',
                          textDecoration: 'none',
                          borderBottom: '1px solid #edf3fa',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f6f9fd')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Edit Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          fontFamily: 'var(--font-body), serif',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#6b5e52',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f6f9fd')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
                </>
              ) : (
                /* ——— Logged-out: how it works + sign in ——— */
                <>
                  <Link
                    href="/#how-it-works"
                    style={{
                      fontFamily: 'var(--font-body), serif',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.82)',
                      textDecoration: 'none',
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,1)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.82)')}
                  >
                    How it works
                  </Link>
                  <Link
                    href="/login"
                    className="btn-primary"
                    style={{
                      fontFamily: 'var(--font-body), serif',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      letterSpacing: '0.01em',
                      textTransform: 'none',
                      padding: '0.6rem 1.2rem',
                      background: '#f2ebde',
                      color: '#003f8a',
                    }}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
