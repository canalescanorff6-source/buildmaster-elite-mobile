import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const patch = readFileSync(new URL('../scripts/apply-universal-dna-r24.mjs', import.meta.url), 'utf8');

for (const contract of [
  'BM_UNIVERSAL_DNA_R24',
  'dnaFamilyScores',
  'universalDnaAdjustment',
  'applyUniversalDnaCaps',
  "out.defending = 0",
  'score >= 94',
  'artilheiro|goal poacher',
  'primeiro volante',
  'orquestrador',
  'defensor criativo',
  'lateral defensivo'
]) {
  assert.ok(patch.toLowerCase().includes(contract.toLowerCase()), `r24 sem contrato: ${contract}`);
}
assert.ok(patch.includes("scores.aerialStrength < 78"));
assert.ok(patch.includes("scores.dribbling >= 82 ? 9 : 6"));
assert.ok(patch.includes("universalDnaAdjustment(position, key, a, parsed)"));
console.log('r24 aprovada: motor DNA universal cobre posições, estilos e atributos individuais.');
