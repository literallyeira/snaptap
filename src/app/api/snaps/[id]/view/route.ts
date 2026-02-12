import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth-server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: snapId } = await params;
  const { gtawId, error } = await requireSession();
  if (error || !gtawId) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 });
  }
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase yapılandırılmamış' }, { status: 503 });
  }

  const { data: snap } = await supabase
    .from('snaptap_snaps')
    .select('to_user_id')
    .eq('id', snapId)
    .single();

  if (!snap || snap.to_user_id !== gtawId) {
    return NextResponse.json({ error: 'Snap bulunamadı veya size ait değil' }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from('snaptap_snaps')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', snapId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
