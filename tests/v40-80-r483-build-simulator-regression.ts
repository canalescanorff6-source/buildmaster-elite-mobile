import assert from 'node:assert/strict';
import type { AnalysisResult, TrainingPlan } from '../src/lib/analyzer';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { buildBuildSimulatorR483 } from '../src/modules/build-simulator/buildSimulatorEngineR483';

const officialTraining: TrainingPlan = {
  shooting: 8,
  passing: 8,
  dribbling: 8,
  dexterity: 8,
  lowerBodyStrength: 8,
  aerialStrength: 4,
  defending: 4,
  gk1: 0,
  gk2: 0,
  gk3: 0,
};

const officialPoints = trainingPlanTotalCost(officialTraining);

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    parsed: {
      playerName: 'R483 Test Player',
      cardType: 'Test',
      mainPosition: 'AMF',
      mainPositionPt: 'MAT',
      positions: ['AMF', 'CMF'],
      positionsPt: ['MAT', 'MLG'],
      positionRatings: { AMF: 90, CMF: 88 },
      condition: {},
      impetos: [],
      nativeSkills: [],
      specialSkills: [],
      attributes: {},
      physicalProfile: {},
      manualConfirmed: true,
      evidence: {
        positionLocked: true,
        playstyleLocked: true,
        attributeCount: 0,
        positionRatingsCount: 2,
      },
      internalId: 'r483-fixture-card',
      confidence: 100,
      warnings: [],
    },
    bestPosition: { code: 'AMF', label: 'MAT', score: 90 },
    positionScores: [],
    pri: {},
    tacticalFit: {},
    training: officialTraining,
    trainingCost: officialTraining,
    trainingPointsUsed: officialPoints,
    trainingPointsTotal: officialPoints,
    trainingPointsRemaining: 0,
    trainingCostRule: 'canonical',
    trainingComparison: [],
    buildVariants: [],
    recommendationExplanation: [],
    tacticalProfile: { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' },
    teamMap: {
      functionLabel: 'Armador central',
      tacticalIdentity: 'criador',
      defensiveJob: '',
      buildupJob: '',
      attackingJob: '',
      pressingJob: '',
      idealPartners: [],
      riskAlerts: [],
      matchPlan: [],
      sectorScores: {
        marcacao: 0,
        cobertura: 0,
        saidaDeBola: 0,
        passe: 0,
        criacao: 0,
        aceleracao: 0,
        finalizacao: 0,
        jogoAereo: 0,
        fisico: 0,
      },
      coachFit: '',
    },
    profileTips: [],
    validation: { level: 'safe', confirmed: true, canGenerate: true, issues: [] },
    permittedPositions: [],
    avoidPositions: [],
    recommendedSkills: [],
    recommendedImpetos: [],
    buildName: 'Armador central',
    usageTips: [],
    deepAnalysis: {
      confidenceLevel: 'alta',
      originalIdentity: 'fixture',
      recommendedFunction: 'Armador central',
      readingItems: [],
      uncertainFields: [],
      safeguards: [],
      pointRationale: [],
    },
    ...overrides,
  } as unknown as AnalysisResult;
}

const result = makeResult();
const input = { result, targetPosition: 'AMF' as const };
const before = JSON.stringify(input);
const snapshot = buildBuildSimulatorR483(input);

assert.equal(snapshot.variants[0]?.id, 'official');
assert.deepEqual(snapshot.variants[0]?.plan, result.training);
assert.equal(snapshot.variants[0]?.pointsUsed, result.trainingPointsUsed);
assert.equal(snapshot.baselineFingerprint, result.parsed.internalId);
assert.equal(snapshot.authority.readOnly, true);
assert.equal(snapshot.authority.canOverrideR128, false);
assert.equal(snapshot.authority.optimizeOverall, false);
assert.equal(JSON.stringify(input), before, 'R483 não pode mutar o AnalysisResult de entrada');

const zeroBudgetResult = makeResult({ trainingPointsTotal: 0, trainingPointsUsed: 0 });
const blocked = buildBuildSimulatorR483({ result: zeroBudgetResult, targetPosition: 'AMF' });
assert.match(blocked.blockedReason ?? '', /orçamento real/i);
assert.equal(blocked.variants.length, 0);
assert.equal(blocked.budget, 0);
assert.notEqual(blocked.budget, 64, 'R483 jamais pode fabricar fallback de 64 PP');

const inconsistentCostResult = makeResult({ trainingPointsUsed: officialPoints - 1 });
const inconsistent = buildBuildSimulatorR483({ result: inconsistentCostResult, targetPosition: 'AMF' });
assert.match(inconsistent.blockedReason ?? '', /inconsistência de orçamento/i);
assert.equal(inconsistent.variants.length, 0);

const first = buildBuildSimulatorR483(input);
const second = buildBuildSimulatorR483(input);
assert.deepEqual(first, second, 'R483 precisa ser determinístico para a mesma ficha/contexto');
assert.deepEqual(
  first.variants.map((variant) => variant.id),
  ['official', 'balanced', 'specialist', 'gameplay'],
  'R483 deve expor Oficial, Equilibrada, Especialista e Gameplay quando a função estiver válida',
);
for (const variant of first.variants) {
  assert.equal(trainingPlanTotalCost(variant.plan), result.trainingPointsUsed, `${variant.id} precisa manter PP exato`);
  assert.equal(variant.pointsUsed, result.trainingPointsUsed, `${variant.id} reporta PP diferente da ficha oficial`);
  assert.ok(variant.pointsUsed <= result.trainingPointsTotal, `${variant.id} ultrapassou orçamento`);
}
assert.ok(first.variants.slice(1).every((variant) => JSON.stringify(variant.plan) !== JSON.stringify(result.training)), 'Alternativas não podem ser clones da Oficial');

const blockedFunctionResult = makeResult({
  validation: { level: 'blocked', confirmed: false, canGenerate: false, issues: [] },
});
const blockedFunction = buildBuildSimulatorR483({ result: blockedFunctionResult, targetPosition: 'AMF' });
assert.equal(blockedFunction.variants.some((variant) => variant.id === 'specialist'), false, 'Função bloqueada não pode inventar Especialista');
assert.equal(blockedFunction.variants.some((variant) => variant.id === 'gameplay'), false, 'Função bloqueada não pode inventar Gameplay');

const noFunctionResult = makeResult({
  teamMap: { ...result.teamMap, functionLabel: '' },
});
const noFunction = buildBuildSimulatorR483({ result: noFunctionResult, targetPosition: 'AMF' });
assert.equal(noFunction.variants.some((variant) => variant.id === 'specialist'), false);
assert.equal(noFunction.variants.some((variant) => variant.id === 'gameplay'), false);

console.log('R483 Task 1-2 contract: OK');
