import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const source = read('src/components/ReaderImageSourceCardV4010.tsx');
const progress = read('src/components/ReaderRecoveryAndProgressV3840.tsx');
const css = read('src/app/v44-buildmaster-reference.css');

for (const marker of [
  'bm-r523-reader-panel',
  'bm-r523-capture-mode',
  'bm-r523-reader-actions',
  'bm-r523-image-warning',
  'bm-r523-quality-card',
  'bm-r523-image-lab',
]) assert.ok(app.includes(marker), `R523: CardVision reader sem hook ${marker}`);

assert.ok(source.includes('bm-r523-source-card'), 'R523: source card precisa de hook visual próprio.');
assert.ok(progress.includes('bm-r523-live-progress'), 'R523: progresso live precisa de hook visual próprio.');

for (const selector of [
  '.bm-r523-reader-panel',
  '.bm-r523-source-card',
  '.bm-r523-capture-mode',
  '.bm-r523-reader-actions',
  '.bm-r523-live-progress',
  '.bm-r523-image-warning',
  '.bm-r523-quality-card',
  '.bm-r523-image-lab',
  '.r123-confidence-grid',
]) assert.ok(css.includes(selector), `R523: CSS não cobre ${selector}`);

assert.match(source, /accept="image\/\*"/, 'R523: galeria/câmera devem continuar aceitando imagem.');
assert.match(source, /capture="environment"/, 'R523: captura por câmera deve continuar disponível.');
assert.match(progress, /role="status"/, 'R523: progresso precisa continuar anunciado por acessibilidade.');
assert.match(app, /aria-live="polite"/, 'R523: fila/status devem preservar região viva.');

for (const forbidden of ['trainingOptimizer','engineCertificationR517','realMatchCalibrationEvidenceR518']) {
  assert.ok(!source.includes(forbidden), `R523: upload visual não pode assumir autoridade ${forbidden}`);
  assert.ok(!progress.includes(forbidden), `R523: progresso visual não pode assumir autoridade ${forbidden}`);
}

console.log('R523 aprovada: fluxo visual de Leitura/OCR premium sem alterar o reader ou a autoridade do core.');
