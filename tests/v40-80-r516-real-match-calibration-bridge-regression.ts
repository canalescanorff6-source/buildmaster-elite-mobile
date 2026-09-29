import assert from 'node:assert/strict';
import { applyCleanSlatePerformance2027R119 } from '../src/lib/cleanSlatePerformance2027V4080R119';
import { cardFingerprint, createMatchValidationRecord, type MatchValidationRecord } from '../src/lib/appEvolution';
import {
  buildIntelligentLearningR470,
  INTELLIGENT_LEARNING_R470_VERSION,
  type LearningProposalR470,
} from '../src/lib/intelligentLearningR470';
import { buildMotorLabLifecycleR472 } from '../src/lib/motorLabLifecycleR472';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_SEED_POLICY,
  GAMEPLAY_ENGINE_R510_VERSION,
  type GameplayActionIdR510,
} from '../src/modules/analysis/gameplayEngineR510';
import {
  buildBuildOutcomeCalibrationR460,
  type BuildOutcomeCalibrationR460,
} from '../src/modules/matches/buildOutcomeCalibrationR460';

process.env.BUILDMASTER_FORCE_FAST_CARD_PIPELINE = '1';

const GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION = '40.80-r516-real-match-calibration-contract-v1' as const;
const MAX_MULTIPLIER_R516 = 1.06;
type MappingR516 = readonly [GameplayActionIdR510, number][];

// Contrato test-only: prova a tradução sem adicionar writer/motor ao runtime.
const ACTION_MAP_R516: Readonly<Record<string, MappingR516>> = {
  attack_space: [['attackingMovement', 1]],
  finish_box: [['finishingAction', .8], ['attackingMovement', .2]],
  turn_finish: [['finishingAction', .55], ['pressEscape', .25], ['centralCarry', .2]],
  long_finish: [['finishingAction', 1]],
  close_control: [['firstTouchUnderPressure', .45], ['centralCarry', .3], ['pressEscape', .25]],
  carry: [['centralCarry', .7], ['pressEscape', .3]],
  short_creation: [['shortCombination', .7], ['lineBreakingPass', .3]],
  through_creation: [['lineBreakingPass', .8], ['shortCombination', .2]],
  hold_up: [['duelShield', .7], ['firstTouchUnderPressure', .3]],
  aerial_finish: [['aerialDuel', .55], ['finishingAction', .45]],
  aerial_defend: [['aerialDuel', .55], ['defensiveDuel', .45]],
  press_recover: [['defensiveDuel', 1]],
  intercept: [['defensiveDuel', 1]],
  defensive_duel: [['defensiveDuel', 1]],
  build_out: [['shortCombination', .5], ['lineBreakingPass', .3], ['pressEscape', .2]],
};

