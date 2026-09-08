'use client';

import dynamic from 'next/dynamic';
import { useObservabilityFeatureFlag } from '@/modules/observability/useObservabilityFeatureFlag';
import type { OcrVisionCenterProps } from './OcrVisionCenter';

export const OCR_VISION_FEATURE_GATE_R178_VERSION = '40.80-r178-ocr-vision-feature-gate-v1' as const;

const LazyOcrVisionCenterR178 = dynamic(
  () => import('./OcrVisionCenter').then((module) => module.OcrVisionCenter),
  { ssr: false, loading: () => null }
);

export function OcrVisionFeatureGateR178(props: OcrVisionCenterProps) {
  const enabled = useObservabilityFeatureFlag('ocrVision2');
  if (!enabled) return null;
  return <LazyOcrVisionCenterR178 {...props} />;
}
