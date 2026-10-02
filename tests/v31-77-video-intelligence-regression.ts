import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  MATCH_EVENT_CATALOG,
  MATCH_TRAINER_VERSION,
  buildMatchTrainerEvolution,
  createMatchMarker,
  createMatchTrainerSession,
  exportMatchTrainerReport,
  getConfirmedMatchMarkers,
  getVisibleMatchMarkers,
  summarizeMatchTrainerSession
} from '../src/modules/matches/matchTrainerEngine';
import {
  MATCH_VISION_DIMENSIONS_R482,
  runMatchVisionR482,
  type MatchVisionObservationR482
} from '../src/modules/match-vision/matchVisionEngineR482';

assert.equal(MATCH_TRAINER_VERSION, '40.60.0');
for (const kind of ['defender-out-of-line', 'cursor-error', 'game-management', 'good-transition', 'critical-moment']) {
  assert.ok(MATCH_EVENT_CATALOG.some((item) => item.kind === kind), `Evento ${kind} não está no catálogo.`);
}

const session = createMatchTrainerSession({
  source: 'native-recording',
  fileName: 'partida-modelo.mp4',
  videoPath: '/private/partida-modelo.mp4',
  fileSizeBytes: 250_000_000,
  quality: 'high',
  formation: '4-3-3',
  teamStyle: 'Posse de bola',
  manager: 'Técnico de teste'
});

session.connectionRating = 4;
session.markers = [
  createMatchMarker('defender-out-of-line', 292_000, 'Maldini saiu da última linha antes da cobertura do volante.', 'manual', 96, {
    playerId: 'Maldini',
    observed: 'O zagueiro abandonou o corredor interno enquanto o atacante atacava o espaço central.',
    consequence: 'A troca seguinte ocorreu tarde e o lance terminou em gol sofrido.'
  }),
  createMatchMarker('cursor-error', 296_000, 'A troca para o defensor de cobertura aconteceu depois do passe.', 'manual', 92),
  createMatchMarker('good-transition', 505_000, 'Recuperação, passe vertical no tempo certo e ataque às costas.', 'manual', 95),
  createMatchMarker('game-management', 560_000, 'Com vantagem, a equipe acelerou sem necessidade.', 'manual', 90)
];
session.analysis = {
  engineVersion: MATCH_TRAINER_VERSION,
  analyzedAt: new Date().toISOString(),
  durationMs: 750_000,
  width: 1280,
  height: 720,
  sampleIntervalMs: 2000,
  sampleCount: 375,
  qualityScore: 91,
  confidence: 'high',
  motionAverage: .16,
  possibleFreezeCount: 0,
  highMotionMoments: [505_000],
  lowMotionMoments: [],
  samples: [],
  automaticMarkers: [
    createMatchMarker('critical-moment', 610_000, 'Pico visual para revisão.', 'automatic', 63)
  ],
  safeguards: [
    'Momentos automáticos são candidatos e só entram na nota depois de confirmação.',
    'O vídeo não confirma sozinho qual botão físico foi pressionado.'
  ]
};

assert.equal(getVisibleMatchMarkers(session).length, 5);
assert.equal(getConfirmedMatchMarkers(session).length, 4);

const summary = summarizeMatchTrainerSession(session);
assert.equal(summary.confirmedMarkers, 4);
assert.equal(summary.candidateMoments, 1);
assert.equal(summary.markingErrors, 1);
assert.equal(summary.cursorErrors, 1);
assert.equal(summary.goodPlays, 1);
assert.equal(summary.primaryProblem, 'defender-out-of-line');
assert.ok(summary.overallScore !== null && summary.overallScore >= 0 && summary.overallScore <= 10);
assert.ok(summary.topProblems[0]?.title.includes('Zagueiro'));
assert.ok(summary.topProblems[0]?.moments.includes(292_000));
assert.ok(summary.trainingPlan.some((drill) => /zagueiro|última linha/i.test(`${drill.title} ${drill.rule}`)));
assert.match(summary.tacticalDiagnosis.styleFit, /transição rápida|evidência suficiente/i);
assert.match(summary.tacticalDiagnosis.gameManagement, /vantagem|controle/i);

const report = exportMatchTrainerReport(session);
assert.match(report, /ANÁLISE DE VÍDEO INTELIGENTE 2\.0 v(?:38\.(?:39|40)|40\.(?:00|10|20|30|40|50|60|70|80))/);
assert.match(report, /04:52 — Zagueiro retirado da linha/);
assert.match(report, /Melhor decisão:/);
assert.match(report, /PLANO DE TREINO/);
assert.match(report, /Momentos automáticos são candidatos/);

const previous = createMatchTrainerSession({
  source: 'imported-video', fileName: 'anterior.mp4', formation: '4-3-3', teamStyle: 'Posse de bola', manager: 'Técnico de teste'
});
previous.updatedAt = new Date(Date.now() - 86_400_000).toISOString();
previous.markers = [
  createMatchMarker('pass-error', 20_000),
  createMatchMarker('pass-error', 40_000),
  createMatchMarker('defender-out-of-line', 60_000),
  createMatchMarker('defender-out-of-line', 80_000)
];
const evolution = buildMatchTrainerEvolution([session, previous], session.id);
assert.equal(evolution.sessionsAnalyzed, 2);
assert.ok(evolution.metrics.some((metric) => metric.id === 'defense'));
assert.ok(evolution.recurringProblem.length > 0);

