import type { ProjectedPlayerStateR504 } from './projectedPlayerStateR504';
import {
  analyzeGameplayEngineR510,
  type GameplayActionIdR510,
  type GameplayEngineContextR510,
  type GameplayEngineResultR510,
} from './gameplayEngineR510';

export const POSSESSION_ENGINE_R511_VERSION = '40.80-r511-possession-action-profile-v1' as const;

export const POSSESSION_ENGINE_R511_CALIBRATION = {
  status: 'PROVISIONAL_UNCALIBRATED',
  provenance: 'ENGINEERING_SEED',
  officialGameData: false,
  certifiedForFinalWrite: false,
  inheritsGameplayCalibration: 'R510',
  calibrationRequired: ['GOLDEN_CARD_LAB', 'REAL_MATCH_DATA'],
} as const;

export const POSSESSION_ACTION_IDS_R511 = [
  'receiveUnderPressure',
  'orientedFirstTouch',
  'turn',
  'protect',
  'shortOption',
  'wallPass',
  'safePass',
  'lineBreakPass',
  'shortCarry',
  'centralProgression',
  'reposition',
  'counterPress',
  'exitUnderPressure',
] as const;

export type PossessionActionIdR511 = typeof POSSESSION_ACTION_IDS_R511[number];

export type PossessionUsageFunctionR511 =
  | 'CF_FINISHER'
  | 'CF_PIVOT'
  | 'SS_ASSOCIATIVE'
  | 'AMF_INFILTRATOR'
  | 'CMF_ORGANIZER'
  | 'CMF_BOX_TO_BOX'
  | 'DMF_PROTECTOR'
  | 'CB_BUILDER'
  | 'FULLBACK_DEFENSIVE';

type PriorityR511 = 1 | 2 | 3 | 4 | 5;
type ActionPrioritiesR511 = Record<PossessionActionIdR511, PriorityR511>;
type PrimitiveMixR511 = readonly { action: GameplayActionIdR510; share: number }[];

const R510_ACTION_IDS_R511: readonly GameplayActionIdR510[] = [
  'firstTouchUnderPressure',
  'shortCombination',
  'lineBreakingPass',
  'centralCarry',
  'pressEscape',
  'duelShield',
  'attackingMovement',
  'finishingAction',
  'defensiveDuel',
  'aerialDuel',
];

