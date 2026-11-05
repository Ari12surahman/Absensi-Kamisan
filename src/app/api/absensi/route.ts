import { NextResponse } from 'next/server';
import { fetchAbsensi, insertAbsensi, updateAbsensi, deleteAbsensi } from '@/lib/google-sheets';

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
    const savedData = (result as any)?.data || result;
    return NextResponse.json({
      success: true,
      message: (result as any)?.message || 'Presensi berhasil disimpan!',
      data: savedData,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, rowIndex, data, ...rest } = body;
    const targetRow = rowIndex || id;
    const payload = data || rest;
    await updateAbsensi(targetRow, payload);
    return NextResponse.json({ success: true, message: 'Data presensi berhasil diperbarui!' });
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
    await deleteAbsensi(rowIndex || id!, id || undefined);
    return NextResponse.json({ success: true, message: 'Presensi berhasil dihapus!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
