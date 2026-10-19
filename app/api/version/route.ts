import { getVersion } from '@/lib/version';

export async function GET() {
  const version = getVersion();
  return Response.json(version);
}
