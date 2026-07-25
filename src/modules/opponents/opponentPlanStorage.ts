import { readAccountStorage, writeAccountStorage } from '@/lib/accountStorage';

export const OPPONENT_PLAN_STORAGE_KEY = 'buildmaster_opponent_match_plans_v2950';
const MAX_PLANS = 20;

export type StoredOpponentPlan = Record<string, unknown>;

function isStoredPlan(value: unknown): value is StoredOpponentPlan {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function readOpponentMatchPlans(): StoredOpponentPlan[] {
  const raw = readAccountStorage(OPPONENT_PLAN_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredPlan).slice(0, MAX_PLANS) : [];
  } catch {
    return [];
  }
}

export function replaceOpponentMatchPlans(value: unknown): StoredOpponentPlan[] {
  const normalized = Array.isArray(value) ? value.filter(isStoredPlan).slice(0, MAX_PLANS) : [];
  writeAccountStorage(OPPONENT_PLAN_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}
