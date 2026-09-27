import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { ParsedCard, TrainingPlan } from '../src/lib/analyzerDomain';
import { deriveProjectedPlayerStateR504 } from '../src/modules/analysis/projectedPlayerStateR504';
import { evaluateFinalImpetoDecisionR457 } from '../src/lib/finalImpetoDecisionR457';

const parsed = {
  playerName: 'R505 Test',
  mainPosition: 'AMF',
  confidence: 95,
  attributes: {
    lowPass: 70,
    loftedPass: 70,
    ballControl: 70,
    tightPossession: 70,
    offensiveAwareness: 72,
    acceleration: 72,
    balance: 72,
  },
  impetos: [],
  evidence: { impetoSlotStatus: 'DISPONIVEL' },
} as unknown as ParsedCard;

const training: TrainingPlan = {
  shooting: 0,
  passing: 8,
  dribbling: 6,
  dexterity: 4,
  lowerBodyStrength: 0,
  aerialStrength: 0,
  defending: 0,
  gk1: 0,
  gk2: 0,
  gk3: 0,
};

const actions = [
  { id: 'short_creation', frequency: 95, contribution: 92 },
  { id: 'through_creation', frequency: 90, contribution: 88 },
  { id: 'close_control', frequency: 82, contribution: 80 },
];

const projected = deriveProjectedPlayerStateR504(parsed, training);
const baseDecision = evaluateFinalImpetoDecisionR457(parsed, actions, 'AMF');
const postBuildDecision = evaluateFinalImpetoDecisionR457(parsed, actions, 'AMF', projected.finalAttributes);

const basePasse = baseDecision.candidates.find((item) => item.name === 'Passe');
const postPasse = postBuildDecision.candidates.find((item) => item.name === 'Passe');
assert.ok(basePasse && postPasse, 'R505: Passe deve permanecer comparável no Top 5 de Ímpetos para AMF criador.');
assert.ok(postPasse.attributeSupport > basePasse.attributeSupport,
  'R505: suporte de atributo do Ímpeto deve usar atributos finais projetados, não a carta-base.');
assert.equal(postBuildDecision.attributeSource, 'PROJECTED_POST_BUILD',
  'R505: decisão final precisa declarar explicitamente que consumiu o estado pós-build.');
assert.equal(baseDecision.attributeSource, 'BASE_CARD',
  'R505: fallback legado deve continuar explícito quando estado projetado não é fornecido.');

const clean = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts', 'utf8');
assert.match(clean,
  /evaluateFinalImpetoDecisionR457\(parsed,recommendationActions,recommendationContext\.targetPosition,projectedPlayerStateR504\.finalAttributes\)/,
  'R505: decisão final READY deve consumir os atributos pós-ficha da autoridade R504.');
assert.match(clean,
  /recommendImpetosR119\(parsed,recommendationActions,recommendationContext\.targetPosition,projectedPlayerStateR504\.finalAttributes\)/,
  'R505: recomendação legada exibida também precisa usar o mesmo estado pós-build.');
assert.match(clean,
  /deriveProjectedPlayerStateR504\(parsed,materializeTrainingPlanR147\(state\.levels\)\)[\s\S]{0,260}evaluateFinalImpetoDecisionR457\(parsed,actions,position,projectedState\.finalAttributes\)/,
  'R505: Joint Optimizer deve pontuar Ímpeto com o estado final de cada ficha candidata, não com atributos-base compartilhados.');

console.log('R505 aprovado: Ímpeto final e Joint Optimizer usam atributos pós-build da autoridade R504.');
