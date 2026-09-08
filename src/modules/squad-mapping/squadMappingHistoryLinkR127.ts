import type { AnalysisResult, AttributeKey, PositionCode } from '@/modules/analysis';
import { cardIdentityFingerprintR126, playerIdentityFingerprintR126, playerIdentityKeyFromNameR126 } from '@/lib/cardIdentityFingerprintR126';
import { canonicalizePlayerPlaystyle } from '@/lib/efootball2026Playstyles';

export const SQUAD_MAPPING_HISTORY_LINK_R127_VERSION = '40.80-r127-evidence-history-link-v1' as const;

export type MappingHistoryProbeR127 = {
  name: string;
  mainPosition: PositionCode;
  playstyle: string;
  attributes: Partial<Record<AttributeKey, number>>;
  skills: string[];
  height: number | null;
  level: number | null;
};

export type MappingHistoryLinkR127 = {
  historyId: string;
  result: AnalysisResult;
  cardFingerprint: string;
  playerFingerprint: string;
  score: number;
  margin: number;
  status: 'canonical' | 'ambiguous';
  reasons: string[];
};

function normalized(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
}

function attributeSimilarity(probe: MappingHistoryProbeR127, result: AnalysisResult) {
  const observed = Object.entries(probe.attributes).filter((entry): entry is [AttributeKey, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]));
  if (observed.length < 3) return { score: 0, coverage: observed.length };
  const diffs = observed.flatMap(([key, value]) => {
    const candidate = Number(result.parsed.attributes?.[key]);
    return Number.isFinite(candidate) ? [Math.abs(candidate - value)] : [];
  });
  if (diffs.length < 3) return { score: 0, coverage: diffs.length };
  const mean = diffs.reduce((sum, value) => sum + value, 0) / diffs.length;
  return { score: Math.max(0, Math.min(30, Math.round(30 - mean * 4.2))), coverage: diffs.length };
}

function skillOverlap(probe: MappingHistoryProbeR127, result: AnalysisResult) {
  const wanted = new Set(probe.skills.map(normalized).filter(Boolean));
  if (!wanted.size) return 0;
  const owned = new Set([
    ...(result.parsed.nativeSkills ?? []),
    ...(result.parsed.additionalSkills ?? []),
    ...(result.parsed.specialSkills ?? [])
  ].map(normalized).filter(Boolean));
  let matches = 0;
  for (const skill of wanted) if (owned.has(skill)) matches += 1;
  return Math.min(12, Math.round((matches / wanted.size) * 12));
}

function scoreCandidate(probe: MappingHistoryProbeR127, result: AnalysisResult) {
  const reasons: string[] = [];
  let score = 0;
  if (playerIdentityKeyFromNameR126(probe.name) !== playerIdentityFingerprintR126(result.parsed)) return { score: -999, reasons };
  score += 28;
  reasons.push('mesmo atleta');
  if (result.parsed.mainPosition === probe.mainPosition) { score += 16; reasons.push('mesma posição natural'); }
  else if (result.parsed.positions?.includes(probe.mainPosition)) { score += 7; reasons.push('posição presente na carta'); }
  const probeStyle = canonicalizePlayerPlaystyle(probe.playstyle) ?? normalized(probe.playstyle);
  const resultStyle = canonicalizePlayerPlaystyle(result.parsed.offensivePlaystyle ?? result.parsed.playstyle) ?? normalized(result.parsed.offensivePlaystyle ?? result.parsed.playstyle);
  if (probeStyle && resultStyle && normalized(probeStyle) === normalized(resultStyle)) { score += 15; reasons.push('mesmo estilo'); }
  const attributes = attributeSimilarity(probe, result);
  score += attributes.score;
  if (attributes.coverage >= 3 && attributes.score >= 18) reasons.push('atributos compatíveis');
  const skills = skillOverlap(probe, result);
  score += skills;
  if (skills >= 6) reasons.push('habilidades compatíveis');
  if (probe.height && result.parsed.height && Math.abs(probe.height - result.parsed.height) <= 1) { score += 5; reasons.push('mesma altura'); }
  if (probe.level && result.parsed.level && probe.level === result.parsed.level) { score += 4; reasons.push('mesmo nível máximo'); }
  return { score, reasons };
}

export function findBestHistoryLinkR127(
  probe: MappingHistoryProbeR127,
  history: Array<{ id: string; result: AnalysisResult }>
): MappingHistoryLinkR127 | null {
  const ranked = history
    .map((entry) => ({ entry, ...scoreCandidate(probe, entry.result) }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || cardIdentityFingerprintR126(left.entry.result.parsed).localeCompare(cardIdentityFingerprintR126(right.entry.result.parsed)));
  const best = ranked[0];
  if (!best || best.score < 58) return null;
  const second = ranked[1];
  const margin = second ? best.score - second.score : best.score;
  const status: MappingHistoryLinkR127['status'] = margin >= 7 || best.score >= 88 ? 'canonical' : 'ambiguous';
  if (status === 'ambiguous') return null;
  return {
    historyId: best.entry.id,
    result: best.entry.result,
    cardFingerprint: cardIdentityFingerprintR126(best.entry.result.parsed),
    playerFingerprint: playerIdentityFingerprintR126(best.entry.result.parsed),
    score: best.score,
    margin,
    status,
    reasons: best.reasons
  };
}
