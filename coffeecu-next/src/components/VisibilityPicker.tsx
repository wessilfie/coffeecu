'use client';

import { COMMUNITY_CONFIG, SCHOOL_TO_COMMUNITY } from '@/lib/constants';

interface Props {
  viewerSchool: string | null;
  value: string[];
  onChange: (slugs: string[]) => void;
}

/**
 * Checkbox UI for choosing which communities a profile is visible in.
 * Rendered in step 4 of onboarding and in the privacy section of ProfileForm.
 *
 * Rules:
 * - University-wide ('columbia') is always an option.
 * - If the viewer has a school with a dedicated community, that slug is also offered.
 * - At least one box must remain checked (enforced by disabling the last checked box).
 */
export default function VisibilityPicker({ viewerSchool, value, onChange }: Props) {
  const schoolSlug = viewerSchool ? SCHOOL_TO_COMMUNITY[viewerSchool] : null;
  const schoolLabel = schoolSlug ? (COMMUNITY_CONFIG[schoolSlug]?.label ?? viewerSchool) : null;

  const toggle = (slug: string) => {
    const next = value.includes(slug) ? value.filter(s => s !== slug) : [...value, slug];
    // Prevent empty selection
    if (next.length === 0) return;
    onChange(next);
  };

  const options: { slug: string; label: string }[] = [
    { slug: 'columbia', label: 'Columbia University (all students & faculty)' },
    ...(schoolSlug && schoolLabel ? [{ slug: schoolSlug, label: schoolLabel }] : []),
  ];

  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-body), serif',
          fontSize: '0.875rem',
          fontStyle: 'italic',
          color: 'var(--color-text-muted)',
          marginBottom: '0.875rem',
          lineHeight: 1.55,
        }}
      >
        Choose where your profile appears. You can be visible across all of Columbia, just to your school&rsquo;s community, or both.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {options.map(({ slug, label }) => {
          const checked = value.includes(slug);
          // Disable if this is the only checked option (must keep at least one)
          const disabled = checked && value.length === 1;

          return (
            <label
              key={slug}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.55 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(slug)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  accentColor: 'var(--color-columbia)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-body), serif',
                  fontSize: '0.9375rem',
                  color: 'var(--color-ink)',
                  lineHeight: 1.4,
                }}
              >
                {label}
              </span>
            </label>
          );
        })}
      </div>

      {options.length === 1 && (
        <p
          style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '0.65rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.625rem',
            letterSpacing: '0.04em',
          }}
        >
          Set your school on the basics step to unlock school-specific visibility.
        </p>
      )}
    </div>
  );
}
