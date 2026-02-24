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

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Please upload a JPEG, PNG, WebP, or GIF image.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Photo must be under 10MB.' }, { status: 400 });
  }

  const ext = (file instanceof File ? file.name.split('.').pop()?.toLowerCase() : null) ?? 'jpg';
  const path = `profiles/${user.id}/avatar.${ext}`;

  const serviceClient = createSupabaseServiceClient();
  const { error: uploadError } = await serviceClient.storage
    .from('profile-photos')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error('[upload-photo] Storage error:', uploadError);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }

  const { data } = serviceClient.storage.from('profile-photos').getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
