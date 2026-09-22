import type { PositionCode, TacticalFormation, TacticalStyle } from './analyzerDomain';

export const ONBOARDING_STORAGE_KEY = 'buildmaster_onboarding_v2680';
export const CARD_REGISTRY_STORAGE_KEY = 'buildmaster_verified_card_registry_v2680';
export const MATCH_VALIDATION_STORAGE_KEY = 'buildmaster_match_validation_v2680';
export const CREATOR_BUILD_RESEARCH_EVENT = 'buildmaster:creator-build-research-updated';
export const COMPETITIVE_FUSION_EVENT = 'buildmaster:competitive-fusion-updated';
export const GLOBAL_PRO_BUILD_EVENT = 'buildmaster:global-pro-builds-updated';

export type ExperienceMode = 'simple' | 'advanced';

export type OnboardingProfile = {
  version: 1;
  completedAt: string;
  experienceMode: ExperienceMode;
  favoriteFormation: TacticalFormation;
  teamStyle: TacticalStyle;
  goal: 'fichas' | 'elenco' | 'formacoes' | 'treino';
};


export type MatchValidationRating = 1 | 2 | 3 | 4 | 5;
export type MatchValidationMode = 'ranked' | 'events' | 'friendly' | 'offline';
export type MatchConnectionState = 'stable' | 'variable' | 'high_delay';

export type MatchPerformanceMetrics = {
  goals: number;
  assists: number;
  passErrors: number;
  tackles: number;
  interceptions: number;
  ballLosses: number;
  dribblesCompleted: number;
  shots: number;
  saves?: number;
  goalsConceded?: number;
  clearances?: number;
  blocks?: number;
  aerialDuelsWon?: number;
  duelsWon?: number;
  recoveries?: number;
  progressivePasses?: number;
  keyPasses?: number;
  shotsOnTarget?: number;
  runsBehind?: number;
  successfulPressures?: number;
};

export type GameplayImpactSnapshotActionR460 = {
  id: string;
  label: string;
  demand: number;
  projectedGain: number;
  projectedScore: number;
  decisionConfidence: number;
};

export type GameplayImpactSnapshotR460 = {
  version: '40.80-r460-build-outcome-snapshot-v1';
  engineRevision: string;
  usageFunction: string;
  tacticalStyle: string;
  formation: string;
  actions: GameplayImpactSnapshotActionR460[];
};

export type MatchValidationRecord = {
  id: string;
  cardFingerprint: string;
  playerName: string;
  targetPosition: PositionCode;
  formation: TacticalFormation;
  teamStyle: TacticalStyle;
  buildName: string;
  buildSignature: string;
  playedAt: string;
  minutes: number;
  overallRating: MatchValidationRating;
  passing: MatchValidationRating;
  movement: MatchValidationRating;
  finishing: MatchValidationRating;
  defending: MatchValidationRating;
  physical: MatchValidationRating;
  stamina: MatchValidationRating;
  tags: string[];
  note: string;
  mode?: MatchValidationMode;
  connection?: MatchConnectionState;
  gameplayProfileId?: string;
  secondHalfDrop?: boolean;
  metrics?: MatchPerformanceMetrics;
  testedBuildId?: string;
  testedBuildTitle?: string;
  testedBoosterName?: string;
  experimentArm?: 'A' | 'B' | 'NONE';
  controlStyle?: 'quick-pass' | 'carry-dribble' | 'mixed' | 'manual-defense';
  inputDelayRating?: 1 | 2 | 3 | 4 | 5;
  gameSeason?: string;
  gameVersion?: string;
  gameplayEpoch?: 'V6' | 'LEGACY' | string;
  usageFunction?: string;
  usageContextSignatureR460?: string;
  gameplayImpactSnapshotR460?: GameplayImpactSnapshotR460;
  actionRatingsR461?: Record<string, MatchValidationRating>;
  sessionIdR462?: string;
  buildGenerationSignatureR464?: string;
  observedMetricKeysR468?: Array<keyof MatchPerformanceMetrics>;
};
