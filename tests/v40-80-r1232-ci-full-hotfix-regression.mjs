import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const budget=read('scripts/check-bundle-budget.mjs');
const season=read('src/lib/efootballSeasonCatalogV4070.ts');
const v3182=read('tests/v31-82-ci-protection-regression.mjs');
const v3834=read('tests/v38-34-ci-complete-hotfix-regression.mjs');
const v4070=read('tests/v40-70-live-catalog-zero-confirmation-regression.mjs');

assert.match(budget,/sourceTs:\s*5\.25\s*\*\s*1024\s*\*\s*1024/,'orçamento deve permanecer explícito em MiB');
assert.ok(v3182.includes('const sourceBudgetMatch = budget.match(/sourceTs:'),'regressão v31.82 continua auditando orçamento explícito');
assert.match(v3834,/sourceBudgetMatch/,'regressão v38.34 continua protegendo orçamento');
assert.match(season,/title:\s*'Sobreposição'/,'catálogo PT-BR deve usar o nome oficial Sobreposição');
assert.doesNotMatch(season,/title:\s*'Todos por Um'/,'catálogo PT-BR não deve trocar para a tradução pt-PT');
assert.match(v4070,/catálogo v6 PT-BR/,'regressão v40.70 deve declarar explicitamente o locale PT-BR');
console.log('r123.2 aprovada: CI com orçamento explícito e catálogo v6.0 PT-BR alinhado à nomenclatura oficial.');
