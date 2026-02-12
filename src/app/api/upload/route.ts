import { NextRequest, NextResponse } from 'next/server';

const HIZLIRESIM_UPLOAD = 'https://hizliresim.com/p/eklenti-yukle';
const OX0_ST = 'https://0x0.st';

const FETCH_TIMEOUT_MS = 20000;
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/119.0',
  Accept: 'application/json, text/plain, */*',
};

export const maxDuration = 25;

function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = FETCH_TIMEOUT_MS, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, {
    ...rest,
    signal: controller.signal,
    headers: rest.headers ?? DEFAULT_HEADERS,
  }).finally(() => clearTimeout(id));
}

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

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: file.type }), file.name || 'image.jpg');

    let tempUrl: string;

    try {
      const tempRes = await fetchWithTimeout(OX0_ST, {
        method: 'POST',
        body: form,
        headers: { ...DEFAULT_HEADERS, Accept: '*/*' },
      });

      if (!tempRes.ok) {
        console.error('0x0.st upload failed:', tempRes.status, await tempRes.text());
        return NextResponse.json(
          { error: 'Geçici yükleme başarısız, tekrar dene' },
          { status: 502 }
        );
      }

      tempUrl = (await tempRes.text()).trim();
      if (!tempUrl.startsWith('http')) {
        return NextResponse.json(
          { error: 'Geçici link alınamadı' },
          { status: 502 }
        );
      }
    } catch (e) {
      console.error('0x0.st error:', e);
      return NextResponse.json(
        { error: 'Yükleme zaman aşımı veya bağlantı hatası, tekrar dene' },
        { status: 502 }
      );
    }

    let imageUrl: string | null = null;

    try {
      const hrBody = new URLSearchParams();
      hrBody.append('remote_file_url', tempUrl);

      const hrRes = await fetchWithTimeout(HIZLIRESIM_UPLOAD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: hrBody.toString(),
      });

      const hrData = await hrRes.json().catch(() => ({}));
      const images = hrData?.images?.[0];

      if (images && images.status === 0) {
        let url = (images.image_url || '').trim().replace('hizliresim.com', 'i.hizliresim.com');
        const ext = (file.name && /\.(png|gif|webp|jpeg|jpg)$/i.test(file.name))
          ? file.name.replace(/.*\./i, '').toLowerCase().replace('jpeg', 'jpg')
          : 'jpg';
        if (!/\.(jpg|jpeg|png|gif)$/i.test(url)) url += '.' + ext;
        imageUrl = url;
      }
    } catch (e) {
      console.error('Hizliresim error:', e);
    }

    if (imageUrl) {
      return NextResponse.json({ link: imageUrl });
    }

    return NextResponse.json({ link: tempUrl });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json(
      { error: 'Yükleme sırasında hata oluştu' },
      { status: 500 }
    );
  }
}
