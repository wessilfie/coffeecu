import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function hasValidMagicBytes(bytes: Uint8Array): boolean {
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  const isGif =
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61;
  const isWebp =
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  return isJpeg || isPng || isGif || isWebp;
}

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

  const headerBytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!hasValidMagicBytes(headerBytes)) {
    return NextResponse.json({ error: 'Invalid image file content.' }, { status: 400 });
  }

  const extByMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  const ext = extByMime[file.type] ?? 'jpg';
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
