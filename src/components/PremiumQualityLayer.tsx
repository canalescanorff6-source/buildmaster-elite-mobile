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

  useEffect(() => {
    let preference = readQualityPreference();
    applyQualityProfile(preference);

    const onPreference = (event: Event) => {
      preference = (event as CustomEvent<QualityPreference>).detail;
      applyQualityProfile(preference);
    };
    const onScreen = () => {
      if (!preference.restoreFocus) return;
      if (focusTimer.current) window.clearTimeout(focusTimer.current);
      focusTimer.current = window.setTimeout(focusCurrentScreen, 120);
    };
    const onError = (event: ErrorEvent) => {
      if (!preference.captureRuntimeIssues) return;
      recordRuntimeQualityIssue({ source: 'window-error', message: event.error instanceof Error ? event.error.message : event.message, location: event.filename ? `${event.filename}:${event.lineno}` : undefined });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (!preference.captureRuntimeIssues) return;
      recordRuntimeQualityIssue({ source: 'promise-rejection', message: event.reason });
    };
    const onStorageFailure = (event: Event) => {
      if (!preference.captureRuntimeIssues) return;
      const detail = (event as CustomEvent<StorageFailure>).detail;
      recordRuntimeQualityIssue({ source: 'storage', message: `${detail.operation} em ${detail.key}: ${detail.reason}` });
    };
    const onScroll = () => setShowTop(window.scrollY > 720);

    let observer: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) recordLongTask(entry.duration);
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
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('buildmaster:quality-preference', onPreference);
      window.removeEventListener('buildmaster:screen-change', onScreen);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener(STORAGE_FAILURE_EVENT, onStorageFailure);
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      if (focusTimer.current) window.clearTimeout(focusTimer.current);
    };
  }, []);

  return <>
    <button type="button" className={`bm-back-to-top ${showTop ? 'is-visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Voltar ao topo"><ArrowUp size={19} /></button>
  </>;
}
