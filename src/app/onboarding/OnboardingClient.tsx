'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Upload, ChevronLeft, ChevronDown, Trash2, Plus } from 'lucide-react';
import {
  SCHOOL_GROUPS,
  UNDERGRAD_SCHOOL_CODES,
  UNDERGRAD_YEARS,
  GRAD_YEARS,
  YEARS,
  DEGREE_GROUPS,
  PROFILE_QUESTIONS_GROUPED,
  PROFILE_QUESTIONS,
  COFFEE_QUESTION,
} from '@/lib/constants';
import type { School, DraftProfile } from '@/types';
import PromptDropdown from '@/components/PromptDropdown';

interface Props {
  userId: string;
  userEmail: string;
  initialDraft?: DraftProfile | null;
}

// Strip a known URL prefix to recover a bare handle for social inputs
function extractHandle(url: string | null | undefined, prefix: string): string {
  if (!url) return '';
  return url.startsWith(prefix) ? url.slice(prefix.length) : '';
}

// Determine the first incomplete step so the user resumes where they left off
function inferInitialStep(draft: DraftProfile | null): number {
  if (!draft) return 1;
  if (!draft.image_url) return 1;
  if (!draft.name) return 2;
  const hasCoffee = draft.responses.some(r => r.question === COFFEE_QUESTION);
  const profileQs = draft.responses.filter(r => r.question !== COFFEE_QUESTION);
  if (!hasCoffee || profileQs.length < 2) return 3;
  return 4;
}

const STEP_LABELS = ['', 'Photo', 'The basics', 'About you', 'Socials', "You're live!"];

// Inspiring example answers keyed by question — shown as textarea placeholder
const ANSWER_PLACEHOLDERS: Record<string, string> = {
  "What's something you've recently changed your mind about?":
    "e.g. I used to think productivity meant doing more. Now I think it means doing less — but actually finishing it.",
  "Where on campus do you go to think clearly?":
    "e.g. The steps behind Low before anyone shows up, or Riverside Park when I need to actually move.",
  "What's a topic you could talk about for 20 minutes with zero prep?":
    "e.g. Why cities that feel chaotic often work better than ones designed for order. Or the psychology of procrastination.",
  "What's a problem people tend to come to you for?":
    "e.g. Untangling messy arguments, figuring out what question someone is actually trying to answer.",
  "What's a small obsession you have right now?":
    "e.g. Vertical-axis wind turbines. Convinced they're underrated for cities. I've been reading too much about this.",
  "When do you feel most like yourself?":
    "e.g. In a museum on a Tuesday when it's nearly empty. Or when I'm in the middle of building something.",
  "What are you quietly trying to get better at this semester?":
    "e.g. Actually asking for help instead of spending three days figuring it out alone.",
};

