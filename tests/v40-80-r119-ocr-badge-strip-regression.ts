import assert from 'node:assert/strict';
import { buildAttributeValueStripZonesForCalibration, MANUAL_CALIBRATION_FAST_READER_VERSION } from '../src/modules/card-reader/manualCalibrationFastReader';
import type { EfhubCalibrationZone } from '../src/modules/card-reader/efhubManualCalibration';

const macro: EfhubCalibrationZone = {
  id: 'attributes', key: 'attributes', shortLabel: '26 atributos', color: '#ff536b',
  x: 0.08, y: 0.48, w: 0.84, h: 0.32, enabled: true
};

const strips = buildAttributeValueStripZonesForCalibration(macro);
assert.equal(strips.length, 3);
assert.deepEqual(strips.map((item) => item.expected), [10, 9, 7]);
assert.deepEqual(strips.map((item) => item.columnId), ['left', 'center', 'right']);

for (const strip of strips) {
  assert.ok(strip.x >= macro.x, `${strip.columnId}: faixa precisa começar dentro do quadrado.`);
  assert.ok(strip.x + strip.w <= macro.x + macro.w + 1e-9, `${strip.columnId}: faixa precisa terminar dentro do quadrado.`);
  assert.equal(strip.y, macro.y);
  assert.equal(strip.h, macro.h);
  assert.ok(strip.w < macro.w * 0.12, `${strip.columnId}: OCR primário deve enxergar só a faixa numérica, não os rótulos.`);
}

const relativeCenters = strips.map((strip) => ((strip.x + strip.w / 2) - macro.x) / macro.w);
assert.ok(relativeCenters[0] > 0.25 && relativeCenters[0] < 0.35, 'Faixa esquerda deve mirar os badges de valor da primeira coluna.');
assert.ok(relativeCenters[1] > 0.60 && relativeCenters[1] < 0.70, 'Faixa central deve mirar os badges de valor da segunda coluna.');
assert.ok(relativeCenters[2] > 0.92 && relativeCenters[2] < 0.99, 'Faixa direita deve mirar os badges de valor da terceira coluna.');
assert.match(MANUAL_CALIBRATION_FAST_READER_VERSION, /r2$/, 'A versão/cache do leitor precisa mudar para não reutilizar OCR antigo dos atributos.');

console.log('r119 OCR badge-strip: faixas numéricas 10/9/7 e invalidação de cache aprovadas.');
