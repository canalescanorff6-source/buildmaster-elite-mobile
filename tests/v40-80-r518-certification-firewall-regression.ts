import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { CardTruthCertificationR501 } from '../src/modules/analysis/cardTruthLayerR501';
import {
  GAMEPLAY_ENGINE_R510_CALIBRATION,
  GAMEPLAY_ENGINE_R510_SEED_POLICY,
} from '../src/modules/analysis/gameplayEngineR510';
import {
  buildEngineCertificationR517,
  type EngineCertificationInputR517,
} from '../src/modules/analysis/engineCertificationR517';

const seedBefore = JSON.stringify(GAMEPLAY_ENGINE_R510_SEED_POLICY);
const calibrationBefore = JSON.stringify(GAMEPLAY_ENGINE_R510_CALIBRATION);

const finalCardTruth: CardTruthCertificationR501 = {
  state: 'FINAL_CERTIFIED',
  confidencePercent: 99,
  criticalState: 'TRUSTED',
  trainingBudgetState: 'TRUSTED',
  levelState: 'TRUSTED',
  canFinalize: true,
  reasons: ['Contrato final válido para testar apenas o firewall R510/R517.'],
};

const certificationInput: EngineCertificationInputR517 = {
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

assert.equal(GAMEPLAY_ENGINE_R510_CALIBRATION.certifiedForFinalWrite, false,
  'R518 não pode promover a calibração oficial R510 neste change-set.');

const certificate = buildEngineCertificationR517(certificationInput);
assert.equal(certificate.status, 'EXPERIMENTAL_VALIDATED',
  'Mesmo com toda evidência estrutural válida, R517 deve permanecer experimental enquanto R510 não for promovida explicitamente.');
assert.ok(certificate.blockers.includes('R510_CALIBRATION_NOT_CERTIFIED'));
assert.notEqual(certificate.status, 'ENGINE_CERTIFIED');
assert.equal(certificate.productionWriteAllowed, false);

const source = readFileSync(
  require.resolve('../src/modules/analysis/realMatchCalibrationEvidenceR518'),
  'utf8',
);
assert.equal(
  /productionOrchestratorR138|jointOptimizerR512|trainingPlanCore|recommendationWriter|attachProduction|writeTraining|recommendedSkills\s*=|recommendedImpetos\s*=/i.test(source),
  false,
  'R518 não pode importar/chamar writers, optimizer de produção ou caminhos de mutação da ficha.',
);

assert.equal(JSON.stringify(GAMEPLAY_ENGINE_R510_SEED_POLICY), seedBefore,
  'Executar o firewall não pode mutar a seed R510.');
assert.equal(JSON.stringify(GAMEPLAY_ENGINE_R510_CALIBRATION), calibrationBefore,
  'Executar o firewall não pode mutar a calibração oficial R510.');

console.log('R518 firewall aprovado: readiness não certifica R510, R517 continua fail-closed e não existe segundo writer.');
