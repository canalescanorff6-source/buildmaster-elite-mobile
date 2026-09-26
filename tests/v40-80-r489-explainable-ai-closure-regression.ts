import assert from 'node:assert/strict';
import { buildExplainableDecisionR489 } from '../src/modules/explainable-ai/explainableDecisionEngineR489';

const availabilityRotation = {
  r480: 'AVAILABLE', r481: 'AVAILABLE', r482: 'NOT_APPLICABLE', r483: 'NOT_APPLICABLE', r484: 'AVAILABLE'
} as const;
const scenario = { id: 'proteger', label: 'Proteger resultado', readiness: 82, control: 75, progression: 61, defensiveSecurity: 89, transitionRisk: 24, confidence: 84, summary: 'Mais segurança', actions: ['Fechar o meio'] };
const rotation = { reserveId: 'r1', reserveName: 'Reserva B', replaces: 'Titular A', replacementMode: 'MANTER_FUNCAO', readiness: 81, evidenceMatches: 2, reason: 'Mantém a função' };
const twin = { version: 'r480', confidence: 84, scenarios: [scenario], evidence: { starters: 11, playersWithMatchEvidence: 8, starterEvidenceCoverage: 72, matchRecords: 12, contextualMatchRecords: 5, contextualAverageRating: 7 } };
const squad = { version: 'r481', confidence: 86, core: [], rotations: [rotation], coverage: [], scenarioBench: [{ scenario: 'proteger', label: 'Proteger', reserveIds: ['r1'], reserveNames: ['Reserva B'], rationale: 'Cobertura' }], evidence: { totalPlayers: 18, confirmedPlayers: 18, playersWithMatches: 8, matchRecords: 10 }, warnings: [], authority: {}, guardrails: [] };
function chemistry(delta: number) {
  return {
    version: 'r484', confidence: 78, formation: '4-2-2-2', score: 81,
    links: [], evidence: { starters: 11, links: 12, sharedSessionLinks: 4 },
    rotations: [{ reserveId: 'r1', reserveName: 'Reserva B', replaces: 'Titular A', scoreBefore: 82, scoreAfter: 82 + delta, delta, confidence: 74, summary: delta < 0 ? 'Perde química' : 'Ganha química' }]
  };
}

const conflict = buildExplainableDecisionR489({
  kind: 'ROTATION', decisionId: 'r1->p1', verdict: 'Reserva B por Titular A', rotation, scenario, tacticalTwin: twin, squadBrain: squad, chemistry: chemistry(-7),
  availability: availabilityRotation
} as any);
const aligned = buildExplainableDecisionR489({
  kind: 'ROTATION', decisionId: 'r1->p1', verdict: 'Reserva B por Titular A', rotation, scenario, tacticalTwin: twin, squadBrain: squad, chemistry: chemistry(7),
  availability: availabilityRotation
} as any);
assert.ok(conflict.reasons.some((reason: any) => reason.type === 'CONTRADICTION'), 'benefício funcional + perda química precisa virar contradição explícita');
assert.ok((conflict.performanceConfidence ?? 0) < (aligned.performanceConfidence ?? 0), 'contradição precisa reduzir confiança de desempenho');

const official = { id: 'official', label: 'Oficial', plan: {}, pointsUsed: 20, pointsAvailable: 0, validBudget: true, score: 0, deltas: [], strengths: [], sacrifices: [], explanation: 'Oficial' };
const gameplay = { id: 'gameplay', label: 'Gameplay', plan: {}, pointsUsed: 20, pointsAvailable: 0, validBudget: true, score: 9, deltas: [], strengths: ['Progressão'], sacrifices: ['Finalização'], explanation: 'Mais progressão' };
function buildInput(baselineFingerprint: string, variants: any[], officialFingerprint = baselineFingerprint) {
  return {
    kind: 'BUILD', decisionId: `build:${officialFingerprint}`, verdict: 'Ficha Oficial',
    availability: { r480: 'NOT_APPLICABLE', r481: 'NOT_APPLICABLE', r482: 'NOT_APPLICABLE', r483: 'AVAILABLE', r484: 'NOT_APPLICABLE' },
    result: { parsed: { internalId: officialFingerprint } },
    buildSimulator: { version: 'r483', baselineFingerprint, budget: 20, officialPointsUsed: 20, variants, blockedReason: null, authority: {} }
  } as any;
}
const buildWithAlternative = buildExplainableDecisionR489(buildInput('card-A', [official, gameplay]));
assert.equal(buildWithAlternative.counterfactual.available, true);
assert.match(buildWithAlternative.counterfactual.explanation ?? '', /Gameplay/);
assert.ok(buildWithAlternative.counterfactual.evidenceIds.length > 0);
assert.ok(buildWithAlternative.counterfactual.evidenceIds.every((id: string) => buildWithAlternative.evidence.some((item: any) => item.id === id)));

