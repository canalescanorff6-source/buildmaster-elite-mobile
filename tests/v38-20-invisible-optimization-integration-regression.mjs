import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const layout = read('src/app/layout.tsx');
const bootstrap = read('src/components/RuntimeOptimizationBootstrapV3820.tsx');
const runtime = read('src/lib/invisibleOptimizationV3820.ts');
const imageProcessing = read('src/modules/card-reader/imageProcessing.ts');
const ocrManager = read('src/lib/ocrWorkerManager.ts');
const lazyPanels = read('src/components/lazy/AppLazyPanels.tsx');
const cache = read('src/components/RegisterServiceWorker.tsx');
const sw = read('public/sw.js');
const pkg = JSON.parse(read('package.json'));

assert.match(layout, /RuntimeOptimizationBootstrapV3820/);
assert.match(layout, /bm-v3820-runtime-shell/);
assert.match(bootstrap, /runtimeTrimStore\('ocr-cache'/);
assert.match(bootstrap, /requestOcrWorkerReleaseWhenIdle/);
assert.match(runtime, /INVISIBLE_OPTIMIZATION_VERSION = '38\.20\.0'/);
assert.match(runtime, /planAdaptiveImageSize/);
assert.match(runtime, /shouldPreloadInBackground/);
assert.match(imageProcessing, /workload: 'ocr-full'/);
assert.match(imageProcessing, /workload: 'ocr-crop'/);
assert.doesNotMatch(imageProcessing, /canvas\.width = bitmap\.width;\s*canvas\.height = bitmap\.height;/);
assert.match(ocrManager, /enqueueWorkerOperation/);
assert.match(ocrManager, /inFlightRecognitions/);
assert.match(ocrManager, /OCR_CACHE_MAX_AGE_MS/);
assert.match(ocrManager, /armIdleWorkerRelease/);
assert.match(lazyPanels, /shouldPreloadInBackground/);
assert.match(lazyPanels, /preloadModuleLimit/);
assert.match(cache, /38\.20\.0-invisible-optimization-1/);
assert.match(sw, /buildmaster-v38-20-invisible-optimization-1/);
assert.equal(typeof pkg.scripts['test:v3820'], 'string');
assert.match(pkg.scripts['test:all'], /test:v3820/);

console.log('v38.20 integração aprovada: otimização invisível ligada ao layout, OCR, imagens, lazy loading e cache.');
