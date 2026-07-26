import assert from 'node:assert/strict';
import { FORMATION_BLUEPRINTS, getFormationBlueprint } from '../src/lib/formationRoleEngine';
import { MANAGERS } from '../src/lib/managers';
import { buildTacticalGuide, rankManagersForPlan, recommendedRoleForSlot } from '../src/lib/tacticalPlanningEngine';

const twoSs = getFormationBlueprint('4-3-3-2ss');
assert.equal(twoSs.slots.length, 11, 'A formação 4-3-3 com 2 SA deve ter 11 espaços.');
assert.equal(twoSs.slots.filter((slot) => slot.position === 'SS').length, 2, 'A formação precisa ter dois SA.');
assert.equal(twoSs.slots.filter((slot) => slot.position === 'CF').length, 1, 'A formação precisa ter um CA.');
assert.equal(twoSs.slots.filter((slot) => slot.position === 'CMF').length, 2, 'A formação precisa ter dois MLG.');
assert.equal(twoSs.slots.filter((slot) => slot.position === 'DMF').length, 1, 'A formação precisa ter um VOL.');
assert.ok(FORMATION_BLUEPRINTS.length >= 23, 'O catálogo deve conter as formações base e os novos presets meta.');

const ranking = rankManagersForPlan(MANAGERS, twoSs, 'POSSE_DE_BOLA');
assert.ok(ranking.length === MANAGERS.length, 'Todos os técnicos devem ser avaliados.');
assert.ok(ranking[0].score >= ranking[ranking.length - 1].score, 'O ranking precisa estar ordenado.');
assert.ok(ranking.some((item) => item.dualProficiency), 'Técnicos com duas proficiências precisam ser reconhecidos.');

const guide = buildTacticalGuide(twoSs, 'POSSE_DE_BOLA');
assert.ok(guide.passing.length >= 3, 'O guia precisa explicar o passe certo.');
assert.ok(guide.recycle.length >= 3, 'O guia precisa explicar quando voltar.');
assert.ok(guide.attack.length >= 3, 'O guia precisa explicar quando atacar.');
assert.ok(guide.defend.length >= 3, 'O guia precisa explicar como defender.');
assert.ok(guide.avoid.length >= 2, 'O guia precisa mostrar erros a evitar.');

for (const slot of twoSs.slots) {
  assert.ok(recommendedRoleForSlot(slot, 'POSSE_DE_BOLA'), `O espaço ${slot.id} deve ter um estilo recomendado.`);
}

console.log('v31.10 tactical planning regression: ok');
