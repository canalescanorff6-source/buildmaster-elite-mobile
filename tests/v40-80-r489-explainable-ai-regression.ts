import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EXPLAINABLE_AI_R489_VERSION,
  buildExplainableDecisionR489
} from '../src/modules/explainable-ai/explainableDecisionEngineR489';
import {
  confidenceCeilingR489,
  effectiveWeightR489,
  familyDiversityR489,
  independenceForR489
} from '../src/modules/explainable-ai/explainableEvidenceR489';

const kinds = ['BUILD', 'STARTER', 'ROTATION', 'TACTICAL', 'MATCH'] as const;

function availabilityFor(kind: typeof kinds[number]) {
  return {
    r480: kind === 'TACTICAL' || kind === 'ROTATION' ? 'UNAVAILABLE' : 'NOT_APPLICABLE',
    r481: kind === 'STARTER' || kind === 'ROTATION' || kind === 'TACTICAL' ? 'UNAVAILABLE' : 'NOT_APPLICABLE',
    r482: kind === 'MATCH' ? 'UNAVAILABLE' : 'NOT_APPLICABLE',
    r483: kind === 'BUILD' ? 'UNAVAILABLE' : 'NOT_APPLICABLE',
    r484: kind === 'STARTER' || kind === 'ROTATION' || kind === 'TACTICAL' ? 'UNAVAILABLE' : 'NOT_APPLICABLE'
  } as const;
}

assert.match(EXPLAINABLE_AI_R489_VERSION, /r489/i);

for (const kind of kinds) {
  const input = {
    kind,
    decisionId: `fixture-${kind.toLowerCase()}`,
    verdict: `${kind} preservado`,
    availability: availabilityFor(kind)
  } as any;

  const before = JSON.stringify(input);
  const first = buildExplainableDecisionR489(input);
  const second = buildExplainableDecisionR489(input);

  assert.equal(first.version, EXPLAINABLE_AI_R489_VERSION);
  assert.equal(first.kind, kind);
  assert.deepEqual(first, second, `${kind}: R489 precisa ser determinístico para o mesmo input.`);
  assert.equal(JSON.stringify(input), before, `${kind}: R489 não pode mutar a entrada.`);
  assert.deepEqual(first.availability, input.availability, `${kind}: disponibilidade deve permanecer rastreável.`);
  assert.ok(first.fingerprint.includes(kind), `${kind}: fingerprint precisa identificar o tipo da decisão.`);
  assert.equal(first.authority.readOnly, true);
  assert.equal(first.authority.canWriteTraining, false);
  assert.equal(first.authority.canWriteSkills, false);
  assert.equal(first.authority.canWriteImpetus, false);
  assert.equal(first.authority.canChangePosition, false);
  assert.equal(first.authority.canChangeLineupAutomatically, false);
  assert.equal(first.authority.canConfirmMatchMarkersAutomatically, false);
  assert.equal(first.authority.canWriteVault, false);
  assert.equal(first.authority.canOverrideR119, false);
  assert.equal(first.authority.canOverrideR126, false);
  assert.equal(first.authority.canOverrideR128, false);
  assert.equal(first.authority.optimizeOverall, false);
  assert.equal(first.performanceConfidence, null, `${kind}: sem prova de desempenho, confiança precisa ser nula.`);
  assert.equal(first.evidenceState, 'INSUFFICIENT');
  assert.ok(first.reasons.every((reason: any) => Array.isArray(reason.evidenceIds) && reason.evidenceIds.length > 0));

  const notApplicable = Object.entries(first.availability)
    .filter(([, state]) => state === 'NOT_APPLICABLE')
    .map(([source]) => source.toUpperCase());
  for (const source of notApplicable) {
    assert.ok(!first.limitations.some((item: string) => item.includes(source)), `${kind}: NOT_APPLICABLE não deve virar falha.`);
  }

  const unavailable = Object.entries(first.availability)
    .filter(([, state]) => state === 'UNAVAILABLE')
    .map(([source]) => source.toUpperCase());
  for (const source of unavailable) {
    assert.ok(first.limitations.some((item: string) => item.includes(source)), `${kind}: fonte relevante indisponível deve virar limitação.`);
  }
}

