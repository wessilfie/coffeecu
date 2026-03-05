'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronRight } from 'lucide-react';
import ColumbiaCrown from '@/components/ColumbiaCrown';
import ProfileCard from '@/components/ProfileCard';
import ProfileDrawer from '@/components/ProfileDrawer';
import Image from 'next/image';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { DEV_BYPASS, DEV_MOCK_PROFILES } from '@/lib/dev-bypass';
import { PARALLAX_IMAGES, CBS_CLUBS, MAJORS, SCHOOLS } from '@/lib/constants';
import type { Profile, ProfileFilters } from '@/types';

const PAGE_SIZE = 12;

interface Props {
  initialProfiles: Profile[];
  meetingCount: number;
  isLoggedIn: boolean;
  userId: string | null;
  sentRequests: { id: string; date: string }[];
  hasPublishedProfile: boolean;
}

export default function HomeClient({ initialProfiles, meetingCount, isLoggedIn, userId, sentRequests, hasPublishedProfile }: Props) {
  // Supabase redirects both successful tokens and errors to the Site URL (homepage) as a hash.
  // Detect either case and forward to /auth/callback which handles both correctly.
  const [redirecting, setRedirecting] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.slice(1);
    if (!hash) return false;
    const params = new URLSearchParams(hash);
    return !!(params.get('access_token') || params.get('error'));
  });

  useEffect(() => {
    if (!redirecting) return;
    window.location.href = '/auth/callback' + window.location.hash;
  }, [redirecting]);

  if (redirecting) return null;

  // Anti-scraping: show a login gate instead of profiles for unauthenticated users
  // The hero and meeting count remain public (marketing), but profiles are gated.
  if (!isLoggedIn) {
    return <LoginGate meetingCount={meetingCount} heroImage={PARALLAX_IMAGES[0]} />;
  }

  // Logged-in but no published profile — prompt them to complete their profile first
  if (!hasPublishedProfile) {
    return <ProfileGate />;
  }

  return <AuthenticatedHome initialProfiles={initialProfiles} meetingCount={meetingCount} userId={userId} sentRequests={sentRequests} />;
}

// ——— Gate for logged-in users who haven't published yet ———
function ProfileGate() {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: 'var(--color-limestone)',
      }}
    >
      <div style={{ maxWidth: '520px' }}>
        <h1
          className="heading-display"
          style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: 'var(--color-ink)', marginBottom: '1rem' }}
        >
          The community is waiting for you!
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
          Complete your profile to see the community and send/receive your first Coffee@CU request.
        </p>
        <a
          href="/profile"
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', padding: '0.875rem 2rem' }}
        >
          Complete your profile →
        </a>
      </div>
    </main>
  );
}

// ——— Email signup input — reusable across hero + final CTA ———
function EmailSignupInput({ darkBackground = false }: { darkBackground?: boolean }) {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    router.push(`/login?email=${encodeURIComponent(email)}&mode=signup`);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="UNI@columbia.edu"
          style={{
            flex: '1',
            minWidth: '220px',
            maxWidth: '320px',
            padding: '0.9375rem 1rem',
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.875rem',
            borderRadius: '4px',
            border: darkBackground ? '1px solid rgba(255,255,255,0.35)' : '1px solid var(--color-mist)',
            background: darkBackground ? 'rgba(255,255,255,0.12)' : 'var(--color-white)',
            color: darkBackground ? 'rgba(255,255,255,0.95)' : 'var(--color-ink)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{
            fontSize: '0.8rem',
            padding: '0.9375rem 1.75rem',
            letterSpacing: '0.08em',
            ...(darkBackground ? { background: '#f2ebde', color: '#003f8a' } : {}),
          }}
        >
          Get started →
        </button>
      </form>
      <p style={{ marginTop: '0.875rem', textAlign: 'center' }}>
        <a
          href="/login"
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.875rem',
            color: darkBackground ? 'rgba(228,239,251,0.72)' : 'var(--color-columbia)',
            textDecoration: 'none',
          }}
        >
          Already a member? Sign in →
        </a>
      </p>
    </div>
  );
}

