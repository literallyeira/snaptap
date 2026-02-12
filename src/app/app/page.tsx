'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getMockConversations } from '@/lib/mock-data';

type Conversation = {
  id: string;
  user: { id: string; username: string; displayName: string; avatarUrl?: string };
  lastSnap?: { fromUserId: string; overlayText?: string };
  unreadCount: number;
};

export default function AppPage() {
  const { user, loading, useApiMode } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (useApiMode) {
      fetch('/api/conversations', { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => {
          setConversations(data.conversations || []);
          setApiLoading(false);
        })
        .catch(() => setApiLoading(false));
    } else {
      const mock = getMockConversations();
      setConversations(
        mock.map((c) => ({
          id: c.id,
          user: {
            id: c.user.id,
            username: c.user.username,
            displayName: c.user.displayName,
            avatarUrl: c.user.avatarUrl,
          },
          lastSnap: c.lastSnap
            ? { fromUserId: c.lastSnap.fromUserId, overlayText: c.lastSnap.overlayText }
            : undefined,
          unreadCount: c.unreadCount,
        }))
      );
      setApiLoading(false);
    }
  }, [user, useApiMode]);

  if (loading || !user) return null;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Sohbetler</h2>
        <div className="flex items-center gap-3">
          {useApiMode && (
            <>
              <Link href="/app/users" className="text-sm text-[var(--snaptap-primary)] hover:underline">
                Yeni sohbet
              </Link>
              <Link href="/profile" className="text-sm text-[var(--snaptap-muted)] hover:text-[var(--snaptap-primary)]">
                Profil
              </Link>
            </>
          )}
        </div>
      </div>
      {apiLoading ? (
        <p className="text-[var(--snaptap-muted)]">Yükleniyor…</p>
      ) : conversations.length === 0 ? (
        <p className="text-[var(--snaptap-muted)]">Henüz sohbet yok. Birine snap atarak başla.</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/app/chat/${c.id}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--snaptap-card)] hover:bg-white/5 transition"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                  {c.user.avatarUrl ? (
                    <img src={c.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      {c.user.displayName[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.user.displayName}</p>
                  {c.lastSnap && (
                    <p className="text-sm text-[var(--snaptap-muted)] truncate">
                      {c.lastSnap.fromUserId === user.id ? 'Sen: ' : ''}
                      {c.lastSnap.overlayText || 'Foto'}
                    </p>
                  )}
                </div>
                {c.unreadCount > 0 && (
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black"
                    style={{ background: 'var(--snaptap-primary)' }}
                  >
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!useApiMode && (
        <p className="text-center text-sm text-[var(--snaptap-muted)] mt-6">Test modu · Mock veri</p>
      )}
    </div>
  );
}