export default function OnboardingClient({ userId: _userId, userEmail: _userEmail, initialDraft }: Props) {
  const draft = initialDraft ?? null;

  // Separate stored responses into profile Q&As vs. the coffee/availability question
  const savedProfileQs = draft?.responses.filter(r => r.question !== COFFEE_QUESTION) ?? [];
  const savedCoffeeAnswer = draft?.responses.find(r => r.question === COFFEE_QUESTION)?.answer ?? '';
  // Ensure at least 2 slots with real questions pre-selected for new users
  const initialProfileResponses =
    savedProfileQs.length >= 2
      ? savedProfileQs.map(r => ({ question: r.question, answer: r.answer }))
      : [
        ...savedProfileQs.map(r => ({ question: r.question, answer: r.answer })),
        ...Array.from({ length: 2 - savedProfileQs.length }, (_, i) => ({
          question: PROFILE_QUESTIONS[savedProfileQs.length + i] ?? '',
          answer: '',
        })),
      ];

  const [step, setStep] = useState(() => (draft ? inferInitialStep(draft) : 0));
  const [animKey, setAnimKey] = useState(0);

  // Step 1 — Photo
  const [photoUrl, setPhotoUrl] = useState(draft?.image_url ?? '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — Basics
  const [name, setName] = useState(draft?.name ?? '');
  const [school, setSchool] = useState<School | ''>(draft?.school ?? '');
  const [year, setYear] = useState(draft?.year ?? '');
  const [degree, setDegree] = useState(draft?.degree ?? '');
  const [pronouns, setPronouns] = useState(draft?.pronouns ?? '');
  const [nameError, setNameError] = useState('');

  // Handle Referral Pre-fill
  useEffect(() => {
    if (!school) { // only pre-fill if they haven't explicitly chosen or saved one
      const storedSchool = sessionStorage.getItem('referral_school');
      if (storedSchool) {
        setSchool(storedSchool as School);
      }
    }
  }, [school]);

  // Step 3 — About
  const [coffeeAnswer, setCoffeeAnswer] = useState(savedCoffeeAnswer);
  const [profileResponses, setProfileResponses] = useState(initialProfileResponses);
  const [responsesError, setResponsesError] = useState('');

  // Step 4 — Socials
  const [igHandle, setIgHandle] = useState(extractHandle(draft?.instagram, 'https://instagram.com/'));
  const [liHandle, setLiHandle] = useState(extractHandle(draft?.linkedin, 'https://linkedin.com/in/'));
  const [twitterHandle, setTwitterHandle] = useState(extractHandle(draft?.twitter, 'https://twitter.com/'));
  const [tiktokHandle, setTiktokHandle] = useState(extractHandle(draft?.tiktok, 'https://tiktok.com/@'));
  const [websiteUrl, setWebsiteUrl] = useState(draft?.website ?? '');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [publishStatus, setPublishStatus] = useState<'published' | 'draft' | null>(null);

  const isUndergrad = UNDERGRAD_SCHOOL_CODES.has(school);
  const yearOptions = isUndergrad ? UNDERGRAD_YEARS : school ? GRAD_YEARS : YEARS;

  // ——— Photo upload ———
  const handlePhotoUpload = async (file: File) => {
    setPhotoError('');
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Photo must be under 5 MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/profile/upload-photo', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) {
        setPhotoError(json.error ?? 'Upload failed. Please try again.');
        return;
      }
      const newUrl = `${json.url}?t=${Date.now()}`;
      setPhotoUrl(newUrl);
      // Persist immediately so a refresh doesn't lose the uploaded photo
      saveProgress(true, newUrl).catch(() => { });
      return;
    } catch {
      setPhotoError('Upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ——— Save to API ———
  // photoUrlOverride lets us pass the freshly-uploaded URL before React state has updated
  const saveProgress = async (draftOnly: boolean, photoUrlOverride?: string): Promise<'published' | 'draft'> => {
    const effectivePhotoUrl = photoUrlOverride !== undefined ? photoUrlOverride : photoUrl;
    const responses = [
      ...profileResponses.filter(r => r.question && r.answer.trim()),
      ...(coffeeAnswer.trim() ? [{ question: COFFEE_QUESTION, answer: coffeeAnswer.trim() }] : []),
    ];

    const toUrl = (base: string, handle: string) =>
      handle.trim() ? `${base}${handle.trim().replace(/^@/, '')}` : '';

    const payload = {
      name: name.trim(),
      school: school,
      year: year,
      degree: degree,
      major: [],
      pronouns: pronouns.trim(),
      responses,
      image_url: effectivePhotoUrl || null,
      is_public: true,
      twitter: toUrl('https://twitter.com/', twitterHandle),
      facebook: '',
      linkedin: toUrl('https://linkedin.com/in/', liHandle),
      instagram: toUrl('https://instagram.com/', igHandle),
      youtube: '',
      tiktok: toUrl('https://tiktok.com/@', tiktokHandle),
      website: websiteUrl.trim().startsWith('https://') ? websiteUrl.trim() : '',
      phone: '',
      draft_only: draftOnly,
    };

    const res = await fetch('/api/profile/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error ?? 'Save failed. Please try again.');
    return json.status as 'published' | 'draft';
  };

  // ——— Navigation ———
  const advance = async (draftOnly = true) => {
    setSaveError('');
    setSaving(true);
    try {
      let status: 'published' | 'draft' | undefined;
      if (step >= 1) {
        status = await saveProgress(draftOnly);
      }
      if (step === 4 && status) setPublishStatus(status);
      setAnimKey(k => k + 1);
      setStep(s => s + 1);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (step <= 1) return;
    setNameError('');
    setSaveError('');
    setAnimKey(k => k + 1);
    setStep(s => s - 1);
  };

  const handleNext = async () => {
    if (step === 2) {
      if (!name.trim()) {
        setNameError('Please enter your name.');
        return;
      }
      if (name.trim().length > 40) {
        setNameError('Name must be 40 characters or fewer.');
        return;
      }
      setNameError('');
    }

    if (step === 3) {
      // Check each prompt slot with a question — needs an answer of at least 20 chars
      for (let i = 0; i < profileResponses.length; i++) {
        const r = profileResponses[i];
        if (!r.question) continue;
        if (!r.answer.trim()) {
          setResponsesError(`Prompt ${i + 1} needs an answer.`);
          return;
        }
        if (r.answer.trim().length < 20) {
          setResponsesError(`Prompt ${i + 1} is a bit short — add a little more detail.`);
          return;
        }
      }
      // Need at least 2 prompts with questions selected (loop above already checked length)
      const filledCount = profileResponses.filter(r => r.question && r.answer.trim()).length;
      if (filledCount < 2) {
        setResponsesError('Please choose and answer at least 2 prompts.');
        return;
      }
      // Check availability
      if (!coffeeAnswer.trim()) {
        setResponsesError("Please fill in when you're free to meet.");
        return;
      }
      if (coffeeAnswer.trim().length < 20) {
        setResponsesError('Your availability answer is a bit short — add a little more detail.');
        return;
      }
      setResponsesError('');
    }

    const isLastStep = step === 4;
    await advance(!isLastStep);
  };

  // ——— Profile response helpers ———
  const updateResponse = (index: number, field: 'question' | 'answer', value: string) => {
    setProfileResponses(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    if (responsesError) setResponsesError('');
  };

  const addResponse = () => {
    if (profileResponses.length < 5) {
      setProfileResponses(prev => [...prev, { question: '', answer: '' }]);
    }
  };

  const removeResponse = (index: number) => {
    if (profileResponses.length <= 2) return;
    setProfileResponses(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // Step 0 — Welcome
  // ============================================================
  if (step === 0) {
    return (
      <div
        className="animate-fade-in-up"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #002b6d 0%, #003f8a 55%, #0050b0 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '520px', width: '100%' }}>
          <h1
            className="heading-display"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 3.75rem)',
              color: '#ffffff',
              marginBottom: '1.25rem',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            You&rsquo;re in! 🎉
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.125rem',
              color: 'rgba(255,255,255,0.78)',
              lineHeight: 1.65,
              marginBottom: '3rem',
            }}
          >
            Welcome to Coffee@CU. We'll help you get set up in just a few minutes,
            and then you'll be live and have full access to the community.
          </p>
          <button
            onClick={() => {
              setAnimKey(k => k + 1);
              setStep(1);
            }}
            className="btn-primary"
            style={{
              fontSize: '0.8125rem',
              padding: '0.875rem 2.5rem',
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.38)',
            }}
          >
            Let&rsquo;s go →
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Step 5 — You're live!
  // ============================================================
  if (step === 5) {
    const isPublished = publishStatus === 'published';
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-limestone)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div key={animKey} className="animate-fade-in-up" style={{ maxWidth: '480px', width: '100%' }}>
          <p
            className="label-mono"
            style={{
              color: isPublished ? 'var(--color-columbia)' : 'var(--color-text-muted)',
              marginBottom: '1rem',
              letterSpacing: '0.12em',
            }}
          >
            {isPublished ? '✓ You\'re live' : '○ Draft saved'}
          </p>

          <h1
            className="heading-display"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              color: 'var(--color-ink)',
              marginBottom: '1rem',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            {isPublished ? 'Congrats! Your profile is live.' : 'Almost there.'}
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.125rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.65,
              marginBottom: isPublished ? '1.75rem' : '2rem',
            }}
          >
            {isPublished
              ? 'You can now send coffee (or tea!) requests to anyone in the community\u00a0\u2014 and they can reach out to you too.'
              : 'Add a photo to publish your profile. Your answers are saved as a draft.'}
          </p>

          {/* Photo preview (published with photo) */}
          {isPublished && photoUrl && (
            <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '180px',
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-mist)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ position: 'relative', paddingBottom: '122%', overflow: 'hidden' }}>
                  <Image
                    src={photoUrl}
                    alt={name || 'Your profile'}
                    fill
                    style={{ objectFit: 'cover' }}
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
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      left: '0.75rem',
                      right: '0.75rem',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-display), serif',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'white',
                        lineHeight: 1.2,
                        margin: 0,
                      }}
                    >
                      {name}
                    </p>
                  </div>
                </div>
                {(school || year) && (
                  <div style={{ padding: '0.6rem 0.75rem' }}>
                    {year && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.6rem',
                          letterSpacing: '0.06em',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {year}
                        {degree ? ` · ${degree}` : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nudge line */}
          {isPublished && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                color: 'var(--color-columbia)',
                lineHeight: 1.55,
                marginBottom: '1.75rem',
              }}
            >
              The first request is the hardest. Go send it.
            </p>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            {isPublished ? (
              <>
                <Link href="/" className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.875rem 2rem' }}>
                  Find someone to meet →
                </Link>
                <Link href="/profile" className="btn-ghost" style={{ fontSize: '0.75rem' }}>
                  Edit your profile
                </Link>
              </>
            ) : (
              <Link href="/profile" className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.875rem 2rem' }}>
                Add a photo to publish →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Steps 1–4 — Main flow
  // ============================================================
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-limestone)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ——— Top bar: back + progress ——— */}
      <div
        style={{
          borderBottom: '1px solid var(--color-mist)',
          padding: '1rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: '40px 1fr 40px',
          alignItems: 'center',
          background: 'var(--color-limestone)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {/* Back button — left column */}
        <button
          onClick={goBack}
          disabled={step === 1}
          aria-label="Go back"
          style={{
            background: 'none',
            border: 'none',
            padding: '0.2rem',
            cursor: step === 1 ? 'default' : 'pointer',
            color: step === 1 ? 'var(--color-mist)' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Progress — center column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                style={{
                  width: s === step ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '99px',
                  background: s < step ? 'var(--color-columbia)' : s === step ? 'var(--color-columbia)' : 'var(--color-mist)',
                  transition: 'all 300ms ease',
                }}
              />
            ))}
          </div>
          <span
            className="label-mono"
            style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', letterSpacing: '0.1em' }}
          >
            Step {step} of 5 — {STEP_LABELS[step]}
          </span>
        </div>

        {/* Spacer — right column (balances the back button) */}
        <div />
      </div>

      {/* ——— Content ——— */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 1.5rem',
        }}
      >
        <div
          key={animKey}
          className="animate-fade-in-up"
          style={{ width: '100%', maxWidth: '560px', paddingTop: '2.5rem', paddingBottom: '5rem' }}
        >
          {/* ——— Step 1: Photo ——— */}
          {step === 1 && (
            <>
              <h1
                className="heading-display"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                  color: 'var(--color-ink)',
                  marginBottom: '0.5rem',
                  textAlign: 'center',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                Add a photo
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-body), Georgia, serif',
                  fontStyle: 'italic',
                  color: 'var(--color-text-muted)',
                  marginBottom: '2.5rem',
                  lineHeight: 1.55,
                  textAlign: 'center',
                }}
              >
                Add a photo of yourself that will show you to the community. Only members with a live profile can see other profiles.
              </p>

              {/* Upload circle */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.25rem',
                  marginBottom: '2.5rem',
                }}
              >
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '144px',
                    height: '144px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: photoUrl
                      ? '3px solid var(--color-columbia)'
                      : '2px dashed var(--color-mist)',
                    background: 'var(--color-limestone-dk)',
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 180ms ease',
                  }}
                >
                  {photoUrl ? (
                    <Image src={photoUrl} alt="Your photo" fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <Image
                      src="/img/LionMascotblack.png"
                      alt="Upload a photo"
                      fill
                      style={{ objectFit: 'contain', padding: '20px', filter: 'grayscale(100%) opacity(0.35)' }}
                    />
                  )}
                </div>

                {photoUrl ? (
                  <div style={{ textAlign: 'center' }}>
                    <p
                      className="label-mono"
                      style={{ color: 'var(--color-columbia)', marginBottom: '0.5rem' }}
                    >
                      ✓ Photo uploaded
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-ghost"
                      disabled={uploadingPhoto}
                      style={{ fontSize: '0.7rem' }}
                    >
                      <Upload size={12} />
                      {uploadingPhoto ? 'Uploading…' : 'Change photo'}
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-ghost"
                      disabled={uploadingPhoto}
                    >
                      <Upload size={14} />
                      {uploadingPhoto ? 'Uploading…' : 'Choose a photo'}
                    </button>
                    <p
                      className="label-mono"
                      style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}
                    >
                      JPEG, PNG, WebP — max 5 MB
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                />
              </div>

              {photoError && (
                <p
                  className="form-error"
                  style={{ textAlign: 'center', marginBottom: '1rem' }}
                >
                  {photoError}
                </p>
              )}
            </>
          )}

          {/* ——— Step 2: Basics ——— */}
          {step === 2 && (
            <>
              <h1
                className="heading-display"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                  color: 'var(--color-ink)',
                  marginBottom: '0.5rem',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                The essentials
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-muted)',
                  fontSize: '1.0625rem',
                  marginBottom: '2.5rem',
                  lineHeight: 1.55,
                }}
              >
                Just the basics to help people get to know you before reaching out.
              </p>

              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {/* Name */}
                <div>
                  <label className="form-label" htmlFor="ob-name">
                    Full Name *
                  </label>
                  <input
                    id="ob-name"
                    className="form-input"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="Your name"
                    maxLength={40}
                    autoFocus
                  />
                  {nameError && <p className="form-error">{nameError}</p>}
                  <div
                    className={`char-count ${name.length >= 40 ? 'at-limit' : name.length >= 34 ? 'near-limit' : ''
                      }`}
                  >
                    {name.length}/40
                  </div>
                </div>

                {/* School + Year */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label" htmlFor="ob-school">
                      School
                    </label>
                    <select
                      id="ob-school"
                      className="form-input"
                      value={school}
                      onChange={e => {
                        setSchool(e.target.value as School | '');
                        setYear('');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">Select school</option>
                      {SCHOOL_GROUPS.map(group => (
                        <optgroup key={group.label} label={group.label}>
                          {group.schools.map(s => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" htmlFor="ob-year">
                      Year
                    </label>
                    <select
                      id="ob-year"
                      className="form-input"
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">Select year</option>
                      {yearOptions.map(y => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Degree + Pronouns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="form-label" htmlFor="ob-degree">
                      Degree
                    </label>
                    <select
                      id="ob-degree"
                      className="form-input"
                      value={degree}
                      onChange={e => setDegree(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">Select degree</option>
                      {DEGREE_GROUPS.map(group => (
                        <optgroup key={group.label} label={group.label}>
                          {group.degrees.map(d => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" htmlFor="ob-pronouns">
                      Pronouns
                    </label>
                    <input
                      id="ob-pronouns"
                      className="form-input"
                      value={pronouns}
                      onChange={e => setPronouns(e.target.value)}
                      placeholder="she/her, he/him…"
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ——— Step 3: About you ——— */}
          {step === 3 && (
            <>
              <h1
                className="heading-display"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                  color: 'var(--color-ink)',
                  marginBottom: '0.5rem',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                Tell us about yourself (no really!)
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-muted)',
                  fontSize: '1.0625rem',
                  marginBottom: '2.5rem',
                  lineHeight: 1.55,
                }}
              >
                These answers are what others read first when they find your profile. The more specific you are, the better the conversations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Profile Q&A cards */}
                {profileResponses.map((response, index) => {
                  const otherSelected = profileResponses
                    .filter((_, i) => i !== index)
                    .map(r => r.question)
                    .filter(Boolean);
                  const placeholder = ANSWER_PLACEHOLDERS[response.question] ?? 'Write something specific — the more real, the better.';

                  return (
                    <div
                      key={index}
                      style={{
                        background: 'var(--color-white)',
                        border: '1px solid var(--color-mist)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-card)',
                      }}
                    >
                      {/* Question selector row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          borderBottom: '1px solid #e5ddd0',
                          padding: '0 1rem 0 1.25rem',
                          gap: '0.25rem',
                        }}
                      >
                        <div style={{ flex: 1, position: 'relative' }}>
                          <PromptDropdown
                            value={response.question}
                            onChange={(val) => updateResponse(index, 'question', val)}
                            otherSelected={otherSelected}
                          />
                        </div>
                        {profileResponses.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeResponse(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--color-text-muted)',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              flexShrink: 0,
                              opacity: 0.6,
                            }}
                            aria-label="Remove prompt"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Answer textarea */}
                      <textarea
                        value={response.answer}
                        onChange={e => {
                          updateResponse(index, 'answer', e.target.value.slice(0, 400));
                          if (responsesError) setResponsesError('');
                        }}
                        placeholder={placeholder}
                        rows={3}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          resize: 'vertical',
                          padding: '1rem 1.25rem',
                          fontFamily: 'var(--font-body)',
                          fontSize: '1rem',
                          color: 'var(--color-ink)',
                          lineHeight: 1.6,
                          outline: 'none',
                          display: 'block',
                          boxSizing: 'border-box',
                        }}
                      />

                      {/* Char count footer */}
                      <div style={{ padding: '0 1.25rem 0.625rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <span
                          className={`char-count ${response.answer.length >= 400 ? 'at-limit' : response.answer.length >= 340 ? 'near-limit' : ''}`}
                          style={{ marginTop: 0 }}
                        >
                          {response.answer.length}/400
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Add another prompt — dashed card button */}
                {profileResponses.length < 5 && (
                  <button
                    type="button"
                    onClick={addResponse}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      background: 'none',
                      border: '1.5px dashed #ddd4c8',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.1em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'border-color 150ms, color 150ms',
                    }}
                  >
                    <Plus size={12} />
                    ADD ANOTHER PROMPT
                  </button>
                )}

                {/* Availability divider */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    margin: '0.375rem 0 0',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', background: '#e0d8ce' }} />
                  <span
                    className="label-mono"
                    style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem', letterSpacing: '0.14em' }}
                  >
                    AVAILABILITY
                  </span>
                  <div style={{ flex: 1, height: '1px', background: '#e0d8ce' }} />
                </div>

                {/* Availability card */}
                <div
                  style={{
                    background: 'var(--color-white)',
                    border: '1px solid var(--color-mist)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  {/* Fixed question header */}
                  <div
                    style={{
                      padding: '0.875rem 1.25rem',
                      borderBottom: '1px solid #e5ddd0',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                      }}
                    >
                      When are you generally free to meet?
                    </span>
                    <span style={{ color: '#c0a882', marginLeft: '0.25rem', fontSize: '0.8rem' }}>*</span>
                  </div>

                  {/* Answer textarea */}
                  <textarea
                    id="ob-coffee"
                    value={coffeeAnswer}
                    onChange={e => {
                      setCoffeeAnswer(e.target.value.slice(0, 250));
                      if (responsesError) setResponsesError('');
                    }}
                    placeholder="e.g. Weekday afternoons work well — I like getting out of the library. Joe Coffee or a walk around the quad."
                    rows={3}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      resize: 'vertical',
                      padding: '0.875rem 1.25rem',
                      fontFamily: 'var(--font-body), Georgia, serif',
                      fontSize: '0.9375rem',
                      color: 'var(--color-ink)',
                      lineHeight: 1.6,
                      outline: 'none',
                      display: 'block',
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Char count footer */}
                  <div style={{ padding: '0 1.25rem 0.625rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <span
                      className={`char-count ${coffeeAnswer.length >= 250 ? 'at-limit' : coffeeAnswer.length >= 212 ? 'near-limit' : ''}`}
                      style={{ marginTop: 0 }}
                    >
                      {coffeeAnswer.length}/250
                    </span>
                  </div>
                </div>
              </div>

              {responsesError && (
                <p className="form-error" style={{ marginTop: '1rem' }}>{responsesError}</p>
              )}
            </>
          )}

          {/* ——— Step 4: Socials ——— */}
          {step === 4 && (
            <>
              <h1
                className="heading-display"
                style={{
                  fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
                  color: 'var(--color-ink)',
                  marginBottom: '0.5rem',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                Link your socials
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-muted)',
                  fontSize: '1.0625rem',
                  marginBottom: '2.5rem',
                  lineHeight: 1.55,
                }}
              >
                Optional. Skip if you&rsquo;d rather keep it simple. Handles make it easy for people to find you after chatting.
              </p>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Instagram */}
                <div>
                  <label className="form-label" htmlFor="ob-ig">Instagram</label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-limestone-dk)',
                        border: '1px solid var(--color-mist)',
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        padding: '0.625rem 0.75rem',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      instagram.com/
                    </span>
                    <input
                      id="ob-ig"
                      className="form-input"
                      value={igHandle}
                      onChange={e => setIgHandle(e.target.value)}
                      placeholder="yourhandle"
                      style={{ borderRadius: '0 6px 6px 0' }}
                    />
                  </div>
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="form-label" htmlFor="ob-li">LinkedIn</label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-limestone-dk)',
                        border: '1px solid var(--color-mist)',
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        padding: '0.625rem 0.75rem',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      linkedin.com/in/
                    </span>
                    <input
                      id="ob-li"
                      className="form-input"
                      value={liHandle}
                      onChange={e => setLiHandle(e.target.value)}
                      placeholder="yourhandle"
                      style={{ borderRadius: '0 6px 6px 0' }}
                    />
                  </div>
                </div>

                {/* Twitter/X */}
                <div>
                  <label className="form-label" htmlFor="ob-tw">Twitter / X</label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-limestone-dk)',
                        border: '1px solid var(--color-mist)',
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        padding: '0.625rem 0.75rem',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      twitter.com/
                    </span>
                    <input
                      id="ob-tw"
                      className="form-input"
                      value={twitterHandle}
                      onChange={e => setTwitterHandle(e.target.value)}
                      placeholder="yourhandle"
                      style={{ borderRadius: '0 6px 6px 0' }}
                    />
                  </div>
                </div>

                {/* TikTok */}
                <div>
                  <label className="form-label" htmlFor="ob-tt">TikTok</label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-muted)',
                        background: 'var(--color-limestone-dk)',
                        border: '1px solid var(--color-mist)',
                        borderRight: 'none',
                        borderRadius: '6px 0 0 6px',
                        padding: '0.625rem 0.75rem',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      tiktok.com/@
                    </span>
                    <input
                      id="ob-tt"
                      className="form-input"
                      value={tiktokHandle}
                      onChange={e => setTiktokHandle(e.target.value)}
                      placeholder="yourhandle"
                      style={{ borderRadius: '0 6px 6px 0' }}
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="form-label" htmlFor="ob-web">Website</label>
                  <input
                    id="ob-web"
                    className="form-input"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    type="url"
                  />
                </div>
              </div>
            </>
          )}

          {/* ——— Save error ——— */}
          {saveError && (
            <div className="status-banner status-removed" style={{ marginTop: '1.5rem' }}>
              <span>✕</span>
              <span>{saveError}</span>
            </div>
          )}

          {/* ——— Action buttons ——— */}
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleNext}
              className="btn-primary"
              disabled={saving || uploadingPhoto}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.875rem',
                fontSize: '0.8125rem',
                opacity: saving || uploadingPhoto ? 0.7 : 1,
              }}
            >
              {saving
                ? 'Saving…'
                : step === 4
                  ? 'Publish my profile →'
                  : 'Save and continue →'}
            </button>

            {/* Skip photo (step 1 only) */}
            {step === 1 && (
              <button
                onClick={() => advance(true)}
                className="btn-ghost"
                disabled={saving}
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Skip hint for photo step */}
          {step === 1 && (
            <p
              className="label-mono"
              style={{
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                marginTop: '1rem',
                fontSize: '0.65rem',
              }}
            >
              Skipping means your profile will be saved as a draft until you add a photo.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
