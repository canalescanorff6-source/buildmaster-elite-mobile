import type { TacticalFormation, TacticalStyle } from './analyzerDomain';

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
