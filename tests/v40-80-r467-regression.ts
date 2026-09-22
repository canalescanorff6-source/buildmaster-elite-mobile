import assert from 'node:assert/strict'; import fs from 'node:fs';
const clean=fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts','utf8');
assert.match(clean,/suppressHistoricalR467/); assert.match(clean,/CONVERGED/); assert.match(clean,/EXPERIMENTING/); assert.match(clean,/CONFLICT/);
console.log('R467 aprovado: arbitragem impede R136 de reabrir pressão em estados estabilizados/experimentais.');
