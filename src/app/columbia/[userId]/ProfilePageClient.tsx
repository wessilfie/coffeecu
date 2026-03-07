'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Coffee, ArrowLeft } from 'lucide-react';
import { Twitter, Linkedin, Facebook, Instagram, Youtube, Tiktok, Globe } from 'iconoir-react';
import CoffeeRequestModal from '@/components/CoffeeRequestModal';
import { SCHOOLS } from '@/lib/constants';
import { deriveYearLabel } from '@/lib/year-utils';
import type { Profile } from '@/types';

interface Props {
  profile: Profile;
  currentUserId: string;
}

export default function ProfilePageClient({ profile, currentUserId }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const schoolLabel = (SCHOOLS as Array<{ value: string; label: string }>).find(s => s.value === profile.school)?.label ?? profile.school;
  const metaParts = [schoolLabel, deriveYearLabel(profile.year, profile.school, profile.designation, profile.degree), profile.degree].filter(Boolean);
  const isOwn = currentUserId === profile.user_id;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-limestone)',
        padding: '2rem 1rem 4rem',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Own-profile preview banner */}
        {isOwn && (
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(0,63,138,0.06)',
              border: '1px solid rgba(0,63,138,0.15)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <p
              className="label-mono"
              style={{ color: 'var(--color-columbia)', margin: 0 }}
            >
              This is how your profile looks to others
            </p>
            <Link
              href="/profile"
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.68rem',
                letterSpacing: '0.01em',
                color: 'var(--color-columbia)',
                textDecoration: 'underline',
                whiteSpace: 'nowrap',
              }}
            >
              Edit profile →
            </Link>
          </div>
        )}

        {/* Back link */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.01em',
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            marginBottom: '2rem',
          }}
        >
          <ArrowLeft size={12} />
          Community
        </Link>

        {/* Photo card */}
        <div
          style={{
            position: 'relative',
            width: '180px',
            height: '220px',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '1.5rem',
          }}
        >
          <Image
            src={profile.image_url}
            alt={profile.name}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        {/* Name */}
        <h1
          className="heading-display"
          style={{
            margin: '0 0 0.5rem',
            lineHeight: 1.1,
          }}
        >
          {profile.name}
        </h1>

        {/* School · Year · Degree */}
        {metaParts.length > 0 && (
          <p
            className="label-mono"
            style={{ color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}
          >
            {metaParts.join(' · ')}
          </p>
        )}

        {/* Pronouns */}
        {profile.pronouns && (
          <p
            className="label-mono"
            style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}
          >
            {profile.pronouns}
          </p>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-mist)', margin: '1.5rem 0' }} />

        {/* Major(s) */}
        {profile.major && profile.major.length > 0 && (
          <Section label="Studying">
            <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', color: 'var(--color-ink)', margin: 0 }}>
              {profile.major.join(' · ')}
            </p>
          </Section>
        )}

        {/* Clubs */}
        {profile.clubs && profile.clubs.length > 0 && (
          <Section label="Member of">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {profile.clubs.map((club, idx) => (
                <Link
                  key={idx}
                  href={`/?search=${encodeURIComponent(club)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.375rem 0.875rem',
                    background: 'var(--color-white)',
                    border: '1px solid var(--color-mist)',
                    borderRadius: '9999px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8125rem',
                    color: 'var(--color-ink)',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(26,20,16,0.04)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-columbia)';
                    e.currentTarget.style.color = 'var(--color-columbia)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-mist)';
                    e.currentTarget.style.color = 'var(--color-ink)';
                  }}
                >
                  {club}
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Q&A Responses */}
        {profile.responses && profile.responses.length > 0 && (
          <>
            {profile.responses.map((r, i) => (
              <Section key={i} label={r.question}>
                <p
                  style={{
                    fontFamily: 'var(--font-body), serif',
                    fontSize: '0.9375rem',
                    fontStyle: i === profile.responses.length - 1 ? 'italic' : 'normal',
                    color: 'var(--color-ink-soft)',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {i === profile.responses.length - 1
                    ? `\u201C${r.answer}\u201D`
                    : r.answer}
                </p>
              </Section>
            ))}
          </>
        )}

        {/* Social links */}
        {(profile.linkedin || profile.instagram || profile.twitter || profile.youtube || profile.tiktok || profile.facebook || profile.website) && (
          <Section label="Connect">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {profile.linkedin && (
                <SocialLink href={profile.linkedin} icon={<Linkedin width={16} height={16} />} label="LinkedIn" />
              )}
              {profile.instagram && (
                <SocialLink href={profile.instagram} icon={<Instagram width={16} height={16} />} label="Instagram" />
              )}
              {profile.twitter && (
                <SocialLink href={profile.twitter} icon={<Twitter width={16} height={16} />} label="Twitter" />
              )}
              {profile.youtube && (
                <SocialLink href={profile.youtube} icon={<Youtube width={16} height={16} />} label="YouTube" />
              )}
              {profile.tiktok && (
                <SocialLink href={profile.tiktok} icon={<Tiktok width={16} height={16} />} label="TikTok" />
              )}
              {profile.facebook && (
                <SocialLink href={profile.facebook} icon={<Facebook width={16} height={16} />} label="Facebook" />
              )}
              {profile.website && (
                <SocialLink href={profile.website} icon={<Globe width={16} height={16} />} label="Website" />
              )}
            </div>
          </Section>
        )}

        {/* Coffee request CTA */}
        {!isOwn && (
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-mist)' }}>
            {successMessage ? (
              <p
                style={{
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  color: 'var(--color-columbia)',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,63,138,0.06)',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,63,138,0.15)',
                }}
              >
                {successMessage}
              </p>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Coffee size={15} />
                Send a coffee request
              </button>
            )}
          </div>
        )}
      </div>

      {/* Coffee request modal */}
      {showModal && (
        <CoffeeRequestModal
          receiver={profile}
          senderId={currentUserId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setSuccessMessage(`Your request was sent to ${profile.name.split(' ')[0]}. They'll be in touch soon.`);
          }}
        />
      )}
    </div>
  );
}

// ——— helpers ———

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  if (!href.startsWith('https://')) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontFamily: 'var(--font-mono), monospace',
        fontSize: '0.68rem',
        letterSpacing: '0.01em',
        color: 'var(--color-columbia)',
        textDecoration: 'none',
        padding: '0.375rem 0.625rem',
        border: '1px solid var(--color-columbia-pale)',
        borderRadius: '2px',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-columbia-pale)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {label}
    </a>
  );
}
