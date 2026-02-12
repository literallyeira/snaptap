import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SnapTap',
  description: 'Fotoğrafla anlat, üzerine yazı ekle, arkadaşlarına snap at.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className={`${inter.className} antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
