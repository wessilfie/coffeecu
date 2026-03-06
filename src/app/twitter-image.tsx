import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Coffee@CU — Meet the Columbia Community';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coffeeatcu.com';

export default async function TwitterImage() {
  const logoData = await fetch(`${APP_URL}/img/logo.png`).then((r) =>
    r.arrayBuffer()
  );

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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 60px 0 84px',
            flex: 1,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '36px' }}>
            <span
              style={{
                fontFamily: 'serif',
                fontSize: '1.75rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.92)',
                letterSpacing: '0.02em',
              }}
            >
              Coffee@CU
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'serif',
              fontSize: '3.25rem',
              fontWeight: 600,
              fontStyle: 'italic',
              color: '#ffffff',
              lineHeight: 1.12,
              margin: '0 0 24px',
              maxWidth: '660px',
            }}
          >
            Meet the Columbia community, one coffee at a time.
          </h1>
          <p
            style={{
              fontFamily: 'serif',
              fontSize: '1.1875rem',
              color: 'rgba(215,232,252,0.8)',
              margin: '0 0 40px',
              lineHeight: 1.5,
              maxWidth: '620px',
            }}
          >
            Connect with students, faculty & alumni across every Columbia school.
            Verified @columbia.edu and @barnard.edu addresses only.
          </p>
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '340px',
            padding: '50px',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
              display: 'flex',
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoData as unknown as string}
            alt="Coffee@CU logo"
            width={220}
            height={220}
            style={{ objectFit: 'contain', opacity: 0.96 }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
