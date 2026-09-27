import assert from 'node:assert/strict';
import { buildAutonomousTacticalDirectorR500 } from '../src/modules/tactical-director/tacticalDirectorEngineR500';
import { effectiveWeightR500 } from '../src/modules/tactical-director/tacticalDirectorEvidenceR500';

assert.equal(effectiveWeightR500({ nativeConfidence: 80, relevance: .5, independence: .75, completeness: 1, contextCompatibility: 1 }), .3);

const scenario = { id: 'base', label: 'Plano base', readiness: 84, control: 88, progression: 82, defensiveSecurity: 86, transitionRisk: 28, confidence: 84, summary: 'Controle central', actions: ['Apoio curto'] };
const twin = { version: 'r480', mode: 'READ_ONLY_TACTICAL_SIMULATION', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', confidence: 84, evidence: { starters: 11, playersWithMatchEvidence: 0, starterEvidenceCoverage: 0, matchRecords: 0, contextualMatchRecords: 0, contextualAverageRating: null }, structure: { globalScore: 84, attackScore: 82, midfieldScore: 88, defenseScore: 83, goalkeeperScore: 78, styleFit: 90, filledSlots: 11, totalSlots: 11 }, strengths: ['Meio'], risks: [], scenarios: [scenario], authority: {}, guardrails: [] };
const rotation = { reserveId: 'r1', reserveName: 'Reserva', replaces: 'Titular', replacementMode: 'MANTER_FUNCAO', readiness: 86, evidenceMatches: 2, reason: 'Mantém função' };
const squad = { version: 'r481', mode: 'READ_ONLY_SQUAD_ORCHESTRATION', confidence: 85, evidence: { totalPlayers: 18, confirmedPlayers: 18, playersWithMatches: 0, matchRecords: 0 }, core: [], rotations: [rotation], coverage: [], scenarioBench: [{ scenario: 'base', label: 'Base', reserveIds: ['r1'], reserveNames: ['Reserva'], rationale: 'Cobertura' }], warnings: [], authority: {}, guardrails: [] };
const chemistry = { version: 'r484', mode: 'READ_ONLY_CHEMISTRY_GRAPH', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', score: 82, confidence: 80, evidence: { starters: 11, links: 10, sharedSessionLinks: 0 }, counts: { strong: 3, good: 4, neutral: 2, redundant: 1, poor: 0 }, nodes: [], links: [], sectors: [], bestLink: null, weakestLink: null, mostConnected: null, mostIsolated: null, rotations: [{ reserveId: 'r1', reserveName: 'Reserva', replaces: 'Titular', scoreBefore: 82, scoreAfter: 75, delta: -7, confidence: 78, summary: 'Queda química' }], warnings: [], authority: {}, guardrails: [] };

const baseInput = { officialDecisionFingerprint: 'official-1', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', tacticalTwin: twin, squadBrain: squad, chemistry, matchVision: null, buildSimulator: null, explanations: [], confirmedMatchRecords: [], proMetaDataset: null, currentScenario: 'base', previousPlan: null };
const structuralOnly = buildAutonomousTacticalDirectorR500(baseInput as any);
assert.ok(structuralOnly.evidence.some((item: any) => item.source === 'R480'));
assert.ok(structuralOnly.evidence.some((item: any) => item.source === 'R481'));
assert.ok(structuralOnly.evidence.some((item: any) => item.source === 'R484'));
assert.ok(structuralOnly.evidence.filter((item: any) => ['R480','R481','R484'].includes(item.source)).every((item: any) => item.family === 'STRUCTURAL_TEAM'));
assert.ok(structuralOnly.confidence.planConfidence <= 65, 'sem partida confirmada o plano não pode passar de 65');
assert.ok(structuralOnly.conflicts.some((item: any) => item.level === 'MATERIAL' && /quím|quim/i.test(`${item.title} ${item.description}`)), 'rotação boa com química -7 precisa gerar conflito material');

const matchVision = { version: 'r482', mode: 'READ_ONLY_MATCH_VISION', confidence: 88, configuredContext: { formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA' }, evidence: { durationMs: 600000, videoAnalyzed: true, videoQualityScore: 90, confirmedMarkers: 3, suggestedMarkers: 2, reviewedCoverage: 80, sampleCount: 12 }, timeline: [], criticalWindows: [], recurringPatterns: [{ kind: 'dangerous-turnover', label: 'Perda perigosa', occurrences: 3, impact: 86, moments: [1,2,3], phase: 'defensive-transition' }], phaseBalance: [], styleObservation: '', connectionGuardrail: '', strengths: [], risks: ['Transição defensiva'], authority: {}, guardrails: [] };
const withMatch = buildAutonomousTacticalDirectorR500({ ...baseInput, matchVision } as any);
assert.ok(withMatch.evidence.some((item: any) => item.source === 'R482' && item.family === 'MATCH_CONFIRMED'));
assert.ok(withMatch.conflicts.some((item: any) => item.level === 'MATERIAL' && /transi|partida|execu/i.test(`${item.title} ${item.description}`)));
assert.ok(withMatch.confidence.evidenceConfidence >= structuralOnly.confidence.evidenceConfidence);

const suggestedOnly = buildAutonomousTacticalDirectorR500({ ...baseInput, matchVision: { ...matchVision, evidence: { ...matchVision.evidence, confirmedMarkers: 0, suggestedMarkers: 5 }, recurringPatterns: [] } } as any);
assert.equal(suggestedOnly.evidence.some((item: any) => item.source === 'R482'), false, 'suggested markers não podem virar evidência confirmada');

const withExplanation = buildAutonomousTacticalDirectorR500({ ...baseInput, explanations: [{ version: 'r489', kind: 'TACTICAL', verdict: 'Explicação', fingerprint: 'r489-fp' }] } as any);
assert.equal(withExplanation.evidence.some((item: any) => item.source === 'R489'), false, 'R489 explica mas não é família de evidência');

console.log('R500 engine base aprovado: evidência sem dupla contagem, conflitos explícitos e confiança limitada.');
