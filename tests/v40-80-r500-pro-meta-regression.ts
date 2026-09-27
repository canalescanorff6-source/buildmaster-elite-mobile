import assert from 'node:assert/strict';
import {
  proMetaCompatibilityR500,
  proMetaDatasetDigestR500,
  selectApplicableProMetaR500
} from '../src/modules/tactical-director/tacticalDirectorProMetaR500';
import { PRO_META_DATASET_R500 } from '../src/modules/tactical-director/proMetaDatasetR500';

const baseObservation = {
  id: 'official-mobile-1',
  sourceUrl: 'https://example.test/official-match',
  sourceFingerprint: 'source-1',
  sourceType: 'OFFICIAL_MATCH',
  competition: 'Official Championship',
  stage: 'Final',
  playerLabel: 'Pro A',
  platform: 'MOBILE',
  gameVersion: '6.0.0',
  matchFormat: '1V1',
  rulesetId: 'open-squad',
  rulesetFingerprint: 'rules-open-1',
  rulesetTags: ['OPEN_SQUAD'],
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA',
  tacticalTags: ['CENTRAL_CONTROL'],
  observations: ['Controle central confirmado na fonte curada.']
} as const;

const context = {
  platform: 'MOBILE',
  gameVersion: '6.0.0',
  matchFormat: '1V1',
  rulesetFingerprint: 'rules-open-1',
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA'
} as const;

const same = proMetaCompatibilityR500(baseObservation as any, context as any);
assert.equal(same.platform, 1);
assert.equal(same.patch, 1);
assert.equal(same.matchFormat, 1);
assert.equal(same.ruleset, 1);
assert.equal(same.tacticalContext, 1);
assert.equal(same.finalCompatibility, 1);

const twoVTwo = proMetaCompatibilityR500({ ...baseObservation, matchFormat: '2V2' } as any, context as any);
assert.ok(twoVTwo.matchFormat < 1);
assert.ok(twoVTwo.finalCompatibility < same.finalCompatibility, '2V2 não pode ser benchmark direto para 1V1.');

const consoleObservation = proMetaCompatibilityR500({ ...baseObservation, platform: 'CONSOLE' } as any, context as any);
assert.ok(consoleObservation.platform < 1);
assert.ok(consoleObservation.finalCompatibility < same.finalCompatibility, 'Console não pode receber compatibilidade máxima em Mobile.');

const oldPatch = proMetaCompatibilityR500({ ...baseObservation, gameVersion: '5.0.0' } as any, context as any);
assert.ok(oldPatch.patch < 1);
assert.ok(oldPatch.finalCompatibility < same.finalCompatibility, 'patch antigo precisa perder peso.');

const unknownFormat = proMetaCompatibilityR500({ ...baseObservation, matchFormat: 'UNKNOWN' } as any, context as any);
assert.ok(unknownFormat.matchFormat < 1);
assert.ok(unknownFormat.finalCompatibility < 1);

const unknownRuleset = proMetaCompatibilityR500({ ...baseObservation, rulesetFingerprint: '', rulesetTags: ['UNKNOWN_RULESET'] } as any, context as any);
assert.ok(unknownRuleset.ruleset < 1);
assert.ok(unknownRuleset.finalCompatibility < 1);

const differentFormation = proMetaCompatibilityR500({ ...baseObservation, formation: '4-3-1-2' } as any, context as any);
assert.ok(differentFormation.tacticalContext < 1);
assert.ok(differentFormation.finalCompatibility < same.finalCompatibility);

const generatedAtA = {
  version: 'r500-pro-meta-v1',
  generatedAtBuild: '2026-09-26T10:00:00Z',
  observations: [baseObservation, { ...baseObservation, id: 'official-mobile-2', tacticalTags: ['PRESS_RESISTANCE', 'CENTRAL_CONTROL'] }]
};
const generatedAtB = {
  version: 'r500-pro-meta-v1',
  generatedAtBuild: '2030-01-01T00:00:00Z',
  observations: [
    { ...baseObservation, id: 'official-mobile-2', tacticalTags: ['CENTRAL_CONTROL', 'PRESS_RESISTANCE'] },
    baseObservation
  ]
};
assert.equal(proMetaDatasetDigestR500(generatedAtA as any), proMetaDatasetDigestR500(generatedAtB as any), 'ordem e generatedAtBuild não podem alterar digest semântico.');
assert.notEqual(
  proMetaDatasetDigestR500(generatedAtA as any),
  proMetaDatasetDigestR500({ ...generatedAtA, observations: [{ ...baseObservation, matchFormat: '2V2' }] } as any),
  'mudança real de formato precisa mudar digest.'
);
assert.notEqual(
  proMetaDatasetDigestR500(generatedAtA as any),
  proMetaDatasetDigestR500({ ...generatedAtA, observations: [{ ...baseObservation, rulesetFingerprint: 'rules-other' }] } as any),
  'mudança real de ruleset precisa mudar digest.'
);

const selected = selectApplicableProMetaR500({ version: 'fixture', observations: [
  baseObservation,
  { ...baseObservation, id: 'console', platform: 'CONSOLE' },
  { ...baseObservation, id: 'unknown-format', matchFormat: 'UNKNOWN' }
] } as any, context as any);
assert.equal(selected[0]?.observation.id, baseObservation.id);
assert.equal(selected[0]?.compatibility.finalCompatibility, 1);
assert.ok(selected.every((item) => item.compatibility.finalCompatibility > 0));

assert.ok(Array.isArray(PRO_META_DATASET_R500.observations));
for (const observation of PRO_META_DATASET_R500.observations) {
  assert.ok(observation.sourceUrl.startsWith('https://'), 'dataset real exige URL de proveniência.');
  assert.ok(observation.sourceFingerprint, 'dataset real exige fingerprint da fonte.');
  assert.ok(observation.gameVersion, 'dataset real exige versão do jogo.');
  assert.ok(observation.platform, 'dataset real exige plataforma.');
  assert.ok(observation.matchFormat, 'dataset real exige formato.');
  assert.ok(observation.rulesetFingerprint, 'dataset real exige ruleset verificável; entrada desconhecida deve ser omitida do dataset forte.');
}

console.log('R500 Pro Meta aprovado: plataforma, patch, formato, ruleset e digest são contextuais e determinísticos.');
