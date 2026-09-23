import type { PositionCode } from '@/lib/analyzerDomain';

export const GAMEPLAY_SCOUTING_R454_VERSION='40.80-r454-gameplay-scouting-v1' as const;
export const CURRENT_EFOOTBALL_GAME_VERSION_R457='6.0.0' as const;

export type GameplayScoutingConfidenceR454='ALTA'|'MEDIA'|'BAIXA';
export type GameplayScoutingSourceTypeR454='OFFICIAL'|'DATABASE'|'USER_GAMEPLAY'|'REVIEWER'|'COMMUNITY';
export type GameplayScoutingStatusR454='PENDING'|'READY'|'REVIEW_REQUIRED';
export type GameplayScoutingFitR454='EXCELENTE'|'BOM'|'ACEITAVEL'|'RUIM';

export type GameplayScoutingSourceR454={
  id:string;
  type:GameplayScoutingSourceTypeR454;
  label:string;
  gameVersion:string;
  observedAt:string;
  confidence:GameplayScoutingConfidenceR454;
  note?:string;
};

export type GameplayScoutingRoleR454={
  position:PositionCode;
  label:string;
  function:string;
  fit:GameplayScoutingFitR454;
  reason:string;
};

export type GameplayScoutingRecordR454={
  version:typeof GAMEPLAY_SCOUTING_R454_VERSION;
  cardId:string;
  gameVersion:string;
  status:GameplayScoutingStatusR454;
  confidence:GameplayScoutingConfidenceR454;
  sourceTypes:GameplayScoutingSourceTypeR454[];
  sources:GameplayScoutingSourceR454[];
  testedPositions:PositionCode[];
  bestRoles:GameplayScoutingRoleR454[];
  acceptableRoles:GameplayScoutingRoleR454[];
  badRoles:GameplayScoutingRoleR454[];
  testedByUser:boolean;
  lastReviewed:string|null;
  notes?:string[];
};
