import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildMatchVisionR482, MATCH_VISION_R482_VERSION } from '../src/modules/matches/matchVisionEngineR482';

const confirmedPassError = {
  id: 'm1',
  atMs: 120000,
  kind: 'pass-error',
  source: 'manual',
  confidence: 100,
  title: 'Passe forçado',
  detail: 'Passe vertical sem apoio.',
  phase: 'build-up',
  severity: 'medium',
  evidence: 'user-confirmed',
  reviewStatus: 'confirmed',
  why: 'Receptor pressionado.',
  repeated: true
};

const confirmedTurnover = {
  id: 'm2',
  atMs: 135000,
  kind: 'dangerous-turnover',
  source: 'manual',
  confidence: 100,
  title: 'Perda perigosa',
  detail: 'Perda no corredor central.',
  phase: 'defensive-transition',
  severity: 'high',
  evidence: 'user-confirmed',
  reviewStatus: 'confirmed',
  why: 'Estrutura exposta.'
};

const confirmedPositive = {
  id: 'm3',
  atMs: 360000,
  kind: 'good-build-up',
  source: 'manual',
  confidence: 100,
  title: 'Boa construção',
  detail: 'Saída apoiada.',
  phase: 'build-up',
  severity: 'positive',
  evidence: 'user-confirmed',
  reviewStatus: 'confirmed'
};

const suggestedOnly = {
  id: 'auto-1',
  atMs: 240000,
  kind: 'possible-delay',
  source: 'automatic',
  confidence: 61,
  title: 'Momento automático',
  detail: 'Pausa visual para revisar.',
  phase: 'unknown',
  severity: 'low',
  evidence: 'automatic-candidate',
  reviewStatus: 'suggested'
};

const session = {
  id: 's1',
  createdAt: '2026-09-25T00:00:00.000Z',
  updatedAt: '2026-09-25T00:00:00.000Z',
  title: 'Partida teste',
  source: 'imported-video',
  fileName: 'partida.mp4',
  fileSizeBytes: 123456,
  quality: 'imported',
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA',
  manager: 'Teste',
  connectionRating: 4,
  notes: '',
  status: 'review',
  markers: [confirmedPassError, confirmedTurnover, confirmedPositive],
  analysis: {
    engineVersion: '40.60.0',
    analyzedAt: '2026-09-25T00:00:00.000Z',
    durationMs: 600000,
    width: 1280,
    height: 720,
    sampleIntervalMs: 1000,
    sampleCount: 120,
    qualityScore: 82,
    confidence: 'high',
    motionAverage: 0.5,
    possibleFreezeCount: 2,
    highMotionMoments: [120000, 360000],
    lowMotionMoments: [240000],
    samples: [],
    automaticMarkers: [suggestedOnly],
    safeguards: []
  }
} as any;

const team = {
  formation: '4-2-2-2',
  styleFit: 88,
  globalScore: 82,
  filledSlots: 11,
  totalSlots: 11,
  strongestLine: 'Meio-campo',
  weakestLine: 'Defesa',
  missingRoles: [],
  repeatedFunctions: [],
  lineup: [],
  benchSuggestions: [],
  pairingNotes: [],
  recommendations: []
} as any;

const input = { session, team, teamStyle: 'POSSE_DE_BOLA' as const };
const before = JSON.stringify(input);
const first = buildMatchVisionR482(input);
const second = buildMatchVisionR482(input);

assert.equal(first.version, MATCH_VISION_R482_VERSION);
assert.equal(first.mode, 'READ_ONLY_MATCH_VISION');
assert.deepEqual(first, second, 'R482 precisa ser determinístico para o mesmo snapshot.');
assert.equal(JSON.stringify(input), before, 'R482 não pode mutar sessão, time ou análise.');

assert.equal(first.evidence.confirmedMarkers, 3);
assert.equal(first.evidence.suggestedMarkers, 1);
assert.equal(first.evidence.reviewedCoverage, 75);
assert.ok(first.timeline.length >= 4);
assert.ok(first.criticalWindows.length >= 1);
assert.ok(first.recurringPatterns.some((item) => item.kind === 'pass-error'));
assert.ok(first.recurringPatterns.some((item) => item.kind === 'dangerous-turnover'));
assert.ok(!first.recurringPatterns.some((item) => item.kind === 'possible-delay'),
  'Candidato automático pendente não pode virar padrão confirmado.');
assert.ok(first.connectionGuardrail.includes('não prova lag'));
assert.ok(first.guardrails.some((item) => item.includes('candidatos automáticos permanecem pendentes')));

assert.equal(first.authority.readOnly, true);
assert.equal(first.authority.canConfirmMarkersAutomatically, false);
assert.equal(first.authority.canWriteTraining, false);
assert.equal(first.authority.canWriteSkills, false);
assert.equal(first.authority.canWriteImpetus, false);
assert.equal(first.authority.canOverrideR128, false);
assert.equal(Object.prototype.hasOwnProperty.call(first, 'training'), false);
assert.equal(Object.prototype.hasOwnProperty.call(first, 'recommendedSkills'), false);
assert.equal(Object.prototype.hasOwnProperty.call(first, 'recommendedImpetos'), false);

const noConfirmed = buildMatchVisionR482({
  ...input,
  session: {
    ...session,
    markers: [],
    analysis: { ...session.analysis, automaticMarkers: [suggestedOnly] }
  }
});
assert.equal(noConfirmed.evidence.confirmedMarkers, 0);
assert.equal(noConfirmed.evidence.suggestedMarkers, 1);
assert.equal(noConfirmed.criticalWindows.length, 0);
assert.equal(noConfirmed.recurringPatterns.length, 0);
assert.ok(noConfirmed.confidence < first.confidence);

const ui = fs.readFileSync('src/modules/matches/MatchTrainerCenter.tsx', 'utf8');
assert.match(ui, /buildMatchVisionR482/);
assert.match(ui, /Match Vision/);
assert.match(ui, /matchVisionR482\.criticalWindows/);
assert.match(ui, /matchVisionR482\.recurringPatterns/);
assert.doesNotMatch(ui, /matchVisionR482[^\n]*setResult\(/);

console.log('R482 aprovada: Match Vision determinístico, read-only e baseado apenas em evidência confirmada para diagnóstico tático.');
