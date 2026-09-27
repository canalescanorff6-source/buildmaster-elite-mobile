import assert from 'node:assert/strict';
import { buildAutonomousTacticalDirectorR500 } from '../src/modules/tactical-director/tacticalDirectorEngineR500';

function twin(baseReadiness: number, buscarReadiness: number) {
  return {
    version: 'r480', mode: 'READ_ONLY_TACTICAL_SIMULATION', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', confidence: 85,
    evidence: { starters: 11, playersWithMatchEvidence: 0, starterEvidenceCoverage: 0, matchRecords: 0, contextualMatchRecords: 0, contextualAverageRating: null },
    structure: { globalScore: 85, attackScore: 85, midfieldScore: 85, defenseScore: 85, goalkeeperScore: 80, styleFit: 90, filledSlots: 11, totalSlots: 11 }, strengths: [], risks: [], authority: {}, guardrails: [],
    scenarios: [
      { id: 'base', label: 'Plano base', readiness: baseReadiness, control: 85, progression: 82, defensiveSecurity: 84, transitionRisk: 28, confidence: 84, summary: 'Base', actions: ['Manter estrutura'] },
      { id: 'buscar', label: 'Buscar', readiness: buscarReadiness, control: 75, progression: 92, defensiveSecurity: 70, transitionRisk: 45, confidence: 82, summary: 'Buscar resultado', actions: ['Aumentar presença'] }
    ]
  } as any;
}

const previous = {
  version: 'r500', availability: 'PARTIAL', phase: 'PRE_MATCH', contextFingerprint: 'ctx', planFingerprint: 'prev', scenario: 'base', title: 'Base', summary: '', priorities: [], risks: [], recommendedActions: [], contingencies: [], conflicts: [], confidence: { planConfidence: 84, evidenceConfidence: 60, executionConfidence: 80 }, evidence: [], proMeta: { available: false, datasetVersion: null, datasetDigest: null, applicableObservationIds: [], compatibility: 0, notes: [] }, memory: { state: 'SEM_EVIDENCIA', compatibleMatches: 0, confirmedPatternRate: null, notes: [] }, explanations: [], limitations: [], authority: {}, guardrails: []
} as any;

const baseInput = { officialDecisionFingerprint: 'official', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', squadBrain: null, chemistry: null, matchVision: null, buildSimulator: null, explanations: [], confirmedMatchRecords: [], proMetaDataset: null, previousPlan: previous };

const plusTwo = buildAutonomousTacticalDirectorR500({ ...baseInput, tacticalTwin: twin(84, 86) } as any);
assert.equal(plusTwo.scenario, 'base', 'ganho +2 não pode derrubar plano atual');

const plusEight = buildAutonomousTacticalDirectorR500({ ...baseInput, tacticalTwin: twin(84, 92) } as any);
assert.equal(plusEight.scenario, 'buscar', 'ganho +8 pode promover candidato');

const explicit = buildAutonomousTacticalDirectorR500({ ...baseInput, tacticalTwin: twin(84, 86), currentScenario: 'buscar' } as any);
assert.equal(explicit.scenario, 'buscar', 'mudança explícita do usuário ignora histerese automática');

const inMatch = buildAutonomousTacticalDirectorR500({ ...baseInput, tacticalTwin: twin(84, 92), phase: 'IN_MATCH_PREPARED' } as any);
assert.equal(inMatch.phase, 'IN_MATCH_PREPARED');
assert.ok(inMatch.summary.toLowerCase().includes('condicional') || inMatch.guardrails.some((item: string) => /tempo real|telemetria/i.test(item)));

const postMatch = buildAutonomousTacticalDirectorR500({ ...baseInput, tacticalTwin: twin(84, 92), phase: 'POST_MATCH', matchVision: { version: 'r482', confidence: 88, configuredContext: { formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA' }, evidence: { confirmedMarkers: 2, suggestedMarkers: 0, reviewedCoverage: 90, durationMs: 1, videoAnalyzed: true, videoQualityScore: 90, sampleCount: 2 }, timeline: [], criticalWindows: [], recurringPatterns: [{ kind: 'dangerous-turnover', label: 'Perda perigosa', occurrences: 2, impact: 85, moments: [1,2], phase: 'defensive-transition' }], phaseBalance: [], styleObservation: '', connectionGuardrail: '', strengths: [], risks: ['Transição'], authority: {}, guardrails: [] } } as any);
assert.equal(postMatch.phase, 'POST_MATCH');
assert.ok(/execu|partida|plano/i.test(`${postMatch.summary} ${postMatch.limitations.join(' ')}`));

console.log('R500 histerese e fases aprovadas: estável, condicional e auditável.');
