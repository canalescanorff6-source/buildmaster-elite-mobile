import assert from 'node:assert/strict';
import { applyCriticalEvidenceR419, deriveTrainingBudgetEvidenceR419 } from '../src/modules/analysis/cardEvidenceAuthorityR419';
import { trainingBudgetFromCard } from '../src/modules/builds/trainingOptimizer';

const attrs10 = {
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
    playerName: 'R501 Card Truth',
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
    trainingPointSource: 'OCR',
    condition: {},
    impetos: [],
    nativeSkills: [],
    additionalSkills: [],
    specialSkills: [],
    attributes: attrs10,
    physicalProfile: {},
    manualConfirmed: false,
    evidence: {
      positionLocked: true,
      playstyleLocked: true,
      attributeCount: 10,
      positionRatingsCount: 1,
    },
    internalId: 'r501-card-truth',
    confidence: 40,
    warnings: [],
    ...overrides,
  } as any;
}

// Regra central do buildmaster_prompt: confiança interna é 0–100.
const lowOcr = deriveTrainingBudgetEvidenceR419(card({ confidence: 40 }));
assert.equal(lowOcr.state, 'UNCERTAIN', 'R501: confiança 40/100 jamais pode passar como >=78%.');

const thresholdOcr = deriveTrainingBudgetEvidenceR419(card({ confidence: 78 }));
assert.equal(thresholdOcr.state, 'TRUSTED', 'R501: OCR 78/100 deve atingir exatamente o limiar canônico de 78%.');

// Compatibilidade de dados históricos 0–1 deve ser normalizada, nunca comparada diretamente com 0–100.
const legacyOcr = deriveTrainingBudgetEvidenceR419(card({ confidence: 0.78 }));
assert.equal(legacyOcr.state, 'TRUSTED', 'R501: confiança histórica 0.78 deve normalizar para 78/100.');

const inferredLow = deriveTrainingBudgetEvidenceR419(card({ trainingPointSource: 'LEVEL_INFERRED', confidence: 89 }));
assert.equal(inferredLow.state, 'UNCERTAIN', 'R501: nível inferido exige no mínimo 90/100.');
assert.equal(trainingBudgetFromCard(card({ trainingPointsTotal: null, trainingPointSource: 'LEVEL_INFERRED', confidence: 40 })), 0,
  'R501: trainingOptimizer não pode tratar confiança 40/100 como >=90%.');

// Regra de cobertura: uma única leitura numérica não transforma a carta em TRUSTED.
const oneAttribute = applyCriticalEvidenceR419(card({
  trainingPointSource: 'MANUAL',
  confidence: 100,
  attributes: { finishing: 90 },
  evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 1, positionRatingsCount: 1 },
}));
assert.equal(oneAttribute.evidence.criticalStateR419, 'UNCERTAIN', 'R501: 1 atributo não pode equivaler a carta crítica completa.');

const noAttributes = applyCriticalEvidenceR419(card({
  trainingPointSource: 'MANUAL',
  confidence: 100,
  attributes: {},
  evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 0, positionRatingsCount: 1 },
}));
assert.equal(noAttributes.evidence.criticalStateR419, 'MISSING', 'R501: zero atributos críticos deve permanecer MISSING.');

const nineAttributes = { ...attrs10 } as Record<string, number>;
delete nineAttributes.stamina;
const partialOutfield = applyCriticalEvidenceR419(card({
  trainingPointSource: 'MANUAL',
  confidence: 100,
  attributes: nineAttributes,
  evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 9, positionRatingsCount: 1 },
}));
assert.equal(partialOutfield.evidence.criticalStateR419, 'UNCERTAIN', 'R501: jogador de linha com menos de 10 atributos críticos permanece UNCERTAIN.');

const sufficientOutfield = applyCriticalEvidenceR419(card({ trainingPointSource: 'MANUAL', confidence: 100 }));
assert.equal(sufficientOutfield.evidence.criticalStateR419, 'TRUSTED', 'R501: cobertura mínima canônica de 10 atributos pode ficar TRUSTED quando PP também é confiável.');

const gkBase = {
  goalkeeperAwareness: 88,
  goalkeeperCatching: 86,
  goalkeeperParrying: 87,
  goalkeeperReflexes: 90,
};
const gk = applyCriticalEvidenceR419(card({
  mainPosition: 'GK',
  mainPositionPt: 'GOL',
  positions: ['GK'],
  positionsPt: ['GOL'],
  trainingPointSource: 'MANUAL',
  confidence: 100,
  attributes: gkBase,
  evidence: { positionLocked: true, playstyleLocked: true, attributeCount: 4, positionRatingsCount: 1 },
}));
assert.equal(gk.evidence.criticalStateR419, 'TRUSTED', 'R501: GK preserva mínimo já usado pelo Clean Slate: 4 atributos críticos.');

console.log('R501 RED/GREEN: confiança 0–100 e cobertura crítica fail-closed protegidas.');
