'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type UserRow = { id: string; username: string; displayName: string; avatarUrl?: string };

export default function UsersPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch('/api/users', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .finally(() => setApiLoading(false));
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/app" className="text-[var(--snaptap-muted)]">← Sohbetler</Link>
        <h2 className="text-lg font-semibold">Kullanıcılar</h2>
        <span />
      </div>
      {apiLoading ? (
        <p className="text-[var(--snaptap-muted)]">Yükleniyor…</p>
      ) : users.length === 0 ? (
        <p className="text-[var(--snaptap-muted)]">Başka kullanıcı yok.</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id}>
              <Link
                href={`/app/send/${u.id}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--snaptap-card)] hover:bg-white/5 transition"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">{u.displayName[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.displayName}</p>
                  <p className="text-sm text-[var(--snaptap-muted)] truncate">@{u.username}</p>
                </div>
                <span className="text-[var(--snaptap-primary)]">Snap at →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