const blockedBuild = buildExplainableDecisionR489({
  kind: 'BUILD',
  decisionId: 'fixture-blocked-r128',
  verdict: 'Ficha oficial preservada',
  availability: {
    r480: 'NOT_APPLICABLE', r481: 'NOT_APPLICABLE', r482: 'NOT_APPLICABLE', r483: 'BLOCKED', r484: 'NOT_APPLICABLE'
  }
} as any);
assert.ok(blockedBuild.limitations.some((item: string) => item.includes('R483') && /bloquead/i.test(item)));

assert.equal(effectiveWeightR489({ nativeConfidence: 80, relevance: 0.5, independence: 0.75, completeness: 1 }), 0.3);
assert.equal(independenceForR489('R481', 'SAME_R480_CLAIM'), 0.75);
assert.equal(independenceForR489('R484', 'R481_ROTATION_DERIVED'), 0.65);
assert.equal(independenceForR489('R484', 'CHEMISTRY_ONLY'), 1);
assert.equal(independenceForR489('R482', 'CONFIRMED_MATCH'), 1);
assert.equal(confidenceCeilingR489(0), 35);
assert.equal(confidenceCeilingR489(1), 65);
assert.equal(confidenceCeilingR489(2), 82);
assert.equal(confidenceCeilingR489(3), 100);
assert.equal(familyDiversityR489([
  { family: 'TACTICAL_STRUCTURE', independence: 1, relevance: 1 },
  { family: 'SQUAD_STRUCTURE', independence: 0.75, relevance: 1 },
  { family: 'CHEMISTRY', independence: 0.65, relevance: 1 }
] as any), 1);
assert.equal(familyDiversityR489([
  { family: 'TACTICAL_STRUCTURE', independence: 1, relevance: 1 },
  { family: 'MATCH_EVIDENCE', independence: 1, relevance: 1 },
  { family: 'CHEMISTRY', independence: 1, relevance: 1 }
] as any), 3);

const officialVariant = { id: 'official', label: 'Oficial', plan: {}, pointsUsed: 20, pointsAvailable: 0, validBudget: true, score: 0, deltas: [], strengths: [], sacrifices: [], explanation: 'Oficial' };
const gameplayVariant = { id: 'gameplay', label: 'Gameplay', plan: {}, pointsUsed: 20, pointsAvailable: 0, validBudget: true, score: 8, deltas: [], strengths: ['Progressão'], sacrifices: ['Finalização'], explanation: 'Mais progressão' };
const buildDecision = buildExplainableDecisionR489({
  kind: 'BUILD', decisionId: 'official-card-1', verdict: 'Ficha Oficial',
  availability: { r480: 'NOT_APPLICABLE', r481: 'NOT_APPLICABLE', r482: 'NOT_APPLICABLE', r483: 'AVAILABLE', r484: 'NOT_APPLICABLE' },
  buildSimulator: { version: 'r483', baselineFingerprint: 'card-1', budget: 20, officialPointsUsed: 20, variants: [officialVariant, gameplayVariant], blockedReason: null, authority: {} }
} as any);
assert.equal(buildDecision.verdict, 'Ficha Oficial');
assert.ok(buildDecision.alternatives.some((item: string) => /Gameplay/.test(item)));
assert.ok(buildDecision.reasons.some((item: any) => item.type === 'TRADE_OFF' && item.evidenceIds.length));

