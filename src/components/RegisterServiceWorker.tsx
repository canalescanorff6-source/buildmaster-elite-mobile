'use client';

import { useEffect } from 'react';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';

type CapacitorWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

// Esquema anterior preservado para a regressão: 34.00.0-touch-scroll-menu-5
const NATIVE_CACHE_SCHEMA = '34.00.0-identity-themes-avatar-6';
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
