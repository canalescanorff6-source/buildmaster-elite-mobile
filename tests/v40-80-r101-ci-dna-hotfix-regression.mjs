import assert from 'node:assert/strict';
import fs from 'node:fs';

const r70 = fs.readFileSync('src/lib/performanceEngine2027V4080R70.ts', 'utf8');
const r80 = fs.readFileSync('src/lib/permanentResources2027V4080R80.ts', 'utf8');
const r108 = fs.readFileSync('src/lib/performanceEngine2027V4080R108.ts', 'utf8');
const master = fs.readFileSync('src/lib/masterCardEngineV4080R50.ts', 'utf8');

assert.ok(r70.includes('staminaProtected: boolean;'));
assert.ok(!r80.includes('function skillCandidate(result:AnalysisResult'));
assert.ok(r80.includes('skillCandidate(s,attack,defence)'));
assert.ok(r108.includes('repairTechnicalDnaPlanR111'));
assert.ok(r108.includes('technicalInvestment < creationInvestment'));
assert.ok(r108.includes('technicalInvestment < physicalFinishInvestment'));
assert.ok(r108.includes('BM_R111_R108_DNA_REPAIR'));
assert.ok(master.includes('BM_R118_MASTER_READ_ONLY'));

console.log('r101/r118 aprovada: guarda de DNA técnico vive na Card Signature r108; Motor Mestre permanece read-only.');
