import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AnalysisResult, TrainingPlan } from '../src/lib/analyzer';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { buildBuildSimulatorR483 } from '../src/modules/build-simulator/buildSimulatorEngineR483';

const officialTraining: TrainingPlan = { shooting: 8, passing: 8, dribbling: 8, dexterity: 8, lowerBodyStrength: 8, aerialStrength: 4, defending: 4, gk1: 0, gk2: 0, gk3: 0 };
const officialPoints = trainingPlanTotalCost(officialTraining);
function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    parsed: { playerName: 'R483 Test Player', cardType: 'Test', mainPosition: 'AMF', mainPositionPt: 'MAT', positions: ['AMF', 'CMF'], positionsPt: ['MAT', 'MLG'], positionRatings: { AMF: 90, CMF: 88 }, condition: {}, impetos: [], nativeSkills: [], specialSkills: [], attributes: {}, physicalProfile: {}, manualConfirmed: true, evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 0, positionRatingsCount: 2 }, internalId: 'r483-fixture-card', confidence: 100, warnings: [] },
    bestPosition: { code: 'AMF', label: 'MAT', score: 90 }, positionScores: [], pri: {}, tacticalFit: {}, training: officialTraining, trainingCost: officialTraining,
    trainingPointsUsed: officialPoints, trainingPointsTotal: officialPoints, trainingPointsRemaining: 0, trainingCostRule: 'canonical', trainingComparison: [], buildVariants: [], recommendationExplanation: [],
    tacticalProfile: { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' },
    teamMap: { functionLabel: 'Armador central', tacticalIdentity: 'criador', defensiveJob: '', buildupJob: '', attackingJob: '', pressingJob: '', idealPartners: [], riskAlerts: [], matchPlan: [], sectorScores: { marcacao: 0, cobertura: 0, saidaDeBola: 0, passe: 0, criacao: 0, aceleracao: 0, finalizacao: 0, jogoAereo: 0, fisico: 0 }, coachFit: '' },
    profileTips: [], validation: { level: 'safe', confirmed: true, canGenerate: true, issues: [] }, permittedPositions: [], avoidPositions: [], recommendedSkills: [], recommendedImpetos: [], buildName: 'Armador central', usageTips: [], deepAnalysis: { confidenceLevel: 'alta', originalIdentity: 'fixture', recommendedFunction: 'Armador central', readingItems: [], uncertainFields: [], safeguards: [], pointRationale: [] }, ...overrides,
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
assert.deepEqual(snapshot.authority, { readOnly: true, canWriteTraining: false, canWriteSkills: false, canWriteImpetus: false, canChangePosition: false, canOverrideCleanSlate: false, canOverrideR126: false, canOverrideR128: false, optimizeOverall: false });
assert.equal(JSON.stringify(input), before);

const blocked = buildBuildSimulatorR483({ result: makeResult({ trainingPointsTotal: 0, trainingPointsUsed: 0 }), targetPosition: 'AMF' });
assert.match(blocked.blockedReason ?? '', /orçamento real/i); assert.equal(blocked.variants.length, 0); assert.equal(blocked.budget, 0); assert.notEqual(blocked.budget, 64);
const inconsistent = buildBuildSimulatorR483({ result: makeResult({ trainingPointsUsed: officialPoints - 1 }), targetPosition: 'AMF' });
assert.match(inconsistent.blockedReason ?? '', /inconsistência de orçamento/i); assert.equal(inconsistent.variants.length, 0);

const first = buildBuildSimulatorR483(input); const second = buildBuildSimulatorR483(input);
assert.deepEqual(first, second);
assert.deepEqual(first.variants.map((variant) => variant.id), ['official', 'balanced', 'specialist', 'gameplay']);
for (const variant of first.variants) { assert.equal(trainingPlanTotalCost(variant.plan), result.trainingPointsUsed); assert.equal(variant.pointsUsed, result.trainingPointsUsed); assert.ok(variant.pointsUsed <= result.trainingPointsTotal); }
assert.ok(first.variants.slice(1).every((variant) => JSON.stringify(variant.plan) !== JSON.stringify(result.training)));
for (const variant of first.variants.slice(1)) { assert.ok(variant.deltas.some((delta) => delta.delta !== 0)); assert.ok(variant.strengths.length > 0); assert.ok(variant.sacrifices.length > 0); assert.ok(variant.explanation.length > 0); for (const strength of variant.strengths) assert.ok(variant.deltas.some((delta) => delta.delta > 0 && strength.includes(delta.key))); for (const sacrifice of variant.sacrifices) assert.ok(variant.deltas.some((delta) => delta.delta < 0 && sacrifice.includes(delta.key))); }

const blockedFunction = buildBuildSimulatorR483({ result: makeResult({ validation: { level: 'blocked', confirmed: false, canGenerate: false, issues: [] } }), targetPosition: 'AMF' });
assert.equal(blockedFunction.variants.some((variant) => variant.id === 'specialist'), false); assert.equal(blockedFunction.variants.some((variant) => variant.id === 'gameplay'), false);
const noFunction = buildBuildSimulatorR483({ result: makeResult({ teamMap: { ...result.teamMap, functionLabel: '' } }), targetPosition: 'AMF' });
assert.equal(noFunction.variants.some((variant) => variant.id === 'specialist'), false); assert.equal(noFunction.variants.some((variant) => variant.id === 'gameplay'), false);

const engineSource = readFileSync(resolve(process.cwd(), 'src/modules/build-simulator/buildSimulatorEngineR483.ts'), 'utf8');
assert.doesNotMatch(engineSource, /from\s+['\"][^'\"]*(?:vault|storage|persistence)[^'\"]*['\"]/i); assert.doesNotMatch(engineSource, /\b(?:save|persist|store)[A-Z]\w*\s*\(/); assert.doesNotMatch(engineSource, /recommendedSkills\s*=/); assert.doesNotMatch(engineSource, /recommendedImpetos\s*=/); assert.doesNotMatch(engineSource, /parsed\.(?:overall|maxOverall)|pri\.GER/); assert.doesNotMatch(engineSource, /setResult\s*\(/);

const panelPath = resolve(process.cwd(), 'src/modules/build-simulator/BuildSimulatorPanelR483.tsx'); assert.ok(existsSync(panelPath));
const panelSource = readFileSync(panelPath, 'utf8'); const advancedWorkspaceSource = readFileSync(resolve(process.cwd(), 'src/components/result/ResultAdvancedWorkspaceR192.tsx'), 'utf8');
assert.match(advancedWorkspaceSource, /BuildSimulatorPanelR483/); assert.match(panelSource, /Simulador de ficha — R483/); assert.match(panelSource, /Somente simulação — não altera sua ficha/); assert.match(panelSource, /Ficha oficial/); assert.match(panelSource, /export function BuildSimulatorPanelR483\(\{ result \}: \{ result: AnalysisResult \}\)/); assert.match(panelSource, /Simulador temporariamente indisponível\. Sua ficha oficial continua intacta\./); assert.doesNotMatch(panelSource, />\s*Aplicar\s*</i); assert.doesNotMatch(panelSource, /Salvar como oficial/i); assert.doesNotMatch(panelSource, /Substituir ficha/i); assert.doesNotMatch(panelSource, /on(?:Save|Apply)|setResult/);

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { scripts: Record<string, string> };
const prWorkflow = readFileSync(resolve(process.cwd(), '.github/workflows/pull-request-validation.yml'), 'utf8');
assert.equal(pkg.scripts['typecheck:r483-legacy'], 'npm run typecheck:v3170');
assert.match(pkg.scripts['test:r483'] ?? '', /typecheck:r151/);
assert.match(pkg.scripts['test:r483'] ?? '', /typecheck:r483-legacy/);
assert.match(pkg.scripts['test:r483'] ?? '', /v40-80-r483-build-simulator-regression\.ts/);
assert.match(pkg.scripts['ci:gate'] ?? '', /test:r482 && npm run test:r483 && npm run test:r417/);
assert.match(prWorkflow, /Regressão R483 — Build Simulator read-only/);
assert.match(prWorkflow, /npm run test:r483/);

console.log('R483 Task 1-5 contract: OK');
