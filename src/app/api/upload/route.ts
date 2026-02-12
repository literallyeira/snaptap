import { NextRequest, NextResponse } from 'next/server';

const IMGBB_API = 'https://api.imgbb.com/1/upload';

export async function POST(request: NextRequest) {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ImgBB yapılandırılmamış (IMGBB_API_KEY)' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Lütfen bir görsel dosyası gönderin (image)' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const body = new URLSearchParams();
    body.append('image', base64);

    const res = await fetch(`${IMGBB_API}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.error || 'ImgBB yükleme başarısız' },
        { status: res.status }
      );
    }

    const link = data?.data?.url;
    if (!link) {
      return NextResponse.json(
        { error: 'ImgBB link alınamadı' },
        { status: 502 }
      );
    }

    return NextResponse.json({ link });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: 'Yükleme sırasında hata oluştu' },
      { status: 500 }
    );
  }
}
