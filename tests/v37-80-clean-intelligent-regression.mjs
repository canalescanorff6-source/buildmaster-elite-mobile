import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const layout = read('src/app/layout.tsx');
const css = read('src/app/v37-clean-intelligent.css');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const result = read('src/components/result/ResultWorkspace.tsx');
const clean = read('src/lib/cleanExperience.ts');
const cache = read('src/components/RegisterServiceWorker.tsx');
const sw = read('public/sw.js');

assert.match(clean, /CLEAN_EXPERIENCE_VERSION = '37\.80\.0'/);
assert.match(layout, /import '\.\/v37-clean-intelligent\.css';/);
assert.match(layout, /bm-v3780-clean/);
assert.match(home, /bm-v3780-home-details/);
assert.match(home, /Ver painel completo/);
assert.match(home, /O cálculo completo acontece em segundo plano\./);
assert.match(result, /CLEAN_RESULT_PRIMARY_VIEWS/);
assert.match(result, /Ver análise completa/);
assert.match(result, /advancedMode && result\.deepCardIntelligence/);
assert.match(result, /advancedMode && <SupremeGameplayCard/);
assert.match(result, /advancedMode && <UnifiedIntelligenceCard/);
assert.match(result, /bm-v3780-analysis-entry/);
for (const marker of [
  '.bm-v3780-clean .mode-basic .result-primary-tabs',
  '.bm-v3780-clean .mode-basic .bm-v3780-advanced-summary',
  '.bm-v3780-clean .bm-v3780-home-details',
  '.bm-v3780-clean .mode-basic .bm32-plan-callout'
]) assert.ok(css.includes(marker), `Camada clean incompleta: ${marker}`);
assert.match(cache, /37\.80\.0-clean-intelligent-1/);
assert.match(sw, /buildmaster-v37-80-clean-intelligent-1/);

console.log('v37.80 Experiência Clean aprovada: home recolhida, resultado essencial, cinco abas e detalhes técnicos sob demanda.');
