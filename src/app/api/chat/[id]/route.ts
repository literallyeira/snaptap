import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: otherId } = await params;
  const otherUserId = parseInt(otherId, 10);
  if (Number.isNaN(otherUserId)) {
    return NextResponse.json({ error: 'Geçersiz kullanıcı' }, { status: 400 });
  }

  const { gtawId, error } = await requireSession();
  if (error || !gtawId) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırılmamış' }, { status: 503 });
  }

  const [{ data: snaps1 }, { data: snaps2 }] = await Promise.all([
    supabase
      .from('snaptap_snaps')
      .select('id, from_user_id, to_user_id, image_url, overlay_text, created_at, viewed_at')
      .eq('from_user_id', gtawId)
      .eq('to_user_id', otherUserId)
      .order('created_at', { ascending: true }),
    supabase
      .from('snaptap_snaps')
      .select('id, from_user_id, to_user_id, image_url, overlay_text, created_at, viewed_at')
      .eq('from_user_id', otherUserId)
      .eq('to_user_id', gtawId)
      .order('created_at', { ascending: true }),
  ]);
  const snaps = [...(snaps1 || []), ...(snaps2 || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const { data: otherProfile } = await supabase
    .from('snaptap_profiles')
    .select('gtaw_user_id, username, display_name, avatar_url')
    .eq('gtaw_user_id', otherUserId)
    .single();

  return NextResponse.json({
    user: otherProfile
      ? {
          id: String(otherProfile.gtaw_user_id),
          username: otherProfile.username,
          displayName: otherProfile.display_name,
          avatarUrl: otherProfile.avatar_url ?? undefined,
        }
      : null,
    snaps: snaps.map((s) => ({
      id: s.id,
      fromUserId: String(s.from_user_id),
      toUserId: String(s.to_user_id),
      imageUrl: s.image_url,
      overlayText: s.overlay_text ?? undefined,
      createdAt: s.created_at,
      viewedAt: s.viewed_at ?? undefined,
    })),
  });
}
