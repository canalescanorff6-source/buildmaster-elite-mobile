import assert from 'node:assert/strict';
import fs from 'node:fs';

const panelPath = 'src/modules/tactical-director/TacticalDirectorPanelR500.tsx';
assert.ok(fs.existsSync(panelPath), 'painel R500 precisa existir');
const source = fs.readFileSync(panelPath, 'utf8');

assert.match(source, /TacticalDirectorPanelR500/);
assert.match(source, /Diretor Tático|Diretor Tatico/);
assert.match(source, /planConfidence|evidenceConfidence|executionConfidence/);
assert.match(source, /<details|compact/i);
assert.doesNotMatch(source, /onApply|onSave|onPromote|setTraining|setResult|upsert|localStorage|sessionStorage|fetch\(/);
assert.doesNotMatch(source, /canChangeLineupAutomatically\s*:\s*true|canWriteTraining\s*:\s*true/);

console.log('R500 UI aprovada: painel compacto, explicável e somente leitura.');