const ui = fs.readFileSync('src/modules/matches/MatchTrainerCenter.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');
for (const text of [
  'Os três erros que mais prejudicaram',
  'Treino criado pelo vídeo',
  'Melhor decisão',
  'Ver clipe',
  'Rever em 0,5x',
  'A nota só usa lances confirmados',
  "['resumo', 'Resumo']",
  "['tatica', 'Tática']",
  "['evolucao', 'Evolução']"
]) assert.ok(ui.includes(text), `Interface não contém: ${text}`);
for (const selector of ['.match-analysis-tabs', '.match-priority-grid', '.match-drill-grid', '.match-evolution-grid', '.match-trust-note']) {
  assert.ok(css.includes(selector), `Estilo ausente: ${selector}`);
}

// Roadmap R482 — Match Vision: camada consultiva baseada apenas em evidência observada.
assert.deepEqual(MATCH_VISION_DIMENSIONS_R482, [
  'ZONES',
  'LINES',
  'ISOLATION',
  'FORCED_PASSES',
  'POSSESSION_LOSSES',
  'INVOLVEMENT',
  'SPACE_OCCUPATION',
  'PROGRESSION',
  'PRESSING',
  'TRANSITIONS',
  'FINISHING',
  'OFF_BALL_MOVEMENT'
]);

const noEvidence = runMatchVisionR482({ matchId: 'match-empty', observations: [] });
assert.equal(noEvidence.evidenceState, 'INSUFFICIENT');
assert.equal(noEvidence.completeness, 0);
assert.equal(noEvidence.confidence, 0);
assert.equal(noEvidence.definitive, false);
assert.equal(noEvidence.authority.certifiedForFinalWrite, false);

const oneVideoObservations: MatchVisionObservationR482[] = MATCH_VISION_DIMENSIONS_R482.map((dimension, index) => ({
  id: `video-${index + 1}`,
  sourceId: 'video-partida-01',
  sourceKind: 'VIDEO',
  dimension,
  description: `Evidência observada para ${dimension}.`,
  confidence: 0.92,
  timestampMs: 10_000 + index * 2_000
}));
const oneVideoSnapshot = JSON.parse(JSON.stringify(oneVideoObservations));
const oneVideo = runMatchVisionR482({ matchId: 'match-one-video', observations: oneVideoObservations });
assert.equal(oneVideo.completeness, 1);
assert.equal(oneVideo.evidenceState, 'PROVISIONAL');
assert.equal(oneVideo.definitive, false, 'Um único vídeo nunca pode virar verdade definitiva.');
assert.equal(oneVideo.authority.readOnly, true);
assert.equal(oneVideo.authority.writesFinalCard, false);
assert.equal(oneVideo.authority.writesTop5, false);
assert.equal(oneVideo.authority.writesSkills, false);
assert.equal(oneVideo.authority.writesImpetus, false);
assert.equal(oneVideo.authority.overallGerUsed, false);
assert.equal(oneVideo.authority.certifiedForFinalWrite, false);
assert.deepEqual(oneVideoObservations, oneVideoSnapshot, 'R482 não pode mutar a evidência de entrada.');

const multiSourceObservations: MatchVisionObservationR482[] = MATCH_VISION_DIMENSIONS_R482.slice(0, 9).flatMap((dimension, index) => [
  {
    id: `structured-${index + 1}`,
    sourceId: 'eventos-estruturados-01',
    sourceKind: 'STRUCTURED_EVENT',
    dimension,
    description: `Evento estruturado para ${dimension}.`,
    confidence: 0.84
  },
  {
    id: `review-${index + 1}`,
    sourceId: 'revisao-manual-01',
    sourceKind: 'MANUAL_REVIEW',
    dimension,
    description: `Revisão independente para ${dimension}.`,
    confidence: 0.78
  }
]);
const validated = runMatchVisionR482({ matchId: 'match-multi-source', observations: multiSourceObservations });
assert.equal(validated.completeness, 0.75);
assert.equal(validated.evidenceState, 'EXPERIMENTAL_VALIDATED');
assert.equal(validated.definitive, false);
assert.equal(validated.authority.certifiedForFinalWrite, false);
assert.deepEqual(validated.missingDimensions, MATCH_VISION_DIMENSIONS_R482.slice(9));
assert.ok(!JSON.stringify(validated).includes('ENGINE_CERTIFIED'));

const deterministicA = runMatchVisionR482({ matchId: 'match-deterministic', observations: [...multiSourceObservations].reverse() });
const deterministicB = runMatchVisionR482({ matchId: 'match-deterministic', observations: multiSourceObservations });
assert.deepEqual(deterministicA, deterministicB, 'Mesma evidência deve produzir a mesma saída, independentemente da ordem de entrada.');
for (const finding of deterministicA.dimensions) {
  assert.ok(finding.evidenceIds.length > 0);
  assert.ok(finding.observations.length > 0);
}

console.log('v31.77 + R482 aprovados: vídeo inteligente e Match Vision consultivo, determinístico e sem autoridade de escrita.');