'use client';

import { useEffect, useState } from 'react';
import { OBSERVABILITY_EVENT, readFeatureFlags, type FeatureFlagId } from './observabilityEngine';

export function useObservabilityFeatureFlag(id: FeatureFlagId): boolean {
  const [enabled, setEnabled] = useState(() => readFeatureFlags()[id]);

  useEffect(() => {
    const refresh = () => setEnabled(readFeatureFlags()[id]);
    window.addEventListener(OBSERVABILITY_EVENT, refresh);
    return () => window.removeEventListener(OBSERVABILITY_EVENT, refresh);
  }, [id]);

  return enabled;
}
