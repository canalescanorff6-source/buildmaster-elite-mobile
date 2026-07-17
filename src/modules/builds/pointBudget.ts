export const MIN_PLAYER_TRAINING_BUDGET = 20;
export const MAX_PLAYER_TRAINING_BUDGET = 140;
export const SAFE_PLAYER_TRAINING_BUDGET = 64;

function normalized(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

type LevelCandidate = { value: number; score: number; index: number; source: string };

export function parseCardLevelFromText(text: string): number | null {
  const source = normalized(text).replace(/\r?\n/g, ' ');
  const candidates: LevelCandidate[] = [];
  const push = (value: number, score: number, index: number, label: string) => {
    if (!Number.isFinite(value) || value < 1 || value > 99) return;
    candidates.push({ value, score, index, source: label });
  };

  for (const match of source.matchAll(/(?:nivel(?:\s*(?:maximo|max))?|level|lvl|lv)\s*[:=.-]?\s*(\d{1,2})\s*[\/]\s*(\d{1,2})/gi)) {
    const current = Number(match[1]);
    const maximum = Number(match[2]);
    if (current <= maximum) push(maximum, 100, match.index ?? 0, 'ratio');
  }
  for (const match of source.matchAll(/(?:nivel(?:\s*(?:maximo|max))?|level|lvl|lv)\s*[:=.-]?\s*(\d{1,2})/gi)) {
    const value = Number(match[1]);
    let score = 88;
    const context = source.slice(Math.max(0, (match.index ?? 0) - 28), (match.index ?? 0) + match[0].length + 28);
    if (/(?:ger|overall)\s*[:=.-]?\s*\d{2,3}/i.test(context) && value >= 80) score -= 50;
    if (value >= 80) score -= 24;
    push(value, score, match.index ?? 0, 'labeled');
  }

  const manual = source.match(/\[ajustes manuais\]([\s\S]*?)\[fim ajustes\]/i)?.[1] ?? '';
  const manualMatch = manual.match(/(?:nivel(?:\s*(?:maximo|max))?|level)\s*[:=.-]?\s*(\d{1,2})/i);
  if (manualMatch?.[1]) push(Number(manualMatch[1]), 120, 0, 'manual');

  const unique = new Map<number, LevelCandidate>();
  for (const candidate of candidates) {
    const previous = unique.get(candidate.value);
    if (!previous || candidate.score > previous.score || (candidate.score === previous.score && candidate.index < previous.index)) unique.set(candidate.value, candidate);
  }
  const best = [...unique.values()].sort((a, b) => b.score - a.score || a.index - b.index)[0];
  return best && best.score >= 55 ? best.value : null;
}

export function inferPointsFromCardLevel(level?: number | null): number | null {
  if (!Number.isFinite(level ?? NaN)) return null;
  const safeLevel = Math.round(Number(level));
  if (safeLevel < 2 || safeLevel > 99) return null;
  const points = (safeLevel - 1) * 2;
  if (points < MIN_PLAYER_TRAINING_BUDGET || points > MAX_PLAYER_TRAINING_BUDGET) return null;
  return points;
}

export function normalizePlayerTrainingBudget(value: number | null | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < MIN_PLAYER_TRAINING_BUDGET || numeric > MAX_PLAYER_TRAINING_BUDGET) return SAFE_PLAYER_TRAINING_BUDGET;
  return Math.round(numeric);
}
