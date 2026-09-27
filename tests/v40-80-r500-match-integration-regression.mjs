import assert from 'node:assert/strict';
import fs from 'node:fs';

const centerPath = 'src/modules/matches/MatchTrainerCenter.tsx';
const bridgePath = 'src/modules/explainable-ai/MatchExplainabilityR489.tsx';
const center = fs.readFileSync(centerPath, 'utf8');
const bridge = fs.readFileSync(bridgePath, 'utf8');
const tabType = center.match(/type AnalysisTab = ([^;]+);/)?.[1] ?? '';

assert.match(center, /matchVisionR482/);
assert.match(center, /MatchExplainabilityR489/);
assert.doesNotMatch(tabType, /r500|diretor|director/i, 'R500 não pode criar nova aba no Match Trainer');

assert.match(bridge, /buildAutonomousTacticalDirectorR500/);
assert.match(bridge, /TacticalDirectorPanelR500/);
assert.match(bridge, /phase:\s*['"]POST_MATCH['"]/);
assert.match(bridge, /matchVision/);
assert.doesNotMatch(bridge, /buildMatchVisionR482|analyzeMatchVideo|confirmCandidate|dismissCandidate|createMatchMarker|upsertMatchTrainerSession|safeStorageSet|fetch\(|onApply|onSave|setSessions|setActiveId/);
assert.doesNotMatch(`${center}\n${bridge}`, /R500[^\n]*(ao vivo|tempo real)/i, 'R500 pós-jogo não pode fingir telemetria ao vivo');

const usage = center.match(/<MatchExplainabilityR489[^>]*>/)?.[0] ?? '';
assert.ok(usage, 'Match Trainer precisa manter a ponte de explicação dentro da aba existente');
assert.doesNotMatch(usage, /onConfirm|onApply|onSave|onPromote|onReject|set/);

console.log('R500 Match Trainer aprovado: pós-jogo usa a ponte R489/R482 existente sem nova aba ou escrita.');
