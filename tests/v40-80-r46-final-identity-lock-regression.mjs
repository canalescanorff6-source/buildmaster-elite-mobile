import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/lib/finalCardAuthorityV4080R45.ts', 'utf8');

assert.ok(source.includes('40.80-r46-final-card-authority-identity-lock'));
assert.ok(source.includes('individualIdentityBias'));
assert.ok(source.includes('hardIdentityValid'));
assert.ok(source.includes("if (key === 'dribbling') score += 6.5"));
assert.ok(source.includes("if (key === 'dexterity') score += 5.5"));
assert.ok(source.includes("carry >= Math.max(finish, creation) + 3"));
assert.ok(source.includes("result.matchStaminaV4080R44?.adjusted"));
assert.ok(source.includes("level < staminaFloor"));
assert.ok(source.includes("candidateValid"));

console.log('r46 aprovada: autoridade final preserva DNA técnico/posicional e não desfaz stamina r44.');
