import { NextResponse } from 'next/server';
import { getCurrentMember } from '@/lib/auth/session';

export async function GET() {
  const member = await getCurrentMember();
  const isTpvOperator =
    Boolean(member) && member!.status === 'actiu' && (member!.admin || member!.tpv_operator);
  return NextResponse.json(
    {
      member: member ? { name: member.name, admin: member.admin, tpvOperator: isTpvOperator } : null,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
