import { NextResponse } from 'next/server';
import { getCurrentUser, getUserRole } from '@/lib/auth';
import { DEV_BYPASS } from '@/lib/dev-bypass';

export async function GET() {
  if (DEV_BYPASS) return NextResponse.json({ role: 'super_admin' });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ role: null });
  const role = await getUserRole(user.id);
  return NextResponse.json({ role: role ?? null });
}
