import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import type {
  AuthenticatedSession,
  DevelopmentLoginResponse,
  SessionResponse,
} from '@einsatzpilot/types';

import { fetchApiJson, getDevelopmentAuthHeaders } from './api';

export const sessionCookieName = 'einsatzpilot_session';

export async function createDevelopmentSession() {
  const loginResult = await fetchApiJson<DevelopmentLoginResponse>('/api/auth/development-login', {
    method: 'POST',
    json: {
      email: getDevelopmentAuthHeaders()['x-dev-user-email'],
      displayName: getDevelopmentAuthHeaders()['x-dev-user-name'],
      companySlug: getDevelopmentAuthHeaders()['x-company-slug'],
      companyName: getDevelopmentAuthHeaders()['x-company-name'],
      membershipRole: getDevelopmentAuthHeaders()['x-membership-role'],
    },
  });

  if (!loginResult.ok || !loginResult.data?.token) {
    return {
      ok: false,
      error: loginResult.error ?? 'Development login failed',
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, loginResult.data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return {
    ok: true,
    session: loginResult.data.session,
  };
}

export async function clearDevelopmentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getStoredSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(sessionCookieName)?.value;
}

export async function getServerSession() {
  const token = await getStoredSessionToken();

  if (!token) {
    return null;
  }

  const sessionResult = await fetchApiJson<SessionResponse>('/api/auth/session', {
    authToken: token,
  });

  if (!sessionResult.ok || !sessionResult.data?.authenticated) {
    return null;
  }

  return sessionResult.data;
}

export async function requireServerSession(): Promise<AuthenticatedSession> {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}
