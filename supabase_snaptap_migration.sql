-- SnapTap: GTAW Auth + Supabase (sadece DB). Görseller ImgBB vb. dış serviste, link saklanır.
-- Matchup ile aynı proje kullanılıyorsa gtaw_users / gtaw_characters zaten var; yoksa aşağıdaki 1. blok ile oluştur.

-- 1. GTAW kullanıcı tabloları (matchup'ta varsa çalıştırma)
CREATE TABLE IF NOT EXISTS gtaw_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gtaw_id INTEGER UNIQUE NOT NULL,
  username TEXT NOT NULL,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS gtaw_characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id INTEGER UNIQUE NOT NULL,
  gtaw_user_id INTEGER REFERENCES gtaw_users(gtaw_id),
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gtaw_users_gtaw_id ON gtaw_users(gtaw_id);

-- 2. SnapTap profiller (GTAW user id ile)
CREATE TABLE IF NOT EXISTS snaptap_profiles (
  gtaw_user_id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Snap'ler (from/to = gtaw_user_id)
CREATE TABLE IF NOT EXISTS snaptap_snaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES snaptap_profiles(gtaw_user_id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES snaptap_profiles(gtaw_user_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  overlay_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  CONSTRAINT no_self_snap CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_snaptap_snaps_from ON snaptap_snaps(from_user_id);
CREATE INDEX IF NOT EXISTS idx_snaptap_snaps_to ON snaptap_snaps(to_user_id);
CREATE INDEX IF NOT EXISTS idx_snaptap_snaps_created ON snaptap_snaps(created_at DESC);

-- RLS kapalı; API route'lar getServerSession ile gtawId kontrolü yapıyor, Supabase service role kullanıyor.
