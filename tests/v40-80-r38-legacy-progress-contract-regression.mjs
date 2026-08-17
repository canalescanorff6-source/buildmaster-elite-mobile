import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const v4010 = read('tests/v40-10-progress-experience-regression.mjs');
const v4020 = read('tests/v40-20-progress-experience-regression.mjs');

assert.ok(v4010.includes("'Ficha gerada'"));
assert.ok(!v4010.includes("'Preparando revisão'"));
assert.ok(v4010.includes("endsWith('npm run test:v4080')"));
assert.ok(v4020.includes("endsWith('npm run test:v4080')"));
assert.ok(!v4010.includes("endsWith('npm run test:v4070')"));
assert.ok(!v4020.includes("endsWith('npm run test:v4070')"));

console.log('r38 aprovada: regressões v40.10/v40.20 alinhadas ao fluxo e bateria atuais da v40.80.');
