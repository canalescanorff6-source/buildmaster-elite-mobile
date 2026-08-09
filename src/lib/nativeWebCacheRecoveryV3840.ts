'use client';

import { APP_RELEASE_VERSION, CURRENT_BUILD_ID } from '@/lib/appUpdates';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';

type CapacitorWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

export const NATIVE_CACHE_SCHEMA_KEY = 'buildmaster:native-cache-schema';
export const NATIVE_CACHE_SCHEMA = `${APP_RELEASE_VERSION}:${CURRENT_BUILD_ID}:native-web-cache-v2`;

const CACHE_REFRESH_QUERY = 'bm_cache_refresh';
const SESSION_RELOAD_KEY = `buildmaster:native-cache-reload:${NATIVE_CACHE_SCHEMA}`;

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
  return safeStorageGet(NATIVE_CACHE_SCHEMA_KEY) === NATIVE_CACHE_SCHEMA;
}

export function markNativeCacheSchemaCurrentV3840(): void {
  safeStorageSet(NATIVE_CACHE_SCHEMA_KEY, NATIVE_CACHE_SCHEMA);
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
    if (window.sessionStorage.getItem(SESSION_RELOAD_KEY) === '1') return false;
    window.sessionStorage.setItem(SESSION_RELOAD_KEY, '1');
  } catch {
    // Se sessionStorage estiver indisponível, a marca de esquema ainda evita repetição.
    if (nativeCacheSchemaIsCurrentV3840()) return false;
  }

  await clearNativeWebCachesV3840();
  markNativeCacheSchemaCurrentV3840();

  try {
    const url = new URL(window.location.href);
    url.searchParams.set(
      CACHE_REFRESH_QUERY,
      `${CURRENT_BUILD_ID.slice(0, 12) || 'build'}-${reason.replace(/[^a-z0-9-]/gi, '').slice(0, 24) || 'refresh'}`
    );
    window.location.replace(url.toString());
    return true;
  } catch {
    return false;
  }
}
