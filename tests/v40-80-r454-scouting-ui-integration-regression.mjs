import assert from 'node:assert/strict';
import fs from 'node:fs';

const central = fs.readFileSync('src/modules/core/centralIntelligence.ts','utf8');
const team = fs.readFileSync('src/modules/squad/IntegratedTeamLab.tsx','utf8');
const players = fs.readFileSync('src/modules/players/PlayerLaboratory.tsx','utf8');
const formation = fs.readFileSync('src/lib/formationRoleEngine.ts','utf8');
const migration = fs.readFileSync('supabase/migrations/202609190001_r454_gameplay_scouting.sql','utf8');

assert.match(formation, /evaluateTacticalFitR454/);
assert.match(formation, /evaluatePairSynergyR454/);
assert.match(central, /MANTER_FUNCAO/);
assert.match(central, /MUDAR_COMPORTAMENTO/);
assert.match(team, /MANTER A FUNÇÃO/);
assert.match(team, /MUDAR O COMPORTAMENTO/);
assert.match(players, /Scouting pendente/);
assert.match(migration, /unique \(user_id, card_id, game_version\)/);
assert.match(migration, /SOURCE_CONFLICT/);
assert.doesNotMatch(formation, /parsed\.(?:maxOverall|overall)/, 'motor R454 de formação não pode ordenar por GER/OVR');
console.log('R454 scouting UI/integration: OK');
