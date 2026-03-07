import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'You need to be signed in to upload a photo.' },
      { status: 401 }
    );
  }

  // Now we accept metadata instead of the file itself to bypass Vercel limits
  const body = await req.json().catch(() => ({}));
  const { contentType, extension } = body;
  console.log('[upload-photo] Request body:', body);

  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    console.warn('[upload-photo] Invalid content type:', contentType);
    return NextResponse.json(
      { error: 'Please provide a valid image type (JPEG, PNG, WebP, or GIF).' },
      { status: 400 }
    );
  }

  const safeExt = (extension || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5);
  const path = `profiles/${user.id}/avatar.${safeExt}`;
  console.log('[upload-photo] Path:', path);

  const serviceClient = createSupabaseServiceClient();

  // Generate a signed upload URL (valid for 60 seconds)
  // upsert: true allows replacing existing files
  const { data, error } = await serviceClient.storage
    .from('profile-photos')
    .createSignedUploadUrl(path, { upsert: true });

  if (error || !data) {
    console.error('[upload-photo] Error generating signed URL:', error);
    return NextResponse.json(
      { error: `Failed to prepare upload: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }

  // Get the public URL that will be used after upload
  const { data: publicUrlData } = serviceClient.storage
    .from('profile-photos')
    .getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token, // Some SDK versions might need this
    path: data.path,
    publicUrl: publicUrlData.publicUrl
  });
}
