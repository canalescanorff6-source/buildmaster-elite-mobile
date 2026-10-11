import * as assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getFormationBlueprint } from '../src/lib/formationRoleEngine';
import { cardIdentityFingerprintR126 } from '../src/lib/cardIdentityFingerprintR126';
import { buildTeamDiagnosis } from '../src/modules/core/centralIntelligence';
import {
  MANUAL_TEAM_LAYOUT_KEY_R573,
  emptyManualLayoutR573, sanitizeManualLayoutR573,
  buildManualFormationLineupR573, assignManualStarterR573,
  limitPitchCoordinateR573
} from '../src/lib/manualTeamEditorR573';

const formation=getFormationBlueprint('4-3-1-2');
assert.equal(formation.slots.length,11);
assert.ok(MANUAL_TEAM_LAYOUT_KEY_R573.includes('my_team'));
const empty=emptyManualLayoutR573(formation);
assert.equal(empty.formation,'4-3-1-2');
assert.deepEqual(limitPitchCoordinateR573(-100,300),{x:7,y:92});
assert.deepEqual(limitPitchCoordinateR573(55.26,64.23),{x:55.3,y:64.2});
const first=formation.slots[0],second=formation.slots[1];
const initial=JSON.stringify(empty);
const validated=sanitizeManualLayoutR573(formation,{
  ...empty,
  assignments:{[first.id]:'edition-A',[second.id]:'edition-A',unexpected:'edition-Z'},
  positions:{[first.id]:{x:103,y:-5},unexpected:{x:55,y:60}},
  positionOverrides:{[first.id]:first.alternatives[0]??first.position,unknown:'GK'}
});
assert.equal(validated.assignments[first.id],'edition-A');
assert.equal(validated.assignments[second.id],undefined,'Collision must not duplicate one edition');
assert.deepEqual(validated.positions[first.id],{x:93,y:8});
assert.equal(validated.positions.unexpected,undefined);
assert.equal(validated.positionOverrides.unknown,undefined);
assert.equal(JSON.stringify(empty),initial,'Validation cannot mutate saved data.');
assert.deepEqual(sanitizeManualLayoutR573(formation,{...empty,formation:'4-2-2-2'}),empty,
  'Manual layout of another formation must never leak into this formation.');

const a={parsed:{
  playerName:'Jogador A',cardType:'Épica',mainPosition:'CF',positions:['CF','SS'],
  playstyle:'Artilheiro',attributes:{offensiveAwareness:85,finishing:90,lowPass:72},level:30
 },bestPosition:{code:'CF'},buildName:'Especialista',tacticalProfile:{formation:'4-3-1-2',style:'POSSE_DE_BOLA'},
  permittedPositions:[]} as any;
const b={parsed:{
  playerName:'Jogador B',cardType:'Épica',mainPosition:'CF',positions:['CF','SS'],
  playstyle:'Puxa Marcação',attributes:{offensiveAwareness:80,finishing:76,lowPass:84},level:28
 },bestPosition:{code:'SS'},buildName:'Completo',tacticalProfile:{formation:'4-3-1-2',style:'POSSE_DE_BOLA'},
  permittedPositions:[]} as any;
const players=[a,b];
const idA=cardIdentityFingerprintR126(a.parsed),idB=cardIdentityFingerprintR126(b.parsed);
assert.notEqual(idA,idB,'Different editions must not be equated by name.');
const auto=buildManualFormationLineupR573(players,formation,'POSSE_DE_BOLA',null);
assert.equal(auto.length,11);
const original=JSON.stringify(players);
const pinned={...empty,assignments:{[first.id]:idB,[second.id]:idA}};
const manual=buildManualFormationLineupR573(players,formation,'POSSE_DE_BOLA',pinned);
assert.equal(cardIdentityFingerprintR126(manual[0].player!.parsed),idB);
assert.equal(cardIdentityFingerprintR126(manual[1].player!.parsed),idA);
assert.equal(new Set(manual.filter(f=>f.player).map(f=>cardIdentityFingerprintR126(f.player!.parsed))).size,
  manual.filter(f=>f.player).length,'No card edition can be selected twice.');
assert.equal(JSON.stringify(players),original,'Assignments do not rewrite cards.');
const moved=buildManualFormationLineupR573(players,formation,'POSSE_DE_BOLA',{
  ...pinned,positions:{[first.id]:{x:21.4,y:29.6}},
  positionOverrides:{[first.id]:first.alternatives[0]??first.position}
});
assert.equal(moved[0].slot.x,21.4);
assert.equal(moved[0].slot.y,29.6);
assert.equal(moved[0].slot.position,first.alternatives[0]??first.position);
assert.equal(cardIdentityFingerprintR126(moved[0].player!.parsed),idB);

const swapped=assignManualStarterR573(formation,pinned,manual,first.id,idA);
assert.equal(swapped.assignments[first.id],idA);
assert.equal(swapped.assignments[second.id],idB,'Choosing another titular swaps the positions.');
const cleared=assignManualStarterR573(formation,pinned,manual,first.id,null);
assert.equal(cleared.assignments[first.id],null);
const noCard=buildManualFormationLineupR573(players,formation,'POSSE_DE_BOLA',cleared);
assert.equal(noCard[0].player,null,'Explicit empty must not refill automatically.');
const chosen=buildTeamDiagnosis([], '4-3-1-2','POSSE_DE_BOLA',empty);
assert.equal(chosen.formation,'4-3-1-2');
assert.equal(chosen.totalSlots,11);
const unsaved=buildManualFormationLineupR573(players,formation,'POSSE_DE_BOLA',{
  ...empty,assignments:{[first.id]:'fake-edition-that-is-not-in-vault'}
});
assert.equal(unsaved.length,11,'Stale card may never be fabricated.');
assert.ok(!unsaved.some(f=>f.player&&cardIdentityFingerprintR126(f.player.parsed)==='fake-edition-that-is-not-in-vault'));

const ui=readFileSync('src/modules/squad/ManualPitchEditorR573.tsx','utf8');
const squad=readFileSync('src/modules/squad/IntegratedTeamLab.tsx','utf8');
const app=readFileSync('src/components/CardVisionApp.tsx','utf8');
assert.match(ui,/onPointerDown/);
assert.match(ui,/onPointerMove/);
assert.match(ui,/onPointerUp/);
assert.match(ui,/onKeyDown/);
assert.match(ui,/assignManualStarterR573/);
assert.match(ui,/positionOverrides/);
assert.match(ui,/Restaurar escalação automática/);
assert.match(squad,/<ManualPitchEditorR573/);
assert.match(squad,/starterIds\.has\(player\.fingerprint\)/,'Bench must distinguish different card editions with the same player name.');
assert.match(squad,/cardFingerprint: fit\.player/);
assert.doesNotMatch(squad,/playerByName\.get\(fit\.player\.parsed\.playerName\)/,'Tactical identity must not use same-name lookup.');

assert.match(app,/persistMyTeamLayoutsR573\(layouts\)/);
assert.match(app,/manualLayout: activeManualLayoutR573/);
assert.match(app,/onManualLayoutChange=\{editManualTeamLayoutR573\}/);
assert.match(app,/onImportTeamLayout=\{importManualTeamLayoutR573\}/);
assert.match(squad,/onImportTeamLayout\(parsed\.formation,parsed\.manualLayout/);
assert.match(squad,/hasLayout=parsed\.version===2/);

assert.doesNotMatch(ui,/writeAccountStorage|setHistory\(/,'Editor must not write player records.');
console.log('R573 GREEN: manual positions, swaps, unique editions, pitch dragging, account persistence and no vault mutation.');
