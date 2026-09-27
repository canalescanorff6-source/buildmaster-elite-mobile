import assert from 'node:assert/strict';
import fs from 'node:fs';

const bridge = fs.readFileSync('src/modules/explainable-ai/TeamExplainabilityR489.tsx', 'utf8');
const team = fs.readFileSync('src/modules/squad/IntegratedTeamLab.tsx', 'utf8');

assert.match(team, /TacticalExplainabilityR489/, 'Meu Time precisa continuar usando a ponte tática existente');
assert.match(bridge, /buildAutonomousTacticalDirectorR500/);
assert.match(bridge, /TacticalDirectorPanelR500/);
assert.match(bridge, /currentScenario:\s*scenario\.id/);
assert.doesNotMatch(bridge, /onApply|onSave|onPromote|onFormationChange|setTraining|upsertPersonalPreset|fetch\(/);

const tabType = team.match(/type TeamTab = ([^;]+);/)?.[1] ?? '';
assert.doesNotMatch(tabType, /r500|diretor|director/i, 'R500 não pode criar nova aba global/local no Meu Time');

console.log('R500 Meu Time aprovado: diretor integrado pela ponte tática existente e sem escrita.');
