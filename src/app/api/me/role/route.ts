import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { DEV_BYPASS } from '@/lib/dev-bypass';

export async function GET() {
  const user = await getCurrentUser();
  if (user) {
    const role = await getUserRole(user.id);
    if (role) return NextResponse.json({ role });
  }

  if (DEV_BYPASS) return NextResponse.json({ role: 'super_admin' });
  return NextResponse.json({ role: null });
}
