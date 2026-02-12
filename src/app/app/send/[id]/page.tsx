'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { MOCK_USERS } from '@/lib/mock-data';

type OtherUser = { id: string; username: string; displayName: string; avatarUrl?: string };

export default function SendSnapPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading, useApiMode } = useAuth();
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (useApiMode) {
      fetch(`/api/chat/${id}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) setOtherUser(data.user);
        })
        .catch(() => {});
    } else {
      const other = MOCK_USERS.find((u) => u.id === id);
      setOtherUser(other ? { id: other.id, username: other.username, displayName: other.displayName, avatarUrl: other.avatarUrl } : null);
    }
  }, [user, id, useApiMode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('Lütfen bir görsel seçin (JPG, PNG, GIF).');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data?.error || 'Yükleme başarısız');
        return;
      }
      if (data.link) setImageUrl(data.link);
    } catch {
      setUploadError('Yükleme sırasında hata oluştu');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSend = async () => {
    if (!imageUrl || !otherUser) {
      setUploadError('Önce bir fotoğraf yükle.');
      return;
    }
    if (useApiMode) {
      setSending(true);
      const res = await fetch('/api/snaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toUserId: otherUser.id, imageUrl, overlayText: overlayText || undefined }),
      });
      const data = await res.json();
      setSending(false);
      if (!res.ok) {
        setUploadError(data?.error || 'Gönderilemedi');
        return;
      }
      router.push(`/app/chat/${id}`);
    } else {
      alert(`Mock: ${otherUser.displayName} adlı kullanıcıya snap gönderildi.`);
      router.push(`/app/chat/${id}`);
    }
  };

  const previewUrl = imageUrl || '';

  if (loading || !user) return null;
  if (!otherUser) {
    return (
      <div className="p-4">
        <p className="text-[var(--snaptap-muted)]">Yükleniyor… veya kullanıcı bulunamadı.</p>
        <Link href="/app" className="text-[var(--snaptap-primary)] mt-2 inline-block">
          ← Geri
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/app/chat/${id}`} className="text-[var(--snaptap-muted)]">
          ← İptal
        </Link>
        <span className="font-medium">{otherUser.displayName}</span>
      </div>

      <div className="rounded-2xl overflow-hidden bg-black aspect-[3/4] max-h-[60vh] relative">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3 text-[var(--snaptap-muted)] border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-[var(--snaptap-primary)] transition-colors"
            onClick={() => !uploading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <span>Yükleniyor…</span>
            ) : (
              <>
                <span className="text-4xl">📷</span>
                <span className="text-sm">Fotoğraf seç veya tıkla</span>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          aria-hidden
        />
        {previewUrl && overlayText && (
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <p
              className="text-white text-center font-medium drop-shadow-lg"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
            >
              {overlayText}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {previewUrl && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="form-label text-left cursor-pointer text-[var(--snaptap-primary)] hover:underline"
          >
            Fotoğrafı değiştir
          </button>
        )}
        <label className="form-label">Fotoğrafın üzerine yazı (isteğe bağlı)</label>
        <input
          type="text"
          value={overlayText}
          onChange={(e) => setOverlayText(e.target.value)}
          className="form-input"
          placeholder="Yazını ekle..."
          maxLength={100}
        />
        {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}
        <button
          onClick={handleSend}
          disabled={!imageUrl || uploading || sending}
          className="btn-primary"
        >
          {sending ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </div>

      <p className="text-center text-xs text-[var(--snaptap-muted)] mt-4">
        Fotoğraflar Hizliresim'de saklanır, link olarak kaydedilir.
      </p>
    </div>
  );
}
