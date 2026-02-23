'use client';

import Image from 'next/image';
import { SCHOOLS } from '@/lib/constants';
import type { Profile, School } from '@/types';

// School badge colors — custom colors for common schools, default for the rest
const BADGE_STYLES: Partial<Record<School, { bg: string; color: string }>> = {
  CC:   { bg: '#C8DCF0', color: '#003F8A' },
  SEAS: { bg: '#D4E8D4', color: '#1C5C3A' },
  GS:   { bg: '#EAD8C8', color: '#7A4A1E' },
  BC:   { bg: '#E8D4E8', color: '#5C1C6E' },
  BUS:  { bg: '#D4DDE8', color: '#1A3A5C' },
  LAW:  { bg: '#D4DDE8', color: '#1A3A5C' },
  SIPA: { bg: '#D4DDE8', color: '#1A3A5C' },
};

const DEFAULT_BADGE = { bg: '#E0DAD0', color: '#1A1410' };

interface Props {
  profile: Profile;
  onClick: () => void;
}

export default function ProfileCard({ profile, onClick }: Props) {
  const badge = profile.school ? (BADGE_STYLES[profile.school as School] ?? DEFAULT_BADGE) : null;
  const schoolEntry = profile.school ? SCHOOLS.find(s => s.value === profile.school) : null;
  const schoolLabel = schoolEntry?.label ?? null;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      <article
        style={{
          background: 'var(--color-limestone-dk)',
          border: '1px solid var(--color-mist)',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(26,20,16,0.08), 0 4px 12px rgba(26,20,16,0.06)',
          transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(26,20,16,0.14), 0 8px 32px rgba(26,20,16,0.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(26,20,16,0.08), 0 4px 12px rgba(26,20,16,0.06)';
        }}
      >
        {/* Portrait photo — 3:4 aspect ratio */}
        <div style={{ position: 'relative', paddingBottom: '133%', overflow: 'hidden' }}>
          <Image
            src={profile.image_url}
            alt={profile.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
          {/* Subtle bottom gradient for name readability */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(to top, rgba(26,20,16,0.6) 0%, transparent 100%)',
            }}
          />
          {/* Name overlay on photo */}
          <div
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              left: '0.75rem',
              right: '0.75rem',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-cormorant), serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                color: 'white',
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {profile.name}
            </h3>
          </div>
        </div>

        {/* Card footer — school/year + contact_for snippet */}
        <div style={{ padding: '0.625rem 0.75rem 0.75rem' }}>
          {/* School + Year badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {badge && schoolLabel && (
              <span
                style={{
                  ...badge,
                  fontFamily: 'var(--font-courier), monospace',
                  fontSize: '0.6rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '2px',
                }}
              >
                {schoolLabel}
              </span>
            )}
            {profile.year && (
              <span
                style={{
                  fontFamily: 'var(--font-courier), monospace',
                  fontSize: '0.6rem',
                  letterSpacing: '0.06em',
                  color: 'var(--color-text-muted)',
                }}
              >
                {profile.year}
              </span>
            )}
          </div>

          {/* "What I want to talk about" — the community signal, not a dating profile */}
          {profile.contact_for && (
            <p
              style={{
                fontFamily: 'var(--font-body), serif',
                fontSize: '0.8125rem',
                color: 'var(--color-ink-soft)',
                lineHeight: 1.4,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {profile.contact_for}
            </p>
          )}
        </div>
      </article>
    </button>
  );
}
