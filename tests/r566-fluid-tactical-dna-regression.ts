import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { TeamDiagnosis } from '../src/modules/core/centralIntelligence';
import { getFormationBlueprint } from '../src/lib/formationRoleEngine';
import { buildFluidTacticalAuditR566 } from '../src/lib/fluidTacticalDnaR566';

const blueprint = getFormationBlueprint('4-4-2');
const cf = blueprint.slots.find(slot => slot.position === 'CF');
assert.ok(cf, 'Formação precisa conter centroavante.');
const card = {
  playerName: 'Teste do Elenco',
  offensivePlaystyle: 'Artilheiro',
  defensivePlaystyle: 'Pressão no Ataque',
  defensivePlaystyleConfirmed: true
};
const before = JSON.stringify(card);
const team = {
  formation: '4-4-2',
  totalSlots: 1,
  lineup: [{ slot: cf, player: { parsed: card }, score: 80 }],
} as unknown as TeamDiagnosis;

const base = { team, defenseFormation: '4-4-2' as const, teamStyle: 'POSSE_DE_BOLA' as const };
const unknown = buildFluidTacticalAuditR566({ ...base, defenseSlotByAttackSlot: {} });
assert.equal(unknown.assigned, 0);
assert.equal(unknown.players[0].defense, 'PENDENTE');
assert.equal(unknown.canApplyInGame, false);

const assigned = buildFluidTacticalAuditR566({
  ...base, defenseSlotByAttackSlot: { [cf.id]: cf.id }
});
assert.equal(assigned.assigned, 1);
assert.equal(assigned.players[0].offense, 'COMPATIVEL');
assert.equal(assigned.players[0].defense, 'COMPATIVEL');
assert.equal(assigned.mode, 'SOMENTE_LEITURA');
assert.equal(JSON.stringify(card), before, 'Não pode modificar carta.');

const mismatch = buildFluidTacticalAuditR566({
  ...base,
  team: { ...team, lineup: [{slot:cf, player:{parsed:{...card, offensivePlaystyle:'Infiltração',defensivePlaystyleConfirmed:false}}}] } as unknown as TeamDiagnosis,
  defenseSlotByAttackSlot: { [cf.id]: cf.id }
});
assert.equal(mismatch.players[0].offense, 'INCOMPATIVEL');
assert.equal(mismatch.players[0].defense, 'PENDENTE');

const missing = buildFluidTacticalAuditR566({
  ...base,
  defenseSlotByAttackSlot: { [cf.id]: 'slot-inexistente' }
});
assert.equal(missing.players[0].defenseSlot, null);
assert.ok(missing.players[0].notes.some(note => note.includes('inválida')));

const ui = readFileSync('src/modules/squad/IntegratedTeamLab.tsx','utf8');
assert.match(ui, /buildFluidTacticalAuditR566/);
assert.match(ui, /DNA Tático Fluido R566/);
assert.match(ui, /setDefenseMappingR566/);
console.log('R566 GREEN — phase mapping, uncertain defense, immutability, tactics UI');
