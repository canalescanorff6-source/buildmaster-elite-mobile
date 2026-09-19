import assert from 'node:assert/strict';
import fs from 'node:fs';

const panel = fs.readFileSync('src/modules/players/GameplayScoutingPanelR455.tsx','utf8');
const laboratory = fs.readFileSync('src/modules/players/PlayerLaboratory.tsx','utf8');

for (const label of ['Visão geral','Gameplay','Funções','Builds','Formações','Sinergias','Fontes']) {
  assert.match(panel, new RegExp(label));
}
assert.match(panel, /ESTILO INATIVO NESTA POSIÇÃO/);
assert.match(panel, /SCOUTING PENDENTE/);
assert.match(panel, /SOURCE_CONFLICT/);
assert.match(panel, /Dados oficiais, bancos, reviews, comunidade e testes pessoais permanecem separados/);
assert.match(panel, /recommendedSkills\.slice\(0, 5\)/);
assert.match(panel, /readGameplayScoutingForResultR454/);
assert.match(panel, /evaluateTacticalFitR454/);
assert.match(laboratory, /GameplayScoutingPanelR455 player=\{player\}/);
assert.doesNotMatch(panel, /overall\s*[><=]/i, 'painel de scouting não pode criar ranking por OVR/GER');

console.log('R455 Gameplay Scouting UI: OK');
