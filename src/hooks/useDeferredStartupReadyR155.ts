'use client';

import { useEffect, useState } from 'react';
import { cancelIdleTask, scheduleIdleTask } from '@/lib/performanceScheduler';
import { getRuntimeOptimizationProfile } from '@/lib/invisibleOptimizationV3820';

export const DEFERRED_STARTUP_READY_R155_VERSION = '40.80-r155-deferred-startup-v1' as const;

export function useDeferredStartupReadyR155(enabled: boolean): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    let idleHandle = -1;
    const profile = getRuntimeOptimizationProfile();
    const quietDelayMs = profile.tier === 'economy' ? 3200 : profile.tier === 'balanced' ? 1800 : 900;
    const timer = window.setTimeout(() => {
      idleHandle = scheduleIdleTask(() => setReady(true), profile.tier === 'economy' ? 2600 : 1600);
    }, quietDelayMs);

    return () => {
      window.clearTimeout(timer);
      cancelIdleTask(idleHandle);
    };
  }, [enabled]);

  return ready;
}
