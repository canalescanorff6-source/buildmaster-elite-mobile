import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { ProjectedPlayerStateR504 } from '../src/modules/analysis/projectedPlayerStateR504';
import {
  analyzePossessionR511,
  POSSESSION_ACTION_IDS_R511,
  POSSESSION_ENGINE_R511_CALIBRATION,
  type PossessionUsageFunctionR511,
} from '../src/modules/analysis/possessionEngineR511';

const state: ProjectedPlayerStateR504 = {
  version: '40.80-r504-projected-player-state-v1',
  source: 'BASE_CARD_PLUS_FINAL_TRAINING',
  baseAttributes: {
    lowPass: 78,
    loftedPass: 76,
    ballControl: 88,
    dribbling: 86,
    tightPossession: 87,
    offensiveAwareness: 82,
    acceleration: 84,
    balance: 81,
    speed: 80,
    kickingPower: 82,
    stamina: 86,
    physicalContact: 77,
    finishing: 76,
    heading: 68,
    jump: 72,
    defensiveAwareness: 72,
    defensiveEngagement: 75,
    tackling: 71,
    aggression: 74,
  },
  finalAttributes: {
    lowPass: 84,
    loftedPass: 81,
    ballControl: 91,
    dribbling: 89,
    tightPossession: 91,
    offensiveAwareness: 85,
    acceleration: 87,
    balance: 84,
    speed: 83,
    kickingPower: 84,
    stamina: 89,
    physicalContact: 80,
    finishing: 78,
    heading: 68,
    jump: 72,
    defensiveAwareness: 75,
    defensiveEngagement: 79,
    tackling: 75,
    aggression: 78,
  },
  training: {
    shooting: 2,
    passing: 5,
    dribbling: 3,
    dexterity: 3,
    lowerBodyStrength: 3,
    aerialStrength: 0,
    defending: 3,
    gk1: 0,
    gk2: 0,
    gk3: 0,
  },
  trainingCost: 25,
  projectedAttributeCount: 18,
};

const expectedActions = [
  'receiveUnderPressure',
  'orientedFirstTouch',
  'turn',
  'protect',
  'shortOption',
  'wallPass',
  'safePass',
  'lineBreakPass',
  'shortCarry',
  'centralProgression',
  'reposition',
  'counterPress',
  'exitUnderPressure',
].sort();

assert.deepEqual([...POSSESSION_ACTION_IDS_R511].sort(), expectedActions,
  'R511 deve modelar explicitamente as ações reais de Posse previstas pelo Prompt Mestre.');

const roles: PossessionUsageFunctionR511[] = [
  'CF_FINISHER',
  'CF_PIVOT',
  'SS_ASSOCIATIVE',
  'AMF_INFILTRATOR',
  'CMF_ORGANIZER',
  'CMF_BOX_TO_BOX',
  'DMF_PROTECTOR',
  'CB_BUILDER',
  'FULLBACK_DEFENSIVE',
];

for (const usageFunction of roles) {
  const result = analyzePossessionR511(state, { usageFunction });
  assert.equal(result.style, 'POSSESSION_CENTRAL');
  assert.equal(result.usageFunction, usageFunction);
  assert.equal(result.source, 'GAMEPLAY_ENGINE_R510');
  assert.equal(result.calibration.certifiedForFinalWrite, false,
    'R511 não pode virar segundo writer da ficha enquanto a calibração for provisória.');
  assert.equal(Object.keys(result.actionScores).length, expectedActions.length,
    'Cada função deve pontuar todas as ações de Posse, ainda que com prioridades diferentes.');
  assert.ok(result.possessionScore > 0 && result.possessionScore <= 100);
  assert.ok(result.gameplay.marginalTrainingOptions.length > 0,
    'R511 deve reaproveitar gargalo/saturação/ganho marginal do R510 no contexto de Posse.');
}

assert.equal(POSSESSION_ENGINE_R511_CALIBRATION.status, 'PROVISIONAL_UNCALIBRATED');
assert.equal(POSSESSION_ENGINE_R511_CALIBRATION.provenance, 'ENGINEERING_SEED');
assert.equal(POSSESSION_ENGINE_R511_CALIBRATION.officialGameData, false);
assert.ok(POSSESSION_ENGINE_R511_CALIBRATION.calibrationRequired.includes('GOLDEN_CARD_LAB'));
assert.ok(POSSESSION_ENGINE_R511_CALIBRATION.calibrationRequired.includes('REAL_MATCH_DATA'));

const ss = analyzePossessionR511(state, { usageFunction: 'SS_ASSOCIATIVE' });
const cb = analyzePossessionR511(state, { usageFunction: 'CB_BUILDER' });
const dmf = analyzePossessionR511(state, { usageFunction: 'DMF_PROTECTOR' });
const cmf = analyzePossessionR511(state, { usageFunction: 'CMF_ORGANIZER' });

assert.equal(ss.actionPriorities.wallPass, 5,
  'SA associativo deve tratar tabela/1-2 como ação central de Posse.');
assert.equal(ss.actionPriorities.shortOption, 5,
  'SA associativo deve oferecer linha curta e triangulação.');
assert.equal(cb.actionPriorities.safePass, 5,
  'ZAG construtor deve priorizar passe seguro na saída.');
assert.equal(cb.actionPriorities.exitUnderPressure, 5,
  'ZAG construtor deve priorizar saída sob pressão.');
assert.equal(dmf.actionPriorities.counterPress, 5,
  'VOL protetor deve responder fortemente à pressão pós-perda.');
assert.equal(dmf.actionPriorities.reposition, 5,
  'VOL protetor deve priorizar reposicionamento e linha curta.');
assert.equal(cmf.actionPriorities.lineBreakPass, 5,
  'MLG/CMF organizador deve procurar linhas e passe de ruptura.');
assert.equal(cmf.actionPriorities.safePass, 5,
  'MLG/CMF organizador deve manter circulação segura e paciente.');

assert.notDeepEqual(ss.r510Context.actionWeights, cb.r510Context.actionWeights,
  'Funções diferentes precisam produzir contexto funcional diferente no R510.');
assert.notDeepEqual(dmf.r510Context.actionWeights, cmf.r510Context.actionWeights,
  'Protetor e organizador não podem virar clones por posição.');

const before = JSON.parse(JSON.stringify(state));
analyzePossessionR511(state, { usageFunction: 'SS_ASSOCIATIVE' });
assert.deepEqual(state, before, 'R511 não pode mutar o estado projetado R504.');

const first = analyzePossessionR511(state, { usageFunction: 'CMF_ORGANIZER' });
const second = analyzePossessionR511(state, { usageFunction: 'CMF_ORGANIZER' });
assert.deepEqual(first, second, 'R511 deve ser determinístico para a mesma carta/função.');

const source = fs.readFileSync('src/modules/analysis/possessionEngineR511.ts', 'utf8');
assert.doesNotMatch(source, /\b(?:overall|ger)\b/i,
  'R511 não pode usar GER/Overall para decidir Posse.');
assert.doesNotMatch(source, /cross|cruzamento|winger|ponta/i,
  'Perfil central de Posse não deve introduzir dependência de cruzamento/ponta clássica.');
assert.match(source, /analyzeGameplayEngineR510/,
  'R511 deve compor o Gameplay Engine 2 em vez de duplicar gargalo/saturação/ganho marginal.');
assert.match(source, /POSSESSION_ENGINE_R511_SEED_POLICY/,
  'Prioridades e traduções de ações precisam ficar centralizadas e auditáveis.');

console.log('R511 aprovado: Posse central modela ações reais por função sobre o Gameplay Engine 2, sem GER e sem segundo writer.');
