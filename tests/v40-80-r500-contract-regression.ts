import assert from 'node:assert/strict';
import {
  TACTICAL_DIRECTOR_R500_VERSION,
  buildAutonomousTacticalDirectorR500
} from '../src/modules/tactical-director/tacticalDirectorEngineR500';

const input = {
  officialDecisionFingerprint: 'official-card-r500-fixture',
  formation: '4-2-2-2',
  teamStyle: 'POSSE_DE_BOLA',
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
} as const;

assert.match(TACTICAL_DIRECTOR_R500_VERSION, /r500/i);

const before = JSON.stringify(input);
const first = buildAutonomousTacticalDirectorR500(input as any);
const second = buildAutonomousTacticalDirectorR500(input as any);

assert.deepEqual(first, second, 'R500 precisa ser determinístico para o mesmo input.');
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

console.log('R500 contrato mínimo aprovado: determinístico, degradado e read-only.');
