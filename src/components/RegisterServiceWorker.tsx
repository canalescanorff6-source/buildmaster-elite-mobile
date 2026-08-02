'use client';

import { useEffect } from 'react';

type CapacitorWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

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
      void clearNativeWebCaches();
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
