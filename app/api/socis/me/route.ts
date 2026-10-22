import { NextResponse } from 'next/server';
import { getCurrentMember } from '@/lib/auth/session';

export async function GET() {
  const member = await getCurrentMember();
  return NextResponse.json(
    { member: member ? { name: member.name, admin: member.admin } : null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
