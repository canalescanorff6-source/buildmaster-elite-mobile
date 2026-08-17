import assert from 'node:assert/strict';
import {
  buildOcrZonesFromEfhubCalibration,
  buildPreciseOcrZonesFromEfhubCalibration,
  createDefaultEfhubCalibrationZones,
  efhubCalibrationCardArtZone,
  isEfhubCalibrationComplete,
  normalizeEfhubCalibrationZones,
  readEfhubCalibrationMap,
  createEfhubCalibrationMap
} from '../src/modules/card-reader/efhubManualCalibration';

const defaults = createDefaultEfhubCalibrationZones();
assert.equal(defaults.length, 9);
assert.equal(isEfhubCalibrationComplete(defaults), true);
assert.deepEqual(defaults.map((zone) => zone.shortLabel), [
  'Nome + estilo', 'Carta / foto', 'Bio + condição', 'Posições + overalls',
  'Boosters / ímpeto', '26 atributos', 'Modelo físico', 'Habilidades', 'Pontos distribuídos'
]);

const moved = normalizeEfhubCalibrationZones(defaults.map((zone) =>
  zone.id === 'skills' ? { ...zone, x: 0.05, y: 0.84, w: 0.9, h: 0.14 } : zone
));
const ocr = buildOcrZonesFromEfhubCalibration(moved);
assert.equal(ocr.length, 20, 'O mapa manual deve gerar as 20 subáreas internas do OCR, incluindo a progressão.');
const skillZones = ocr.filter((zone) => zone.key === 'skills');
assert.equal(skillZones.length, 7, 'Habilidades devem manter bloco, três linhas e três janelas.');
assert.ok(skillZones.every((zone) => zone.x >= 0.05 && zone.y >= 0.84));
assert.ok(skillZones.every((zone) => zone.x + zone.w <= 0.951));

const card = moved.find((zone) => zone.id === 'card')!;
const cardArt = efhubCalibrationCardArtZone(moved);
assert.equal(cardArt.x, card.x);
assert.equal(cardArt.y, card.y);
assert.equal(cardArt.w, card.w);
assert.equal(cardArt.h, card.h);

const saved = createEfhubCalibrationMap(moved);
const restored = readEfhubCalibrationMap(JSON.stringify(saved));
assert.ok(restored);
assert.equal(restored?.zones.length, 9);
assert.equal(restored?.zones.find((zone) => zone.id === 'skills')?.y, 0.84);

const malformed = normalizeEfhubCalibrationZones([{ id: 'identity', x: -2, y: 9, w: 3, h: -1 }]);
assert.equal(malformed.length, 9);
assert.ok(malformed.every((zone) => zone.x >= 0 && zone.y >= 0 && zone.x + zone.w <= 1 && zone.y + zone.h <= 1));

void (async () => {
  const precise = await buildPreciseOcrZonesFromEfhubCalibration(new Blob(['fake'], { type: 'image/png' }), moved);
  assert.equal(precise.filter((zone) => zone.key === 'attributes').length, 3, 'Atributos devem continuar separados em três colunas.');
  assert.equal(precise.filter((zone) => zone.key === 'physicalModel').length, 3, 'Modelo físico deve continuar separado em três colunas.');
  assert.ok(precise.filter((zone) => zone.key === 'skills').length >= 15, 'Habilidades devem manter linhas e janelas/cápsulas internas.');
  console.log('v31.81: calibrador visual com nove áreas proporcionais e recortes internos precisos aprovado.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
