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
assert.ok(GOLDEN_CARD_LAB_R513_REFERENCES.length >= 32,
  'R514 deve elevar o Golden Lab inicial para algumas dezenas de referências sintéticas.');
assert.deepEqual(
  [...new Set(GOLDEN_CARD_LAB_R513_REFERENCES.map(item => item.scenario))].sort(),
  expectedScenarios,
);
assert.equal(new Set(GOLDEN_CARD_LAB_R513_REFERENCES.map(item => item.id)).size, GOLDEN_CARD_LAB_R513_REFERENCES.length,
  'R514: todos os IDs Golden precisam ser únicos e reproduzíveis.');
for (const scenario of expectedScenarios) {
  assert.ok(GOLDEN_CARD_LAB_R513_REFERENCES.filter(item => item.scenario === scenario).length >= 4,
    `R514: ${scenario} precisa de pelo menos quatro referências para formar uma matriz útil.`);
}
assert.ok(GOLDEN_CARD_LAB_R513_REFERENCES.every(item => item.referenceKind === 'SYNTHETIC_ARCHETYPE'));
assert.ok(GOLDEN_CARD_LAB_R513_REFERENCES.every(item => item.officialGameData === false),
  'R514 não pode apresentar arquétipos de engenharia como dados oficiais do eFootball.');
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

for (const golden of GOLDEN_CARD_LAB_R513_REFERENCES) {
  const repeated = runGoldenDeterminismR513({ referenceId: golden.id, state, repetitions: 3 });
  assert.equal(repeated.status, 'PASS', `R514: determinismo falhou em ${golden.id}.`);
  assert.equal(repeated.uniqueOutputs, 1, `R514: ${golden.id} produziu mais de uma saída.`);

  const matrixPerturbation = runGoldenPerturbationR513({
    referenceId: golden.id,
    state,
    perturbation: { attribute: 'lowPass', from: 84, to: 85, maxExpectedPossessionDelta: 3 },
  });
  assert.equal(matrixPerturbation.status, 'PASS', `R514: perturbação 84→85 ficou instável em ${golden.id}.`);
  assert.deepEqual(matrixPerturbation.changedAttributes, ['lowPass']);
  assert.equal(matrixPerturbation.certifiedForFinalWrite, false);
}

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

console.log(`R514 aprovado: matriz Golden com ${GOLDEN_CARD_LAB_R513_REFERENCES.length} referências sintéticas, determinismo e perturbação fail-closed.`);
