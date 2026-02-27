import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isAllowedDomain } from '@/lib/constants';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

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

  // Check if user is brand new (no draft, no published profile)
  const serviceClient = createSupabaseServiceClient();
  const [draftRes, profileRes] = await Promise.all([
    serviceClient
      .from('draft_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    serviceClient
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const isNewUser = !draftRes.data && !profileRes.data;
  const destination = isNewUser ? '/onboarding' : next;

  return NextResponse.redirect(`${origin}${destination}`);
}
