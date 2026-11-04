import { NextResponse } from 'next/server';
import { fetchAcara, insertAcara } from '@/lib/google-sheets';
import { mockDb } from '@/lib/mock-db';

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
    const { id, isHidden, ...data } = body;
    if (typeof isHidden === 'boolean') {
      mockDb.toggleStatusAcara(id, isHidden);
      return NextResponse.json({ success: true, message: isHidden ? 'Acara disembunyikan!' : 'Acara kembali aktif!' });
    }
    mockDb.updateAcara(id, data);
    return NextResponse.json({ success: true, message: 'Data acara berhasil diperbarui!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID diperlukan' }, { status: 400 });
    mockDb.deleteAcara(id);
    return NextResponse.json({ success: true, message: 'Acara berhasil dihapus!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

