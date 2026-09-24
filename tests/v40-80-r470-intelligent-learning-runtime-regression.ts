import assert from 'node:assert/strict';
import {
  decideEvidenceRetentionR470,
  evaluateAbExperimentRowsR470
} from '../src/lib/intelligentLearningR470';
import type { MatchValidationRecord } from '../src/lib/appStartupContractsR200';

assert.equal(decideEvidenceRetentionR470({ ocrConfidence: 96, exactCardResolved: true }), 'HASH_ONLY');
assert.equal(decideEvidenceRetentionR470({ ocrConfidence: 84, exactCardResolved: true }), 'KEEP_TEMPORARY');
assert.equal(decideEvidenceRetentionR470({ ocrConfidence: 68, exactCardResolved: true }), 'KEEP_COMPRESSED');
assert.equal(decideEvidenceRetentionR470({ ocrConfidence: 98, exactCardResolved: false }), 'KEEP_COMPRESSED');
assert.equal(decideEvidenceRetentionR470({ ocrConfidence: 99, exactCardResolved: true, sourceConflict: true }), 'KEEP_COMPRESSED');

function row(id: string, arm: 'A' | 'B', score: 1|2|3|4|5, day: number, session: string): MatchValidationRecord {
  return {
    id,
    cardFingerprint: 'card-test',
    playerName: 'Teste R470',
    targetPosition: 'CF',
    formation: '4-2-2-2',
    teamStyle: 'POSSE_DE_BOLA',
    buildName: 'R470',
    buildSignature: arm === 'A' ? 'build-a' : 'build-b',
    playedAt: new Date(Date.UTC(2026, 8, day)).toISOString(),
    minutes: 90,
    overallRating: score,
    passing: score,
    movement: score,
    finishing: score,
    defending: 3,
    physical: score,
    stamina: score,
    tags: [],
    note: '',
    mode: 'ranked',
    connection: 'stable',
    experimentArm: arm,
    inputDelayRating: 2,
    gameVersion: '6.0.0',
    gameplayEpoch: 'V6',
    usageFunction: 'Artilheiro',
    sessionIdR462: session
  };
}

const rows: MatchValidationRecord[] = [
  row('a1','A',5,18,'sa1'),
  row('a2','A',5,19,'sa2'),
  row('a3','A',5,20,'sa3'),
  row('b1','B',3,18,'sb1'),
  row('b2','B',3,19,'sb2'),
  row('b3','B',3,20,'sb3')
];
const ab = evaluateAbExperimentRowsR470(rows, 'CF');
assert.equal(ab.status, 'STRONG_SIGNAL');
assert.equal(ab.evidenceLeadingArm, 'A');
assert.ok(Number(ab.difference) >= 4);
assert.ok(ab.confidence >= 50);

const empty = evaluateAbExperimentRowsR470([], 'CF');
assert.equal(empty.status, 'NO_TEST');
assert.equal(empty.evidenceLeadingArm, null);

console.log('R470 runtime aprovado: retenção adaptativa e A/B exigem evidência repetida.');
