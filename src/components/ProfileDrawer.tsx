'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee, Send } from 'lucide-react';
import { Twitter, Linkedin, Facebook, Instagram, Youtube, Tiktok, Globe } from 'iconoir-react';
import { SCHOOLS } from '@/lib/constants';
import type { Profile, School } from '@/types';

// Conversation starters — designed to surface personality, not LinkedIn bullets
const CONVERSATION_PROMPTS = [
  "What's your favorite underrated spot on campus?",
  "What was the last thing (book, show, podcast) that completely captivated you?",
  "What's something you're curious about that's totally outside your field?",
  "What's a question you've been thinking about lately?",
  "What's a class you took that changed how you see things?",
];

interface Props {
  profile: Profile | null;
  onClose: () => void;
  onCoffeeSuccess: (firstName: string, receiverId: string) => void;
  isLoggedIn: boolean;
  userId: string | null;
  sentRequests: { id: string; date: string }[];
}

export default function ProfileDrawer({ profile, onClose, onCoffeeSuccess, isLoggedIn, userId, sentRequests }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showCoffeeForm, setShowCoffeeForm] = useState(false);
  const [message, setMessage] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const MAX_LENGTH = 500;

  // Reset form state when profile changes
  useEffect(() => {
    setShowCoffeeForm(false);
    setMessage('');
    setStatus('idle');
    setErrorMsg('');
    setPromptIndex(Math.floor(Math.random() * CONVERSATION_PROMPTS.length));
  }, [profile?.id]);

  // Focus management and Escape key
  useEffect(() => {
    if (!profile) return;
    closeRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCoffeeForm) {
          setShowCoffeeForm(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [profile, onClose, showCoffeeForm]);

  // Auto-focus textarea when coffee form opens
  useEffect(() => {
    if (showCoffeeForm) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [showCoffeeForm]);

  const handleOpenCoffeeForm = useCallback(() => {
    setShowCoffeeForm(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !message.trim()) return;

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/coffee-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: profile.user_id,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      onCoffeeSuccess(profile.name.split(' ')[0], profile.user_id);
      onClose();
    } catch {
      setErrorMsg('Could not send your request. Please check your connection.');
      setStatus('error');
    }
  };

  const currentPrompt = CONVERSATION_PROMPTS[promptIndex];

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

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-label={`${profile.name}'s profile`}
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              background: 'var(--color-limestone)',
              border: '1px solid var(--color-mist)',
              borderRadius: '12px',
              boxShadow: '0 24px 48px rgba(26,20,16,0.2)',
              zIndex: 101,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ——— Scrollable body ——— */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

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

              {/* Profile photo and info */}
              <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '140px',
                    height: '140px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                >
                  <Image
                    src={profile.image_url}
                    alt={profile.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '0.25rem' }}>
                  {/* Name */}
                  <h2
                    style={{
                      fontFamily: 'var(--font-display), serif',
                      fontSize: '2rem',
                      fontWeight: 600,
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
                        {(SCHOOLS as { value: string; label: string }[]).find(s => s.value === profile.school)?.label ?? profile.school}
                      </span>
                    )}
                    {profile.degree && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '3px',
                          background: '#E8EEF6',
                          color: '#2A4A70',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {profile.degree}
                      </span>
                    )}
                    {profile.year && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.65rem',
                          color: 'var(--color-text-muted)',
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
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.7rem',
                        color: 'var(--color-text-muted)',
                        margin: '0 0 1.25rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {profile.pronouns}
                    </p>
                  )}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-mist)', margin: '0 1.5rem 1.25rem' }} />

              <div style={{ padding: '0 1.5rem 1.5rem', paddingTop: 0 }}>
                {/* Major */}
                {profile.major && profile.major.length > 0 && (
                  <Section label="Studying">
                    <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', color: 'var(--color-ink)', margin: 0 }}>
                      {profile.major.join(' · ')}
                    </p>
                  </Section>
                )}

                {/* CBS Clubs */}
                {profile.clubs && profile.clubs.length > 0 && (
                  <Section label="CBS Clubs">
                    <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', color: 'var(--color-ink)', margin: 0 }}>
                      {profile.clubs.join(' · ')}
                    </p>
                  </Section>
                )}

                {/* Q&A Responses */}
                {profile.responses && profile.responses.length > 0 && (
                  <>
                    {profile.responses.map((r, i) => (
                      <Section key={i} label={r.question}>
                        <p style={{
                          fontFamily: 'var(--font-body), serif',
                          fontSize: '0.9375rem',
                          fontStyle: i === profile.responses.length - 1 ? 'italic' : 'normal',
                          color: 'var(--color-ink-soft)',
                          lineHeight: 1.65,
                          margin: 0,
                        }}>
                          {i === profile.responses.length - 1
                            ? `\u201C${r.answer}\u201D`
                            : r.answer}
                        </p>
                      </Section>
                    ))}
                  </>
                )}

                {/* Social links */}
                {(profile.twitter || profile.facebook || profile.linkedin || profile.instagram || profile.youtube || profile.tiktok || profile.website) && (
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

                {/* Inline coffee request form — unfurls in place */}
                {isLoggedIn && profile.user_id !== userId && !sentRequests?.find(r => r.id === profile.user_id) && (
                  <div style={{ marginTop: showCoffeeForm ? '1.5rem' : 0, paddingTop: showCoffeeForm ? '1.5rem' : 0, borderTop: showCoffeeForm ? '1px solid var(--color-mist)' : 'none', transition: 'all 0.2s ease' }}>
                    <AnimatePresence>
                      {showCoffeeForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <form id="coffee-form" onSubmit={handleSubmit}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <Coffee size={16} color="var(--color-copper)" />
                              <p className="label-mono" style={{ color: 'var(--color-copper)', margin: 0 }}>
                                Coffee Chat with {profile.name.split(' ')[0]}
                              </p>
                            </div>

                            <p
                              style={{
                                fontFamily: 'var(--font-body), serif',
                                fontSize: '0.8125rem',
                                color: 'var(--color-text-muted)',
                                lineHeight: 1.55,
                                marginBottom: '1rem',
                              }}
                            >
                              Your message goes straight to {profile.name.split(' ')[0]}&rsquo;s email
                              with your contact info so you can find a time.
                            </p>

                            <div style={{ marginBottom: '0.5rem' }}>
                              <textarea
                                ref={textareaRef}
                                className="form-input"
                                placeholder={currentPrompt}
                                value={message}
                                onChange={e => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                                required
                                rows={4}
                                style={{ resize: 'vertical', minHeight: '100px', fontSize: '0.875rem' }}
                              />
                              <div
                                className={`char-count ${message.length >= MAX_LENGTH ? 'at-limit' : message.length >= MAX_LENGTH * 0.85 ? 'near-limit' : ''}`}
                              >
                                {message.length}/{MAX_LENGTH}
                              </div>
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>{/* end padding div */}

            </div>{/* end scrollable body */}

            {/* ——— Sticky footer: Always visible ——— */}
            <div
              style={{
                flexShrink: 0,
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--color-mist)',
                background: 'var(--color-limestone)',
              }}
            >
              {(() => {
                if (isLoggedIn && profile.user_id === userId) return null;

                const existingRequest = sentRequests?.find(r => r.id === profile.user_id);

                if (isLoggedIn && existingRequest) {
                  return (
                    <div
                      style={{
                        padding: '1rem',
                        background: 'rgba(0,63,138,0.06)',
                        border: '1px solid rgba(0,63,138,0.15)',
                        borderRadius: '6px',
                        textAlign: 'center',
                      }}
                    >
                      <p
                        className="label-mono"
                        style={{
                          color: 'var(--color-columbia)',
                          marginBottom: '0.5rem',
                          fontSize: '0.75rem'
                        }}
                      >
                        Request sent on {new Date(existingRequest.date).toLocaleDateString()} ✓
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-body), serif',
                          fontSize: '0.875rem',
                          color: 'var(--color-ink-soft)',
                          margin: 0,
                          lineHeight: 1.4
                        }}
                      >
                        Check your email to follow up with {profile.name.split(' ')[0]}.
                      </p>
                    </div>
                  );
                }

                if (isLoggedIn) {
                  return (
                    <>
                      {/* Global errors */}
                      {status === 'error' && (
                        <p
                          style={{
                            fontFamily: 'var(--font-mono), monospace',
                            fontSize: '0.7rem',
                            color: 'var(--color-error)',
                            marginBottom: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(155,28,28,0.06)',
                            borderRadius: '4px',
                            border: '1px solid rgba(155,28,28,0.2)',
                          }}
                        >
                          {errorMsg}
                        </p>
                      )}

                      {/* The "Request" button — hidden when form is open */}
                      <AnimatePresence>
                        {!showCoffeeForm && (
                          <motion.div
                            initial={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <button
                              onClick={handleOpenCoffeeForm}
                              className="btn-primary"
                              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '1rem', gap: '0.5rem' }}
                            >
                              <Coffee size={15} />
                              Grab a coffee (or tea!)
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Cancel + Send options — only show when form is open */}
                      {showCoffeeForm && (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => setShowCoffeeForm(false)}
                            className="btn-ghost"
                            style={{ flex: 1 }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            form="coffee-form"
                            className="btn-primary"
                            disabled={!message.trim() || status === 'sending'}
                            style={{
                              flex: 1,
                              opacity: (!message.trim() || status === 'sending') ? 0.6 : 1,
                              gap: '0.375rem',
                            }}
                          >
                            <Send size={13} />
                            {status === 'sending' ? 'Sending...' : 'Send'}
                          </button>
                        </div>
                      )}
                    </>
                  );
                }

                return (
                  <p
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
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
                );
              })()}
            </div>
          </motion.div>
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
