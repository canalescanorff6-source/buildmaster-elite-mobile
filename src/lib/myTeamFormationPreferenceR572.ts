import type { TacticalFormation } from './analyzerDomain';
import { FORMATION_BLUEPRINTS } from './formationRoleEngine';
import { readAccountStorage, writeAccountStorage } from './accountStorage';

export const TEAM_FORMATION_KEY_R572 = 'buildmaster_my_team_formation_r572_v1';

/**
 * Only saved tactical choices from the official blueprint catalog are accepted.
 * Unknown or obsolete saved values are ignored (no overwrite of the Cofre).
 */
export function normalizeMyTeamFormationR572(value: unknown): TacticalFormation | null {
  if (value === 'AUTO') return 'AUTO';
  if (typeof value !== 'string') return null;
  return FORMATION_BLUEPRINTS.some(formation => formation.id === value)
    ? value as TacticalFormation : null;
}

export function readMyTeamFormationR572(): TacticalFormation | null {
  try {
    return normalizeMyTeamFormationR572(readAccountStorage(TEAM_FORMATION_KEY_R572, { migrateLegacy: false }));
  } catch {
    return null;
  }
}

export function persistMyTeamFormationR572(value: TacticalFormation): boolean {
  const validated = normalizeMyTeamFormationR572(value);
  if (!validated) return false;
  try {
    return writeAccountStorage(TEAM_FORMATION_KEY_R572, validated);
  } catch {
    // The selection remains available for this session, even when storage fails.
    return false;
  }
}
