'use client';

import dynamic from 'next/dynamic';
import { PanelLoadingFallback } from '@/components/PanelLoadingFallback';

const fallback = () => <PanelLoadingFallback />;

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
export const TotalCardReaderPanel = dynamic(
  () => import('@/components/TotalCardReaderPanel').then((module) => module.TotalCardReaderPanel),
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
    () => import('@/components/PrecisionBuildPanel'),
    () => import('@/components/CreatorBuildResearchPanel')
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
    () => import('@/components/EliteEvolutionPanels')
  ]
};

const preloadedGroups = new Set<LazyPanelGroup>();

export function preloadPanelGroup(group: LazyPanelGroup): void {
  if (typeof window === 'undefined' || preloadedGroups.has(group)) return;
  preloadedGroups.add(group);
  for (const loader of PANEL_PRELOADERS[group]) {
    void loader().catch(() => {
      // O carregamento normal continua disponível mesmo se o prefetch falhar.
    });
  }
}
