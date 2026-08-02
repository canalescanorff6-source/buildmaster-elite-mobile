import assert from 'node:assert/strict';
import {
  MATCH_TRAINER_VERSION,
  createMatchMarker,
  createMatchTrainerSession,
  exportMatchTrainerReport,
  summarizeMatchTrainerSession
} from '../src/modules/matches/matchTrainerEngine';

assert.equal(MATCH_TRAINER_VERSION, '38.35.0');

const session = createMatchTrainerSession({
  source: 'native-recording',
  fileName: 'match-1234567890123.mp4',
  videoPath: '/private/match-1234567890123.mp4',
  fileSizeBytes: 123456,
  quality: 'balanced',
  formation: '4-1-2-2-1',
  teamStyle: 'Posse de bola',
  manager: 'Técnico de teste'
});

session.markers = [
  createMatchMarker('pass-error', 20_000, 'Passe pelo centro com receptor marcado.'),
  createMatchMarker('pass-error', 42_000, 'Passe durante mudança de direção.'),
  createMatchMarker('dangerous-turnover', 42_000, 'Perda na frente da área.'),
  createMatchMarker('marking-error', 65_000, 'Zagueiro retirado da linha.'),
  createMatchMarker('possible-delay', 80_000, 'Comando visualmente atrasado.')
];
session.analysis = {
  engineVersion: MATCH_TRAINER_VERSION,
  analyzedAt: new Date().toISOString(),
  durationMs: 120_000,
  width: 1280,
  height: 720,
  sampleIntervalMs: 2000,
  sampleCount: 60,
  qualityScore: 88,
  confidence: 'high',
  motionAverage: .13,
  possibleFreezeCount: 1,
  highMotionMoments: [42_000],
  lowMotionMoments: [80_000],
  samples: [],
  automaticMarkers: [createMatchMarker('possible-delay', 82_000, 'Sinal automático pendente.', 'automatic', 45)],
  safeguards: ['Sinais automáticos precisam de revisão.']
};

const summary = summarizeMatchTrainerSession(session);
assert.equal(summary.passErrors, 2);
assert.equal(summary.dangerousTurnovers, 1);
assert.equal(summary.markingErrors, 1);
assert.equal(summary.possibleDelay, 1);
assert.equal(summary.primaryProblem, 'pass-error');
assert.ok(summary.priorities.some((item) => item.includes('passes verticais')));
assert.ok(summary.matchRules.some((item) => item.includes('volante')));

const report = exportMatchTrainerReport(session);
assert.match(report, /ANÁLISE DE VÍDEO INTELIGENTE 2\.0 v38\.35/);
assert.match(report, /00:42 — Perda de bola perigosa/);
assert.match(report, /Sinais automáticos precisam de revisão/);
assert.match(report, /4-1-2-2-1/);

console.log('v31.77 preserva sessões, marcadores, resumo e relatório com evidência confirmada.');
