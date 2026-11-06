import { NextResponse } from 'next/server';
import { resolveGoogleMapsUrl, extractCoordinates } from '@/lib/geo-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ success: false, message: 'URL Google Maps wajib disertakan' }, { status: 400 });
    }

    const result = await resolveGoogleMapsUrl(url);

    if (result.lat && result.lng) {
      return NextResponse.json({
        success: true,
        lat: result.lat,
        lng: result.lng,
        resolvedUrl: result.resolvedUrl,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Tidak dapat mengekstrak titik koordinat dari link yang diberikan.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = body.url;

    if (!url) {
      return NextResponse.json({ success: false, message: 'URL Google Maps wajib disertakan' }, { status: 400 });
    }

    const result = await resolveGoogleMapsUrl(url);

    if (result.lat && result.lng) {
      return NextResponse.json({
        success: true,
        lat: result.lat,
        lng: result.lng,
        resolvedUrl: result.resolvedUrl,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Tidak dapat mengekstrak titik koordinat dari link yang diberikan.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

