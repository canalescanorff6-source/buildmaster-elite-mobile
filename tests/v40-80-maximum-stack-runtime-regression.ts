import assert from 'node:assert/strict';
import type { AnalysisResult, TrainingPlan } from '../src/lib/analyzerDomain';
import { buildMaximumPerformanceV4080, applyMaximumPerformanceV4080 } from '../src/lib/maximumPerformanceV4080';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';

const planA: TrainingPlan = { shooting: 8, passing: 5, dribbling: 7, dexterity: 8, lowerBodyStrength: 7, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
const planB: TrainingPlan = { shooting: 7, passing: 5, dribbling: 8, dexterity: 9, lowerBodyStrength: 6, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
const budget = trainingPlanTotalCost(planA);

function fixture(slot: 'DISPONIVEL' | 'OCUPADO' | 'SEM_VAGA' | 'NAO_CONFIRMADO'): AnalysisResult {
  return {
    objective: 'COMPETITIVE',
    parsed: {
      playerName: 'Carta Stack v40.80', cardType: 'Épico', specialTag: null, country: 'Brasil', mainPosition: 'SS', mainPositionPt: 'SA', positions: ['SS'], positionsPt: ['SA'], positionRatings: { SS: 100 }, playstyle: 'Jogador de infiltração', dominantFoot: 'Direito', overall: 100, maxOverall: 101, height: 178, weight: 72, age: 24, level: 30,
      trainingPointsTotal: budget, trainingPointsUsed: budget, trainingPointSource: 'OCR', autoTrainingPlan: null, autoTrainingPoints: null,
      condition: {}, impetos: slot === 'OCUPADO' ? [{ name: 'Técnica', value: 2, active: true }, { name: 'Agilidade', value: 1, active: true }] : [{ name: 'Técnica', value: 2, active: true }],
      nativeSkills: ['Passe de primeira'], additionalSkills: [], specialSkills: ['Curva descendente'],
      attributes: { offensiveAwareness: 88, ballControl: 91, dribbling: 92, tightPossession: 91, lowPass: 84, loftedPass: 79, finishing: 86, heading: 61, placeKicking: 76, curl: 87, defensiveAwareness: 45, defensiveEngagement: 52, tackling: 44, aggression: 58, speed: 86, acceleration: 90, kickingPower: 85, jump: 66, physicalContact: 63, balance: 91, stamina: 83, goalkeeperAwareness: 1, goalkeeperCatching: 1, goalkeeperParrying: 1, goalkeeperReflexes: 1, goalkeeperReach: 1 },
      physicalProfile: {}, manualConfirmed: false,
      evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 29, positionRatingsCount: 1, skillConfidence: 94, additionalSkillCount: 0, specialSkillCount: 1, impetoSlotStatus: slot, impetoSlotEvidence: slot === 'DISPONIVEL' ? 'vaga livre' : null },
      internalId: 'stack-4080', confidence: 95, warnings: []
    },
    bestPosition: { code: 'SS', label: 'SA', score: 96 },
    positionScores: [{ code: 'SS', label: 'SA', score: 96, role: 'infiltração' }],
    pri: {}, tacticalFit: {}, training: planA, trainingCost: planA, trainingPointsUsed: budget, trainingPointsTotal: budget, trainingPointsRemaining: 0, trainingCostRule: 'teste', trainingComparison: [], buildVariants: [], recommendationExplanation: [],
    tacticalProfile: { formation: '4-3-3', style: 'POSSE_DE_BOLA', managerId: 'teste', managerName: 'Teste', managerProficiency: 90, managerBooster: null },
    teamMap: { functionLabel: 'SA de criação e infiltração', tacticalIdentity: '', defensiveJob: '', buildupJob: '', attackingJob: '', pressingJob: '', idealPartners: [], riskAlerts: [], matchPlan: [], sectorScores: { marcacao: 50, cobertura: 50, saidaDeBola: 80, passe: 88, criacao: 92, aceleracao: 90, finalizacao: 86, jogoAereo: 55, fisico: 62 }, coachFit: '' },
    profileTips: [], validation: { score: 96, level: 'ready', issues: [], checks: [] } as any, permittedPositions: [], avoidPositions: [],
    recommendedSkills: ['Passe em profundidade', 'Toque duplo', 'Chute de primeira', 'Controle com a sola', 'Espírito guerreiro'], skillRecommendations: [], avoidSkills: [],
    recommendedImpetos: [
      { name: 'Agilidade', tier: 'ideal', attributes: ['Velocidade', 'Aceleração', 'Equilíbrio', 'Resistência'], reason: 'Mobilidade.', score: 88, confidence: 90, official: true },
      { name: 'Passe', tier: 'alternativo', attributes: ['Passe rasteiro', 'Passe alto', 'Curva', 'Força do chute'], reason: 'Criação.', score: 80, confidence: 88, official: true },
      { name: 'Defesa', tier: 'evitar', attributes: ['Talento defensivo', 'Desarme', 'Dedicação defensiva', 'Agressividade'], reason: 'Baixo encaixe.', score: 45, confidence: 88, official: true }
    ],
    buildName: 'Ficha v40.70', strengths: [], weaknesses: [], usageTips: [], note: '',
    deepAnalysis: {} as any, advancedTacticalFunction: {} as any, specialSkillsAnalysis: {} as any, physicalEngine: {} as any, attributeGoals: {} as any, advancedOptimizer: {} as any, correctionLimit: {} as any, marginalReturn: [], errorTolerance: {} as any, skillPriority: { ordered: [], officialOnly: true, context: [] } as any,
    maximumPerformanceV4040: {
      engineVersion: '40.40.0', mode: 'PRECISAO_COMPETITIVA_99', deterministic: true, selectedPosition: 'SS', selectedPositionLabel: 'SA', baseTraining: planA, finalTraining: planA, exactBudget: true, candidatesEvaluated: 100, paretoCandidates: 2, baselineScore: 84, winnerScore: 86, scoreGap: 1, contextScores: { ranked: 86, events: 85, friends: 84, average: 85 }, responseScore: 88, dnaPreservation: 90, efficiencyScore: 90, profileFitScore: 89, confidence: { score: 90, level: 'ALTA', dataQuality: 90, decisionMargin: 80, reasons: [] }, alternatives: [
        { id: 'MAXIMO_COMPETITIVO', label: 'Máximo competitivo', training: planA, score: 86, rankedScore: 86, dnaPreservation: 90, efficiencyScore: 90 },
        { id: 'RESPOSTA_ONLINE', label: 'Resposta online', training: planB, score: 85.8, rankedScore: 87, dnaPreservation: 87, efficiencyScore: 91 }
      ], changes: [], skillPlan: { finalSkills: [], slotsFilled: 0, duplicatesBlocked: 0, unique: true, sourcePolicy: '' }, metaRuntime: {} as any, guarantees: {} as any, reasons: [], summary: ''
    }
  } as AnalysisResult;
}

const available = fixture('DISPONIVEL');
const analysis = buildMaximumPerformanceV4080(available);
assert.equal(analysis.engineVersion, '40.80.0');
assert.equal(analysis.mode, 'DESEMPENHO_MAXIMO_STACK_FINAL');
assert.equal(analysis.exactBudget, true);
assert.equal(analysis.impeto.canCraft, true);
assert.equal(analysis.impeto.selectableOfficialCount, 28);
assert.equal(analysis.impeto.randomPool.goalkeeper, 8);
assert.ok(analysis.skillPlan.finalSkills.length <= 5 && analysis.skillPlan.finalSkills.length > 0);
assert.ok(!analysis.skillPlan.finalSkills.includes('Passe de primeira'));
assert.ok(!analysis.impeto.candidates.some((item) => item.name === 'Técnica'), 'Ímpeto já presente não pode ser sugerido de novo');
assert.ok(analysis.impeto.primary, 'vaga confirmada deve produzir recomendação de Ímpeto');

const applied = applyMaximumPerformanceV4080(available);
assert.equal(applied.maximumPerformanceV4080?.guarantees.gerIsNotOptimizationTarget, true);
assert.equal(trainingPlanTotalCost(applied.training), budget);
assert.deepEqual(applied.recommendedSkills, analysis.skillPlan.finalSkills);

for (const blockedStatus of ['SEM_VAGA', 'NAO_CONFIRMADO', 'OCUPADO'] as const) {
  const blocked = buildMaximumPerformanceV4080(fixture(blockedStatus));
  assert.equal(blocked.impeto.canCraft, false, `${blockedStatus} deve bloquear gasto de token`);
}

const longitudinal = fixture('DISPONIVEL');
longitudinal.longitudinalGameplayMemoryV4060 = { engineVersion: '40.60.0', applied: true, provisionalV4050Blocked: true, winnerId: 'MAXIMO_COMPETITIVO', winnerLabel: 'Máximo competitivo', confidenceScore: 91, sessions: 4, pairedSessions: 3, verifiedAt: '2026-08-12T12:00:00.000Z' };
const locked = buildMaximumPerformanceV4080(longitudinal);
assert.equal(locked.trainingSource, 'VALIDADO_LONGITUDINAL');
assert.deepEqual(locked.finalTraining, planA, 'campeã longitudinal não pode ser trocada pela v40.80');
assert.equal(locked.guarantees.longitudinalWinnerProtected, true);

console.log(`v40.80 runtime aprovada: ${analysis.candidatesEvaluated} stack(s), Top ${analysis.skillPlan.slotsFilled}, Ímpeto ${analysis.impeto.primary}, score ${Math.round(analysis.winnerJointScore)}/100.`);
