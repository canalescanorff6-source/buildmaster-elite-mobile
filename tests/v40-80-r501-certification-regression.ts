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
assert.equal(
  deriveCardTruthCertificationR501(finalCard).state,
  'FINAL_CERTIFIED',
  'R501: cobertura crítica completa + PP confiável + confiança alta deve permitir FINAL_CERTIFIED.',
);

const nine = { ...fullAttributes } as Record<string, number>;
delete nine.stamina;
const partialHigh = applyCriticalEvidenceR419(card({
  attributes: nine,
  evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 9, positionRatingsCount: 1 },
  confidence: 92,
}));
assert.equal(
  deriveCardTruthCertificationR501(partialHigh).state,
  'PROVISIONAL_HIGH_CONFIDENCE',
  'R501: 9/10 atributos com boa evidência continua provisório, nunca final.',
);

const partialLow = applyCriticalEvidenceR419(card({
  attributes: {},
  evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 0, positionRatingsCount: 1 },
  confidence: 92,
}));
assert.equal(
  deriveCardTruthCertificationR501(partialLow).state,
  'PROVISIONAL_LOW_CONFIDENCE',
  'R501/R452: ficha 56/56 pode continuar visível sem atributos, mas precisa ser explicitamente provisória baixa.',
);

const completeLowConfidence = applyCriticalEvidenceR419(card({ confidence: 60 }));
assert.equal(
  deriveCardTruthCertificationR501(completeLowConfidence).state,
  'PROVISIONAL_HIGH_CONFIDENCE',
  'R501: cobertura completa sem confiança suficiente ainda não recebe certificação final.',
);

const noBudget = applyCriticalEvidenceR419(card({ trainingPointsTotal: null, trainingPointSource: null }));
assert.equal(
  deriveCardTruthCertificationR501(noBudget).state,
  'BLOCKED_INSUFFICIENT_DATA',
  'R501: sem orçamento confiável não existe recomendação final/provisória de progressão segura.',
);

const conflictingBudget = applyCriticalEvidenceR419(card({ trainingPointsTotal: 40, trainingPointsUsed: 56 }));
assert.equal(
  deriveCardTruthCertificationR501(conflictingBudget).state,
  'BLOCKED_INSUFFICIENT_DATA',
  'R501: PP conflitante precisa bloquear certificação.',
);

console.log('R501 certificação RED/GREEN: final, provisória alta/baixa e bloqueio estão separados.');
