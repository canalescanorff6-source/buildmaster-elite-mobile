import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const layout = read('src/app/layout.tsx');
const workspace = read('src/components/result/ResultWorkspace.tsx');
const component = read('src/components/PremiumCleanResultV3810.tsx');
const app = read('src/components/CardVisionApp.tsx');
const engine = read('src/lib/premiumCleanResultV3810.ts');
const css = read('src/app/v38-premium-clean-result.css');
const cache = read('src/components/RegisterServiceWorker.tsx');
const sw = read('public/sw.js');

assert.match(layout, /import '\.\/v38-premium-clean-result\.css';/);
assert.match(layout, /bm-v3810-result/);
assert.match(workspace, /<PremiumCleanResultV3810/);
assert.match(workspace, /variant="export"/);
assert.match(component, /Imagem vertical/);
assert.match(component, /Imagem quadrada/);
assert.match(component, /5 habilidades adicionais/);
assert.match(engine, /buildPremiumCleanCardSvg/);
assert.match(engine, /premiumCleanSvgToPngBlob/);
assert.match(engine, /Ficha validada/);
assert.match(app, /format: PremiumCleanExportFormat = 'portrait'/);
assert.match(app, /premiumCleanSvgToPngBlob/);
assert.match(app, /\.png`/);
for (const marker of [
  '.bm-v3810-clean-result',
  '.bm-v3810-training-grid',
  '.bm-v3810-result-pair',
  '.bm-v3810-result-actions',
  '.mode-basic .bm-simple-result-summary'
]) assert.ok(css.includes(marker), `Camada v38.10 incompleta: ${marker}`);
assert.match(cache, /38\.10\.0-premium-clean-result-1/);
assert.match(sw, /buildmaster-v38-10-premium-clean-result-1/);

console.log('v38.10 integração aprovada: resultado clean visível, exportação PNG e layouts vertical/quadrado ativos.');
