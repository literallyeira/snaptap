'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { MOCK_USERS, getMockSnapsWithUser } from '@/lib/mock-data';

type Snap = {
  id: string;
  fromUserId: string;
  toUserId: string;
  imageUrl: string;
  overlayText?: string;
  createdAt: string;
  viewedAt?: string;
};

type OtherUser = { id: string; username: string; displayName: string; avatarUrl?: string };

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, loading, useApiMode } = useAuth();
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (useApiMode) {
      fetch(`/api/chat/${id}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => {
          setOtherUser(data.user);
          setSnaps(data.snaps || []);
          setApiLoading(false);
          const unviewed = (data.snaps || []).filter((s: Snap) => s.toUserId === user.id && !s.viewedAt);
          unviewed.forEach((s: Snap) => {
            fetch(`/api/snaps/${s.id}/view`, {
              method: 'PATCH',
              credentials: 'include',
            }).catch(() => {});
          });
        })
        .catch(() => setApiLoading(false));
    } else {
      const other = MOCK_USERS.find((u) => u.id === id);
      setOtherUser(other ? { id: other.id, username: other.username, displayName: other.displayName, avatarUrl: other.avatarUrl } : null);
      setSnaps(other ? getMockSnapsWithUser(other.id) : []);
      setApiLoading(false);
    }
  }, [user, id, useApiMode]);

  if (loading || !user) return null;
  if (apiLoading && useApiMode) return <div className="p-4 text-[var(--snaptap-muted)]">Yükleniyor…</div>;
  if (!otherUser) {
    return (
      <div className="p-4">
        <p className="text-[var(--snaptap-muted)]">Kullanıcı bulunamadı.</p>
        <Link href="/app" className="text-[var(--snaptap-primary)] mt-2 inline-block">
          ← Sohbetlere dön
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] max-w-lg mx-auto">
      <div className="flex items-center gap-3 p-3 border-b border-white/10">
        <Link href="/app" className="text-[var(--snaptap-muted)]">
          ←
        </Link>
        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
          {otherUser.avatarUrl ? (
            <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">{otherUser.displayName[0]}</div>
          )}
        </div>
        <span className="font-medium">{otherUser.displayName}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {snaps.map((snap) => (
          <SnapBubble key={snap.id} snap={snap} isFromMe={snap.fromUserId === user.id} />
        ))}
      </div>

      <div className="p-3 border-t border-white/10">
        <Link
          href={`/app/send/${otherUser.id}`}
          className="block w-full py-3 rounded-xl font-semibold text-center text-black"
          style={{ background: 'var(--snaptap-primary)' }}
        >
          Snap Gönder
        </Link>
      </div>
    </div>
  );
}

function SnapBubble({ snap, isFromMe }: { snap: Snap; isFromMe: boolean }) {
  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl overflow-hidden ${isFromMe ? 'rounded-br-md' : 'rounded-bl-md'}`}>
        <div className="relative aspect-[3/4] max-h-80 bg-black">
          <img src={snap.imageUrl} alt="" className="w-full h-full object-cover" />
          {snap.overlayText && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <p className="text-white text-center font-medium drop-shadow-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {snap.overlayText}
              </p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-[var(--snaptap-muted)] px-2 py-1">
          {new Date(snap.createdAt).toLocaleString('tr-TR')}
          {snap.viewedAt && ' · Görüldü'}
        </p>
      </div>
    </div>
  );
}
