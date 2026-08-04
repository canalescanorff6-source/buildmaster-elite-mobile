'use client';

import { useEffect } from 'react';
import { runtimeTrimStore } from '@/lib/localDatabase';
import {
  getRuntimeOptimizationProfile,
  maintenanceLimits,
  storagePressureLevel
} from '@/lib/invisibleOptimizationV3820';
import { requestOcrWorkerReleaseWhenIdle } from '@/lib/ocrWorkerManager';
import { cancelIdleTask, scheduleIdleTask } from '@/lib/performanceScheduler';
import { safeStorageGet, safeStorageSet } from '@/lib/safeLocalStorage';

const LAST_MAINTENANCE_KEY = 'buildmaster:v38.20:last-runtime-maintenance';

async function runSilentMaintenance() {
  let usage = 0;
  let quota = 0;
  try {
    const estimate = await navigator.storage?.estimate?.();
    usage = Number(estimate?.usage || 0);
    quota = Number(estimate?.quota || 0);
  } catch {
    // A estimativa é opcional; a manutenção continua com limites normais.
  }

  const limits = maintenanceLimits(storagePressureLevel(usage, quota));
  await Promise.allSettled([
    runtimeTrimStore('ocr-cache', limits.ocrCache),
    runtimeTrimStore('image-thumbnails', limits.thumbnails),
    runtimeTrimStore('diagnostics', limits.diagnostics),
    runtimeTrimStore('ocr-queue', limits.queue)
  ]);
  safeStorageSet(LAST_MAINTENANCE_KEY, new Date().toISOString());
}

export function RuntimeOptimizationBootstrapV3820() {
  useEffect(() => {
    const profile = getRuntimeOptimizationProfile();
    document.body.classList.add('bm-v3820-runtime', `bm-runtime-${profile.tier}`);

    const previous = Date.parse(safeStorageGet(LAST_MAINTENANCE_KEY) || '');
    const maintenanceDue = !Number.isFinite(previous)
      || Date.now() - previous >= profile.idleMaintenanceIntervalMs;
    const idleHandle = maintenanceDue
      ? scheduleIdleTask(() => { void runSilentMaintenance(); }, 2200)
      : -1;

    let hiddenReleaseTimer = -1;
    const clearHiddenTimer = () => {
      if (hiddenReleaseTimer >= 0) window.clearTimeout(hiddenReleaseTimer);
      hiddenReleaseTimer = -1;
    };
    const handleVisibility = () => {
      clearHiddenTimer();
      if (document.visibilityState !== 'hidden') return;
      // v38.40: não descarrega o worker durante uma leitura ativa. O processo
      // nativo mantém o aplicativo vivo e o checkpoint permite retomada segura.
      hiddenReleaseTimer = window.setTimeout(() => {
        const readingActive = document.body.dataset.ocrReading === 'active';
        if (!readingActive) requestOcrWorkerReleaseWhenIdle(0);
      }, Math.min(45_000, Math.round(profile.ocrWorkerIdleMs / 2)));
    };
    const handlePageHide = () => {
      if (document.body.dataset.ocrReading !== 'active') requestOcrWorkerReleaseWhenIdle(0);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      cancelIdleTask(idleHandle);
      clearHiddenTimer();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      document.body.classList.remove('bm-v3820-runtime', `bm-runtime-${profile.tier}`);
    };
  }, []);

  return null;
}
