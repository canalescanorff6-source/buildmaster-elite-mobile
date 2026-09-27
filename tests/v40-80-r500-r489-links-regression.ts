import assert from 'node:assert/strict';
import { buildAutonomousTacticalDirectorR500 } from '../src/modules/tactical-director/tacticalDirectorEngineR500';

function inputWith(explanations: any[]) {
  return {
    officialDecisionFingerprint: 'official-card-r500-links',
    formation: '4-2-2-2',
    teamStyle: 'POSSE_DE_BOLA',
    lineupContext: [{ slotId: 'DMF', cardFingerprint: 'card-a' }],
    tacticalTwin: {
      version: 'r480', mode: 'READ_ONLY_TACTICAL_SIMULATION', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', confidence: 88,
      evidence: { starters: 11, playersWithMatchEvidence: 4, starterEvidenceCoverage: 40, matchRecords: 4, contextualMatchRecords: 2, contextualAverageRating: 4 },
      structure: { globalScore: 82, attackScore: 80, midfieldScore: 86, defenseScore: 82, goalkeeperScore: 80, styleFit: 90, filledSlots: 11, totalSlots: 11 },
      strengths: ['Controle central'], risks: ['Transição'],
      scenarios: [{ id: 'base', label: 'Plano base', readiness: 86, control: 89, progression: 82, defensiveSecurity: 84, transitionRisk: 22, confidence: 88, summary: 'Estrutura base', actions: ['Apoio curto'] }],
      authority: {}, guardrails: []
    },
    squadBrain: null,
    matchVision: null,
    buildSimulator: null,
    chemistry: null,
    explanations,
    confirmedMatchRecords: [],
    proMetaContext: null,
    proMetaDataset: { version: 'empty', observations: [] },
    phase: 'PRE_MATCH',
    currentScenario: 'base',
    previousPlan: null
  } as any;
}

function explanation(fingerprint: string, verdict: string) {
  return {
    version: '40.80-r489-explainable-ai-v1',
    kind: 'TACTICAL',
    verdict,
    decisionConfidence: 90,
    performanceConfidence: 80,
    evidenceState: 'FULL',
    availability: {}, reasons: [], evidence: [], benefits: [], tradeOffs: [], risks: [], alternatives: [],
    counterfactual: { available: false, explanation: null, evidenceIds: [] },
    limitations: [], fingerprint, authority: {}, guardrails: []
  } as any;
}

const withoutR489 = buildAutonomousTacticalDirectorR500(inputWith([]));
const compatible = explanation('R489:TACTICAL:tactical:base:fixture', 'Plano base explicado');
const withCompatible = buildAutonomousTacticalDirectorR500(inputWith([compatible]));

assert.deepEqual(withCompatible.confidence, withoutR489.confidence, 'R489 não pode alterar nenhuma confiança do R500.');
assert.equal(withCompatible.planFingerprint, withoutR489.planFingerprint, 'R489 não pode alterar o fingerprint decisório do plano.');
assert.equal(withCompatible.explanations.length, 1);
assert.equal(withCompatible.explanations[0].fingerprint, compatible.fingerprint);

const incompatible = explanation('R489:TACTICAL:tactical:buscar:fixture', 'Explicação de outro cenário');
const withMismatch = buildAutonomousTacticalDirectorR500(inputWith([compatible, incompatible]));
assert.equal(withMismatch.explanations.length, 1, 'explicação R489 de outra decisão/cenário deve ser omitida.');
assert.equal(withMismatch.explanations[0].fingerprint, compatible.fingerprint);
assert.ok(withMismatch.limitations.some((item: string) => /R489|explica/i.test(item) && /incompat|omit/i.test(item)), 'mismatch R489 precisa virar limitação explícita.');
assert.deepEqual(withMismatch.confidence, withoutR489.confidence);
assert.equal(withMismatch.planFingerprint, withoutR489.planFingerprint);

console.log('R500/R489 aprovado: explicações compatíveis são vinculadas sem virar evidência ou confiança.');
