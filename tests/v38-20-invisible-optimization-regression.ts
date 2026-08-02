import assert from 'node:assert/strict';
import {
  INVISIBLE_OPTIMIZATION_VERSION,
  detectRuntimePerformanceTier,
  getRuntimeOptimizationProfile,
  maintenanceLimits,
  planAdaptiveImageSize,
  shouldPreloadInBackground,
  storagePressureLevel
} from '../src/lib/invisibleOptimizationV3820';

assert.equal(INVISIBLE_OPTIMIZATION_VERSION, '38.20.0');
assert.equal(detectRuntimePerformanceTier({ deviceMemory: 2, hardwareConcurrency: 8 }), 'economy');
assert.equal(detectRuntimePerformanceTier({ deviceMemory: 8, hardwareConcurrency: 8 }), 'high');
assert.equal(detectRuntimePerformanceTier({ deviceMemory: 6, hardwareConcurrency: 6 }), 'balanced');
assert.equal(detectRuntimePerformanceTier({ deviceMemory: 12, hardwareConcurrency: 12, saveData: true }), 'economy');

const economy = getRuntimeOptimizationProfile({ deviceMemory: 2, hardwareConcurrency: 4 });
const high = getRuntimeOptimizationProfile({ deviceMemory: 12, hardwareConcurrency: 12 });
assert.ok(economy.maxFullOcrMegapixels < high.maxFullOcrMegapixels);
assert.equal(economy.preloadModuleLimit, 0);
assert.equal(high.preloadModuleLimit, Number.POSITIVE_INFINITY);

const huge = planAdaptiveImageSize(8000, 6000, {
  workload: 'ocr-full',
  preferredLongestSide: 5000,
  profile: economy
});
assert.ok(huge.megapixels <= economy.maxFullOcrMegapixels + 0.02);
assert.equal(huge.reducedForMemory, true);
assert.ok(huge.width > huge.height);

const small = planAdaptiveImageSize(900, 1200, {
  workload: 'ocr-full',
  preferredLongestSide: 2800,
  maxScale: 2.5,
  profile: high
});
assert.equal(small.height, 2800);
assert.ok(small.scale > 2);

assert.equal(shouldPreloadInBackground({ deviceMemory: 8, hardwareConcurrency: 8, online: true, visibilityState: 'visible' }), true);
assert.equal(shouldPreloadInBackground({ deviceMemory: 8, hardwareConcurrency: 8, saveData: true, online: true, visibilityState: 'visible' }), false);
assert.equal(shouldPreloadInBackground({ deviceMemory: 8, hardwareConcurrency: 8, online: false, visibilityState: 'visible' }), false);
assert.equal(shouldPreloadInBackground({ deviceMemory: 8, hardwareConcurrency: 8, online: true, visibilityState: 'hidden' }), false);

assert.equal(storagePressureLevel(50, 100), 'normal');
assert.equal(storagePressureLevel(80, 100), 'elevated');
assert.equal(storagePressureLevel(95, 100), 'critical');
assert.ok(maintenanceLimits('critical').ocrCache < maintenanceLimits('normal').ocrCache);

console.log('v38.20 Otimização Invisível aprovada: perfil adaptativo, limite de imagem, prefetch e manutenção silenciosa.');
