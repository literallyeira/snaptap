'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, useApiMode, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/');
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <Link href="/app" className="text-xl font-bold" style={{ color: 'var(--snaptap-primary)' }}>
          SnapTap
        </Link>
        <div className="flex items-center gap-3">
          {useApiMode && (
            <>
              <Link href="/profile" className="text-sm text-[var(--snaptap-muted)] hover:text-white">
                Profil
              </Link>
              <button
                type="button"
                onClick={() => { logout(); router.push('/'); }}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Çıkış
              </button>
            </>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
