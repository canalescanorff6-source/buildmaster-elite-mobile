import assert from 'node:assert/strict';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
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

console.log('R483 Task 1 aprovada: baseline oficial, orçamento real e autoridade read-only protegidos.');
