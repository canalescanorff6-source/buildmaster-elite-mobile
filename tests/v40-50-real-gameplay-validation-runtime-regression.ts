import assert from 'node:assert/strict';
import type { AnalysisResult } from '../src/lib/analyzerDomain';
import { cardFingerprint, type MatchValidationRecord } from '../src/lib/appEvolution';
import { buildRealGameplayValidationV4050, REAL_GAMEPLAY_VALIDATION_V4050_MIN_MATCHES_PER_ARM } from '../src/lib/realGameplayValidationV4050';

const planA = { shooting: 8, passing: 4, dribbling: 8, dexterity: 8, lowerBodyStrength: 8, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
const planB = { shooting: 9, passing: 4, dribbling: 7, dexterity: 9, lowerBodyStrength: 7, aerialStrength: 0, defending: 0, gk1: 0, gk2: 0, gk3: 0 };
const fixture = {
  objective: 'COMPETITIVE',
  parsed: {
    playerName: 'Carta Gameplay', mainPosition: 'SS', mainPositionPt: 'SA', playstyle: 'Jogador de infiltração', level: 30,
    nativeSkills: ['Passe de primeira'], additionalSkills: [], specialSkills: [], confidence: 95,
    attributes: { offensiveAwareness: 88, ballControl: 91, dribbling: 92, tightPossession: 90, lowPass: 84, loftedPass: 78, finishing: 86, speed: 86, acceleration: 90, kickingPower: 84, jump: 65, physicalContact: 64, balance: 90, stamina: 82 }
  },
  bestPosition: { code: 'SS', label: 'SA', score: 95 },
  tacticalProfile: { formation: '4-3-3', style: 'POSSE_DE_BOLA' },
  training: planA,
  trainingPointsTotal: 40,
  buildName: 'Ficha v40.50',
  maximumPerformanceV4040: {
    winnerScore: 82,
    contextScores: { ranked: 82, events: 81, friends: 80, average: 81 },
    alternatives: [
      { id: 'MAXIMO_COMPETITIVO', label: 'Máximo competitivo', training: planA, score: 82, rankedScore: 82, dnaPreservation: 85, efficiencyScore: 88 },
      { id: 'RESPOSTA_ONLINE', label: 'Resposta online', training: planB, score: 80, rankedScore: 84, dnaPreservation: 78, efficiencyScore: 86 }
    ]
  }
} as unknown as AnalysisResult;

const fp = cardFingerprint(fixture);
const record = (id: string, arm: 'A' | 'B', score: 1 | 2 | 3 | 4 | 5, connection: MatchValidationRecord['connection'] = 'stable', mode: MatchValidationRecord['mode'] = 'ranked'): MatchValidationRecord => ({
  id, cardFingerprint: fp, playerName: fixture.parsed.playerName, targetPosition: 'SS', formation: '4-3-3', teamStyle: 'POSSE_DE_BOLA', buildName: 'teste', buildSignature: 'teste', playedAt: new Date(2026, 7, 12, 12, 0, Number(id.replace(/\D/g, '')) || 0).toISOString(), minutes: 90,
  overallRating: score, passing: score, movement: score, finishing: score, defending: 3, physical: score, stamina: score, tags: [], note: '', mode, connection,
  metrics: score >= 4 ? { goals: arm === 'B' ? 2 : 1, assists: 1, passErrors: arm === 'B' ? 1 : 2, tackles: 0, interceptions: 0, ballLosses: arm === 'B' ? 1 : 3, dribblesCompleted: arm === 'B' ? 5 : 2, shots: 4, shotsOnTarget: arm === 'B' ? 3 : 2, runsBehind: arm === 'B' ? 4 : 2, keyPasses: 2, successfulPressures: 1 } : { goals: 0, assists: 0, passErrors: 5, tackles: 0, interceptions: 0, ballLosses: 7, dribblesCompleted: 0, shots: 2 },
  testedBuildId: arm === 'A' ? 'MAXIMO_COMPETITIVO' : 'RESPOSTA_ONLINE', testedBuildTitle: arm === 'A' ? 'Máximo competitivo' : 'Resposta online', testedBoosterName: 'Teste', experimentArm: arm,
  controlStyle: 'mixed', inputDelayRating: connection === 'high_delay' ? 5 : 1
});

const oneBadDelayed = buildRealGameplayValidationV4050(fixture, [record('1', 'A', 2, 'high_delay')]);
assert.equal(oneBadDelayed.engineVersion, '40.50.0');
assert.equal(oneBadDelayed.action, 'COLETAR', 'uma partida ruim com delay nunca pode trocar a ficha');
assert.equal(oneBadDelayed.verifiedWinnerId, null);
assert.ok(oneBadDelayed.effectiveMatches <= 1, 'delay alto deve reduzir a amostra efetiva');

const records: MatchValidationRecord[] = [];
for (let index = 0; index < REAL_GAMEPLAY_VALIDATION_V4050_MIN_MATCHES_PER_ARM; index += 1) {
  records.push(record(`a${index + 10}`, 'A', 3, 'stable', index % 2 ? 'events' : 'ranked'));
  records.push(record(`b${index + 20}`, 'B', 5, 'stable', index % 2 ? 'friendly' : 'ranked'));
}
const validated = buildRealGameplayValidationV4050(fixture, records);
assert.equal(validated.totalMatches, 10);
assert.ok(validated.arms.every((arm) => arm.rawMatches >= 5));
assert.equal(validated.leaderId, 'RESPOSTA_ONLINE');
assert.equal(validated.action, 'PROMOVER_ALTERNATIVA');
assert.equal(validated.verifiedWinnerId, 'RESPOSTA_ONLINE');
assert.equal(validated.guarantees.singleMatchNeverChangesBuild, true);
assert.equal(validated.guarantees.highDelayDownWeighted, true);
assert.equal(validated.guarantees.noAutomaticPointSpending, true);
assert.ok(validated.confidence.score >= 70);
assert.ok(validated.contextsCovered >= 3);

console.log(`v40.50 runtime aprovada: ${validated.totalMatches} partidas, amostra efetiva ${validated.effectiveMatches}, líder ${validated.leaderLabel}, confiança ${Math.round(validated.confidence.score)}/100.`);
