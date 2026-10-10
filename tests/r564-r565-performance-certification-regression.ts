import * as assert from 'node:assert/strict';
import { ATTRIBUTE_INPUTS } from '../src/lib/analyzerDomain';
import { emptyTraining, trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { auditCardBuildR564, type CardAuditInputR564 } from '../src/lib/cardPerformanceAuditR564';
import { comparePerformanceBuildsR565 } from '../src/lib/buildComparisonR565';

const keys = ATTRIBUTE_INPUTS.map(item => item.key);
assert.equal(keys.length, 26);
const attributes = Object.fromEntries(keys.map(key => [key, 78]));
const card = {
  attributes,
  nativeSkills: ['Passe de primeira'],
  additionalSkills: ['Toque duplo'],
  impetos: [{ name: 'Passe', active: true }],
  evidence: { impetoSlotStatus: 'OCUPADO' },
} as CardAuditInputR564['card'];
const shooting = { ...emptyTraining(), shooting: 4 };
const passing = { ...emptyTraining(), passing: 4 };
assert.equal(trainingPlanTotalCost(shooting), 4);
const base = {
  card, plan: shooting, budget: 4,
  budgetProvenance: 'MANUAL_CONFIRMED' as const,
  baseProvenance: 'PRE_MANAGER_CONFIRMED' as const,
  confirmedBaseAttributeKeys: keys,
};
const clean = auditCardBuildR564(base);
assert.equal(clean.status, 'APROVADO');
assert.equal(clean.pointsUsed, 4);
assert.equal(clean.exactBudget, true);
assert.equal(clean.optimizationAllowed, true);
assert.equal(clean.managerProjectionEligible.balance, true);

const unknown = auditCardBuildR564({ ...base, baseProvenance: 'UNKNOWN' });
assert.equal(unknown.managerProjectionEligible.balance, false);
assert.equal(unknown.optimizationAllowed, false);
assert.equal(unknown.status, 'REVISAR');

const printed = auditCardBuildR564({ ...base, baseProvenance: 'ALREADY_BOOSTED' });
assert.equal(printed.managerProjectionEligible.tightPossession, false);
const invalidBudget = auditCardBuildR564({ ...base, plan: { ...shooting, shooting: 5 } });
assert.equal(invalidBudget.status, 'BLOQUEADO');
assert.ok(invalidBudget.issues.some(x => x.code === 'TREINO_EXCEDE_ORCAMENTO'));

const unread = auditCardBuildR564({ ...base, card: { ...card, attributes: { balance: 78 } } });
assert.equal(unread.optimizationAllowed, false);
assert.ok(unread.issues.some(x => x.code === 'ATRIBUTOS_INCOMPLETOS'));

const corrupted = auditCardBuildR564({ ...base, card: { ...card, attributes: { ...attributes, balance: 999 } } });
assert.equal(corrupted.status, 'BLOQUEADO');

const duplicated = auditCardBuildR564({ ...base, card: { ...card, additionalSkills: ['Passe de primeira'] } });
assert.ok(duplicated.issues.some(x => x.code === 'HABILIDADE_DUPLICADA'));

const proposals = [
  { id: 'equilibrada', objective: 'EQUILIBRADA' as const, training: shooting, modelScore: 71, metricId: 'field:test:v1', calibration: 'UNVERIFIED' as const },
  { id: 'especialista', objective: 'ESPECIALISTA' as const, training: passing, modelScore: 75, metricId: 'field:test:v1', calibration: 'UNVERIFIED' as const },
];
const noProof = comparePerformanceBuildsR565({
  card, budget: 4, baseProvenance: 'PRE_MANAGER_CONFIRMED',
  confirmedBaseAttributeKeys: keys, candidates: proposals,
});
assert.equal(noProof.verdict, 'INCONCLUSIVO');
assert.equal(noProof.leaderId, null);
assert.equal(noProof.candidates.length, 2);

const withEvidence = comparePerformanceBuildsR565({
  card, budget: 4, baseProvenance: 'PRE_MANAGER_CONFIRMED',
  confirmedBaseAttributeKeys: keys,
  candidates: proposals.map(p => ({ ...p, calibration: 'MATCH_CALIBRATED' as const })),
});
assert.equal(withEvidence.verdict, 'COMPARAVEL');
assert.equal(withEvidence.leaderId, 'especialista');

const wrongCost = comparePerformanceBuildsR565({
  card, budget: 4, baseProvenance: 'PRE_MANAGER_CONFIRMED',
  confirmedBaseAttributeKeys: keys,
  candidates: [...proposals, { ...proposals[0], id: 'overspent', training: { ...shooting, shooting: 5 } }],
});
assert.equal(wrongCost.candidates[2].status, 'REJEITADO');

const noBudget = comparePerformanceBuildsR565({
  card, budget: null, baseProvenance: 'PRE_MANAGER_CONFIRMED',
  confirmedBaseAttributeKeys: keys, candidates: proposals,
});
assert.equal(noBudget.verdict, 'INCONCLUSIVO');
console.log('R564/R565 GREEN — budgets, evidence, duplication guards, and calibrated comparisons');
