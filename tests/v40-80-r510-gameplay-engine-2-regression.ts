import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { ProjectedPlayerStateR504 } from '../src/modules/analysis/projectedPlayerStateR504';
import {
  analyzeGameplayEngineR510,
  type GameplayEngineContextR510,
} from '../src/modules/analysis/gameplayEngineR510';

const state: ProjectedPlayerStateR504 = {
  version: '40.80-r504-projected-player-state-v1',
  source: 'BASE_CARD_PLUS_FINAL_TRAINING',
  baseAttributes: {
    lowPass: 70,
    loftedPass: 72,
    ballControl: 94,
    dribbling: 96,
    tightPossession: 96,
    offensiveAwareness: 88,
    acceleration: 93,
    balance: 94,
    speed: 92,
    kickingPower: 88,
    stamina: 90,
    physicalContact: 80,
    finishing: 82,
    heading: 75,
    jump: 78,
    defensiveAwareness: 65,
    defensiveEngagement: 65,
    tackling: 64,
    aggression: 70,
  },
  finalAttributes: {
    lowPass: 74,
    loftedPass: 76,
    ballControl: 96,
    dribbling: 98,
    tightPossession: 98,
    offensiveAwareness: 90,
    acceleration: 95,
    balance: 96,
    speed: 94,
    kickingPower: 90,
    stamina: 92,
    physicalContact: 82,
    finishing: 84,
    heading: 75,
    jump: 78,
    defensiveAwareness: 65,
    defensiveEngagement: 65,
    tackling: 64,
    aggression: 70,
  },
  training: {
    shooting: 2,
    passing: 4,
    dribbling: 2,
    dexterity: 2,
    lowerBodyStrength: 2,
    aerialStrength: 0,
    defending: 0,
    gk1: 0,
    gk2: 0,
    gk3: 0,
  },
  trainingCost: 12,
  projectedAttributeCount: 18,
};

const possessionContext: GameplayEngineContextR510 = {
  actionWeights: {
    shortCombination: 1.8,
    lineBreakingPass: 1.6,
    firstTouchUnderPressure: 0.55,
    centralCarry: 0.25,
    pressEscape: 0.45,
    duelShield: 0.45,
    attackingMovement: 0.35,
    finishingAction: 0.25,
    defensiveDuel: 0.1,
    aerialDuel: 0.1,
  },
};

const before = JSON.parse(JSON.stringify(state));
const first = analyzeGameplayEngineR510(state, possessionContext);
const second = analyzeGameplayEngineR510(state, possessionContext);

assert.deepEqual(first, second, 'R510: mesma entrada deve produzir diagnóstico e ranking idênticos.');
assert.deepEqual(state, before, 'R510: análise não pode mutar o Projected Player State R504.');
assert.equal(first.source, 'PROJECTED_PLAYER_STATE_R504');
assert.ok(first.coverage > 0 && first.coverage <= 1, 'R510: cobertura precisa ser explícita em 0..1.');
assert.ok(first.overallFunctionalScore > 0 && first.overallFunctionalScore <= 100, 'R510: score funcional deve permanecer em 0..100.');

assert.equal(first.bottlenecks[0]?.attribute, 'lowPass',
  'R510: passe baixo insuficiente deve aparecer como gargalo funcional antes de atributos já saturados.');

const passing = first.marginalTrainingOptions.find((option) => option.trainingKey === 'passing');
const dribbling = first.marginalTrainingOptions.find((option) => option.trainingKey === 'dribbling');
assert.ok(passing, 'R510: passing deve produzir opção marginal quando ainda pode evoluir.');
assert.ok(dribbling, 'R510: dribbling deve continuar mensurável mesmo perto da saturação.');
assert.equal(passing.ppCost, 2, 'R510: nível 4 -> 5 de passing deve usar custo marginal oficial de 2 PP.');
assert.ok(passing.functionalGain > dribbling.functionalGain,
  'R510: corrigir gargalo de passe deve render mais gameplay que empilhar drible já saturado.');
assert.ok(passing.gainPerPp > dribbling.gainPerPp,
  'R510: ranking precisa comparar ganho funcional por PP, não somente atributo bruto.');
assert.equal(first.marginalTrainingOptions[0]?.trainingKey, 'passing',
  'R510: melhor próximo investimento deve ser o grupo com maior retorno funcional por PP.');
assert.ok(dribbling.saturationPenalty > passing.saturationPenalty,
  'R510: grupo já saturado precisa receber penalidade de saturação maior.');

const cappedState: ProjectedPlayerStateR504 = {
  ...state,
  finalAttributes: { ...state.finalAttributes, finishing: 99, placeKicking: 99, curl: 99 },
  training: { ...state.training, shooting: 16 },
};
const capped = analyzeGameplayEngineR510(cappedState, possessionContext);
assert.equal(capped.marginalTrainingOptions.some((option) => option.trainingKey === 'shooting'), false,
  'R510: grupo no nível máximo não pode competir por PP inexistente.');

const source = fs.readFileSync('src/modules/analysis/gameplayEngineR510.ts', 'utf8');
assert.doesNotMatch(source, /\b(?:overall|ger)\b/i,
  'R510: GER/Overall não pode participar do motor de decisão funcional.');
assert.match(source, /trainingTotalCost/,
  'R510: custo marginal precisa derivar da autoridade oficial de PP.');
assert.match(source, /TRAINING_ATTRIBUTE_GROUPS_R504/,
  'R510: grupos de treino precisam reutilizar a autoridade do Projected Player State.');

console.log('R510 aprovado: gargalo, saturação e ganho funcional por PP são determinísticos e independentes de GER/Overall.');
