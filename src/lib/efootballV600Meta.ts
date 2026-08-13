export const EFOOTBALL_V600_META_VERSION = '6.0.0' as const;
export const EFOOTBALL_V600_SEASON = 'eFootball 2027' as const;

export type V600TeamPlaystyle = 'SOBREPOSICAO' | 'LEGADO';
export type V600FormationPhase = 'ATAQUE' | 'DEFESA';

export const EFOOTBALL_V600_META = Object.freeze({
  version: EFOOTBALL_V600_META_VERSION,
  season: EFOOTBALL_V600_SEASON,
  live: true,
  checkedAt: '2026-08-13',
  features: {
    fluidFormation: true,
    dualPlayerPlaystyles: true,
    overloadTeamPlaystyle: true,
    dualManagerLinkUps: true,
    positionTrainingRuleChanged: true,
    defensiveAiRebalanced: true,
    receptionAndControlReworked: true,
    staminaCounterAttackRebalanced: true
  },
  officialSignals: {
    passLaneCorrectionDependsOnDefensiveEngagementAndInterception: true,
    automaticPassLaneCutsReduced: true,
    aiDefensiveReactionReduced: true,
    defensiveReactionDifferentiatedByAwareness: true,
    userDefenderFreedomIncreased: true,
    attackRunTimingReworked: true,
    receptionMovementReworked: true,
    dashDribbleMaxSpeedSlightlyReduced: true
  }
});

export const V600_ADAPTATION_POLICY = Object.freeze({
  neverClaimsToFixNetwork: true,
  prioritizesManualDefenceReliability: true,
  prioritizesFirstTouchAndShortPassingUnderDelay: true,
  preservesExactTrainingBudget: true,
  overallIsNotTarget: true,
  unknownPlaystylesAreNotAutoWeighted: true
});
