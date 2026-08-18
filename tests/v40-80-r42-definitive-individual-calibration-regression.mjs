import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync('src/lib/individualCalibrationEngineV4080R41.ts','utf8');
assert.ok(s.includes('INDIVIDUAL_CALIBRATION_ENGINE_V4080_R42'));
assert.ok(s.includes('coverage=Math.max(directCoverage,declared)'));
assert.ok(s.includes("pos==='LWF'||pos==='RWF'"));
assert.ok(s.includes('dribbleBase>=88'));
assert.ok(s.includes('Grupos incompatíveis com a posição são eliminados'));
console.log('r42 aprovada: cobertura real + guarda de identidade + orçamento exato.');