export const POSSESSION_ENGINE_R511_SEED_POLICY: {
  actionComposition: Record<PossessionActionIdR511, PrimitiveMixR511>;
  functionPriorities: Record<PossessionUsageFunctionR511, ActionPrioritiesR511>;
} = {
  actionComposition: {
    receiveUnderPressure: [
      { action: 'firstTouchUnderPressure', share: 1 },
    ],
    orientedFirstTouch: [
      { action: 'firstTouchUnderPressure', share: 3 },
      { action: 'centralCarry', share: 2 },
    ],
    turn: [
      { action: 'pressEscape', share: 3 },
      { action: 'centralCarry', share: 2 },
    ],
    protect: [
      { action: 'duelShield', share: 3 },
      { action: 'firstTouchUnderPressure', share: 1 },
    ],
    shortOption: [
      { action: 'shortCombination', share: 3 },
      { action: 'attackingMovement', share: 2 },
    ],
    wallPass: [
      { action: 'shortCombination', share: 3 },
      { action: 'lineBreakingPass', share: 2 },
    ],
    safePass: [
      { action: 'shortCombination', share: 3 },
      { action: 'pressEscape', share: 1 },
    ],
    lineBreakPass: [
      { action: 'lineBreakingPass', share: 1 },
    ],
    shortCarry: [
      { action: 'centralCarry', share: 3 },
      { action: 'pressEscape', share: 1 },
    ],
    centralProgression: [
      { action: 'lineBreakingPass', share: 3 },
      { action: 'centralCarry', share: 2 },
    ],
    reposition: [
      { action: 'attackingMovement', share: 3 },
      { action: 'shortCombination', share: 2 },
    ],
    counterPress: [
      { action: 'defensiveDuel', share: 3 },
      { action: 'attackingMovement', share: 1 },
    ],
    exitUnderPressure: [
      { action: 'pressEscape', share: 3 },
      { action: 'shortCombination', share: 2 },
    ],
  },
  functionPriorities: {
    CF_FINISHER: {
      receiveUnderPressure: 4,
      orientedFirstTouch: 4,
      turn: 4,
      protect: 3,
      shortOption: 3,
      wallPass: 3,
      safePass: 2,
      lineBreakPass: 2,
      shortCarry: 3,
      centralProgression: 3,
      reposition: 5,
      counterPress: 2,
      exitUnderPressure: 3,
    },
    CF_PIVOT: {
      receiveUnderPressure: 5,
      orientedFirstTouch: 3,
      turn: 3,
      protect: 5,
      shortOption: 4,
      wallPass: 5,
      safePass: 3,
      lineBreakPass: 2,
      shortCarry: 2,
      centralProgression: 3,
      reposition: 3,
      counterPress: 2,
      exitUnderPressure: 4,
    },
    SS_ASSOCIATIVE: {
      receiveUnderPressure: 5,
      orientedFirstTouch: 5,
      turn: 5,
      protect: 3,
      shortOption: 5,
      wallPass: 5,
      safePass: 4,
      lineBreakPass: 4,
      shortCarry: 4,
      centralProgression: 5,
      reposition: 4,
      counterPress: 2,
      exitUnderPressure: 5,
    },
    AMF_INFILTRATOR: {
      receiveUnderPressure: 4,
      orientedFirstTouch: 5,
      turn: 4,
      protect: 2,
      shortOption: 4,
      wallPass: 4,
      safePass: 3,
      lineBreakPass: 4,
      shortCarry: 4,
      centralProgression: 5,
      reposition: 5,
      counterPress: 3,
      exitUnderPressure: 4,
    },
    CMF_ORGANIZER: {
      receiveUnderPressure: 5,
      orientedFirstTouch: 4,
      turn: 4,
      protect: 3,
      shortOption: 5,
      wallPass: 4,
      safePass: 5,
      lineBreakPass: 5,
      shortCarry: 3,
      centralProgression: 5,
      reposition: 5,
      counterPress: 2,
      exitUnderPressure: 5,
    },
    CMF_BOX_TO_BOX: {
      receiveUnderPressure: 4,
      orientedFirstTouch: 4,
      turn: 3,
      protect: 3,
      shortOption: 4,
      wallPass: 3,
      safePass: 4,
      lineBreakPass: 3,
      shortCarry: 4,
      centralProgression: 4,
      reposition: 5,
      counterPress: 5,
      exitUnderPressure: 4,
    },
    DMF_PROTECTOR: {
      receiveUnderPressure: 4,
      orientedFirstTouch: 3,
      turn: 3,
      protect: 4,
      shortOption: 5,
      wallPass: 3,
      safePass: 5,
      lineBreakPass: 3,
      shortCarry: 2,
      centralProgression: 3,
      reposition: 5,
      counterPress: 5,
      exitUnderPressure: 5,
    },
    CB_BUILDER: {
      receiveUnderPressure: 4,
      orientedFirstTouch: 3,
      turn: 2,
      protect: 4,
      shortOption: 4,
      wallPass: 2,
      safePass: 5,
      lineBreakPass: 4,
      shortCarry: 2,
      centralProgression: 4,
      reposition: 5,
      counterPress: 3,
      exitUnderPressure: 5,
    },
    FULLBACK_DEFENSIVE: {
      receiveUnderPressure: 3,
      orientedFirstTouch: 3,
      turn: 2,
      protect: 4,
      shortOption: 4,
      wallPass: 2,
      safePass: 5,
      lineBreakPass: 3,
      shortCarry: 2,
      centralProgression: 2,
      reposition: 5,
      counterPress: 4,
      exitUnderPressure: 4,
    },
  },
};

export type PossessionActionScoreR511 = {
  action: PossessionActionIdR511;
  priority: PriorityR511;
  score: number;
  coverage: number;
};

export type PossessionAnalysisInputR511 = {
  usageFunction: PossessionUsageFunctionR511;
};

