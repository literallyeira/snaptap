import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { session, gtawId, error } = await requireSession();
  if (error || !gtawId) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırılmamış' }, { status: 503 });
  }

  let { data: profile } = await supabase
    .from('snaptap_profiles')
    .select('*')
    .eq('gtaw_user_id', gtawId)
    .single();

  if (!profile) {
    const username = (session?.user as { username?: string })?.username ?? `user_${gtawId}`;
    const chars = (session?.user as { characters?: { firstname: string; lastname: string }[] })?.characters;
    const displayName = chars?.[0] ? `${chars[0].firstname} ${chars[0].lastname}` : username;
    const { error: insertErr } = await supabase.from('snaptap_profiles').insert({
      gtaw_user_id: gtawId,
      username,
      display_name: displayName,
    });
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    const { data: created } = await supabase
      .from('snaptap_profiles')
      .select('*')
      .eq('gtaw_user_id', gtawId)
      .single();
    profile = created;
  }

  return NextResponse.json({
    id: String(profile!.gtaw_user_id),
    username: profile!.username,
    displayName: profile!.display_name,
    avatarUrl: profile!.avatar_url ?? undefined,
  });
}

export async function PATCH(request: NextRequest) {
  const { gtawId, error } = await requireSession();
  if (error || !gtawId) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırılmamış' }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const updates: { display_name?: string; avatar_url?: string; username?: string; updated_at?: string } = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.displayName === 'string') updates.display_name = body.displayName;
  if (typeof body.avatarUrl === 'string') updates.avatar_url = body.avatarUrl || null;
  if (typeof body.username === 'string' && body.username.trim()) updates.username = body.username.trim();

  const { data, error: updateErr } = await supabase
    .from('snaptap_profiles')
    .update(updates)
    .eq('gtaw_user_id', gtawId)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({
    id: String(data.gtaw_user_id),
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url ?? undefined,
  });
}
