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
    r480: 'NOT_APPLICABLE',
    r481: 'NOT_APPLICABLE',
    r482: 'NOT_APPLICABLE',
    r483: 'BLOCKED',
    r484: 'NOT_APPLICABLE'
  }
} as any);
assert.ok(blockedBuild.limitations.some((item: string) => item.includes('R483') && /bloquead/i.test(item)));

assert.equal(
  effectiveWeightR489({ nativeConfidence: 80, relevance: 0.5, independence: 0.75, completeness: 1 }),
  0.3,
  'peso efetivo deve ser confiança normalizada × relevância × independência × completude'
);
assert.equal(independenceForR489('R481', 'SAME_R480_CLAIM'), 0.75);
assert.equal(independenceForR489('R484', 'R481_ROTATION_DERIVED'), 0.65);
assert.equal(independenceForR489('R484', 'CHEMISTRY_ONLY'), 1);
assert.equal(independenceForR489('R482', 'CONFIRMED_MATCH'), 1);
assert.equal(confidenceCeilingR489(0), 35);
assert.equal(confidenceCeilingR489(1), 65);
assert.equal(confidenceCeilingR489(2), 82);
assert.equal(confidenceCeilingR489(3), 100);

const dependentEvidence = [
  { family: 'TACTICAL_STRUCTURE', independence: 1, relevance: 1 },
  { family: 'SQUAD_STRUCTURE', independence: 0.75, relevance: 1 },
  { family: 'CHEMISTRY', independence: 0.65, relevance: 1 }
] as any;
assert.equal(familyDiversityR489(dependentEvidence), 1, 'R480 + R481 dependente + R484 derivado não podem contar como três confirmações independentes.');

const independentEvidence = [
  { family: 'TACTICAL_STRUCTURE', independence: 1, relevance: 1 },
  { family: 'MATCH_EVIDENCE', independence: 1, relevance: 1 },
  { family: 'CHEMISTRY', independence: 1, relevance: 1 }
] as any;
assert.equal(familyDiversityR489(independentEvidence), 3);

const engineSource = fs.readFileSync('src/modules/explainable-ai/explainableDecisionEngineR489.ts', 'utf8');
assert.doesNotMatch(engineSource, /fetch\(|localStorage|sessionStorage|upsert|setResult\(|setTraining|Math\.random|Date\.now|new Date\(/);
assert.doesNotMatch(engineSource, /\.overall\b|maxOverall|\bGER\b/);

console.log('R489 contrato base e regras de independência aprovados.');
