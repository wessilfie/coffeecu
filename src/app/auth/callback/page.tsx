import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-limestone)' }}>
          <p style={{ fontFamily: 'var(--font-body), serif', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Signing you in…
          </p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
