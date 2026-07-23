import assert from 'node:assert/strict';
import { addTrainingLevel, applyPlanEntries, emptyTraining, normalizeTrainingPlan, parseTrainingAllocation, removeTrainingLevel, trainingPlanTotalCost, trainingTotalCost } from '../src/lib/trainingPlanCore';

assert.equal(trainingTotalCost(0), 0);
assert.equal(trainingTotalCost(4), 4);
assert.equal(trainingTotalCost(8), 12);
assert.equal(trainingTotalCost(12), 24);
assert.equal(trainingTotalCost(16), 40);

const plan = applyPlanEntries({ shooting: 8, passing: 4, dribbling: 4, dexterity: 8, lowerBodyStrength: 8 });
assert.equal(trainingPlanTotalCost(plan), 44);

const normalized = normalizeTrainingPlan({ ...emptyTraining(), shooting: 99, passing: -2, dribbling: 4.4 });
assert.equal(normalized.shooting, 16);
assert.equal(normalized.passing, 0);
assert.equal(normalized.dribbling, 4);

const mutable = emptyTraining();
assert.equal(addTrainingLevel(mutable, 'shooting'), true);
assert.equal(mutable.shooting, 1);
assert.equal(removeTrainingLevel(mutable, 'shooting'), true);
assert.equal(mutable.shooting, 0);
assert.equal(removeTrainingLevel(mutable, 'shooting'), false);

const parsed = parseTrainingAllocation('Finalização 8 Passe 4 Drible 4 Destreza 8 Força nas pernas 8 Bola aérea 0 Defesa 0');
assert.ok(parsed);
assert.equal(parsed?.plan.shooting, 8);
assert.equal(parsed?.plan.passing, 4);
assert.equal(parsed?.plan.dexterity, 8);
assert.equal(parsed?.points, 44);

assert.equal(parseTrainingAllocation('Finalização 91 Passe rasteiro 88 Controle de bola 90'), null);

console.log('v27.40 training core regression: ok');
