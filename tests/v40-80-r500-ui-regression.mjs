import assert from 'node:assert/strict';
import fs from 'node:fs';

const path = 'src/modules/tactical-director/TacticalDirectorPanelR500.tsx';
assert.ok(fs.existsSync(path), 'painel R500 precisa existir');
const source = fs.readFileSync(path, 'utf8');

assert.match(source, /TacticalDirectorPlanR500/);
assert.match(source, /planConfidence/);
assert.match(source, /evidenceConfidence/);
assert.match(source, /executionConfidence/);
assert.match(source, /priorit/i);
assert.match(source, /risco/i);
assert.match(source, /contingenc|cen[aá]rio/i);
assert.match(source, /<details|details>/, 'detalhes avançados devem ficar recolhidos por padrão');
assert.match(source, /Pro Meta|PRO META/);

for (const forbidden of [
  /fetch\s*\(/,
  /localStorage/,
  /sessionStorage/,
  /onApply/,
  /onSave/,
  /onPromote/,
  /onFormationChange/,
  /setTraining/,
  /setResult/,
  /upsert/i
]) {
  assert.doesNotMatch(source, forbidden, `painel R500 deve ser read-only: ${forbidden}`);
}
assert.doesNotMatch(source, /buildTacticalTwinR480|buildSquadBrainR481|buildChemistryGraphR484|buildMatchVisionR482/, 'painel só consome plano pronto');

console.log('R500 UI aprovada: painel compacto, explicável e read-only.');
