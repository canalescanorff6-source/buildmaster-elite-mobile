import assert from 'node:assert/strict';
import {
  buildContextFingerprintR500,
  buildPlanFingerprintR500,
  canonicalDigestR500
} from '../src/modules/tactical-director/tacticalDirectorFingerprintR500';

const base = {
  officialDecisionFingerprint: 'official-1',
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA',
  lineup: [
    { slotId: 'CB2', cardFingerprint: 'card-b' },
    { slotId: 'GK', cardFingerprint: 'card-gk' },
    { slotId: 'CB1', cardFingerprint: 'card-a' }
  ]
};

const reordered = { ...base, lineup: [...base.lineup].reverse() };
assert.equal(buildContextFingerprintR500(base as any), buildContextFingerprintR500(reordered as any), 'ordem incidental não pode alterar contexto');
assert.notEqual(buildContextFingerprintR500(base as any), buildContextFingerprintR500({ ...base, lineup: [{ slotId: 'CB2', cardFingerprint: 'card-x' }, ...base.lineup.slice(1)] } as any), 'carta diferente precisa alterar contexto');
assert.notEqual(buildContextFingerprintR500(base as any), buildContextFingerprintR500({ ...base, teamStyle: 'AUTO' } as any), 'AUTO precisa ser contexto distinto');

const planBase = {
  contextFingerprint: buildContextFingerprintR500(base as any),
  scenario: 'base',
  sourceVersions: ['R480:a', 'R481:b'],
  evidenceFingerprints: ['ev-b', 'ev-a'],
  proMetaDigest: 'pm-1',
  previousPlanFingerprint: null
};
assert.equal(buildPlanFingerprintR500(planBase as any), buildPlanFingerprintR500({ ...planBase, sourceVersions: [...planBase.sourceVersions].reverse(), evidenceFingerprints: [...planBase.evidenceFingerprints].reverse() } as any));
assert.notEqual(buildPlanFingerprintR500(planBase as any), buildPlanFingerprintR500({ ...planBase, scenario: 'proteger' } as any));
assert.notEqual(buildPlanFingerprintR500(planBase as any), buildPlanFingerprintR500({ ...planBase, proMetaDigest: 'pm-2' } as any));

const datasetA = { version: '1', generatedAtBuild: '2026-09-26T00:00:00Z', observations: [{ id: 'b', tags: ['y','x'] }, { id: 'a', tags: ['z'] }] };
const datasetB = { version: '1', generatedAtBuild: '2026-09-27T00:00:00Z', observations: [{ id: 'a', tags: ['z'] }, { id: 'b', tags: ['x','y'] }] };
assert.equal(canonicalDigestR500(datasetA), canonicalDigestR500(datasetB), 'timestamp operacional e ordem não podem alterar digest');
assert.notEqual(canonicalDigestR500(datasetA), canonicalDigestR500({ ...datasetB, version: '2' }), 'mudança semântica precisa alterar digest');

console.log('R500 fingerprints aprovados: canônicos, estáveis e sensíveis a mudanças semânticas.');
