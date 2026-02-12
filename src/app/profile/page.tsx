'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, updateAvatar } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Lütfen bir görsel seçin (JPG, PNG, GIF).');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Yükleme başarısız');
        return;
      }
      if (data.link) updateAvatar(data.link);
    } catch {
      setError('Yükleme sırasında hata oluştu');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Profil</h2>
      <div className="flex flex-col items-center gap-4">
        <div
          className="photo-upload"
          onClick={() => !uploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !uploading && fileInputRef.current?.click()}
          aria-label="Profil fotoğrafı yükle"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            aria-hidden
          />
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-[var(--snaptap-muted)]">
              {user.displayName[0]}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-sm">
              Yükleniyor…
            </div>
          )}
        </div>
        <p className="font-medium">{user.displayName}</p>
        <p className="text-sm text-[var(--snaptap-muted)]">@{user.username}</p>
        <p className="text-xs text-[var(--snaptap-muted)]">Fotoğrafı değiştirmek için tıkla</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
      <div className="mt-6">
        <Link href="/app" className="block text-center text-[var(--snaptap-primary)] font-medium">
          ← Mesajlara dön
        </Link>
      </div>
    </div>
  );
}
