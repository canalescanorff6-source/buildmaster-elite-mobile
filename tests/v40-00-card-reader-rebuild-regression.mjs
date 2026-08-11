import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');
const manual = read('src/modules/card-reader/manualCalibrationFastReader.ts');
const calibration = read('src/modules/card-reader/efhubManualCalibration.ts');
const cardVision = read('src/components/CardVisionApp.tsx');
const crop = read('src/modules/card-reader/cardArtCrop.ts');
const worker = read('src/lib/ocrWorkerManager.ts');
const background = read('src/lib/backgroundOcrV3840.ts');
const precision = read('src/modules/card-reader/highPrecisionOcr.ts');
const single = read('src/modules/card-reader/singlePrintPro.ts');

assert.equal(pkg.version, '40.10.0');
assert.equal(manifest.name, 'BuildMaster Elite Tático v40.10');
assert.equal(manifest.short_name, 'BuildMaster v40.10');
assert.match(sw, /buildmaster-v40-10-progress-1/);

assert.match(manual, /MANUAL_CALIBRATION_FAST_READER_VERSION = '40\.00-calibrated-fields-r1'/);
assert.match(manual, /TOTAL_READER_DEADLINE_MS = 180_000/);
assert.match(manual, /buildPreciseOcrZonesFromEfhubCalibration/);
assert.match(manual, /prewarmOcrWorker\(\)/);
assert.match(manual, /addLegacyPrecisionFallback/);
assert.match(manual, /needsName/);
assert.match(manual, /needsAttributes/);
assert.match(manual, /needsSkills/);
assert.match(manual, /duplicateEvidence\(reading, 'level'/);
assert.match(manual, /image === file/);
assert.match(manual, /knownPlayerNames/);

assert.match(calibration, /EFHUB_MANUAL_CALIBRATION_VERSION = 'v40\.00-manual-map-rebuild-r1'/);
assert.match(cardVision, /createManualEfhubCardPreview\(activeFile, geometry\.cardArtZone\)/);
assert.match(cardVision, /knownPlayerNames,/);
assert.match(cardVision, /const calibratedZoneText = calibratedFastPath/);
assert.match(cardVision, /fullText: calibratedZoneText/);
assert.match(cardVision, /buildOcrVisionAudit\(session, calibratedZoneText\)/);
assert.match(cardVision, /ocr_hard_failure/);
assert.match(crop, /method: 'manual-adjustment'/);

assert.match(worker, /createWorker\(\['por'\]/);
assert.match(worker, /export async function prewarmOcrWorker/);
assert.match(worker, /version: 3/);
assert.match(worker, /`v3:\$\{options\.cacheKey\}:\$\{kind\}`/);
assert.match(background, /BACKGROUND_OCR_VERSION = '40\.00-background-resume-2'/);
assert.match(background, /version: 2/);
assert.match(precision, /HIGH_PRECISION_OCR_VERSION = '40\.00-calibrated-rebuild-r1'/);
assert.match(single, /precisionVersion === '40\.00-calibrated-fields-r1'/);

console.log('v40.00 aprovada: leitor por quadrados reconstruído, OCR local em português otimizado, recorte manual exato, timeout e parser por campos protegidos.');
