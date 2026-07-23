import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker';
import { AppRuntimeStatus } from '@/components/AppRuntimeStatus';
import { ExperiencePreferenceBootstrap } from '@/components/ExperiencePreferenceBootstrap';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import './globals.css';

export const metadata: Metadata = {
  title: `BuildMaster Elite Tático v${APP_RELEASE_VERSION}`,
  description: 'Central premium para criar fichas, organizar o Cofre, analisar elenco, tática, habilidades e contas do BuildMaster Elite Tático.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: `BuildMaster v${APP_RELEASE_VERSION}`,
    statusBarStyle: 'default'
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
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: '#eef3fb'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><ExperiencePreferenceBootstrap /><RegisterServiceWorker /><AppRuntimeStatus />{children}</body>
    </html>
  );
}
