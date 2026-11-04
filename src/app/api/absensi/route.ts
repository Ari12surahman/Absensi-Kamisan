import { NextResponse } from 'next/server';
import { fetchAbsensi, insertAbsensi } from '@/lib/google-sheets';
import { mockDb } from '@/lib/mock-db';

export async function GET() {
  try {
    const data = await fetchAbsensi();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await insertAbsensi(body);
    return NextResponse.json({ success: true, message: 'Presensi berhasil disimpan!', data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, data } = body;
    mockDb.updateAbsensi(id, data);
    return NextResponse.json({ success: true, message: 'Data presensi berhasil diperbarui!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID diperlukan' }, { status: 400 });
    mockDb.deleteAbsensi(id);
    return NextResponse.json({ success: true, message: 'Presensi berhasil dihapus!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

