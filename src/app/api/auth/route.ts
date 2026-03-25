import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = 'tc_petrobras';
const COOKIE_NAME = 'tc_auth';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (password === PASSWORD) {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(COOKIE_NAME, PASSWORD, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: MAX_AGE,
        path: '/',
      });
      return response;
    }
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 });
  }
}
