import assert from 'node:assert/strict';
import { DEFAULT_OCR_ZONES } from '../src/lib/ocr';
import {
  READING_CONFIRMATION_STAGES,
  buildStageSummary,
  ensureZoneCoverage,
  qualityLabel,
  qualityScore,
  readingStatus,
  suggestedEnhancement,
  type PremiumZoneReading
} from '../src/lib/premiumReading';

const quality = {
  width: 1440,
  height: 1600,
  sharpness: 14,
  brightness: 128,
  contrast: 39,
  issues: []
};
assert.ok(qualityScore(quality) >= 70);
assert.ok(['Boa', 'Excelente'].includes(qualityLabel(qualityScore(quality))));
assert.equal(suggestedEnhancement(quality), 'adaptive');
assert.equal(readingStatus(82, 'Lionel Messi'), 'confirmed');
assert.equal(readingStatus(54, 'MAT'), 'review');
assert.equal(readingStatus(99, ''), 'unread');

const partial: PremiumZoneReading[] = [{
  key: 'name', label: 'Nome do jogador', text: 'Jogador Teste', confidence: 90,
  status: 'confirmed', originPreview: null, enhancement: 'contrast'
}];
const covered = ensureZoneCoverage(DEFAULT_OCR_ZONES, partial);
assert.equal(covered.length, DEFAULT_OCR_ZONES.filter((zone) => zone.enabled).length);
assert.ok(covered.some((item) => item.key === 'attributes' && item.status === 'unread'));

const identity = READING_CONFIRMATION_STAGES.find((stage) => stage.id === 'identity');
assert.ok(identity);
const summary = buildStageSummary(covered, identity!);
assert.equal(summary.total, 4);
assert.equal(summary.found, 1);
assert.equal(READING_CONFIRMATION_STAGES.filter((stage) => stage.required).length, 4);

console.log('Lote 7 leitura premium: OK');
