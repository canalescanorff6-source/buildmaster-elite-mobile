import assert from 'node:assert/strict';
import {
  buildDirectorConflictsR500,
  buildDirectorEvidenceR500,
  directorConfidenceR500
} from '../src/modules/tactical-director/tacticalDirectorEvidenceR500';
import { buildAutonomousTacticalDirectorR500 } from '../src/modules/tactical-director/tacticalDirectorEngineR500';

function baseInput() {
  return {
    officialDecisionFingerprint: 'official-card-1',
    formation: '4-2-2-2',
    teamStyle: 'POSSE_DE_BOLA',
    lineupContext: [
      { slotId: 'DMF', cardFingerprint: 'card-a' },
      { slotId: 'AMF-L', cardFingerprint: 'card-b' }
    ],
    confirmedMatchRecords: [],
    explanations: [{
      version: 'r489', kind: 'TACTICAL', verdict: 'Explicação', decisionConfidence: 90,
      performanceConfidence: 90, evidenceState: 'FULL', availability: {}, reasons: [], evidence: [], benefits: [], tradeOffs: [], risks: [], alternatives: [], counterfactual: { available: false, explanation: null, evidenceIds: [] }, limitations: [], fingerprint: 'r489-fp', authority: {}, guardrails: []
    }],
    tacticalTwin: {
      version: 'r480', mode: 'READ_ONLY_TACTICAL_SIMULATION', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', confidence: 88,
      evidence: { starters: 11, playersWithMatchEvidence: 8, starterEvidenceCoverage: 72, matchRecords: 8, contextualMatchRecords: 5, contextualAverageRating: 4 },
      structure: { globalScore: 84, attackScore: 82, midfieldScore: 88, defenseScore: 85, goalkeeperScore: 80, styleFit: 91, filledSlots: 11, totalSlots: 11 },
      strengths: ['Controle central'], risks: [],
      scenarios: [{ id: 'base', label: 'Plano base', readiness: 88, control: 90, progression: 84, defensiveSecurity: 90, transitionRisk: 18, confidence: 89, summary: 'Estrutura segura', actions: ['Controlar o meio'] }],
      authority: {}, guardrails: []
    },
    squadBrain: {
      version: 'r481', mode: 'READ_ONLY_SQUAD_ORCHESTRATION', confidence: 87,
      evidence: { totalPlayers: 18, confirmedPlayers: 18, playersWithMatches: 8, matchRecords: 8 }, core: [],
      rotations: [{ reserveId: 'r1', reserveName: 'Reserva B', replaces: 'Titular A', replacementMode: 'MANTER_FUNCAO', readiness: 91, evidenceMatches: 3, reason: 'Boa cobertura' }],
      coverage: [{ line: 'defesa', label: 'Defesa', starters: 4, reserves: 2, averageStarterScore: 85, bestReserveScore: 82, status: 'forte', note: 'Coberta' }],
      scenarioBench: [{ scenario: 'base', label: 'Base', reserveIds: ['r1'], reserveNames: ['Reserva B'], rationale: 'Cobertura' }],
      warnings: [], authority: {}, guardrails: []
    },
    chemistry: {
      version: 'r484', mode: 'READ_ONLY_CHEMISTRY_GRAPH', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', score: 84, confidence: 82,
      evidence: { starters: 11, links: 12, sharedSessionLinks: 4 }, counts: { strong: 4, good: 5, neutral: 2, redundant: 1, poor: 0 },
      nodes: [], links: [], sectors: [], bestLink: null, weakestLink: null, mostConnected: null, mostIsolated: null,
      rotations: [{ reserveId: 'r1', reserveName: 'Reserva B', replaces: 'Titular A', scoreBefore: 84, scoreAfter: 79, delta: -5, confidence: 80, summary: 'Queda química' }],
      warnings: [], authority: {}, guardrails: []
    },
    matchVision: null,
    buildSimulator: null,
    proMetaContext: null,
    proMetaDataset: { version: 'fixture-empty', observations: [] },
    currentScenario: 'base',
    previousPlan: null
  } as any;
}

