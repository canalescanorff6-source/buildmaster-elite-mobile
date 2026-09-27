import assert from 'node:assert/strict';
import { applyCriticalEvidenceR419 } from '../src/modules/analysis/cardEvidenceAuthorityR419';
import { deriveCardTruthCertificationR501 } from '../src/modules/analysis/cardTruthLayerR501';

const fullAttributes = {
  offensiveAwareness: 84,
  ballControl: 85,
  dribbling: 83,
  tightPossession: 82,
  lowPass: 80,
  finishing: 86,
  speed: 84,
  acceleration: 85,
  kickingPower: 82,
  stamina: 81,
};

function card(overrides: Record<string, unknown> = {}) {
  return {
    playerName: 'R501 Certification',
    cardType: 'Epic',
    mainPosition: 'CF',
    mainPositionPt: 'CA',
    positions: ['CF'],
    positionsPt: ['CA'],
    positionRatings: { CF: 100 },
    playstyle: 'Artilheiro',
    overall: 100,
    maxOverall: 102,
    level: 29,
    trainingPointsTotal: 56,
    trainingPointsUsed: 0,
    trainingPointSource: 'TRAINING_READ',
    condition: {},
    impetos: [],
    nativeSkills: [],
    additionalSkills: [],
    specialSkills: [],
    attributes: fullAttributes,
    physicalProfile: {},
    manualConfirmed: false,
    evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 10, positionRatingsCount: 1 },
    internalId: 'r501-certification',
    confidence: 92,
    warnings: [],
    ...overrides,
  } as any;
}

const finalCard = applyCriticalEvidenceR419(card());
const finalCertification = deriveCardTruthCertificationR501(finalCard);
assert.equal(
  finalCertification.state,
  'FINAL_CERTIFIED',
  'R501: cobertura crítica completa + PP confiável + confiança alta deve permitir FINAL_CERTIFIED.',
);
assert.equal(finalCertification.canFinalize, true, 'R501: somente FINAL_CERTIFIED pode autorizar promoção para resultado final.');

const nine = { ...fullAttributes } as Record<string, number>;
delete nine.stamina;
const partialHigh = applyCriticalEvidenceR419(card({
  attributes: nine,
  evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 9, positionRatingsCount: 1 },
  confidence: 92,
}));
const partialHighCertification = deriveCardTruthCertificationR501(partialHigh);
assert.equal(
  partialHighCertification.state,
  'PROVISIONAL_HIGH_CONFIDENCE',
  'R501: 9/10 atributos com boa evidência continua provisório, nunca final.',
);
assert.equal(partialHighCertification.canFinalize, false, 'R501: resultado provisório alto não pode ser promovido como final.');

const partialLow = applyCriticalEvidenceR419(card({
  attributes: {},
  evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 0, positionRatingsCount: 1 },
  confidence: 92,
}));
const partialLowCertification = deriveCardTruthCertificationR501(partialLow);
assert.equal(
  partialLowCertification.state,
  'PROVISIONAL_LOW_CONFIDENCE',
  'R501/R452: ficha 56/56 pode continuar visível sem atributos, mas precisa ser explicitamente provisória baixa.',
);
assert.equal(partialLowCertification.canFinalize, false, 'R501: provisória baixa nunca pode parecer ficha final.');

const completeLowConfidence = applyCriticalEvidenceR419(card({ confidence: 60 }));
const completeLowCertification = deriveCardTruthCertificationR501(completeLowConfidence);
assert.equal(
  completeLowCertification.state,
  'PROVISIONAL_HIGH_CONFIDENCE',
  'R501: cobertura completa sem confiança suficiente ainda não recebe certificação final.',
);
assert.equal(completeLowCertification.canFinalize, false, 'R501: cobertura completa sem confiança final permanece provisória.');

const noBudget = applyCriticalEvidenceR419(card({ trainingPointsTotal: null, trainingPointSource: null }));
const noBudgetCertification = deriveCardTruthCertificationR501(noBudget);
assert.equal(
  noBudgetCertification.state,
  'BLOCKED_INSUFFICIENT_DATA',
  'R501: sem orçamento confiável não existe recomendação final/provisória de progressão segura.',
);
assert.equal(noBudgetCertification.canFinalize, false, 'R501: orçamento ausente deve bloquear promoção final.');

const conflictingBudget = applyCriticalEvidenceR419(card({ trainingPointsTotal: 40, trainingPointsUsed: 56 }));
const conflictingCertification = deriveCardTruthCertificationR501(conflictingBudget);
assert.equal(
  conflictingCertification.state,
  'BLOCKED_INSUFFICIENT_DATA',
  'R501: PP conflitante precisa bloquear certificação.',
);
assert.equal(conflictingCertification.canFinalize, false, 'R501: PP conflitante deve bloquear promoção final.');

console.log('R501 certificação RED/GREEN: final, provisória alta/baixa, bloqueio e canFinalize estão separados.');
