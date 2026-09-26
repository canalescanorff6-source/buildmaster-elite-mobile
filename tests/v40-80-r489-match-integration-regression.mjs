import assert from 'node:assert/strict';
import fs from 'node:fs';

const centerPath = 'src/modules/matches/MatchTrainerCenter.tsx';
const bridgePath = 'src/modules/explainable-ai/MatchExplainabilityR489.tsx';
const center = fs.readFileSync(centerPath, 'utf8');
const bridge = fs.readFileSync(bridgePath, 'utf8');

const tabType = center.match(/type AnalysisTab = ([^;]+);/)?.[1] ?? '';
assert.ok(tabType.includes("'visao'"), 'aba Match Vision existente precisa ser preservada');
assert.doesNotMatch(tabType, /explica|r489|porque/i, 'R489 não pode criar nova aba de partida');

assert.match(center, /MatchExplainabilityR489/);
assert.match(center, /analysisTab === ['"]visao['"][\s\S]*matchVisionR482[\s\S]*MatchExplainabilityR489/);
assert.match(center, /const matchVisionR482 = useMemo/);

assert.match(bridge, /buildExplainableDecisionR489/);
assert.match(bridge, /ExplainableDecisionPanelR489/);
assert.match(bridge, /kind: ['"]MATCH['"]/);
assert.match(bridge, /r482: ['"]AVAILABLE['"]/);
assert.match(bridge, /matchVision/);

assert.doesNotMatch(bridge, /buildMatchVisionR482|analyzeMatchVideo|confirmCandidate|dismissCandidate|createMatchMarker|upsertMatchTrainerSession|safeStorageSet|fetch\(|onApply|onSave|setSessions|setActiveId/);

const usage = center.match(/<MatchExplainabilityR489[^>]*>/)?.[0] ?? '';
assert.ok(usage, 'Match Vision precisa renderizar a explicação R489');
assert.doesNotMatch(usage, /onConfirm|onApply|onSave|onPromote|onReject|set/);

console.log('R489 Match aprovado: explicação usa somente o snapshot Match Vision R482 dentro da aba existente.');
