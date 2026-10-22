import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

const COOKIE_NAME = 'soci_session';
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
const DEV_DEFAULT_SECRET = 'dev-only-secret-no-usar-en-produccio';

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET no està definida. L\'aplicació no pot arrencar en producció sense aquesta variable d\'entorn.'
    );
  }
  return DEV_DEFAULT_SECRET;
}

interface SessionPayload {
  memberId: string;
  exp: number;
}

function sign(data: string): string {
  return createHmac('sha256', getSessionSecret()).update(data).digest('hex');
}

function encodeSession(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json, 'utf8').toString('base64url');
  const signature = sign(data);
  return `${data}.${signature}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;
  const expected = sign(data);
  const expectedBuf = Buffer.from(expected, 'hex');
  const signatureBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== signatureBuf.length) return null;
  if (!timingSafeEqual(expectedBuf, signatureBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.memberId !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Crea la cookie de sessió per a un soci (es crida des d'una Server Action o Route Handler). */
export async function createSessionCookie(memberId: string): Promise<void> {
  const payload: SessionPayload = {
    memberId,
    exp: Math.floor(Date.now() / 1000) + THIRTY_DAYS_SECONDS,
  };
  const token = encodeSession(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS_SECONDS,
    path: '/',
  });
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export interface CurrentMember {
  id: string;
  name: string;
  email: string;
  status: string;
  admin: boolean;
  tpv_operator: boolean;
}

/** Retorna el soci de la sessió actual, o null si no hi ha sessió vàlida. */
export async function getCurrentMember(): Promise<CurrentMember | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = decodeSession(token);
  if (!payload) return null;

  const member = await prisma.members.findUnique({ where: { id: payload.memberId } });
  if (!member) return null;

  return {
    id: member.id,
    name: member.name,
    email: member.email,
    status: member.status,
    admin: member.admin,
    tpv_operator: member.tpv_operator,
  };
}

export async function getActiveMember(): Promise<CurrentMember | null> {
  const member = await getCurrentMember();
  if (!member || member.status !== 'actiu') return null;
  return member;
}

export async function getAdminMember(): Promise<CurrentMember | null> {
  const member = await getCurrentMember();
  if (!member || member.status !== 'actiu' || !member.admin) return null;
  return member;
}

/** Retorna el soci actual si és operador de TPV (o admin), o null. */
export async function getTpvOperator(): Promise<CurrentMember | null> {
  const member = await getCurrentMember();
  if (!member || member.status !== 'actiu') return null;
  if (!member.admin && !member.tpv_operator) return null;
  return member;
}
