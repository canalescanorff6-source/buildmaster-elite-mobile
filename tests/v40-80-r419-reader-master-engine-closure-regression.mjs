import assert from 'node:assert/strict';
import fs from 'node:fs';
import { convergeR192ModuleBudgetR419 } from '../scripts/apply-r419-reader-master-engine-closure.mjs';

const read = (p) => fs.readFileSync(p, 'utf8');
const budget = read('src/modules/builds/pointBudget.ts');
const optimizer = read('src/modules/builds/trainingOptimizer.ts');
const domain = read('src/lib/analyzerDomain.ts');
const clean = read('src/lib/cleanSlatePerformance2027V4080R119.ts');
const helperPath='src/modules/analysis/cardEvidenceAuthorityR419.ts';
const helper = fs.existsSync(helperPath) ? read(helperPath) : '';
assert.ok(fs.existsSync(helperPath), 'R419 precisa materializar a autoridade canônica de evidência.');
const r417 = read('scripts/apply-r417-autonomous-card-vault.mjs');
const r192Closure = read('scripts/check-result-workspace-static-closure-r192.mjs');

const repair = read('scripts/repair-critical-routes.mjs');
const typecheck = read('scripts/check-source-types-r151.mjs');
assert.match(repair, /applyR419ReaderMasterEngineClosure/);
assert.match(typecheck, /applyR419ReaderMasterEngineClosure/);
assert.match(typecheck, /v40-80-r419-reader-master-engine-closure-regression\.mjs/);

assert.doesNotMatch(budget, /return\s+SAFE_PLAYER_TRAINING_BUDGET\s*;/, 'R419 não pode fabricar 64 PP.');
assert.match(budget, /MIN_PLAYER_TRAINING_BUDGET = 1;/, 'Orçamentos positivos pequenos não podem ser descartados por um piso artificial de 20.');
assert.match(budget, /return 0;/, 'Orçamento inválido deve permanecer bloqueado/0.');
assert.doesNotMatch(optimizer, /return\s+SAFE_DEFAULT_TRAINING_BUDGET\s*;/, 'trainingOptimizer não pode fabricar fallback 64.');
assert.match(optimizer, /trainingPointsTotal é a autoridade primária/);
assert.match(optimizer, /orçamento ausente permanece 0/);

assert.match(domain, /CardEvidenceStateR419 = 'MISSING' \| 'UNCERTAIN' \| 'CONFLICTING' \| 'TRUSTED'/);
assert.match(domain, /criticalStateR419\?: CardEvidenceStateR419/);
assert.match(domain, /trainingBudgetStateR419\?: CardEvidenceStateR419/);
assert.match(helper, /source === 'FALLBACK'/);
assert.match(helper, /state: 'CONFLICTING'/);
assert.match(helper, /state: 'TRUSTED'/);
assert.match(helper, /applyCriticalEvidenceR419/);

assert.match(clean, /applyCriticalEvidenceR419/);
assert.match(clean, /budgetEvidenceStateR419!==['"]TRUSTED['"]/);
assert.match(clean, /status:'BLOCKED_INSUFFICIENT_DATA'/);
assert.match(clean, /ignoresOverall:true/);
assert.match(clean, /ownedSkillDuplicatesBlocked/);
assert.match(clean, /existingImpetoNeverRepeated/);
assert.match(clean, /OFFICIAL_ADDITIONAL_SKILL_NAMES/);
assert.match(clean, /expected=Math\.min\(5,available\)/);

assert.match(r417, /applyAutonomousRoleSeedR417/);
assert.match(r417, /topPositions:top\.map/);
assert.match(r417, /assert\.deepEqual\(cb\.training, dmf\.training/);
assert.match(r417, /assert\.deepEqual\(cb\.recommendedSkills, dmf\.recommendedSkills/);
assert.match(r417, /assert\.deepEqual\(cb\.recommendedImpetos, dmf\.recommendedImpetos/);
assert.match(r417, /MAX_MODULES_R192 = 125;[\s\S]{0,120}MAX_MODULES_R192 = 127;/,
  'R433: R417 deve continuar contabilizando apenas os dois módulos R416/R417.');

assert.match(r192Closure, /const MAX_MODULES_R192 = 129;/,
  'R456: R192 mantém teto fail-closed de até 129 módulos após scouting contextual.');
assert.match(r192Closure, /const MAX_SOURCE_BYTES_R192 = 2_185_000;/,
  'R456: closure R192 deve reservar somente 25 KB adicionais para o scouting contextual.');
for (const value of [125, 127, 128, 129]) {
  const input = `const MAX_MODULES_R192 = ${value};\nconst MAX_SOURCE_BYTES_R192 = 2_185_000;`;
  const output = convergeR192ModuleBudgetR419(input);
  assert.match(output, /const MAX_MODULES_R192 = 129;/);
  assert.match(output, /const MAX_SOURCE_BYTES_R192 = 2_185_000;/,
    'R456: correção do contador não pode alterar o orçamento por bytes.');
}
assert.throws(
  () => convergeR192ModuleBudgetR419('const MAX_MODULES_R192 = 130;'),
  /contrato de módulos R192 inesperado/,
  'R456: contador desconhecido deve falhar fechado em vez de ampliar o teto silenciosamente.',
);

console.log('R419/R456 aprovado: orçamento fail-closed, evidência crítica explícita e teto R192 de até 129 módulos.');