const starter = { playerId: 'p1', playerName: 'Titular A', role: 'Orquestrador', line: 'meio', starterScore: 88, evidenceMatches: 3, replacementScore: 70, replacementGap: 18, importance: 91, reason: 'Alta importância estrutural' };
const squadBrain = { version: 'r481', confidence: 86, core: [starter], rotations: [], coverage: [], scenarioBench: [], evidence: { totalPlayers: 18, confirmedPlayers: 18, playersWithMatches: 8, matchRecords: 10 }, warnings: [], authority: {}, guardrails: [] };
const chemistry = { version: 'r484', confidence: 78, links: [{ id: 'l1', leftId: 'p1', leftName: 'Titular A', rightId: 'p2', rightName: 'Titular B', score: 84, label: 'forte', reasons: ['Boa conexão'], warnings: [], confidence: 79 }], rotations: [], evidence: { starters: 11, links: 12, sharedSessionLinks: 4 } };
const starterDecision = buildExplainableDecisionR489({
  kind: 'STARTER', decisionId: 'p1', verdict: 'Titular A é titular', starter, squadBrain, chemistry,
  availability: { r480: 'NOT_APPLICABLE', r481: 'AVAILABLE', r482: 'NOT_APPLICABLE', r483: 'NOT_APPLICABLE', r484: 'AVAILABLE' }
} as any);
assert.ok(starterDecision.evidence.some((item: any) => item.source === 'R481'));
assert.ok(starterDecision.evidence.some((item: any) => item.source === 'R484'));
assert.ok(starterDecision.reasons.some((item: any) => /import|titular/i.test(`${item.title} ${item.explanation}`)));

const starterNoChem = buildExplainableDecisionR489({
  kind: 'STARTER', decisionId: 'p1', verdict: 'Titular A é titular', starter, squadBrain,
  availability: { r480: 'NOT_APPLICABLE', r481: 'AVAILABLE', r482: 'NOT_APPLICABLE', r483: 'NOT_APPLICABLE', r484: 'UNAVAILABLE' }
} as any);
assert.equal(starterNoChem.evidence.some((item: any) => item.source === 'R484'), false);
assert.equal(starterNoChem.reasons.some((item: any) => /qu[ií]mica|entrosamento/i.test(`${item.title} ${item.explanation}`)), false);

const scenario = { id: 'proteger', label: 'Proteger resultado', readiness: 82, control: 75, progression: 61, defensiveSecurity: 89, transitionRisk: 24, confidence: 84, summary: 'Mais segurança', actions: ['Fechar o meio'] };
const rotation = { reserveId: 'r1', reserveName: 'Reserva B', replaces: 'Titular A', replacementMode: 'MANTER_FUNCAO', readiness: 81, evidenceMatches: 2, reason: 'Mantém a função' };
const twin = { version: 'r480', confidence: 84, scenarios: [scenario], evidence: { starters: 11, playersWithMatchEvidence: 8, starterEvidenceCoverage: 72, matchRecords: 12, contextualMatchRecords: 5, contextualAverageRating: 7 } };
const squadRotation = { ...squadBrain, rotations: [rotation], scenarioBench: [{ scenario: 'proteger', label: 'Proteger', reserveIds: ['r1'], reserveNames: ['Reserva B'], rationale: 'Cobertura' }] };
const chemistryRotation = { ...chemistry, rotations: [{ reserveId: 'r1', reserveName: 'Reserva B', replaces: 'Titular A', scoreBefore: 82, scoreAfter: 77, delta: -5, confidence: 74, summary: 'Queda pequena' }] };
const rotationDecision = buildExplainableDecisionR489({
  kind: 'ROTATION', decisionId: 'r1->p1', verdict: 'Reserva B por Titular A', rotation, scenario, tacticalTwin: twin, squadBrain: squadRotation, chemistry: chemistryRotation,
  availability: { r480: 'AVAILABLE', r481: 'AVAILABLE', r482: 'NOT_APPLICABLE', r483: 'NOT_APPLICABLE', r484: 'AVAILABLE' }
} as any);
assert.ok(rotationDecision.evidence.some((item: any) => item.source === 'R480'));
assert.ok(rotationDecision.evidence.some((item: any) => item.source === 'R481' && item.independence <= 0.75));
assert.ok(rotationDecision.evidence.some((item: any) => item.source === 'R484' && item.independence <= 0.65));

const syntheticRotation = buildExplainableDecisionR489({
  kind: 'ROTATION', decisionId: 'fake', verdict: 'Rotação inventada', rotation: { ...rotation, reserveId: 'fake' }, scenario, tacticalTwin: twin, squadBrain: squadRotation,
  availability: { r480: 'AVAILABLE', r481: 'AVAILABLE', r482: 'NOT_APPLICABLE', r483: 'NOT_APPLICABLE', r484: 'UNAVAILABLE' }
} as any);
assert.equal(syntheticRotation.evidence.some((item: any) => item.source === 'R481'), false, 'rotação ausente no R481 não pode virar evidência');

