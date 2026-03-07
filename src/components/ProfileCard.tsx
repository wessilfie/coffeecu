'use client';

import Image from 'next/image';
import { SCHOOLS, PROFILE_QUESTIONS_GROUPED } from '@/lib/constants';
import { deriveYearLabel } from '@/lib/year-utils';
import type { Profile, School } from '@/types';

const BADGE_STYLES: Partial<Record<School, { bg: string; color: string }>> = {
  // Undergraduate
  CC: { bg: '#D8E8FA', color: '#003E8A' },
  SEAS: { bg: '#DAE9E4', color: '#0F5B45' },
  GS: { bg: '#EFE1CF', color: '#7A4A1E' },
  BC: { bg: '#EBDDF2', color: '#5A2A74' },
  // Graduate & Professional
  GSAS: { bg: '#C8E8E8', color: '#1A5C60' },
  BUS: { bg: '#D4DFF0', color: '#1A3060' },
  LAW: { bg: '#D0D8E8', color: '#1A2C54' },
  VPS: { bg: '#CCE8D8', color: '#0A5C38' },
  JRN: { bg: '#F0DEC8', color: '#7A3A14' },
  SIPA: { bg: '#DCE5F0', color: '#1C3E63' },
  GSAPP: { bg: '#D8D8DC', color: '#2A2A40' },
  SOA: { bg: '#F0D8D8', color: '#6A1A1A' },
  SW: { bg: '#D4E8D4', color: '#1A5C2A' },
  PH: { bg: '#C8E4E8', color: '#1A5458' },
  NRS: { bg: '#C8DCF0', color: '#1A3C6A' },
  DM: { bg: '#D4E4F4', color: '#1A3450' },
  SPS: { bg: '#E8E0D4', color: '#3A2C1A' },
  CS: { bg: '#CCE4D0', color: '#1A4C2A' },
  TC: { bg: '#EAD8C0', color: '#5A3A14' },
};

const DEFAULT_BADGE = { bg: '#E5DFD2', color: '#1A1410' };

interface Props {
  profile: Profile;
  onClick: () => void;
  isOwn?: boolean;
}

export default function ProfileCard({ profile, onClick, isOwn = false }: Props) {
  const badge = profile.school ? (BADGE_STYLES[profile.school as School] ?? DEFAULT_BADGE) : null;
  const schoolEntry = profile.school ? (SCHOOLS as { value: string; label: string }[]).find(s => s.value === profile.school) : null;
  const schoolLabel = schoolEntry?.label ?? null;

  // Find the category for a specific question
  const getCategoryForQuestion = (question: string) => {
    for (const group of PROFILE_QUESTIONS_GROUPED) {
      if ((group.questions as unknown as string[]).includes(question)) {
        return group.group;
      }
    }
    return '';
  };

  // Convert categories from second-person to third-person
  const toThirdPersonCategory = (category: string) => {
    switch (category) {
      case "What makes you, you?":
        return "WHAT MAKES THEM, THEM";
      case "What lights you up?":
        return "WHAT LIGHTS THEM UP";
      case "How do you think about the world?":
        return "HOW THEY THINK ABOUT THE WORLD";
      case "What you bring to the table?":
        return "WHAT THEY BRING TO THE TABLE";
      default:
        return category.toUpperCase();
    }
  };

  const visibleClubs = profile.clubs?.slice(0, 2) || [];
  const extraClubsCount = Math.max(0, (profile.clubs?.length || 0) - 2);
  const visibleResponses = profile.responses?.filter(r => r.question && r.answer).slice(0, 2) || [];

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
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
          background: '#fdfbf6',
          border: '1px solid #d9e4f0',
          borderRadius: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          boxShadow: '0 8px 24px rgba(0,40,85,0.08)',
          transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 34px rgba(0,40,85,0.14)';
          (e.currentTarget as HTMLElement).style.borderColor = '#9eb9d8';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,40,85,0.08)';
          (e.currentTarget as HTMLElement).style.borderColor = '#d9e4f0';
        }}
      >
        <div style={{ position: 'relative', paddingBottom: '122%', overflow: 'hidden' }}>
          <Image
            src={profile.image_url}
            alt={profile.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
          {isOwn && (
            <div
              style={{
                position: 'absolute',
                top: '0.6rem',
                right: '0.6rem',
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '2px',
                background: 'rgba(0,63,138,0.82)',
                color: '#ffffff',
                backdropFilter: 'blur(4px)',
              }}
            >
              You
            </div>
          )}
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
          <div
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              left: '0.85rem',
              right: '0.85rem',
            }}
          >
            <h3
              className="line-clamp-2"
              style={{
                fontFamily: 'var(--font-display), serif',
                fontSize: '1.3rem',
                fontWeight: 600,
                color: 'white',
                letterSpacing: '0.01em',
                lineHeight: 1.2,
                margin: 0,
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
              }}
            >
              {profile.name}
            </h3>
          </div>
        </div>

        <div style={{ padding: '0.85rem 0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
          {/* Badges Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {badge && schoolLabel && (
              <span
                style={{
                  ...badge,
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '2px',
                }}
              >
                {schoolLabel}
              </span>
            )}
            {profile.degree && (
              <span
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '2px',
                  background: '#E8EEF6',
                  color: '#2A4A70',
                }}
              >
                {profile.degree}
              </span>
            )}
            {deriveYearLabel(profile.year, profile.school, profile.designation, profile.degree) && (
              <span
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.6rem',
                  letterSpacing: '0.06em',
                  color: 'var(--color-text-muted)',
                }}
              >
                {deriveYearLabel(profile.year, profile.school, profile.designation, profile.degree)}
              </span>
            )}
          </div>

          {/* Clubs Row */}
          {visibleClubs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {visibleClubs.map(club => (
                <span
                  key={club}
                  style={{
                    fontFamily: 'var(--font-body), serif',
                    fontSize: '0.65rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    background: '#f0f4f8',
                    color: '#2f2a24',
                    border: '1px solid #e1e8f0',
                  }}
                >
                  {club}
                </span>
              ))}
              {extraClubsCount > 0 && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '0.65rem',
                    color: 'var(--color-text-muted)',
                    marginLeft: '0.2rem',
                  }}
                >
                  +{extraClubsCount} more
                </span>
              )}
            </div>
          )}

          {/* Q&A Responses */}
          {visibleResponses.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: visibleClubs.length > 0 ? 0 : '0.25rem' }}>
              {visibleResponses.map((response, index) => {
                const category = getCategoryForQuestion(response.question);
                const displayCategory = toThirdPersonCategory(category);

                return (
                  <div key={index} style={{ borderTop: index > 0 ? '1px solid #e5ddd0' : 'none', paddingTop: index > 0 ? '0.75rem' : 0 }}>
                    {displayCategory && (
                      <p
                        className="label-mono"
                        style={{
                          fontSize: '0.6rem',
                          color: 'var(--color-text-muted)',
                          letterSpacing: '0.06em',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {displayCategory}
                      </p>
                    )}
                    <p
                      className="line-clamp-2"
                      style={{
                        fontFamily: 'var(--font-body), serif',
                        fontSize: '0.82rem',
                        color: '#2f2a24',
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      “{response.answer}”
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </article>
    </button>
  );
}
