import { cookies } from 'next/headers';
import { config } from './config';

/**
 * Auth bridge: V2 reuses the existing app OTP login. On verify, the react-api returns an
 * access token; we store it in a secure, httpOnly cookie (never exposed to browser JS).
 * All authed API calls read this token server-side and send it as the Bearer header —
 * exactly what the mobile app does. No new auth backend is built.
 */
export function setAuthToken(token: string) {
  cookies().set(config.authCookieName, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function getAuthToken(): string | undefined {
  return cookies().get(config.authCookieName)?.value;
}

export function clearAuthToken() {
  cookies().delete(config.authCookieName);
}

export function isLoggedIn(): boolean {
  return Boolean(getAuthToken());
}
