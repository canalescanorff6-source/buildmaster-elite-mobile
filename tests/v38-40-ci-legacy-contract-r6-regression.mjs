import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');
const adaptiveZones=read('src/modules/card-reader/adaptiveZoneSearch.ts');
const manualReader=read('src/modules/card-reader/manualCalibrationFastReader.ts');
const adaptivePosition=read('src/lib/adaptivePositionEngineV3930.ts');
const app=read('src/components/CardVisionApp.tsx');
const pkg=JSON.parse(read('package.json'));

assert.match(adaptiveZones,/if \(mode === 'fast'\)[\s\S]*?return variants;/);
assert.doesNotMatch(adaptiveZones,/if \(mode === 'fast'\)[\s\S]*?name-tight[\s\S]*?return variants;/);
assert.match(manualReader,/const retryNeeded = !reading\.text\.trim\(\) \|\| reading\.confidence < \(plan\.id === 'identity' \? 72 : 58\)/);
assert.match(manualReader,/targetedRetry/);
assert.match(adaptivePosition,/const coreSlots = 3/);
assert.match(adaptivePosition,/Três habilidades centrais da identidade foram preservadas/);
assert.match(app,/Perfis manuais antigos são migrados para o reconhecimento automático da carta/);
for (const script of ['test:v3140','test:v3510','test:v3837','test:v3920']) assert.ok(pkg.scripts?.[script]);
console.log('✓ r6: compatibilidade das regressões v31.40, v35.10, v38.37 e v39.20 protegida sem reabrir OCR pesado.');
