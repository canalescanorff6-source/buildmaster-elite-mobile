import assert from 'node:assert/strict';
import fs from 'node:fs';

const path = 'src/modules/squad/IntegratedTeamLab.tsx';
const source = fs.readFileSync(path, 'utf8');
const tabType = source.match(/type TeamTab = ([^;]+);/)?.[1] ?? '';

assert.match(source, /buildAutonomousTacticalDirectorR500/);
assert.match(source, /TacticalDirectorPanelR500/);
assert.match(source, /tacticalTwinR480/);
assert.match(source, /squadBrainR481/);
assert.match(source, /chemistryR484/);
assert.match(source, /phase:\s*['"]PRE_MATCH['"]/);
assert.doesNotMatch(tabType, /r500|diretor|director/i, 'R500 não pode criar nova aba no Meu Time');

const panelUsage = source.match(/<TacticalDirectorPanelR500[\s\S]*?\/>/)?.[0] ?? '';
assert.ok(panelUsage, 'Meu Time precisa renderizar o painel R500');
assert.doesNotMatch(panelUsage, /onFormationChange|onApply|onSave|onPromote|onReject/);

console.log('R500 Meu Time aprovado: usa snapshots existentes e não cria nova aba/escrita.');
