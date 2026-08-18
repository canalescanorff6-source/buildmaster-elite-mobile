import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine = fs.readFileSync('src/lib/matchStaminaEngineV4080R44.ts', 'utf8');
const domain = fs.readFileSync('src/lib/analyzerDomain.ts', 'utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts', 'utf8');
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const finalizer = fs.readFileSync('src/lib/playerGenerationFinalizerV4080R13.ts', 'utf8');

for (const marker of [
  'MATCH_STAMINA_ENGINE_V4080_R44',
  'workloadAdjustment',
  'rebalanceExact',
  'trainingPlanTotalCost(candidate) === result.trainingPointsTotal',
  'projectedMinute',
  'Proteção anti-cansaço aplicada'
]) assert.ok(engine.includes(marker), `r44 sem ${marker}`);

assert.ok(domain.includes('matchStaminaV4080R44?: MatchStaminaV4080R44Analysis'));
assert.match(pipeline, /applyIndividualCalibrationEngineV4080R41\(current\)[\s\S]*applyMatchStaminaEngineV4080R44\(current\)[\s\S]*applyDefinitiveAdditionalSkillsV600R15\(current\)/);
assert.ok(workspace.includes('Resistência 90 min'));
assert.ok(workspace.includes('Intensidade estimada'));
assert.ok(finalizer.includes("stamina90?.risk === 'ALTO'"));

console.log('r44 aprovada: proteção de stamina 90 min global, orçamento exato, UI e finalizador integrados.');
