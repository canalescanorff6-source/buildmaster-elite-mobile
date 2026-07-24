import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker';
import { AppRuntimeStatus } from '@/components/AppRuntimeStatus';
import { ExperiencePreferenceBootstrap } from '@/components/ExperiencePreferenceBootstrap';
import { PremiumExperienceLayer } from '@/components/PremiumExperienceLayer';
import { PremiumQualityLayer } from '@/components/PremiumQualityLayer';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import './globals.css';

export const metadata: Metadata = {
  title: `BuildMaster Elite Tático v${APP_RELEASE_VERSION}`,
  description: 'Sistema tático premium para criar fichas, proteger o Cofre, analisar elenco, treinos, partidas e formações.',
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
  themeColor: '#0b1931'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="bm-v28-identity bm-v2820-screens bm-v2830-experience bm-v2840-quality bm-v2850-architecture bm-v2870-squad bm-v2880-training bm-v2910-admin-update"><ExperiencePreferenceBootstrap /><RegisterServiceWorker /><AppRuntimeStatus /><PremiumExperienceLayer /><PremiumQualityLayer />{children}</body>
    </html>
  );
}
