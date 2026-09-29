import assert from 'node:assert/strict';
import type { CardTruthCertificationR501 } from '../src/modules/analysis/cardTruthLayerR501';
import {
  buildEngineCertificationR517,
  type EngineCertificationInputR517,
} from '../src/modules/analysis/engineCertificationR517';

const cardTruth: CardTruthCertificationR501 = {
  state: 'FINAL_CERTIFIED',
  confidencePercent: 99,
  criticalState: 'TRUSTED',
  trainingBudgetState: 'TRUSTED',
  levelState: 'TRUSTED',
  canFinalize: true,
  reasons: ['Fixture estrutural R517.'],
};

const base: EngineCertificationInputR517 = {
  cardTruth,
  golden: {
    determinism: {
      version: '40.80-r513-golden-card-lab-v1',
      status: 'PASS',
      deterministic: true,
    },
    stability: {
      version: '40.80-r513-golden-card-lab-v1',
      status: 'PASS',
    },
  },
  integrity: {
    pp: { valid: true, reason: 'PP ok.' },
    dna: { valid: true, reason: 'DNA ok.' },
    skills: { valid: true, reason: 'Skills ok.' },
    impeto: { valid: true, reason: 'Ímpeto ok.' },
  },
};

const fingerprints = new Set(
  Array.from({ length: 100 }, () => buildEngineCertificationR517(base).fingerprint),
);
assert.equal(fingerprints.size, 1,
  '100 execuções idênticas precisam convergir para um único fingerprint.');

const ratingLow = {
  ...base,
  overall: 82,
  ger: 82,
} as EngineCertificationInputR517 & { overall: number; ger: number };
const ratingHigh = {
  ...base,
  overall: 109,
  ger: 109,
} as EngineCertificationInputR517 & { overall: number; ger: number };
assert.deepEqual(
  buildEngineCertificationR517(ratingLow),
  buildEngineCertificationR517(ratingHigh),
  'Alterar somente rating agregado não pode mudar a certificação funcional.',
);

const goldenFail = buildEngineCertificationR517({
  ...base,
  golden: {
    ...base.golden,
    determinism: {
      ...base.golden.determinism,
      status: 'FAIL',
      deterministic: false,
    },
  },
});
assert.equal(goldenFail.status, 'BLOCKED');
assert.ok(goldenFail.blockers.includes('GOLDEN_DETERMINISM_FAILED'));

const goldenReview = buildEngineCertificationR517({
  ...base,
  golden: {
    ...base.golden,
    stability: {
      ...base.golden.stability,
      status: 'REVIEW',
    },
  },
});
assert.equal(goldenReview.status, 'BLOCKED');
assert.ok(goldenReview.blockers.includes('GOLDEN_STABILITY_FAILED'));

const noRollbackEvidence = buildEngineCertificationR517(base);
assert.deepEqual(noRollbackEvidence.rollback, {
  available: false,
  engineVersion: null,
}, 'Sem evidência explícita, R517 não pode inventar versão de rollback.');

const explicitRollbackVersion = 'fixture-certified-engine-v1';
const withRollbackEvidence = buildEngineCertificationR517({
  ...base,
  rollbackEvidence: {
    certified: true,
    engineVersion: explicitRollbackVersion,
  },
});
assert.deepEqual(withRollbackEvidence.rollback, {
  available: true,
  engineVersion: explicitRollbackVersion,
}, 'Rollback deve apontar exatamente para a versão certificada fornecida como evidência.');

const blankRollback = buildEngineCertificationR517({
  ...base,
  rollbackEvidence: {
    certified: true,
    engineVersion: '   ',
  },
});
assert.deepEqual(blankRollback.rollback, {
  available: false,
  engineVersion: null,
}, 'Versão vazia não é evidência de rollback e deve falhar fechado.');

console.log('R517 firewall aprovado: determinismo 100x, rating agregado ignorado e rollback honesto.');