// ——— Login gate / landing page for unauthenticated visitors ———
function LoginGate({ meetingCount, heroImage }: { meetingCount: number; heroImage: string }) {
  const testimonials = [
    {
      quote: "I met one of my closest friends on Coffee@CU. We're still close nearly a decade later.",
      author: 'Columbia alum',
      school: 'Met at Hungarian Pastry Shop'
    },
    {
      quote: "I'm getting married to someone I met for coffee once on here.",
      author: 'Columbia alum',
      school: 'Met at Joe Coffee (Noco)'
    },
    {
      quote: "I've wanted to find other folks looking to get into entrepreneurship. Coffee@CU is helping me meet others in that space I might not have met otherwise.",
      author: "CBS '26 MBA candidate",
      school: 'Met at Kuro Kuma'
    },
    {
      quote: 'I already go to Dear Mama midday; will be nice to have some others to meet over there.',
      author: "CBS '26 EMBA candidate",
      school: 'Met at Pisticci'
    }
  ];

  return (
    <main style={{ flex: 1, background: 'var(--color-limestone)' }}>
      {/* ————————————————————————————————————————
          HERO — Dynamic Asymmetrical Layout
      ———————————————————————————————————————— */}
      <section
        style={{
          minHeight: 'auto',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#FAFAFA',
          backgroundImage: `url('/img/apsia-columbia-campus.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'normal',
          paddingTop: '2rem',
          paddingBottom: '2rem',
        }}
      >
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))',
          gap: '2rem',
          alignItems: 'center',
        }}>
          {/* Left: Copy & Action */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.4)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            maxWidth: '100%'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: 'var(--color-columbia-pale)',
              color: 'var(--color-columbia)',
              borderRadius: '99px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              marginBottom: '1.5rem'
            }}>
              Over {meetingCount.toLocaleString()} conversations started at Columbia
            </div>

            <h1
              className="heading-display"
              style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: 'var(--color-ink)',
                marginBottom: '1rem',
                lineHeight: 1.05,
                letterSpacing: '-0.02em'
              }}
            >
              Meet remarkable people at Columbia.
            </h1>

            <div style={{ marginBottom: '1.5rem' }}>
              <EmailSignupInput />
            </div>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
                maxWidth: '650px'
              }}
            >
              Coffee@CU helps students, alumni, and faculty across every school meet each other. Real conversations. No anonymous reach-outs.
            </p>
          </div>

          {/* Right: Product Visual Mockup */}
          <div style={{ position: 'relative', perspective: '1200px', display: 'flex', justifyContent: 'center', transformStyle: 'preserve-3d' }}>
            <style>{`
              @keyframes float-bg-bottom {
                0%, 100% { transform: translate3d(50px, -25px, -120px) rotateZ(8deg) rotateY(-10deg); }
                50% { transform: translate3d(50px, -15px, -120px) rotateZ(8deg) rotateY(-10deg); }
              }
              @keyframes float-bg-mid {
                0%, 100% { transform: translate3d(-40px, -15px, -60px) rotateZ(-5deg) rotateY(-12deg); }
                50% { transform: translate3d(-40px, -25px, -60px) rotateZ(-5deg) rotateY(-12deg); }
              }
              @keyframes float-main {
                0%, 100% { transform: translateY(0px); box-shadow: 0 24px 48px -12px rgba(0,20,60,0.15); }
                50% { transform: translateY(-8px); box-shadow: 0 32px 56px -12px rgba(0,20,60,0.2); }
              }
            `}</style>

            {/* Stacked Card 2 (Bottom Layer) */}
            <div style={{
              position: 'absolute',
              width: '100%',
              maxWidth: '320px',
              background: '#fdfbf6',
              border: '1px solid #d9e4f0',
              borderRadius: '8px',
              transformOrigin: 'center center',
              transform: 'translate3d(50px, -25px, -120px) rotateZ(8deg) rotateY(-10deg)',
              opacity: 0.6,
              zIndex: 0,
              boxShadow: '0 20px 40px -10px rgba(0,20,60,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'float-bg-bottom 8s ease-in-out infinite'
            }}>
              <div style={{ position: 'relative', paddingBottom: '122%', overflow: 'hidden', background: 'rgba(0,0,0,0.05)' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', background: 'linear-gradient(to top, rgba(0,42,90,0.2) 0%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.85rem' }}>
                  <div style={{ height: '28px', width: '140px', background: 'rgba(255,255,255,0.4)', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ padding: '0.78rem 0.85rem 0.9rem', height: '7rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <div style={{ height: '18px', width: '120px', background: 'var(--color-ink)', opacity: 0.1, borderRadius: '2px' }} />
                  <div style={{ height: '18px', width: '40px', background: 'var(--color-ink)', opacity: 0.1, borderRadius: '2px' }} />
                </div>
                <div style={{ height: '12px', width: '40px', background: 'var(--color-text-muted)', opacity: 0.1, borderRadius: '2px', marginTop: '4px' }} />
                <div style={{ height: '14px', width: '90%', background: 'var(--color-ink)', opacity: 0.15, borderRadius: '2px', marginTop: 'auto' }} />
                <div style={{ height: '14px', width: '70%', background: 'var(--color-ink)', opacity: 0.15, borderRadius: '2px' }} />
              </div>
            </div>

            {/* Stacked Card 1 (Middle Layer) */}
            <div style={{
              position: 'absolute',
              width: '100%',
              maxWidth: '320px',
              background: '#fdfbf6',
              border: '1px solid #d9e4f0',
              borderRadius: '8px',
              transformOrigin: 'center center',
              transform: 'translate3d(-40px, -15px, -60px) rotateZ(-5deg) rotateY(-12deg)',
              opacity: 0.8,
              zIndex: 1,
              boxShadow: '0 30px 60px -15px rgba(0,30,80,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'float-bg-mid 7s ease-in-out infinite'
            }}>
              <div style={{ position: 'relative', paddingBottom: '122%', overflow: 'hidden', background: 'rgba(0,0,0,0.08)' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%', background: 'linear-gradient(to top, rgba(0,42,90,0.3) 0%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.85rem' }}>
                  <div style={{ height: '28px', width: '180px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ padding: '0.78rem 0.85rem 0.9rem', height: '7rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <div style={{ height: '18px', width: '140px', background: 'var(--color-ink)', opacity: 0.15, borderRadius: '2px' }} />
                  <div style={{ height: '18px', width: '50px', background: 'var(--color-ink)', opacity: 0.15, borderRadius: '2px' }} />
                </div>
                <div style={{ height: '12px', width: '45px', background: 'var(--color-text-muted)', opacity: 0.15, borderRadius: '2px', marginTop: '4px' }} />
                <div style={{ height: '14px', width: '95%', background: 'var(--color-ink)', opacity: 0.2, borderRadius: '2px', marginTop: 'auto' }} />
                <div style={{ height: '14px', width: '80%', background: 'var(--color-ink)', opacity: 0.2, borderRadius: '2px' }} />
              </div>
            </div>

            {/* Main Profile Card (Top Layer) */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              maxWidth: '320px',
              background: '#fdfbf6',
              border: '1px solid #d9e4f0',
              borderRadius: '8px',
              boxShadow: '0 24px 48px -12px rgba(0,20,60,0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'float-main 6s ease-in-out infinite'
            }}>
              <div style={{ position: 'relative', paddingBottom: '122%', overflow: 'hidden' }}>
                <img
                  src="https://hpgieevpapwqitlsegqg.supabase.co/storage/v1/object/public/profile-photos/profiles/5b83ec3f-19ae-4189-9585-2f89601c5120/avatar.png?t=1771944923246"
                  alt="Will Essilfie"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '42%',
                    background: 'linear-gradient(to top, rgba(0,42,90,0.72) 0%, transparent 100%)',
                  }}
                />
                <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.85rem', right: '0.85rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display), serif', fontSize: '1.3rem', fontWeight: 600, color: 'white', letterSpacing: '0.01em', lineHeight: 1.2, margin: 0 }}>
                    Will
                  </h3>
                </div>
              </div>

              <div style={{ padding: '0.78rem 0.85rem 0.9rem', height: '7rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', minHeight: '1.5rem', marginBottom: '0.45rem' }}>
                  <span style={{ background: '#D4DFF0', color: '#1A3060', fontFamily: 'var(--font-mono), monospace', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '2px' }}>
                    COLUMBIA BUSINESS SCHOOL
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '2px', background: '#E8EEF6', color: '#2A4A70' }}>
                    EMBA
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.6rem', letterSpacing: '0.06em', color: 'var(--color-text-muted)', width: '100%', marginTop: '0.3rem' }}>
                    Year 2
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.82rem', color: '#2f2a24', lineHeight: 1.5, margin: 0, flex: 1 }}>
                  “Chat with me about building consumer apps like Coffee@CU or about seeing a Broadway show”
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ————————————————————————————————————————
          SCHOOLS MARQUEE — Higher conversion, Interactive
      ———————————————————————————————————————— */}
      <div
        style={{
          background: 'var(--color-white)',
          borderTop: '1px solid var(--color-mist)',
          borderBottom: '1px solid var(--color-mist)',
          padding: '1.5rem 0',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          position: 'relative',
        }}
      >
        <style>{`
          @keyframes cu-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .marquee-hover:hover .marquee-track {
            animation-play-state: paused;
          }
          .school-pill {
            display: inline-flex;
            align-items: center;
            padding: 0.6rem 1.25rem;
            background: var(--color-limestone);
            border: 1px solid var(--color-mist);
            border-radius: 99px;
            font-family: var(--font-body);
            font-size: 0.875rem;
            color: var(--color-ink-soft);
            text-decoration: none;
            transition: all 0.25s ease;
            margin: 0 0.75rem;
            position: relative;
            overflow: hidden;
          }
          .school-pill:hover {
            border-color: var(--color-columbia-lt);
            color: var(--color-columbia);
            background: var(--color-columbia-pale);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -10px rgba(26, 81, 200, 0.3);
          }
          .school-pill .hover-text {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-columbia);
            color: white;
            font-weight: 600;
            opacity: 0;
            transform: translateY(100%);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .school-pill:hover .hover-text {
            opacity: 1;
            transform: translateY(0);
          }
          .school-pill:hover .default-text {
            opacity: 0;
            transform: translateY(-100%);
          }
          .default-text {
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
        `}</style>

        <div className="marquee-hover" style={{ display: 'flex' }}>
          <div className="marquee-track" style={{ display: 'inline-flex', animation: 'cu-marquee 90s linear infinite' }}>
            {[...SCHOOLS, ...SCHOOLS, ...SCHOOLS].map((school, i) => (
              <Link
                key={`${school.value}-${i}`}
                href={`/login?school=${school.value}&mode=signup`}
                className="school-pill"
              >
                <span className="default-text">{school.label}</span>
                <span className="hover-text">Join from {school.value} →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ————————————————————————————————————————
          BENTO BOX FEATURES
      ———————————————————————————————————————— */}
      <section id="how-it-works" style={{ padding: 'clamp(5rem, 8vw, 7rem) 1.5rem', background: 'var(--color-white)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: 'var(--color-ink)',
                marginBottom: '1rem',
                lineHeight: 1.1,
                letterSpacing: '-0.01em'
              }}
            >
              Connect with the people who could change your trajectory at Columbia.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.125rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Columbia is bigger than your corner of campus. With Coffee@CU you can meet new people across the Columbia University community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6" style={{ gridAutoRows: 'minmax(280px, auto)' }}>
            {/* Bento Item 1: Wide */}
            <div className="col-span-1 md:col-span-8 flex flex-col md:flex-row items-center justify-between rounded-[24px] border border-[var(--color-mist)] p-8 lg:p-10 gap-8" style={{ background: 'linear-gradient(145deg, var(--color-limestone) 0%, var(--color-white) 100%)' }}>
              <div className="w-full md:w-[55%]">
                <h3 className="mb-3 text-3xl text-[var(--color-ink)] font-display" style={{ fontFamily: 'var(--font-display)' }}>Meet new people and expand your horizons.</h3>
                <p className="font-body text-[var(--color-text-muted)] leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>Send a personal note explaining exactly what you'd like to discuss. No awkward cold emails or anonymous messages.</p>
              </div>
              <div className="w-full md:w-[45%] bg-white border border-[var(--color-mist)] rounded-2xl shadow-lg p-6">
                <p className="text-xs mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>Message Preview</p>
                <div className="inline-block p-4 rounded-xl rounded-br-sm text-sm leading-relaxed" style={{ background: 'var(--color-columbia-pale)', color: 'var(--color-columbia)' }}>
                  "Hey Taylor! I'm producing a new short film and would love to grab a tea and talk about your Directing background"
                </div>
              </div>
            </div>

            {/* Bento Item 2: Square */}
            <div className="col-span-1 md:col-span-4 flex flex-col justify-between rounded-[24px] p-8 lg:p-10 text-white" style={{ background: 'var(--color-columbia)' }}>
              <div>
                <img
                  src="/img/logo.png"
                  alt="Coffee@CU"
                  width="56"
                  height="56"
                  style={{
                    marginBottom: '1rem',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.22)'
                  }}
                />
                <h3 className="mb-3 text-[1.75rem]" style={{ fontFamily: 'var(--font-display)' }}>Just for Columbia.</h3>
                <p className="text-[0.9375rem] leading-relaxed opacity-90" style={{ fontFamily: 'var(--font-body)' }}>Coffee@CU is currently available exclusively to members of the Columbia community and requires a @columbia.edu or @barnard.edu email.</p>
              </div>
            </div>

            {/* Bento Item 3: Square */}
            <div className="col-span-1 md:col-span-4 rounded-[24px] border border-[var(--color-mist)] p-8 lg:p-10" style={{ background: 'var(--color-limestone)' }}>
              <Search size={32} color="var(--color-columbia)" className="mb-6" />
              <h3 className="mb-3 text-[1.75rem] text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>Find your people.</h3>
              <p className="text-[0.9375rem] text-[var(--color-text-muted)] leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>Search by school, major, interests, or availability to find exactly who you're looking for.</p>
            </div>

            {/* Bento Item 4: Wide */}
            <div className="col-span-1 md:col-span-8 rounded-[24px] border border-[var(--color-mist)] p-8 lg:p-10" style={{ background: 'var(--color-limestone)' }}>
              <h3 className="mb-6 text-[2rem] text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-display)' }}>Every year. Every path.</h3>
              <div className="flex flex-wrap gap-2">
                {['First-Years', 'Seniors', 'MBA Candidates', 'Law Students', 'PhD Researchers', 'Faculty', 'Alumni', 'Journalism Masters'].map(tag => (
                  <span key={tag} className="rounded-full border border-mist bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-slate-50" style={{ fontFamily: 'var(--font-mono)' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ————————————————————————————————————————
          TESTIMONIALS
      ———————————————————————————————————————— */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--color-limestone)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: 'var(--color-ink)',
              }}
            >
              Real quotes from Coffee@CU members
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {testimonials.slice(0, 3).map((t, i) => (
              <div key={i} style={{ padding: '2rem', background: 'white', borderRadius: '16px', border: '1px solid var(--color-mist)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-ink)', lineHeight: 1.5, marginBottom: '1.5rem' }}>"{t.quote}"</p>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-ink)' }}>{t.author}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.school}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————————————————————————————
          FINAL CTA
      ———————————————————————————————————————— */}
      <section
        style={{
          position: 'relative',
          background: 'var(--color-columbia)',
          padding: 'clamp(5rem, 8vw, 7rem) 1.5rem',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
          <h2
            className="heading-display"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'white',
              marginBottom: '1.5rem',
              lineHeight: 1.1,
            }}
          >
            Your next great conversation is an email away.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.125rem',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '2.5rem',
              lineHeight: 1.6,
            }}
          >
            Sign up with your @columbia.edu or @barnard.edu email. Two minutes to set up your profile, then start meeting people who'll change how you see your time at Columbia.
          </p>
          <EmailSignupInput darkBackground />
        </div>
      </section>
    </main>
  );
}

// ——— Unified Search Typeahead ———
type SuggestionType = 'name' | 'club' | 'major';
interface Suggestion { type: SuggestionType; label: string; }

function MainSearchTypeahead({
  value,
  onSelect,
  initialProfiles,
  onRandomSelect
}: {
  value: string;
  onSelect: (val: string, type: SuggestionType | 'text') => void;
  initialProfiles: Profile[];
  onRandomSelect: () => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group suggestions
  const term = inputValue.trim().toLowerCase();

  const suggestions: Suggestion[] = [];
  if (term.length > 1) {
    // 1. Names (from currently loaded initial profiles)
    const matchedNames = initialProfiles
      .filter(p => p.name.toLowerCase().includes(term))
      .map(p => p.name);
    // deduplicate
    Array.from(new Set(matchedNames)).slice(0, 3).forEach(name => {
      suggestions.push({ type: 'name', label: name });
    });

    // 2. Clubs
    const matchedClubs = CBS_CLUBS.filter(c => c.toLowerCase().includes(term)).slice(0, 4);
    matchedClubs.forEach(c => suggestions.push({ type: 'club', label: c }));

    // 3. Majors
    const matchedMajors = MAJORS.filter(m => m.toLowerCase().includes(term)).slice(0, 4);
    matchedMajors.forEach(m => suggestions.push({ type: 'major', label: m }));
  }

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (sug: Suggestion) => {
    setInputValue(sug.label);
    setOpen(false);
    onSelect(sug.label, sug.type);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setOpen(false);
      onSelect(inputValue, 'text');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: '1', minWidth: '280px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: '1', display: 'flex', alignItems: 'center' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '1rem',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Search by name, clubs, major…"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            setOpen(true);
            if (e.target.value === '') {
              onSelect('', 'text');
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (inputValue.trim().length > 1) setOpen(true); }}
          style={{
            paddingLeft: '2.75rem',
            paddingRight: inputValue ? '2.5rem' : '1rem',
            fontSize: '0.9375rem',
            borderRadius: '99px',
            border: '1px solid var(--color-mist)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
            height: '44px',
            width: '100%'
          }}
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => { setInputValue(''); onSelect('', 'text'); setOpen(false); }}
            style={{
              position: 'absolute',
              right: '1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '1rem',
              padding: '0.25rem',
            }}
          >
            ×
          </button>
        )}
      </div>



      {open && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--color-white)',
            border: '1px solid var(--color-mist)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            zIndex: 50,
            maxHeight: '360px',
            overflowY: 'auto',
            overflowX: 'hidden',
            flexDirection: 'column',
            display: 'flex'
          }}
        >
          {['name', 'major', 'club'].map(type => {
            const typeSugs = suggestions.filter(s => s.type === type);
            if (typeSugs.length === 0) return null;
            return (
              <div key={type} style={{ padding: '0.5rem 0' }}>
                <div style={{ padding: '0.25rem 1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {type === 'name' ? 'People' : type === 'major' ? 'Majors' : 'Clubs'}
                </div>
                {typeSugs.map(s => (
                  <div
                    key={`${s.type}-${s.label}`}
                    onMouseDown={() => handleSelect(s)}
                    style={{
                      padding: '0.6rem 1rem',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.875rem',
                      color: 'var(--color-ink)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-columbia-pale)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ——— The actual home page for authenticated users ———
function AuthenticatedHome({ initialProfiles, meetingCount, userId, sentRequests }: { initialProfiles: Profile[]; meetingCount: number; userId: string | null; sentRequests: { id: string; date: string }[] }) {
  const searchParams = useSearchParams();
  const initSearch = searchParams.get('search') ?? '';

  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [totalCount, setTotalCount] = useState<number>(initialProfiles.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialProfiles.length === PAGE_SIZE);

  const [filters, setFilters] = useState<ProfileFilters>({ query: initSearch, year: '', school: '', major: '', clubs: '' });
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Track requests sent perfectly
  const [activeSentRequests, setActiveSentRequests] = useState<{ id: string; date: string }[]>(sentRequests);

  const supabase = getSupabaseClient();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Random parallax image — fixed on server, randomized after hydration
  const [heroImage, setHeroImage] = useState(PARALLAX_IMAGES[0]);
  useEffect(() => {
    setHeroImage(PARALLAX_IMAGES[Math.floor(Math.random() * PARALLAX_IMAGES.length)]);
  }, []);

  // Sync initial URL search parameter
  useEffect(() => {
    if (initSearch) {
      setLoading(true);
      fetchProfiles({ query: initSearch, year: '', school: '', major: '', clubs: '' }, 0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initSearch]);

  // ——— Search/filter logic ———
  const fetchProfiles = useCallback(async (f: ProfileFilters, pageNum: number, append = false) => {
    if (DEV_BYPASS) {
      // Client-side filtering of mock data
      let filtered = DEV_MOCK_PROFILES.filter(p => {
        if (f.year && p.year !== f.year) return false;
        if (f.school && p.school !== f.school) return false;
        if (f.query.trim()) {
          const q = f.query.toLowerCase();
          const responseText = (p.responses ?? []).map(r => `${r.question} ${r.answer}`).join(' ');
          const searchable = [p.name, responseText, ...(p.major || [])].filter(Boolean).join(' ').toLowerCase();
          if (!searchable.includes(q)) return false;
        }
        return true;
      });
      setProfiles(filtered);
      setTotalCount(filtered.length);
      setHasMore(false);
      setPage(0);
      return;
    }

    if (!append) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from('public_profiles')
      .select('id, user_id, name, uni, university, school, year, degree, major, clubs, pronouns, responses, twitter, facebook, linkedin, instagram, youtube, tiktok, website, image_url, is_public, random_sort, created_at, updated_at', { count: 'exact' });

    // Full-text search
    if (f.query.trim()) {
      query = query.textSearch('fts', f.query.trim(), { type: 'websearch', config: 'english' });
    } else {
      query = query.order('random_sort', { ascending: true });
    }

    // Filters
    if (f.year) query = query.eq('year', f.year);
    if (f.school) query = query.eq('school', f.school);
    if (f.major) query = query.contains('major', [f.major]);
    if (f.clubs) query = query.contains('clubs', [f.clubs]);

    query = query.range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, count, error } = await query;

    if (!error) {
      const fetched = (data ?? []) as Profile[];
      setProfiles(prev => append ? [...prev, ...fetched] : fetched);
      setTotalCount(count ?? 0);
      setHasMore(fetched.length === PAGE_SIZE);
      setPage(pageNum);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [supabase]);

  // Handle typeahead selection (structured logic)
  const handleTypeaheadSelect = (value: string, type: SuggestionType | 'text') => {
    let newFilters = { ...filters, query: '', major: '', clubs: '' };
    if (type === 'name') {
      newFilters.query = value; // Search full-text for the name
    } else if (type === 'major') {
      newFilters.major = value;
    } else if (type === 'club') {
      newFilters.clubs = value;
    } else {
      newFilters.query = value; // Fallback plain text query
    }

    setFilters(newFilters);
    fetchProfiles(newFilters, 0);
  };

  const handleRandomSelect = () => {
    const validProfiles = profiles.filter(p => p.user_id !== userId);
    if (validProfiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * validProfiles.length);
      setSelectedProfile(validProfiles[randomIndex]);
    }
  };

  const handleLoadMore = () => {
    fetchProfiles(filters, page + 1, true);
  };

  const handleCoffeeSuccess = (firstName: string, receiverId: string) => {
    setSuccessMessage(`Request sent! We'll email both you and ${firstName} so you can connect and schedule a time to chat. Check your spam if it doesn't arrive in a few moments.`);
    setTimeout(() => setSuccessMessage(''), 10000);
    setSelectedProfile(null);
    setActiveSentRequests(prev => [...prev, { id: receiverId, date: new Date().toISOString() }]);
  };

  return (
    <main style={{ flex: 1 }}>
      {/* ——————————————————————————————————————————
          HERO
          Columbia blue gradient + grain texture
          Large Cormorant Garamond italic heading
      ——————————————————————————————————————————— */}
      <section
        id="how-it-works"
        className="grain-overlay"
        style={{
          position: 'relative',
          minHeight: '160px',
          background: 'linear-gradient(150deg, #012a61 0%, #00418c 54%, #0d5eac 100%)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 0 1.5rem',
        }}
      >
        {/* Subtle parallax image overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(/img/parallax/${heroImage}.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.26,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1180px',
            margin: '0 auto',
            padding: '2.5rem 1.5rem 0',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            justifyContent: 'flex-end',
          }}
        >
          <div>
            <h1
              className="heading-display-italic"
              style={{
                fontSize: 'clamp(1.75rem, 4.5vw, 2.5rem)',
                color: 'rgba(255,255,255,0.97)',
                maxWidth: '780px',
                marginBottom: '0.25rem',
                lineHeight: 1.1,
              }}
            >
              Connect with the people who could change your trajectory.
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#f2ebde',
                  letterSpacing: '-0.01em',
                }}
              >
                {meetingCount.toLocaleString()}
              </span>
              <span
                className="label-mono"
                style={{ color: 'rgba(235,243,252,0.72)', fontSize: '0.65rem', letterSpacing: '0.08em' }}
              >
                conversations started
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ——————————————————————————————————————————
          SEARCH + FILTER BAR
          Sticky below hero
      ——————————————————————————————————————————— */}
      <div
        style={{
          position: 'sticky',
          top: '64px',
          zIndex: 40,
          background: 'rgba(249,245,238,0.94)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #d4dfec',
          padding: '0.95rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1180px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          {/* Main Unified Search Typeahead */}
          <div style={{ flex: 1 }}>
            <MainSearchTypeahead
              value={filters.query || filters.major || filters.clubs}
              onSelect={handleTypeaheadSelect}
              initialProfiles={initialProfiles}
              onRandomSelect={handleRandomSelect}
            />
          </div>
          <button
            onClick={handleRandomSelect}
            className="btn-primary hidden sm:flex"
            style={{ whiteSpace: 'nowrap', height: '48px', padding: '0 1.5rem', borderRadius: '12px', flexShrink: 0 }}
          >
            Choose for me ✨
          </button>
        </div>
      </div>

      {/* ——————————————————————————————————————————
          PROFILE GRID
      ——————————————————————————————————————————— */}
      <div
        style={{
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '2.75rem 1.5rem 4.25rem',
        }}
      >
        {/* Result count */}
        {!loading && filters.query && (
          <p
            className="label-mono"
            style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}
          >
            {totalCount} result{totalCount !== 1 ? 's' : ''} for &ldquo;{filters.query}&rdquo;
          </p>
        )}

        {/* Success toast */}
        {successMessage && (
          <div
            className="status-banner status-published"
            style={{ marginBottom: '1.5rem' }}
          >
            {successMessage}
          </div>
        )}

        {loading ? (
          // Skeleton grid
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ paddingBottom: '133%', borderRadius: '4px' }} />
                <div className="skeleton" style={{ height: '12px', marginTop: '8px', borderRadius: '2px', width: '60%' }} />
                <div className="skeleton" style={{ height: '10px', marginTop: '6px', borderRadius: '2px', width: '80%' }} />
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
            <p
              className="heading-display-italic"
              style={{ fontSize: '2.5rem', color: 'var(--color-ink)', marginBottom: '1rem', lineHeight: 1.1 }}
            >
              We didn't find someone on<br />Coffee@CU for that search yet
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => handleTypeaheadSelect('', 'text')}
                className="btn-ghost"
              >
                Clear your filters
              </button>
              <button
                onClick={handleRandomSelect}
                className="btn-primary"
              >
                Choose for me ✨
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onClick={() => setSelectedProfile(profile)}
                  isOwn={profile.user_id === userId}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-ghost"
                  style={{ minWidth: '160px' }}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile drawer (coffee request form lives inline) */}
      <ProfileDrawer
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onCoffeeSuccess={handleCoffeeSuccess}
        isLoggedIn={true}
        userId={userId}
        sentRequests={activeSentRequests}
      />
    </main>
  );
}
