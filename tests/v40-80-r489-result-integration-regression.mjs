import assert from 'node:assert/strict';
import fs from 'node:fs';

const advancedPath = 'src/components/result/ResultAdvancedWorkspaceR192.tsx';
const bridgePath = 'src/modules/explainable-ai/BuildExplainabilityR489.tsx';
const advanced = fs.readFileSync(advancedPath, 'utf8');
const bridge = fs.readFileSync(bridgePath, 'utf8');

assert.match(advanced, /BuildExplainabilityR489/);
assert.match(advanced, /tab === ['"]comparar['"][\s\S]*BuildSimulatorPanelR483[\s\S]*BuildExplainabilityR489/);

const tabType = advanced.match(/export type AdvancedResultTabR192 = ([^;]+);/)?.[1] ?? '';
assert.ok(tabType.includes("'comparar'"), 'aba comparar existente precisa ser preservada');
assert.doesNotMatch(tabType, /explica|r489|porque/i, 'R489 não pode criar nova aba global');
assert.doesNotMatch(advanced, /buildExplainableDecisionR489|buildBuildSimulatorR483|explainableBuildR489/, 'R192 deve delegar a composição R489 para a fronteira dedicada.');

assert.match(bridge, /useMemo/);
assert.match(bridge, /analysisUsagePositionR138\(result\)/);
assert.match(bridge, /buildBuildSimulatorR483/);
assert.match(bridge, /buildExplainableDecisionR489/);
assert.match(bridge, /ExplainableDecisionPanelR489/);
assert.match(bridge, /kind: ['"]BUILD['"]/);
assert.match(bridge, /r483: buildSimulatorR489\.blockedReason \? ['"]BLOCKED['"] : ['"]AVAILABLE['"]/);

const panelUsage = bridge.match(/<ExplainableDecisionPanelR489[^>]*>/)?.[0] ?? '';
assert.ok(panelUsage, 'ponte BUILD precisa renderizar painel R489');
assert.doesNotMatch(panelUsage, /onPromoteImpeto|onRejectImpeto|onApply|onSave|setTraining|setResult/);

const compareStart = advanced.indexOf("tab === 'comparar'");
const compareEnd = advanced.indexOf("tab === 'partidas'", compareStart);
const compareBlock = compareStart >= 0 ? advanced.slice(compareStart, compareEnd > compareStart ? compareEnd : undefined) : '';
assert.match(compareBlock, /BuildSimulatorPanelR483/);
assert.match(compareBlock, /BuildExplainabilityR489/);
assert.doesNotMatch(compareBlock, /onPromoteImpeto=|onRejectImpeto=|onApply=|onSave=/);

console.log('R489 Resultado aprovado: ponte BUILD isolada dentro de Comparar, sem nova aba ou escrita.');
