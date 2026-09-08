'use client';

import { useMemo } from 'react';
import { comparePlayers } from '@/lib/playerComparisonR171';
import { buildSmartHomeSummary, type VaultFilterState, type VaultFolder } from '@/lib/vaultUsability';
import { inspectDataIntegrity } from '@/lib/dataSafety';
import { buildVaultBootstrapSummaryR173 } from '@/modules/vault/vaultBootstrapSummaryR173';
import { safeViewComputationR130 } from '@/modules/core/centralSafeViewR130';
import { createEfhubCalibrationMap, type EfhubCalibrationZone } from '@/modules/card-reader/efhubCalibrationModelR164';
import { countActiveVaultFiltersR151, filterVaultHistoryR151, listVaultPlaystylesR151, listVaultSkillsR151, type CardVisionHistoryFilterR151, type CardVisionHistorySortR151 } from '@/modules/vault/cardVisionVaultSelectorsR151';
import type { SavedAnalysis } from '@/modules/vault/cardHistoryStore';
import { buildDashboardStatsR200 as buildDashboardStats, resultHistoryKeyR200 as resultHistoryKey, sanitizeRuntimeHistoryR200 } from '@/modules/vault/cardHistoryStartupModelR200';
import type { AnalysisResult, PositionCode } from '@/modules/analysis';
import type { OcrZone } from '@/lib/ocrZonesModelR164';
import type { PremiumVisualPreset } from '@/lib/easyExperience';
import type { AppThemeR162, AccentThemeR162, TextScaleR162, DensityModeR162, MotionPreferenceR162, PerformanceModeR162 } from '@/modules/backup/cardVisionBackupControllerTypesR170';

export function useCardVisionDerivedStateR179(input: {
  history: SavedAnalysis[];
  result: AnalysisResult | null;
  activeHistoryId: string | null;
  historySearch: string;
  historyFilter: CardVisionHistoryFilterR151;
  historySort: CardVisionHistorySortR151;
  onlyPendingSkills: boolean;
  vaultFilters: VaultFilterState;
  comparePlayerIds: string[];
  comparePosition: PositionCode;
  visualPreset: PremiumVisualPreset;
  appTheme: AppThemeR162;
  accentTheme: AccentThemeR162;
  advancedMode: boolean;
  textScale: TextScaleR162;
  densityMode: DensityModeR162;
  motionPreference: MotionPreferenceR162;
  highContrast: boolean;
  performanceMode: PerformanceModeR162;
  ocrZones: OcrZone[];
  efhubCalibrationZones: EfhubCalibrationZone[];
  vaultFolders: VaultFolder[];
}) {
  const renderHistory = useMemo(
    () => safeViewComputationR130('history-render-sanitizer', () => sanitizeRuntimeHistoryR200(input.history), [] as SavedAnalysis[]),
    [input.history]
  );

  const activeSavedAnalysis = useMemo(() => safeViewComputationR130('active-saved-analysis', () => {
    if (!input.result) return null;
    const key = resultHistoryKey(input.result);
    return renderHistory.find((item) => item.id === input.activeHistoryId || item.saveKey === key) ?? null;
  }, null as SavedAnalysis | null), [renderHistory, input.activeHistoryId, input.result]);

  const filteredHistory = useMemo(() => safeViewComputationR130('vault-filtering', () => filterVaultHistoryR151({
    history: renderHistory,
    search: input.historySearch,
    filter: input.historyFilter,
    sort: input.historySort,
    onlyPendingSkills: input.onlyPendingSkills,
    advancedFilters: input.vaultFilters,
  }), [] as SavedAnalysis[]), [renderHistory, input.historySearch, input.historyFilter, input.historySort, input.onlyPendingSkills, input.vaultFilters]);

  const dashboardStats = useMemo(() => safeViewComputationR130('dashboard-stats', () => buildDashboardStats(renderHistory), { total: 0, pending: 0, complete: 0, favorites: 0, positions: 0, review: 0, skillsTotal: 0, skillsDone: 0, completion: 0 }), [renderHistory]);
  const cleanVaultSummary = useMemo(() => safeViewComputationR130('clean-vault-summary', () => buildVaultBootstrapSummaryR173(renderHistory), { players: 0, fichas: 0, archived: 0 }), [renderHistory]);
  const smartHome = useMemo(() => safeViewComputationR130('smart-home-summary', () => buildSmartHomeSummary(renderHistory), { total: 0, needsReview: 0, lowConfidence: 0, incomplete: 0, recentPlayer: null, nextAction: 'Criar a primeira ficha pelo Leitor Elite ou modo Manual Pro.', alerts: [] }), [renderHistory]);

  const localIntegrity = useMemo(() => safeViewComputationR130('local-integrity', () => inspectDataIntegrity({
    history: renderHistory,
    settings: { visualPreset: input.visualPreset, appTheme: input.appTheme, accentTheme: input.accentTheme, advancedMode: input.advancedMode, textScale: input.textScale, densityMode: input.densityMode, motionPreference: input.motionPreference, highContrast: input.highContrast, performanceMode: input.performanceMode },
    calibration: { ocrZones: input.ocrZones, efhubVisualMap: createEfhubCalibrationMap(input.efhubCalibrationZones) },
    folders: input.vaultFolders,
    plans: {},
  }), { score: 70, status: 'attention' as const, issues: [], totals: { sections: 0, records: renderHistory.length, malformed: 0 } }), [renderHistory, input.visualPreset, input.appTheme, input.accentTheme, input.advancedMode, input.textScale, input.densityMode, input.motionPreference, input.highContrast, input.performanceMode, input.ocrZones, input.efhubCalibrationZones, input.vaultFolders]);

  const availablePlaystyles = useMemo(() => safeViewComputationR130('available-playstyles', () => listVaultPlaystylesR151(renderHistory), [] as string[]), [renderHistory]);
  const availableSkills = useMemo(() => safeViewComputationR130('available-skills', () => listVaultSkillsR151(renderHistory), [] as string[]), [renderHistory]);
  const playerComparison = useMemo(() => safeViewComputationR130('player-comparison', () => comparePlayers(renderHistory.filter((item) => input.comparePlayerIds.includes(item.id)).map((item) => ({ id: item.id, result: item.result })), input.comparePosition), comparePlayers([], input.comparePosition)), [renderHistory, input.comparePlayerIds, input.comparePosition]);
  const activeVaultFilterCount = useMemo(() => countActiveVaultFiltersR151({ search: input.historySearch, filter: input.historyFilter, advancedFilters: input.vaultFilters }), [input.historySearch, input.historyFilter, input.vaultFilters]);

  return { renderHistory, activeSavedAnalysis, filteredHistory, dashboardStats, cleanVaultSummary, smartHome, localIntegrity, availablePlaystyles, availableSkills, playerComparison, activeVaultFilterCount };
}
