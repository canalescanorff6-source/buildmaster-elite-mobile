import assert from 'node:assert/strict';
import fs from 'node:fs';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { TRAINING_LABELS } from '../src/lib/trainingEngine';
import {
  BUILD_SIMULATOR_R483_VERSION,
  buildBuildSimulatorR483
} from '../src/modules/build-simulator/buildSimulatorEngineR483';

const training = {
  shooting: 4,
  passing: 4,
  dribbling: 4,
  dexterity: 4,
  lowerBodyStrength: 4,
  aerialStrength: 0,
  defending: 0,
  gk1: 0,
  gk2: 0,
  gk3: 0
};

const officialPointsUsed = trainingPlanTotalCost(training);

const result = {
  parsed: {
    internalId: 'r483-fixture-card',
    mainPosition: 'CF',
    positions: ['CF'],
    attributes: {},
    nativeSkills: [],
    specialSkills: [],
    additionalSkills: [],
    positionRatings: {},
    positionProficiencies: {},
    impetos: [],
    condition: {},
    physicalProfile: {},
    evidence: {},
    warnings: []
  },
  training,
  trainingPointsUsed: officialPointsUsed,
  trainingPointsTotal: officialPointsUsed + 4,
  trainingPointsRemaining: 4,
  validation: { level: 'safe', confirmed: true, canGenerate: true, issues: [] },
  teamMap: { functionLabel: 'CA finalizador' },
  tacticalProfile: { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' },
  objective: 'COMPETITIVE'
} as any;

const input = { result, targetPosition: 'CF' as const };
const before = JSON.stringify(input);
const snapshot = buildBuildSimulatorR483(input);

assert.equal(snapshot.version, BUILD_SIMULATOR_R483_VERSION);
assert.equal(snapshot.variants[0]?.id, 'official');
assert.deepEqual(snapshot.variants[0]?.plan, result.training);
assert.equal(snapshot.variants[0]?.pointsUsed, result.trainingPointsUsed);
assert.equal(snapshot.baselineFingerprint, result.parsed.internalId);
assert.equal(snapshot.budget, result.trainingPointsTotal);
assert.equal(snapshot.officialPointsUsed, result.trainingPointsUsed);
assert.equal(snapshot.blockedReason, null);
assert.equal(snapshot.authority.readOnly, true);
assert.equal(snapshot.authority.canWriteTraining, false);
assert.equal(snapshot.authority.canWriteSkills, false);
assert.equal(snapshot.authority.canWriteImpetus, false);
assert.equal(snapshot.authority.canChangePosition, false);
assert.equal(snapshot.authority.canOverrideCleanSlate, false);
assert.equal(snapshot.authority.canOverrideR126, false);
assert.equal(snapshot.authority.canOverrideR128, false);
assert.equal(snapshot.authority.optimizeOverall, false);
assert.equal(JSON.stringify(input), before, 'R483 não pode mutar AnalysisResult nem o input.');

const zeroBudgetResult = { ...result, trainingPointsTotal: 0 } as any;
const blocked = buildBuildSimulatorR483({ ...input, result: zeroBudgetResult });
assert.match(blocked.blockedReason ?? '', /orçamento real/i);
assert.equal(blocked.variants.length, 0);
assert.equal(blocked.budget, 0);
assert.doesNotMatch(JSON.stringify(blocked), /"budget":64/);
assert.ok(blocked.variants.every((variant: any) => variant.pointsUsed !== 64));

const inconsistentCostResult = { ...result, trainingPointsUsed: officialPointsUsed + 1 } as any;
const inconsistent = buildBuildSimulatorR483({ ...input, result: inconsistentCostResult });
assert.match(inconsistent.blockedReason ?? '', /inconsistência de orçamento/i);
assert.equal(inconsistent.variants.length, 0);

const overBudgetResult = { ...result, trainingPointsTotal: officialPointsUsed - 1 } as any;
const overBudget = buildBuildSimulatorR483({ ...input, result: overBudgetResult });
assert.match(overBudget.blockedReason ?? '', /inconsistência de orçamento/i);
assert.equal(overBudget.variants.length, 0);

const first = buildBuildSimulatorR483(input);
const second = buildBuildSimulatorR483(input);
assert.deepEqual(first, second, 'Mesma entrada deve produzir a mesma ordem, planos e scores.');
assert.deepEqual(first.variants.map((variant) => variant.id), ['official', 'balanced', 'specialist', 'gameplay']);
for (const variant of first.variants) {
  assert.equal(trainingPlanTotalCost(variant.plan), result.trainingPointsUsed, `${variant.id} precisa manter o custo oficial exato.`);
  assert.equal(variant.pointsUsed, result.trainingPointsUsed, `${variant.id} precisa declarar o custo oficial exato.`);
  assert.equal(variant.pointsAvailable, result.trainingPointsTotal - result.trainingPointsUsed);
  assert.ok(variant.pointsUsed <= result.trainingPointsTotal);
}
assert.ok(first.variants.slice(1).every((variant) => JSON.stringify(variant.plan) !== JSON.stringify(result.training)),
  'Variantes alternativas precisam redistribuir PP de verdade.');

const insufficientFunctionResult = {
  ...result,
  validation: { ...result.validation, level: 'blocked', canGenerate: false },
  teamMap: { ...result.teamMap, functionLabel: '' }
} as any;
const insufficient = buildBuildSimulatorR483({ ...input, result: insufficientFunctionResult });
assert.deepEqual(insufficient.variants.map((variant) => variant.id), ['official', 'balanced']);
assert.ok(!insufficient.variants.some((variant) => variant.id === 'specialist' || variant.id === 'gameplay'));

for (const variant of first.variants.slice(1)) {
  assert.equal(trainingPlanTotalCost(variant.plan), officialPointsUsed,
    'Transferência cujo custo escalonado não fecha exatamente deve ser descartada antes de virar variante.');
  assert.ok(variant.deltas.some((delta) => delta.delta > 0), `${variant.id} precisa declarar ganho real.`);
  assert.ok(variant.deltas.some((delta) => delta.delta < 0), `${variant.id} precisa declarar sacrifício real.`);
  assert.ok(variant.strengths.length > 0);
  assert.ok(variant.sacrifices.length > 0);
  assert.ok(variant.explanation.length > 0);

  const positive = variant.deltas.find((delta) => delta.delta > 0)!;
  const negative = variant.deltas.find((delta) => delta.delta < 0)!;
  const positiveLabel = TRAINING_LABELS[positive.key];
  const negativeLabel = TRAINING_LABELS[negative.key];
  const strengthText = variant.strengths.join(' ');
  const sacrificeText = variant.sacrifices.join(' ');

  assert.match(strengthText, new RegExp(positiveLabel, 'i'), `${variant.id} deve explicar o grupo que recebeu PP.`);
  assert.match(sacrificeText, new RegExp(negativeLabel, 'i'), `${variant.id} deve explicar o grupo que cedeu PP.`);
  assert.ok(variant.explanation.includes(`${positive.delta > 0 ? '+' : ''}${positive.delta} ${positiveLabel}`),
    `${variant.id} deve citar o delta positivo real na explicação.`);
  assert.ok(variant.explanation.includes(`${negative.delta} ${negativeLabel}`),
    `${variant.id} deve citar o delta negativo real na explicação.`);
}

const engineSource = fs.readFileSync('src/modules/build-simulator/buildSimulatorEngineR483.ts', 'utf8');
assert.doesNotMatch(engineSource, /parsed\.(?:overall|maxOverall)\b/, 'R483 não pode ler Overall da carta.');
assert.doesNotMatch(engineSource, /pri\s*\.\s*GER\b/, 'R483 não pode usar GER no score.');
assert.doesNotMatch(engineSource, /recommendedSkills\s*=/, 'R483 não pode escrever Top 5.');
assert.doesNotMatch(engineSource, /recommendedImpetos\s*=/, 'R483 não pode escrever Ímpeto.');
assert.doesNotMatch(engineSource, /from\s+['"][^'"]*(?:vault|persistence|storage)[^'"]*['"]/, 'R483 não pode importar writers persistentes.');
assert.doesNotMatch(engineSource, /\b(?:fetch|supabase)\s*\(/i, 'R483 deve funcionar local/offline na v1.');

const panelPath = 'src/modules/build-simulator/BuildSimulatorPanelR483.tsx';
assert.ok(fs.existsSync(panelPath), 'R483 Task 4: o painel read-only precisa existir.');
const panelSource = fs.readFileSync(panelPath, 'utf8');
const advancedWorkspaceSource = fs.readFileSync('src/components/result/ResultAdvancedWorkspaceR192.tsx', 'utf8');
assert.match(advancedWorkspaceSource, /BuildSimulatorPanelR483/);
assert.match(panelSource, /Simulador de ficha — R483/);
assert.match(panelSource, /Somente simulação — não altera sua ficha/);
assert.match(panelSource, /Ficha oficial/);
assert.match(panelSource, /Simulador temporariamente indisponível\. Sua ficha oficial continua intacta\./);
assert.match(panelSource, /export function BuildSimulatorPanelR483\(\{ result \}: \{ result: AnalysisResult \}\)/);
assert.doesNotMatch(panelSource, />\s*Aplicar\s*</i);
assert.doesNotMatch(panelSource, /Salvar como oficial/i);
assert.doesNotMatch(panelSource, /Substituir ficha/i);
assert.doesNotMatch(panelSource, /onSave|onApply|setResult/);

console.log('R483 Task 4 aprovada: painel read-only integrado ao Comparar sem controles de escrita.');
