'use client';

import dynamic from 'next/dynamic';
import { PanelLoadingFallback } from '@/components/PanelLoadingFallback';

const fallback = () => <PanelLoadingFallback />;
export const AccountAdminPanel = dynamic(() => import('@/components/AccountAdminPanel').then((module) => module.AccountAdminPanel), { ssr: false, loading: fallback });
export const AdministrationSecurityCenter = dynamic(() => import('@/modules/administration/AdministrationSecurityCenter').then((module) => module.AdministrationSecurityCenter), { ssr: false, loading: fallback });
export const AppCommandPalette = dynamic(() => import('@/components/AppCommandPalette').then((module) => module.AppCommandPalette), { ssr: false, loading: fallback });
export const ArchitectureHealthPanel = dynamic(() => import('@/components/ArchitectureHealthPanel').then((module) => module.ArchitectureHealthPanel), { ssr: false, loading: fallback });
export const BuildMasterAssistant = dynamic(() => import('@/modules/assistant/BuildMasterAssistant').then((module) => module.BuildMasterAssistant), { ssr: false, loading: fallback });
export const CleanVaultV3800 = dynamic(() => import('@/components/CleanVaultV3800').then((module) => module.CleanVaultV3800), { ssr: false, loading: fallback });
export const CardVisionSettingsWorkspaceR190 = dynamic(() => import('@/components/settings/CardVisionSettingsWorkspaceR190').then((module) => module.CardVisionSettingsWorkspaceR190), { ssr: false, loading: fallback });
export const CardVisionVaultWorkspaceR191 = dynamic(() => import('@/components/vault/CardVisionVaultWorkspaceR191').then((module) => module.CardVisionVaultWorkspaceR191), { ssr: false, loading: fallback });
export const CloudSyncCenter = dynamic(() => import('@/modules/backup/CloudSyncCenter').then((module) => module.CloudSyncCenter), { ssr: false, loading: fallback });
export const CommunitySharingCenter = dynamic(() => import('@/modules/community/CommunitySharingCenter').then((module) => module.CommunitySharingCenter), { ssr: false, loading: fallback });
export const CommercializationCenter = dynamic(() => import('@/modules/commercial/CommercializationCenter').then((module) => module.CommercializationCenter), { ssr: false, loading: fallback });

