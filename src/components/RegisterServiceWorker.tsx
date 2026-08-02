'use client';

import { useEffect } from 'react';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';

type CapacitorWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

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
const NATIVE_CACHE_SCHEMA = '38.33.0-professional-template-1';
const NATIVE_CACHE_SCHEMA_KEY = 'buildmaster:native-cache-schema';

async function clearNativeWebCaches() {
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations ?? []).map((registration) => registration.unregister()));
  } catch {
    // O WebView pode não expor service workers; isso não deve bloquear o app.
  }
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Cache é opcional no APK.
  }
}

export function RegisterServiceWorker() {
  useEffect(() => {
    const appWindow = window as CapacitorWindow;
    const isNative = Boolean(appWindow.Capacitor?.isNativePlatform?.())
      || window.location.protocol === 'capacitor:'
      || window.location.protocol === 'file:';

    if (isNative) {
      // Limpa resíduos somente na primeira abertura de uma nova estrutura web.
      // Antes, isso acontecia em todo início e deixava o APK pesado após atualizar.
      const currentSchema = safeStorageGet(NATIVE_CACHE_SCHEMA_KEY) || '';
      if (currentSchema !== NATIVE_CACHE_SCHEMA) {
        void clearNativeWebCaches().finally(() => {
          safeStorageSet(NATIVE_CACHE_SCHEMA_KEY, NATIVE_CACHE_SCHEMA);
        });
      }
      return;
    }

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.update().catch(() => undefined);
      }).catch(() => undefined);
    }
  }, []);
  return null;
}
