import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { RegisterServiceWorker } from '@/components/RegisterServiceWorker';
import { AppRuntimeStatus } from '@/components/AppRuntimeStatus';
import { ExperiencePreferenceBootstrap } from '@/components/ExperiencePreferenceBootstrap';
import { PremiumExperienceLayer } from '@/components/PremiumExperienceLayer';
import { PremiumExperience2Bootstrap } from '@/modules/experience/PremiumExperience2Bootstrap';
import { ObservabilityBootstrap } from '@/modules/observability/ObservabilityBootstrap';
import { PremiumQualityLayer } from '@/components/PremiumQualityLayer';
import { RuntimeOptimizationBootstrapV3820 } from '@/components/RuntimeOptimizationBootstrapV3820';
import { OptionalRuntimeBoundary } from '@/components/OptionalRuntimeBoundary';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import './globals.css';
import './v33-executive.css';
import './v34-studio.css';
import './v34-clean-responsive.css';
import './v35-identity-themes.css';
import './v35-solid-premium.css';
import './v36-premium-revolution.css';
import './v37-professional-intelligence.css';
import './v37-clean-intelligent.css';
import './v37-unified-creation.css';
import './v38-clean-vault.css';
import './v38-premium-clean-result.css';
import './v38-squad-mapping.css';
import './v39-global-pro-lab.css';
import './v39-unified-performance.css';
import './v38-reader-speed-contrast.css';
import './v38-stability-theme.css';

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
  themeColor: '#050a12'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="bm-v28-identity bm-v2820-screens bm-v2830-experience bm-v2840-quality bm-v2850-architecture bm-v2870-squad bm-v2880-training bm-v2910-admin-update bm-v2920-production bm-v2930-intelligence bm-v2940-player-lab bm-v2950-tactical-opponent bm-v2960-anti-delay-coach bm-v2970-premium-observability bm-v2980-community-commercial bm-v3000-play-publication bm-v3300-executive bm-v3400-studio bm-v3400-clean-responsive bm-v3500-identity bm-v3520-solid bm-v3600-revolution bm-v3700-professional bm-v3780-clean bm-v3790-unified bm-v3800-vault bm-v3810-result bm-v3820-runtime-shell">
        <OptionalRuntimeBoundary name="preferências de experiência"><ExperiencePreferenceBootstrap /></OptionalRuntimeBoundary>
        <OptionalRuntimeBoundary name="experiência premium 2"><PremiumExperience2Bootstrap /></OptionalRuntimeBoundary>
        <OptionalRuntimeBoundary name="observabilidade"><ObservabilityBootstrap /></OptionalRuntimeBoundary>
        <OptionalRuntimeBoundary name="otimização de runtime"><RuntimeOptimizationBootstrapV3820 /></OptionalRuntimeBoundary>
        <OptionalRuntimeBoundary name="atualização de cache"><RegisterServiceWorker /></OptionalRuntimeBoundary>
        <OptionalRuntimeBoundary name="status do aplicativo"><AppRuntimeStatus /></OptionalRuntimeBoundary>
        <OptionalRuntimeBoundary name="camada premium"><PremiumExperienceLayer /></OptionalRuntimeBoundary>
        <OptionalRuntimeBoundary name="qualidade premium"><PremiumQualityLayer /></OptionalRuntimeBoundary>
        {children}
      </body>
    </html>
  );
}
