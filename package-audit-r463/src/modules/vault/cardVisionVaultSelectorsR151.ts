import { POSITION_PT, type PositionCode } from '@/lib/analyzerDomain';
import { folderForEntry, type VaultFilterState } from '@/lib/vaultUsability';
import type { SavedAnalysis } from './cardHistoryStore';
import { memoryKeyR200 as memoryKey, savedPositionGroupR200 as savedPositionGroup, skillProgressInfoR200 as skillProgressInfo } from './cardHistoryStartupModelR200';

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

export const CARDVISION_VAULT_QUERY_INDEX_R414_VERSION = '40.80-r414-indexed-vault-query-v1' as const;

type VaultEntryIndexR414 = {
  searchable: string;
  usagePosition: PositionCode;
  usageLabel: string;
  folderId: string;
  status: 'completo' | 'pendente' | 'revisar';
  statusTag: SavedAnalysis['statusTag'];
  normalizedPlaystyle: string;
  normalizedSkills: string[];
  confidence: number;
  efficiency: number;
  pendingSkills: number;
  updatedKey: string;
  playerName: string;
};

const vaultEntryIndexCacheR414 = new WeakMap<object, VaultEntryIndexR414>();

function normalizeAdvancedFilterR414(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function vaultEntryIndexR414(item: SavedAnalysis): VaultEntryIndexR414 {
  const cached = vaultEntryIndexCacheR414.get(item);
  if (cached) return cached;
  const usagePosition = savedPositionGroup(item);
  const usageLabel = POSITION_PT[usagePosition];
  const progress = skillProgressInfo(item.result.recommendedSkills, item.skillProgress);
  const status = item.statusTag ?? (!progress.total ? 'revisar' : progress.done >= progress.total ? 'completo' : 'pendente');
  const normalizedSkills = [
    ...(item.result.parsed.nativeSkills ?? []),
    ...(item.result.recommendedSkills ?? []),
  ].map(normalizeAdvancedFilterR414);
  const searchable = memoryKey([
    item.result.parsed.playerName, usageLabel, item.result.bestPosition.label, item.result.buildName,
    item.result.parsed.playstyle ?? '', ...(item.result.parsed.nativeSkills ?? []),
    ...(item.result.recommendedSkills ?? []), ...(item.personalTags ?? []),
    item.notes ?? '', item.tacticalRoleNote ?? '',
  ].join(' '));
  const index: VaultEntryIndexR414 = {
    searchable,
    usagePosition,
    usageLabel,
    folderId: folderForEntry(item),
    status,
    statusTag: item.statusTag,
    normalizedPlaystyle: normalizeAdvancedFilterR414(item.result.parsed.playstyle),
    normalizedSkills,
    confidence: item.result.parsed.confidence ?? 0,
    efficiency: item.result.advancedOptimizer?.efficiencyScore ?? 0,
    pendingSkills: progress.total - progress.done,
    updatedKey: String(item.updatedAt || item.savedAt),
    playerName: item.result.parsed.playerName,
  };
  vaultEntryIndexCacheR414.set(item, index);
  return index;
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
  const filters = input.advancedFilters;
  const normalizedPlaystyle = normalizeAdvancedFilterR414(filters.playstyle);
  const normalizedSkill = normalizeAdvancedFilterR414(filters.skill);
  const matches: Array<{ item: SavedAnalysis; index: VaultEntryIndexR414 }> = [];

  for (const item of input.history) {
    const index = vaultEntryIndexR414(item);
    if (query && !index.searchable.includes(query)) continue;
    if (filters.folderId !== 'all' && index.folderId !== filters.folderId) continue;
    if (filters.position !== 'ALL' && index.usagePosition !== filters.position) continue;
    if (normalizedPlaystyle && index.normalizedPlaystyle !== normalizedPlaystyle) continue;
    if (normalizedSkill && !index.normalizedSkills.some((skill) => skill.includes(normalizedSkill))) continue;
    if (index.confidence < filters.minConfidence || index.confidence > filters.maxConfidence) continue;
    if (index.efficiency < filters.minEfficiency) continue;
    if (filters.favoritesOnly && !item.favorite) continue;
    if (filters.pendingOnly && index.statusTag !== 'pendente') continue;
    if (filters.reviewOnly && index.statusTag !== 'revisar') continue;
    if (filters.folderId === 'all' && index.folderId === 'arquivados') continue;
    if (input.onlyPendingSkills && index.status !== 'pendente') continue;
    if (input.filter === 'FAVORITES' && !item.favorite) continue;
    if (input.filter === 'PENDING' && index.status !== 'pendente') continue;
    if (input.filter === 'COMPLETE' && index.status !== 'completo') continue;
    if (input.filter === 'REVIEW' && index.status !== 'revisar') continue;
    if (input.filter !== 'ALL' && input.filter !== 'FAVORITES' && input.filter !== 'PENDING' && input.filter !== 'COMPLETE' && input.filter !== 'REVIEW' && index.usagePosition !== input.filter) continue;
    matches.push({ item, index });
  }

  matches.sort((left, right) => {
    const a = left.index;
    const b = right.index;
    if (input.sort === 'NAME') return a.playerName.localeCompare(b.playerName, 'pt-BR');
    if (input.sort === 'POSITION') return a.usageLabel.localeCompare(b.usageLabel, 'pt-BR');
    if (input.sort === 'PENDING') return b.pendingSkills - a.pendingSkills;
    return b.updatedKey.localeCompare(a.updatedKey, 'pt-BR');
  });
  return matches.map(({ item }) => item);
}

export function listVaultPlaystylesR151(history: SavedAnalysis[]): string[] {
  const playstyles = new Set<string>();
  for (const item of history) {
    const playstyle = item.result.parsed.playstyle;
    if (playstyle) playstyles.add(playstyle);
  }
  return [...playstyles].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function listVaultSkillsR151(history: SavedAnalysis[]): string[] {
  const skills = new Set<string>();
  for (const item of history) {
    for (const skill of item.result.parsed.nativeSkills ?? []) skills.add(skill);
    for (const skill of item.result.recommendedSkills ?? []) skills.add(skill);
  }
  return [...skills].sort((a, b) => a.localeCompare(b, 'pt-BR'));
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
