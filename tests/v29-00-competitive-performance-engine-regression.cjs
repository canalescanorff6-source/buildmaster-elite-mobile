require('./_ts-require.cjs');
const assert = require('assert/strict');
const {
  createCompetitiveMatchRecord,
  summarizeCompetitiveMatches,
  compareCompetitivePeriods,
  buildAutomaticCorrectionPlan,
  buildCompetitiveMonthlyReport
} = require('../src/modules/matches/competitivePerformanceEngine.ts');

const now = Date.parse('2026-07-24T18:00:00.000Z');
const base = {
  competition: 'Ranqueada', division: 'Divisão 2', formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', manager: 'Cruyff', opponentProfile: 'quick-counter',
  possession: 54, shots: 8, shotsOnTarget: 5, passErrors: 3, finishingErrors: 2, defensiveErrors: 1, turnovers: 5,
  substitutionsImpact: 4, connectionQuality: 3, notes: ''
};
const records = [
  createCompetitiveMatchRecord({ ...base, id: 'm1', playedAt: '2026-07-23T18:00:00.000Z', goalsFor: 2, goalsAgainst: 1 }),
  createCompetitiveMatchRecord({ ...base, id: 'm2', playedAt: '2026-07-21T18:00:00.000Z', goalsFor: 1, goalsAgainst: 1, passErrors: 5 }),
  createCompetitiveMatchRecord({ ...base, id: 'm3', playedAt: '2026-07-20T18:00:00.000Z', goalsFor: 3, goalsAgainst: 0, formation: '4-1-2-3', manager: 'Tuchel', defensiveErrors: 0 }),
  createCompetitiveMatchRecord({ ...base, id: 'old', playedAt: '2026-06-20T18:00:00.000Z', goalsFor: 0, goalsAgainst: 2, passErrors: 9, defensiveErrors: 4 })
];
const summary = summarizeCompetitiveMatches(records, 30, now);
assert.equal(summary.matches, 3);
assert.equal(summary.wins, 2);
assert.equal(summary.draws, 1);
assert.equal(summary.losses, 0);
assert.equal(summary.goalsFor, 6);
assert.equal(summary.goalsAgainst, 2);
assert.equal(summary.formations.length, 2);
assert.equal(summary.formations[0].matches >= 1, true);
assert.equal(summary.errorMap.length, 4);
assert.equal(summary.consistency >= 0 && summary.consistency <= 100, true);
const trends = compareCompetitivePeriods(records, 30, now);
assert.equal(trends.length, 6);
const plan = buildAutomaticCorrectionPlan(summary);
assert.equal(plan.immediateActions.length >= 3, true);
assert.equal(plan.weeklySessions.length, 3);
assert.match(plan.successMetric, /partida|jogo|período|perdas|consistência/i);
const report = buildCompetitiveMonthlyReport(records, now);
assert.match(report, /Relatório competitivo mensal/);
assert.match(report, /Melhores formações/);
console.log('v29.00 competitive performance engine regression: ok');
