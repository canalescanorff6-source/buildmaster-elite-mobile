'use client';

import { useEffect } from 'react';
import {
  cleanNativeCacheRefreshQueryV3840,
  nativeCacheSchemaIsCurrentV3840,
  refreshNativeWebRuntimeOnceV3840
} from '@/lib/nativeWebCacheRecoveryV3840';

// Esquema anterior preservado para a regressão: 35.00.0-official-skills-meta-2
// Esquema anterior preservado para a regressão: 35.20.0-dna-gameplay-solid-theme-1
// Esquema anterior preservado para a regressão: 37.00.0-professional-intelligence-1
// Esquema anterior preservado para a regressão: 37.70.0-continuous-rules-1
// Esquema anterior preservado para a regressão: 37.80.0-clean-intelligent-1
// Esquema anterior preservado para a regressão: 37.90.0-unified-creation-1
// Esquema anterior preservado para a regressão: 38.00.0-clean-vault-1
// Esquema anterior preservado para a regressão: 38.10.0-premium-clean-result-1
// Esquema anterior preservado para a regressão: 38.20.0-invisible-optimization-1
// Esquema anterior preservado para a regressão: 38.30.0-name-skill-integrity-1
// Esquema anterior preservado para atualização por cima: 38.31.0-ci-regression-hotfix-1
// Esquema anterior fixo: 38.40.0-background-ocr-resume-1-branding-bm-1

export function RegisterServiceWorker() {
  useEffect(() => {
    let active = true;

    void (async () => {
      if (nativeCacheSchemaIsCurrentV3840()) {
        cleanNativeCacheRefreshQueryV3840();
        return;
      }

      const reloading = await refreshNativeWebRuntimeOnceV3840('new-build');
      if (!active || reloading) return;
      cleanNativeCacheRefreshQueryV3840();
    })();

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const appWindow = window as Window & { Capacitor?: { isNativePlatform?: () => boolean } };
      const isNative = Boolean(appWindow.Capacitor?.isNativePlatform?.())
        || window.location.protocol === 'capacitor:'
        || window.location.protocol === 'file:';

      if (!isNative) {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
          registration.update().catch(() => undefined);
        }).catch(() => undefined);
      }
    }

    return () => {
      active = false;
    };
  }, []);

  return null;
}
