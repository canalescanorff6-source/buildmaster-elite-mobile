import assert from 'node:assert/strict';
import { applyMaximumPerformanceV4040, buildMaximumPerformanceV4040 } from '../src/lib/maximumPerformanceOptimizerV4040';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import type { AnalysisResult, TrainingPlan, UnifiedSkillDecision } from '../src/lib/analyzerDomain';

const seed: TrainingPlan = { shooting: 8, passing: 4, dribbling: 8, dexterity: 8, lowerBodyStrength: 8, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
const skill = (name: string, score: number, category: UnifiedSkillDecision['category']): UnifiedSkillDecision => ({
  name, score, category, priority: score >= 90 ? 'essencial' : 'alta', gameplayImpact: `${name} complementa a função.`, reasons: ['teste'], supportedBy: ['função'], identityBoost: 8
});

const fixture = {
  objective: 'COMPETITIVE',
  parsed: {
    playerName: 'Carta Teste', internalId: 'teste-4040', nativeSkills: ['Passe de primeira'], additionalSkills: [], specialSkills: [], confidence: 94, manualConfirmed: true,
    evidence: { attributeCount: 29, positionLocked: true, playstyleLocked: true, skillConfidence: 94 },
    attributes: {
      offensiveAwareness: 88, ballControl: 91, dribbling: 92, tightPossession: 91, lowPass: 84, loftedPass: 79, finishing: 86, heading: 60, placeKicking: 76, curl: 84,
      defensiveAwareness: 48, defensiveEngagement: 52, tackling: 46, aggression: 61, speed: 86, acceleration: 90, kickingPower: 84, jump: 67, physicalContact: 63, balance: 90, stamina: 82,
      goalkeeperAwareness: 0, goalkeeperCatching: 0, goalkeeperParrying: 0, goalkeeperReflexes: 0, goalkeeperReach: 0
    }
  },
  bestPosition: { code: 'SS', label: 'SA', score: 95 },
  tacticalProfile: { style: 'POSSE_DE_BOLA' },
  training: seed,
  trainingPointsTotal: trainingPlanTotalCost(seed), trainingPointsUsed: trainingPlanTotalCost(seed), trainingPointsRemaining: 0,
  buildVariants: [], recommendationExplanation: [], strengths: [], recommendedSkills: ['Passe de primeira', 'Passe em profundidade', 'Chute de primeira', 'Toque duplo', 'Controle com a sola'],
  adaptivePositionV3930: { adaptationMode: 'NATURAL' },
  performanceFunctionV3940: {
    finalTraining: seed,
    finalSkills: [
      skill('Passe de primeira', 99, 'passe'), skill('Toque duplo', 96, 'drible'), skill('Passe em profundidade', 94, 'passe'), skill('Chute de primeira', 92, 'finalização'), skill('Controle com a sola', 90, 'drible'), skill('Espírito guerreiro', 84, 'mental')
    ]
  },
  adaptiveMaximumV4030: {
    finalTraining: seed,
    profiles: [
      { id: 'DRIBBLER', label: 'Controle e 1 contra 1', score: 95, rank: 1, reason: 'teste' },
      { id: 'CREATOR', label: 'Criação e último passe', score: 90, rank: 2, reason: 'teste' }
    ]
  }
} as unknown as AnalysisResult;

const first = buildMaximumPerformanceV4040(fixture);
const second = buildMaximumPerformanceV4040(fixture);
assert.equal(first.engineVersion, '40.40.0');
assert.equal(first.mode, 'PRECISAO_COMPETITIVA_99');
assert.equal(first.exactBudget, true);
assert.ok(first.candidatesEvaluated > 1, 'deve comparar mais de uma candidata');
assert.ok(first.paretoCandidates >= 1, 'deve formar fronteira de Pareto');
assert.equal(trainingPlanTotalCost(first.finalTraining), trainingPlanTotalCost(seed));
assert.deepEqual(first.finalTraining, second.finalTraining, 'mesma entrada deve produzir a mesma ficha');
assert.equal(first.winnerScore, second.winnerScore, 'score precisa ser determinístico');
assert.ok(first.confidence.score >= 70, 'fixture completa deve produzir confiança útil');
assert.ok(first.skillPlan.finalSkills.length <= 5, 'máximo de cinco habilidades adicionais');
assert.ok(!first.skillPlan.finalSkills.includes('Passe de primeira'), 'habilidade nativa não pode ser recomendada de novo');
assert.equal(new Set(first.skillPlan.finalSkills).size, first.skillPlan.finalSkills.length, 'habilidades recomendadas devem ser únicas');
assert.ok(first.alternatives.length >= 1 && first.alternatives.length <= 3);

const applied = applyMaximumPerformanceV4040(fixture);
assert.deepEqual(applied.training, first.finalTraining);
assert.deepEqual(applied.recommendedSkills, first.skillPlan.finalSkills);
assert.equal(applied.maximumPerformanceV4040?.exactBudget, true);
assert.equal(applied.buildVariants[0]?.kind, 'competitive');

const cbSeed: TrainingPlan = { shooting: 0, passing: 4, dribbling: 0, dexterity: 4, lowerBodyStrength: 8, aerialStrength: 8, defending: 12, gk1: 0, gk2: 0, gk3: 0 };
const cbFixture = structuredClone(fixture as unknown as object) as unknown as AnalysisResult;
cbFixture.bestPosition = { code: 'CB', label: 'ZAG', score: 96 };
cbFixture.training = cbSeed;
cbFixture.trainingPointsTotal = trainingPlanTotalCost(cbSeed);
cbFixture.trainingPointsUsed = trainingPlanTotalCost(cbSeed);
cbFixture.parsed.playerName = 'Zagueiro Teste';
cbFixture.parsed.attributes = { ...cbFixture.parsed.attributes, defensiveAwareness: 91, defensiveEngagement: 92, tackling: 91, aggression: 88, speed: 82, acceleration: 78, jump: 87, heading: 88, physicalContact: 91 };
(cbFixture.performanceFunctionV3940 as any).finalTraining = cbSeed;
(cbFixture.adaptiveMaximumV4030 as any).finalTraining = cbSeed;
(cbFixture.adaptiveMaximumV4030 as any).profiles = [{ id: 'DEFENSIVE', label: 'Defesa e cobertura', score: 96, rank: 1, reason: 'teste' }];
const cb = buildMaximumPerformanceV4040(cbFixture);
assert.equal(trainingPlanTotalCost(cb.finalTraining), trainingPlanTotalCost(cbSeed));
assert.equal(cb.finalTraining.gk1 + cb.finalTraining.gk2 + cb.finalTraining.gk3, 0, 'jogador de linha não pode receber treino de goleiro');

const gkSeed: TrainingPlan = { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 4, aerialStrength: 4, defending: 0, gk1: 8, gk2: 8, gk3: 8 };
const gkFixture = structuredClone(fixture as unknown as object) as unknown as AnalysisResult;
gkFixture.bestPosition = { code: 'GK', label: 'GO', score: 98 };
gkFixture.training = gkSeed;
gkFixture.trainingPointsTotal = trainingPlanTotalCost(gkSeed);
gkFixture.trainingPointsUsed = trainingPlanTotalCost(gkSeed);
gkFixture.parsed.playerName = 'Goleiro Teste';
gkFixture.parsed.attributes = { goalkeeperAwareness: 90, goalkeeperCatching: 88, goalkeeperParrying: 91, goalkeeperReflexes: 93, goalkeeperReach: 91, jump: 84, speed: 65, acceleration: 63, kickingPower: 76, stamina: 70, balance: 66, physicalContact: 80 };
(gkFixture.performanceFunctionV3940 as any).finalTraining = gkSeed;
(gkFixture.adaptiveMaximumV4030 as any).finalTraining = gkSeed;
(gkFixture.adaptiveMaximumV4030 as any).profiles = [{ id: 'GOALKEEPER', label: 'Goleiro completo', score: 98, rank: 1, reason: 'teste' }];
const gk = buildMaximumPerformanceV4040(gkFixture);
assert.equal(trainingPlanTotalCost(gk.finalTraining), trainingPlanTotalCost(gkSeed));
assert.equal(gk.finalTraining.shooting + gk.finalTraining.dribbling + gk.finalTraining.defending, 0, 'goleiro não deve desviar pontos para grupos incompatíveis');

console.log(`v40.40 runtime aprovada: ${first.candidatesEvaluated} candidatas, ${first.paretoCandidates} Pareto, confiança ${Math.round(first.confidence.score)}/100 e ${first.skillPlan.finalSkills.length} habilidades complementares.`);
