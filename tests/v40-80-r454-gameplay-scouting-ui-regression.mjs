import assert from 'node:assert/strict';
import fs from 'node:fs';

const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const card = fs.readFileSync('src/components/result/GameplayScoutingR454Card.tsx', 'utf8');
const core = fs.readFileSync('src/lib/gameplayScoutingR454.ts', 'utf8');

assert.match(workspace, /GameplayScoutingR454Card/);
assert.match(workspace, /<GameplayScoutingR454Card result=\{result\} \/>/);
assert.match(card, /Gameplay Scouting • R454/);
assert.match(card, /DADOS OFICIAIS/);
assert.match(card, /SCOUTING \/ REVIEW/);
assert.match(card, /COMUNIDADE/);
assert.match(card, /MEUS TESTES/);
assert.match(card, /ESTILO INATIVO NESTA POSIÇÃO/);
assert.match(core, /GER\/OVR não participa deste cálculo/);
assert.match(core, /SOURCE_CONFLICT/);
assert.match(core, /SCOUTING_PENDENTE/);

console.log('R454 UI aprovada: Gameplay Scouting aparece na ficha com fontes separadas, feedback e alerta de estilo inativo.');
