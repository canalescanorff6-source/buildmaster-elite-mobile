import type { AuthorityDecisionR386 } from './authorityProvenanceGateR386';

export const VAULT_READINESS_AUTHORITY_R387_VERSION = '40.80-r387-vault-readiness-authority-v1' as const;

export type PersistedStatusTagR387 = 'completo' | 'pendente' | 'revisar' | null | undefined;
export type VaultProgressStatusR387 = 'completo' | 'pendente' | 'revisar';
export type VaultAuthorityStatusR387 = 'PRONTA' | 'REVISAR';

export type SavedAuthorityStampR387 = {
  version?: string | null;
  evaluated?: boolean | null;
};

export type SavedReadinessInputR387 = {
  authority: AuthorityDecisionR386 | null | undefined;
  authorityStamp?: SavedAuthorityStampR387 | null;
  currentAuthorityVersion: string;
  persistedStatusTag?: PersistedStatusTagR387;
  recommendedSkills: readonly string[] | null | undefined;
  completedSkills?: Readonly<Record<string, boolean>> | null;
  renderableLegacyResult?: boolean;
};

export type SavedReadinessDecisionR387 = {
  authorityStatus: VaultAuthorityStatusR387;
  progressStatus: VaultProgressStatusR387;
  requiresReauthorization: boolean;
  persistedStatusAcceptedAsAuthority: false;
  recommendedCount: number;
  completedCount: number;
  blockers: string[];
};

export type VaultDashboardSummaryR387 = {
  total: number;
  ready: number;
  review: number;
  pending: number;
  complete: number;
  requiresReauthorization: number;
};

function uniqueCleanSkills(skills: readonly string[] | null | undefined) {
  return Array.from(new Set((skills ?? []).map((skill) => String(skill).trim()).filter(Boolean)));
}

function currentAuthorityStamp(input: SavedReadinessInputR387) {
  return input.authorityStamp?.evaluated === true
    && typeof input.authorityStamp.version === 'string'
    && input.authorityStamp.version === input.currentAuthorityVersion;
}

export function evaluateSavedReadinessR387(input: SavedReadinessInputR387): SavedReadinessDecisionR387 {
  const blockers: string[] = [];
  const skills = uniqueCleanSkills(input.recommendedSkills);
  const completedCount = skills.filter((skill) => input.completedSkills?.[skill] === true).length;
  const stampCurrent = currentAuthorityStamp(input);
  const hasCurrentAuthority = Boolean(input.authority) && stampCurrent;
  const requiresReauthorization = !hasCurrentAuthority || input.renderableLegacyResult === true;

  if (!input.authority) blockers.push('authority-decision-missing');
  if (!stampCurrent) blockers.push('authority-stamp-stale-or-missing');
  if (input.renderableLegacyResult === true) blockers.push('legacy-renderable-result-requires-reauthorization');

  const authorityReady = hasCurrentAuthority
    && input.renderableLegacyResult !== true
    && input.authority?.commercialReady === true
    && input.authority.commercialStatus === 'PRONTA';

  if (!authorityReady) blockers.push('current-authority-not-ready');
  if (!skills.length) blockers.push('recommended-skills-empty');

  const progressStatus: VaultProgressStatusR387 = !authorityReady || !skills.length
    ? 'revisar'
    : completedCount >= skills.length
      ? 'completo'
      : 'pendente';

  return {
    authorityStatus: authorityReady ? 'PRONTA' : 'REVISAR',
    progressStatus,
    requiresReauthorization,
    persistedStatusAcceptedAsAuthority: false,
    recommendedCount: skills.length,
    completedCount,
    blockers: Array.from(new Set(blockers))
  };
}

export function buildVaultDashboardSummaryR387(items: readonly SavedReadinessInputR387[]): VaultDashboardSummaryR387 {
  let ready = 0;
  let review = 0;
  let pending = 0;
  let complete = 0;
  let requiresReauthorization = 0;

  for (const item of items) {
    const decision = evaluateSavedReadinessR387(item);
    if (decision.authorityStatus === 'PRONTA') ready += 1;
    else review += 1;
    if (decision.progressStatus === 'pendente') pending += 1;
    if (decision.progressStatus === 'completo') complete += 1;
    if (decision.requiresReauthorization) requiresReauthorization += 1;
  }

  return { total: items.length, ready, review, pending, complete, requiresReauthorization };
}

/**
 * R387 migration rule: a historical result being renderable is only a UI capability.
 * It is never proof that the result passed the current authority boundary.
 */
export function canReuseRenderableSavedResultR387(input: SavedReadinessInputR387) {
  return evaluateSavedReadinessR387(input).requiresReauthorization === false;
}
