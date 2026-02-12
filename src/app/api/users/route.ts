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

  const { data: profiles } = await supabase
    .from('snaptap_profiles')
    .select('gtaw_user_id, username, display_name, avatar_url')
    .neq('gtaw_user_id', gtawId)
    .order('display_name');

  const users = (profiles || []).map((p) => ({
    id: String(p.gtaw_user_id),
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.avatar_url ?? undefined,
  }));

  return NextResponse.json({ users });
}
