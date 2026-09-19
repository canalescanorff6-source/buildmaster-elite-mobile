import assert from 'node:assert/strict';
import {
  buildGameplayScoutingRecordR454,
  detectGameplayScoutingConflictsR454,
  evaluateContextualTacticalFitR454,
  type GameplayScoutingEvidenceR454
} from '../src/lib/gameplayScoutingR454';
import type { AnalysisResult, PositionCode } from '../src/lib/analyzerDomain';

function card(name: string, position: PositionCode, playstyle: string, overall: number, tag: string): AnalysisResult {
  return {
    parsed: {
      playerName: name,
      cardType: 'Epic',
      specialTag: tag,
      country: 'Brasil',
      mainPosition: position,
      mainPositionPt: position,
      positions: [position],
      positionsPt: [position],
      positionRatings: { [position]: 100 },
      playstyle,
      offensivePlaystyle: playstyle,
      defensivePlaystyle: 'Básico',
      dominantFoot: 'Direito',
      overall,
      maxOverall: overall,
      height: 180,
      weight: 78,
      age: 27,
      level: 35,
      trainingPointsTotal: 56,
      condition: {},
      impetos: [],
      nativeSkills: ['Passe de primeira'],
      additionalSkills: [],
      specialSkills: [],
      attributes: {
        offensiveAwareness: 88, ballControl: 90, dribbling: 87, tightPossession: 89,
        lowPass: 90, loftedPass: 84, finishing: 84, heading: 72,
        defensiveAwareness: 78, defensiveEngagement: 80, tackling: 78, aggression: 76,
        speed: 84, acceleration: 88, kickingPower: 82, jump: 78,
        physicalContact: 78, balance: 90, stamina: 88
      },
      physicalProfile: {},
      manualConfirmed: true,
      evidence: { attributeCount: 20, positionRatingsCount: 1 },
      internalId: tag,
      confidence: 95,
      warnings: []
    },
    bestPosition: { code: position, label: position, score: 90 },
    positionScores: [],
    pri: {},
    tacticalFit: {},
    training: {},
    trainingCost: {},
    trainingPointsUsed: 56,
    trainingPointsTotal: 56,
    trainingPointsRemaining: 0,
    trainingCostRule: '',
    trainingComparison: [],
    buildVariants: [],
    recommendationExplanation: [],
    tacticalProfile: { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' },
    teamMap: {
      functionLabel: 'Função teste',
      matchPlan: [],
      sectorScores: { marcacao: 80, cobertura: 80, saidaDeBola: 84, passe: 88, criacao: 88, aceleracao: 84, finalizacao: 82, jogoAereo: 72, fisico: 78 }
    },
    profileTips: [],
    validation: {} as never,
    permittedPositions: [{ code: position, label: position, reason: 'principal' }],
    avoidPositions: [],
    recommendedSkills: ['Toque duplo', 'Passe em profundidade', 'Passe na medida', 'Chute de primeira', 'Espírito guerreiro'],
    skillRecommendations: [],
    avoidSkills: [],
    recommendedImpetos: [],
    buildName: 'Build contextual',
    strengths: ['Passe curto', 'Controle de bola', 'Equilíbrio'],
    weaknesses: ['Jogo aéreo'],
    usageTips: ['Aproxime para tabelas e acelere apenas com espaço.'],
    note: '',
    deepAnalysis: {} as never,
    advancedTacticalFunction: {} as never,
    specialSkillsAnalysis: {} as never,
    physicalEngine: {} as never,
    attributeGoals: {} as never,
    advancedOptimizer: {} as never,
    correctionLimit: {} as never,
    marginalReturn: [],
    errorTolerance: {} as never,
    skillPriority: {} as never
  } as AnalysisResult;
}

const creator = card('Criador R454', 'AMF', 'Armador Criativo', 101, 'version-a');
const runner = card('Infiltrador R454', 'SS', 'Infiltração', 96, 'version-b');
const creator2 = card('Criador 2 R454', 'AMF', 'Armador Criativo', 109, 'version-c');

const baseContext = { formationId: '4-2-2-2', targetPosition: 'AMF' as const, teamStyle: 'POSSE_DE_BOLA' as const };
const lowOverall = evaluateContextualTacticalFitR454({ ...creator, parsed: { ...creator.parsed, overall: 80, maxOverall: 80 } }, baseContext);
const highOverall = evaluateContextualTacticalFitR454({ ...creator, parsed: { ...creator.parsed, overall: 120, maxOverall: 120 } }, baseContext);
assert.equal(lowOverall.score, highOverall.score, 'R454: OVR/GER não pode alterar o Tactical Fit.');

const complementary = evaluateContextualTacticalFitR454(creator, { ...baseContext, partners: [runner] });
const redundant = evaluateContextualTacticalFitR454(creator, { ...baseContext, partners: [creator2] });
assert.ok(complementary.dimensions.synergy > redundant.dimensions.synergy, 'R454: Armador + Infiltração deve ser mais complementar que dois Armadores no mesmo contexto.');

const wingAtFullback = card('Ala fora de posição', 'LWF', 'Ala Produtivo', 100, 'version-wing');
const inactive = evaluateContextualTacticalFitR454(wingAtFullback, {
  formationId: '4-2-2-2',
  targetPosition: 'LB',
  teamStyle: 'POSSE_DE_BOLA'
});
assert.equal(inactive.styleActivation, 'INATIVO');
assert.ok(inactive.warnings.includes('ESTILO INATIVO NESTA POSIÇÃO'));

const pending = buildGameplayScoutingRecordR454(creator);
assert.equal(pending.status, 'SCOUTING_PENDENTE');
assert.equal(pending.recommendedSkills.length, 5);
assert.ok(pending.cardId.startsWith('card-r126-'));

const sources: GameplayScoutingEvidenceR454[] = [
  {
    id: 'db-a', type: 'DATABASE', sourceName: 'Banco A', gameVersion: '6.0.0', observedAt: '2026-09-19T10:00:00Z', confidence: 'ALTA',
    claims: [{ key: 'pressResistance', value: 'alta' }]
  },
  {
    id: 'review-b', type: 'REVIEWER', sourceName: 'Review B', gameVersion: '6.0.0', observedAt: '2026-09-19T11:00:00Z', confidence: 'MEDIA',
    claims: [{ key: 'pressResistance', value: 'baixa' }]
  }
];
const conflicts = detectGameplayScoutingConflictsR454(sources);
assert.equal(conflicts.length, 1);
assert.equal(conflicts[0].status, 'SOURCE_CONFLICT');

console.log('R454 aprovada: scouting por Card ID, GER fora do Fit, estilo inativo explícito, sinergia contextual e conflitos de fonte.');
