import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const result = read('src/components/result/ResultWorkspace.tsx');
const unified = read('src/components/UnifiedPerformanceV3920Panel.tsx');
const css = read('src/app/v44-buildmaster-reference.css');

for (const marker of [
  'bm-r524-result',
  'bm-r524-result-hero',
  'bm-r524-result-metrics',
  'bm-r524-budget',
  'bm-r524-actions',
  'bm-r524-alerts',
  'bm-r524-navigation',
]) assert.ok(result.includes(marker), `R524: Resultado sem hook ${marker}`);

for (const selector of [
  '.bm-r524-result',
  '.bm-r524-result-hero',
  '.bm-r524-result-metrics',
  '.bm-r524-budget',
  '.bm-r524-actions',
  '.bm-r524-alerts',
  '.bm-r524-navigation',
  '.r119-final-build',
  '.r119-resources-card',
  '.r121-readiness-panel',
  '.r119-impeto-card',
]) assert.ok(css.includes(selector), `R524: CSS não cobre ${selector}`);

assert.match(result, /result\.validation\.canGenerate \? 'Salvar ficha' : 'Salvar para revisar'/,
  'R524: CTA precisa continuar refletindo honestamente o estado de validação.');
assert.match(result, /result\.validation\?\.level === 'blocked'/,
  'R524: confiança bloqueada deve continuar visível.');
assert.match(unified, /r119-final-build/, 'R524: ficha final canônica deve continuar sendo consumida pela UI.');
assert.match(unified, /r119-impeto-card/, 'R524: Ímpeto canônico deve continuar no painel unificado.');

for (const forbidden of ['applyCleanSlatePerformance2027R119','trainingOptimizer','engineCertificationR517']) {
  assert.ok(!result.includes(`import { ${forbidden}`), `R524: ResultWorkspace não deve criar nova autoridade ${forbidden}`);
}

console.log('R524 aprovada: Resultado/Ficha premium reforça PP, confiança e autoridade canônica sem criar segundo writer.');