export type PossessionEngineResultR511 = {
  version: typeof POSSESSION_ENGINE_R511_VERSION;
  source: 'GAMEPLAY_ENGINE_R510';
  style: 'POSSESSION_CENTRAL';
  usageFunction: PossessionUsageFunctionR511;
  calibration: typeof POSSESSION_ENGINE_R511_CALIBRATION;
  actionPriorities: ActionPrioritiesR511;
  actionScores: Record<PossessionActionIdR511, PossessionActionScoreR511>;
  possessionScore: number;
  coverage: number;
  r510Context: GameplayEngineContextR510;
  gameplay: GameplayEngineResultR510;
};

function buildR510ContextR511(priorities: ActionPrioritiesR511): GameplayEngineContextR510 {
  const actionWeights = Object.fromEntries(
    R510_ACTION_IDS_R511.map((action) => [action, 0]),
  ) as Record<GameplayActionIdR510, number>;

  for (const possessionAction of POSSESSION_ACTION_IDS_R511) {
    const priority = priorities[possessionAction];
    const mix = POSSESSION_ENGINE_R511_SEED_POLICY.actionComposition[possessionAction];
    const totalShare = mix.reduce((sum, item) => sum + item.share, 0);
    if (totalShare <= 0) continue;

    for (const item of mix) {
      actionWeights[item.action] += priority * (item.share / totalShare);
    }
  }

  return { actionWeights };
}

function scorePossessionActionR511(
  gameplay: GameplayEngineResultR510,
  action: PossessionActionIdR511,
  priority: PriorityR511,
): PossessionActionScoreR511 {
  const mix = POSSESSION_ENGINE_R511_SEED_POLICY.actionComposition[action];
  const totalShare = mix.reduce((sum, item) => sum + item.share, 0);
  let score = 0;
  let coverage = 0;

  for (const item of mix) {
    const ratio = totalShare > 0 ? item.share / totalShare : 0;
    score += gameplay.actionScores[item.action].score * ratio;
    coverage += gameplay.actionScores[item.action].coverage * ratio;
  }

  return { action, priority, score, coverage };
}

function scoreAllPossessionActionsR511(
  gameplay: GameplayEngineResultR510,
  priorities: ActionPrioritiesR511,
): Record<PossessionActionIdR511, PossessionActionScoreR511> {
  return Object.fromEntries(
    POSSESSION_ACTION_IDS_R511.map((action) => [
      action,
      scorePossessionActionR511(gameplay, action, priorities[action]),
    ]),
  ) as Record<PossessionActionIdR511, PossessionActionScoreR511>;
}

function aggregatePossessionR511(
  scores: Record<PossessionActionIdR511, PossessionActionScoreR511>,
): { score: number; coverage: number } {
  let totalPriority = 0;
  let weightedScore = 0;
  let weightedCoverage = 0;

  for (const action of POSSESSION_ACTION_IDS_R511) {
    const row = scores[action];
    totalPriority += row.priority;
    weightedScore += row.score * row.priority;
    weightedCoverage += row.coverage * row.priority;
  }

  if (totalPriority <= 0) return { score: 0, coverage: 0 };
  return {
    score: weightedScore / totalPriority,
    coverage: weightedCoverage / totalPriority,
  };
}

export function analyzePossessionR511(
  state: ProjectedPlayerStateR504,
  input: PossessionAnalysisInputR511,
): PossessionEngineResultR511 {
  const priorities = {
    ...POSSESSION_ENGINE_R511_SEED_POLICY.functionPriorities[input.usageFunction],
  };
  const r510Context = buildR510ContextR511(priorities);
  const gameplay = analyzeGameplayEngineR510(state, r510Context);
  const actionScores = scoreAllPossessionActionsR511(gameplay, priorities);
  const aggregate = aggregatePossessionR511(actionScores);

  return {
    version: POSSESSION_ENGINE_R511_VERSION,
    source: 'GAMEPLAY_ENGINE_R510',
    style: 'POSSESSION_CENTRAL',
    usageFunction: input.usageFunction,
    calibration: POSSESSION_ENGINE_R511_CALIBRATION,
    actionPriorities: priorities,
    actionScores,
    possessionScore: aggregate.score,
    coverage: aggregate.coverage,
    r510Context,
    gameplay,
  };
}
