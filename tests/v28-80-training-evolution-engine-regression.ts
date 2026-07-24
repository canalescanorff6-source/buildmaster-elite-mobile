import assert from 'node:assert/strict';
import type { MatchValidationRecord } from '../src/lib/appEvolution';
import type { TeamDiagnosis } from '../src/modules/core/centralIntelligence';
import {
  DEFAULT_TRAINING_GOALS,
  TRAINING_DRILLS_V2880,
  TRAINING_ERROR_CATALOG,
  TRAINING_EVOLUTION_VERSION,
  analyzeTrainingEvolution,
  buildDailyTrainingPlan,
  buildPostTrainingAnalysis,
  buildRankedPreparation,
  buildWeeklyTrainingPlan,
  createTrainingSession,
  mergeTrainingSessions,
  migrateLegacyTrainingSessions,
  normalizeTrainingGoals
} from '../src/modules/training/trainingEvolutionEngine';

const now = new Date('2026-07-24T18:00:00.000Z');
const team = {
  formation: '4-2-2-2', styleFit: 86, styleNote: 'boa', globalScore: 82, filledSlots: 11, totalSlots: 11,
  strongestLine: 'Ataque', weakestLine: 'Defesa', missingRoles: [], repeatedFunctions: [], lineup: [], benchSuggestions: [], pairingNotes: [], recommendations: []
} as TeamDiagnosis;

const match = (daysAgo: number, ratings: Partial<MatchValidationRecord> = {}): MatchValidationRecord => ({
  id: `match-${daysAgo}`, cardFingerprint: 'card-1', playerName: 'Jogador', targetPosition: 'CMF', formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA', buildName: 'Competitiva', buildSignature: 'build-1', playedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
  minutes: 90, overallRating: 3, passing: 2, movement: 3, finishing: 3, defending: 2, physical: 3, stamina: 4, tags: [], note: '',
  ...ratings
});

assert.equal(TRAINING_EVOLUTION_VERSION, '28.80.0');
assert.equal(TRAINING_DRILLS_V2880.length, 12);
assert.equal(new Set(TRAINING_DRILLS_V2880.map((drill) => drill.id)).size, 12);
for (const area of ['ataque', 'defesa', 'posse', 'contra-ataque']) {
  assert.equal(TRAINING_DRILLS_V2880.filter((drill) => drill.area === area).length, 3, `${area} precisa ter 3 exercícios`);
}
assert.equal(TRAINING_ERROR_CATALOG.length >= 10, true);

assert.deepEqual(normalizeTrainingGoals({ dailyMinutes: 2, weeklySessions: 20, weeklyRepetitions: 900, focusArea: 'inválido' as never }), {
  dailyMinutes: 10, weeklySessions: 7, weeklyRepetitions: 700, focusArea: 'equilibrado'
});

const session = (daysAgo: number, score: number, area: 'ataque' | 'defesa' | 'posse' | 'contra-ataque', errors: string[] = []) => createTrainingSession({
  id: `session-${daysAgo}-${area}`, startedAt: new Date(now.getTime() - daysAgo * 86400000 - 1200000).toISOString(),
  completedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(), area,
  drillId: area === 'defesa' ? 'def-line-control' : area === 'ataque' ? 'atk-finish-balance' : area === 'posse' ? 'pos-two-touch' : 'cat-recover-three',
  mode: 'desenvolvimento', durationSeconds: 1200, repetitions: 30, successfulRepetitions: 24, score, effort: 3, errorTags: errors, note: ''
});

const sessions = [
  session(1, 9, 'defesa', ['pulled-defender']),
  session(2, 8, 'posse', ['late-pass']),
  session(3, 8, 'defesa', ['pulled-defender']),
  session(5, 7, 'ataque', ['rushed-shot']),
  session(8, 6, 'posse', ['late-pass']),
  session(16, 6, 'defesa', ['bad-tackle']),
  session(35, 5, 'defesa', ['pulled-defender']),
  session(40, 5, 'posse', ['late-pass'])
];

