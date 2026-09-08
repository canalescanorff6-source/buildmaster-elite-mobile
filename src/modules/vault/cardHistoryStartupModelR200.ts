import type { AnalysisResult, PositionCode } from '@/lib/analyzerDomain';
import { cardIdentityFingerprintR126 } from '@/lib/cardIdentityFingerprintR126';
import { analysisUsagePositionR138 } from '@/lib/analysisUsagePositionR138';
import type { ManualFields, SavedAnalysis, SavedSkillProgress } from './cardHistoryStore';

export const CARD_HISTORY_STARTUP_MODEL_R200_VERSION = '40.80-r200-card-history-startup-model-v1' as const;
export const HISTORY_KEY_R200 = 'buildmaster_history_v24_6_cofre_persistente';
export const HISTORY_LIMIT_R200 = 200;

export function emptyManualFieldsR200(): ManualFields {
  return { playerName: '', level: '', trainingPointsTotal: '', attributes: {}, nativeSkills: [] };
}

export function memoryKeyR200(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function resultHistoryKeyR200(result: AnalysisResult) {
  const cardIdentity = cardIdentityFingerprintR126(result.parsed);
  return `${cardIdentity}-${analysisUsagePositionR138(result).toLowerCase()}`;
}

export function skillProgressInfoR200(skills: string[], progress: SavedSkillProgress | undefined) {
  const unique = Array.from(new Set(skills));
  const done = unique.filter((skill) => progress?.[skill]).length;
  return { done, total: unique.length, percent: unique.length ? Math.round((done / unique.length) * 100) : 0 };
}

export function savedStatusLabelR200(item: SavedAnalysis) {
  const info = skillProgressInfoR200(item.result.recommendedSkills, item.skillProgress);
  if (item.statusTag) return item.statusTag;
  if (!info.total) return 'revisar';
  return info.done >= info.total ? 'completo' : 'pendente';
}

export function savedPositionGroupR200(item: SavedAnalysis): PositionCode {
  return analysisUsagePositionR138(item.result);
}

export function buildDashboardStatsR200(history: SavedAnalysis[]) {
  let pending = 0, complete = 0, favorites = 0, review = 0, skillsTotal = 0, skillsDone = 0;
  const positions = new Set<PositionCode>();
  for (const item of history) {
    const status = savedStatusLabelR200(item);
    if (status === 'pendente') pending += 1;
    else if (status === 'completo') complete += 1;
    else if (status === 'revisar') review += 1;
    if (item.favorite) favorites += 1;
    positions.add(analysisUsagePositionR138(item.result));
    const info = skillProgressInfoR200(item.result.recommendedSkills, item.skillProgress);
    skillsTotal += info.total;
    skillsDone += info.done;
  }
  return { total: history.length, pending, complete, favorites, positions: positions.size, review, skillsTotal, skillsDone, completion: skillsTotal ? Math.round((skillsDone / skillsTotal) * 100) : 0 };
}

/**
 * R200: o estado em memória já entrou pelo loader/mutador canônico. No render,
 * fazemos apenas uma barreira barata contra itens claramente corrompidos e duplicatas.
 * Migração/reparo pesado continua exclusivamente no cardHistoryStore, nas bordas de ingestão.
 */
export function sanitizeRuntimeHistoryR200(history: SavedAnalysis[]): SavedAnalysis[] {
  let changed = false;
  const seen = new Set<string>();
  const safe: SavedAnalysis[] = [];
  for (const item of history) {
    const valid = Boolean(item && typeof item.id === 'string' && typeof item.saveKey === 'string' && item.result?.parsed?.playerName && Array.isArray(item.result.recommendedSkills));
    if (!valid || seen.has(item.saveKey)) { changed = true; continue; }
    seen.add(item.saveKey);
    safe.push(item);
  }
  return changed ? safe : history;
}
