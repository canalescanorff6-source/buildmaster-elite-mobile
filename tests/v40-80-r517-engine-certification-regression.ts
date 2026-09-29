import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { CardTruthCertificationR501 } from '../src/modules/analysis/cardTruthLayerR501';
import {
  ENGINE_CERTIFICATION_R517_VERSION,
  buildEngineCertificationR517,
  type EngineCertificationInputR517,
} from '../src/modules/analysis/engineCertificationR517';

const finalCardTruth: CardTruthCertificationR501 = {
  state: 'FINAL_CERTIFIED',
  confidencePercent: 97,
  criticalState: 'TRUSTED',
  trainingBudgetState: 'TRUSTED',
  levelState: 'TRUSTED',
  canFinalize: true,
  reasons: ['Contrato final R501 atendido.'],
};

const baseInput: EngineCertificationInputR517 = {
  cardTruth: finalCardTruth,
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
    pp: { valid: true, reason: 'PP íntegro.' },
    dna: { valid: true, reason: 'DNA preservado.' },
    skills: { valid: true, reason: 'Skills íntegras.' },
    impeto: { valid: true, reason: 'Ímpeto íntegro.' },
  },
};

assert.equal(ENGINE_CERTIFICATION_R517_VERSION, '40.80-r517-engine-certification-v1');

const experimental = buildEngineCertificationR517(baseInput);
assert.equal(experimental.status, 'EXPERIMENTAL_VALIDATED',
  'R517 deve reconhecer evidência funcional estável sem mentir que a R510 já é certificada.');
assert.equal(experimental.productionWriteAllowed, false,
  'R517 é read-only e nunca pode abrir um segundo writer.');
assert.ok(experimental.blockers.includes('R510_CALIBRATION_NOT_CERTIFIED'),
  'R510 provisória deve impedir ENGINE_CERTIFIED explicitamente.');
assert.notEqual(experimental.status, 'ENGINE_CERTIFIED');

const provisional = buildEngineCertificationR517({
  ...baseInput,
  cardTruth: {
    ...finalCardTruth,
    state: 'PROVISIONAL_HIGH_CONFIDENCE',
    canFinalize: false,
  },
});
assert.equal(provisional.status, 'PROVISIONAL',
  'Carta que não é FINAL_CERTIFIED na R501 não pode avançar para estabilidade final.');
assert.ok(provisional.blockers.includes('R501_NOT_FINAL_CERTIFIED'));

const invalidIntegrity = buildEngineCertificationR517({
  ...baseInput,
  integrity: {
    pp: { valid: false, reason: 'PP inválido.' },
    dna: { valid: false, reason: 'DNA alterado.' },
    skills: { valid: false, reason: 'Skills inconsistentes.' },
    impeto: { valid: false, reason: 'Ímpeto não comprovado.' },
  },
});
assert.equal(invalidIntegrity.status, 'BLOCKED');
assert.ok(invalidIntegrity.blockers.includes('PP_INTEGRITY_FAILED'));
assert.ok(invalidIntegrity.blockers.includes('DNA_INTEGRITY_FAILED'));
assert.ok(invalidIntegrity.blockers.includes('SKILL_INTEGRITY_FAILED'));
assert.ok(invalidIntegrity.blockers.includes('IMPETO_INTEGRITY_FAILED'));

const nonDeterministic = buildEngineCertificationR517({
  ...baseInput,
  golden: {
    ...baseInput.golden,
    determinism: {
      ...baseInput.golden.determinism,
      status: 'FAIL',
      deterministic: false,
    },
  },
});
assert.equal(nonDeterministic.status, 'BLOCKED');
assert.ok(nonDeterministic.blockers.includes('GOLDEN_DETERMINISM_FAILED'));

const unstable = buildEngineCertificationR517({
  ...baseInput,
  golden: {
    ...baseInput.golden,
    stability: {
      ...baseInput.golden.stability,
      status: 'REVIEW',
    },
  },
});
assert.equal(unstable.status, 'BLOCKED');
assert.ok(unstable.blockers.includes('GOLDEN_STABILITY_FAILED'));

const repeatA = buildEngineCertificationR517(baseInput);
const repeatB = buildEngineCertificationR517(baseInput);
assert.deepEqual(repeatA, repeatB,
  'Mesma evidência deve produzir certificado integralmente reproduzível.');
assert.equal(repeatA.fingerprint, repeatB.fingerprint,
  'Fingerprint R517 precisa ser determinístico para a mesma entrada.');

const source = readFileSync(
  require.resolve('../src/modules/analysis/engineCertificationR517'),
  'utf8',
);
assert.equal(/\boverall\b|\bger\b/i.test(source), false,
  'R517 não pode depender de rating agregado para decidir certificação funcional.');

console.log('R517 aprovado: contrato fail-closed, read-only, determinístico e sem rating agregado.');
