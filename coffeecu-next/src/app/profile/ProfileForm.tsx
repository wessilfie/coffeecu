'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Upload, Camera } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { SCHOOL_GROUPS, YEARS, MAJORS } from '@/lib/constants';
import type { ProfileFormData, FullProfile, DraftProfile, School } from '@/types';

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
  major: z.array(z.string()).max(3, 'Select up to 3 majors'),
  pronouns: z.string().max(50, 'Max 50 characters'),
  about: z.string().max(400, 'Max 400 characters'),
  likes: z.string().max(150, 'Max 150 characters'),
  contact_for: z.string().max(250, 'Max 250 characters'),
  availability: z.string().max(150, 'Max 150 characters'),
  twitter: urlSchema,
  facebook: urlSchema,
  linkedin: urlSchema,
  website: urlSchema,
  phone: z.string().max(20, 'Max 20 characters'),
  is_public: z.boolean(),
});

interface Props {
  userId: string;
  userEmail: string;
  existingProfile: FullProfile | null;
  existingDraft: DraftProfile | null;
}

export default function ProfileForm({ userId, userEmail, existingProfile, existingDraft }: Props) {
  const source = existingDraft ?? existingProfile;
  const [imageUrl, setImageUrl] = useState(source?.image_url ?? '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveMsg, setSaveMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseClient();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: source?.name ?? '',
      school: (source?.school ?? '') as School | '',
      year: source?.year ?? '',
      major: source?.major ?? [],
      pronouns: source?.pronouns ?? '',
      about: source?.about ?? '',
      likes: source?.likes ?? '',
      contact_for: source?.contact_for ?? '',
      availability: source?.availability ?? '',
      twitter: source?.twitter ?? '',
      facebook: source?.facebook ?? '',
      linkedin: source?.linkedin ?? '',
      website: source?.website ?? '',
      phone: (source as FullProfile)?.phone ?? '',
      is_public: source?.is_public ?? true,
    },
  });

  // Character counters
  const watchedValues = watch(['name', 'pronouns', 'about', 'likes', 'contact_for', 'availability']);

  // ——— Photo upload ———
  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be under 5MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `profiles/${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
      // Add cache-busting timestamp
      setImageUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Photo upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ——— Form submit ———
  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      const payload = {
        ...data,
        image_url: imageUrl || null,
        // uni and email are set server-side from verified email
      };

      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Save failed');

      setSaveStatus('saved');
      setSaveMsg(imageUrl ? 'Profile published! You&rsquo;re now on the community board.' : 'Draft saved. Add a photo to publish your profile.');
    } catch (err) {
      setSaveStatus('error');
      setSaveMsg(err instanceof Error ? err.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
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
            {imageUrl ? (
              <Image src={imageUrl} alt="Your photo" fill style={{ objectFit: 'cover' }} />
            ) : (
              <Camera size={32} color="var(--color-mist)" />
            )}
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
              JPEG, PNG, WebP — max 5MB
            </p>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ——— BASIC INFO ——— */}
      <Section title="Basic Information" required>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            <label className="form-label" htmlFor="year">Year</label>
            <select id="year" className="form-input" {...register('year')} style={{ cursor: 'pointer' }}>
              <option value="">Select year</option>
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="pronouns">Pronouns</label>
            <input id="pronouns" className="form-input" {...register('pronouns')} placeholder="they/them, she/her, he/him…" />
            <CharCount value={watchedValues[1]} max={50} />
          </div>
        </div>

        {/* Majors */}
        <div style={{ marginTop: '1rem' }}>
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
        </div>
      </Section>

      <Divider />

      {/* ——— THE INTERESTING STUFF ——— */}
      <Section title="The Interesting Stuff">
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div>
            <label className="form-label" htmlFor="about">
              What are you working on or thinking about these days?
            </label>
            <textarea
              id="about"
              className="form-input"
              {...register('about')}
              placeholder="Could be a thesis, a side project, a question you can't stop turning over, or just a new obsession…"
              rows={4}
              style={{ resize: 'vertical' }}
            />
            {errors.about && <p className="form-error">{errors.about.message}</p>}
            <CharCount value={watchedValues[2]} max={400} />
          </div>

          <div>
            <label className="form-label" htmlFor="likes">
              What do you do when you&apos;re not studying?
            </label>
            <input
              id="likes"
              className="form-input"
              {...register('likes')}
              placeholder="e.g. running the Riverside loop, reading sci-fi on the Steps, making pasta from scratch…"
            />
            {errors.likes && <p className="form-error">{errors.likes.message}</p>}
            <CharCount value={watchedValues[3]} max={150} />
          </div>

          <div>
            <label className="form-label" htmlFor="contact_for">
              What conversations energize you?
            </label>
            <p
              style={{
                fontFamily: 'var(--font-body), serif',
                fontSize: '0.8125rem',
                fontStyle: 'italic',
                color: 'var(--color-text-muted)',
                marginBottom: '0.375rem',
              }}
            >
              This is what people see on your card. Be specific — skip the LinkedIn summary.
            </p>
            <textarea
              id="contact_for"
              className="form-input"
              {...register('contact_for')}
              placeholder="e.g. why urban parks matter more than people think, what it's actually like to switch from pre-med to CS, the future of journalism…"
              rows={3}
            />
            {errors.contact_for && <p className="form-error">{errors.contact_for.message}</p>}
            <CharCount value={watchedValues[4]} max={250} />
          </div>

          <div>
            <label className="form-label" htmlFor="availability">
              Best way to grab coffee with you?
            </label>
            <input
              id="availability"
              className="form-input"
              {...register('availability')}
              placeholder="e.g. Tuesday afternoons at Joe Coffee, weekends near campus, happy to walk and talk…"
            />
            {errors.availability && <p className="form-error">{errors.availability.message}</p>}
            <CharCount value={watchedValues[5]} max={150} />
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
          All links must start with https://
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {(['linkedin', 'twitter', 'facebook', 'website'] as const).map(field => (
            <div key={field}>
              <label className="form-label" htmlFor={field}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                id={field}
                className="form-input"
                {...register(field)}
                placeholder={`https://${field === 'website' ? 'yoursite.com' : `${field}.com/username`}`}
              />
              {errors[field] && <p className="form-error">{errors[field]?.message}</p>}
            </div>
          ))}
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

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : imageUrl ? 'Publish Profile' : 'Save Draft'}
        </button>
        {!imageUrl && (
          <p className="label-mono" style={{ color: 'var(--color-text-muted)' }}>
            Add a photo to publish
          </p>
        )}
      </div>
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
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 400, marginLeft: '0.5rem', fontFamily: 'var(--font-courier), monospace', letterSpacing: '0.05em' }}>
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
