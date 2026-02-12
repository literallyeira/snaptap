# SnapTap

Snapchat tarzı foto + üzerine yazı ile arkadaşlarına snap atma uygulaması.

## Test modu (şu an)

- **Mock auth:** "Test modunda giriş yap" ile fake kullanıcı ile giriş.
- **Mock veri:** Sohbetler, snap listesi `src/lib/mock-data.ts` içinde.
- API (GTAW OAuth, backend) alındığında aynı callback URL ve key'lerle bağlanacak.

## Çalıştırma

```bash
npm install
npm run dev
```

http://localhost:3000

## Yapı

- `/` — Giriş / test modu toggle
- `/app` — Sohbet listesi (mock)
- `/app/chat/[id]` — Sohbet + snap balonları, üzerine yazı gösterimi
- `/app/send/[id]` — Snap gönder: foto URL + overlay yazı (test için URL; API’de kamera/upload)
- `/profile` — Profil (mock)

## API bağlanınca

1. NextAuth + GTAW provider, redirect: `https://snaptap.icu/api/auth/callback/gtaw` (veya mevcut izinli URL).
2. `TestModeProvider` yerine veya yanında `SessionProvider`; test modu checkbox kalabilir.
3. Mock data yerine gerçek API: snaps, conversations, profil.