const structuralInput = baseInput();
const structuralEvidence = buildDirectorEvidenceR500(structuralInput, {
  memory: { state: 'SEM_EVIDENCIA', compatibleMatches: 0, confirmedSessions: 0, patterns: [], limitations: [] },
  applicableProMeta: []
});
const structuralFamilies = structuralEvidence
  .filter((item: any) => ['R480', 'R481', 'R484'].includes(item.source))
  .map((item: any) => item.family);
assert.ok(structuralFamilies.length >= 3);
assert.deepEqual([...new Set(structuralFamilies)], ['STRUCTURAL_TEAM'], 'R480/R481/R484 precisam continuar na mesma família correlacionada.');
assert.equal(structuralEvidence.some((item: any) => item.source === 'R489'), false, 'R489 explica, mas nunca vira evidência R500.');

const structuralConflicts = buildDirectorConflictsR500(structuralEvidence, structuralInput);
assert.ok(structuralConflicts.some((item: any) => item.level === 'MATERIAL' && /qu[ií]mica|rota[cç][aã]o/i.test(`${item.title} ${item.description}`)), 'rotação forte R481 com delta químico <= -3 precisa gerar conflito MATERIAL.');

const riskyInput = baseInput();
riskyInput.matchVision = {
  version: 'r482', mode: 'READ_ONLY_MATCH_VISION', confidence: 90,
  configuredContext: { formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA' },
  evidence: { durationMs: 600000, videoAnalyzed: true, videoQualityScore: 90, confirmedMarkers: 4, suggestedMarkers: 3, reviewedCoverage: 85, sampleCount: 8 },
  timeline: [], criticalWindows: [],
  recurringPatterns: [{ kind: 'dangerous-turnover', label: 'Perda perigosa', occurrences: 3, impact: 86, moments: [1, 2, 3], phase: 'defensive-transition' }],
  phaseBalance: [], styleObservation: '', connectionGuardrail: '', strengths: [], risks: ['Perdas perigosas'], authority: {}, guardrails: []
};
const riskyEvidence = buildDirectorEvidenceR500(riskyInput, {
  memory: { state: 'EM_OBSERVACAO', compatibleMatches: 1, confirmedSessions: 1, patterns: [], limitations: [] },
  applicableProMeta: []
});
const riskyConflicts = buildDirectorConflictsR500(riskyEvidence, riskyInput);
assert.ok(riskyConflicts.some((item: any) => item.level === 'MATERIAL' && /transi[cç][aã]o|perda|turnover/i.test(`${item.title} ${item.description}`)), 'R480 seguro + turnover recorrente R482 precisa aparecer como conflito MATERIAL.');

const mismatchInput = baseInput();
mismatchInput.chemistry = { ...mismatchInput.chemistry, formation: '4-3-1-2' };
const mismatchEvidence = buildDirectorEvidenceR500(mismatchInput, { memory: { state: 'SEM_EVIDENCIA', compatibleMatches: 0, confirmedSessions: 0, patterns: [], limitations: [] }, applicableProMeta: [] });
const mismatchConflicts = buildDirectorConflictsR500(mismatchEvidence, mismatchInput);
assert.ok(mismatchConflicts.some((item: any) => item.level === 'BLOCKING' && item.sourceIds.includes('R484')));

const noMatchConfidence = directorConfidenceR500({
  input: structuralInput,
  evidence: structuralEvidence,
  conflicts: structuralConflicts,
  memory: { state: 'SEM_EVIDENCIA', compatibleMatches: 0, confirmedSessions: 0, patterns: [], limitations: [] }
});
assert.ok(noMatchConfidence.planConfidence <= 65, 'sem evidência real compatível, planConfidence não pode passar de 65.');

const withMatchConfidence = directorConfidenceR500({
  input: riskyInput,
  evidence: riskyEvidence,
  conflicts: riskyConflicts,
  memory: { state: 'EM_OBSERVACAO', compatibleMatches: 1, confirmedSessions: 1, patterns: [], limitations: [] }
});
assert.ok(withMatchConfidence.planConfidence <= 85, 'estrutura + partida válida ainda respeitam teto 85 sem histórico convergente.');

const strongSyntheticEvidence = [
  { id: 's', family: 'STRUCTURAL_TEAM', source: 'R480', claim: 'estrutura', nativeConfidence: 100, relevance: 1, independence: 1, completeness: 1, contextCompatibility: 1, effectiveWeight: 1, fingerprint: 's' },
  { id: 'm', family: 'MATCH_CONFIRMED', source: 'R482', claim: 'partidas', nativeConfidence: 100, relevance: 1, independence: 1, completeness: 1, contextCompatibility: 1, effectiveWeight: 1, fingerprint: 'm' },
  { id: 'p', family: 'PRO_META', source: 'PRO_META', claim: 'pro', nativeConfidence: 100, relevance: 1, independence: 1, completeness: 1, contextCompatibility: 1, effectiveWeight: 1, fingerprint: 'p' },
  { id: 'b', family: 'BUILD_ALTERNATIVE', source: 'R483', claim: 'build', nativeConfidence: 100, relevance: 1, independence: 1, completeness: 1, contextCompatibility: 1, effectiveWeight: 1, fingerprint: 'b' }
] as any;
const highConfidence = directorConfidenceR500({
  input: baseInput(), evidence: strongSyntheticEvidence, conflicts: [],
  memory: { state: 'CONFIRMADO', compatibleMatches: 8, confirmedSessions: 8, patterns: ['controle 75%'], limitations: [] }
});
assert.ok(highConfidence.planConfidence > 85, 'acima de 85 exige múltiplas famílias independentes + histórico confirmado.');

const proOnly = directorConfidenceR500({
  input: baseInput(),
  evidence: [{ ...strongSyntheticEvidence[2] }],
  conflicts: [],
  memory: { state: 'SEM_EVIDENCIA', compatibleMatches: 0, confirmedSessions: 0, patterns: [], limitations: [] }
});
assert.ok(proOnly.planConfidence <= 65, 'Pro Meta sozinho nunca permite confiança acima de 65.');

const beforeWithR489 = directorConfidenceR500({ input: structuralInput, evidence: structuralEvidence, conflicts: structuralConflicts, memory: { state: 'SEM_EVIDENCIA', compatibleMatches: 0, confirmedSessions: 0, patterns: [], limitations: [] } });
const noR489Input = { ...structuralInput, explanations: [] };
const afterWithoutR489 = directorConfidenceR500({ input: noR489Input, evidence: structuralEvidence, conflicts: structuralConflicts, memory: { state: 'SEM_EVIDENCIA', compatibleMatches: 0, confirmedSessions: 0, patterns: [], limitations: [] } });
assert.deepEqual(beforeWithR489, afterWithoutR489, 'R489 não pode inflar nenhuma das três confianças.');

const enginePlan = buildAutonomousTacticalDirectorR500(riskyInput);
assert.ok(enginePlan.evidence.some((item: any) => item.family === 'STRUCTURAL_TEAM'));
assert.ok(enginePlan.evidence.some((item: any) => item.family === 'MATCH_CONFIRMED'));
assert.ok(enginePlan.conflicts.some((item: any) => item.level === 'MATERIAL'));
assert.ok(enginePlan.confidence.planConfidence > 0);
assert.ok(enginePlan.confidence.evidenceConfidence > 0);
assert.ok(enginePlan.confidence.executionConfidence > 0);

console.log('R500 engine base aprovado: evidência correlacionada, conflitos explícitos e três confianças calibradas.');
