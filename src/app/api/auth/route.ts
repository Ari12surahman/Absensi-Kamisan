import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const input = String(password || '').trim();
    const configuredPass = (process.env.ADMIN_PASSWORD || '').trim();

    // Terima jika cocok dengan env var ADMIN_PASSWORD, atau default 'admin123' atau 'admin'
    const isMatch =
      Boolean(configuredPass && input.toLowerCase() === configuredPass.toLowerCase()) ||
      Boolean(configuredPass && input === configuredPass) ||
      input.toLowerCase() === 'admin123' ||
      input.toLowerCase() === 'admin';

    if (isMatch) {
      return NextResponse.json({ success: true, message: 'Otentikasi berhasil!' });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Password salah! Gunakan "admin123" atau "admin".',
      },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Format request salah' }, { status: 400 });
  }
}
