'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { Upload, Plus, Trash2, ChevronDown } from 'lucide-react';
import { SCHOOL_GROUPS, UNDERGRAD_SCHOOL_CODES, DEGREE_GROUPS, MAJORS, CBS_CLUBS, PROFILE_QUESTIONS_GROUPED, PROFILE_QUESTIONS, COFFEE_QUESTION } from '@/lib/constants';
import { deriveYearLabel } from '@/lib/year-utils';
import type { ProfileFormData, FullProfile, DraftProfile, School, ProfileResponse } from '@/types';
import PromptDropdown from '@/components/PromptDropdown';

// ============================================================
// Validation schema — mirrors DB constraints
// URLs must be https:// (security: prevent javascript: injection)
// ============================================================

const urlSchema = z.string().refine(
  val => val === '' || (val.startsWith('https://') && val.length <= 500),
  { message: 'Must be a valid https:// URL' }
);

const schema = z.object({
  name: z.string().min(1, 'Name required').max(40, 'Max 40 characters'),
  school: z.union([z.enum(['CC', 'SEAS', 'GS', 'BC', 'GSAS', 'BUS', 'LAW', 'VPS', 'JRN', 'SIPA', 'GSAPP', 'SOA', 'SW', 'PH', 'NRS', 'DM', 'SPS', 'CS', 'TC'] as const), z.literal('')]),
  year: z.string(),
  degree: z.string(),
  major: z.array(z.string()).max(3, 'Select up to 3 majors'),
  clubs: z.array(z.string()).max(10, 'Select up to 10 clubs'),
  pronouns: z.string().max(50, 'Max 50 characters'),
  responses: z.array(z.object({ question: z.string(), answer: z.string() })),
  twitter: urlSchema,
  facebook: urlSchema,
  linkedin: urlSchema,
  instagram: urlSchema,
  youtube: urlSchema,
  tiktok: urlSchema,
  website: urlSchema,
  phone: z.string().max(20, 'Max 20 characters'),
  is_public: z.boolean(),
});

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

interface Props {
  userId: string;
  userEmail: string;
  existingProfile: FullProfile | null;
  existingDraft: DraftProfile | null;
}

