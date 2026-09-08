'use client';

import { useEffect, useState } from 'react';
import type { MatchValidationRecord } from '@/lib/appEvolution';
import { readMatchValidationRepositoryR137, subscribeMatchValidationRepositoryR137 } from './matchValidationRepositoryR137';
import { cancelIdleTask, scheduleIdleTask } from '@/lib/performanceScheduler';

export function useCentralMatchRecordsR135(options: {
  enabled: boolean;
  performanceMode: 'economy' | 'balanced';
}) {
  const { enabled, performanceMode } = options;
  const [records, setRecords] = useState<MatchValidationRecord[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const reload = () => setRecords(readMatchValidationRepositoryR137());
    const handle = scheduleIdleTask(reload, performanceMode === 'economy' ? 1200 : 450);
    const unsubscribe = subscribeMatchValidationRepositoryR137(reload);
    return () => {
      cancelIdleTask(handle);
      unsubscribe();
    };
  }, [enabled, performanceMode]);

  return records;
}
