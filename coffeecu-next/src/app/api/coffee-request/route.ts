import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { sendCoffeeRequestEmail } from '@/lib/email';
import { DAILY_REQUEST_LIMIT } from '@/lib/constants';
import { z } from 'zod';

// ============================================================
// POST /api/coffee-request
// Security-hardened:
// - Auth required
// - Columbia domain enforced
// - Blacklist check (via DB function)
// - Suspension check (via DB function)
// - Atomic rate-limit + dedup via DB function (no race conditions)
// - Server-side Zod validation
// - Self-request blocked
// - URL validation on social fields done at profile creation
// ============================================================

const schema = z.object({
  receiverId: z.string().uuid('Invalid receiver ID'),
  message: z
    .string()
    .min(10, 'Please write at least 10 characters')
    .max(1000, 'Message too long'),
});

const ERROR_MESSAGES: Record<string, string> = {
  self_request: "You can't send a coffee request to yourself.",
  blacklisted: "Your account has been restricted from sending requests.",
  suspended: "Your account is temporarily paused from sending coffee requests.",
  rate_limited: `You've reached your daily limit of ${DAILY_REQUEST_LIMIT} coffee requests. Come back tomorrow!`,
  duplicate: `You've already sent a coffee request to this person.`,
  error: "Something went wrong. Please try again.",
};

export async function POST(req: NextRequest) {
  try {
    // 1. Parse + validate input
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }
    const { receiverId, message } = parsed.data;

    // 2. Auth check
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to send coffee requests.' }, { status: 401 });
    }

    // 3. Columbia domain check (secondary enforcement)
    const email = user.email ?? '';
    const domain = email.split('@')[1]?.toLowerCase();
    const allowedDomains = ['columbia.edu', 'barnard.edu'];
    if (!allowedDomains.includes(domain)) {
      return NextResponse.json(
        { error: 'Coffee@CU is for Columbia University community members.' },
        { status: 403 }
      );
    }

    // 4. Atomic coffee request via DB function
    // This single function call handles: self-request, blacklist, suspension,
    // daily rate-limit (race-condition-safe), duplicate check — all in one transaction
    const serviceClient = createSupabaseServiceClient();
    const { data: result, error: fnError } = await serviceClient.rpc('attempt_coffee_request', {
      p_sender_id: user.id,
      p_receiver_id: receiverId,
      p_message: message.trim(),
      p_daily_limit: DAILY_REQUEST_LIMIT,
    });

    if (fnError) {
      console.error('[coffee-request] DB function error:', fnError);
      return NextResponse.json({ error: ERROR_MESSAGES.error }, { status: 500 });
    }

    const outcome = result as string;
    if (outcome !== 'ok') {
      const status = outcome === 'rate_limited' ? 429
        : outcome === 'blacklisted' || outcome === 'suspended' ? 403
        : 409;
      return NextResponse.json(
        { error: ERROR_MESSAGES[outcome] ?? ERROR_MESSAGES.error },
        { status }
      );
    }

    // 5. Fetch sender + receiver profiles for email (server-side — no client exposure)
    const [senderRes, receiverRes] = await Promise.all([
      serviceClient.from('profiles').select('name, email').eq('user_id', user.id).single(),
      serviceClient.from('profiles').select('name, email').eq('user_id', receiverId).single(),
    ]);

    if (!senderRes.data || !receiverRes.data) {
      // Meeting was logged; email failed gracefully (non-fatal)
      console.error('[coffee-request] Could not fetch profiles for email', { senderRes, receiverRes });
      return NextResponse.json({ ok: true, warning: 'Request sent but email delivery failed.' });
    }

    // 6. Send email via Resend
    await sendCoffeeRequestEmail({
      senderName: senderRes.data.name,
      senderEmail: senderRes.data.email ?? email,
      receiverName: receiverRes.data.name,
      receiverEmail: receiverRes.data.email ?? '',
      message: message.trim(),
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[coffee-request] Unexpected error:', err);
    return NextResponse.json({ error: ERROR_MESSAGES.error }, { status: 500 });
  }
}
