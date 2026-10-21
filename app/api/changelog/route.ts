import { CHANGELOG } from '@/lib/changelog';

export async function GET() {
  return Response.json({ changelog: CHANGELOG });
}
