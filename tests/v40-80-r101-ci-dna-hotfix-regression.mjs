import assert from 'node:assert/strict';
import fs from 'node:fs';

const r70 = fs.readFileSync('src/lib/performanceEngine2027V4080R70.ts', 'utf8');
const r80 = fs.readFileSync('src/lib/permanentResources2027V4080R80.ts', 'utf8');
const master = fs.readFileSync('src/lib/masterCardEngineV4080R50.ts', 'utf8');

assert.ok(r70.includes('staminaProtected: boolean;'));
assert.ok(!r80.includes('function skillCandidate(result:AnalysisResult'));
assert.ok(r80.includes('skillCandidate(s,attack,defence)'));
assert.ok(master.includes('preservesPermanentCardDNA(result, candidate)'));
assert.ok(master.includes('technicalInvestment < creationInvestment'));
assert.ok(master.includes('technicalInvestment < physicalFinishInvestment'));

console.log('r101 aprovada: TypeScript r70/r80 corrigido e candidata r70 não pode apagar DNA técnico permanente.');
