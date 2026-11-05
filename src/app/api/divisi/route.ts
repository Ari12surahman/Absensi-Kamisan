import { NextResponse } from 'next/server';
import { fetchDivisi, insertDivisi, updateDivisi, deleteDivisi } from '@/lib/google-sheets';

export async function GET() {
  try {
    const data = await fetchDivisi();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await insertDivisi(body);
    return NextResponse.json({ success: true, message: 'Divisi berhasil disimpan!', data: result });
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
    await updateDivisi(targetRow, payload);
    return NextResponse.json({ success: true, message: 'Data divisi berhasil diperbarui!' });
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
    if (!id && !rowIndex && !nama) return NextResponse.json({ success: false, message: 'ID atau nama diperlukan' }, { status: 400 });
    await deleteDivisi(rowIndex || id || nama!, id || undefined, nama || undefined);
    return NextResponse.json({ success: true, message: 'Divisi berhasil dihapus!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
