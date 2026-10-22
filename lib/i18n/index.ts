import { cookies } from 'next/headers';
import caMessages, { type Messages } from './ca';
import esMessages from './es';

export type Locale = 'ca' | 'es';

export const LANG_COOKIE = 'lang';

export function getMessages(locale: Locale): Messages {
  return locale === 'es' ? esMessages : caMessages;
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return value === 'es' ? 'es' : 'ca';
}

export type { Messages };
