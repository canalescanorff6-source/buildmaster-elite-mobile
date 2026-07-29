import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildPrintQualityReport } from '../src/lib/validation';
import { stabilizeForensicReadings, FORENSIC_CONSENSUS_VERSION } from '../src/modules/card-reader/forensicConsensus';
import { applyOcrTemplateCalibration, applyRememberedCardBox, OCR_TEMPLATE_CALIBRATION_VERSION, type OcrTemplateCalibration } from '../src/modules/card-reader/templateCalibration';
import { HIGH_PRECISION_OCR_VERSION } from '../src/modules/card-reader/highPrecisionOcr';
import { OCR_VISION_VERSION } from '../src/modules/card-reader/ocrVisionEngine';
import type { OcrZone } from '../src/lib/ocr';
import type { PremiumZoneReading } from '../src/lib/premiumReading';

const currentVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version as string;
const currentRelease = currentVersion.split('.').slice(0, 2).join('.');
assert.ok(HIGH_PRECISION_OCR_VERSION.startsWith(`${currentRelease}-`));
assert.equal(OCR_VISION_VERSION, currentVersion);
assert.equal(FORENSIC_CONSENSUS_VERSION, '31.60-field-consensus-2');
assert.ok(OCR_TEMPLATE_CALIBRATION_VERSION.startsWith(`${currentRelease}-`));

const goodQuality = buildPrintQualityReport({
  width: 2400, height: 1080, sharpness: 18, brightness: 126, contrast: 47,
  laplacianVariance: 95, darkClipRatio: 0.18, lightClipRatio: 0.03,
  glareRatio: 0.01, blockiness: 2.1, textEdgeDensity: 0.09
});
assert.equal(goodQuality.state, 'ready');
assert.ok(goodQuality.score >= 75);

const badQuality = buildPrintQualityReport({
  width: 520, height: 700, sharpness: 4.2, brightness: 238, contrast: 12,
  laplacianVariance: 9, darkClipRatio: 0.02, lightClipRatio: 0.42,
  glareRatio: 0.25, blockiness: 26, textEdgeDensity: 0.009
});
assert.equal(badQuality.state, 'blocked');
assert.ok(badQuality.issues.filter((issue) => issue.severity === 'block').length >= 3);

function reading(key: PremiumZoneReading['key'], text: string, rawPasses: PremiumZoneReading['rawPasses']): PremiumZoneReading {
  return {
    key, label: String(key), text, confidence: 91, status: 'confirmed', originPreview: null,
    enhancement: 'contrast', rawPasses, alternatives: [], passCount: rawPasses?.length ?? 1,
    agreement: 3, consistency: 88
  };
}

const stabilized = stabilizeForensicReadings([
  reading('attributes', 'Passe rasteiro 88\nFinalização 92\nVelocidade 90\nAceleração 89', [
    { text: 'Passe rasteiro 88\nFinalização 92\nVelocidade 90\nAceleração 89', confidence: 91, enhancement: 'contrast', kind: 'table:exact' },
    { text: 'Passe rasteiro 88\nFinalizacao 92\nVelocidade 90\nAceleracao 89', confidence: 89, enhancement: 'sharp', kind: 'table:tight' },
    { text: 'Passe rasteiro 83\nFinalização 92\nVelocidade 90\nAceleração 89', confidence: 75, enhancement: 'binary', kind: 'table:wide' }
  ]),
  reading('skills', 'Passe de primeira\nChute de primeira\nLeitura Relâmpago', [
    { text: 'Passe de primeira\nChute de primeira\nLeitura Relâmpago', confidence: 91, enhancement: 'contrast', kind: 'skills:exact' },
    { text: 'Passe de primeira\nChute de primeira\nLeitura Relampago', confidence: 88, enhancement: 'sharp', kind: 'skills:tight' },
    { text: 'Habilidades\nPasse de primeira\nChute de primeira\nLeitura Relâmpago\nGER 99', confidence: 86, enhancement: 'binary', kind: 'skills:wide' }
  ])
]);
assert.ok(stabilized.readings.find((item) => item.key === 'attributes')?.text.includes('Passe rasteiro: 88'));
assert.ok(stabilized.readings.find((item) => item.key === 'skills')?.text.includes('Leitura Relâmpago'));
assert.ok(stabilized.audit.rejectedNoiseRows >= 1);
assert.deepEqual(stabilized.audit.mergedFields.sort(), ['attributes', 'skills']);

const zones: OcrZone[] = [{ key: 'name', label: 'Nome', x: 0.02, y: 0.02, w: 0.30, h: 0.06, enabled: true }];
const calibration: OcrTemplateCalibration = {
  id: 'classic:1600x900', template: 'classic', widthBucket: 1600, heightBucket: 900,
  orientation: 'landscape', zones: [{ key: 'name', x: 0.08, y: 0.04, w: 0.34, h: 0.07 }],
  cardBox: { x: 0.10, y: 0.08, w: 0.25, h: 0.62 }, confirmations: 4,
  manualCropConfirmations: 2, qualityAverage: 88, firstSeenAt: '2026-01-01T00:00:00.000Z',
  lastSeenAt: '2026-01-02T00:00:00.000Z', version: OCR_TEMPLATE_CALIBRATION_VERSION
};
const calibrated = applyOcrTemplateCalibration(zones, calibration);
assert.ok(calibrated[0].x > zones[0].x);
assert.ok(calibrated[0].w > zones[0].w);
const rememberedBox = applyRememberedCardBox({ x: 0.02, y: 0.06, w: 0.42, h: 0.34 }, calibration);
assert.ok(rememberedBox.x > 0.02 && rememberedBox.y > 0.06);

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(app, /stabilizeForensicReadings/);
assert.match(app, /findBestOcrTemplateCalibration/);
assert.match(app, /learnOcrTemplateCalibration/);
assert.match(app, /qualityReport: scanQuality/);
const database = fs.readFileSync('src/lib/localDatabase.ts', 'utf8');
assert.match(database, /DB_VERSION = 6/);
assert.match(database, /'ocr-calibrations'/);
const center = fs.readFileSync('src/modules/card-reader/OcrVisionCenter.tsx', 'utf8');
assert.match(center, /(?:Leitor eFHUB Forense 4\.0|Perfil eFHUB Padronizado 5\.0)/);
assert.match(center, /Qualidade do print/);

console.log('v31.60 scanner forense, consenso por linha e memória de enquadramento aprovados.');
