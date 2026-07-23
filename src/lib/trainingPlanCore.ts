import type { TrainingKey, TrainingPlan } from './analyzerDomain';
import { MAX_PLAYER_TRAINING_BUDGET, MIN_PLAYER_TRAINING_BUDGET } from '../modules/builds/pointBudget';

export const TRAINING_KEYS: TrainingKey[] = ['shooting', 'passing', 'dribbling', 'dexterity', 'lowerBodyStrength', 'aerialStrength', 'defending', 'gk1', 'gk2', 'gk3'];

const TRAINING_ALIASES: Record<TrainingKey, string[]> = {
  shooting: ['finalizacao', 'finalização', 'chute', 'chutes', 'tiro', 'tiros', 'shooting'],
  passing: ['passe', 'passes', 'passing'],
  dribbling: ['drible treino', 'drible', 'dribbling'],
  dexterity: ['destreza', 'dexterity'],
  lowerBodyStrength: ['forca nas pernas', 'força nas pernas', 'forca pernas', 'força pernas', 'forca de pernas', 'força de pernas', 'forca inferior', 'lower body strength'],
  aerialStrength: ['forca em bola aerea', 'força em bola aérea', 'forca bola aerea', 'força bola aérea', 'bola aerea', 'bola aérea', 'jogo aereo', 'jogo aéreo', 'aerial strength'],
  defending: ['defesa', 'defending'],
  gk1: ['go 1', 'gol 1', 'goleiro 1', 'gk 1', 'gk1'],
  gk2: ['go 2', 'gol 2', 'goleiro 2', 'gk 2', 'gk2'],
  gk3: ['go 3', 'gol 3', 'goleiro 3', 'gk 3', 'gk3']
};

function normalizeTrainingText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function aliasToRegex(alias: string): string {
  return normalizeTrainingText(alias)
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s+');
}

export function emptyTraining(): TrainingPlan {
  return { shooting: 0, passing: 0, dribbling: 0, dexterity: 0, lowerBodyStrength: 0, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
}

export function normalizeTrainingPlan(plan: TrainingPlan): TrainingPlan {
  const clean = emptyTraining();
  for (const key of TRAINING_KEYS) clean[key] = Math.max(0, Math.min(16, Math.round(Number(plan[key] ?? 0))));
  return clean;
}

export function trainingLevelCost(level: number): number {
  if (level <= 0) return 0;
  return Math.ceil(level / 4);
}

export function trainingTotalCost(level: number): number {
  let cost = 0;
  for (let current = 1; current <= Math.max(0, level); current += 1) cost += trainingLevelCost(current);
  return cost;
}

export function trainingPlanCost(plan: TrainingPlan): TrainingPlan {
  const costs = emptyTraining();
  for (const key of TRAINING_KEYS) costs[key] = trainingTotalCost(plan[key] ?? 0);
  return costs;
}

export function trainingPlanTotalCost(plan: TrainingPlan): number {
  return Object.values(trainingPlanCost(plan)).reduce((sum, value) => sum + value, 0);
}

export function parseTrainingAllocation(text: string): { plan: TrainingPlan; points: number; keysRead: number } | null {
  const normalized = normalizeTrainingText(text)
    .replace(/\r/g, '\n')
    .replace(/[=:+]/g, ' ')
    .replace(/\s+/g, ' ');
  const plan = emptyTraining();
  const found = new Set<TrainingKey>();

  for (const key of TRAINING_KEYS) {
    for (const alias of TRAINING_ALIASES[key]) {
      const pattern = new RegExp(`(?:^|[\\s,;|•])${aliasToRegex(alias)}\\s*(\\d{1,2})(?=\\b)`, 'gi');
      for (const match of normalized.matchAll(pattern)) {
        const value = Number(match[1]);
        if (!Number.isFinite(value) || value < 0 || value > 16) continue;
        plan[key] = Math.max(plan[key] ?? 0, value);
        found.add(key);
      }
    }
  }

  const points = trainingPlanTotalCost(plan);
  const nonZero = TRAINING_KEYS.filter((key) => (plan[key] ?? 0) > 0).length;
  if (found.size < 4 || nonZero < 2) return null;
  if (points < MIN_PLAYER_TRAINING_BUDGET || points > MAX_PLAYER_TRAINING_BUDGET) return null;
  return { plan, points, keysRead: found.size };
}

export function addTrainingLevel(plan: TrainingPlan, key: TrainingKey, maxLevel = 16): boolean {
  if ((plan[key] ?? 0) >= maxLevel) return false;
  plan[key] = (plan[key] ?? 0) + 1;
  return true;
}

export function removeTrainingLevel(plan: TrainingPlan, key: TrainingKey): boolean {
  if ((plan[key] ?? 0) <= 0) return false;
  plan[key] = (plan[key] ?? 0) - 1;
  return true;
}

export function applyPlanEntries(entries: Partial<TrainingPlan>): TrainingPlan {
  return { ...emptyTraining(), ...entries };
}
