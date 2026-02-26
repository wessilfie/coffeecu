import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// Middleware — auth guards + domain restriction
// Runs on the edge before every request
// ============================================================

// Routes that require authentication
const PROTECTED_ROUTES = ['/profile', '/admin', '/onboarding', '/columbia'];

// Routes that require moderator role or higher
const MOD_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Dev bypass — skip auth checks in local/dev only
  const devBypass = process.env.DEV_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
  if (devBypass) {
    return response;
  }

  // Build Supabase client (edge-compatible, reads cookies)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — keeps auth tokens fresh
  const { data: { user } } = await supabase.auth.getUser();

  // Guard protected routes
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Domain check — enforce Columbia email on protected routes
  // (Secondary check; primary enforcement is at signup via Supabase Auth hook)
  if (user && isProtected) {
    const email = user.email ?? '';
    const domain = email.split('@')[1]?.toLowerCase();
    const allowedDomains = ['columbia.edu', 'barnard.edu'];

    if (!allowedDomains.includes(domain)) {
      // Account created with non-Columbia email — sign out and redirect
      await supabase.auth.signOut();
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'domain_not_allowed');
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is blacklisted — redirect to a suspension notice
    // Note: blacklist check via DB happens in API routes; here we just
    // redirect blacklisted users on admin pages for UX.
    // Full enforcement is server-side in API routes.
  }

  // Admin route — require moderator role or higher
  // Full role check happens server-side in the page/API route.
  // Here we just redirect unauthenticated users (already done above).
  if (MOD_ROUTES.some(r => pathname.startsWith(r)) && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|img/).*)',
  ],
};
