export const MIN_PLAYER_TRAINING_BUDGET = 20;
export const MAX_PLAYER_TRAINING_BUDGET = 140;
export const SAFE_PLAYER_TRAINING_BUDGET = 64;

/**
 * Normaliza o orçamento individual de PP sem misturá-lo com limites do Cofre.
 * Valores válidos são inteiros entre 20 e 140; entradas ausentes/inválidas usam
 * o orçamento seguro para que o resolvedor possa continuar sem inventar PP.
 */
export function normalizePlayerTrainingBudget(value?: number | null): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return SAFE_PLAYER_TRAINING_BUDGET;
  return Math.min(MAX_PLAYER_TRAINING_BUDGET, Math.max(MIN_PLAYER_TRAINING_BUDGET, Math.round(numeric)));
}
export function inferPointsFromCardLevel(level?: number | null): number | null {
  if (!Number.isFinite(level ?? NaN)) return null;
  const safeLevel = Math.round(Number(level));
  if (safeLevel < 2 || safeLevel > 99) return null;
  const points = (safeLevel - 1) * 2;
  if (points < MIN_PLAYER_TRAINING_BUDGET || points > MAX_PLAYER_TRAINING_BUDGET) return null;
  return points;
}
