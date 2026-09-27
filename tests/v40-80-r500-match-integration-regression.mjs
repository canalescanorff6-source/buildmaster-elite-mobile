import assert from 'node:assert/strict';
import fs from 'node:fs';

const path = 'src/modules/matches/MatchTrainerCenter.tsx';
const source = fs.readFileSync(path, 'utf8');
const tabType = source.match(/type AnalysisTab = ([^;]+);/)?.[1] ?? '';

assert.match(source, /buildAutonomousTacticalDirectorR500/);
assert.match(source, /TacticalDirectorPanelR500/);
assert.match(source, /matchVisionR482/);
assert.match(source, /phase:\s*['"]POST_MATCH['"]/);
assert.doesNotMatch(tabType, /r500|diretor|director/i, 'R500 não pode criar nova aba no Match Trainer');
assert.doesNotMatch(source, /R500[^\n]*(ao vivo|tempo real)/i, 'R500 pós-jogo não pode fingir telemetria ao vivo');

const panelUsage = source.match(/<TacticalDirectorPanelR500[\s\S]*?\/>/)?.[0] ?? '';
assert.ok(panelUsage, 'Match Trainer precisa renderizar o painel R500');
assert.doesNotMatch(panelUsage, /onApply|onSave|onPromote|onReject|onConfirm/);

console.log('R500 Match Trainer aprovado: pós-jogo usa R482 existente sem nova aba ou escrita.');
