import { NextResponse } from 'next/server';
import { fetchLaporan, insertLaporan } from '@/lib/google-sheets';
import { mockDb } from '@/lib/mock-db';

export async function GET() {
  try {
    const data = await fetchLaporan();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await insertLaporan(body);
    return NextResponse.json({ success: true, message: 'Laporan Divisi berhasil dikirim!', data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, data } = body;
    mockDb.updateLaporan(id, data);
    return NextResponse.json({ success: true, message: 'Laporan divisi berhasil diperbarui!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID diperlukan' }, { status: 400 });
    mockDb.deleteLaporan(id);
    return NextResponse.json({ success: true, message: 'Laporan divisi berhasil dihapus!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

