import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const layout = read('src/app/layout.tsx');
const css = read('src/app/v41-premium-product.css');
const chrome = read('src/components/CardVisionAppChromeR185.tsx');
const nav = read('src/components/RefinedNavigation.tsx');
const context = read('src/components/PremiumContextBar.tsx');

assert.match(layout, /import '\.\/v41-premium-product\.css';/);
assert.ok(layout.indexOf("import './v41-premium-product.css';") > layout.indexOf("import './v40-formation-editor.css';"), 'R201 deve ser a última camada visual importada.');
assert.match(layout, /bm-v4100-product/);

for (const marker of [
  'body.bm-v4100-product',
  '.bm-v4100-product .bm-v33-sidebar',
  '.bm-v4100-product .bm-simple-topbar',
  '.bm-v4100-product .bm-simple-context',
  '.bm-v4100-product .bm-v36-mobile-dock',
  '.bm-v4100-product .mobile-action-sheet',
  '.bm-v4100-product .bm2820-screen-hero',
  '.bm-v4100-product .bm32-category-tabs',
  '@media (prefers-reduced-motion: reduce)'
]) assert.ok(css.includes(marker), `Contrato visual ausente: ${marker}`);

for (const preset of ['midnight-navy','obsidian-gold','elite-blue','future-purple','emerald-tactical','graphite-silver','pearl-executive']) {
  assert.ok(css.includes(`visual-${preset}`), `Preset ${preset} precisa continuar suportado pela R201.`);
}

assert.match(css, /\.premium-app\.theme-light/);
assert.match(chrome, /bm-v41-product-badge/);
assert.match(nav, /bm-v41-nav-section-label/);
assert.match(context, /bm-v41-context-copy/);
assert.match(context, /bm-v41-context-eyebrow/);

console.log('R201 aprovada: design de produto premium unificado, navegação refinada, temas preservados e movimento acessível.');