function buildIntegrationContractR516(input: {
  outcome: BuildOutcomeCalibrationR460;
  proposal: LearningProposalR470;
}) {
  const gateOpen = input.outcome.status === 'ACTIVE'
    && input.proposal.status === 'PROPOSED'
    && input.proposal.kind === 'CALIBRATION_WEIGHT';
  const rows = new Map<GameplayActionIdR510, {
    action: GameplayActionIdR510;
    suggestedMultiplier: number;
    evidenceActionIds: string[];
  }>();
  const unsupportedEvidenceActions: string[] = [];

  if (gateOpen) {
    for (const evidence of input.outcome.actions.filter(item => item.status === 'PERSISTENT_GAP')) {
      const mapping = ACTION_MAP_R516[evidence.id];
      if (!mapping?.length) {
        unsupportedEvidenceActions.push(evidence.id);
        continue;
      }
      const learned = Number(input.outcome.actionLearningMultipliers[evidence.id]);
      const source = Math.max(1, Math.min(MAX_MULTIPLIER_R516,
        Number.isFinite(learned) ? learned : Number(evidence.learningMultiplier || 1)));
      for (const [action, share] of mapping) {
        const suggestedMultiplier = Number((1 + (source - 1) * share).toFixed(4));
        const previous = rows.get(action);
        if (!previous) {
          rows.set(action, { action, suggestedMultiplier, evidenceActionIds: [evidence.id] });
        } else {
          previous.suggestedMultiplier = Math.max(previous.suggestedMultiplier, suggestedMultiplier);
          if (!previous.evidenceActionIds.includes(evidence.id)) previous.evidenceActionIds.push(evidence.id);
        }
      }
    }
  }

  const primitiveCandidates = [...rows.values()];
  return {
    version: GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION,
    mode: 'READ_ONLY_EXPERIMENTAL' as const,
    status: gateOpen && primitiveCandidates.length ? 'CANDIDATE' as const : 'OBSERVE' as const,
    source: { r460: input.outcome.version, r470: INTELLIGENT_LEARNING_R470_VERSION },
    target: {
      r510: GAMEPLAY_ENGINE_R510_VERSION,
      r510CalibrationStatus: GAMEPLAY_ENGINE_R510_CALIBRATION.status,
      certifiedForFinalWrite: GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite,
    },
    productionWriteAllowed: false as const,
    automaticApplyAllowed: false as const,
    humanReviewRequired: true as const,
    primitiveCandidates,
    unsupportedEvidenceActions: unsupportedEvidenceActions.sort(),
  };
}

const zero = () => ({
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
});

function sourceResult() {
  const attrs: any = {
    offensiveAwareness: 78,
    ballControl: 82,
    dribbling: 79,
    tightPossession: 80,
    lowPass: 80,
    loftedPass: 77,
    finishing: 68,
    heading: 62,
    placeKicking: 72,
    curl: 76,
    defensiveAwareness: 72,
    defensiveEngagement: 74,
    tackling: 70,
    aggression: 68,
    speed: 76,
    acceleration: 78,
    kickingPower: 72,
    jump: 64,
    physicalContact: 69,
    balance: 77,
    stamina: 84,
  };

  const parsed: any = {
    playerName: 'R516 Maestro',
    cardType: 'Epic',
    mainPosition: 'CMF',
    mainPositionPt: 'MLG',
    positions: ['CMF', 'DMF', 'AMF'],
    positionsPt: ['MLG', 'VOL', 'MAT'],
    positionRatings: { CMF: 100 },
    playstyle: 'Orquestrador',
    offensivePlaystyle: 'Orquestrador',
    defensivePlaystyle: 'Básico',
    defensivePlaystyleConfirmed: false,
    dominantFoot: 'Direito',
    overall: 100,
    maxOverall: 100,
    height: 178,
    weight: 72,
    trainingPointsTotal: 8,
    condition: {},
    impetos: [],
    nativeSkills: ['Passe de primeira'],
    additionalSkills: [],
    specialSkills: [],
    attributes: attrs,
    physicalProfile: {},
    manualConfirmed: true,
    evidence: {
      positionLocked: true,
      playstyleLocked: true,
      attributeCount: Object.keys(attrs).length,
      positionRatingsCount: 1,
      skillConfidence: 0.95,
      impetoSlotStatus: 'DISPONIVEL',
    },
    internalId: 'r516-maestro',
    confidence: 98,
    warnings: [],
  };

  return {
    objective: 'COMPETITIVE',
    parsed,
    bestPosition: { code: 'CMF', label: 'MLG', score: 100 },
    positionScores: [],
    pri: {},
    tacticalFit: {},
    training: zero(),
    trainingCost: zero(),
    trainingPointsUsed: 0,
    trainingPointsTotal: 8,
    trainingPointsRemaining: 8,
    trainingCostRule: '',
    trainingComparison: [],
    buildVariants: [],
    recommendationExplanation: [],
    tacticalProfile: { formation: '4-2-2-2', style: 'POSSE_DE_BOLA' },
    teamMap: {},
    profileTips: [],
    validation: { level: 'safe', confirmed: true, canGenerate: true, issues: [] },
    permittedPositions: [],
    avoidPositions: [],
    recommendedSkills: [],
    skillRecommendations: [],
    avoidSkills: [],
    recommendedImpetos: [],
    buildName: 'R516',
    strengths: [],
    weaknesses: [],
    usageTips: [],
    note: '',
    deepAnalysis: {},
    advancedTacticalFunction: {},
    specialSkillsAnalysis: {},
    physicalEngine: {},
    attributeGoals: {},
    advancedOptimizer: {},
    correctionLimit: {},
    marginalReturn: [],
    errorTolerance: {},
    skillPriority: {},
    usageFunctionR457: 'Orquestrador',
  } as any;
}

