import assert from 'node:assert/strict';
import { buildTacticalMemoryR500 } from '../src/modules/tactical-director/tacticalDirectorMemoryR500';

function record(sessionId: string | undefined, tags: string[], overrides: Record<string, unknown> = {}) {
  return {
    id: `record-${sessionId ?? Math.random()}`,
    cardFingerprint: 'card-a',
    playerName: 'Jogador A',
    targetPosition: 'CMF',
    formation: '4-2-2-2',
    teamStyle: 'POSSE_DE_BOLA',
    buildName: 'Oficial',
    buildSignature: 'build-a',
    playedAt: '2026-09-26T20:00:00.000Z',
    minutes: 90,
    overallRating: 4,
    passing: 4,
    movement: 4,
    finishing: 3,
    defending: 3,
    physical: 3,
    stamina: 4,
    tags,
    note: '',
    sessionIdR462: sessionId,
    ...overrides
  } as any;
}

const context = {
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA',
  cardFingerprints: ['card-a']
} as const;

const empty = buildTacticalMemoryR500([], context);
assert.equal(empty.state, 'SEM_EVIDENCIA');
assert.equal(empty.compatibleMatches, 0);
assert.equal(empty.confirmedSessions, 0);

const observed = buildTacticalMemoryR500([
  record('s1', ['controle-central'])
], context);
assert.equal(observed.state, 'EM_OBSERVACAO');
assert.equal(observed.compatibleMatches, 1);
assert.equal(observed.confirmedSessions, 1);

const trend = buildTacticalMemoryR500([
  record('s1', ['controle-central']),
  record('s2', ['controle-central']),
  record('s3', ['controle-central']),
  record('s4', ['risco-transicao']),
  record('s5', ['risco-transicao'])
], context);
assert.equal(trend.state, 'TENDENCIA');
assert.ok(trend.patterns.some((item: string) => /controle-central/i.test(item)));

const confirmed = buildTacticalMemoryR500([
  record('s1', ['controle-central']),
  record('s2', ['controle-central']),
  record('s3', ['controle-central']),
  record('s4', ['controle-central']),
  record('s5', ['controle-central']),
  record('s6', ['risco-transicao'])
], context);
assert.equal(confirmed.state, 'CONFIRMADO');

const autoContext = { ...context, teamStyle: 'AUTO' } as const;
const autoRecords = [1, 2, 3, 4, 5, 6].map((index) => record(`a${index}`, ['controle-central'], { teamStyle: 'AUTO' }));
const autoMemory = buildTacticalMemoryR500(autoRecords, autoContext as any);
assert.notEqual(autoMemory.state, 'CONFIRMADO', 'AUTO nunca pode promover memória para CONFIRMADO.');

const mixedContext = buildTacticalMemoryR500([
  record('m1', ['controle-central']),
  record('m2', ['controle-central'], { formation: '4-3-1-2' }),
  record('m3', ['controle-central'], { teamStyle: 'CONTRA_ATAQUE' }),
  record('m4', ['controle-central'], { cardFingerprint: 'card-b' })
], context);
assert.equal(mixedContext.confirmedSessions, 1, 'formação, estilo ou carta incompatível não podem contaminar a memória atual.');

const duplicateSession = buildTacticalMemoryR500([
  record('dup-1', ['controle-central']),
  record('dup-1', ['risco-transicao'], { id: 'same-session-second-player' })
], context, {
  sessionId: 'dup-1',
  snapshot: {
    version: 'r482',
    mode: 'READ_ONLY_MATCH_VISION',
    confidence: 90,
    configuredContext: { formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA' },
    evidence: {
      durationMs: 600000,
      videoAnalyzed: true,
      videoQualityScore: 90,
      confirmedMarkers: 2,
      suggestedMarkers: 4,
      reviewedCoverage: 80,
      sampleCount: 6
    },
    timeline: [],
    criticalWindows: [],
    recurringPatterns: [{
      kind: 'dangerous-turnover',
      label: 'Perda perigosa',
      occurrences: 2,
      impact: 80,
      moments: [1000, 2000],
      phase: 'defensive-transition'
    }],
    phaseBalance: [],
    styleObservation: '',
    connectionGuardrail: '',
    strengths: [],
    risks: ['Transição'],
    authority: {},
    guardrails: []
  }
} as any);
assert.equal(duplicateSession.confirmedSessions, 1, 'R482 + registros da mesma sessionIdR462 contam como uma única partida.');
assert.equal(duplicateSession.compatibleMatches, 1);
assert.ok(duplicateSession.patterns.some((item: string) => /dangerous-turnover|Perda perigosa/i.test(item)));
assert.ok(!duplicateSession.patterns.some((item: string) => /4.*suggested|4.*suger/i.test(item)), 'suggested markers não podem alimentar memória confirmada.');

const orphanOnly = buildTacticalMemoryR500([
  record(undefined, ['controle-central'], { id: 'orphan-1' }),
  record(undefined, ['controle-central'], { id: 'orphan-2' }),
  record(undefined, ['controle-central'], { id: 'orphan-3' })
], context);
assert.notEqual(orphanOnly.state, 'TENDENCIA', 'registros sem sessão canônica não podem criar tendência forte.');
assert.notEqual(orphanOnly.state, 'CONFIRMADO');
assert.ok(orphanOnly.limitations.some((item: string) => /sess[aã]o|can[oô]nic/i.test(item)));

console.log('R500 memória aprovada: contextual, confirmada e sem dupla contagem.');
