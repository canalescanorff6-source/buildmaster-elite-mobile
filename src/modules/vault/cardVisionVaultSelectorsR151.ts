import { POSITION_PT, type PositionCode } from '@/lib/analyzerDomain';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import { entryMatchesAdvancedFilters, folderForEntry, type VaultFilterState } from '@/lib/vaultUsability';
import type { SavedAnalysis } from './cardHistoryStore';
import { memoryKeyR200 as memoryKey, savedPositionGroupR200 as savedPositionGroup, savedStatusLabelR200 as savedStatusLabel, skillProgressInfoR200 as skillProgressInfo } from './cardHistoryStartupModelR200';

export const CARDVISION_VAULT_SELECTORS_R151_VERSION = '40.80-r151-vault-selectors-v1' as const;

export type CardVisionHistoryFilterR151 = 'ALL' | PositionCode | 'PENDING' | 'COMPLETE' | 'FAVORITES' | 'REVIEW';
export type CardVisionHistorySortR151 = 'UPDATED' | 'NAME' | 'POSITION' | 'PENDING' | 'STATUS';

export function createDefaultVaultFilterStateR151(): VaultFilterState {
  return {
    folderId: 'all',
    position: 'ALL',
    playstyle: '',
    skill: '',
    minConfidence: 0,
    maxConfidence: 100,
    minEfficiency: 0,
    favoritesOnly: false,
    pendingOnly: false,
    reviewOnly: false,
  };
}

export function filterVaultHistoryR151(input: {
  history: SavedAnalysis[];
  search: string;
  filter: CardVisionHistoryFilterR151;
  sort: CardVisionHistorySortR151;
  onlyPendingSkills: boolean;
  advancedFilters: VaultFilterState;
}): SavedAnalysis[] {
  const query = memoryKey(input.search);
  const items = input.history.filter((item) => {
    const usageLabel = POSITION_PT[analysisUsagePositionR138(item.result)];
    const searchable = `${item.result.parsed.playerName} ${usageLabel} ${item.result.bestPosition.label} ${item.result.buildName} ${item.result.parsed.playstyle ?? ''} ${(item.result.parsed.nativeSkills ?? []).join(' ')} ${(item.result.recommendedSkills ?? []).join(' ')} ${(item.personalTags ?? []).join(' ')} ${item.notes ?? ''} ${item.tacticalRoleNote ?? ''}`;
    const matchesQuery = !query || memoryKey(searchable).includes(query);
    if (!matchesQuery || !entryMatchesAdvancedFilters(item, input.advancedFilters)) return false;
    if (input.advancedFilters.folderId === 'all' && folderForEntry(item) === 'arquivados') return false;
    if (input.onlyPendingSkills && savedStatusLabel(item) !== 'pendente') return false;
    if (input.filter === 'FAVORITES') return Boolean(item.favorite);
    if (input.filter === 'PENDING') return savedStatusLabel(item) === 'pendente';
    if (input.filter === 'COMPLETE') return savedStatusLabel(item) === 'completo';
    if (input.filter === 'REVIEW') return savedStatusLabel(item) === 'revisar';
    if (input.filter !== 'ALL') return savedPositionGroup(item) === input.filter;
    return true;
  });

  return [...items].sort((a, b) => {
    if (input.sort === 'NAME') return a.result.parsed.playerName.localeCompare(b.result.parsed.playerName, 'pt-BR');
    if (input.sort === 'POSITION') return POSITION_PT[analysisUsagePositionR138(a.result)].localeCompare(POSITION_PT[analysisUsagePositionR138(b.result)], 'pt-BR');
    if (input.sort === 'PENDING') {
      const ai = skillProgressInfo(a.result.recommendedSkills, a.skillProgress);
      const bi = skillProgressInfo(b.result.recommendedSkills, b.skillProgress);
      return (bi.total - bi.done) - (ai.total - ai.done);
    }
    return String(b.updatedAt || b.savedAt).localeCompare(String(a.updatedAt || a.savedAt), 'pt-BR');
  });
}

export function listVaultPlaystylesR151(history: SavedAnalysis[]): string[] {
  return Array.from(new Set(history.map((item) => item.result.parsed.playstyle).filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function listVaultSkillsR151(history: SavedAnalysis[]): string[] {
  return Array.from(new Set(history.flatMap((item) => [
    ...(item.result.parsed.nativeSkills ?? []),
    ...(item.result.recommendedSkills ?? []),
  ]))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function countActiveVaultFiltersR151(input: {
  search: string;
  filter: CardVisionHistoryFilterR151;
  advancedFilters: VaultFilterState;
}): number {
  const filters = input.advancedFilters;
  return [
    Boolean(input.search.trim()),
    input.filter !== 'ALL',
    filters.folderId !== 'all',
    filters.position !== 'ALL',
    Boolean(filters.playstyle),
    Boolean(filters.skill),
    filters.minConfidence > 0,
    filters.maxConfidence < 100,
    filters.minEfficiency > 0,
    filters.favoritesOnly,
    filters.pendingOnly,
    filters.reviewOnly,
  ].filter(Boolean).length;
}
