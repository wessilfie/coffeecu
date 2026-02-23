import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isAllowedDomain } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/profile';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] code exchange error:', error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // After code exchange, verify the email domain
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  if (!isAllowedDomain(user.email)) {
    // Sign out and redirect with domain error
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=domain&email=${encodeURIComponent(user.email)}`,
    );
  }

  // Redirect to /profile (or the 'next' param) after successful auth
  return NextResponse.redirect(`${origin}${next}`);
}
