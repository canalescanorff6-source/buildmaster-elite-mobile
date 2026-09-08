import { getRuntimeOptimizationProfile, shouldPreloadInBackground } from '@/lib/invisibleOptimizationV3820';
import { scheduleIdleTask } from '@/lib/performanceScheduler';

let readerSurfacePreloadR161: Promise<unknown> | null = null;

export function preloadReaderSurfaceR161(): void {
  if (typeof window === 'undefined') return;
  if (!readerSurfacePreloadR161) {
    readerSurfacePreloadR161 = Promise.all([
      import('@/components/ReaderImageSourceCardV4010'),
      import('@/components/ReaderRecoveryAndProgressV3840'),
      import('@/components/PhasePlaystyleSelectorR124'),
    ]).catch(() => undefined);
  }
}

export type LazyPanelGroup = 'inicio' | 'jogadores' | 'time' | 'partidas' | 'ajustes';

const PANEL_PRELOADERS: Record<LazyPanelGroup, Array<() => Promise<unknown>>> = {
  inicio: [
    () => import('@/modules/core/IntegratedHomePanel'),
    () => import('@/components/EvolutionCommandCenter'),
    () => import('@/components/EvolutionNotificationHub'),
    () => import('@/components/SmartQuickDock')
  ],
  jogadores: [
    () => import('@/components/CleanVaultV3800'),
    () => import('@/components/EfhubVisualCalibrator'),
    () => import('@/modules/players/PlayerLaboratory'),
    () => import('@/components/TotalCardReaderPanel'),
    () => import('@/components/ReaderImageSourceCardV4010'),
    () => import('@/components/ReaderRecoveryAndProgressV3840'),
    () => import('@/components/PhasePlaystyleSelectorR124'),
    () => import('@/components/SinglePrintEvidencePanel'),
    () => import('@/modules/card-reader/OcrVisionCenter'),
    () => import('@/components/PrecisionBuildPanel'),
    () => import('@/components/CreatorBuildResearchPanel'),
    () => import('@/components/GlobalProLabV3900Panel')
  ],
  time: [
    () => import('@/modules/squad/TeamFullMapPanel'),
    () => import('@/modules/squad/IntegratedTeamLab'),
    () => import('@/modules/squad-mapping/SquadMappingCenter'),
    () => import('@/modules/tactical-studio/MetaFormationStudioV3832'),
    () => import('@/components/FormationRoleLabPanelV4080')
  ],
  partidas: [
    () => import('@/modules/matches/MatchLaboratory'),
    () => import('@/components/MatchValidationCenter'),
    () => import('@/components/DevelopmentPanels')
  ],
  ajustes: [
    () => import('@/components/PremiumSettingsOverview'),
    () => import('@/components/IdentityAppearancePanel'),
    () => import('@/components/RefinementCenterPanel'),
    () => import('@/components/UpdateCenterPanel'),
    () => import('@/modules/backup/CloudSyncCenter'),
    () => import('@/components/ArchitectureHealthPanel'),
    () => import('@/components/PremiumQualityCenter'),
    () => import('@/components/AccountAdminPanel'),
    () => import('@/modules/administration/AdministrationSecurityCenter'),
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
