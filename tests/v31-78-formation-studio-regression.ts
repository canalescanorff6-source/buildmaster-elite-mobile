import assert from 'node:assert/strict';
import {
  FORMATION_GOAL_OPTIONS,
  MARQUES_FORMATION_STUDIO_VERSION,
  OFFICIAL_MARQUES_PLAYSTYLES,
  applyRoleOverrides,
  defaultRoleOverrides,
  recommendMetaFormations,
  validateFormationRoles
} from '../src/modules/formations/metaFormationCatalog';

assert.equal(MARQUES_FORMATION_STUDIO_VERSION, '31.78.0');
assert.equal(Object.values(OFFICIAL_MARQUES_PLAYSTYLES).flat().length, 22);
assert.deepEqual(OFFICIAL_MARQUES_PLAYSTYLES.ataque, ['Artilheiro', 'Puxa marcação', 'Homem de área', 'Pivô', 'Atacante pivô', 'Armador criativo']);
assert.ok(OFFICIAL_MARQUES_PLAYSTYLES.meio.includes('Primeiro volante'));
assert.ok(OFFICIAL_MARQUES_PLAYSTYLES.meio.includes('O destruidor'));
assert.ok(OFFICIAL_MARQUES_PLAYSTYLES.meio.includes('Clássico nº 10'));
assert.ok(OFFICIAL_MARQUES_PLAYSTYLES.meio.includes('Jogador de infiltração'));
assert.ok(OFFICIAL_MARQUES_PLAYSTYLES.defesa.includes('Lateral defensivo'));
assert.ok(OFFICIAL_MARQUES_PLAYSTYLES.goleiros.includes('Goleiro ofensivo'));
assert.equal(FORMATION_GOAL_OPTIONS.length, 7);

for (const style of ['POSSE_DE_BOLA', 'CONTRA_ATAQUE', 'CONTRA_ATAQUE_RAPIDO'] as const) {
  const recommendations = recommendMetaFormations(style, 'sem-pontas');
  assert.ok(recommendations.length >= 20);
  assert.ok(recommendations[0].score >= recommendations.at(-1)!.score);
  assert.equal(recommendations[0].formation.slots.length, 11);
  assert.ok(recommendations.slice(0, 8).some((item) => item.tags.includes('Sem pontas')));
}

const selected = recommendMetaFormations('CONTRA_ATAQUE_RAPIDO', 'sem-pontas')[0].formation;
const roles = defaultRoleOverrides(selected);
assert.equal(Object.keys(roles).length, 11);
const customized = applyRoleOverrides(selected, roles);
assert.equal(customized.slots.length, 11);
assert.notEqual(customized.id, selected.id);
const validation = validateFormationRoles(selected, roles);
assert.ok(validation.score >= 0 && validation.score <= 100);
assert.equal(Array.isArray(validation.warnings), true);

console.log('v31.78 Estúdio de Formações aprovado: catálogo, estilos oficiais, ranking, personalização e validação tática.');
