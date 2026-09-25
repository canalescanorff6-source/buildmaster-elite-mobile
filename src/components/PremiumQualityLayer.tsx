'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { STORAGE_FAILURE_EVENT, type StorageFailure } from '@/lib/safeLocalStorage';
import {
  detectDeviceQualityProfile,
  readQualityPreference,
  recordLongTask,
  recordRuntimeQualityIssue,
  type QualityPreference
} from '@/lib/appQualityV2840';
import { recordObservabilityEvent } from '@/modules/observability/observabilityEngine';

function applyQualityProfile(preference: QualityPreference) {
  const profile = detectDeviceQualityProfile(preference);
  document.documentElement.dataset.qualityProfile = profile.resolvedMode;
  document.documentElement.dataset.qualityAdaptive = preference.adaptiveEffects ? 'true' : 'false';
  window.dispatchEvent(new CustomEvent('buildmaster:quality-profile', { detail: profile }));
}

function focusCurrentScreen() {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return;
  const target = document.querySelector<HTMLElement>('[data-screen-title], main h1, main h2, main [tabindex="-1"]');
  if (!target) return;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

export function PremiumQualityLayer() {
  const [showTop, setShowTop] = useState(false);
  const focusTimer = useRef<number | null>(null);
  const lastScreen = useRef<{ area: string; startedAt: number } | null>(null);

  useEffect(() => {
    let preference = readQualityPreference();
    applyQualityProfile(preference);

    const onPreference = (event: Event) => {
      preference = (event as CustomEvent<QualityPreference>).detail;
      applyQualityProfile(preference);
    };
    const onScreen = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string; label?: string }>).detail;
      const now = performance.now();
      if (lastScreen.current) {
        const durationMs = now - lastScreen.current.startedAt;
        recordObservabilityEvent({
          kind: 'performance',
          level: durationMs >= 900 ? 'warning' : 'info',
          area: lastScreen.current.area,
          code: 'screen-residence',
          message: 'Tempo de permanência antes da troca de área.',
          durationMs
        });
      }
      const area = detail?.label || detail?.section || 'app';
      lastScreen.current = { area, startedAt: now };
      recordObservabilityEvent({ kind: 'navigation', level: 'info', area, code: 'screen-open', message: 'Área aberta pelo usuário.' });

      if (!preference.restoreFocus) return;
      if (focusTimer.current) window.clearTimeout(focusTimer.current);
      focusTimer.current = window.setTimeout(focusCurrentScreen, 120);
    };
    const onError = (event: ErrorEvent) => {
      const message = event.error instanceof Error ? event.error.message : event.message;
      if (preference.captureRuntimeIssues) {
        recordRuntimeQualityIssue({ source: 'window-error', message, location: event.filename ? `${event.filename}:${event.lineno}` : undefined });
      }
      recordObservabilityEvent({ kind: 'error', level: 'critical', area: 'window', code: 'unhandled-error', message: message || 'Erro global sem mensagem.' });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason instanceof Error ? event.reason.message : String(event.reason || 'Promise rejeitada sem mensagem.');
      if (preference.captureRuntimeIssues) recordRuntimeQualityIssue({ source: 'promise-rejection', message });
      recordObservabilityEvent({ kind: 'error', level: 'critical', area: 'promise', code: 'unhandled-rejection', message });
    };
    const onStorageFailure = (event: Event) => {
      const detail = (event as CustomEvent<StorageFailure>).detail;
      if (preference.captureRuntimeIssues) {
        recordRuntimeQualityIssue({ source: 'storage', message: `${detail.operation} em ${detail.key}: ${detail.reason}` });
      }
      recordObservabilityEvent({ kind: 'storage', level: 'warning', area: 'storage', code: detail.operation, message: `${detail.operation} bloqueado para uma chave local.` });
    };
    const onVisibility = () => recordObservabilityEvent({
      kind: 'performance',
      level: 'info',
      area: 'app-lifecycle',
      code: document.visibilityState === 'visible' ? 'app-resume' : 'app-background',
      message: document.visibilityState === 'visible' ? 'Aplicativo retornou ao primeiro plano.' : 'Aplicativo foi para segundo plano.',
      context: { stage: 'app-lifecycle', action: document.visibilityState }
    });
    const onScroll = () => setShowTop(window.scrollY > 720);

    let observer: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            recordLongTask(entry.duration);
            if (entry.duration < 120) continue;
            recordObservabilityEvent({
              kind: 'performance',
              level: entry.duration >= 500 ? 'warning' : 'info',
              area: 'main-thread',
              code: 'long-task',
              message: 'Tarefa longa detectada na interface.',
              durationMs: entry.duration
            });
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        observer = null;
      }
    }

    window.addEventListener('buildmaster:quality-preference', onPreference);
    window.addEventListener('buildmaster:screen-change', onScreen);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener(STORAGE_FAILURE_EVENT, onStorageFailure);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('buildmaster:quality-preference', onPreference);
      window.removeEventListener('buildmaster:screen-change', onScreen);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener(STORAGE_FAILURE_EVENT, onStorageFailure);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      if (focusTimer.current) window.clearTimeout(focusTimer.current);
    };
  }, []);

  return <>
    <button type="button" className={`bm-back-to-top ${showTop ? 'is-visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Voltar ao topo"><ArrowUp size={19} /></button>
  </>;
}
