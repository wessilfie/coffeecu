'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee } from 'lucide-react';
import type { Profile } from '@/types';

interface Props {
  receiver: Profile | null;
  senderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CoffeeRequestModal({ receiver, senderId, onClose, onSuccess }: Props) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const MAX_LENGTH = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiver || !message.trim()) return;

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/coffee-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: receiver.user_id,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrorMsg('Could not send your request. Please check your connection.');
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {receiver && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,20,16,0.6)',
              backdropFilter: 'blur(6px)',
              zIndex: 200,
            }}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-label="Request a coffee chat"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              maxWidth: '480px',
              background: 'var(--color-limestone)',
              borderRadius: '6px',
              boxShadow: '0 20px 60px rgba(26,20,16,0.25)',
              zIndex: 201,
              padding: '2rem',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Coffee size={18} color="var(--color-copper)" />
                  <p className="label-mono" style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                    Coffee Chat Request
                  </p>
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-display), serif',
                    fontSize: '1.625rem',
                    fontWeight: 400,
                    color: 'var(--color-ink)',
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Write to {receiver.name.split(' ')[0]}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: '0.25rem',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p
              style={{
                fontFamily: 'var(--font-body), serif',
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
                marginBottom: '1.25rem',
                lineHeight: 1.55,
              }}
            >
              Your message will be sent to {receiver.name}&rsquo;s email.
              They&rsquo;ll receive your contact info so you can set up a time to meet.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="coffee-message">
                  What would you like to talk about? *
                </label>
                <textarea
                  id="coffee-message"
                  className="form-input"
                  placeholder="I saw you're interested in urban policy — I've been working on a project about housing in Morningside Heights and would love your perspective..."
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                  required
                  rows={5}
                  style={{ resize: 'vertical', minHeight: '120px' }}
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
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '0.75rem',
                    color: 'var(--color-error)',
                    marginBottom: '1rem',
                    padding: '0.625rem 0.75rem',
                    background: 'rgba(155,28,28,0.06)',
                    borderRadius: '4px',
                    border: '1px solid rgba(155,28,28,0.2)',
                  }}
                >
                  {errorMsg}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} className="btn-ghost">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!message.trim() || status === 'sending'}
                  style={{ opacity: (!message.trim() || status === 'sending') ? 0.6 : 1 }}
                >
                  {status === 'sending' ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
