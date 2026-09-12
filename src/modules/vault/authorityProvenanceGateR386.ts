export const AUTHORITY_PROVENANCE_GATE_R386_VERSION = '40.80-r386-authority-quarantine-v1' as const;

export type OriginalPositionSourceR386 =
  | 'manual_explicit'
  | 'card_header_or_badge'
  | 'catalog_exact_identity'
  | 'rating_grid_derived'
  | 'engine_derived'
  | 'compatibility_fallback'
  | 'unknown';

export type UsagePositionSourceR386 =
  | 'user_explicit'
  | 'authoritative_original'
  | 'auto_recommendation'
  | 'compatibility_fallback'
  | 'unknown';

export type SkillInventorySourceR386 = 'explicit' | 'visible_block' | 'scan' | 'none';
export type BudgetSourceR386 = 'MANUAL' | 'TRAINING_READ' | 'OCR' | 'LEVEL_INFERRED' | 'FALLBACK' | 'UNKNOWN';
export type ValidationLevelR386 = 'safe' | 'review' | 'blocked';

export type AuthorityFactsR386 = {
  originalPosition: {
    code: string | null;
    source: OriginalPositionSourceR386;
    exactIdentityMatched?: boolean;
  };
  usagePosition: {
    code: string | null;
    source: UsagePositionSourceR386;
  };
  attributes: {
    knownCount: number;
    criticalCoverage: boolean;
  };
  skills: {
    source: SkillInventorySourceR386;
    inventoryComplete: boolean;
    recommendedCount: number;
  };
  budget: {
    total: number;
    source: BudgetSourceR386;
    exactEvidence: boolean;
    conflict: boolean;
  };
  validation: {
    level: ValidationLevelR386;
  };
  integrity: {
    critical: boolean;
  };
};

export type AuthorityDecisionR386 = {
  originalPositionAuthoritative: boolean;
  usagePositionAllowed: boolean;
  autoPositionAllowed: boolean;
  roleFitAllowed: boolean;
  definitiveTop5Allowed: boolean;
  exactBudgetAllowed: boolean;
  commercialReady: boolean;
  commercialStatus: 'PRONTA' | 'REVISAR';
  blockers: string[];
};

function finiteNonNegative(value: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function originalPositionAuthoritative(facts: AuthorityFactsR386) {
  if (!facts.originalPosition.code) return false;
  if (facts.originalPosition.source === 'manual_explicit') return true;
  if (facts.originalPosition.source === 'card_header_or_badge') return true;
  return facts.originalPosition.source === 'catalog_exact_identity' && facts.originalPosition.exactIdentityMatched === true;
}

function usagePositionAllowed(facts: AuthorityFactsR386, originalAuthoritative: boolean) {
  if (!facts.usagePosition.code) return false;
  if (facts.usagePosition.source === 'user_explicit') return true;
  if (facts.usagePosition.source === 'authoritative_original') return originalAuthoritative;
  if (facts.usagePosition.source === 'auto_recommendation') return originalAuthoritative && facts.attributes.criticalCoverage;
  return false;
}

function trustedSkillInventory(facts: AuthorityFactsR386) {
  return facts.skills.inventoryComplete
    && (facts.skills.source === 'explicit' || facts.skills.source === 'visible_block');
}

function exactBudgetAllowed(facts: AuthorityFactsR386) {
  return finiteNonNegative(facts.budget.total)
    && facts.budget.total > 0
    && facts.budget.source !== 'FALLBACK'
    && facts.budget.source !== 'UNKNOWN'
    && facts.budget.exactEvidence
    && !facts.budget.conflict;
}

export function evaluateAuthorityR386(facts: AuthorityFactsR386): AuthorityDecisionR386 {
  const blockers: string[] = [];
  const originalAuthoritative = originalPositionAuthoritative(facts);
  const usageAllowed = usagePositionAllowed(facts, originalAuthoritative);
  const autoAllowed = originalAuthoritative
    && usageAllowed
    && facts.usagePosition.source === 'auto_recommendation'
    && facts.attributes.criticalCoverage
    && facts.validation.level !== 'blocked';
  const roleFitAllowed = usageAllowed
    && facts.attributes.criticalCoverage
    && facts.attributes.knownCount > 0
    && facts.validation.level !== 'blocked';
  const top5Allowed = originalAuthoritative
    && usageAllowed
    && facts.attributes.criticalCoverage
    && trustedSkillInventory(facts)
    && facts.skills.recommendedCount === 5
    && facts.validation.level !== 'blocked';
  const budgetAllowed = exactBudgetAllowed(facts);

  if (!originalAuthoritative) blockers.push('original-position-unconfirmed');
  if (!usageAllowed) blockers.push('usage-position-unconfirmed');
  if (!facts.attributes.criticalCoverage || facts.attributes.knownCount <= 0) blockers.push('critical-attributes-unconfirmed');
  if (!trustedSkillInventory(facts)) blockers.push('skill-inventory-not-definitive');
  if (facts.skills.recommendedCount !== 5) blockers.push('top5-not-closed');
  if (!budgetAllowed) blockers.push('budget-not-exact');
  if (facts.validation.level === 'blocked') blockers.push('validation-blocked');
  if (facts.validation.level === 'review') blockers.push('validation-review');
  if (facts.integrity.critical) blockers.push('integrity-critical');

  const commercialReady = originalAuthoritative
    && usageAllowed
    && roleFitAllowed
    && top5Allowed
    && budgetAllowed
    && facts.validation.level === 'safe'
    && !facts.integrity.critical;

  return {
    originalPositionAuthoritative: originalAuthoritative,
    usagePositionAllowed: usageAllowed,
    autoPositionAllowed: autoAllowed,
    roleFitAllowed,
    definitiveTop5Allowed: top5Allowed,
    exactBudgetAllowed: budgetAllowed,
    commercialReady,
    commercialStatus: commercialReady ? 'PRONTA' : 'REVISAR',
    blockers: Array.from(new Set(blockers))
  };
}
