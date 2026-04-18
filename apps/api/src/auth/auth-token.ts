import { createHmac, timingSafeEqual } from 'node:crypto';

import type { MembershipRole } from '@einsatzpilot/types';

const defaultAuthTokenSecret = 'einsatzpilot-dev-secret';
const tokenLifetimeSeconds = 60 * 60 * 8;

export type AuthTokenPayload = {
  sub: string;
  email: string;
  companySlug?: string;
  membershipRole?: MembershipRole;
  iat: number;
  exp: number;
};

function getAuthTokenSecret() {
  return process.env.JWT_SECRET ?? defaultAuthTokenSecret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signSegment(segment: string) {
  return createHmac('sha256', getAuthTokenSecret()).update(segment).digest('base64url');
}

export function issueAuthToken(input: {
  user: {
    id: string;
    email: string;
  };
  companySlug?: string;
  membershipRole?: MembershipRole;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthTokenPayload = {
    sub: input.user.id,
    email: input.user.email,
    companySlug: input.companySlug,
    membershipRole: input.membershipRole,
    iat: now,
    exp: now + tokenLifetimeSeconds,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signSegment(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signSegment(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthTokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
