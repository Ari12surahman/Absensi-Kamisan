import { NextResponse } from 'next/server';
import { fetchLaporan, insertLaporan, updateLaporan, deleteLaporan } from '@/lib/google-sheets';

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
    return NextResponse.json({ success: true, message: 'Laporan berhasil disimpan!', data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, rowIndex, data } = body;
    await updateLaporan(rowIndex || id, data);
    return NextResponse.json({ success: true, message: 'Data laporan berhasil diperbarui!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const rowIndex = searchParams.get('rowIndex');
    if (!id && !rowIndex) return NextResponse.json({ success: false, message: 'ID diperlukan' }, { status: 400 });
    await deleteLaporan(rowIndex || id!);
    return NextResponse.json({ success: true, message: 'Laporan berhasil dihapus!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
