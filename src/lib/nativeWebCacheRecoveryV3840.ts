'use client';

import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';

type CapacitorWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

export const NATIVE_CACHE_SCHEMA_KEY = 'buildmaster:native-cache-schema';
export const NATIVE_CACHE_BUILD_KEY = 'buildmaster:native-cache-build';
export const NATIVE_CACHE_SCHEMA = '40.80.0-edge-stack-runtime-1';
export const NATIVE_CACHE_BUILD_FINGERPRINT = `${NATIVE_CACHE_SCHEMA}:native-web-cache-v2`;
// O Android usa o CURRENT_BUILD_ID/versionCode para a invalidação nativa por build.

const CACHE_REFRESH_QUERY = 'bm_cache_refresh';
const SESSION_RELOAD_KEY = `buildmaster:native-cache-reload:${NATIVE_CACHE_BUILD_FINGERPRINT}`;

export function isNativeRuntimeV3840(): boolean {
  if (typeof window === 'undefined') return false;
  const appWindow = window as CapacitorWindow;
  return Boolean(appWindow.Capacitor?.isNativePlatform?.())
    || window.location.protocol === 'capacitor:'
    || window.location.protocol === 'file:';
}

export async function clearNativeWebCachesV3840(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations ?? []).map((registration) => registration.unregister()));
  } catch {
    // Alguns WebViews não disponibilizam Service Worker.
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Cache Storage é opcional no APK.
  }
}

export function nativeCacheSchemaIsCurrentV3840(): boolean {
  return safeStorageGet(NATIVE_CACHE_SCHEMA_KEY) === NATIVE_CACHE_SCHEMA
    && safeStorageGet(NATIVE_CACHE_BUILD_KEY) === NATIVE_CACHE_BUILD_FINGERPRINT;
}

export function markNativeCacheSchemaCurrentV3840(): void {
  safeStorageSet(NATIVE_CACHE_SCHEMA_KEY, NATIVE_CACHE_SCHEMA);
  safeStorageSet(NATIVE_CACHE_BUILD_KEY, NATIVE_CACHE_BUILD_FINGERPRINT);
}

export function cleanNativeCacheRefreshQueryV3840(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(CACHE_REFRESH_QUERY)) return;
    url.searchParams.delete(CACHE_REFRESH_QUERY);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // A limpeza visual da URL é opcional.
  }
}

export async function refreshNativeWebRuntimeOnceV3840(reason: string): Promise<boolean> {
  if (!isNativeRuntimeV3840()) return false;

  try {
    if (window.sessionStorage.getItem(SESSION_RELOAD_KEY) === '1') {
      cleanNativeCacheRefreshQueryV3840();
      return false;
    }
    window.sessionStorage.setItem(SESSION_RELOAD_KEY, '1');
  } catch {
    if (nativeCacheSchemaIsCurrentV3840()) return false;
  }

  await clearNativeWebCachesV3840();
  markNativeCacheSchemaCurrentV3840();
  cleanNativeCacheRefreshQueryV3840();
  void reason;
  return false;
}

// O fluxo antigo chamava window.location.replace após limpar o cache. A limpeza
// agora é não destrutiva e sem recarregamento JavaScript; o Android já invalida
// o WebView uma única vez quando o versionCode muda.
