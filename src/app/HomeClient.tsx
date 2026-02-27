'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import ProfileCard from '@/components/ProfileCard';
import ProfileDrawer from '@/components/ProfileDrawer';
import { getSupabaseClient } from '@/lib/supabase/client';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { DEV_BYPASS, DEV_MOCK_PROFILES } from '@/lib/dev-bypass';
import { PARALLAX_IMAGES, SCHOOL_GROUPS, YEARS } from '@/lib/constants';
import type { Profile, ProfileFilters } from '@/types';

const PAGE_SIZE = 12;

interface Props {
  initialProfiles: Profile[];
  meetingCount: number;
  isLoggedIn: boolean;
  userId: string | null;
  sentRequestIds: string[];
  hasPublishedProfile: boolean;
}

export default function HomeClient({ initialProfiles, meetingCount, isLoggedIn, userId, sentRequestIds, hasPublishedProfile }: Props) {
  // Supabase sometimes redirects auth errors to the Site URL (homepage) as a hash fragment.
  // Detect that immediately and redirect — show nothing so the user never sees the homepage.
  const [redirecting, setRedirecting] = useState(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash.slice(1);
    return !!hash && !!new URLSearchParams(hash).get('error');
  });

  useEffect(() => {
    if (!redirecting) return;

    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/profile';
      } else {
        window.location.href = '/login?error=link_expired';
      }
    });
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

  return <AuthenticatedHome initialProfiles={initialProfiles} meetingCount={meetingCount} userId={userId} sentRequestIds={sentRequestIds} />;
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
  const steps = [
    {
      number: '01',
      title: 'Create your profile',
      body: 'Share your school, major, interests, and what you\'d love to talk about. Your profile goes live right after email verification.',
    },
    {
      number: '02',
      title: 'Browse the community',
      body: 'Search by name, interest, major, or availability. Filter by year and school. Discover students, faculty, and alumni you\'d never stumble across otherwise.',
    },
    {
      number: '03',
      title: 'Reach out with purpose',
      body: 'Send a personal note explaining what you\'d like to discuss. Coffee, tea, or a quick Zoom. No anonymous reach-outs, ever.',
    },
  ];

  const useCases = [
    'Finding a study partner for a course outside your major',
    'Getting coffee with a researcher in your dream field',
    'Connecting with an alum at the company you want to join',
    'Building a project with someone from a different school',
    'Discovering a campus community you never knew existed',
    'Having a real conversation with a professor outside office hours',
  ];

  const marqueeSchools = [
    'Columbia College',
    'Fu Foundation School of Engineering & Applied Science',
    'School of General Studies',
    'Barnard College',
    'Graduate School of Arts & Sciences',
    'Columbia Business School',
    'Columbia Law School',
    'Vagelos College of Physicians & Surgeons',
    'Columbia Journalism School',
    'School of International & Public Affairs',
    'Graduate School of Architecture, Planning & Preservation',
    'School of the Arts',
    'School of Social Work',
    'Mailman School of Public Health',
    'School of Nursing',
    'College of Dental Medicine',
    'School of Professional Studies',
    'Columbia Climate School',
    'Teachers College',
  ];
  const marqueeContent = [...marqueeSchools, ...marqueeSchools];

  return (
    <main style={{ flex: 1, background: '#f6f1e8' }}>
      {/* ————————————————————————————————————————
          HERO — full-bleed Columbia blue
      ———————————————————————————————————————— */}
      <section
        className="grain-overlay"
        style={{
          position: 'relative',
          minHeight: '100svh',
          background: 'linear-gradient(150deg, #012a61 0%, #00418c 54%, #0d5eac 100%)',
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
            opacity: 0.23,
          }}
        />

        {/* Decorative rule — Beaux-Arts feel */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '5px',
            background: 'linear-gradient(to bottom, transparent, rgba(244,240,230,0.9), transparent)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1120px',
            margin: '0 auto',
            padding: 'clamp(3.25rem, 7vw, 5.5rem) 1.5rem clamp(2.25rem, 5vw, 3.5rem)',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <h1
            className="heading-display-italic"
            style={{
              fontSize: 'clamp(1.85rem, 3.2vw, 2.9rem)',
              color: 'rgba(255,255,255,0.99)',
              marginBottom: '1rem',
              lineHeight: 1.08,
            }}
          >
            You&apos;re surrounded by some of the most interesting people on earth. Why not meet someone new?
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body), serif',
              fontSize: 'clamp(0.875rem, 1.4vw, 1rem)',
              color: 'rgba(228,239,251,0.86)',
              maxWidth: '580px',
              margin: '0 auto 1.35rem',
              lineHeight: 1.55,
            }}
          >
            From Morningside to Manhattanville and beyond, meet and connect with other Columbians over coffee (or tea!) or even Zoom with Coffee@CU
          </p>
          <EmailSignupInput darkBackground />
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.625rem',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '1.875rem',
                fontWeight: 700,
                color: '#f2ebde',
                letterSpacing: '-0.02em',
              }}
            >
              {meetingCount.toLocaleString()}
            </span>
            <span
              className="label-mono"
              style={{ color: 'rgba(235,243,252,0.7)', letterSpacing: '0.1em' }}
            >
              conversations started
            </span>
          </div>
        </div>
      </section>

      {/* ————————————————————————————————————————
          WHAT THIS IS
      ———————————————————————————————————————— */}
      <section
        style={{
          background: '#f9f5ee',
          borderBottom: '1px solid #d4dfec',
          padding: 'clamp(4rem, 6vw, 5.25rem) 1.5rem',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display), serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 600,
              color: '#10273f',
              marginBottom: '1.25rem',
              lineHeight: 1.15,
            }}
          >
            Columbia is bigger than your corner of campus.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body), serif',
              fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)',
              color: '#4f5d6a',
              maxWidth: '640px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Coffee@CU helps students across every school meet each other, then opens doors to the faculty and alumni
            who&apos;ve been where you want to go. Every reach-out starts with a real message, so conversations begin with purpose.
          </p>
        </div>
      </section>

      {/* ————————————————————————————————————————
          HOW IT WORKS — 3 steps
      ———————————————————————————————————————— */}
      <section
        id="how-it-works"
        style={{
          background: '#edf3fa',
          borderBottom: '1px solid #b8d4ed',
          padding: 'clamp(4rem, 6vw, 5.25rem) clamp(1rem, 4vw, 1.5rem)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display), serif',
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                fontWeight: 600,
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
              gap: '1.5rem',
            }}
          >
            {steps.map((step) => (
              <div
                key={step.number}
                style={{
                  background: '#ffffff',
                  border: '1px solid #b8d4ed',
                  borderRadius: '8px',
                  padding: '2rem',
                  position: 'relative',
                  boxShadow: '0 10px 28px rgba(0,60,130,0.07)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    color: '#75aadb',
                    marginBottom: '1rem',
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display), serif',
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
                    color: '#4f5d6a',
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
          WHO'S HERE + STORIES
      ———————————————————————————————————————— */}
      <section
        style={{
          background: '#f9f5ee',
          borderBottom: '1px solid #b8d4ed',
          padding: 'clamp(4rem, 6vw, 5.25rem) 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display), serif',
                fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)',
                fontWeight: 600,
                color: 'var(--color-ink)',
                marginBottom: '1rem',
                lineHeight: 1.2,
              }}
            >
              Every school. Every year. Every path.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body), serif',
                fontSize: '0.9375rem',
                color: '#4f5d6a',
                maxWidth: '500px',
                margin: '0 auto',
                lineHeight: 1.65,
              }}
            >
              From first-years to faculty, CC to Teachers College.
              Verified @columbia.edu and @barnard.edu accounts only.
            </p>
          </div>

          {/* Use case vignettes */}
          <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', textAlign: 'center' }}>
            What people come here for
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
              gap: '1rem',
            }}
          >
            {useCases.map((useCase) => (
              <div
                key={useCase}
                style={{
                  background: '#ffffff',
                  border: '1px solid #b8d4ed',
                  borderLeft: '3px solid #75aadb',
                  borderRadius: '8px',
                  padding: '1.25rem 1.5rem',
                  boxShadow: '0 4px 16px rgba(0,60,130,0.06)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-display), serif',
                    fontSize: '1.125rem',
                    fontStyle: 'italic',
                    fontWeight: 500,
                    color: 'var(--color-ink)',
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {useCase}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————————————————————————————————————————
          SCHOOLS MARQUEE
      ———————————————————————————————————————— */}
      <div
        style={{
          background: '#deeaf6',
          borderTop: '1px solid #b8d4ed',
          borderBottom: '1px solid #b8d4ed',
          padding: '1.1rem 0',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {/* Keyframe embedded directly — avoids CSS processing quirks */}
        <style>{`
          @keyframes cu-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
        <div
          style={{
            display: 'inline-flex',
            animation: 'cu-marquee 54s linear infinite',
          }}
        >
          {marqueeContent.map((school, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-body), serif',
                fontSize: '0.875rem',
                letterSpacing: '0.01em',
                fontStyle: 'italic',
                color: '#1a4f8a',
                padding: '0 2.5rem',
                flexShrink: 0,
              }}
            >
              {school}
              <span style={{ marginLeft: '2.5rem', color: '#75aadb' }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ————————————————————————————————————————
          FINAL CTA
      ———————————————————————————————————————— */}
      <section
        className="grain-overlay"
        style={{
          position: 'relative',
          background: 'linear-gradient(150deg, #012a61 0%, #004f9f 100%)',
          padding: 'clamp(4rem, 7vw, 6rem) 1.5rem',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display), serif',
              fontStyle: 'italic',
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.97)',
              marginBottom: '1.5rem',
              lineHeight: 1.15,
            }}
          >
            Your next great conversation is one email away.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body), serif',
              fontSize: '0.9375rem',
              color: 'rgba(228,239,251,0.78)',
              marginBottom: '2.5rem',
              lineHeight: 1.65,
            }}
          >
            Sign up with your @columbia.edu or @barnard.edu email. Two minutes to set up your profile, then start meeting people who&apos;ll change how you see your time at Columbia.
          </p>
          <EmailSignupInput darkBackground />
        </div>
      </section>
    </main>
  );
}

// ——— The actual home page for authenticated users ———
function AuthenticatedHome({ initialProfiles, meetingCount, userId, sentRequestIds }: { initialProfiles: Profile[]; meetingCount: number; userId: string | null; sentRequestIds: string[] }) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [totalCount, setTotalCount] = useState<number>(initialProfiles.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialProfiles.length === PAGE_SIZE);

  const [filters, setFilters] = useState<ProfileFilters>({ query: '', year: '', school: '', major: '' });
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set(sentRequestIds));

  const supabase = getSupabaseClient();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Random parallax image — fixed on server, randomized after hydration
  const [heroImage, setHeroImage] = useState(PARALLAX_IMAGES[0]);
  useEffect(() => {
    setHeroImage(PARALLAX_IMAGES[Math.floor(Math.random() * PARALLAX_IMAGES.length)]);
  }, []);

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
      .select('id, user_id, name, uni, university, school, year, degree, major, pronouns, responses, twitter, facebook, linkedin, instagram, youtube, tiktok, website, image_url, is_public, random_sort, created_at, updated_at', { count: 'exact' });

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

  const handleCoffeeSuccess = (firstName: string, receiverId: string) => {
    setSuccessMessage(`Your request was sent to ${firstName}!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    setSelectedProfile(null);
    setSentIds(prev => new Set([...prev, receiverId]));
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
          minHeight: '420px',
          background: 'linear-gradient(150deg, #012a61 0%, #00418c 54%, #0d5eac 100%)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 0 3.5rem',
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
            padding: '5rem 1.5rem 0',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            alignItems: 'end',
          }}
        >
          <div>
            <p
              className="label-mono"
              style={{
                color: 'rgba(235,243,252,0.8)',
                marginBottom: '1rem',
                letterSpacing: '0.15em',
              }}
            >
              Columbia University Community
            </p>
            <h1
              className="heading-display-italic"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                color: 'rgba(255,255,255,0.97)',
                maxWidth: '680px',
                marginBottom: '1.5rem',
              }}
            >
              Find your next conversation.
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#f2ebde',
                  letterSpacing: '-0.02em',
                }}
              >
                {meetingCount.toLocaleString()}
              </span>
              <span
                className="label-mono"
                style={{ color: 'rgba(235,243,252,0.72)', letterSpacing: '0.12em' }}
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
              {SCHOOL_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.schools.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </optgroup>
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
        sentIds={sentIds}
      />
    </main>
  );
}
