import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { convergeR192ModuleBudgetR419 } from '../scripts/apply-r419-reader-master-engine-closure.mjs';
import { applyR503SingleReaderFinalization } from '../scripts/apply-r503-single-reader-finalization.mjs';
import { applyR504ProjectedPlayerState } from '../scripts/apply-r504-projected-player-state.mjs';
import { applyR505PostBuildImpeto } from '../scripts/apply-r505-post-build-impeto.mjs';
import { applyR507SingleRecommendationAuthority } from '../scripts/apply-r507-single-recommendation-authority.mjs';
import { applyReviewedR119BaselinesR186R200 } from '../scripts/apply-r406-fix7-r186-r200-reviewed-baselines.mjs';

const read = (p) => fs.readFileSync(p, 'utf8');
const budget = read('src/modules/builds/pointBudget.ts');
const optimizer = read('src/modules/builds/trainingOptimizer.ts');
const domain = read('src/lib/analyzerDomain.ts');
const clean = read('src/lib/cleanSlatePerformance2027V4080R119.ts');
const helperPath='src/modules/analysis/cardEvidenceAuthorityR419.ts';
const helper = fs.existsSync(helperPath) ? read(helperPath) : '';
const truthPath='src/modules/analysis/cardTruthLayerR501.ts';
const truth = fs.existsSync(truthPath) ? read(truthPath) : '';
assert.ok(fs.existsSync(helperPath), 'R419 precisa materializar a autoridade canônica de evidência.');
assert.ok(fs.existsSync(truthPath), 'R501 precisa materializar a autoridade central de confiança/cobertura.');
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
assert.match(optimizer, /confidenceAtLeastR501\(parsed\.confidence, 90\)/,
  'R501: trainingOptimizer precisa usar a autoridade central de confiança após o repair.');
assert.doesNotMatch(optimizer, /Number\(parsed\.confidence\s*\?\?\s*0\)\s*>=\s*0\.9/,
  'R501: escala 0–1 antiga não pode reaparecer no optimizer.');

assert.match(domain, /CardEvidenceStateR419 = 'MISSING' \| 'UNCERTAIN' \| 'CONFLICTING' \| 'TRUSTED'/);
assert.match(domain, /criticalStateR419\?: CardEvidenceStateR419/);
assert.match(domain, /trainingBudgetStateR419\?: CardEvidenceStateR419/);
assert.match(helper, /source === 'FALLBACK'/);
assert.match(helper, /state: 'CONFLICTING'/);
assert.match(helper, /state: 'TRUSTED'/);
assert.match(helper, /applyCriticalEvidenceR419/);
assert.match(helper, /confidenceAtLeastR501\(parsed\.confidence, 78\)/,
  'R501: OCR do R419 precisa usar 78/100 canônico.');
assert.match(helper, /deriveCriticalAttributeEvidenceR501/,
  'R501: cobertura crítica precisa vir da autoridade central.');
assert.match(truth, /normalizeConfidenceR501/);
assert.match(truth, /minimum = parsed\.mainPosition === 'GK' \? 4 : 10/);
assert.match(truth, /deriveCardTruthCertificationR501/,
  'R501: estados final/provisório/bloqueado precisam ter uma autoridade explícita.');
assert.match(truth, /FINAL_CERTIFIED/);
assert.match(truth, /PROVISIONAL_HIGH_CONFIDENCE/);
assert.match(truth, /PROVISIONAL_LOW_CONFIDENCE/);
assert.match(truth, /BLOCKED_INSUFFICIENT_DATA/);

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

const r503 = applyR503SingleReaderFinalization(process.cwd());
if (r503.changed) console.log(`R503 materializou o gate do leitor unitário em ${r503.patched.length} arquivo(s).`);
const r504 = applyR504ProjectedPlayerState(process.cwd());
if (r504.changed) console.log(`R504 materializou o estado pós-build em ${r504.patched.length} arquivo(s).`);
const r505 = applyR505PostBuildImpeto(process.cwd());
if (r505.changed) console.log(`R505 materializou o Ímpeto pós-build em ${r505.patched.length} arquivo(s).`);
const r507 = applyR507SingleRecommendationAuthority(process.cwd());
if (r507.changed) console.log(`R507 materializou a autoridade pública única em ${r507.patched.length} arquivo(s).`);
const r507Baselines = applyReviewedR119BaselinesR186R200(process.cwd());
if (r507Baselines.changed) console.log(`R507 sincronizou baselines R186-R200 com o R119 final (${r507Baselines.sourceSha.slice(0, 12)}).`);

for (const regression of [
  'tests/v40-80-r501-card-truth-layer-regression.ts',
  'tests/v40-80-r501-certification-regression.ts',
  'tests/v40-80-r501-total-reader-finalization-regression.ts',
  'tests/v40-80-r502-structural-card-truth-certification-regression.ts',
  'tests/v40-80-r503-single-reader-certification-gate-regression.ts',
  'tests/v40-80-r504-projected-player-state-regression.ts',
  'tests/v40-80-r505-post-build-impeto-regression.ts',
  'tests/v40-80-r506-post-build-skills-regression.ts',
  'tests/v40-80-r507-single-recommendation-authority-regression.ts',
  'tests/v40-80-r510-gameplay-engine-2-regression.ts',
  'tests/v40-80-r511-possession-action-profile-regression.ts',
  'tests/v40-80-r512-joint-optimizer-v2-regression.ts',
  'tests/v40-80-r513-golden-card-lab-regression.ts',
  'tests/v40-80-r515-ocr-conflict-matrix-regression.ts',
  'tests/v40-80-r516-real-match-calibration-bridge-regression.ts',
  'tests/v40-80-r517-engine-certification-regression.ts',
  'tests/v40-80-r517-production-certificate-regression.ts',
  'tests/v40-80-r517-certification-firewall-regression.ts',
  'tests/v40-80-r518-real-match-calibration-evidence-regression.ts',
  'tests/v40-80-r518-global-readiness-regression.ts',
  'tests/v40-80-r518-determinism-firewall-regression.ts',
  'tests/v40-80-r518-certification-firewall-regression.ts',
  'tests/v40-80-r518-persisted-facade-regression.ts',
]) {
  execFileSync(process.execPath, ['-r', './tests/_ts-require.cjs', regression], { stdio: 'inherit' });
}

console.log('R419/R501/R502/R503/R504/R505/R506/R507/R510/R511/R512/R513/R515/R516/R517/R518/R456 aprovado: orçamento fail-closed, confiança 0–100 centralizada, cobertura/certificação explícitas, leitores fail-closed, estado pós-build centralizado, Ímpeto/Top 5 pós-build, autoridade pública única, Gameplay Engine 2 marginal, Posse central por função, Joint Optimizer V2 shadow, Golden Lab, conflitos OCR, calibração real, Certification Engine e evidência R518 read-only protegidos.');