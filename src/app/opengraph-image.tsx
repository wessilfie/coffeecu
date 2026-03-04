import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Coffee@CU — Meet the Columbia Community';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// ============================================================
// OG Image — auto-used by Next.js for og:image meta tag
// Shown when sharing links on WhatsApp, LinkedIn, iMessage, etc.
// ============================================================

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(140deg, #012a61 0%, #003F8A 55%, #0c5499 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left accent bar — Beaux-Arts feel */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '8px',
            background: 'rgba(244,240,230,0.88)',
            display: 'flex',
          }}
        />

        {/* Large ghosted "C" — texture / depth */}
        <div
          style={{
            position: 'absolute',
            right: '-30px',
            bottom: '-100px',
            fontSize: '580px',
            fontFamily: 'serif',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.04)',
            lineHeight: 1,
            display: 'flex',
            userSelect: 'none',
          }}
        >
          C
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 84px',
            flex: 1,
            position: 'relative',
          }}
        >
          {/* Brand mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginBottom: '44px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                background: 'rgba(255,255,255,0.13)',
                border: '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              ☕
            </div>
            <span
              style={{
                fontFamily: 'serif',
                fontSize: '1.625rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.96)',
                letterSpacing: '0.02em',
              }}
            >
              Coffee@CU
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: 'serif',
              fontSize: '3.5rem',
              fontWeight: 600,
              fontStyle: 'italic',
              color: '#ffffff',
              lineHeight: 1.12,
              margin: '0 0 28px',
              maxWidth: '840px',
            }}
          >
            Meet the Columbia community, one coffee at a time.
          </h1>

          {/* Description */}
          <p
            style={{
              fontFamily: 'serif',
              fontSize: '1.3125rem',
              color: 'rgba(215,232,252,0.8)',
              margin: '0 0 48px',
              lineHeight: 1.5,
              maxWidth: '740px',
            }}
          >
            Connect with students, faculty & alumni across every Columbia school.
            Verified @columbia.edu and @barnard.edu addresses only.
          </p>

          {/* URL badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.09)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '9px 18px',
              width: 'fit-content',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'rgba(210,228,250,0.72)',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
              }}
            >
              coffeeatcu.com
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
