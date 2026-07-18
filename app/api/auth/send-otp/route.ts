import { NextResponse } from 'next/server';
import { sendPhoneOtp } from '@/lib/api';

/** POST { phone } → asks the existing react-api to send an OTP. */
export async function POST(req: Request) {
  const { phone } = await req.json().catch(() => ({ phone: '' }));
  if (!phone || String(phone).length < 10) {
    return NextResponse.json({ ok: false, message: 'Enter a valid phone number' }, { status: 422 });
  }
  const r = await sendPhoneOtp(String(phone));
  return NextResponse.json(
    { ok: !!r.status, message: r.message ?? r.errors ?? '' },
    { status: r.status ? 200 : 422 }
  );
}
