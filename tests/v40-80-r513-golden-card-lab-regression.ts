import assert from 'node:assert/strict';
import type { ProjectedPlayerStateR504 } from '../src/modules/analysis/projectedPlayerStateR504';
import {
  GOLDEN_CARD_LAB_R513_REFERENCES,
  GOLDEN_CARD_LAB_R513_VERSION,
  runGoldenDeterminismR513,
  runGoldenPerturbationR513,
} from '../src/modules/analysis/goldenCardLabR513';

const expectedScenarios = [
  'ORCHESTRATOR_POSSESSION',
  'ANCHOR_DMF_POSSESSION',
  'BOX_STRIKER',
  'INFILTRATOR',
  'BOX_TO_BOX',
  'DESTROYER',
  'BUILD_UP_CB',
  'DEFENSIVE_FULLBACK',
].sort();

assert.equal(GOLDEN_CARD_LAB_R513_VERSION, '40.80-r513-golden-card-lab-v1');
assert.equal(GOLDEN_CARD_LAB_R513_REFERENCES.length, 8,
  'R513 deve iniciar cobrindo os oito cenários de referência pedidos no Prompt Mestre.');
assert.deepEqual(
  GOLDEN_CARD_LAB_R513_REFERENCES.map(item => item.scenario).sort(),
  expectedScenarios,
);
assert.equal(new Set(GOLDEN_CARD_LAB_R513_REFERENCES.map(item => item.id)).size, 8,
  'R513: IDs de referência precisam ser únicos e reproduzíveis.');
assert.ok(GOLDEN_CARD_LAB_R513_REFERENCES.every(item => item.referenceKind === 'SYNTHETIC_ARCHETYPE'));
assert.ok(GOLDEN_CARD_LAB_R513_REFERENCES.every(item => item.officialGameData === false),
  'R513 não pode apresentar arquétipos de engenharia como dados oficiais do eFootball.');
assert.ok(GOLDEN_CARD_LAB_R513_REFERENCES.every(item => item.style === 'POSSESSION_CENTRAL'));

const state: ProjectedPlayerStateR504 = {
  version: '40.80-r504-projected-player-state-v1',
  source: 'BASE_CARD_PLUS_FINAL_TRAINING',
  baseAttributes: {},
  finalAttributes: {
    lowPass: 84,
    loftedPass: 84,
    ballControl: 91,
    dribbling: 88,
    tightPossession: 92,
    offensiveAwareness: 86,
    acceleration: 85,
    balance: 89,
    speed: 82,
    kickingPower: 82,
    stamina: 88,
    physicalContact: 78,
    finishing: 76,
    defensiveAwareness: 72,
    defensiveEngagement: 74,
    tackling: 70,
    aggression: 73,
  },
  training: {
    shooting: 0,
    passing: 0,
    dribbling: 0,
    dexterity: 0,
    lowerBodyStrength: 0,
    aerialStrength: 0,
    defending: 0,
    gk1: 0,
    gk2: 0,
    gk3: 0,
  },
  trainingCost: 0,
  projectedAttributeCount: 17,
};

const determinism = runGoldenDeterminismR513({
  referenceId: 'golden-r513-orchestrator-possession-001',
  state,
  repetitions: 5,
});
assert.equal(determinism.status, 'PASS');
assert.equal(determinism.repetitions, 5);
assert.equal(determinism.uniqueOutputs, 1,
  'R513: mesma carta/cenário/versão precisa produzir saída idêntica em todas as repetições.');
assert.equal(determinism.deterministic, true);

const perturbation = runGoldenPerturbationR513({
  referenceId: 'golden-r513-orchestrator-possession-001',
  state,
  perturbation: {
    attribute: 'lowPass',
    from: 84,
    to: 85,
    maxExpectedPossessionDelta: 3,
  },
});

assert.equal(perturbation.status, 'PASS',
  'R513: 84→85 em um atributo não pode produzir mudança caótica no cenário Golden.');
assert.deepEqual(perturbation.changedAttributes, ['lowPass'],
  'R513: teste de perturbação deve provar que somente o atributo declarado mudou.');
assert.equal(perturbation.baseline.attributeValue, 84);
assert.equal(perturbation.perturbed.attributeValue, 85);
assert.ok(perturbation.possessionScoreDelta >= 0,
  'R513: melhorar passe baixo no Orquestrador não deve piorar silenciosamente o score de Posse.');
assert.ok(perturbation.possessionScoreDelta <= 3,
  'R513: a variação unitária deve permanecer dentro da faixa de estabilidade declarada pelo cenário.');
assert.equal(perturbation.baseline.calibrationStatus, 'PROVISIONAL_UNCALIBRATED');
assert.equal(perturbation.perturbed.calibrationStatus, 'PROVISIONAL_UNCALIBRATED');
assert.equal(perturbation.certifiedForFinalWrite, false,
  'R513 Golden Lab observa/compara; ainda não promove motor para escrita final.');

assert.throws(() => runGoldenPerturbationR513({
  referenceId: 'golden-r513-orchestrator-possession-001',
  state,
  perturbation: {
    attribute: 'lowPass',
    from: 83,
    to: 84,
    maxExpectedPossessionDelta: 3,
  },
}), /valor inicial/i,
'R513 deve falhar fechado quando o cenário declara um valor inicial diferente do estado real.');

assert.throws(() => runGoldenDeterminismR513({
  referenceId: 'golden-r513-inexistente',
  state,
  repetitions: 2,
}), /referência golden/i,
'R513 não pode cair em fallback silencioso para cenário desconhecido.');

console.log('R513 aprovado: Golden Card Lab possui 8 cenários sintéticos, determinismo e perturbação fail-closed.');
