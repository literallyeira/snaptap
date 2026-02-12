import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { gtawId, error } = await requireSession();
  if (error || !gtawId) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırılmamış' }, { status: 503 });
  }

  const { data: snaps } = await supabase
    .from('snaptap_snaps')
    .select('id, from_user_id, to_user_id, image_url, overlay_text, created_at, viewed_at')
    .or(`from_user_id.eq.${gtawId},to_user_id.eq.${gtawId}`)
    .order('created_at', { ascending: false });

  if (!snaps || snaps.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  const otherIds = new Set<number>();
  const lastByOther: Record<number, (typeof snaps)[0]> = {};
  const unreadByOther: Record<number, number> = {};

  for (const s of snaps) {
    const other = s.from_user_id === gtawId ? s.to_user_id : s.from_user_id;
    otherIds.add(other);
    if (!lastByOther[other]) lastByOther[other] = s;
    if (s.to_user_id === gtawId && !s.viewed_at) {
      unreadByOther[other] = (unreadByOther[other] || 0) + 1;
    }
  }

  const { data: profiles } = await supabase
    .from('snaptap_profiles')
    .select('gtaw_user_id, username, display_name, avatar_url')
    .in('gtaw_user_id', Array.from(otherIds));

  const profileMap = new Map((profiles || []).map((p) => [p.gtaw_user_id, p]));

  const conversations = Array.from(otherIds).map((id) => {
    const profile = profileMap.get(id);
    const last = lastByOther[id];
    const unreadCount = unreadByOther[id] || 0;
    return {
      id: String(id),
      user: profile
        ? {
            id: String(profile.gtaw_user_id),
            username: profile.username,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url ?? undefined,
          }
        : { id: String(id), username: '?', displayName: '?', avatarUrl: undefined },
      lastSnap: last
        ? {
            id: last.id,
            fromUserId: String(last.from_user_id),
            toUserId: String(last.to_user_id),
            imageUrl: last.image_url,
            overlayText: last.overlay_text ?? undefined,
            createdAt: last.created_at,
            viewedAt: last.viewed_at ?? undefined,
          }
        : undefined,
      unreadCount,
    };
  });

  conversations.sort((a, b) => {
    const aTime = a.lastSnap ? new Date(a.lastSnap.createdAt).getTime() : 0;
    const bTime = b.lastSnap ? new Date(b.lastSnap.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return NextResponse.json({ conversations });
}
