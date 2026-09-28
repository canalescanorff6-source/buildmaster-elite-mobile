import assert from 'node:assert/strict';
import type { ProjectedPlayerStateR504 } from '../src/modules/analysis/projectedPlayerStateR504';
import {
  analyzePossessionGameplayR511,
  POSSESSION_GAMEPLAY_R511_PROFILE,
} from '../src/modules/analysis/possessionGameplayR511';

const technicalState: ProjectedPlayerStateR504 = {
  version: '40.80-r504-projected-player-state-v1',
  source: 'BASE_CARD_PLUS_FINAL_TRAINING',
  baseAttributes: {},
  finalAttributes: {
    lowPass: 92,
    loftedPass: 86,
    ballControl: 94,
    dribbling: 91,
    tightPossession: 95,
    offensiveAwareness: 88,
    acceleration: 88,
    balance: 93,
    speed: 84,
    kickingPower: 82,
    stamina: 88,
    physicalContact: 78,
    finishing: 80,
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
  projectedAttributeCount: 13,
};

const directState: ProjectedPlayerStateR504 = {
  ...technicalState,
  finalAttributes: {
    lowPass: 78,
    loftedPass: 80,
    ballControl: 84,
    dribbling: 86,
    tightPossession: 82,
    offensiveAwareness: 93,
    acceleration: 96,
    balance: 84,
    speed: 97,
    kickingPower: 94,
    stamina: 90,
    physicalContact: 84,
    finishing: 95,
  },
};

assert.equal(POSSESSION_GAMEPLAY_R511_PROFILE.style, 'POSSE_DE_BOLA');
assert.equal(POSSESSION_GAMEPLAY_R511_PROFILE.calibration, 'PROVISIONAL_UNCALIBRATED');
assert.equal(POSSESSION_GAMEPLAY_R511_PROFILE.certifiedForFinalWrite, false);
assert.deepEqual(POSSESSION_GAMEPLAY_R511_PROFILE.pillars, [
  'SHORT_LINE_SUPPORT',
  'PRESSURE_CONTROL',
  'CENTRAL_PROGRESSION',
  'LINE_BREAKING',
]);

const weights = POSSESSION_GAMEPLAY_R511_PROFILE.actionWeights;
assert.ok(weights.shortCombination > weights.finishingAction,
  'R511: linha curta precisa pesar mais que finalização isolada.');
assert.ok(weights.firstTouchUnderPressure > weights.attackingMovement,
  'R511: receber sob pressão precisa pesar mais que corrida direta.');
assert.ok(weights.pressEscape > weights.finishingAction,
  'R511: saída sob pressão precisa ser prioridade real de Posse.');
assert.ok(weights.centralCarry > weights.aerialDuel,
  'R511: progressão central precisa pesar mais que duelo aéreo.');
assert.ok(weights.lineBreakingPass > weights.aerialDuel,
  'R511: passe de ruptura precisa participar da progressão de Posse.');

const technical = analyzePossessionGameplayR511(technicalState);
const direct = analyzePossessionGameplayR511(directState);

assert.equal(technical.style, 'POSSE_DE_BOLA');
assert.equal(technical.calibration.status, 'PROVISIONAL_UNCALIBRATED');
assert.equal(technical.calibration.certifiedForFinalWrite, false);
assert.ok(technical.possessionScore > direct.possessionScore,
  'R511: perfil técnico de linha curta/pressão deve superar perfil direto de corrida/finalização em Posse.');
assert.ok(technical.pillars.shortLineSupport.score >= 85,
  'R511: jogador técnico precisa pontuar alto em suporte de linha curta.');
assert.ok(technical.pillars.pressureControl.score >= 85,
  'R511: controle sob pressão precisa ser mensurado explicitamente.');
assert.ok(technical.pillars.centralProgression.score >= 80,
  'R511: progressão central precisa ser mensurada explicitamente.');
assert.ok(technical.pillars.lineBreaking.score >= 80,
  'R511: ruptura por passe precisa ser mensurada explicitamente.');
assert.ok(technical.r510.marginalTrainingOptions.length > 0,
  'R511: Posse deve reutilizar o retorno marginal do R510, não criar um otimizador paralelo.');
assert.deepEqual(technical.r510.calibration.status, technical.calibration.status,
  'R511: não pode elevar silenciosamente o grau de certificação do R510.');

const repeated = analyzePossessionGameplayR511(technicalState);
assert.deepEqual(technical, repeated, 'R511: mesma entrada precisa gerar o mesmo diagnóstico de Posse.');

console.log('R511 aprovado: Posse profunda mede linha curta, pressão, progressão central e ruptura sobre o R510.');
