import assert from 'node:assert/strict';
import fs from 'node:fs';

const canonical = fs.readFileSync('src/lib/canonicalCardIdentity2027V4080R60.ts','utf8');
const foundation = fs.readFileSync('src/lib/performanceFoundation2027V4080R60.ts','utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');
const master = fs.readFileSync('src/lib/masterCardEngineV4080R50.ts','utf8');

for (const contract of [
  '40.80-r60-canonical-card-identity-2027',
  'rareResourceLock: \'PERMANENT_BY_CARD\'',
  'physicalFingerprint',
  'positionCompatibility',
  'identityConfidence',
  "defencePositionSource: explicitDefence ? 'EXPLICIT' : 'FALLBACK_SELECTED'"
]) assert.ok(canonical.includes(contract), `r60 identidade sem contrato: ${contract}`);

for (const guard of [
  'masterEngineOnlyTrainingWriter: true',
  'unknownContentNeverGetsInventedWeight: true',
  'rareResourcesPersistAcrossCompatiblePositions: true',
  'overallIsNotOptimizationTarget: true',
  'incompleteDualPhaseDoesNotInventDefence: true'
]) assert.ok(foundation.includes(guard), `r60 fundação sem guarda: ${guard}`);

assert.ok(pipeline.indexOf('applyCanonicalCardIdentity2027R60(current)') < pipeline.indexOf('applyPerformanceFoundation2027R60(current)'));
assert.ok(pipeline.indexOf('applyPerformanceFoundation2027R60(current)') < pipeline.indexOf('applyMasterCardEngineV4080R50(current)'));
assert.ok(master.includes('canonicalIdentity(result)?.attackPosition'));
assert.ok(master.includes('canonicalIdentity(result)?.defencePosition'));
assert.ok(!canonical.includes('training ='));
assert.ok(!foundation.includes('training ='));

console.log('r60 aprovada: identidade canônica + duas fases + catálogo seguro alimentam o Motor Mestre sem criar outro escritor de ficha.');