const buildWithoutAlternative = buildExplainableDecisionR489(buildInput('card-A', [official]));
assert.deepEqual(buildWithoutAlternative.counterfactual, { available: false, explanation: null, evidenceIds: [] });

const changedFingerprint = buildExplainableDecisionR489(buildInput('card-B', [official, gameplay]));
assert.notEqual(buildWithAlternative.fingerprint, changedFingerprint.fingerprint, 'fingerprint deve incluir fingerprint/versão das fontes, não só ids lógicos');

const incompatibleBuild = buildExplainableDecisionR489(buildInput('card-A', [official, gameplay], 'card-B'));
assert.equal(incompatibleBuild.evidenceState, 'INSUFFICIENT', 'fingerprint incompatível deve degradar a explicação');
assert.equal(incompatibleBuild.performanceConfidence, null);
assert.equal(incompatibleBuild.evidence.length, 0);
assert.equal(incompatibleBuild.reasons.length, 0);
assert.equal(incompatibleBuild.alternatives.length, 0);
assert.deepEqual(incompatibleBuild.counterfactual, { available: false, explanation: null, evidenceIds: [] });
assert.ok(incompatibleBuild.limitations.some((item: string) => /fingerprint|incompat/i.test(item)), 'mismatch precisa ficar explícito como limitação');

const manyWindows = Array.from({ length: 8 }, (_, index) => ({
  id: `w${index}`, centerMs: 10000 * index, startMs: 10000 * index, endMs: 10000 * index + 5000,
  score: 90 - index, phase: 'defensive-transition', title: `Janela ${index}`, reason: `Risco ${index}`,
  markerKinds: ['dangerous-turnover'], confirmedEvents: 1
}));
const match = buildExplainableDecisionR489({
  kind: 'MATCH', decisionId: 'match-many', verdict: 'Revisar riscos',
  availability: { r480: 'NOT_APPLICABLE', r481: 'NOT_APPLICABLE', r482: 'AVAILABLE', r483: 'NOT_APPLICABLE', r484: 'NOT_APPLICABLE' },
  matchVision: {
    version: 'r482', confidence: 88,
    evidence: { durationMs: 600000, videoAnalyzed: true, videoQualityScore: 90, confirmedMarkers: 8, suggestedMarkers: 0, reviewedCoverage: 90, sampleCount: 12 },
    criticalWindows: manyWindows, recurringPatterns: [], strengths: [], risks: [], phaseBalance: [], timeline: []
  }
} as any);
assert.ok(match.reasons.length <= 5);
assert.ok(match.benefits.length <= 3 && match.tradeOffs.length <= 3 && match.risks.length <= 3 && match.alternatives.length <= 3);
for (let index = 1; index < match.reasons.length; index += 1) {
  assert.ok(match.reasons[index - 1].impact >= match.reasons[index].impact, 'ranking precisa respeitar impacto decrescente');
  assert.equal(match.reasons[index].rank, index + 1);
}

const minimalKinds = ['BUILD', 'STARTER', 'ROTATION', 'TACTICAL', 'MATCH'] as const;
for (const kind of minimalKinds) {
  const availability = {
    r480: 'NOT_APPLICABLE', r481: 'NOT_APPLICABLE', r482: 'NOT_APPLICABLE', r483: 'NOT_APPLICABLE', r484: 'NOT_APPLICABLE'
  } as const;
  const input = { kind, decisionId: `det-${kind}`, verdict: kind, availability } as any;
  const expected = buildExplainableDecisionR489(input);
  for (let pass = 0; pass < 10; pass += 1) assert.deepEqual(buildExplainableDecisionR489(input), expected);
}

console.log('R489 closure aprovada: contradição, contrafactual, ranking, caps, fingerprint e mismatch determinísticos.');
