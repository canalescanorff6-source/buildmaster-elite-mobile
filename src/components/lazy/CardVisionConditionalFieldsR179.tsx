'use client';

import dynamic from 'next/dynamic';
import { PanelLoadingFallback } from '@/components/PanelLoadingFallback';

const fallback = () => <PanelLoadingFallback />;

export const CalibrationProfileFields = dynamic(
  () => import('@/components/CalibrationProfileFields').then((module) => module.CalibrationProfileFields),
  { ssr: false, loading: fallback }
);

export const ManagerSelectionField = dynamic(
  () => import('@/components/ManagerSelectionField').then((module) => module.ManagerSelectionField),
  { ssr: false, loading: fallback }
);

export const EfootballV600PreviewV4070 = dynamic(
  () => import('@/components/EfootballV600PreviewV4070').then((module) => module.EfootballV600PreviewV4070),
  { ssr: false, loading: fallback }
);

export const UnifiedCreationFlowV3790 = dynamic(
  () => import('@/components/UnifiedCreationFlowV3790').then((module) => module.UnifiedCreationFlowV3790),
  { ssr: false, loading: fallback }
);

export const UnifiedCreationResumeCardV3790 = dynamic(
  () => import('@/components/UnifiedCreationFlowV3790').then((module) => module.UnifiedCreationResumeCardV3790),
  { ssr: false, loading: () => null }
);
