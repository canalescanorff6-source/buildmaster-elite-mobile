import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const layout = read('src/app/layout.tsx');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const css = read('src/app/v42-home-premium.css');

assert.match(layout, /import '\.\/v42-home-premium\.css';/);
assert.ok(layout.indexOf("import './v42-home-premium.css';") > layout.indexOf("import './v41-premium-product.css';"), 'R202 precisa ser carregada depois da fundação visual R201.');
assert.match(home, /<details className="bm-v3780-home-details" open>/, 'R202: painel completo da Central deve iniciar aberto e continuar recolhível.');

for (const marker of [
  '.premium-app.section-inicio .bm-v36-home-header',
  '.premium-app.section-inicio .bm-v36-command-deck',
  '.premium-app.section-inicio .bm-v36-spotlight-card',
  '.premium-app.section-inicio .bm-v36-metrics',
  '.premium-app.section-inicio .bm-v36-feature-grid',
  '.premium-app.section-inicio .bm-v36-dashboard-grid',
  '.premium-app.theme-light.section-inicio',
  '@media (max-width: 760px)',
  '@media (prefers-reduced-motion: reduce)'
]) assert.ok(css.includes(marker), `R202: contrato visual ausente: ${marker}`);

assert.match(css, /:focus-visible/);
assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'R202: Central mobile deve preservar grade de duas colunas para ações rápidas.');
assert.doesNotMatch(home, /cleanSlatePerformance2027V4080R119|createProductionAnalysis|rebuildProductionAnalysis/, 'R202: Central visual não pode virar autoridade de análise.');

console.log('R202 aprovada: Central premium editorial, painel completo visível, hierarquia responsiva e motor preservado.');
