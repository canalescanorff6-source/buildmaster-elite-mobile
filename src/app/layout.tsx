import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker';
import './globals.css';

export const metadata: Metadata = {
  title: 'BuildMaster Elite Tático v25.76',
  description: 'BuildMaster Elite Tático v25.76 com fichas, habilidades, treino, análise de equipe, adversário, calibração e recuperação preventiva.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'BuildMaster v25.76',
    statusBarStyle: 'black-translucent'
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#020712'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><RegisterServiceWorker />{children}</body>
    </html>
  );
}
