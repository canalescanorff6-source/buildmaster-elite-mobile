import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = 'src/components/result/ResultAdvancedWorkspaceR192.tsx';
const source = fs.readFileSync(file, 'utf8');

assert.match(source, /buildBuildSimulatorR483/);
assert.match(source, /buildExplainableDecisionR489/);
assert.match(source, /ExplainableDecisionPanelR489/);
assert.match(source, /analysisUsagePositionR138\(result\)/);
assert.match(source, /useMemo/);
assert.match(source, /tab === ['"]comparar['"][\s\S]*BuildSimulatorPanelR483[\s\S]*ExplainableDecisionPanelR489/);

const tabType = source.match(/export type AdvancedResultTabR192 = ([^;]+);/)?.[1] ?? '';
assert.ok(tabType.includes("'comparar'"), 'aba comparar existente precisa ser preservada');
assert.doesNotMatch(tabType, /explica|r489|porque/i, 'R489 não pode criar nova aba global');

const panelUsage = source.match(/<ExplainableDecisionPanelR489[^>]*>/)?.[0] ?? '';
assert.ok(panelUsage, 'painel R489 precisa ser renderizado dentro do comparar');
assert.doesNotMatch(panelUsage, /onPromoteImpeto|onRejectImpeto|onApply|onSave|setTraining|setResult/);

const compareStart = source.indexOf("tab === 'comparar'");
const compareEnd = source.indexOf("tab === 'partidas'", compareStart);
const compareBlock = compareStart >= 0 ? source.slice(compareStart, compareEnd > compareStart ? compareEnd : undefined) : '';
assert.match(compareBlock, /BuildSimulatorPanelR483/);
assert.match(compareBlock, /ExplainableDecisionPanelR489/);
assert.doesNotMatch(compareBlock, /onPromoteImpeto=|onRejectImpeto=|onApply=|onSave=/);

console.log('R489 Resultado aprovado: explicação dentro de Comparar, sem nova aba ou escrita.');
