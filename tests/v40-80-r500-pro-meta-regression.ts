import assert from 'node:assert/strict';
import { canonicalDigestR500 } from '../src/modules/tactical-director/tacticalDirectorFingerprintR500';
import { proMetaCompatibilityR500, selectApplicableProMetaR500 } from '../src/modules/tactical-director/tacticalDirectorProMetaR500';

const context = {
  platform: 'MOBILE',
  gameVersion: '6.0.0',
  matchFormat: '1V1',
  rulesetFingerprint: 'open-mobile-1v1',
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA'
} as const;

const baseObservation = {
  id: 'obs-1', sourceUrl: 'https://example.invalid/official', sourceFingerprint: 'src-1',
  competition: 'Official', stage: 'Final', subjectLabel: 'Pro A', platform: 'MOBILE', gameVersion: '6.0.0',
  matchFormat: '1V1', rulesetId: 'open', rulesetFingerprint: 'open-mobile-1v1', rulesetTags: ['OPEN_SQUAD'],
  formation: '4-2-2-2', teamStyle: 'POSSE_DE_BOLA', tacticalTags: ['central'], observations: ['Controle central'], confidence: 95
} as const;

const exact = proMetaCompatibilityR500(baseObservation as any, context as any);
assert.equal(exact.finalCompatibility, 1);
assert.ok(proMetaCompatibilityR500({ ...baseObservation, matchFormat: '2V2' } as any, context as any).finalCompatibility < 1);
assert.ok(proMetaCompatibilityR500({ ...baseObservation, platform: 'CONSOLE' } as any, context as any).finalCompatibility < 1);
assert.ok(proMetaCompatibilityR500({ ...baseObservation, gameVersion: '5.2.0' } as any, context as any).finalCompatibility < 1);
assert.ok(proMetaCompatibilityR500({ ...baseObservation, matchFormat: 'UNKNOWN' } as any, context as any).finalCompatibility < 1);
assert.ok(proMetaCompatibilityR500({ ...baseObservation, rulesetFingerprint: 'UNKNOWN_RULESET' } as any, context as any).finalCompatibility < 1);

const dataset = { version: 'r500-pro-1', generatedAtBuild: '2026-09-26T00:00:00Z', observations: [baseObservation] };
const selected = selectApplicableProMetaR500(dataset as any, context as any);
assert.equal(selected.observations.length, 1);
assert.equal(selected.observations[0]?.observation.id, 'obs-1');
assert.equal(selected.digest, canonicalDigestR500(dataset));
assert.equal(canonicalDigestR500(dataset), canonicalDigestR500({ ...dataset, generatedAtBuild: '2027-01-01T00:00:00Z' }));
assert.notEqual(canonicalDigestR500(dataset), canonicalDigestR500({ ...dataset, observations: [{ ...baseObservation, matchFormat: '2V2' }] }));

console.log('R500 Pro Meta aprovado: compatibilidade contextual e digest auditável.');
