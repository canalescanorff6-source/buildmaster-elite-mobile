import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const css = read('src/app/v44-buildmaster-reference.css');

for (const marker of [
  'bm-r522-home',
  'bm-r522-home-header',
  'bm-r522-command-deck',
  'bm-r522-spotlight',
  'bm-r522-metrics',
  'bm-r522-workspace',
  'bm-r522-dashboard-grid',
]) assert.ok(home.includes(marker), `R522: Home sem hook ${marker}`);

for (const selector of [
  '.bm-r522-home',
  '.bm-r522-home-header',
  '.bm-r522-command-deck',
  '.bm-r522-spotlight',
  '.bm-r522-metrics',
  '.bm-r522-workspace',
  '.bm-r522-dashboard-grid',
]) assert.ok(css.includes(selector), `R522: referência visual não cobre ${selector}`);

assert.match(css, /grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/, 'R522: ações mobile precisam preservar grade compacta de duas colunas.');
assert.match(css, /@media \(max-width: 760px\)/, 'R522: Home precisa ter tratamento mobile-first.');
assert.match(css, /prefers-reduced-motion: reduce/, 'R522: Home deve herdar movimento reduzido.');

for (const forbidden of [
  'createProductionAnalysisR138',
  'trainingOptimizer',
  'engineCertificationR517',
]) assert.ok(!home.includes(forbidden), `R522: Home visual não pode assumir autoridade funcional ${forbidden}`);

console.log('R522 aprovada: Home/Dashboard premium consolidado com dados reais e core preservado.');
