import assert from 'node:assert/strict';
import { DEFAULT_OCR_ZONES as runtimeDefaults } from '../src/lib/ocr';
import { DEFAULT_OCR_ZONES as lightweightDefaults } from '../src/lib/ocrZonesModelR164';
import {
  createDefaultEfhubCalibrationZones,
  createEfhubCalibrationMap,
  normalizeEfhubCalibrationZones,
  readEfhubCalibrationMap,
} from '../src/modules/card-reader/efhubCalibrationModelR164';
import { EFHUB_CANONICAL_HEIGHT, EFHUB_CANONICAL_MACRO_BOXES, EFHUB_CANONICAL_WIDTH } from '../src/modules/card-reader/efhubLayoutGeometry';

assert.deepEqual(lightweightDefaults, runtimeDefaults, 'Reexport legado de DEFAULT_OCR_ZONES deve continuar idêntico ao modelo leve.');

const zones = createDefaultEfhubCalibrationZones();
assert.equal(zones.length, EFHUB_CANONICAL_MACRO_BOXES.length);
for (let index = 0; index < zones.length; index += 1) {
  const zone = zones[index];
  const box = EFHUB_CANONICAL_MACRO_BOXES[index];
  assert.ok(Math.abs(zone.x - box.x1 / EFHUB_CANONICAL_WIDTH) < 1e-12, `${zone.id}: x divergiu da geometria canônica.`);
  assert.ok(Math.abs(zone.y - box.y1 / EFHUB_CANONICAL_HEIGHT) < 1e-12, `${zone.id}: y divergiu da geometria canônica.`);
  assert.ok(Math.abs(zone.w - (box.x2 - box.x1) / EFHUB_CANONICAL_WIDTH) < 1e-12, `${zone.id}: largura divergiu da geometria canônica.`);
  assert.ok(Math.abs(zone.h - (box.y2 - box.y1) / EFHUB_CANONICAL_HEIGHT) < 1e-12, `${zone.id}: altura divergiu da geometria canônica.`);
}

const moved = normalizeEfhubCalibrationZones(zones.map((zone) => zone.id === 'skills' ? { ...zone, x: 0.04, y: 0.83, w: 0.91, h: 0.15 } : zone));
const restored = readEfhubCalibrationMap(JSON.stringify(createEfhubCalibrationMap(moved)));
assert.equal(restored?.zones.find((zone) => zone.id === 'skills')?.y, 0.83, 'Round-trip do mapa leve deve preservar calibração manual.');

console.log('R164 runtime: defaults OCR e calibração leve permanecem equivalentes às autoridades canônicas.');
