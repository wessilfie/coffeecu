import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email';
import { getUniFromEmail } from '@/lib/constants';
import { z } from 'zod';

// ============================================================
// POST /api/profile/save
// Security:
// - Auth required
// - Columbia domain enforced
// - uni derived server-side (never trust client)
// - URL fields validated server-side
// - Atomically publishes or saves as draft
// ============================================================

const urlSchema = z.string().refine(
  val => val === '' || (val.startsWith('https://') && val.length <= 500),
  { message: 'Invalid URL' }
).optional().transform(v => v || null);

const schema = z.object({
  name: z.string().max(40).optional().transform(v => {
    const trimmed = v?.trim();
    return trimmed ? trimmed : null;
  }),
  school: z.string().optional().transform(v => v || null),
  year: z.string().optional().transform(v => v || null),
  degree: z.string().optional().transform(v => v || null),
  major: z.array(z.string()).max(3).default([]),
  pronouns: z.string().max(50).optional().transform(v => v || null),
  responses: z.array(
    z.object({
      question: z.string().min(1).max(300),
      answer: z.string().min(1).max(500),
    })
  ).max(5).default([]),
  twitter: urlSchema,
  facebook: urlSchema,
  linkedin: urlSchema,
  instagram: urlSchema,
  youtube: urlSchema,
  tiktok: urlSchema,
  website: urlSchema,
  phone: z.string().max(20).optional().transform(v => v || null),
  is_public: z.boolean().default(true),
  image_url: z.string().nullable().optional(),
  draft_only: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'You need to be signed in to save your profile. Please sign in and try again.' }, { status: 401 });

    // 2. Columbia domain
    const email = user.email ?? '';
    const domain = email.split('@')[1]?.toLowerCase();
    if (!['columbia.edu', 'barnard.edu'].includes(domain)) {
      return NextResponse.json({ error: 'Coffee@CU is only open to @columbia.edu and @barnard.edu addresses.' }, { status: 403 });
    }

    // 3. Parse + validate
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      // Log full details so the field path is visible in the dev server console
      console.error('[profile/save] Validation failed:', JSON.stringify(parsed.error.issues, null, 2));
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message ?? 'Invalid request', field: first?.path?.join('.') },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // 4. Derive server-controlled fields (never from client)
    const uni = getUniFromEmail(email);
    const university = domain === 'barnard.edu' ? 'columbia' : 'columbia'; // both Columbia

    const serviceClient = createSupabaseServiceClient();
    const imageUrl = data.image_url ?? null;
    const hasPhoto = !!imageUrl;

    if (!data.draft_only && hasPhoto && !data.name) {
      return NextResponse.json({ error: 'Name is required to publish your profile.' }, { status: 400 });
    }

    const canPublish = hasPhoto && !!data.name && !data.draft_only;

    if (canPublish) {
      const publishName = data.name as string;

      // Check if this is a first-time publish (for welcome email)
      const { data: existing } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const isFirstPublish = !existing;

      // Upsert into profiles (publishes immediately)
      const { error: profileError } = await serviceClient.from('profiles').upsert({
        user_id: user.id,
        email,
        uni,
        university,
        name: publishName,
        school: data.school,
        year: data.year,
        degree: data.degree,
        major: data.major,
        pronouns: data.pronouns,
        responses: data.responses,
        twitter: data.twitter,
        facebook: data.facebook,
        linkedin: data.linkedin,
        instagram: data.instagram,
        youtube: data.youtube,
        tiktok: data.tiktok,
        website: data.website,
        phone: data.phone,
        image_url: imageUrl,
        is_public: data.is_public,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // Remove draft (now published)
      await serviceClient.from('draft_profiles').delete().eq('user_id', user.id);

      // Send welcome email on first publish
      if (isFirstPublish) {
        await sendWelcomeEmail({ name: publishName, email }).catch(console.error);
      }

      return NextResponse.json({ ok: true, status: 'published' });
    } else {
      // No photo yet — save as draft
      const { error: draftError } = await serviceClient.from('draft_profiles').upsert({
        user_id: user.id,
        email,
        uni,
        university,
        name: data.name,
        school: data.school,
        year: data.year,
        degree: data.degree,
        major: data.major,
        pronouns: data.pronouns,
        responses: data.responses,
        twitter: data.twitter,
        facebook: data.facebook,
        linkedin: data.linkedin,
        instagram: data.instagram,
        youtube: data.youtube,
        tiktok: data.tiktok,
        website: data.website,
        phone: data.phone,
        image_url: imageUrl,
        is_public: data.is_public,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (draftError) throw draftError;

      return NextResponse.json({ ok: true, status: 'draft' });
    }
  } catch (err) {
    console.error('[profile/save]', err);
    return NextResponse.json({ error: 'Save failed. Please try again.' }, { status: 500 });
  }
}
