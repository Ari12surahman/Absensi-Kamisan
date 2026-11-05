import { NextResponse } from 'next/server';
import { fetchAcara, insertAcara, updateAcara, deleteAcara, toggleStatusAcara } from '@/lib/google-sheets';

export async function GET() {
  try {
    const data = await fetchAcara();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await insertAcara(body);
    return NextResponse.json({ success: true, message: 'Acara berhasil ditambahkan!', data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, rowIndex, isHidden, ...data } = body;
    const targetRow = rowIndex || id;
    if (typeof isHidden === 'boolean') {
      await toggleStatusAcara(targetRow, isHidden);
      return NextResponse.json({ success: true, message: isHidden ? 'Acara disembunyikan!' : 'Acara kembali aktif!' });
    }
    await updateAcara(targetRow, data);
    return NextResponse.json({ success: true, message: 'Data acara berhasil diperbarui!' });
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
    await deleteAcara(rowIndex || id!);
    return NextResponse.json({ success: true, message: 'Acara berhasil dihapus!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
