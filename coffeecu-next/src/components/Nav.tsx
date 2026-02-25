'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import { DEV_BYPASS } from '@/lib/dev-bypass';
import { getViewerCommunities, COMMUNITY_CONFIG } from '@/lib/constants';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

const LION_AVATAR = '/img/LionMascotblack.png';

// ——— Communities dropdown — isolated so useSearchParams is inside Suspense ———
function CommunitiesDropdown({ viewerSchool }: { viewerSchool: string | null }) {
  const searchParams = useSearchParams();
  const activeCommunitySlug = searchParams.get('community') ?? 'columbia';
  const viewerCommunities = getViewerCommunities(viewerSchool);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeLabel = COMMUNITY_CONFIG[activeCommunitySlug]?.label ?? 'Columbia University';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(prev => !prev)}
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
          color: open ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.82)',
          padding: 0,
          transition: 'color 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,1)')}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; }}
      >
        {activeLabel}
        <ChevronDown
          size={13}
          style={{ transition: 'transform 150ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 'calc(100% + 0.625rem)',
            background: '#ffffff',
            border: '1px solid #d4dfec',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,20,60,0.16)',
            minWidth: '230px',
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
          {viewerCommunities.map(slug => {
            const config = COMMUNITY_CONFIG[slug];
            const href = slug === 'columbia' ? '/' : `/?community=${slug}`;
            const isActive = slug === activeCommunitySlug;

            return (
              <Link
                key={slug}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  fontFamily: 'var(--font-body), serif',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-columbia)' : 'var(--color-ink)',
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
                    background: isActive ? 'var(--color-columbia)' : '#b8cfe8',
                    flexShrink: 0,
                  }}
                />
                {config?.label ?? slug}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const [user, setUser] = useState<User | null>(DEV_BYPASS ? ({ id: 'dev' } as User) : null);
  const [loading, setLoading] = useState(!DEV_BYPASS);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [viewerSchool, setViewerSchool] = useState<string | null>(DEV_BYPASS ? 'CC' : null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseClient();

  // Auth state
  useEffect(() => {
    if (DEV_BYPASS) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) { setProfileImageUrl(null); setViewerSchool(null); }
    });
    supabase.auth.getUser().then((res: { data: { user: User | null } }) => {
      setUser(res.data.user);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch profile image + viewer's school for the communities dropdown
  // Draft image takes precedence over published (matches edit profile form)
  useEffect(() => {
    if (!user || DEV_BYPASS) return;
    (async () => {
      const { data: draft } = await supabase
        .from('draft_profiles')
        .select('image_url, school')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { image_url?: string | null; school?: string | null } | null };

      if (draft?.image_url) setProfileImageUrl(draft.image_url);
      if (draft?.school) setViewerSchool(draft.school);

      // Skip profile query if both image and school resolved from draft
      if (draft?.image_url && draft?.school) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('image_url, school')
        .eq('user_id', user.id)
        .maybeSingle() as { data: { image_url?: string | null; school?: string | null } | null };

      if (!draft?.image_url) setProfileImageUrl(profile?.image_url ?? null);
      if (!draft?.school) setViewerSchool(profile?.school ?? null);
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

  // Close account dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
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
                /* ——— Logged-in: communities dropdown + avatar menu ——— */
                <>
                  {/* Communities dropdown — useSearchParams contained inside Suspense */}
                  <Suspense
                    fallback={
                      <span
                        style={{
                          fontFamily: 'var(--font-body), serif',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.82)',
                        }}
                      >
                        Columbia University
                      </span>
                    }
                  >
                    <CommunitiesDropdown viewerSchool={viewerSchool} />
                  </Suspense>

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

                    {/* Account dropdown */}
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