export default function ProfileForm({ userId, userEmail, existingProfile, existingDraft }: Props) {
  const source = existingDraft ?? existingProfile;

  // Separate coffee answer from optional responses on load
  const existingResponses: ProfileResponse[] = source?.responses ?? [];
  const existingCoffeeEntry = existingResponses.find(r => r.question === COFFEE_QUESTION);
  const existingOptional = existingResponses.filter(r => r.question !== COFFEE_QUESTION);

  // Prefer draft image if set, otherwise fall back to published profile image.
  // Drafts created before a photo was uploaded won't have image_url, but the
  // published profile will — don't let an old draft override the real photo.
  const [imageUrl, setImageUrl] = useState(
    existingDraft?.image_url || existingProfile?.image_url || ''
  );
  const [roleType, setRoleType] = useState<'student' | 'faculty' | 'staff'>(
    source?.designation === 'faculty' ? 'faculty'
      : source?.designation === 'staff' ? 'staff'
        : 'student'
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveMsg, setSaveMsg] = useState('');
  const [savedAsPublished, setSavedAsPublished] = useState(false);
  const [responsesError, setResponsesError] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSaveMsg, setAutoSaveMsg] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMountRef = useRef(false);
  const autoSaveInFlightRef = useRef(false);
  const pendingAutoSaveRef = useRef(false);
  const lastSavedDraftPayloadRef = useRef('');
  const draftDirtyRef = useRef(false);

  // Q&A state — managed outside react-hook-form
  const [optionalResponses, setOptionalResponses] = useState<Array<{ question: string; answer: string }>>(
    existingOptional.length > 0 ? existingOptional : [{ question: '', answer: '' }]
  );
  const [coffeeAnswer, setCoffeeAnswer] = useState(existingCoffeeEntry?.answer ?? '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, watch, getValues, setValue, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: source?.name ?? '',
      school: (source?.school ?? '') as School | '',
      year: source?.year ?? '',
      degree: source?.degree ?? '',
      major: source?.major ?? [],
      clubs: source?.clubs ?? [],
      pronouns: source?.pronouns ?? '',
      responses: [],
      twitter: source?.twitter ?? '',
      facebook: source?.facebook ?? '',
      linkedin: source?.linkedin ?? '',
      instagram: source?.instagram ?? '',
      youtube: source?.youtube ?? '',
      tiktok: source?.tiktok ?? '',
      website: source?.website ?? '',
      phone: (source as FullProfile)?.phone ?? '',
      is_public: source?.is_public ?? true,
    },
  });

  // Character counters
  const watchedValues = watch(['name', 'pronouns']);
  const selectedSchool = watch('school');
  const isUndergrad = UNDERGRAD_SCHOOL_CODES.has(selectedSchool);
  // ——— Auto-save (debounced, draft only) ———
  const allFormValues = watch();

  const buildDraftPayload = useCallback(() => {
    const values = getValues();
    const responses: ProfileResponse[] = [
      ...optionalResponses.filter(r => r.question && r.answer.trim()),
      ...(coffeeAnswer.trim() ? [{ question: COFFEE_QUESTION, answer: coffeeAnswer.trim() }] : []),
    ];
    return {
      ...values,
      major: isUndergrad ? values.major : [],
      responses,
      image_url: imageUrl || null,
      draft_only: true,
      designation: roleType
    };
  }, [getValues, isUndergrad, optionalResponses, coffeeAnswer, imageUrl]);

  const runAutoSave = useCallback(async (keepalive = false) => {
    const payload = buildDraftPayload();
    const payloadString = JSON.stringify(payload);

    if (payloadString === lastSavedDraftPayloadRef.current) return;
    if (autoSaveInFlightRef.current) {
      pendingAutoSaveRef.current = true;
      return;
    }

    autoSaveInFlightRef.current = true;
    setAutoSaveStatus('saving');
    setAutoSaveMsg('');

    try {
      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadString,
        keepalive,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? 'Autosave failed');

      lastSavedDraftPayloadRef.current = payloadString;
      draftDirtyRef.current = false;
      setAutoSaveStatus('saved');
      setAutoSaveMsg(`Saved at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
    } catch (err) {
      setAutoSaveStatus('error');
      setAutoSaveMsg(err instanceof Error ? err.message : 'Autosave failed. Please try again.');
    } finally {
      autoSaveInFlightRef.current = false;
      if (pendingAutoSaveRef.current) {
        pendingAutoSaveRef.current = false;
        void runAutoSave();
      }
    }
  }, [buildDraftPayload]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    draftDirtyRef.current = true;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(runAutoSave, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [allFormValues, optionalResponses, coffeeAnswer, imageUrl, runAutoSave]);

  useEffect(() => {
    const flushDraftSave = () => {
      if (!draftDirtyRef.current) return;
      const payload = buildDraftPayload();
      const payloadString = JSON.stringify(payload);
      if (payloadString === lastSavedDraftPayloadRef.current) return;

      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payloadString], { type: 'application/json' });
        navigator.sendBeacon('/api/profile/save', blob);
        return;
      }

      void fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadString,
        keepalive: true,
      }).catch(() => { });
    };

    const onBeforeUnload = () => flushDraftSave();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushDraftSave();
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [buildDraftPayload]);

  // ——— Photo upload ———
  // Requires Supabase setup:
  //   1. Storage bucket named "profile-photos" (public)
  //   2. Bucket policy: authenticated users can INSERT/UPDATE objects under "profiles/{userId}/*"
  //   3. Public read policy on the bucket
  const handlePhotoUpload = async (file: File) => {
    setPhotoError('');
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError('Photo must be under 10MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const body = new FormData();
      body.append('file', file);

      const res = await fetch('/api/profile/upload-photo', { method: 'POST', body });
      const json = await res.json();

      if (!res.ok) {
        setPhotoError(json.error ?? 'Photo upload failed. Please try again.');
        return;
      }

      const urlWithBust = `${json.url}?t=${Date.now()}`;
      setImageUrl(urlWithBust);
      window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: { url: urlWithBust } }));
    } catch (err) {
      console.error('Photo upload failed:', err);
      setPhotoError('Photo upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ——— Form submit ———
  const onSubmit = async (data: ProfileFormData) => {
    setResponsesError('');
    setSubmitAttempted(true);

    // Validate Q&A
    const validOptional = optionalResponses.filter(r => r.question && r.answer.trim().length >= 20);
    if (validOptional.length === 0) {
      setResponsesError('Answer at least one prompt (20 characters minimum).');
      return;
    }
    if (coffeeAnswer.trim().length < 20) {
      setResponsesError('The availability question needs a brief answer (20 characters minimum).');
      return;
    }

    const responses: ProfileResponse[] = [
      ...validOptional,
      { question: COFFEE_QUESTION, answer: coffeeAnswer.trim() },
    ];

    setSaving(true);
    setSaveStatus('idle');

    try {
      const payload = {
        ...data,
        major: isUndergrad ? data.major : [],
        responses,
        image_url: imageUrl || null,
        designation: roleType,
        // uni and email are set server-side from verified email
      };

      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Save failed');

      lastSavedDraftPayloadRef.current = JSON.stringify({ ...payload, draft_only: true });
      draftDirtyRef.current = false;
      setAutoSaveStatus('saved');
      setAutoSaveMsg(`Saved at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
      setSaveStatus('saved');
      setSavedAsPublished(result.status === 'published');
      setSaveMsg(imageUrl ? 'Profile published! You&rsquo;re now on the community board.' : 'Draft saved. Add a photo to publish your profile.');
    } catch (err) {
      setSaveStatus('error');
      setSaveMsg(err instanceof Error ? err.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ——— Social link normalization ———
  const SOCIAL_BASES: Partial<Record<string, string>> = {
    instagram: 'https://instagram.com/',
    twitter: 'https://x.com/',
    linkedin: 'https://linkedin.com/in/',
    youtube: 'https://youtube.com/@',
    tiktok: 'https://tiktok.com/@',
    facebook: 'https://facebook.com/',
  };

  const normalizeSocialOnBlur = (field: 'linkedin' | 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'facebook' | 'website') => (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (!raw || raw.startsWith('https://') || raw.startsWith('http://')) return;
    const base = SOCIAL_BASES[field];
    if (!base) return;
    const username = raw.startsWith('@') ? raw.slice(1) : raw;
    setValue(field, base + username, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ——— PHOTO SECTION ——— */}
      <Section title="Profile Photo" required>
        <p
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.875rem',
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
            marginBottom: '1rem',
            lineHeight: 1.55,
          }}
        >
          Required to publish your profile. A clear, friendly photo helps the community connect with you.
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Preview */}
          <div
            style={{
              width: '120px',
              height: '160px',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '2px dashed var(--color-mist)',
              background: 'var(--color-limestone-dk)',
              flexShrink: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={imageUrl || '/img/LionMascotblack.png'}
              alt={imageUrl ? 'Your photo' : 'Default profile photo'}
              fill
              sizes="120px"
              style={{
                objectFit: imageUrl ? 'cover' : 'contain',
                padding: imageUrl ? 0 : '8px',
              }}
            />
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost"
              disabled={uploadingPhoto}
              style={{ marginBottom: '0.5rem' }}
            >
              <Upload size={14} />
              {uploadingPhoto ? 'Uploading…' : imageUrl ? 'Change photo' : 'Upload photo'}
            </button>
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              JPEG, PNG, WebP — max 10MB
            </p>
            {photoError && (
              <p className="label-mono" style={{ color: 'var(--color-error)', marginTop: '0.5rem' }}>
                {photoError}
              </p>
            )}
          </div>
        </div>
      </Section>

      <Divider />

      {/* ——— BASIC INFO ——— */}
      <Section title="Basic Information" required>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="account_email">Account Email</label>
            <input
              id="account_email"
              className="form-input"
              value={userEmail}
              readOnly
              disabled
              style={{ background: 'var(--color-limestone-dk)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}
            />
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Your account email cannot be changed
            </p>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="name">Full Name *</label>
            <input id="name" className="form-input" {...register('name')} placeholder="Your name" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
            <CharCount value={watchedValues[0]} max={40} />
          </div>

          <div>
            <label className="form-label" htmlFor="school">School</label>
            <select id="school" className="form-input" {...register('school')} style={{ cursor: 'pointer' }}>
              <option value="">Select school</option>
              {SCHOOL_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.schools.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Role</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['student', 'faculty', 'staff'] as const).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleType(role)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid',
                    borderRadius: 'var(--radius, 3px)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    fontWeight: roleType === role ? 600 : 400,
                    borderColor: roleType === role ? 'var(--color-columbia)' : '#d1d5db',
                    background: roleType === role ? 'var(--color-columbia)' : 'transparent',
                    color: roleType === role ? '#fff' : 'inherit',
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {roleType === 'student' && (
            <div>
              <label className="form-label" htmlFor="year">Graduation Year</label>
              <input
                id="year"
                type="number"
                className="form-input"
                placeholder="e.g. 2026"
                min={1950}
                max={2040}
                {...register('year')}
              />
              {(() => {
                const yr = watch('year');
                const label = yr && selectedSchool ? deriveYearLabel(yr, selectedSchool || null) : null;
                return label ? (
                  <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginTop: '0.3rem', fontSize: '0.75rem' }}>
                    {label}
                  </p>
                ) : null;
              })()}
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="degree">Degree Program</label>
            <select id="degree" className="form-input" {...register('degree')} style={{ cursor: 'pointer' }}>
              <option value="">Select degree</option>
              {DEGREE_GROUPS.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.degrees.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="pronouns">Pronouns</label>
            <input id="pronouns" className="form-input" {...register('pronouns')} placeholder="they/them, she/her, he/him…" />
            <CharCount value={watchedValues[1]} max={50} />
          </div>
        </div>

        {/* Majors — undergrad only */}
        {isUndergrad && <div style={{ marginTop: '1rem' }}>
          <label className="form-label">Major(s) — select up to 3</label>
          <Controller
            name="major"
            control={control}
            render={({ field }) => (
              <div style={{ position: 'relative' }}>
                <select
                  className="form-input"
                  multiple
                  value={field.value}
                  onChange={e => {
                    const selected = Array.from(e.target.selectedOptions, o => o.value);
                    if (selected.length <= 3) field.onChange(selected);
                  }}
                  size={5}
                  style={{ height: 'auto', minHeight: '120px' }}
                >
                  {MAJORS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {field.value.length > 0 && (
                  <p className="label-mono" style={{ marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>
                    Selected: {field.value.join(' · ')}
                  </p>
                )}
              </div>
            )}
          />
        </div>}

        {/* Student Clubs — BUS only */}
        {selectedSchool === 'BUS' && <div style={{ marginTop: '1rem' }}>
          <label className="form-label">Student Clubs</label>
          <Controller
            name="clubs"
            control={control}
            render={({ field }) => (
              <ClubPicker
                value={field.value}
                onChange={field.onChange}
                max={10}
              />
            )}
          />
        </div>}
      </Section>

      <Divider />

      {/* ——— THE INTERESTING STUFF ——— */}
      <Section title="Tell people a bit about you">
        <p
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.875rem',
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
            marginBottom: '1.5rem',
            lineHeight: 1.55,
          }}
        >
          Answer at least one prompt below (50 characters minimum). The last question is required.
        </p>

        {responsesError && (
          <p className="form-error" style={{ marginBottom: '1rem' }}>{responsesError}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Optional response cards */}
          {optionalResponses.map((slot, i) => {
            const usedQuestions = optionalResponses
              .map((r, j) => j !== i ? r.question : null)
              .filter(Boolean) as string[];
            const placeholder = ANSWER_PLACEHOLDERS[slot.question] ?? 'Write something specific — the more real, the better.';

            return (
              <div
                key={i}
                style={{
                  background: '#fdfaf5',
                  border: '1px solid #e5ddd0',
                  borderRadius: '12px',
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
                      value={slot.question}
                      onChange={(val) => setOptionalResponses(prev => prev.map((r, j) => j === i ? { ...r, question: val } : r))}
                      otherSelected={usedQuestions}
                    />
                  </div>
                  {optionalResponses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setOptionalResponses(prev => prev.filter((_, j) => j !== i))}
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
                  value={slot.answer}
                  onChange={e => setOptionalResponses(prev => prev.map((r, j) => j === i ? { ...r, answer: e.target.value.slice(0, 400) } : r))}
                  placeholder={placeholder}
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
                <div style={{ padding: '0 1.25rem 0.625rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {submitAttempted && slot.question && slot.answer.trim().length > 0 && slot.answer.trim().length < 20 ? (
                    <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.65rem', color: 'var(--color-error)' }}>
                      A bit short — add a little more
                    </span>
                  ) : submitAttempted && slot.question && slot.answer.trim().length === 0 ? (
                    <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.65rem', color: 'var(--color-error)' }}>
                      Answer this prompt or remove it
                    </span>
                  ) : <span />}
                  <span
                    className={`char-count ${slot.answer.length >= 400 ? 'at-limit' : slot.answer.length >= 340 ? 'near-limit' : ''}`}
                    style={{ marginTop: 0 }}
                  >
                    {slot.answer.length}/400
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add prompt button — dashed card */}
          {optionalResponses.length < 3 && (
            <button
              type="button"
              onClick={() => setOptionalResponses(prev => [...prev, { question: '', answer: '' }])}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.375rem 0 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e0d8ce' }} />
            <span className="label-mono" style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem', letterSpacing: '0.14em' }}>
              AVAILABILITY
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e0d8ce' }} />
          </div>

          {/* Fixed coffee question card */}
          <div
            style={{
              background: '#fdfaf5',
              border: '1px solid #e5ddd0',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #e5ddd0' }}>
              <span
                style={{
                  fontFamily: 'var(--font-body), Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '0.9375rem',
                  color: 'var(--color-ink)',
                }}
              >
                {COFFEE_QUESTION}
              </span>
              <span style={{ color: '#c0a882', marginLeft: '0.25rem', fontSize: '0.8rem' }}>*</span>
            </div>
            <textarea
              id="coffee_answer"
              value={coffeeAnswer}
              onChange={e => setCoffeeAnswer(e.target.value.slice(0, 250))}
              placeholder="e.g. Tuesday afternoons at Joe Coffee in Geffen Hall, weekends near campus, happy to walk through Morningside Park…"
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
            <div style={{ padding: '0 1.25rem 0.625rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {submitAttempted && coffeeAnswer.trim().length > 0 && coffeeAnswer.trim().length < 20 ? (
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.65rem', color: 'var(--color-error)' }}>
                  A bit short — add a little more
                </span>
              ) : submitAttempted && coffeeAnswer.trim().length === 0 ? (
                <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.65rem', color: 'var(--color-error)' }}>
                  Required — let people know when you're free
                </span>
              ) : <span />}
              <span
                className={`char-count ${coffeeAnswer.length >= 250 ? 'at-limit' : coffeeAnswer.length >= 212 ? 'near-limit' : ''}`}
                style={{ marginTop: 0 }}
              >
                {coffeeAnswer.length}/250
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ——— SOCIAL LINKS ——— */}
      <Section title="Social Links">
        <p
          style={{
            fontFamily: 'var(--font-body), serif',
            fontSize: '0.8125rem',
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
            marginBottom: '1rem',
          }}
        >
          Enter a username or full URL — we&rsquo;ll build the link for you.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {(['linkedin', 'instagram', 'twitter', 'youtube', 'tiktok', 'facebook', 'website'] as const).map(field => {
            const fieldProps = register(field);
            return (
              <div key={field}>
                <label className="form-label" htmlFor={field}>
                  {field === 'twitter' ? 'X / Twitter' : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  id={field}
                  className="form-input"
                  {...fieldProps}
                  onBlur={(e) => {
                    normalizeSocialOnBlur(field)(e);
                    fieldProps.onBlur(e);
                  }}
                  placeholder={field === 'website' ? 'https://yoursite.com' : field === 'linkedin' ? 'username or full URL' : 'username or full URL'}
                />
                {errors[field] && <p className="form-error">{errors[field]?.message}</p>}
              </div>
            );
          })}
        </div>
      </Section>

      <Divider />

      {/* ——— NOTIFICATIONS & PRIVACY ——— */}
      <Section title="Notifications & Privacy">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label className="form-label" htmlFor="phone">
              Phone (optional — for future text notifications)
            </label>
            <input
              id="phone"
              className="form-input"
              {...register('phone')}
              placeholder="+1 (212) 555-0100"
              type="tel"
            />
            <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Never shared publicly. Used only to notify you of coffee requests.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Controller
              name="is_public"
              control={control}
              render={({ field }) => (
                <input
                  id="is_public"
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-columbia)' }}
                />
              )}
            />
            <label htmlFor="is_public">
              <span style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', color: 'var(--color-ink)' }}>
                Show my profile on the community board
              </span>
            </label>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ——— SUBMIT ——— */}
      {responsesError && (
        <div className="status-banner status-removed" style={{ marginBottom: '1.25rem' }}>
          <span>✕</span>
          <span>{responsesError}</span>
        </div>
      )}
      {saveStatus === 'saved' && (
        <div className="status-banner status-published" style={{ marginBottom: '1.25rem' }}>
          <span>✓</span>
          <span dangerouslySetInnerHTML={{ __html: saveMsg }} />
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="status-banner status-removed" style={{ marginBottom: '1.25rem' }}>
          <span>✕</span>
          <span>{saveMsg}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : imageUrl ? 'Publish Profile' : 'Save Draft'}
        </button>
        {!imageUrl && (
          <p className="label-mono" style={{ color: 'var(--color-text-muted)' }}>
            Add a photo to publish
          </p>
        )}
        {autoSaveStatus === 'saving' && (
          <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            Saving draft…
          </p>
        )}
        {autoSaveStatus === 'saved' && (
          <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            ✓ {autoSaveMsg || 'Draft saved'}
          </p>
        )}
        {autoSaveStatus === 'error' && (
          <p className="label-mono" style={{ color: 'var(--color-error)', marginLeft: 'auto' }}>
            {autoSaveMsg || 'Could not autosave'}
          </p>
        )}
      </div>

      {saveStatus === 'saved' && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-mist)' }}>
          <p style={{ fontFamily: 'var(--font-body), serif', fontSize: '0.9375rem', color: 'var(--color-ink-soft)', marginBottom: '0.75rem' }}>
            {savedAsPublished
              ? 'Your profile is live. Go see who else is here.'
              : "Want to see who's already here while you finish your profile?"}
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.01em',
              color: 'var(--color-columbia)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Browse the community →
          </Link>
        </div>
      )}
    </form>
  );
}

// ——— helpers ———

function Section({ title, children, required }: { title: string; children: React.ReactNode; required?: boolean }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2
        className="heading-section"
        style={{ fontSize: '1.375rem', color: 'var(--color-ink)', marginBottom: '1.25rem' }}
      >
        {title}
        {required && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 400, marginLeft: '0.5rem', fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.05em' }}>
            required
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

function Divider() {
  return <hr className="divider" />;
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = (value ?? '').length;
  const cls = len >= max ? 'at-limit' : len >= max * 0.85 ? 'near-limit' : '';
  return <div className={`char-count ${cls}`}>{len}/{max}</div>;
}

function ClubPicker({ value, onChange, max }: { value: string[]; onChange: (v: string[]) => void; max: number }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = query.trim()
    ? (CBS_CLUBS as readonly string[])
      .filter(c => !value.includes(c) && c.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8)
    : [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const add = (club: string) => {
    if (value.length >= max) return;
    onChange([...value, club]);
    setQuery('');
    inputRef.current?.focus();
  };

  const remove = (club: string) => {
    onChange(value.filter(c => c !== club));
  };

  return (
    <div ref={containerRef}>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          placeholder={value.length >= max ? `Max ${max} clubs selected` : 'Search clubs…'}
          value={query}
          disabled={value.length >= max}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          style={{ fontSize: '0.875rem' }}
        />

        {/* Dropdown */}
        {open && suggestions.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#ffffff',
              border: '1px solid var(--color-mist)',
              borderRadius: '6px',
              boxShadow: '0 4px 20px rgba(26,20,16,0.12)',
              listStyle: 'none',
              margin: 0,
              padding: '0.25rem 0',
              zIndex: 50,
              maxHeight: '240px',
              overflowY: 'auto',
            }}
          >
            {suggestions.map(club => (
              <li
                key={club}
                onMouseDown={e => { e.preventDefault(); add(club); setOpen(false); }}
                style={{
                  padding: '0.5rem 0.875rem',
                  fontFamily: 'var(--font-body), serif',
                  fontSize: '0.875rem',
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-limestone-dk, #ece8de)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {club}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected pills */}
      {value.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            marginTop: '0.625rem',
          }}
        >
          {value.map(club => (
            <span
              key={club}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'rgba(0,63,138,0.08)',
                border: '1px solid rgba(0,63,138,0.2)',
                borderRadius: '100px',
                padding: '0.25rem 0.625rem 0.25rem 0.75rem',
                fontFamily: 'var(--font-body), serif',
                fontSize: '0.8125rem',
                color: 'var(--color-columbia)',
                lineHeight: 1.3,
              }}
            >
              {club}
              <button
                type="button"
                onClick={() => remove(club)}
                aria-label={`Remove ${club}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'rgba(0,63,138,0.5)',
                  fontSize: '0.9rem',
                  lineHeight: 1,
                  marginLeft: '0.1rem',
                  transition: 'color 120ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-columbia)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,63,138,0.5)')}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Count hint */}
      <p className="label-mono" style={{ color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>
        {value.length}/{max} selected
      </p>
    </div>
  );
}
