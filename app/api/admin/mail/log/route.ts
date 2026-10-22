import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('memberId') || undefined;
  const campaignId = searchParams.get('campaignId') || undefined;
  const status = searchParams.get('status') || undefined;

  const where: Record<string, unknown> = {};
  if (memberId) where.member_id = memberId;
  if (campaignId) where.campaign_id = campaignId;
  if (status === 'enviat' || status === 'error') where.status = status;

  const logs = await prisma.mail_log.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: 500,
    include: {
      members: { select: { id: true, name: true, email: true } },
      mail_templates: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ logs });
}
