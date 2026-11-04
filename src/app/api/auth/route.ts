import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true, message: 'Otentikasi berhasil!' });
    }
    return NextResponse.json({ success: false, message: 'Password salah!' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Format request salah' }, { status: 400 });
  }
}