const tacticalDecision = buildExplainableDecisionR489({
  kind: 'TACTICAL', decisionId: 'proteger', verdict: 'Proteger resultado', scenario, tacticalTwin: twin, squadBrain: squadRotation, chemistry,
  availability: { r480: 'AVAILABLE', r481: 'AVAILABLE', r482: 'NOT_APPLICABLE', r483: 'NOT_APPLICABLE', r484: 'AVAILABLE' }
} as any);
assert.ok(tacticalDecision.evidence.some((item: any) => item.source === 'R480'));
assert.ok(tacticalDecision.evidence.some((item: any) => item.source === 'R481'));
assert.ok(tacticalDecision.evidence.some((item: any) => item.source === 'R484'));

const matchVision = {
  version: 'r482', confidence: 88,
  evidence: { durationMs: 600000, videoAnalyzed: true, videoQualityScore: 90, confirmedMarkers: 2, suggestedMarkers: 3, reviewedCoverage: 75, sampleCount: 10 },
  criticalWindows: [{ id: 'w1', centerMs: 120000, startMs: 110000, endMs: 130000, score: 86, phase: 'defensive-transition', title: 'Transição vulnerável', reason: 'Perda no corredor central', markerKinds: ['dangerous-turnover'], confirmedEvents: 2 }],
  recurringPatterns: [{ kind: 'dangerous-turnover', label: 'Perda perigosa', occurrences: 2, impact: 80, moments: [120000, 300000], phase: 'defensive-transition' }],
  strengths: [], risks: ['Transição'], phaseBalance: [], timeline: []
};
const matchDecision = buildExplainableDecisionR489({
  kind: 'MATCH', decisionId: 'match-1', verdict: 'Revisar transição defensiva', matchVision,
  availability: { r480: 'NOT_APPLICABLE', r481: 'NOT_APPLICABLE', r482: 'AVAILABLE', r483: 'NOT_APPLICABLE', r484: 'NOT_APPLICABLE' }
} as any);
assert.ok(matchDecision.evidence.some((item: any) => item.source === 'R482'));
assert.ok(matchDecision.reasons.some((item: any) => /Transição|Perda/i.test(`${item.title} ${item.explanation}`)));
assert.ok(matchDecision.limitations.some((item: string) => /3.*pendente/i.test(item)));
assert.equal(matchDecision.evidence.some((item: any) => /3.*suger|pendente/i.test(item.claim)), false, 'suggestedMarkers não podem ser prova confirmada');

const noConfirmedMatch = buildExplainableDecisionR489({
  kind: 'MATCH', decisionId: 'match-empty', verdict: 'Sem conclusão forte',
  matchVision: { ...matchVision, evidence: { ...matchVision.evidence, confirmedMarkers: 0, suggestedMarkers: 1 }, criticalWindows: [], recurringPatterns: [] },
  availability: { r480: 'NOT_APPLICABLE', r481: 'NOT_APPLICABLE', r482: 'AVAILABLE', r483: 'NOT_APPLICABLE', r484: 'NOT_APPLICABLE' }
} as any);
assert.equal(noConfirmedMatch.performanceConfidence, null);
assert.equal(noConfirmedMatch.evidence.length, 0);

for (const decision of [buildDecision, starterDecision, rotationDecision, tacticalDecision, matchDecision]) {
  const ids = new Set(decision.evidence.map((item: any) => item.id));
  assert.ok(decision.reasons.every((reason: any) => reason.evidenceIds.length > 0 && reason.evidenceIds.every((id: string) => ids.has(id))), 'todo motivo material precisa resolver para evidência real');
}

const engineSource = fs.readFileSync('src/modules/explainable-ai/explainableDecisionEngineR489.ts', 'utf8');
assert.doesNotMatch(engineSource, /fetch\(|localStorage|sessionStorage|upsert|setResult\(|setTraining|Math\.random|Date\.now|new Date\(/);
assert.doesNotMatch(engineSource, /\.overall\b|maxOverall|\bGER\b/);

console.log('R489 contrato, independência e cinco explicadores aprovados.');
