'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Twitter, Linkedin, Facebook, Globe, Coffee, Send } from 'lucide-react';
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
  onCoffeeSuccess: (name: string) => void;
  isLoggedIn: boolean;
  userId: string | null;
}

export default function ProfileDrawer({ profile, onClose, onCoffeeSuccess, isLoggedIn, userId }: Props) {
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

      onCoffeeSuccess(profile.name.split(' ')[0]);
      onClose();
    } catch {
      setErrorMsg('Could not send your request. Please check your connection.');
      setStatus('error');
    }
  };

  const currentPrompt = CONVERSATION_PROMPTS[promptIndex];
  const nextPrompt = () => {
    setPromptIndex((i) => (i + 1) % CONVERSATION_PROMPTS.length);
  };

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
                    {SCHOOLS.find(s => s.value === profile.school)?.label ?? profile.school}
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

              {/* What to contact about */}
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

              {/* CTA + inline coffee form */}
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-mist)' }}>
                {isLoggedIn ? (
                  <>
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
                            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', fontSize: '0.75rem', gap: '0.5rem' }}
                          >
                            <Coffee size={15} />
                            Request a Coffee Chat
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Inline coffee request form — unfurls in place */}
                    <AnimatePresence>
                      {showCoffeeForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <form onSubmit={handleSubmit}>
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

                            {/* Conversation starter prompt */}
                            <div
                              style={{
                                background: 'var(--color-limestone-dk)',
                                border: '1px solid var(--color-mist)',
                                borderRadius: '4px',
                                padding: '0.75rem 1rem',
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                              }}
                            >
                              <p
                                style={{
                                  fontFamily: 'var(--font-body), serif',
                                  fontSize: '0.8125rem',
                                  fontStyle: 'italic',
                                  color: 'var(--color-ink-soft)',
                                  lineHeight: 1.5,
                                  margin: 0,
                                  flex: 1,
                                }}
                              >
                                Try answering: {currentPrompt}
                              </p>
                              <button
                                type="button"
                                onClick={nextPrompt}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-courier), monospace',
                                  fontSize: '0.6rem',
                                  letterSpacing: '0.1em',
                                  textTransform: 'uppercase',
                                  color: 'var(--color-columbia)',
                                  padding: '0.125rem 0',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                Another
                              </button>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                              <textarea
                                ref={textareaRef}
                                className="form-input"
                                placeholder="Write something real — what caught your eye about their profile, or just answer the prompt above..."
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

                            {status === 'error' && (
                              <p
                                style={{
                                  fontFamily: 'var(--font-courier), monospace',
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
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
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