const current = createTrainingSession({
  id: 'clamped', startedAt: now.toISOString(), completedAt: now.toISOString(), area: 'ataque', drillId: 'atk-finish-balance', mode: 'pre-ranqueada',
  durationSeconds: 999999, repetitions: 10, successfulRepetitions: 99, score: 30, effort: 12, errorTags: ['rushed-shot', 'desconhecido'], note: 'x'.repeat(800)
});
assert.equal(current.durationSeconds, 14400);
assert.equal(current.successfulRepetitions, 10);
assert.equal(current.score, 10);
assert.equal(current.effort, 5);
assert.deepEqual(current.errorTags, ['rushed-shot']);
assert.equal(current.note.length, 500);

const merged = mergeTrainingSessions(sessions, [sessions[0]]);
assert.equal(merged.length, sessions.length);

const migrated = migrateLegacyTrainingSessions(
  [{ id: 'old-1', at: '2026-07-20T10:00:00.000Z', error: 'Puxei o zagueiro • Marcação atrasada', repetitions: 12, seconds: 480 }],
  [{ at: '2026-07-21T10:00:00.000Z', drillId: 'atk-one-touch', score: 8, errors: ['demorei para soltar a bola'], note: 'melhorou' }]
);
assert.equal(migrated.length, 2);
assert.equal(migrated.some((item) => item.area === 'defesa'), true);
assert.equal(migrated.some((item) => item.drillId === 'pos-two-touch'), true);

const daily = buildDailyTrainingPlan({ sessions, matches: [match(2)], team, goals: DEFAULT_TRAINING_GOALS, teamStyle: 'POSSE_DE_BOLA', now });
assert.equal(daily.drills.length >= 2, true);
assert.equal(daily.drills.every((drill) => drill.area === daily.focusArea || drill.area === 'posse'), true);
assert.equal(daily.targetMinutes >= 15, true);
assert.match(daily.reason, /Prioridade/);

const weekly = buildWeeklyTrainingPlan({ sessions, matches: [match(2)], team, goals: { ...DEFAULT_TRAINING_GOALS, weeklySessions: 4 }, teamStyle: 'POSSE_DE_BOLA', now });
assert.equal(weekly.length, 7);
assert.equal(weekly.filter((day) => !day.isRestDay).length, 4);
assert.equal(weekly.filter((day) => day.isRestDay).length, 3);
assert.equal(weekly.filter((day) => !day.isRestDay).every((day) => day.drillIds.length >= 1), true);

const evolution7 = analyzeTrainingEvolution(sessions, 7, now);
assert.equal(evolution7.sessionCount, 4);
assert.equal(evolution7.totalMinutes, 80);
assert.equal(evolution7.totalRepetitions, 120);
assert.equal(evolution7.successRate, 80);
assert.equal(evolution7.currentStreak >= 0, true);
assert.equal(evolution7.topErrors[0].count >= 1, true);
assert.equal(evolution7.areas.length, 4);

const evolution30 = analyzeTrainingEvolution(sessions, 30, now);
assert.equal(evolution30.sessionCount, 6);
assert.equal(evolution30.trend, 'subindo');
assert.equal(evolution30.scoreDelta > 0, true);
assert.equal(evolution30.recommendations.length >= 1, true);

const post = buildPostTrainingAnalysis(sessions[0], sessions.slice(1));
assert.equal(post.completionScore >= 0 && post.completionScore <= 100, true);
assert.equal(post.positives.length >= 1, true);
assert.match(post.nextAction, /Próximo treino|Repita/);

const ranked = buildRankedPreparation({ sessions, matches: [match(1, { overallRating: 4, passing: 4, defending: 4 })], team, goals: DEFAULT_TRAINING_GOALS, teamStyle: 'POSSE_DE_BOLA', now });
assert.equal(ranked.readinessScore >= 0 && ranked.readinessScore <= 100, true);
assert.equal(ranked.blocks.length, 3);
assert.equal(ranked.recommendedDurationMinutes, 20);
assert.equal(ranked.checklist.length, 5);
assert.equal(ranked.blocks.every((block) => TRAINING_DRILLS_V2880.some((drill) => drill.id === block.drillId)), true);

console.log('v28.80 training evolution engine regression: ok');
