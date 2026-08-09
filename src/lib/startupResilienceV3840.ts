'use client';

import { clearTransientRuntimeV3930 } from '@/lib/runtimeRecoveryV3930';

export const STARTUP_SAFE_MODE_KEY_V3840 = 'buildmaster:startup-safe-mode:v3840';
export const STARTUP_RECOVERY_COUNT_KEY_V3840 = 'buildmaster:startup-recovery-count:v3840';
export const STARTUP_LAST_ERROR_KEY_V3840 = 'buildmaster:startup-last-error:v3840';
export const STARTUP_STABLE_MARKER_KEY_V3840 = 'buildmaster:startup-stable:v3840';

const MAX_ERROR_MESSAGE_LENGTH = 600;

function sessionGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // O modo seguro também funciona quando o WebView bloqueia sessionStorage.
  }
}

function sessionRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // A remoção é complementar e não pode interromper a abertura.
  }
}

function normalizedErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || 'Falha desconhecida na abertura.');
  return message.replace(/\s+/g, ' ').trim().slice(0, MAX_ERROR_MESSAGE_LENGTH) || 'Falha desconhecida na abertura.';
}

/**
 * O modo seguro é somente da sessão atual. Ele não apaga Cofre, jogadores,
 * imagens, conta, backups ou preferências persistentes.
 */
export function isStartupSafeModeV3840(): boolean {
  if (typeof window === 'undefined') return false;
  if (sessionGet(STARTUP_SAFE_MODE_KEY_V3840) === '1') return true;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('bm_safe_start') === '1';
  } catch {
    return false;
  }
}

export function startupRecoveryCountV3840(): number {
  const value = Number.parseInt(sessionGet(STARTUP_RECOVERY_COUNT_KEY_V3840) || '0', 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function activateStartupSafeModeV3840(error?: unknown): number {
  const nextCount = Math.min(9, startupRecoveryCountV3840() + 1);
  sessionSet(STARTUP_SAFE_MODE_KEY_V3840, '1');
  sessionSet(STARTUP_RECOVERY_COUNT_KEY_V3840, String(nextCount));
  sessionRemove(STARTUP_STABLE_MARKER_KEY_V3840);
  if (error !== undefined) sessionSet(STARTUP_LAST_ERROR_KEY_V3840, normalizedErrorMessage(error));
  try {
    clearTransientRuntimeV3930();
  } catch {
    // A proteção principal é a remontagem sem restaurar dados temporários.
  }
  return nextCount;
}

export function markStartupStableV3840(): void {
  sessionSet(STARTUP_STABLE_MARKER_KEY_V3840, String(Date.now()));
}

export function clearStartupSafeModeV3840(): void {
  sessionRemove(STARTUP_SAFE_MODE_KEY_V3840);
  sessionRemove(STARTUP_RECOVERY_COUNT_KEY_V3840);
  sessionRemove(STARTUP_LAST_ERROR_KEY_V3840);
  sessionRemove(STARTUP_STABLE_MARKER_KEY_V3840);
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('bm_safe_start')) return;
    url.searchParams.delete('bm_safe_start');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Limpar a URL é apenas cosmético.
  }
}

export function startupLastErrorV3840(): string {
  return sessionGet(STARTUP_LAST_ERROR_KEY_V3840) || '';
}

export function safeStartupInitializerV3840<T>(factory: () => T, fallback: T): T {
  try {
    return factory();
  } catch (error) {
    console.warn('Inicializador persistente ignorado para manter a abertura do app:', error);
    return fallback;
  }
}
