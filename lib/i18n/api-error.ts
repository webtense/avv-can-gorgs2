import { NextResponse } from 'next/server';
import { getLocale, getMessages } from '@/lib/i18n';

type ApiErrorKey = keyof ReturnType<typeof getMessages>['apiErrors'];

/**
 * Construye una respuesta de error de API en el idioma de la cookie `lang`,
 * para que los mensajes de validación coincidan con el idioma del resto de
 * la página que los muestra (evita mezclar catalán y castellano).
 */
export async function apiError(
  key: ApiErrorKey,
  status: number,
  vars?: Record<string, string | number>
) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  let text: string = messages.apiErrors[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return NextResponse.json({ error: text }, { status });
}
