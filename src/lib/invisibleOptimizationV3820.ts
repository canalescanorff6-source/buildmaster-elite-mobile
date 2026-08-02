export const INVISIBLE_OPTIMIZATION_VERSION = '38.20.0' as const;

export type RuntimePerformanceTier = 'economy' | 'balanced' | 'high';
export type ImageWorkload = 'ocr-full' | 'ocr-crop' | 'preview' | 'export';

export type RuntimeSignals = {
  deviceMemory?: number | null;
  hardwareConcurrency?: number | null;
  saveData?: boolean | null;
  effectiveType?: string | null;
  online?: boolean | null;
  visibilityState?: DocumentVisibilityState | null;
};

export type RuntimeOptimizationProfile = {
  tier: RuntimePerformanceTier;
  maxFullOcrMegapixels: number;
  maxCropOcrMegapixels: number;
  maxPreviewMegapixels: number;
  ocrWorkerIdleMs: number;
  preloadModuleLimit: number;
  idleMaintenanceIntervalMs: number;
};

export type AdaptiveImagePlan = {
  width: number;
  height: number;
  scale: number;
  megapixels: number;
  reducedForMemory: boolean;
};

const PROFILES: Record<RuntimePerformanceTier, RuntimeOptimizationProfile> = {
  economy: {
    tier: 'economy',
    maxFullOcrMegapixels: 7.5,
    maxCropOcrMegapixels: 6,
    maxPreviewMegapixels: 2.4,
    ocrWorkerIdleMs: 45_000,
    preloadModuleLimit: 0,
    idleMaintenanceIntervalMs: 4 * 60 * 60 * 1000
  },
  balanced: {
    tier: 'balanced',
    maxFullOcrMegapixels: 10.5,
    maxCropOcrMegapixels: 9,
    maxPreviewMegapixels: 3.5,
    ocrWorkerIdleMs: 90_000,
    preloadModuleLimit: 2,
    idleMaintenanceIntervalMs: 6 * 60 * 60 * 1000
  },
  high: {
    tier: 'high',
    maxFullOcrMegapixels: 16,
    maxCropOcrMegapixels: 13,
    maxPreviewMegapixels: 5,
    ocrWorkerIdleMs: 150_000,
    preloadModuleLimit: Number.POSITIVE_INFINITY,
    idleMaintenanceIntervalMs: 8 * 60 * 60 * 1000
  }
};

function readNavigatorSignals(): RuntimeSignals {
  if (typeof navigator === 'undefined') return {};
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  return {
    deviceMemory: Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4),
    hardwareConcurrency: Number(navigator.hardwareConcurrency || 4),
    saveData: Boolean(connection?.saveData),
    effectiveType: connection?.effectiveType ?? null,
    online: navigator.onLine,
    visibilityState: typeof document === 'undefined' ? null : document.visibilityState
  };
}

export function detectRuntimePerformanceTier(signals: RuntimeSignals = readNavigatorSignals()): RuntimePerformanceTier {
  const memory = Number(signals.deviceMemory || 4);
  const cores = Number(signals.hardwareConcurrency || 4);
  const slowConnection = /(^|-)2g$/.test(String(signals.effectiveType || '').toLowerCase());

  if (signals.saveData || slowConnection || memory <= 3 || cores <= 4) return 'economy';
  if (memory >= 8 && cores >= 8) return 'high';
  return 'balanced';
}

export function getRuntimeOptimizationProfile(signals: RuntimeSignals = readNavigatorSignals()): RuntimeOptimizationProfile {
  return PROFILES[detectRuntimePerformanceTier(signals)];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function workloadMegapixels(profile: RuntimeOptimizationProfile, workload: ImageWorkload) {
  if (workload === 'ocr-full') return profile.maxFullOcrMegapixels;
  if (workload === 'ocr-crop') return profile.maxCropOcrMegapixels;
  if (workload === 'preview') return profile.maxPreviewMegapixels;
  return Math.max(profile.maxPreviewMegapixels, 8);
}

export function planAdaptiveImageSize(
  sourceWidth: number,
  sourceHeight: number,
  options: {
    workload: ImageWorkload;
    preferredLongestSide: number;
    minScale?: number;
    maxScale?: number;
    profile?: RuntimeOptimizationProfile;
  }
): AdaptiveImagePlan {
  const width = Math.max(1, Math.round(sourceWidth));
  const height = Math.max(1, Math.round(sourceHeight));
  const longest = Math.max(width, height);
  const minScale = Math.max(0.05, options.minScale ?? 0.25);
  const maxScale = Math.max(minScale, options.maxScale ?? 3);
  const profile = options.profile ?? getRuntimeOptimizationProfile();
  const desiredScale = clamp(options.preferredLongestSide / longest, minScale, maxScale);
  let targetWidth = Math.max(1, Math.round(width * desiredScale));
  let targetHeight = Math.max(1, Math.round(height * desiredScale));

  const maxPixels = workloadMegapixels(profile, options.workload) * 1_000_000;
  const targetPixels = targetWidth * targetHeight;
  let reducedForMemory = false;
  if (targetPixels > maxPixels) {
    const memoryScale = Math.sqrt(maxPixels / targetPixels);
    targetWidth = Math.max(1, Math.round(targetWidth * memoryScale));
    targetHeight = Math.max(1, Math.round(targetHeight * memoryScale));
    reducedForMemory = true;
  }

  return {
    width: targetWidth,
    height: targetHeight,
    scale: targetWidth / width,
    megapixels: Number(((targetWidth * targetHeight) / 1_000_000).toFixed(2)),
    reducedForMemory
  };
}

export function shouldPreloadInBackground(signals: RuntimeSignals = readNavigatorSignals()): boolean {
  const tier = detectRuntimePerformanceTier(signals);
  const effectiveType = String(signals.effectiveType || '').toLowerCase();
  if (tier === 'economy') return false;
  if (signals.saveData || signals.online === false) return false;
  if (signals.visibilityState === 'hidden') return false;
  if (/(^|-)2g$/.test(effectiveType)) return false;
  return true;
}

export function storagePressureLevel(usage = 0, quota = 0): 'normal' | 'elevated' | 'critical' {
  if (!quota || usage <= 0) return 'normal';
  const ratio = usage / quota;
  if (ratio >= 0.9) return 'critical';
  if (ratio >= 0.75) return 'elevated';
  return 'normal';
}

export function maintenanceLimits(pressure: ReturnType<typeof storagePressureLevel>) {
  if (pressure === 'critical') {
    return { ocrCache: 70, thumbnails: 30, diagnostics: 50, queue: 12 } as const;
  }
  if (pressure === 'elevated') {
    return { ocrCache: 110, thumbnails: 45, diagnostics: 75, queue: 20 } as const;
  }
  return { ocrCache: 180, thumbnails: 70, diagnostics: 120, queue: 30 } as const;
}
