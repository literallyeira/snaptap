'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading, useApiMode, loginMock, testMode, setTestMode, signInGtaw, logout } = useAuth();

  const handleSignInGtaw = () => {
    signInGtaw();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--snaptap-muted)]">Yükleniyor…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--snaptap-primary)' }}>
          SnapTap
        </h1>
        <p className="text-[var(--snaptap-muted)] mb-8">Fotoğrafla anlat, üzerine yazı ekle.</p>
        <Link
          href="/app"
          className="px-8 py-4 rounded-2xl font-semibold text-black"
          style={{ background: 'var(--snaptap-primary)' }}
        >
          Mesajlara Git
        </Link>
        <p className="mt-6 text-sm text-[var(--snaptap-muted)]">
          {useApiMode ? (
            <>
              <strong className="text-white">{user.displayName}</strong>
              <button type="button" onClick={() => logout()} className="ml-2 text-[var(--snaptap-primary)] hover:underline">
                Çıkış
              </button>
            </>
          ) : (
            <>Test modu: <strong className="text-white">{user.displayName}</strong></>
          )}
        </p>
        {useApiMode && (
          <Link href="/profile" className="mt-2 text-sm text-[var(--snaptap-muted)] hover:text-[var(--snaptap-primary)]">
            Profil
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--snaptap-primary)' }}>
        SnapTap
      </h1>
      <p className="text-[var(--snaptap-muted)] mb-8">Fotoğrafla anlat, üzerine yazı ekle.</p>
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={handleSignInGtaw}
          className="w-full py-4 rounded-2xl font-semibold text-black"
          style={{ background: 'var(--snaptap-primary)' }}
        >
          GTA World ile giriş yap
        </button>
        <button
          onClick={loginMock}
          className="w-full py-4 rounded-2xl font-semibold border border-white/20 text-white hover:bg-white/5"
        >
          Test modunda giriş yap (mock)
        </button>
        <label className="flex items-center justify-center gap-2 mt-6 text-sm text-[var(--snaptap-muted)]">
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="rounded"
          />
          Test modu açık (mock veri)
        </label>
      </div>
    </div>
  );
}