export const DeferredUpdateAutoCheckerR155 = dynamic(
  () => import('@/components/UpdateCenterPanel').then((module) => module.UpdateAutoChecker),
  { ssr: false, loading: () => null }
);
export const DelayResponsePanel = dynamic(() => import('@/components/DevelopmentPanels').then((module) => module.DelayResponsePanel), { ssr: false, loading: fallback });
export const EfhubVisualCalibrator = dynamic(() => import('@/components/EfhubVisualCalibrator').then((module) => module.EfhubVisualCalibrator), { ssr: false, loading: fallback });
export const EvolutionCommandCenter = dynamic(() => import('@/components/EvolutionCommandCenter').then((module) => module.EvolutionCommandCenter), { ssr: false, loading: fallback });
export const FirstUseOnboarding = dynamic(() => import('@/components/FirstUseOnboarding').then((module) => module.FirstUseOnboarding), { ssr: false, loading: fallback });
export const IdentityAppearancePanel = dynamic(() => import('@/components/IdentityAppearancePanel').then((module) => module.IdentityAppearancePanel), { ssr: false, loading: fallback });
export const IntegratedHomePanel = dynamic(() => import('@/modules/core/IntegratedHomePanel').then((module) => module.IntegratedHomePanel), { ssr: false, loading: fallback });
export const IntegratedTeamLab = dynamic(() => import('@/modules/squad/IntegratedTeamLab').then((module) => module.IntegratedTeamLab), { ssr: false, loading: fallback });
export const MatchLaboratory = dynamic(() => import('@/modules/matches/MatchLaboratory').then((module) => module.MatchLaboratory), { ssr: false, loading: fallback });
export const MetaFormationStudioV3832 = dynamic(() => import('@/modules/tactical-studio/MetaFormationStudioV3832').then((module) => module.MetaFormationStudioV3832), { ssr: false, loading: fallback });
export const ObservabilitySupportCenter = dynamic(() => import('@/modules/observability/ObservabilitySupportCenter').then((module) => module.ObservabilitySupportCenter), { ssr: false, loading: fallback });
export const OcrVisionCenter = dynamic(() => import('@/modules/card-reader/OcrVisionFeatureGateR178').then((module) => module.OcrVisionFeatureGateR178), { ssr: false, loading: fallback });
export const OfficialRulesCenter = dynamic(() => import('@/modules/rules/OfficialRulesCenter').then((module) => module.OfficialRulesCenter), { ssr: false, loading: fallback });
export const PhasePlaystyleSelectorR124 = dynamic(() => import('@/components/PhasePlaystyleSelectorR124').then((module) => module.PhasePlaystyleSelectorR124), { ssr: false, loading: fallback });
export const PlayerLaboratory = dynamic(() => import('@/modules/players/PlayerLaboratory').then((module) => module.PlayerLaboratory), { ssr: false, loading: fallback });
export const PlayStorePublicationCenter = dynamic(() => import('@/modules/publication/PlayStorePublicationCenter').then((module) => module.PlayStorePublicationCenter), { ssr: false, loading: fallback });
export const PremiumExperience2Center = dynamic(() => import('@/modules/experience/PremiumExperience2Center').then((module) => module.PremiumExperience2Center), { ssr: false, loading: fallback });
export const PremiumMenuScreen = dynamic(() => import('@/components/PremiumMenuScreen').then((module) => module.PremiumMenuScreen), { ssr: false, loading: fallback });
export const PremiumQualityCenter = dynamic(() => import('@/components/PremiumQualityCenter').then((module) => module.PremiumQualityCenter), { ssr: false, loading: fallback });
export const PremiumSearchScreen = dynamic(() => import('@/components/PremiumSearchScreen').then((module) => module.PremiumSearchScreen), { ssr: false, loading: fallback });
export const PremiumSettingsOverview = dynamic(() => import('@/components/PremiumSettingsOverview').then((module) => module.PremiumSettingsOverview), { ssr: false, loading: fallback });
export const ProductionReadinessCenter = dynamic(() => import('@/modules/quality/ProductionReadinessCenter').then((module) => module.ProductionReadinessCenter), { ssr: false, loading: fallback });
export const ReaderImageSourceCardV4010 = dynamic(() => import('@/components/ReaderImageSourceCardV4010').then((module) => module.ReaderImageSourceCardV4010), { ssr: false, loading: fallback });
export const ReaderInterruptedCardV3840 = dynamic(() => import('@/components/ReaderRecoveryAndProgressV3840').then((module) => module.ReaderInterruptedCardV3840), { ssr: false, loading: fallback });
export const ReaderLiveProgressCardV3840 = dynamic(() => import('@/components/ReaderRecoveryAndProgressV3840').then((module) => module.ReaderLiveProgressCardV3840), { ssr: false, loading: fallback });
export const RefinementCenterPanel = dynamic(() => import('@/components/RefinementCenterPanel').then((module) => module.RefinementCenterPanel), { ssr: false, loading: fallback });
export const ResultCard = dynamic(() => import('@/components/result/ResultWorkspace').then((module) => module.ResultCard), { ssr: false, loading: fallback });
export const ReviewPanel = dynamic(() => import('@/components/result/ResultReviewPanelR189').then((module) => module.ReviewPanel), { ssr: false, loading: fallback });

export const SmartQuickDock = dynamic(
  () => import('@/components/SmartQuickDock').then((module) => module.SmartQuickDock),
  { ssr: false }
);
export const SquadMappingCenter = dynamic(() => import('@/modules/squad-mapping/SquadMappingCenter').then((module) => module.SquadMappingCenter), { ssr: false, loading: fallback });
export const StabilityDiagnosticsPanel = dynamic(() => import('@/components/EliteEvolutionPanels').then((module) => module.StabilityDiagnosticsPanel), { ssr: false, loading: fallback });
export const TeamFullMapPanel = dynamic(() => import('@/modules/squad/TeamFullMapPanel').then((module) => module.TeamFullMapPanel), { ssr: false, loading: fallback });
export const TotalCardReaderPanel = dynamic(() => import('@/components/TotalCardReaderPanel').then((module) => module.TotalCardReaderPanel), { ssr: false, loading: fallback });
export const UpdateCenterPanel = dynamic(() => import('@/components/UpdateCenterPanel').then((module) => module.UpdateCenterPanel), { ssr: false, loading: fallback });

export type CardVisionLazyPanelGroupR174 = 'inicio' | 'jogadores' | 'time' | 'partidas' | 'ajustes';

export function preloadCardVisionPanelGroupR174(group: CardVisionLazyPanelGroupR174): void {
  void import('@/components/lazy/AppPanelPreloadR174')
    .then(({ preloadPanelGroup }) => preloadPanelGroup(group))
    .catch(() => undefined);
}

export function preloadCardVisionReaderSurfaceR174(): void {
  void import('@/components/lazy/AppPanelPreloadR174')
    .then(({ preloadReaderSurfaceR161 }) => preloadReaderSurfaceR161())
    .catch(() => undefined);
}

