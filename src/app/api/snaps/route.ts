import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { gtawId, error } = await requireSession();
  if (error || !gtawId) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırılmamış' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const toUserId = typeof body.toUserId === 'string' ? parseInt(body.toUserId, 10) : body.toUserId;
  const { imageUrl, overlayText } = body;

  if (!toUserId || Number.isNaN(toUserId) || !imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'toUserId ve imageUrl gerekli' }, { status: 400 });
  }

  if (toUserId === gtawId) {
    return NextResponse.json({ error: 'Kendine snap atamazsın' }, { status: 400 });
  }

  const { data: toProfile } = await supabase
    .from('snaptap_profiles')
    .select('gtaw_user_id')
    .eq('gtaw_user_id', toUserId)
    .single();

  if (!toProfile) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }

  const { data: snap, error: insertErr } = await supabase
    .from('snaptap_snaps')
    .insert({
      from_user_id: gtawId,
      to_user_id: toUserId,
      image_url: imageUrl,
      overlay_text: typeof overlayText === 'string' ? overlayText : null,
    })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
  return NextResponse.json({
    id: snap.id,
    fromUserId: String(snap.from_user_id),
    toUserId: String(snap.to_user_id),
    imageUrl: snap.image_url,
    overlayText: snap.overlay_text ?? undefined,
    createdAt: snap.created_at,
    viewedAt: snap.viewed_at ?? undefined,
  });
}
