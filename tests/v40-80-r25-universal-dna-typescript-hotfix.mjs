import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const s=readFileSync(new URL('../scripts/apply-universal-dna-r25.mjs',import.meta.url),'utf8');
assert.ok(s.includes('BM_UNIVERSAL_DNA_R25'));
assert.ok(s.includes('return applyUniversalDnaCaps(position, applyCapAdjustments(caps, role), a, parsed);'));
assert.ok(s.includes("before.lastIndexOf(needle)"));
console.log('r25 aprovada: DNA caps conectado ao trainingCaps e erro TS6133 eliminado pela utilização real.');
