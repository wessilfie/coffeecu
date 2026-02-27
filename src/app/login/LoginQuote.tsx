'use client';

import { useState, useEffect } from 'react';

const QUOTES = [
  {
    text: "I met one of my closest friends on Coffee@CU. We're still close nearly a decade later.",
    attr: 'Columbia alum',
  },
  {
    text: "I'm getting married to someone I met for tea once on here.",
    attr: 'Columbia alum',
  },
  {
    text: "I've wanted to find other folks looking to get into entrepreneurship. Coffee@CU is helping me meet others in that space I might not have met otherwise.",
    attr: "CBS '26 MBA candidate",
  },
  {
    text: 'I already go to Dear Mama midday; will be nice to have some others to meet over there.',
    attr: "CBS '26 EMBA candidate",
  },
];

export default function LoginQuote() {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  return (
    <blockquote style={{ margin: 0 }}>
      <p
        style={{
          fontFamily: 'var(--font-display), serif',
          fontStyle: 'italic',
          fontSize: 'clamp(1.625rem, 3vw, 2.25rem)',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.97)',
          lineHeight: 1.35,
          marginBottom: '1.25rem',
        }}
      >
        &ldquo;{quote.text}&rdquo;
      </p>
      <footer
        style={{
          fontFamily: 'var(--font-body), serif',
          fontSize: '0.8125rem',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        {quote.attr}
      </footer>
    </blockquote>
  );
}
