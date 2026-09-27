import assert from 'node:assert/strict';
import { buildTacticalMemoryR500 } from '../src/modules/tactical-director/tacticalDirectorMemoryR500';

function record(sessionId: string, tags: string[] = ['dangerous-turnover']) {
  return {
    id: `${sessionId}-p1`, cardFingerprint: 'card-a', playerName: 'A', targetPosition: 'CMF',
    formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', buildName: 'Oficial', buildSignature: 'sig', playedAt: '2026-09-26',
    minutes: 90, overallRating: 4, passing: 4, movement: 4, finishing: 3, defending: 3, physical: 3, stamina: 4,
    tags, note: '', sessionIdR462: sessionId
  } as any;
}

const context = { formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', cardFingerprints: ['card-a'], patternTag: 'dangerous-turnover' } as const;
assert.equal(buildTacticalMemoryR500([], context as any).state, 'SEM_EVIDENCIA');
assert.equal(buildTacticalMemoryR500([record('s1')], context as any).state, 'EM_OBSERVACAO');
assert.equal(buildTacticalMemoryR500([record('s1'), record('s2')], context as any).state, 'EM_OBSERVACAO');
assert.equal(buildTacticalMemoryR500([record('s1'), record('s2'), record('s3')], context as any).state, 'TENDENCIA');
assert.equal(buildTacticalMemoryR500([record('s1'), record('s2'), record('s3'), record('s4'), record('s5'), record('s6')], context as any).state, 'CONFIRMADO');
assert.notEqual(buildTacticalMemoryR500([record('s1'), record('s2'), record('s3'), record('s4'), record('s5'), record('s6')], { ...context, teamStyle: 'AUTO' } as any).state, 'CONFIRMADO');

const lowRate = [record('s1'), record('s2', []), record('s3', []), record('s4', []), record('s5', [])];
assert.notEqual(buildTacticalMemoryR500(lowRate, context as any).state, 'TENDENCIA');

const duplicateSession = [record('s1'), { ...record('s1'), id: 's1-p2', cardFingerprint: 'card-b', playerName: 'B' }];
const duplicated = buildTacticalMemoryR500(duplicateSession as any, { ...context, cardFingerprints: ['card-a','card-b'] } as any);
assert.equal(duplicated.compatibleMatches, 1, 'uma sessão com vários jogadores conta como uma partida');

console.log('R500 memória aprovada: contextual, confirmada e sem dupla contagem de sessão.');
