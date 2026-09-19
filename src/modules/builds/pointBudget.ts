export const MIN_PLAYER_TRAINING_BUDGET = 20;
export const MAX_PLAYER_TRAINING_BUDGET = 140;
export const SAFE_PLAYER_TRAINING_BUDGET = 64;
export function inferPointsFromCardLevel(level?: number | null): number | null {
  if (!Number.isFinite(level ?? NaN)) return null;
  const safeLevel = Math.round(Number(level));
  if (safeLevel < 2 || safeLevel > 99) return null;
  const points = (safeLevel - 1) * 2;
  if (points < MIN_PLAYER_TRAINING_BUDGET || points > MAX_PLAYER_TRAINING_BUDGET) return null;
  return points;
}
