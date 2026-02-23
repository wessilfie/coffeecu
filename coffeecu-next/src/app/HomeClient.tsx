'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import ProfileCard from '@/components/ProfileCard';
import ProfileDrawer from '@/components/ProfileDrawer';
import CoffeeRequestModal from '@/components/CoffeeRequestModal';
import { getSupabaseClient } from '@/lib/supabase/client';
import { PARALLAX_IMAGES, SCHOOLS, YEARS } from '@/lib/constants';
import type { Profile, ProfileFilters } from '@/types';

const PAGE_SIZE = 12;

interface Props {
  initialProfiles: Profile[];
  meetingCount: number;
  isLoggedIn: boolean;
  userId: string | null;
}

export default function HomeClient({ initialProfiles, meetingCount, isLoggedIn, userId }: Props) {
  // Anti-scraping: show a login gate instead of profiles for unauthenticated users
  // The hero and meeting count remain public (marketing), but profiles are gated.
  if (!isLoggedIn) {
    return <LoginGate meetingCount={meetingCount} heroImage={PARALLAX_IMAGES[0]} />;
  }

  return <AuthenticatedHome initialProfiles={initialProfiles} meetingCount={meetingCount} userId={userId} />;
}

// ——— Login gate / landing page for unauthenticated visitors ———
function LoginGate({ meetingCount, heroImage }: { meetingCount: number; heroImage: string }) {
  const steps = [
    {
      number: '01',
      title: 'Create your profile',
      body: 'Fill in your school, major, interests, and what you\'d love to talk about. Upload a photo. Your profile goes live immediately after email verification.',
    },
    {
      number: '02',
      title: 'Browse the community',
      body: 'Search by name, interest, major, or availability. Filter by year and school. Browse students, faculty, and alumni from across Columbia.',
    },
    {
      number: '03',
      title: 'Request a coffee chat',
      body: 'Write a personal message explaining what you\'d like to discuss. No anonymous reach-outs — every request starts a real conversation.',
    },
  ];

  const schools = [
    { code: 'CC', name: 'Columbia College', badge: 'badge-CC' },
    { code: 'SEAS', name: 'Engineering', badge: 'badge-SEAS' },
    { code: 'GS', name: 'General Studies', badge: 'badge-GS' },
    { code: 'BC', name: 'Barnard College', badge: 'badge-BC' },
    { code: 'GR', name: 'Graduate', badge: 'badge-GR' },
  ];

  return (
    <main style={{ flex: 1, background: 'var(--color-limestone)' }}>
      {/* ————————————————————————————————————————
          HERO — full-bleed Columbia blue
      ———————————————————————————————————————— */}
      <section
        className="grain-overlay"
        style={{
          position: 'relative',
          minHeight: '100vh',
          background: 'linear-gradient(155deg, #001840 0%, #002D63 40%, #003F8A 70%, #005BB5 100%)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Parallax image underlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(/img/parallax/${heroImage}.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            opacity: 0.12,
          }}
        />

        {/* Decorative rule — Beaux-Arts feel */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: 'linear-gradient(to bottom, transparent, rgba(212,165,32,0.6), transparent)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1100px',
            margin: '0 auto',
            padding: 'clamp(5rem, 10vw, 8rem) 1.5rem clamp(4rem, 8vw, 6rem)',
            width: '100%',
          }}
        >
          {/* Eyebrow */}
          <p
            className="label-mono"
            style={{
              color: 'rgba(200,220,240,0.7)',
              marginBottom: '1.5rem',
              letterSpacing: '0.2em',
            }}
          >
            Columbia University · Est. 1754
          </p>

          {/* Main heading */}
          <h1
            className="heading-display-italic"
            style={{
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              color: 'rgba(255,255,255,0.97)',
              maxWidth: '820px',
              marginBottom: '1.75rem',
              lineHeight: 1.05,
            }}
          >
            Meet the Columbia community, one coffee at a time.
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontFamily: 'var(--font-body), serif',
              fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
              color: 'rgba(200,220,240,0.8)',
              maxWidth: '560px',
              marginBottom: '2.5rem',
              lineHeight: 1.65,
            }}
          >
            A community board for students, faculty, and alumni to connect over coffee.
            Browse by interest, reach out with purpose, build real connections across every school.
          </p>

          {/* CTA + counter row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="/login"
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.9375rem 2.25rem', letterSpacing: '0.12em' }}
            >
              Join the community
            </a>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-courier), monospace',
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  color: 'var(--color-gold-lt)',
                  letterSpacing: '-0.02em',
                }}
              >
                {meetingCount.toLocaleString()}
              </span>
              <span
                className="label-mono"
                style={{ color: 'rgba(200,220,240,0.65)', letterSpacing: '0.1em' }}
              >
                conversations started
              </span>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: 0.45,
          }}
        >
          <span className="label-mono" style={{ color: 'white', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
            LEARN MORE
          </span>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1 1L8 8L15 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      {/* ————————————————————————————————————————
          WHAT THIS IS — community, not dating
      ———————————————————————————————————————— */}
      <section
        style={{
          background: 'var(--color-limestone)',
          borderBottom: '1px solid var(--color-mist)',
          padding: 'clamp(3.5rem, 6vw, 5rem) 1.5rem',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p className="label-mono" style={{ color: 'var(--color-copper)', marginBottom: '0.875rem' }}>
            What it is
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400,
              color: 'var(--color-ink)',
              marginBottom: '1.25rem',
              lineHeight: 1.15,
            }}
          >
            A community board. Not a dating app.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body), serif',
              fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
              color: 'var(--color-text-muted)',
              maxWidth: '640px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Coffee@CU exists to help the Columbia community connect around ideas, research, career paths,
            and shared interests — not to swipe right. Every reach-out requires a real message explaining
            what you want to talk about.
          </p>
        </div>
      </section>

      {/* ————————————————————————————————————————
          HOW IT WORKS — 3 steps
      ———————————————————————————————————————— */}
      <section
        style={{
          background: 'var(--color-limestone-dk)',
          borderBottom: '1px solid var(--color-mist)',
          padding: 'clamp(3.5rem, 6vw, 5rem) 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
            <p className="label-mono" style={{ color: 'var(--color-columbia)', marginBottom: '0.75rem' }}>
              How it works
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-cormorant), serif',
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                fontWeight: 400,
                color: 'var(--color-ink)',
                lineHeight: 1.2,
              }}
            >
              Three steps to a better conversation
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {steps.map((step) => (
              <div
                key={step.number}
                style={{
                  background: 'var(--color-limestone)',
                  border: '1px solid var(--color-mist)',
                  borderRadius: '4px',
                  padding: '2rem',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-courier), monospace',
                    fontSize: '0.65rem',
                    letterSpacing: '0.15em',
                    color: 'var(--color-columbia)',
                    marginBottom: '1rem',
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-cormorant), serif',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: 'var(--color-ink)',
                    marginBottom: '0.75rem',
                    lineHeight: 1.2,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body), serif',
                    fontSize: '0.9375rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————————————————————————————
          WHO'S HERE — schools
      ———————————————————————————————————————— */}
      <section
        style={{
          background: 'var(--color-limestone)',
          borderBottom: '1px solid var(--color-mist)',
          padding: 'clamp(3.5rem, 6vw, 5rem) 1.5rem',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p className="label-mono" style={{ color: 'var(--color-copper)', marginBottom: '0.875rem' }}>
            Who&rsquo;s here
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
              fontWeight: 400,
              color: 'var(--color-ink)',
              marginBottom: '1rem',
              lineHeight: 1.2,
            }}
          >
            Every corner of campus
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body), serif',
              fontSize: '0.9375rem',
              color: 'var(--color-text-muted)',
              maxWidth: '500px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.65,
            }}
          >
            Students, faculty, and alumni across all five schools.
            Verified @columbia.edu and @barnard.edu accounts only.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.625rem',
              marginBottom: '3rem',
            }}
          >
            {schools.map((s) => (
              <span key={s.code} className={`badge ${s.badge}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.875rem' }}>
                {s.code} — {s.name}
              </span>
            ))}
          </div>

          {/* What you can talk about */}
          <div
            style={{
              background: 'var(--color-limestone-dk)',
              border: '1px solid var(--color-mist)',
              borderRadius: '4px',
              padding: '1.75rem 2rem',
            }}
          >
            <p
              className="label-mono"
              style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}
            >
              People connect around
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                justifyContent: 'center',
              }}
            >
              {[
                'Research', 'Career pivots', 'Startups', 'Policy', 'Arts & humanities',
                'Finance', 'Healthcare', 'Urban planning', 'Tech', 'Academia',
                'Journalism', 'Law', 'Social impact', 'International relations',
              ].map((topic) => (
                <span
                  key={topic}
                  style={{
                    fontFamily: 'var(--font-courier), monospace',
                    fontSize: '0.65rem',
                    letterSpacing: '0.06em',
                    padding: '0.25rem 0.625rem',
                    background: 'var(--color-limestone)',
                    border: '1px solid var(--color-limestone-md)',
                    borderRadius: '2px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ————————————————————————————————————————
          FINAL CTA
      ———————————————————————————————————————— */}
      <section
        className="grain-overlay"
        style={{
          position: 'relative',
          background: 'linear-gradient(155deg, #001840 0%, #003F8A 100%)',
          padding: 'clamp(4rem, 7vw, 6rem) 1.5rem',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
          <p className="label-mono" style={{ color: 'rgba(200,220,240,0.65)', marginBottom: '0.875rem', letterSpacing: '0.2em' }}>
            For the Columbia community
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontStyle: 'italic',
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.97)',
              marginBottom: '1.5rem',
              lineHeight: 1.15,
            }}
          >
            Start a conversation worth having.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body), serif',
              fontSize: '0.9375rem',
              color: 'rgba(200,220,240,0.75)',
              marginBottom: '2.5rem',
              lineHeight: 1.65,
            }}
          >
            Sign up with your @columbia.edu or @barnard.edu email. It takes two minutes to
            publish your profile and start browsing.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/login"
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '0.9375rem 2.25rem' }}
            >
              Create your profile
            </a>
            <a
              href="/login"
              className="btn-ghost"
              style={{
                fontSize: '0.8rem',
                padding: '0.9375rem 2.25rem',
                color: 'rgba(255,255,255,0.8)',
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              Sign in
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

// ——— The actual home page for authenticated users ———
function AuthenticatedHome({ initialProfiles, meetingCount, userId }: { initialProfiles: Profile[]; meetingCount: number; userId: string | null }) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [totalCount, setTotalCount] = useState<number>(initialProfiles.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialProfiles.length === PAGE_SIZE);

  const [filters, setFilters] = useState<ProfileFilters>({ query: '', year: '', school: '', major: '' });
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showCoffeeModal, setShowCoffeeModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const supabase = getSupabaseClient();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Random parallax image (stable across renders)
  const heroImage = useRef(
    PARALLAX_IMAGES[Math.floor(Math.random() * PARALLAX_IMAGES.length)]
  );

  // ——— Search/filter logic ———
  const fetchProfiles = useCallback(async (f: ProfileFilters, pageNum: number, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    let query = supabase
      .from('public_profiles')
      .select('id, user_id, name, uni, university, school, year, major, pronouns, about, likes, contact_for, availability, twitter, facebook, linkedin, website, image_url, is_public, random_sort, created_at, updated_at', { count: 'exact' });

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

  // Debounce search input
  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, query: value };
    setFilters(newFilters);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchProfiles(newFilters, 0);
    }, 350);
  };

  const handleFilterChange = (key: keyof ProfileFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchProfiles(newFilters, 0);
  };

  const handleLoadMore = () => {
    fetchProfiles(filters, page + 1, true);
  };

  const handleCoffeeSuccess = () => {
    setSuccessMessage(`Your request was sent to ${selectedProfile?.name.split(' ')[0]}!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    setSelectedProfile(null);
  };

  return (
    <main style={{ flex: 1 }}>
      {/* ——————————————————————————————————————————
          HERO
          Columbia blue gradient + grain texture
          Large Cormorant Garamond italic heading
      ——————————————————————————————————————————— */}
      <section
        className="grain-overlay"
        style={{
          position: 'relative',
          minHeight: '420px',
          background: 'linear-gradient(135deg, #002060 0%, #003F8A 45%, #005BB5 100%)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 0 3rem',
        }}
      >
        {/* Subtle parallax image overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(/img/parallax/${heroImage.current}.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '5rem 1.5rem 0',
            width: '100%',
          }}
        >
          {/* Label */}
          <p
            className="label-mono"
            style={{
              color: 'rgba(200,220,240,0.8)',
              marginBottom: '1rem',
              letterSpacing: '0.15em',
            }}
          >
            Columbia University Community
          </p>

          {/* Main heading — large Cormorant Garamond italic */}
          <h1
            className="heading-display-italic"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              color: 'rgba(255,255,255,0.97)',
              maxWidth: '720px',
              marginBottom: '1.5rem',
            }}
          >
            Who are you curious about?
          </h1>

          {/* Meeting counter */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-courier), monospace',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'var(--color-gold-lt)',
                letterSpacing: '-0.02em',
              }}
            >
              {meetingCount.toLocaleString()}
            </span>
            <span
              className="label-mono"
              style={{ color: 'rgba(200,220,240,0.7)', letterSpacing: '0.12em' }}
            >
              conversations started
            </span>
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
          top: '60px', // below nav
          zIndex: 40,
          background: 'var(--color-limestone-dk)',
          borderBottom: '1px solid var(--color-mist)',
          padding: '0.875rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              className="form-input"
              placeholder="Search by name, interests, major…"
              value={filters.query}
              onChange={e => handleSearchChange(e.target.value)}
              style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
            />
          </div>

          {/* Year filter */}
          <div style={{ position: 'relative', minWidth: '140px' }}>
            <select
              className="form-input"
              value={filters.year}
              onChange={e => handleFilterChange('year', e.target.value)}
              style={{ fontSize: '0.8125rem', appearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}
            >
              <option value="">All years</option>
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
          </div>

          {/* School filter */}
          <div style={{ position: 'relative', minWidth: '140px' }}>
            <select
              className="form-input"
              value={filters.school}
              onChange={e => handleFilterChange('school', e.target.value)}
              style={{ fontSize: '0.8125rem', appearance: 'none', paddingRight: '2rem', cursor: 'pointer' }}
            >
              <option value="">All schools</option>
              {SCHOOLS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
          </div>
        </div>
      </div>

      {/* ——————————————————————————————————————————
          PROFILE GRID
      ——————————————————————————————————————————— */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '2.5rem 1.5rem 4rem',
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
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p
              className="heading-display-italic"
              style={{ fontSize: '2rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}
            >
              No one found
            </p>
            <p className="label-mono" style={{ color: 'var(--color-text-muted)' }}>
              Try a different search or clear your filters
            </p>
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
              {profiles.map((profile, i) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onClick={() => setSelectedProfile(profile)}
                  animationDelay={Math.min(i * 40, 320)}
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

      {/* Profile drawer */}
      <ProfileDrawer
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onRequestCoffee={() => setShowCoffeeModal(true)}
        isLoggedIn={true}
      />

      {/* Coffee request modal */}
      {showCoffeeModal && selectedProfile && userId && (
        <CoffeeRequestModal
          receiver={selectedProfile}
          senderId={userId}
          onClose={() => setShowCoffeeModal(false)}
          onSuccess={handleCoffeeSuccess}
        />
      )}
    </main>
  );
}
