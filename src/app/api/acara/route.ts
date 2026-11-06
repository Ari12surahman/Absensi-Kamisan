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
    const savedData = (result as any)?.data || result;
    return NextResponse.json({
      success: true,
      message: (result as any)?.message || 'Acara berhasil ditambahkan!',
      data: savedData,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, rowIndex, isHidden, nama, namaAcara, data, ...rest } = body;
    const targetRow = rowIndex || id;
    if (typeof isHidden === 'boolean') {
      await toggleStatusAcara(targetRow, isHidden, id, nama || namaAcara);
      return NextResponse.json({ success: true, message: isHidden ? 'Acara disembunyikan!' : 'Acara kembali aktif!' });
    }
    const payload = data || rest;
    await updateAcara(targetRow, payload);
    return NextResponse.json({ success: true, message: 'Data acara berhasil diperbarui!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    let bodyItems: any[] = [];
    try {
      const body = await req.json();
      if (body && Array.isArray(body.items)) {
        bodyItems = body.items;
      } else if (body && Array.isArray(body.ids)) {
        bodyItems = body.ids.map((idVal: any) => ({ id: idVal }));
      }
    } catch (_) {}

    if (bodyItems.length > 0) {
      for (const it of bodyItems) {
        await deleteAcara(it.rowIndex || it.id || it.nama || it.namaAcara, it.id, it.nama || it.namaAcara);
      }
      return NextResponse.json({ success: true, message: `${bodyItems.length} acara berhasil dihapus!` });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const rowIndex = searchParams.get('rowIndex');
    const nama = searchParams.get('nama');
    if (!id && !rowIndex && !nama) return NextResponse.json({ success: false, message: 'ID diperlukan' }, { status: 400 });
    await deleteAcara(rowIndex || id || nama!, id || undefined, nama || undefined);
    return NextResponse.json({ success: true, message: 'Acara berhasil dihapus!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
