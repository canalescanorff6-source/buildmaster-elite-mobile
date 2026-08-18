import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine = fs.readFileSync('src/lib/individualIdentityEngineV4080R39.ts','utf8');
const pipeline = fs.readFileSync('src/lib/cardIntelligencePipeline.ts','utf8');

for (const marker of [
  'INDIVIDUAL_IDENTITY_ENGINE_V4080_R39',
  'identitySignals',
  'candidateScore',
  'reconstruct(result',
  'Mesma posição e mesmo estilo só podem resultar em ficha idêntica',
  'POSITION_ROLE',
  'styleWeight'
]) assert.ok(engine.includes(marker), `r39 sem ${marker}`);

assert.ok(pipeline.includes("applyIndividualIdentityEngineV4080R39"));
assert.ok(
  pipeline.indexOf('applyProMatchOptimizerV4080R30(current)') <
  pipeline.indexOf('applyIndividualIdentityEngineV4080R39(current)')
);
assert.ok(
  pipeline.indexOf('applyIndividualIdentityEngineV4080R39(current)') <
  pipeline.indexOf('applyDefinitiveAdditionalSkillsV600R15(current)')
);

console.log('r39 aprovada: identidade individual global após benchmark e antes de habilidades/Ímpeto.');
