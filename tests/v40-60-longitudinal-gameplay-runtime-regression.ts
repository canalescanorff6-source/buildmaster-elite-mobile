import assert from 'node:assert/strict';
import type { AnalysisResult } from '../src/lib/analyzerDomain';
import { cardFingerprint, type MatchValidationRecord } from '../src/lib/appEvolution';
import { buildLongitudinalGameplayV4060, LONGITUDINAL_GAMEPLAY_V4060_MIN_SESSIONS } from '../src/lib/longitudinalGameplayLearningV4060';

const planA = { shooting: 8, passing: 4, dribbling: 8, dexterity: 8, lowerBodyStrength: 8, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
const planB = { shooting: 9, passing: 4, dribbling: 7, dexterity: 9, lowerBodyStrength: 7, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
const fixture = {
  objective: 'COMPETITIVE',
  parsed: {
    playerName: 'Carta Longitudinal', mainPosition: 'SS', mainPositionPt: 'SA', playstyle: 'Jogador de infiltração', level: 30,
    nativeSkills: ['Passe de primeira'], additionalSkills: [], specialSkills: [], confidence: 96,
    positions: ['SS'],
    attributes: { offensiveAwareness: 88, ballControl: 91, dribbling: 92, tightPossession: 90, lowPass: 84, loftedPass: 78, finishing: 86, speed: 86, acceleration: 90, kickingPower: 84, jump: 65, physicalContact: 64, balance: 90, stamina: 82 }
  },
  bestPosition: { code: 'SS', label: 'SA', score: 95 },
  tacticalProfile: { formation: '4-3-3', style: 'POSSE_DE_BOLA' },
  training: planA,
  trainingPointsTotal: 40,
  buildName: 'Ficha v40.60',
  maximumPerformanceV4040: {
    finalTraining: planA,
    winnerScore: 82,
    contextScores: { ranked: 82, events: 81, friends: 80, average: 81 },
    alternatives: [
      { id: 'MAXIMO_COMPETITIVO', label: 'Máximo competitivo', training: planA, score: 82, rankedScore: 82, dnaPreservation: 85, efficiencyScore: 88 },
      { id: 'RESPOSTA_ONLINE', label: 'Resposta online', training: planB, score: 80, rankedScore: 84, dnaPreservation: 78, efficiencyScore: 86 }
    ]
  }
} as unknown as AnalysisResult;

const fp = cardFingerprint(fixture);
function record(id: string, day: number, arm: 'A' | 'B', rating: 3 | 5, mode: MatchValidationRecord['mode']): MatchValidationRecord {
  const good = rating === 5;
  return {
    id, cardFingerprint: fp, playerName: fixture.parsed.playerName, targetPosition: 'SS', formation: '4-3-3', teamStyle: 'POSSE_DE_BOLA', buildName: 'teste', buildSignature: 'teste',
    playedAt: new Date(Date.UTC(2026, 7, day, 12, 0, Number(id.replace(/\D/g, '')) || 0)).toISOString(), minutes: 90,
    overallRating: rating, passing: rating, movement: rating, finishing: rating, defending: 3, physical: rating, stamina: rating, tags: [], note: '', mode, connection: 'stable',
    metrics: good
      ? { goals: arm === 'B' ? 2 : 1, assists: 1, passErrors: arm === 'B' ? 1 : 3, tackles: 0, interceptions: 0, ballLosses: arm === 'B' ? 1 : 4, dribblesCompleted: arm === 'B' ? 5 : 2, shots: 4, shotsOnTarget: arm === 'B' ? 3 : 2, runsBehind: arm === 'B' ? 4 : 2, keyPasses: 2, successfulPressures: 1 }
      : { goals: 0, assists: 0, passErrors: 4, tackles: 0, interceptions: 0, ballLosses: 5, dribblesCompleted: 1, shots: 2 },
    testedBuildId: arm === 'A' ? 'MAXIMO_COMPETITIVO' : 'RESPOSTA_ONLINE', testedBuildTitle: arm === 'A' ? 'Máximo competitivo' : 'Resposta online', testedBoosterName: 'Teste', experimentArm: arm,
    controlStyle: 'mixed', inputDelayRating: 1
  };
}

const oneDay: MatchValidationRecord[] = [];
for (let i = 0; i < 6; i += 1) {
  oneDay.push(record(`a${i}`, 10, 'A', 3, 'ranked'));
  oneDay.push(record(`b${i}`, 10, 'B', 5, 'ranked'));
}
const premature = buildLongitudinalGameplayV4060(fixture, oneDay);
assert.equal(premature.engineVersion, '40.60.0');
assert.equal(premature.distinctSessions, 1);
assert.notEqual(premature.action, 'PROMOVER_LONGITUDINAL', 'muitas partidas em um único dia não podem criar aprendizado permanente');
assert.equal(premature.verifiedWinnerId, null);

const sessions: MatchValidationRecord[] = [];
for (let day = 10; day < 10 + LONGITUDINAL_GAMEPLAY_V4060_MIN_SESSIONS; day += 1) {
  const mode = day === 10 ? 'ranked' : day === 11 ? 'events' : 'friendly';
  for (let i = 0; i < 2; i += 1) {
    sessions.push(record(`a${day}${i}`, day, 'A', 3, mode));
    sessions.push(record(`b${day}${i}`, day, 'B', 5, mode));
  }
}
const longitudinal = buildLongitudinalGameplayV4060(fixture, sessions);
assert.equal(longitudinal.distinctSessions, LONGITUDINAL_GAMEPLAY_V4060_MIN_SESSIONS);
assert.equal(longitudinal.leaderId, 'RESPOSTA_ONLINE');
assert.equal(longitudinal.action, 'PROMOVER_LONGITUDINAL');
assert.equal(longitudinal.verifiedWinnerId, 'RESPOSTA_ONLINE');
assert.ok(longitudinal.pairedSessions >= 2);
assert.ok(longitudinal.confidence.score >= 70);
assert.equal(longitudinal.driftDetected, false);
assert.equal(longitudinal.guarantees.v4050WinnerIsProvisionalUntilLongitudinal, true);
assert.equal(longitudinal.guarantees.driftCanSuspendPromotion, true);

console.log(`v40.60 runtime aprovada: ${longitudinal.totalMatches} partidas, ${longitudinal.distinctSessions} sessões, ${longitudinal.pairedSessions} pareadas, líder ${longitudinal.leaderLabel}, confiança ${Math.round(longitudinal.confidence.score)}/100.`);

const driftRecords = [...sessions];
for (let day = 13; day <= 14; day += 1) {
  for (let i = 0; i < 2; i += 1) {
    driftRecords.push(record(`ad${day}${i}`, day, 'A', 3, 'ranked'));
    driftRecords.push(record(`bd${day}${i}`, day, 'B', 3, 'ranked'));
  }
}
const drift = buildLongitudinalGameplayV4060(fixture, driftRecords);
assert.equal(drift.driftDetected, true, 'queda forte nas sessões recentes deve ativar proteção contra drift');
assert.equal(drift.action, 'SUSPENDER_POR_DRIFT');
assert.equal(drift.verifiedWinnerId, null, 'drift ativo nunca pode consolidar nova memória');
