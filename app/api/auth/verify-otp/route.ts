import { NextResponse } from 'next/server';
import { verifyPhoneOtp } from '@/lib/api';
import { setAuthToken } from '@/lib/auth';

/**
 * POST { phone, otp_code } → verifies via react-api. On success, extract the access token
 * and store it in a secure httpOnly cookie. The token never reaches browser JS.
 */
export async function POST(req: Request) {
  const { phone, otp_code } = await req.json().catch(() => ({}));
  if (!phone || !otp_code) {
    return NextResponse.json({ ok: false, message: 'Phone and OTP required' }, { status: 422 });
  }

  const r = await verifyPhoneOtp(String(phone), String(otp_code));
  if (!r.status) {
    return NextResponse.json({ ok: false, message: r.message ?? r.errors ?? 'Invalid OTP' }, { status: 401 });
  }

  // The react-api may return the token at different keys depending on the endpoint — accept both.
  const token =
    (r.data as any)?.access_token ??
    (r.data as any)?.token ??
    (r as any)?.access_token ??
    (r as any)?.token;

  if (!token) {
    // Login succeeded but no token in the payload → flag so we can map the exact field on staging.
    return NextResponse.json(
      { ok: false, message: 'Verified but no token in API response (map the token field for staging)' },
      { status: 500 }
    );
  }

  setAuthToken(String(token));
  return NextResponse.json({ ok: true });
}
