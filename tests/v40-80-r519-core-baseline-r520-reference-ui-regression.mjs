import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const layout = read('src/app/layout.tsx');
const app = read('src/components/CardVisionApp.tsx');
const optimizer = read('src/modules/builds/trainingOptimizer.ts');
const cssPath = 'src/app/v44-buildmaster-reference.css';

assert.match(optimizer, /confidenceAtLeastR501\(parsed\.confidence, 90\)/,
  'R519: baseline do core exige confiança canônica R501 no training optimizer.');
assert.doesNotMatch(optimizer, /Number\(parsed\.confidence\s*\?\?\s*0\)\s*>=\s*0\.9/,
  'R519: escala legada 0-1 não pode reaparecer.');
assert.ok(fs.existsSync(cssPath), 'R520: camada visual de referência precisa existir.');
assert.match(layout, /import '\.\/v44-buildmaster-reference\.css';/,
  'R520: layout precisa carregar a camada visual por último.');
assert.match(layout, /bm-v4400-reference/,
  'R520: body precisa declarar a camada visual oficial.');
assert.match(app, /useState<PremiumVisualPreset>\('obsidian-gold'\)/,
  'R520: bootstrap visual deve iniciar no preset ouro/obsidiana da referência.');

const css = read(cssPath);
for (const token of [
  '--bm-ref-navy-950', '--bm-ref-gold-500', '--bm-ref-cyan-400', '--bm-ref-surface-1',
  '--bm-ref-radius-card', '--bm-ref-shadow-card', '--bm-ref-motion-fast'
]) assert.ok(css.includes(token), `R520: token ausente ${token}`);

for (const selector of [
  '.bm-v33-sidebar', '.bm-simple-topbar', '.bm-premium-dashboard', '.result-panel',
  '.bm2820-screen-hero', '.luxury-panel', '.bm-v36-mobile-dock'
]) assert.ok(css.includes(selector), `R520: superfície principal não coberta ${selector}`);

assert.match(css, /prefers-reduced-motion:\s*reduce/,
  'R520: movimento reduzido precisa permanecer respeitado.');
assert.match(css, /env\(safe-area-inset-bottom/,
  'R520: dock mobile precisa respeitar safe area Android/iOS.');

console.log('R519/R520 aprovado: core baseline protegido e referência premium navy+gold+cyan aplicada ao shell e superfícies principais.');
