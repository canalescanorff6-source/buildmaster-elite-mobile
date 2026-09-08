import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const read = (file) => fs.readFileSync(file, 'utf8');
const analyzerPath = 'src/lib/analyzer.ts';
const analyzer = read(analyzerPath);
const pkg = JSON.parse(read('package.json'));
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');
const analyzerBytes = fs.statSync(analyzerPath).size;
const analyzerLines = analyzer.split(/\r?\n/).length;

assert.ok(analyzerBytes <= 108_500, `R196: analyzer voltou a ${analyzerBytes} bytes.`);
assert.ok(analyzerLines <= 1_225, `R196: analyzer voltou a ${analyzerLines} linhas.`);
assert.doesNotMatch(analyzer, /function\s+(?:identityPlanScore|adaptationPlanScore|adaptivePlanScore)\s*\(/, 'R196: scorers antigos não podem voltar a recomputar pesos por candidato.');
assert.match(analyzer, /const individualWeights = individualTrainingAdjustments\(selected, attributes, parsed\);/, 'R196: pesos individuais devem ser compilados uma vez por busca.');
assert.match(analyzer, /const requirementWeights = positionRequirementWeights\(selected, objective, attributes\);/, 'R196: pesos funcionais devem ser compilados uma vez por busca.');
assert.match(analyzer, /const hybridWeights = \{ \.\.\.requirementWeights \};/, 'R196: pesos híbridos devem reutilizar os pesos funcionais compilados.');
assert.match(analyzer, /const hybridScore = \(plan: TrainingPlan\) => scorePlanByWeights\(plan, hybridWeights, budget, saturationBoost\);/, 'R196: scorer híbrido deve reutilizar pesos compilados.');
assert.match(analyzer, /const identityScore = \(plan: TrainingPlan\) => scorePlanByWeights\(plan, identityScoreWeights, budget\);/, 'R196: scorer de identidade deve reutilizar pesos compilados.');
assert.match(analyzer, /const adaptationScore = \(plan: TrainingPlan\) => scorePlanByWeights\(plan, adaptationScoreWeights, budget, saturationBoost\);/, 'R196: scorer de adaptação deve reutilizar pesos compilados.');
assert.doesNotMatch(analyzer, /new Set<string>\(OFFICIAL_ADDITIONAL_SKILL_NAMES\)/, 'R196: catálogo oficial não pode voltar a alocar Set por análise.');
assert.doesNotMatch(analyzer, /new Set\(IDENTITY_CORE_GROUPS\[position\]\)/, 'R196: grupos de identidade não podem voltar a alocar Set por chamada.');

function walk(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (/\.(?:ts|tsx)$/.test(target)) files.push(target);
    }
  }
  return files;
}
const sourceBytes = walk('src').reduce((sum, file) => sum + fs.statSync(file).size, 0);
const r200Boundary = fs.existsSync('src/modules/vault/cardHistoryStartupModelR200.ts');
const r2004Boundary = fs.existsSync('R200_4_HISTORICAL_REQUIREMENTS_CONVERGENCE.md');
assert.ok(sourceBytes <= (r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_335_700), `R196: redução líquida perdida; src voltou a ${sourceBytes} bytes.`);
assert.equal(
  crypto.createHash('sha256').update(r119).digest('hex'),
  '736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5',
  'R196: R119 não pode mudar durante otimização do hot path.',
);
const v4080 = String(pkg.scripts?.['test:v4080'] ?? '');
assert.ok(/npm run test:r195 && npm run test:r196(?: && npm run test:r197)?(?: && npm run test:r198)?(?: && npm run test:r199)?(?: && npm run test:r200)?$/.test(v4080), 'R196: cadeia v40.80 deve preservar R195 -> R196 antes dos gates seguintes.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R196: test:all deve continuar fechando pela bateria v40.80.');

console.log(`R196 aprovada: analyzer=${analyzerLines} linhas/${analyzerBytes} B; src=${sourceBytes} B; scorers compilados por busca e R119 intacto.`);
