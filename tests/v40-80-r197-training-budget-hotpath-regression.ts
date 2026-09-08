import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { TrainingKey, TrainingPlan } from '../src/lib/analyzerDomain';
import { TRAINING_KEYS, trainingLevelCost, trainingPlanTotalCost, trainingTotalCost } from '../src/lib/trainingPlanCore';
import { fitTrainingToBudget, normalizeTrainingBudget } from '../src/modules/builds/trainingOptimizer';

function legacyTrainingTotalCost(level: number): number {
  let cost = 0;
  for (let current = 1; current <= Math.max(0, level); current += 1) cost += Math.ceil(current / 4);
  return cost;
}
function legacyTrainingPlanTotalCost(plan: TrainingPlan): number {
  return TRAINING_KEYS.reduce((sum, key) => sum + legacyTrainingTotalCost(plan[key] ?? 0), 0);
}
function legacyFitTrainingToBudget(target: TrainingPlan, priority: TrainingKey[], budget: number): TrainingPlan {
  const normalizedBudget = normalizeTrainingBudget(budget);
  const plan = { ...target };
  const cleanPriority = priority.length ? priority : TRAINING_KEYS;
  let guard = 0;
  while (legacyTrainingPlanTotalCost(plan) > normalizedBudget && guard < 500) {
    guard += 1;
    const removable = [...cleanPriority].reverse().find((key) => (plan[key] ?? 0) > 0) ?? TRAINING_KEYS.find((key) => (plan[key] ?? 0) > 0);
    if (!removable) break;
    plan[removable] = Math.max(0, (plan[removable] ?? 0) - 1);
  }
  guard = 0;
  while (guard < 500) {
    guard += 1;
    const current = legacyTrainingPlanTotalCost(plan);
    if (current >= normalizedBudget) break;
    let added = false;
    for (const key of cleanPriority) {
      const nextLevel = (plan[key] ?? 0) + 1;
      const nextCost = Math.ceil(nextLevel / 4);
      if (current + nextCost <= normalizedBudget && nextLevel <= 16) {
        plan[key] = nextLevel;
        added = true;
        break;
      }
    }
    if (!added) break;
  }
  return plan;
}

for (let level = -4; level <= 32; level += 1) {
  assert.equal(trainingTotalCost(level), legacyTrainingTotalCost(level), `R197: custo acumulado divergiu no nível ${level}.`);
}

let seed = 0x1974080;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
};
for (let caseIndex = 0; caseIndex < 500; caseIndex += 1) {
  const plan = Object.fromEntries(TRAINING_KEYS.map((key) => [key, Math.floor(rand() * 17)])) as TrainingPlan;
  const priority = [...TRAINING_KEYS].sort(() => rand() - 0.5).slice(0, 3 + Math.floor(rand() * 8));
  const budget = Math.floor(rand() * 81);
  assert.equal(trainingPlanTotalCost(plan), legacyTrainingPlanTotalCost(plan), `R197: custo total divergiu no caso ${caseIndex}.`);
  assert.deepEqual(fitTrainingToBudget(plan, priority, budget), legacyFitTrainingToBudget(plan, priority, budget), `R197: ajuste de orçamento divergiu no caso ${caseIndex}.`);
}

const optimizerSource = fs.readFileSync('src/modules/builds/trainingOptimizer.ts', 'utf8');
const coreSource = fs.readFileSync('src/lib/trainingPlanCore.ts', 'utf8');
assert.match(optimizerSource, /let currentCost = trainingPlanTotalCost\(plan\);/, 'R197: custo corrente deve ser calculado uma vez antes do ajuste.');
assert.match(optimizerSource, /currentCost -= trainingLevelCost\(plan\[removable\] \?\? 0\);/, 'R197: remoção deve atualizar custo incrementalmente.');
assert.match(optimizerSource, /currentCost \+= nextCost;/, 'R197: adição deve atualizar custo incrementalmente.');
assert.doesNotMatch(optimizerSource, /while \(trainingPlanTotalCost\(plan\) > budget/, 'R197: loop de remoção não pode voltar a recalcular o plano inteiro.');
assert.match(coreSource, /\(groups \+ 1\) \* \(2 \* groups \+ n % 4\)/, 'R197: custo por grupo deve usar fórmula fechada O(1).');

function walk(root: string) {
  const files: string[] = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop()!;
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
assert.ok(sourceBytes <= (r2004Boundary ? 5_360_000 : r200Boundary ? 5_341_000 : 5_335_500), `R197: redução líquida perdida; src voltou a ${sourceBytes} bytes.`);
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');
assert.equal(crypto.createHash('sha256').update(r119).digest('hex'), '736e631a4aa930bfadf07c81c3330132459ddbaf613531cd4cfc610eacaa1fb5', 'R197: R119 não pode mudar.');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const v4080 = String(pkg.scripts?.['test:v4080'] ?? '');
assert.ok(v4080.endsWith('npm run test:r196 && npm run test:r197') || v4080.endsWith('npm run test:r196 && npm run test:r197 && npm run test:r198') || v4080.endsWith('npm run test:r196 && npm run test:r197 && npm run test:r198 && npm run test:r199') || v4080.endsWith('npm run test:r196 && npm run test:r197 && npm run test:r198 && npm run test:r199 && npm run test:r200'), 'R197: cadeia v40.80 deve preservar R196 -> R197 antes do gate seguinte.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R197: test:all deve continuar fechando pela bateria v40.80.');

console.log(`R197 aprovada: 500 planos equivalentes ao algoritmo legado; src=${sourceBytes} B; hot path de orçamento incremental e R119 intacto.`);
