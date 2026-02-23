'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Twitter, Linkedin, Facebook, Globe } from 'lucide-react';
import type { Profile, School } from '@/types';

const SCHOOL_LABELS: Record<School, string> = {
  CC:   'Columbia College',
  SEAS: 'School of Engineering & Applied Science',
  GS:   'School of General Studies',
  BC:   'Barnard College',
  GR:   'Graduate School',
};

interface Props {
  profile: Profile | null;
  onClose: () => void;
  onRequestCoffee: () => void;
  isLoggedIn: boolean;
}

export default function ProfileDrawer({ profile, onClose, onRequestCoffee, isLoggedIn }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!profile) return;
    closeRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [profile, onClose]);

  return (
    <AnimatePresence>
      {profile && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,20,16,0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
          />

          {/* Drawer */}
          <motion.aside
            role="dialog"
            aria-label={`${profile.name}'s profile`}
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '480px',
              background: 'var(--color-limestone)',
              borderLeft: '1px solid var(--color-mist)',
              boxShadow: '-8px 0 40px rgba(26,20,16,0.16)',
              zIndex: 101,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1rem 0' }}>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close profile"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: 'var(--color-text-muted)',
                  borderRadius: '4px',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-limestone-dk)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile photo */}
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <div
                style={{
                  position: 'relative',
                  width: '120px',
                  height: '160px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '1.25rem',
                }}
              >
                <Image
                  src={profile.image_url}
                  alt={profile.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>

              {/* Name */}
              <h2
                style={{
                  fontFamily: 'var(--font-cormorant), serif',
                  fontSize: '2rem',
                  fontWeight: 400,
                  color: 'var(--color-ink)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  margin: '0 0 0.5rem',
                }}
              >
                {profile.name}
              </h2>

              {/* School + Year */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                {profile.school && (
                  <span className={`badge badge-${profile.school}`}>
                    {SCHOOL_LABELS[profile.school as School]}
                  </span>
                )}
                {profile.year && (
                  <span
                    style={{
                      fontFamily: 'var(--font-courier), monospace',
                      fontSize: '0.65rem',
                      letterSpacing: '0.08em',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {profile.year}
                  </span>
                )}
              </div>

              {profile.pronouns && (
                <p
                  style={{
                    fontFamily: 'var(--font-courier), monospace',
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    margin: '0 0 1.25rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  {profile.pronouns}
                </p>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-mist)', margin: '1.25rem 0' }} />

              {/* Major */}
              {profile.major && profile.major.length > 0 && (
                <Section label="Studying">
                  <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', color: 'var(--color-ink)', margin: 0 }}>
                    {profile.major.join(' · ')}
                  </p>
                </Section>
              )}

              {/* About */}
              {profile.about && (
                <Section label="About">
                  <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', color: 'var(--color-ink-soft)', lineHeight: 1.65, margin: 0 }}>
                    {profile.about}
                  </p>
                </Section>
              )}

              {/* Likes */}
              {profile.likes && (
                <Section label="Interests">
                  <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', color: 'var(--color-ink-soft)', margin: 0 }}>
                    {profile.likes}
                  </p>
                </Section>
              )}

              {/* What to contact about — THE key community signal */}
              {profile.contact_for && (
                <Section label="Would love to discuss">
                  <p
                    style={{
                      fontFamily: 'var(--font-body), serif',
                      fontSize: '0.9375rem',
                      fontStyle: 'italic',
                      color: 'var(--color-ink)',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    &ldquo;{profile.contact_for}&rdquo;
                  </p>
                </Section>
              )}

              {/* Availability */}
              {profile.availability && (
                <Section label="Available">
                  <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', color: 'var(--color-ink-soft)', margin: 0 }}>
                    {profile.availability}
                  </p>
                </Section>
              )}

              {/* Social links */}
              {(profile.twitter || profile.facebook || profile.linkedin || profile.website) && (
                <Section label="Connect">
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {profile.linkedin && (
                      <SocialLink href={profile.linkedin} icon={<Linkedin size={15} />} label="LinkedIn" />
                    )}
                    {profile.twitter && (
                      <SocialLink href={profile.twitter} icon={<Twitter size={15} />} label="Twitter" />
                    )}
                    {profile.facebook && (
                      <SocialLink href={profile.facebook} icon={<Facebook size={15} />} label="Facebook" />
                    )}
                    {profile.website && (
                      <SocialLink href={profile.website} icon={<Globe size={15} />} label="Website" />
                    )}
                  </div>
                </Section>
              )}

              {/* CTA — community language, not dating */}
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-mist)' }}>
                {isLoggedIn ? (
                  <button
                    onClick={onRequestCoffee}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '0.75rem' }}
                  >
                    Request a Coffee Chat
                  </button>
                ) : (
                  <p
                    style={{
                      fontFamily: 'var(--font-courier), monospace',
                      fontSize: '0.7rem',
                      letterSpacing: '0.06em',
                      color: 'var(--color-text-muted)',
                      textAlign: 'center',
                    }}
                  >
                    <a href="/login" style={{ color: 'var(--color-columbia)', textDecoration: 'none' }}>
                      Sign in
                    </a>{' '}
                    to request a coffee chat
                  </p>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
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
  // Validate href starts with https:// (extra safety for XSS)
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
        fontFamily: 'var(--font-courier), monospace',
        fontSize: '0.68rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
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
      <ExternalLink size={10} />
    </a>
  );
}
