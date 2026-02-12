import { NextRequest, NextResponse } from 'next/server';

const HIZLIRESIM_UPLOAD = 'https://hizliresim.com/p/eklenti-yukle';
const OX0_ST = 'https://0x0.st';

export async function POST(request: NextRequest) {
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
    const buffer = Buffer.from(bytes);

    // 1) Geçici public URL al (0x0.st - API key yok)
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: file.type }), file.name || 'image.jpg');

    const tempRes = await fetch(OX0_ST, {
      method: 'POST',
      body: form,
    });

    if (!tempRes.ok) {
      console.error('0x0.st upload failed:', tempRes.status);
      return NextResponse.json(
        { error: 'Geçici yükleme başarısız, tekrar dene' },
        { status: 502 }
      );
    }

    const tempUrl = (await tempRes.text()).trim();
    if (!tempUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Geçici link alınamadı' },
        { status: 502 }
      );
    }

    // 2) Hizliresim'e URL ile yükle
    const hrBody = new URLSearchParams();
    hrBody.append('remote_file_url', tempUrl);

    const hrRes = await fetch(HIZLIRESIM_UPLOAD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: hrBody.toString(),
    });

    const hrData = await hrRes.json().catch(() => ({}));

    const images = hrData?.images?.[0];
    if (!images || images.status !== 0) {
      console.error('Hizliresim response:', hrData);
      return NextResponse.json(
        { error: 'Hizliresim yükleme başarısız' },
        { status: 502 }
      );
    }

    // Direkt görsel linki: i.hizliresim.com/XXX.jpg
    let imageUrl = (images.image_url || '').trim().replace('hizliresim.com', 'i.hizliresim.com');
    const ext = (file.name && /\.(png|gif|webp|jpeg|jpg)$/i.test(file.name))
      ? file.name.replace(/.*\./i, '').toLowerCase().replace('jpeg', 'jpg')
      : 'jpg';
    if (!/\.(jpg|jpeg|png|gif)$/i.test(imageUrl)) imageUrl += '.' + ext;

    return NextResponse.json({ link: imageUrl });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: 'Yükleme sırasında hata oluştu' },
      { status: 500 }
    );
  }
}