const analyzed: any = applyCleanSlatePerformance2027R119(sourceResult());
const created = createMatchValidationRecord(analyzed, {
  minutes: 90,
  overallRating: 1,
  passing: 1,
  movement: 3,
  finishing: 3,
  defending: 3,
  physical: 3,
  stamina: 3,
  tags: ['Passe lento'],
  note: '',
  mode: 'ranked',
  connection: 'stable',
  metrics: {
    goals: 0,
    assists: 0,
    passErrors: 7,
    tackles: 1,
    interceptions: 1,
    ballLosses: 2,
    dribblesCompleted: 2,
    shots: 1,
    progressivePasses: 1,
    keyPasses: 0,
  },
  inputDelayRating: 1,
});

const fingerprint = cardFingerprint(analyzed);
const shortAction = {
  id: 'short_creation',
  label: 'Tabela / passe curto',
  demand: 95,
  projectedGain: 4.5,
  projectedScore: 86,
  decisionConfidence: 96,
};

function poorRecord(index: number): MatchValidationRecord {
  return {
    ...created,
    id: `r516-poor-${index}`,
    cardFingerprint: fingerprint,
    playedAt: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
    sessionIdR462: `r516-session-${index}`,
    usageFunction: 'Orquestrador',
    connection: 'stable',
    inputDelayRating: 1,
    gameVersion: '6.0.0',
    gameplayEpoch: 'V6',
    passing: 1,
    overallRating: 1,
    movement: 3,
    finishing: 3,
    defending: 3,
    physical: 3,
    stamina: 3,
    tags: ['Passe lento'],
    metrics: {
      goals: 0,
      assists: 0,
      passErrors: 7,
      tackles: 1,
      interceptions: 1,
      ballLosses: 2,
      dribblesCompleted: 2,
      shots: 1,
      progressivePasses: 1,
      keyPasses: 0,
    },
    gameplayImpactSnapshotR460: {
      version: '40.80-r460-build-outcome-snapshot-v1',
      engineRevision: 'R459',
      usageFunction: 'Orquestrador',
      tacticalStyle: 'POSSE_DE_BOLA',
      formation: '4-2-2-2',
      actions: [shortAction],
    },
  } as MatchValidationRecord;
}

const records = Array.from({ length: 8 }, (_, index) => poorRecord(index + 1));
const outcome = buildBuildOutcomeCalibrationR460(analyzed, records);
assert.equal(outcome.status, 'ACTIVE',
  'R516 pré-condição: partidas reais repetidas precisam ativar o aprendizado R460.');
assert.equal(outcome.actions.find(item => item.id === 'short_creation')?.status, 'PERSISTENT_GAP');

const withOutcome: any = { ...analyzed, buildOutcomeCalibrationR460: outcome };
const learning = buildIntelligentLearningR470(withOutcome, records);
assert.equal(learning.proposal.status, 'PROPOSED',
  'R516 pré-condição: R470 precisa converter a lacuna persistente em proposta, não em mutação.');
assert.equal(learning.proposal.kind, 'CALIBRATION_WEIGHT');
assert.equal(learning.proposal.autoPromotionEligible, true,
  'Com amostra forte, R470 pode liberar revisão; isso nunca equivale a aplicar automaticamente.');

