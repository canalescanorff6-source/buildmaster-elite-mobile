'use client';

import { useEffect, useRef } from 'react';
import { STORAGE_FAILURE_EVENT, type StorageFailure } from '@/lib/safeLocalStorage';
import { recordObservabilityEvent } from './observabilityEngine';

export function ObservabilityBootstrap() {
  const lastScreen = useRef<{ area: string; startedAt: number } | null>(null);

  useEffect(() => {
    const onScreen = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string; label?: string }>).detail;
      const now = performance.now();
      if (lastScreen.current) {
        recordObservabilityEvent({ kind: 'performance', level: now - lastScreen.current.startedAt >= 900 ? 'warning' : 'info', area: lastScreen.current.area, code: 'screen-residence', message: 'Tempo de permanência antes da troca de área.', durationMs: now - lastScreen.current.startedAt });
      }
      const area = detail?.label || detail?.section || 'app';
      lastScreen.current = { area, startedAt: now };
      recordObservabilityEvent({ kind: 'navigation', level: 'info', area, code: 'screen-open', message: 'Área aberta pelo usuário.' });
    };
    const onError = (event: ErrorEvent) => recordObservabilityEvent({ kind: 'error', level: 'critical', area: 'window', code: 'unhandled-error', message: event.message || 'Erro global sem mensagem.' });
    const onRejection = (event: PromiseRejectionEvent) => recordObservabilityEvent({ kind: 'error', level: 'critical', area: 'promise', code: 'unhandled-rejection', message: event.reason instanceof Error ? event.reason.message : String(event.reason || 'Promise rejeitada sem mensagem.') });
    const onStorage = (event: Event) => {
      const detail = (event as CustomEvent<StorageFailure>).detail;
      recordObservabilityEvent({ kind: 'storage', level: 'warning', area: 'storage', code: detail.operation, message: `${detail.operation} bloqueado para uma chave local.` });
    };

    let observer: PerformanceObserver | null = null;
    try {
      if ('PerformanceObserver' in window) {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration < 120) continue;
            recordObservabilityEvent({ kind: 'performance', level: entry.duration >= 500 ? 'warning' : 'info', area: 'main-thread', code: 'long-task', message: 'Tarefa longa detectada na interface.', durationMs: entry.duration });
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      }
    } catch {
      observer = null;
    }

    window.addEventListener('buildmaster:screen-change', onScreen);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener(STORAGE_FAILURE_EVENT, onStorage);
    return () => {
      window.removeEventListener('buildmaster:screen-change', onScreen);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener(STORAGE_FAILURE_EVENT, onStorage);
      observer?.disconnect();
    };
  }, []);

  return null;
}
