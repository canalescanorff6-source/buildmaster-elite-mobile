import assert from 'node:assert/strict';
import {
  ANTI_DELAY_VERSION,
  classifyMatchMistakes,
  createAntiDelaySample,
  diagnoseAntiDelay,
  linkSampleToMatch,
  summarizeAntiDelayHistory
} from '@/modules/performance/antiDelayEngine';
import {
  SMART_COACH_VERSION,
  buildSmartCoachReport,
  createSmartCoachReview
} from '@/modules/coaching/smartCoachEngine';
import type { CompetitiveMatchRecord } from '@/modules/matches/competitivePerformanceEngine';
import type { TrainingSessionRecord } from '@/modules/training/trainingEvolutionEngine';
import type { TeamDiagnosis } from '@/modules/core/centralIntelligence';

assert.equal(ANTI_DELAY_VERSION, '29.60.0');
const good = createAntiDelaySample({ deviceLabel: 'S20 FE', connectionKind: 'wifi-5ghz', pingMs: 34, jitterMs: 4, packetLossPct: 0, downlinkMbps: 180, signalQuality: 92, batteryPct: 80, batterySaver: false, memoryFreeGb: 3.2, thermalLevel: 2, backgroundLoad: 1, perceivedDelay: 1, source: 'mixed' });
const bad = createAntiDelaySample({ deviceLabel: 'S20 FE', connectionKind: 'wifi-2.4ghz', pingMs: 145, jitterMs: 31, packetLossPct: 5, downlinkMbps: 8, signalQuality: 38, batteryPct: 12, batterySaver: true, memoryFreeGb: .5, thermalLevel: 5, backgroundLoad: 5, perceivedDelay: 5, source: 'manual', measuredAt: new Date(Date.now() - 86400000).toISOString(), hour: 21 });
const goodDiagnosis = diagnoseAntiDelay(good);
const badDiagnosis = diagnoseAntiDelay(bad);
assert.ok(goodDiagnosis.score > badDiagnosis.score);
assert.equal(goodDiagnosis.metrics.length, 6);
assert.ok(badDiagnosis.blockers.length >= 4);
assert.ok(badDiagnosis.preMatchChecklist.some((item) => !item.passed));

const match: CompetitiveMatchRecord = {
  id: 'match-1', playedAt: new Date().toISOString(), competition: 'Ranqueada', division: 'Divisão 2', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', manager: 'Cruyff', opponentProfile: 'quick-counter', goalsFor: 1, goalsAgainst: 2, possession: 54, shots: 8, shotsOnTarget: 3, passErrors: 9, finishingErrors: 3, defensiveErrors: 4, turnovers: 12, substitutionsImpact: 3, connectionQuality: 2, notes: ''
};
const classification = classifyMatchMistakes(bad, match);
assert.ok(classification.probableDelayShare > 40);
assert.equal(classification.probableDelayShare + classification.technicalMistakeShare, 100);
const links = [linkSampleToMatch(good, match), linkSampleToMatch(bad, match)];
const history = summarizeAntiDelayHistory([good, bad], links);
assert.equal(history.samples, 2);
assert.ok(history.bestHours.length >= 1);
assert.ok(history.connectionRanking.length === 2);

const sessions: TrainingSessionRecord[] = [
  { schemaVersion: 1, id: 't1', startedAt: new Date(Date.now() - 2 * 86400000).toISOString(), completedAt: new Date(Date.now() - 2 * 86400000 + 1200000).toISOString(), area: 'posse', drillId: 'pos-two-touch', mode: 'desenvolvimento', durationSeconds: 1200, repetitions: 20, successfulRepetitions: 12, score: 60, effort: 3, errorTags: ['Passe precipitado'], note: '' },
  { schemaVersion: 1, id: 't2', startedAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date(Date.now() - 86400000 + 1200000).toISOString(), area: 'defesa', drillId: 'def-line-control', mode: 'desenvolvimento', durationSeconds: 1200, repetitions: 14, successfulRepetitions: 10, score: 72, effort: 4, errorTags: ['Puxou o zagueiro'], note: '' }
];
const team = {
  formation: '4-2-2-2', styleFit: 82, styleNote: '', globalScore: 78, filledSlots: 11, totalSlots: 11, strongestLine: 'Meio', weakestLine: 'Defesa', missingRoles: [], repeatedFunctions: [], lineup: [], benchSuggestions: [], pairingNotes: [], recommendations: []
} as unknown as TeamDiagnosis;
const report = buildSmartCoachReport({ team, trainingSessions: sessions, competitiveMatches: [match, { ...match, id: 'match-2', goalsFor: 3, goalsAgainst: 1, playedAt: new Date(Date.now() - 3 * 86400000).toISOString(), connectionQuality: 4 }], delayHistory: history, preferences: { sessionsPerWeek: 4, minutesPerSession: 25, preferredStyle: 'POSSE_DE_BOLA' }, reviews: [] });
assert.equal(SMART_COACH_VERSION, '29.60.0');
assert.equal(report.plan.length, 7);
assert.ok(report.topErrors.length >= 1);
assert.ok(report.achievements.length >= 4);
assert.ok(report.explanations.every(Boolean));
assert.ok(report.formationRecommendation);
const review = createSmartCoachReview(report, 'Revisão concluída', ['Jogar em dois toques']);
const reviewed = buildSmartCoachReport({ team, trainingSessions: sessions, competitiveMatches: [match], delayHistory: history, reviews: [review] });
assert.equal(reviewed.needsWeeklyReview, false);
console.log('v29.60 anti-delay + smart coach: OK');
