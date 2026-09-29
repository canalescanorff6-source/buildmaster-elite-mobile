import assert from 'node:assert/strict';
import type { AnalysisResult } from '../src/lib/analyzerDomain';
import type { CardTruthCertificationR501 } from '../src/modules/analysis/cardTruthLayerR501';
import {
  buildEngineCertificationR517,
  type EngineCertificationInputR517,
} from '../src/modules/analysis/engineCertificationR517';
import { attachEngineCertificationR517 } from '../src/modules/analysis/productionOrchestratorR138';

const finalCardTruth: CardTruthCertificationR501 = {
  state: 'FINAL_CERTIFIED',
  confidencePercent: 98,
  criticalState: 'TRUSTED',
  trainingBudgetState: 'TRUSTED',
  levelState: 'TRUSTED',
  canFinalize: true,
  reasons: ['Evidência final certificada para o teste R517.'],
};

const evidence: EngineCertificationInputR517 = {
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

const baseline = {
  training: { passing: 8, dexterity: 6, lowerBodyStrength: 4 },
  recommendedSkills: ['Passe de primeira', 'Passe em profundidade'],
  recommendedImpetos: [
    { impeto: 'Técnica', motivo: 'Exemplo isolado do contrato de attach.' },
  ],
  buildName: 'Baseline R517',
} as unknown as AnalysisResult;

const immutableGameplaySnapshot = structuredClone({
  training: baseline.training,
  recommendedSkills: baseline.recommendedSkills,
  recommendedImpetos: baseline.recommendedImpetos,
});

const certificate = buildEngineCertificationR517(evidence);
const attached = attachEngineCertificationR517(baseline, certificate);

assert.notStrictEqual(attached, baseline,
  'Attach do R517 deve devolver nova referência em vez de mutar a saída de produção.');
assert.deepEqual({
  training: attached.training,
  recommendedSkills: attached.recommendedSkills,
  recommendedImpetos: attached.recommendedImpetos,
}, immutableGameplaySnapshot,
'Certificado R517 não pode recalcular ficha, Top 5 ou Ímpeto.');
assert.deepEqual({
  training: baseline.training,
  recommendedSkills: baseline.recommendedSkills,
  recommendedImpetos: baseline.recommendedImpetos,
}, immutableGameplaySnapshot,
'Objeto original de produção também deve permanecer intacto.');
assert.strictEqual(attached.engineCertificationR517, certificate,
  'Certificado deve ser anexado como metadado, sem cópia semântica ou promoção.');
assert.equal(baseline.engineCertificationR517, undefined,
  'Attach não pode mutar retroativamente o resultado original.');
assert.equal(attached.engineCertificationR517?.productionWriteAllowed, false,
  'Metadado anexado continua sem autoridade de escrita.');

const blockedCertificate = buildEngineCertificationR517({
  ...evidence,
  integrity: {
    ...evidence.integrity,
    pp: { valid: false, reason: 'PP inválido de propósito.' },
  },
});
const blockedAttached = attachEngineCertificationR517(baseline, blockedCertificate);
assert.equal(blockedAttached.engineCertificationR517?.status, 'BLOCKED');
assert.deepEqual({
  training: blockedAttached.training,
  recommendedSkills: blockedAttached.recommendedSkills,
  recommendedImpetos: blockedAttached.recommendedImpetos,
}, immutableGameplaySnapshot,
'Certificado BLOCKED não pode "melhorar" nem substituir a recomendação existente.');

const provisionalCertificate = buildEngineCertificationR517({
  ...evidence,
  cardTruth: {
    ...finalCardTruth,
    state: 'PROVISIONAL_HIGH_CONFIDENCE',
    canFinalize: false,
  },
});
const provisionalAttached = attachEngineCertificationR517(baseline, provisionalCertificate);
assert.equal(provisionalAttached.engineCertificationR517?.status, 'PROVISIONAL');
assert.deepEqual({
  training: provisionalAttached.training,
  recommendedSkills: provisionalAttached.recommendedSkills,
  recommendedImpetos: provisionalAttached.recommendedImpetos,
}, immutableGameplaySnapshot,
'Certificado PROVISIONAL também não pode alterar a saída da autoridade vigente.');

console.log('R517 produção aprovada: certificado é metadado aditivo e não altera ficha, Top 5 ou Ímpeto.');
