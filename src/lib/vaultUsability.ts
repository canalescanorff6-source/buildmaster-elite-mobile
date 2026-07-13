import type { AnalysisResult, PositionCode } from './analyzer';

export type VaultFolder = {
  id: string;
  name: string;
  kind: 'system' | 'custom';
};

export type VaultFilterState = {
  folderId: string;
  position: 'ALL' | PositionCode;
  playstyle: string;
  skill: string;
  minConfidence: number;
  maxConfidence: number;
  minEfficiency: number;
  favoritesOnly: boolean;
  pendingOnly: boolean;
  reviewOnly: boolean;
};

export type VaultEntryLike = {
  id: string;
  folderId?: string;
  favorite?: boolean;
  statusTag?: 'completo' | 'pendente' | 'revisar';
  personalTags?: string[];
  notes?: string;
  tacticalRoleNote?: string;
  result: AnalysisResult;
};

export type SmartHomeSummary = {
  total: number;
  needsReview: number;
  lowConfidence: number;
  incomplete: number;
  recentPlayer: string | null;
  nextAction: string;
  alerts: string[];
};

export const DEFAULT_VAULT_FOLDERS: VaultFolder[] = [
  { id: 'all', name: 'Todos', kind: 'system' },
  { id: 'titulares', name: 'Titulares', kind: 'system' },
  { id: 'reservas', name: 'Reservas', kind: 'system' },
  { id: 'testes', name: 'Testes', kind: 'system' },
  { id: 'favoritos', name: 'Favoritos', kind: 'system' },
  { id: 'arquivados', name: 'Arquivados', kind: 'system' }
];

const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function folderForEntry(entry: VaultEntryLike): string {
  if (entry.folderId) return entry.folderId;
  if (entry.favorite) return 'favoritos';
  const role = normalize(entry.tacticalRoleNote);
  if (role.includes('titular')) return 'titulares';
  if (role.includes('reserva') || role.includes('banco')) return 'reservas';
  if (entry.statusTag === 'revisar') return 'testes';
  return 'all';
}

export function entryMatchesAdvancedFilters(entry: VaultEntryLike, filters: VaultFilterState): boolean {
  const result = entry.result;
  const folder = folderForEntry(entry);
  if (filters.folderId !== 'all' && folder !== filters.folderId) return false;
  if (filters.position !== 'ALL' && result.bestPosition.code !== filters.position) return false;
  if (filters.playstyle && normalize(result.parsed.playstyle) !== normalize(filters.playstyle)) return false;
  if (filters.skill) {
    const skills = [...result.parsed.nativeSkills, ...result.recommendedSkills].map(normalize);
    if (!skills.some((skill) => skill.includes(normalize(filters.skill)))) return false;
  }
  if ((result.parsed.confidence ?? 0) < filters.minConfidence || (result.parsed.confidence ?? 0) > filters.maxConfidence) return false;
  if ((result.advancedOptimizer?.efficiencyScore ?? 0) < filters.minEfficiency) return false;
  if (filters.favoritesOnly && !entry.favorite) return false;
  if (filters.pendingOnly && entry.statusTag !== 'pendente') return false;
  if (filters.reviewOnly && entry.statusTag !== 'revisar') return false;
  return true;
}

export function buildSmartHomeSummary(entries: VaultEntryLike[]): SmartHomeSummary {
  const lowConfidence = entries.filter((entry) => (entry.result.parsed.confidence ?? 0) < 70).length;
  const needsReview = entries.filter((entry) => entry.statusTag === 'revisar').length;
  const incomplete = entries.filter((entry) => entry.statusTag === 'pendente').length;
  const recentPlayer = entries[0]?.result.parsed.playerName ?? null;
  const alerts: string[] = [];
  if (needsReview) alerts.push(`${needsReview} ficha(s) marcada(s) para revisão.`);
  if (lowConfidence) alerts.push(`${lowConfidence} ficha(s) com confiança abaixo de 70.`);
  if (incomplete) alerts.push(`${incomplete} ficha(s) ainda possuem pendências.`);
  const nextAction = needsReview
    ? 'Revisar fichas com inconsistências antes de gerar novas versões.'
    : lowConfidence
      ? 'Confirmar os dados das fichas com menor confiança.'
      : incomplete
        ? 'Concluir as habilidades e observações pendentes.'
        : entries.length
          ? 'Comparar jogadores ou preparar a análise do time.'
          : 'Criar a primeira ficha pelo Leitor Elite ou modo Manual Pro.';
  return { total: entries.length, needsReview, lowConfidence, incomplete, recentPlayer, nextAction, alerts };
}
