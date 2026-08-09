'use client';

import { useEffect, useState } from 'react';
import { OBSERVABILITY_EVENT, readFeatureFlags, type FeatureFlagId } from './observabilityEngine';

export function useObservabilityFeatureFlag(id: FeatureFlagId): boolean {
  // Valor determinístico no SSR e na primeira renderização do WebView.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const refresh = () => {
      try {
        setEnabled(Boolean(readFeatureFlags()[id]));
      } catch {
        setEnabled(false);
      }
    };
    refresh();
    window.addEventListener(OBSERVABILITY_EVENT, refresh);
    return () => window.removeEventListener(OBSERVABILITY_EVENT, refresh);
  }, [id]);

  return enabled;
}
