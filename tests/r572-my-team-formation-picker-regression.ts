import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FORMATION_BLUEPRINTS } from '../src/lib/formationRoleEngine';
import { buildTeamDiagnosis } from '../src/modules/core/centralIntelligence';
import {
  TEAM_FORMATION_KEY_R572, normalizeMyTeamFormationR572,
  persistMyTeamFormationR572,
} from '../src/lib/myTeamFormationPreferenceR572';

assert.ok(TEAM_FORMATION_KEY_R572.includes('my_team_formation'));
const ids = FORMATION_BLUEPRINTS.map(x=>x.id);
assert.ok(ids.length>=14,'Todas as formações oficiais devem ser oferecidas.');
assert.equal(new Set(ids).size,ids.length,'Sem opções duplicadas.');
for (const id of ids) assert.equal(normalizeMyTeamFormationR572(id),id);
assert.equal(normalizeMyTeamFormationR572('AUTO'),'AUTO');
for (const invalid of ['4-9-9', '', '__proto__', null, {id:'4-3-1-2'}]) {
  assert.equal(normalizeMyTeamFormationR572(invalid),null,'Preferência obsoleta deve ser ignorada.');
}
assert.equal(persistMyTeamFormationR572('4-9-9' as any),false,'Preferências inválidas não são salvas.');

const players:any[]=[];
const before=JSON.stringify(players);
const automatic=buildTeamDiagnosis(players,'AUTO','POSSE_DE_BOLA');
const center=buildTeamDiagnosis(players,'4-3-1-2','POSSE_DE_BOLA');
const alternate=buildTeamDiagnosis(players,'4-1-2-3','POSSE_DE_BOLA');
assert.equal(automatic.formation,'4-2-2-2','Fallback legado deve continuar válido.');
assert.equal(center.formation,'4-3-1-2','Escolha do usuário deve prevalecer ao automático.');
assert.equal(alternate.formation,'4-1-2-3');
assert.equal(center.totalSlots,11);
assert.equal(alternate.totalSlots,11);
assert.notDeepEqual(center.lineup.map(s=>s.slot.id),alternate.lineup.map(s=>s.slot.id),
  'O esquema exibido deve mudar as posições no campo.');
assert.equal(JSON.stringify(players),before,'A troca não pode modificar cartas do Cofre.');

const myTeam=readFileSync('src/modules/squad/IntegratedTeamLab.tsx','utf8');
const parent=readFileSync('src/components/CardVisionApp.tsx','utf8');
assert.match(myTeam,/aria-label="Escolher formação do Meu Time"/);
assert.match(myTeam,/value=\{selectedFormation\}/);
assert.match(myTeam,/onFormationChange\(event\.target\.value as TacticalFormation\)/);
assert.ok(myTeam.indexOf('bm32-team-formation-picker')<myTeam.indexOf('bm32-team-pitch-panel'),
  'Seletor deve aparecer na área principal, antes do campo.');
assert.match(myTeam,/setDefenseMappingR566\(\{\}\)/,'Mudança estrutural invalida mapeamento fluido antigo.');
assert.match(parent,/selectedFormation=\{formation\}/);
assert.match(parent,/readMyTeamFormationR572\(\)/);
assert.match(parent,/persistMyTeamFormationR572\(selected\)/);
assert.match(parent,/\[sessionHydrated, startupSafeMode, account\?\.profile\.id\]/);
assert.match(parent,/onFormationChange=\{chooseMyTeamFormationR572\}/);
assert.doesNotMatch(myTeam,/writeAccountStorage|setHistory\(/,'Seletor não mexe no Cofre.');
console.log('R572 GREEN — escolha visível, formações válidas, persistência isolada e escalação recalculada.');
