'use client';

import dynamic from 'next/dynamic';
import { PanelLoadingFallback } from '@/components/PanelLoadingFallback';
import { getRuntimeOptimizationProfile, shouldPreloadInBackground } from '@/lib/invisibleOptimizationV3820';
import { scheduleIdleTask } from '@/lib/performanceScheduler';

const fallback = () => <PanelLoadingFallback />;


export const ResultCard = dynamic(
  () => import('@/components/result/ResultWorkspace').then((module) => module.ResultCard),
  { ssr: false, loading: fallback }
);
export const ReviewPanel = dynamic(
  () => import('@/components/result/ResultWorkspace').then((module) => module.ReviewPanel),
  { ssr: false, loading: fallback }
);

export const PlayerLaboratory = dynamic(
  () => import('@/modules/players/PlayerLaboratory').then((module) => module.PlayerLaboratory),
  { ssr: false, loading: fallback }
);
export const IntegratedTeamLab = dynamic(
  () => import('@/modules/squad/IntegratedTeamLab').then((module) => module.IntegratedTeamLab),
  { ssr: false, loading: fallback }
);
export const MatchLaboratory = dynamic(
  () => import('@/modules/matches/MatchLaboratory').then((module) => module.MatchLaboratory),
  { ssr: false, loading: fallback }
);
export const BuildMasterAssistant = dynamic(
  () => import('@/modules/assistant/BuildMasterAssistant').then((module) => module.BuildMasterAssistant),
  { ssr: false, loading: fallback }
);
export const DelayResponsePanel = dynamic(
  () => import('@/components/DevelopmentPanels').then((module) => module.DelayResponsePanel),
  { ssr: false, loading: fallback }
);
export const SkillAndTrainingPanel = dynamic(
  () => import('@/components/DevelopmentPanels').then((module) => module.SkillAndTrainingPanel),
  { ssr: false, loading: fallback }
);
export const EliteEvolutionPanel = dynamic(
  () => import('@/components/EliteEvolutionPanels').then((module) => module.EliteEvolutionPanel),
  { ssr: false, loading: fallback }
);
export const StabilityDiagnosticsPanel = dynamic(
  () => import('@/components/EliteEvolutionPanels').then((module) => module.StabilityDiagnosticsPanel),
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
export const UpdateCenterPanel = dynamic(
  () => import('@/components/UpdateCenterPanel').then((module) => module.UpdateCenterPanel),
  { ssr: false, loading: fallback }
);
export const AccountAdminPanel = dynamic(
  () => import('@/components/AccountAdminPanel').then((module) => module.AccountAdminPanel),
  { ssr: false, loading: fallback }
);
export const EvolutionCommandCenter = dynamic(
  () => import('@/components/EvolutionCommandCenter').then((module) => module.EvolutionCommandCenter),
  { ssr: false, loading: fallback }
);
export const EvolutionNotificationHub = dynamic(
  () => import('@/components/EvolutionNotificationHub').then((module) => module.EvolutionNotificationHub),
  { ssr: false, loading: () => <span className="evolution-hub-loading" aria-hidden="true" /> }
);
export const SmartQuickDock = dynamic(
  () => import('@/components/SmartQuickDock').then((module) => module.SmartQuickDock),
  { ssr: false }
);
export const ProductionReadinessCenter = dynamic(
  () => import('@/modules/quality/ProductionReadinessCenter').then((module) => module.ProductionReadinessCenter),
  { ssr: false, loading: fallback }
);
export const PrecisionBuildPanel = dynamic(
  () => import('@/components/PrecisionBuildPanel').then((module) => module.PrecisionBuildPanel),
  { ssr: false, loading: fallback }
);
export const FormationRoleLabPanel = dynamic(
  () => import('@/components/FormationRoleLabPanel').then((module) => module.FormationRoleLabPanel),
  { ssr: false, loading: fallback }
);
export const FirstUseOnboarding = dynamic(
  () => import('@/components/FirstUseOnboarding').then((module) => module.FirstUseOnboarding),
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
export const TotalCardReaderPanel = dynamic(
  () => import('@/components/TotalCardReaderPanel').then((module) => module.TotalCardReaderPanel),
  { ssr: false, loading: fallback }
);
export const OcrVisionCenter = dynamic(
  () => import('@/modules/card-reader/OcrVisionCenter').then((module) => module.OcrVisionCenter),
  { ssr: false, loading: fallback }
);
export const OfficialRulesCenter = dynamic(
  () => import('@/modules/rules/OfficialRulesCenter').then((module) => module.OfficialRulesCenter),
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


export const PremiumExperience2Center = dynamic(
  () => import('@/modules/experience/PremiumExperience2Center').then((module) => module.PremiumExperience2Center),
  { ssr: false, loading: fallback }
);
export const ObservabilitySupportCenter = dynamic(
  () => import('@/modules/observability/ObservabilitySupportCenter').then((module) => module.ObservabilitySupportCenter),
  { ssr: false, loading: fallback }
);


export const CommunitySharingCenter = dynamic(
  () => import('@/modules/community/CommunitySharingCenter').then((module) => module.CommunitySharingCenter),
  { ssr: false, loading: fallback }
);
export const CommercializationCenter = dynamic(
  () => import('@/modules/commercial/CommercializationCenter').then((module) => module.CommercializationCenter),
  { ssr: false, loading: fallback }
);

export const PlayStorePublicationCenter = dynamic(
  () => import('@/modules/publication/PlayStorePublicationCenter').then((module) => module.PlayStorePublicationCenter),
  { ssr: false, loading: fallback }
);


export type LazyPanelGroup = 'inicio' | 'jogadores' | 'time' | 'partidas' | 'ajustes';

const PANEL_PRELOADERS: Record<LazyPanelGroup, Array<() => Promise<unknown>>> = {
  inicio: [
    () => import('@/components/EvolutionCommandCenter'),
    () => import('@/components/EvolutionNotificationHub'),
    () => import('@/components/SmartQuickDock')
  ],
  jogadores: [
    () => import('@/modules/players/PlayerLaboratory'),
    () => import('@/components/TotalCardReaderPanel'),
    () => import('@/components/SinglePrintEvidencePanel'),
    () => import('@/modules/card-reader/OcrVisionCenter'),
    () => import('@/components/PrecisionBuildPanel'),
    () => import('@/components/CreatorBuildResearchPanel'),
    () => import('@/components/GlobalProLabV3900Panel')
  ],
  time: [
    () => import('@/modules/squad/IntegratedTeamLab'),
    () => import('@/components/FormationRoleLabPanel')
  ],
  partidas: [
    () => import('@/modules/matches/MatchLaboratory'),
    () => import('@/components/MatchValidationCenter'),
    () => import('@/components/DevelopmentPanels')
  ],
  ajustes: [
    () => import('@/components/UpdateCenterPanel'),
    () => import('@/components/AccountAdminPanel'),
    () => import('@/components/EliteEvolutionPanels'),
    () => import('@/modules/quality/ProductionReadinessCenter'),
    () => import('@/modules/rules/OfficialRulesCenter'),
    () => import('@/modules/experience/PremiumExperience2Center'),
    () => import('@/modules/observability/ObservabilitySupportCenter'),
    () => import('@/modules/community/CommunitySharingCenter'),
    () => import('@/modules/commercial/CommercializationCenter'),
    () => import('@/modules/publication/PlayStorePublicationCenter')
  ]
};

const preloadedGroups = new Set<LazyPanelGroup>();
const preloadingGroups = new Set<LazyPanelGroup>();

function waitForIdle(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    scheduleIdleTask(resolve, timeout);
  });
}

export function preloadPanelGroup(group: LazyPanelGroup): void {
  if (typeof window === 'undefined' || preloadedGroups.has(group) || preloadingGroups.has(group)) return;
  if (!shouldPreloadInBackground()) return;

  const profile = getRuntimeOptimizationProfile();
  const limit = Math.min(PANEL_PRELOADERS[group].length, profile.preloadModuleLimit);
  if (limit <= 0) return;

  preloadingGroups.add(group);
  void (async () => {
    const loaders = PANEL_PRELOADERS[group].slice(0, limit);
    for (let index = 0; index < loaders.length; index += 1) {
      if (!shouldPreloadInBackground()) break;
      await loaders[index]().catch(() => undefined);
      if (index + 1 < loaders.length) await waitForIdle(profile.tier === 'high' ? 500 : 950);
    }
    preloadedGroups.add(group);
  })().finally(() => {
    preloadingGroups.delete(group);
  });
}
