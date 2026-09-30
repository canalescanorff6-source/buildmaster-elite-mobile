import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const chrome = read('src/components/CardVisionAppChromeR185.tsx');
const nav = read('src/components/RefinedNavigation.tsx');
const css = read('src/app/v44-buildmaster-reference.css');
const baseline = read('tests/v40-80-r519-core-baseline-r520-reference-ui-regression.mjs');

for (const marker of [
  'bm-r521-splash',
  'bm-r521-topbar',
  'bm-r521-global-notice',
  'bm-r521-action-sheet',
]) assert.ok(chrome.includes(marker), `R521: chrome sem hook semântico ${marker}`);

for (const marker of [
  'bm-r521-sidebar',
  'bm-r521-menu-trigger',
  'bm-r521-drawer-backdrop',
  'bm-r521-drawer',
  'bm-r521-mobile-dock',
]) assert.ok(nav.includes(marker), `R521: navegação sem hook semântico ${marker}`);

for (const selector of [
  '.bm-r521-splash',
  '.bm-r521-topbar',
  '.bm-r521-sidebar',
  '.bm-r521-drawer',
  '.bm-r521-mobile-dock',
  '.bm-r521-global-notice',
  '.bm-r521-action-sheet',
  '.app-route-loading',
  '.panel-loading-fallback',
  '.section-error-fallback',
  '.app-runtime-status',
]) assert.ok(css.includes(selector), `R521: superfície global não coberta no CSS: ${selector}`);

assert.match(css, /env\(safe-area-inset-top\)/, 'R521: topbar/shell deve respeitar safe area superior.');
assert.match(css, /env\(safe-area-inset-bottom\)/, 'R521: dock/action sheet deve respeitar safe area inferior.');
assert.match(css, /backdrop-filter:/, 'R521: overlays premium devem manter separação de profundidade.');
assert.match(css, /aria-current='page'/, 'R521: estado ativo precisa continuar apoiado em semântica aria-current.');
assert.match(css, /prefers-reduced-motion: reduce/, 'R521: shell precisa preservar movimento reduzido.');

for (const forbidden of [
  'createProductionAnalysisR138',
  'trainingOptimizer',
  'engineCertificationR517',
  'realMatchCalibrationEvidenceR518',
]) {
  assert.ok(!chrome.includes(forbidden), `R521: chrome visual não pode importar autoridade funcional: ${forbidden}`);
  assert.ok(!nav.includes(forbidden), `R521: navegação visual não pode importar autoridade funcional: ${forbidden}`);
}

assert.ok(baseline.includes('R519/R520'), 'R521: baseline anterior precisa continuar presente.');
console.log('R521 aprovada: App Shell premium consolidado sem assumir autoridade funcional do core.');
