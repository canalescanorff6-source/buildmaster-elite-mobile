import assert from 'node:assert/strict';
import type { FinalAdditionalSkillSetR457 } from '../src/lib/finalAdditionalSkillSetR457';
import type { FinalImpetoDecisionR457 } from '../src/lib/finalImpetoDecisionR457';
import type { ProjectedPlayerStateR504 } from '../src/modules/analysis/projectedPlayerStateR504';
import {
  analyzeJointFrontierR512,
  JOINT_OPTIMIZER_R512_CALIBRATION,
} from '../src/modules/analysis/jointOptimizerR512';

function projected(overrides: Record<string, number>): ProjectedPlayerStateR504 {
  return {
    version: '40.80-r504-projected-player-state-v1',
    source: 'BASE_CARD_PLUS_FINAL_TRAINING',
    baseAttributes: {},
    finalAttributes: {
      lowPass: 88,
      loftedPass: 84,
      ballControl: 90,
      dribbling: 88,
      tightPossession: 90,
      offensiveAwareness: 87,
      acceleration: 86,
      balance: 89,
      speed: 83,
      kickingPower: 82,
      stamina: 88,
      physicalContact: 78,
      finishing: 80,
      defensiveAwareness: 70,
      defensiveEngagement: 72,
      tackling: 68,
      aggression: 72,
      ...overrides,
    },
    training: {
      shooting: 0,
      passing: 0,
      dribbling: 0,
      dexterity: 0,
      lowerBodyStrength: 0,
      aerialStrength: 0,
      defending: 0,
      gk1: 0,
      gk2: 0,
      gk3: 0,
    },
    trainingCost: 0,
    projectedAttributeCount: 18,
  };
}

function skills(finalSetScore: number): FinalAdditionalSkillSetR457 {
  return {
    version: '40.80-r508-final-additional-skill-set-v5-style-post-build',
    status: 'OPTIMAL_SET_PROVEN',
    position: 'CMF',
    actionStateSource: 'PROJECTED_POST_BUILD_ACTIONS',
    projectedActionCoverage: 100,
    currentSkills: [],
    finalSkills: ['Passe de primeira', 'Passe em profundidade', 'Controle com a sola', 'Interceptação', 'Espírito guerreiro'],
    additions: ['Passe de primeira', 'Passe em profundidade', 'Controle com a sola', 'Interceptação', 'Espírito guerreiro'],
    removals: [],
    decisions: [],
    individualScores: [],
    currentSetScore: 0,
    finalSetScore,
    estimatedSetGain: finalSetScore,
    complementPairs: [],
    candidatePoolSize: 10,
    combinationsTested: 100,
    exactFive: true,
    officialOnly: true,
    roleCompatible: true,
    nativeSpecialDuplicatesBlocked: true,
    deterministic: true,
    modelNote: 'R512 regression fixture',
  } as FinalAdditionalSkillSetR457;
}

function impeto(score: number): FinalImpetoDecisionR457 {
  return {
    version: '40.80-r508-preserve-active-impeto-v1',
    current: null,
    currentScore: null,
    technicalIdeal: 'Passe',
    technicalIdealScore: score,
    technicalGainOverCurrent: null,
    action: 'ADD_IF_AVAILABLE',
    slotStatus: 'DISPONIVEL',
    candidates: [{
      name: 'Passe',
      totalScore: score,
      functionalFit: score,
      positionFit: 90,
      attributeSupport: 90,
      confidence: 90,
      explanation: 'fixture',
    }],
    ambiguity: false,
    attributeSource: 'PROJECTED_POST_BUILD',
    numericAttributeEffectVerified: false,
    effectModel: 'FUNCTIONAL_FIT_ONLY',
    automaticSpendAuthorized: false,
    reason: 'fixture',
    modelNote: 'fixture',
  } as FinalImpetoDecisionR457;
}

