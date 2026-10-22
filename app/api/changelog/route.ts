import { getChangelog } from '@/lib/changelog';
import { getLocale } from '@/lib/i18n';

export async function GET() {
  const locale = await getLocale();
  return Response.json({ changelog: getChangelog(locale) });
}
