import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const layout = read('src/app/layout.tsx');
const css = read('src/app/v43-reader-result-premium.css');
const reader = read('src/components/TotalCardReaderPanel.tsx');
const result = read('src/components/result/ResultWorkspace.tsx');
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');

assert.match(layout, /import '\.\/v43-reader-result-premium\.css';/);
assert.ok(layout.indexOf("import './v43-reader-result-premium.css';") > layout.indexOf("import './v42-home-premium.css';"), 'R203 precisa ser a última camada visual do fluxo principal.');

for (const marker of [
  '.total-reader-shell',
  '.total-reader-progress',
  '.total-capture-grid',
  '.total-reader-footer',
  '.bm2820-result-screen .result-player-hero',
  '.result-hero-actions .result-action-primary',
  '.result-navigation-shell',
  '.unified-performance-v3920',
  '.r121-readiness-panel',
  '.r119-final-build',
  '.r119-resources-card',
  '.r121-skill-workflow',
  '.r119-impeto-card',
  '.premium-app.theme-light',
  '@media (max-width:760px)',
  '@media (prefers-reduced-motion: reduce)'
]) assert.ok(css.includes(marker), `R203: contrato visual ausente: ${marker}`);

assert.match(css, /:focus-visible/);
assert.match(reader, /TOTAL_CAPTURE_SLOTS/);
assert.match(reader, /requiredReady/);
assert.match(result, /UnifiedPerformanceV3920Panel/);
assert.match(result, /analysisUsagePositionR138/);
assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '299db08a35e14c8ba7dea325b9fc8722480309c3417f915058243b8a3b50e312',
  'R203 não pode modificar a autoridade Clean Slate R119.'
);

console.log('R203 aprovada: Leitor e Resultado premium unificados, hierarquia operacional mobile e autoridade R119 preservada.');
