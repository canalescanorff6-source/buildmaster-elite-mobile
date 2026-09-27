import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { ParsedCard, TrainingPlan } from '../src/lib/analyzerDomain';
import { trainingPlanTotalCost } from '../src/lib/trainingPlanCore';
import { deriveProjectedPlayerStateR504 } from '../src/modules/analysis/projectedPlayerStateR504';

const parsed = {
  playerName: 'R504 Test',
  mainPosition: 'AMF',
  attributes: {
    finishing: 95,
    placeKicking: 98,
    curl: 99,
    lowPass: 80,
    speed: 90,
    ballControl: 86,
  },
} as ParsedCard;

const training: TrainingPlan = {
  shooting: 3,
  passing: 2,
  dribbling: 1,
  dexterity: 0,
  lowerBodyStrength: 4,
  aerialStrength: 0,
  defending: 0,
  gk1: 0,
  gk2: 0,
  gk3: 0,
};

const before = JSON.parse(JSON.stringify(parsed.attributes));
const first = deriveProjectedPlayerStateR504(parsed, training);
const second = deriveProjectedPlayerStateR504(parsed, training);

assert.deepEqual(first, second, 'R504: mesma carta + mesma ficha precisa produzir estado projetado idêntico.');
assert.deepEqual(parsed.attributes, before, 'R504: projeção nunca pode mutar a carta-base.');
assert.equal(first.source, 'BASE_CARD_PLUS_FINAL_TRAINING');
assert.equal(first.trainingCost, trainingPlanTotalCost(training), 'R504: custo deve vir da autoridade oficial do plano.');
assert.equal(first.baseAttributes.finishing, 95);
assert.equal(first.finalAttributes.finishing, 98, 'R504: shooting +3 deve projetar finishing 95 -> 98.');
assert.equal(first.finalAttributes.placeKicking, 99, 'R504: atributos projetados precisam respeitar clamp 99.');
assert.equal(first.finalAttributes.curl, 99, 'R504: atributo já em 99 permanece 99.');
assert.equal(first.finalAttributes.lowPass, 82, 'R504: passing +2 precisa chegar ao estado final.');
assert.equal(first.finalAttributes.speed, 94, 'R504: lowerBodyStrength +4 precisa chegar ao estado final.');
assert.equal(first.finalAttributes.ballControl, 87, 'R504: dribbling +1 precisa chegar ao estado final.');
assert.equal(first.finalAttributes.loftedPass, undefined, 'R504: atributo ausente não pode ser fabricado só porque pertence ao grupo treinado.');
assert.equal(first.projectedAttributeCount, Object.keys(first.finalAttributes).length);

const clean = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts', 'utf8');
assert.match(clean, /deriveProjectedPlayerStateR504/,
  'R504: Clean Slate precisa consumir a autoridade central do estado pós-build.');
assert.match(clean, /projectedPlayerStateR504:\s*ProjectedPlayerStateR504;/,
  'R504: saída Clean Slate precisa expor o estado final projetado estruturalmente.');
assert.match(clean, /projectedPlayerStateR504=deriveProjectedPlayerStateR504\(parsed,training\)/,
  'R504: estado projetado READY deve nascer da ficha final escolhida, não de uma ficha intermediária.');
assert.match(clean, /deriveProjectedPlayerStateR504\(parsed,zero\)/,
  'R504: caminho bloqueado também deve expor estado base + treino zero sem fabricar progresso.');

console.log('R504 aprovado: estado pós-build é determinístico, exato, não muta a base e não fabrica atributos ausentes.');
