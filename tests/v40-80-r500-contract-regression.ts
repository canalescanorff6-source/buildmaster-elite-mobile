import assert from 'node:assert/strict';
import {
  TACTICAL_DIRECTOR_R500_VERSION,
  buildAutonomousTacticalDirectorR500
} from '../src/modules/tactical-director/tacticalDirectorEngineR500';
import {
  buildContextFingerprintR500,
  buildPlanFingerprintR500,
  canonicalDigestR500,
  validateContextCoherenceR500
} from '../src/modules/tactical-director/tacticalDirectorFingerprintR500';

const input = {
  officialDecisionFingerprint: 'official-r128-card-1',
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA',
  lineupContext: [
    { slotId: 'cf1', cardFingerprint: 'card-a' },
    { slotId: 'cf2', cardFingerprint: 'card-b' },
    { slotId: 'dmf', cardFingerprint: null }
  ],
  tacticalTwin: null,
  squadBrain: null,
  matchVision: null,
  buildSimulator: null,
  chemistry: null,
  explanations: [],
  confirmedMatchRecords: [],
  proMetaDataset: null,
  currentScenario: 'base',
  previousPlan: null
} as any;

assert.match(TACTICAL_DIRECTOR_R500_VERSION, /r500/i);

const before = JSON.stringify(input);
const first = buildAutonomousTacticalDirectorR500(input);
const second = buildAutonomousTacticalDirectorR500(input);

assert.deepEqual(first, second, 'R500 precisa ser determinístico para a mesma entrada.');
assert.equal(JSON.stringify(input), before, 'R500 não pode mutar a entrada.');
assert.equal(first.version, TACTICAL_DIRECTOR_R500_VERSION);
assert.equal(first.availability, 'INSUFFICIENT');
assert.equal(first.phase, 'PRE_MATCH');
assert.equal(first.scenario, 'base');
assert.deepEqual(first.evidence, []);
assert.deepEqual(first.recommendedActions, []);

assert.equal(first.authority.readOnly, true);
assert.equal(first.authority.canWriteTraining, false);
assert.equal(first.authority.canWriteSkills, false);
assert.equal(first.authority.canWriteImpetus, false);
assert.equal(first.authority.canChangePosition, false);
assert.equal(first.authority.canChangeLineupAutomatically, false);
assert.equal(first.authority.canConfirmMatchMarkersAutomatically, false);
assert.equal(first.authority.canWriteVault, false);
assert.equal(first.authority.canPersistTacticalMemory, false);
assert.equal(first.authority.canOverrideR119, false);
assert.equal(first.authority.canOverrideR126, false);
assert.equal(first.authority.canOverrideR128, false);
assert.equal(first.authority.optimizeOverall, false);

assert.ok(typeof first.contextFingerprint === 'string' && first.contextFingerprint.length > 0);
assert.ok(typeof first.planFingerprint === 'string' && first.planFingerprint.length > 0);

const reordered = {
  ...input,
  lineupContext: [input.lineupContext[2], input.lineupContext[0], input.lineupContext[1]]
};
const contextA = buildContextFingerprintR500(input);
const contextB = buildContextFingerprintR500(reordered);
assert.equal(contextA, contextB, 'ordem incidental da escalação não pode mudar o fingerprint.');
assert.match(contextA, /dmf=SEM_CARTA/, 'vaga sem carta precisa aparecer explicitamente no fingerprint.');

const changedCard = buildContextFingerprintR500({
  ...input,
  lineupContext: input.lineupContext.map((item: any) => item.slotId === 'cf2' ? { ...item, cardFingerprint: 'card-c' } : item)
});
assert.notEqual(contextA, changedCard, 'trocar a carta exata precisa mudar o contexto.');

const autoStyle = buildContextFingerprintR500({ ...input, teamStyle: 'AUTO' });
assert.notEqual(contextA, autoStyle, 'AUTO precisa ser contexto diferente de estilo confirmado.');

const digestA = canonicalDigestR500({ b: 2, a: 1, nested: { z: ['b', 'a'], y: true } });
const digestB = canonicalDigestR500({ nested: { y: true, z: ['b', 'a'] }, a: 1, b: 2 });
assert.equal(digestA, digestB, 'digest canônico deve ignorar ordem de chaves de objeto.');

const planBase = buildPlanFingerprintR500({
  contextFingerprint: contextA,
  scenario: 'base',
  sourceVersions: ['R484:v1', 'R480:v1'],
  evidenceFingerprints: ['ev-b', 'ev-a'],
  proMetaDigest: null,
  previousPlanFingerprint: null
});
const planReordered = buildPlanFingerprintR500({
  contextFingerprint: contextA,
  scenario: 'base',
  sourceVersions: ['R480:v1', 'R484:v1'],
  evidenceFingerprints: ['ev-a', 'ev-b'],
  proMetaDigest: null,
  previousPlanFingerprint: null
});
assert.equal(planBase, planReordered, 'ordem incidental de versões/evidências não pode mudar planFingerprint.');
assert.notEqual(planBase, buildPlanFingerprintR500({
  contextFingerprint: contextA,
  scenario: 'buscar',
  sourceVersions: ['R480:v1', 'R484:v1'],
  evidenceFingerprints: ['ev-a', 'ev-b'],
  proMetaDigest: null,
  previousPlanFingerprint: null
}), 'cenário diferente precisa mudar planFingerprint.');

const mismatchIssues = validateContextCoherenceR500({
  ...input,
  tacticalTwin: { version: 'r480', formation: '4-3-3', teamStyle: 'POSSE_DE_BOLA' },
  chemistry: { version: 'r484', formation: '4-2-2-2', teamStyle: 'CONTRA_ATAQUE' },
  matchVision: { version: 'r482', configuredContext: { formation: '4-1-2-3', teamStyle: 'POSSE_DE_BOLA' } },
  buildSimulator: { version: 'r483', baselineFingerprint: 'other-card' }
} as any);
assert.ok(mismatchIssues.some((issue) => issue.source === 'R480' && issue.level === 'BLOCKING'));
assert.ok(mismatchIssues.some((issue) => issue.source === 'R484' && issue.level === 'BLOCKING'));
assert.ok(mismatchIssues.some((issue) => issue.source === 'R482' && issue.level === 'BLOCKING'));
assert.ok(mismatchIssues.some((issue) => issue.source === 'R483' && issue.level === 'BLOCKING'));

console.log('R500 contrato base e fingerprints aprovados: determinísticos, contextuais e read-only.');
