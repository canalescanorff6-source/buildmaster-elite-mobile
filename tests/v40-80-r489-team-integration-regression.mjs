import assert from 'node:assert/strict';
import fs from 'node:fs';

const teamPath = 'src/modules/squad/IntegratedTeamLab.tsx';
const bridgePath = 'src/modules/explainable-ai/TeamExplainabilityR489.tsx';
const team = fs.readFileSync(teamPath, 'utf8');
const bridge = fs.readFileSync(bridgePath, 'utf8');

const tabType = team.match(/type TeamTab = ([^;]+);/)?.[1] ?? '';
assert.ok(tabType.includes("'elenco'") && tabType.includes("'tatica'") && tabType.includes("'banco'"));
assert.doesNotMatch(tabType, /explica|r489|porque/i, 'R489 não pode criar nova aba no Meu Time');

assert.match(team, /TeamExplainabilityR489/);
assert.match(team, /tab === ['"]elenco['"][\s\S]*StarterExplainabilityR489/);
assert.match(team, /tab === ['"]tatica['"][\s\S]*TacticalExplainabilityR489/);
assert.match(team, /tab === ['"]banco['"][\s\S]*RotationExplainabilityR489/);
assert.match(team, /tacticalTwinR480/);
assert.match(team, /squadBrainR481/);
assert.match(team, /chemistryR484/);

assert.match(bridge, /buildExplainableDecisionR489/);
assert.match(bridge, /ExplainableDecisionPanelR489/);
assert.match(bridge, /kind: ['"]STARTER['"]/);
assert.match(bridge, /kind: ['"]ROTATION['"]/);
assert.match(bridge, /kind: ['"]TACTICAL['"]/);
assert.match(bridge, /squadBrain/);
assert.match(bridge, /tacticalTwin/);
assert.match(bridge, /chemistry/);

assert.doesNotMatch(bridge, /onFormationChange|upsertPersonalPreset|localStorage|sessionStorage|fetch\(|setTraining|setResult|onApply|onSave|onPromote|onReject/);
assert.doesNotMatch(bridge, /buildTacticalTwinR480|buildSquadBrainR481|buildChemistryGraphR484/, 'ponte R489 deve consumir snapshots existentes, não reconstruí-los');

const starterUsage = team.match(/<StarterExplainabilityR489[^>]*>/)?.[0] ?? '';
const rotationUsage = team.match(/<RotationExplainabilityR489[^>]*>/)?.[0] ?? '';
const tacticalUsage = team.match(/<TacticalExplainabilityR489[^>]*>/)?.[0] ?? '';
assert.ok(starterUsage && rotationUsage && tacticalUsage, 'Meu Time precisa integrar os três explicadores locais');
for (const usage of [starterUsage, rotationUsage, tacticalUsage]) {
  assert.doesNotMatch(usage, /onFormationChange|onApply|onSave|onPromote|onReject/);
}

console.log('R489 Meu Time aprovado: titular, rotação e tática explicáveis sem nova aba ou escrita.');
