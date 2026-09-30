import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const layout = read('src/app/layout.tsx');
const css = read('src/app/v44-buildmaster-reference.css');

assert.ok(layout.includes('bm-r530-final-polish'), 'R530: RootLayout precisa ativar a camada final de polimento.');

for (const selector of [
  'body.bm-v4400-reference.bm-r530-final-polish',
  '.bm-r530-final-polish :where(button, a, input, select, textarea, summary)',
  '.bm-r530-final-polish :where(h1, h2, h3)',
  '.bm-r530-final-polish .premium-app',
  '.bm-r530-final-polish .bm-r521-mobile-dock',
]) assert.ok(css.includes(selector), `R530: CSS final não cobre ${selector}`);

assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/,
  'R530: efeitos hover devem ficar restritos a dispositivos com ponteiro preciso.');
assert.match(css, /@media \(max-width: 760px\)/,
  'R530: polimento final deve preservar tratamento mobile.');
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/,
  'R530: polimento final deve respeitar movimento reduzido.');
assert.match(css, /@media \(prefers-contrast: more\)/,
  'R530: polimento final deve oferecer contraste reforçado quando solicitado.');
assert.match(css, /@media \(forced-colors: active\)/,
  'R530: controles precisam continuar utilizáveis em cores forçadas.');
assert.match(css, /env\(safe-area-inset-bottom\)/,
  'R530: navegação mobile deve continuar protegida pela safe area inferior.');
assert.match(css, /touch-action:\s*manipulation/,
  'R530: controles de toque devem evitar atraso/gesto ambíguo.');
assert.match(css, /overflow-wrap:\s*anywhere/,
  'R530: textos longos não podem estourar cards no mobile.');

for (const forbidden of [
  'trainingOptimizer',
  'engineCertificationR517',
  'realMatchCalibrationEvidenceR518',
  'jointOptimizerR512',
]) assert.ok(!layout.includes(forbidden), `R530: layout visual não pode importar autoridade funcional ${forbidden}`);

console.log('R530 aprovada: polimento final global melhora responsividade, acessibilidade e interação sem tocar no core.');
