import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Server-side: API route'larda kullan; service role ile RLS bypass */
export const supabase =
  url && (serviceKey || anonKey)
    ? createClient(url, serviceKey || anonKey, { auth: { persistSession: false } })
    : (null as unknown as ReturnType<typeof createClient>);

export type Profile = {
  gtaw_user_id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Snap = {
  id: string;
  from_user_id: number;
  to_user_id: number;
  image_url: string;
  overlay_text: string | null;
  created_at: string;
  viewed_at: string | null;
};
