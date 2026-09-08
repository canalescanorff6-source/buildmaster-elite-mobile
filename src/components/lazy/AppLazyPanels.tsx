'use client';

import dynamic from 'next/dynamic';
import { PanelLoadingFallback } from '@/components/PanelLoadingFallback';

const fallback = () => <PanelLoadingFallback />;

export {
  AccountAdminPanel,
  AdministrationSecurityCenter,
  AppCommandPalette,
  ArchitectureHealthPanel,
  BuildMasterAssistant,
  CleanVaultV3800,
  CloudSyncCenter,
  CommunitySharingCenter,
  CommercializationCenter,
  DeferredUpdateAutoCheckerR155,
  DelayResponsePanel,
  EfhubVisualCalibrator,
  EvolutionCommandCenter,
  FirstUseOnboarding,
  IdentityAppearancePanel,
  IntegratedHomePanel,
  IntegratedTeamLab,
  MatchLaboratory,
  MetaFormationStudioV3832,
  ObservabilitySupportCenter,
  OcrVisionCenter,
  OfficialRulesCenter,
  PhasePlaystyleSelectorR124,
  PlayerLaboratory,
  PlayStorePublicationCenter,
  PremiumExperience2Center,
  PremiumMenuScreen,
  PremiumQualityCenter,
  PremiumSearchScreen,
  PremiumSettingsOverview,
  ProductionReadinessCenter,
  ReaderImageSourceCardV4010,
  ReaderInterruptedCardV3840,
  ReaderLiveProgressCardV3840,
  RefinementCenterPanel,
  ResultCard,
  ReviewPanel,
  SmartQuickDock,
  SquadMappingCenter,
  StabilityDiagnosticsPanel,
  TeamFullMapPanel,
  TotalCardReaderPanel,
  UpdateCenterPanel
} from '@/components/lazy/CardVisionLazyPanelsR174';

export {
  preloadPanelGroup,
  preloadReaderSurfaceR161,
  type LazyPanelGroup,
} from '@/components/lazy/AppPanelPreloadR174';

export const SkillAndTrainingPanel = dynamic(
  () => import('@/components/DevelopmentPanels').then((module) => module.SkillAndTrainingPanel),
  { ssr: false, loading: fallback }
);

export const EliteEvolutionPanel = dynamic(
  () => import('@/components/EliteEvolutionPanels').then((module) => module.EliteEvolutionPanel),
  { ssr: false, loading: fallback }
);

export const VideoReviewPanel = dynamic(
  () => import('@/components/EliteEvolutionPanels').then((module) => module.VideoReviewPanel),
  { ssr: false, loading: fallback }
);

export const MetaBuildLabPanel = dynamic(
  () => import('@/components/MetaBuildLabPanel').then((module) => module.MetaBuildLabPanel),
  { ssr: false, loading: fallback }
);

export const CommunityIntelligencePanel = dynamic(
  () => import('@/components/CommunityIntelligencePanel').then((module) => module.CommunityIntelligencePanel),
  { ssr: false, loading: fallback }
);

export const CreatorBuildResearchPanel = dynamic(
  () => import('@/components/CreatorBuildResearchPanel').then((module) => module.CreatorBuildResearchPanel),
  { ssr: false, loading: fallback }
);


export const GlobalProLabV3900Panel = dynamic(
  () => import('@/components/GlobalProLabV3900Panel').then((module) => module.GlobalProLabV3900Panel),
  { ssr: false, loading: fallback }
);

export const EvolutionNotificationHub = dynamic(
  () => import('@/components/EvolutionNotificationHub').then((module) => module.EvolutionNotificationHub),
  { ssr: false, loading: () => <span className="evolution-hub-loading" aria-hidden="true" /> }
);

export const PrecisionBuildPanel = dynamic(
  () => import('@/components/PrecisionBuildPanel').then((module) => module.PrecisionBuildPanel),
  { ssr: false, loading: fallback }
);

export const FormationRoleLabPanel = dynamic(
  () => import('@/components/FormationRoleLabPanelV4080').then((module) => module.FormationRoleLabPanelV4080),
  { ssr: false, loading: fallback }
);

export const DecisionWeightPanel = dynamic(
  () => import('@/components/DecisionWeightPanel').then((module) => module.DecisionWeightPanel),
  { ssr: false, loading: fallback }
);

export const InvestmentTracePanel = dynamic(
  () => import('@/components/InvestmentTracePanel').then((module) => module.InvestmentTracePanel),
  { ssr: false, loading: fallback }
);

export const VerifiedCardRegistryPanel = dynamic(
  () => import('@/components/VerifiedCardRegistryPanel').then((module) => module.VerifiedCardRegistryPanel),
  { ssr: false, loading: fallback }
);

export const MatchValidationCenter = dynamic(
  () => import('@/components/MatchValidationCenter').then((module) => module.MatchValidationCenter),
  { ssr: false, loading: fallback }
);

export const ProfessionalIntelligenceCenter = dynamic(
  () => import('@/components/result/ProfessionalIntelligenceCenter').then((module) => module.ProfessionalIntelligenceCenter),
  { ssr: false, loading: fallback }
);

export const SinglePrintEvidencePanel = dynamic(
  () => import('@/components/SinglePrintEvidencePanel').then((module) => module.SinglePrintEvidencePanel),
  { ssr: false, loading: fallback }
);

export const CompactSharePanel = dynamic(
  () => import('@/components/CompactSharePanel').then((module) => module.CompactSharePanel),
  { ssr: false, loading: fallback }
);