const seedBefore = JSON.parse(JSON.stringify(GAMEPLAY_ENGINE_R510_SEED_POLICY));
const bridge = buildIntegrationContractR516({ outcome, proposal: learning.proposal });

assert.equal(bridge.version, GAMEPLAY_CALIBRATION_BRIDGE_R516_VERSION);
assert.equal(bridge.status, 'CANDIDATE');
assert.equal(bridge.mode, 'READ_ONLY_EXPERIMENTAL');
assert.equal(bridge.productionWriteAllowed, false);
assert.equal(bridge.automaticApplyAllowed, false);
assert.equal(bridge.source.r460, outcome.version);
assert.equal(bridge.source.r470, learning.version);
assert.equal(bridge.target.r510CalibrationStatus, GAMEPLAY_ENGINE_R510_CALIBRATION.status);
assert.equal(bridge.target.certifiedForFinalWrite, false);

const shortCombination = bridge.primitiveCandidates.find(item => item.action === 'shortCombination');
assert.ok(shortCombination, 'short_creation do R460 precisa ter tradução explícita para shortCombination do R510.');
assert.ok((shortCombination?.suggestedMultiplier ?? 1) > 1,
  'Lacuna persistente de passe curto precisa gerar pressão experimental positiva no primitivo correspondente.');
assert.ok((shortCombination?.suggestedMultiplier ?? 99) <= 1.06,
  'R516 precisa herdar o teto conservador de 6% do R460.');
assert.ok(shortCombination?.evidenceActionIds.includes('short_creation'));
assert.deepEqual(GAMEPLAY_ENGINE_R510_SEED_POLICY, seedBefore,
  'R516 é read-only: derivar candidato não pode mutar a seed policy R510.');

const lifecycle = buildMotorLabLifecycleR472({
  ...withOutcome,
  intelligentLearningR470: learning,
  performanceLab2027R90: { evidenceStage: 'TESTADA', risk: 'BAIXO' },
} as any);
assert.equal(lifecycle.candidate.status, 'READY_FOR_REVIEW',
  'R516 deve chegar no máximo a revisão humana quando R470 e o Lab permitem.');
assert.equal(lifecycle.candidate.eligibleForReview, true);
assert.equal(lifecycle.production.locked, true);
assert.equal(lifecycle.promotion.automaticCodeMutation, false);
assert.equal(lifecycle.promotion.automaticBuildMutation, false);
assert.equal(lifecycle.promotion.humanApprovalRequired, true);

const observeOnly = buildIntegrationContractR516({
  outcome,
  proposal: {
    ...learning.proposal,
    kind: 'OBSERVE',
    status: 'OBSERVE',
    autoPromotionEligible: false,
  },
});
assert.equal(observeOnly.status, 'OBSERVE');
assert.deepEqual(observeOnly.primitiveCandidates, [],
  'R460 isolado não pode furar o gate R470 e produzir pressão de calibração aplicável.');

const unsupportedOutcome: any = {
  ...outcome,
  actions: [
    ...outcome.actions,
    {
      id: 'gk_position',
      label: 'Posicionamento do goleiro',
      status: 'PERSISTENT_GAP',
      demand: 95,
      projectedGain: 4,
      projectedScore: 85,
      observedScore: 30,
      effectiveMatches: 8,
      distinctSessions: 8,
      confidence: 95,
      learningMultiplier: 1.06,
      reason: 'Gap sintético de proteção R516.',
    },
  ],
};
const unsupported = buildIntegrationContractR516({
  outcome: unsupportedOutcome,
  proposal: learning.proposal,
});
assert.ok(unsupported.unsupportedEvidenceActions.includes('gk_position'),
  'Sem primitivo de GK no R510, R516 deve declarar a evidência como não suportada em vez de inventar mapeamento.');

console.log('R516 aprovado: contrato de integração partida real → R460 → R470 → R510/R472, read-only e sem novo runtime/writer.');
