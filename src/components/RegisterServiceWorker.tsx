'use client';

import { useEffect } from 'react';
import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';

type CapacitorWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

const NATIVE_CACHE_MARKER = `buildmaster_native_cache_ready_${APP_RELEASE_VERSION}`;

async function clearNativeWebCachesOnce() {
  if (safeStorageGet(NATIVE_CACHE_MARKER) === 'done') return;

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

  safeStorageSet(NATIVE_CACHE_MARKER, 'done');
}

function scheduleNativeCacheMaintenance() {
  if ('requestIdleCallback' in window) {
    const idleWindow = window as Window & { requestIdleCallback: (callback: () => void, options?: { timeout: number }) => number };
    return { kind: 'idle' as const, id: idleWindow.requestIdleCallback(() => { void clearNativeWebCachesOnce(); }, { timeout: 2500 }) };
  }
  return { kind: 'timer' as const, id: window.setTimeout(() => { void clearNativeWebCachesOnce(); }, 1800) };
}

export function RegisterServiceWorker() {
  useEffect(() => {
    const appWindow = window as CapacitorWindow;
    const isNative = Boolean(appWindow.Capacitor?.isNativePlatform?.())
      || window.location.protocol === 'capacitor:'
      || window.location.protocol === 'file:';

    if (isNative) {
      const scheduled = scheduleNativeCacheMaintenance();
      return () => {
        if (scheduled.kind === 'timer') window.clearTimeout(scheduled.id);
        else if ('cancelIdleCallback' in window) {
          (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(scheduled.id);
        }
      };
    }

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.update().catch(() => undefined);
      }).catch(() => undefined);
    }
    return undefined;
  }, []);
  return null;
}