const result = analyzeJointFrontierR512({
  equivalenceBand: 0.02,
  topN: 5,
  candidates: [
    {
      id: 'raw-score-winner',
      trainingCacheKey: 101,
      baseScore: 92.417,
      rankedScore: 91.7,
      state: projected({ lowPass: 84, ballControl: 86, tightPossession: 86, balance: 85 }),
      usageFunction: 'CMF_ORGANIZER',
      skills: skills(410),
      impeto: impeto(78),
    },
    {
      id: 'joint-balance-winner',
      trainingCacheKey: 102,
      baseScore: 92.414,
      rankedScore: 91.8,
      state: projected({ lowPass: 94, ballControl: 94, tightPossession: 95, balance: 93 }),
      usageFunction: 'CMF_ORGANIZER',
      skills: skills(414),
      impeto: impeto(80),
    },
    {
      id: 'outside-band',
      trainingCacheKey: 103,
      baseScore: 91.8,
      rankedScore: 92.5,
      state: projected({ lowPass: 97, ballControl: 97, tightPossession: 97, balance: 96 }),
      usageFunction: 'CMF_ORGANIZER',
      skills: skills(420),
      impeto: impeto(84),
    },
  ],
});

assert.equal(JOINT_OPTIMIZER_R512_CALIBRATION.status, 'SHADOW_UNCALIBRATED');
assert.equal(JOINT_OPTIMIZER_R512_CALIBRATION.certifiedForFinalWrite, false);
assert.equal(result.productionAuthorityChanged, false,
  'R512 shadow não pode promover automaticamente seu vencedor para produção.');
assert.equal(result.globalRealGameOptimality, false,
  'R512 não pode declarar ótimo global real do eFootball enquanto houver componentes heurísticos.');
assert.equal(result.certification, 'OPTIMAL_WITHIN_MODEL_FRONTIER_UNCALIBRATED');
assert.equal(result.exactBaseWinnerId, 'raw-score-winner');
assert.equal(result.shadowWinnerId, 'joint-balance-winner',
  'R512 deve conseguir distinguir equilíbrio conjunto dentro da faixa equivalente sem falsificar a ficha-base.');
assert.equal(result.equivalentCandidates, 2,
  'R512 deve respeitar a equivalenceBand recebida e não misturar candidato claramente inferior na ficha.');
assert.equal(result.topN.length, 3,
  'R512 deve preservar candidatos internos para auditoria, não somente o vencedor.');
assert.ok(result.topN[0].residualBottlenecks.length > 0,
  'R512 deve registrar gargalos residuais pós-ficha.');
assert.ok(result.topN[0].possessionScore > 0,
  'R512 deve re-simular a configuração pelo motor de Posse R511.');
assert.ok(result.topN.every(item => item.skillsPostBuild === true),
  'R512 deve declarar a origem pós-build do Top 5.');
assert.ok(result.topN.every(item => item.impetoPostBuild === true),
  'R512 deve declarar a origem pós-build do Ímpeto.');
assert.ok(result.topN.every(item => item.automaticSpendAuthorized === false),
  'R512 nunca pode transformar comparação conjunta em gasto automático.');
assert.equal(result.stability.level, 'LOW_EQUIVALENT_FRONTIER',
  'Dois candidatos praticamente equivalentes devem reduzir a confiança de estabilidade em vez de criar falsa precisão.');
assert.equal(result.stability.equivalentCandidateIds.includes('raw-score-winner'), true);
assert.equal(result.stability.equivalentCandidateIds.includes('joint-balance-winner'), true);

const repeated = analyzeJointFrontierR512({
  equivalenceBand: 0.02,
  topN: 5,
  candidates: [
    {
      id: 'raw-score-winner', trainingCacheKey: 101, baseScore: 92.417, rankedScore: 91.7,
      state: projected({ lowPass: 84, ballControl: 86, tightPossession: 86, balance: 85 }),
      usageFunction: 'CMF_ORGANIZER', skills: skills(410), impeto: impeto(78),
    },
    {
      id: 'joint-balance-winner', trainingCacheKey: 102, baseScore: 92.414, rankedScore: 91.8,
      state: projected({ lowPass: 94, ballControl: 94, tightPossession: 95, balance: 93 }),
      usageFunction: 'CMF_ORGANIZER', skills: skills(414), impeto: impeto(80),
    },
    {
      id: 'outside-band', trainingCacheKey: 103, baseScore: 91.8, rankedScore: 92.5,
      state: projected({ lowPass: 97, ballControl: 97, tightPossession: 97, balance: 96 }),
      usageFunction: 'CMF_ORGANIZER', skills: skills(420), impeto: impeto(84),
    },
  ],
});
assert.deepEqual(repeated, result, 'R512 precisa ser 100% determinístico para a mesma entrada.');

console.log('R512 RED/GREEN: frontier conjunto preserva equivalência, gargalos, Top-N, estabilidade e autoridade única.');
