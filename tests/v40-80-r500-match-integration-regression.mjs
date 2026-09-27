import assert from 'node:assert/strict';
import fs from 'node:fs';

const bridge = fs.readFileSync('src/modules/explainable-ai/MatchExplainabilityR489.tsx', 'utf8');
const trainer = fs.readFileSync('src/modules/matches/MatchTrainerCenter.tsx', 'utf8');

assert.match(trainer, /MatchExplainabilityR489/);
assert.match(bridge, /buildAutonomousTacticalDirectorR500/);
assert.match(bridge, /TacticalDirectorPanelR500/);
assert.match(bridge, /POST_MATCH/);
assert.match(bridge, /matchVision/);
assert.doesNotMatch(bridge, /onApply|onSave|onPromote|confirmMarker|upsertMatchTrainerSession|fetch\(/);

console.log('R500 Match Trainer aprovado: auditoria pós-jogo integrada pela ponte R489 sem escrita.');
