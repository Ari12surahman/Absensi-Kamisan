import { NextResponse } from 'next/server';
import { fetchAsatidz, insertAsatidz, updateAsatidz, deleteAsatidz } from '@/lib/google-sheets';

export async function GET() {
  try {
    const data = await fetchAsatidz();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await insertAsatidz(body);
    const savedData = (result as any)?.data || result;
    return NextResponse.json({
      success: true,
      message: (result as any)?.message || 'Data asatidz berhasil disimpan!',
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
    await updateAsatidz(targetRow, payload);
    return NextResponse.json({ success: true, message: 'Data asatidz berhasil diperbarui!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const rowIndex = searchParams.get('rowIndex');
    const nama = searchParams.get('nama');
    if (!id && !rowIndex && !nama) {
      return NextResponse.json({ success: false, message: 'ID atau Nama diperlukan' }, { status: 400 });
    }
    await deleteAsatidz(rowIndex || id || nama!, id || undefined, nama || undefined);
    return NextResponse.json({ success: true, message: 'Data asatidz berhasil dihapus!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
