import assert from 'node:assert/strict';
import { buildAutonomousTacticalDirectorR500 } from '../src/modules/tactical-director/tacticalDirectorEngineR500';

const scenario = { id: 'base', label: 'Base', readiness: 80, control: 80, progression: 80, defensiveSecurity: 80, transitionRisk: 20, confidence: 80, summary: 'Base', actions: ['Manter'] };
const twin = { version: 'r480', formation: '4-3-1-2', teamStyle: 'POSSE_DE_BOLA', confidence: 80, scenarios: [scenario], risks: [], strengths: [], evidence: { starters: 11, playersWithMatchEvidence: 0, starterEvidenceCoverage: 0, matchRecords: 0, contextualMatchRecords: 0, contextualAverageRating: null }, structure: { globalScore: 80, attackScore: 80, midfieldScore: 80, defenseScore: 80, goalkeeperScore: 80, styleFit: 80, filledSlots: 11, totalSlots: 11 }, authority: {}, guardrails: [] };
const chemistry = { version: 'r484', formation: '4-2-2-2', teamStyle: 'CONTRA_ATAQUE', score: 85, confidence: 85, evidence: { starters: 11, links: 10, sharedSessionLinks: 0 }, counts: { strong: 1, good: 1, neutral: 1, redundant: 0, poor: 0 }, nodes: [], links: [], sectors: [], bestLink: null, weakestLink: null, mostConnected: null, mostIsolated: null, rotations: [], warnings: [], authority: {}, guardrails: [] };

const result = buildAutonomousTacticalDirectorR500({ officialDecisionFingerprint: 'official-1', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', tacticalTwin: twin, squadBrain: null, matchVision: null, buildSimulator: null, chemistry, explanations: [], confirmedMatchRecords: [], proMetaDataset: null } as any);
assert.equal(result.evidence.some((item: any) => item.source === 'R480'), false, 'R480 de outra formação precisa ser excluído');
assert.equal(result.evidence.some((item: any) => item.source === 'R484'), false, 'R484 de outro estilo precisa ser excluído');
assert.ok(result.conflicts.some((item: any) => item.level === 'BLOCKING' && item.sourceIds.some((id: string) => id.includes('R480'))));
assert.ok(result.conflicts.some((item: any) => item.level === 'BLOCKING' && item.sourceIds.some((id: string) => id.includes('R484'))));
assert.ok(result.limitations.some((item: string) => /formação|formacao|estilo|context/i.test(item)));

const wrongBaseline = buildAutonomousTacticalDirectorR500({ officialDecisionFingerprint: 'official-1', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', tacticalTwin: null, squadBrain: null, matchVision: null, buildSimulator: { version: 'r483', baselineFingerprint: 'other-card', budget: 20, officialPointsUsed: 20, variants: [{ id: 'official' }, { id: 'gameplay' }], blockedReason: null, authority: {} }, chemistry: null, explanations: [], confirmedMatchRecords: [], proMetaDataset: null } as any);
assert.equal(wrongBaseline.evidence.some((item: any) => item.source === 'R483'), false, 'baseline R483 divergente não pode participar');
assert.ok(wrongBaseline.conflicts.some((item: any) => item.level === 'BLOCKING' && item.sourceIds.includes('R483')));

console.log('R500 coerência aprovada: fontes incompatíveis são bloqueadas, nunca corrigidas silenciosamente.');
