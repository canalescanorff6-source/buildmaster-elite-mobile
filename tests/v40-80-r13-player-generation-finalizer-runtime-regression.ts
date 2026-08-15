import assert from 'node:assert/strict';
import { buildPlayerGenerationFinalizerV4080R13 } from '../src/lib/playerGenerationFinalizerV4080R13';

const base = {
  objective: 'COMPETITIVE',
  training: { shooting:0, passing:0, dribbling:0, dexterity:0, lowerBodyStrength:0, aerialStrength:0, defending:0, gk1:0, gk2:0, gk3:0 },
  parsed: {
    confidence: 94,
    trainingPointsTotal: 0,
    evidence: { attributeCount: 22 },
    nativeSkills: ['Passe de primeira'], additionalSkills: [], specialSkills: []
  },
  bestPosition: { code: 'AMF', label: 'MAT' },
  cardDna: { identityLabel: 'Criador técnico' },
  recommendedSkills: ['Toque duplo','Passe de primeira','Passe em profundidade','Controle com a sola','Espírito guerreiro'],
  gameplayMetaV600R10: {
    scores: { metaReadiness: 91, fluidCompatibility: 86, shortPassing: 93, ballCarry: 90, tikiTaka: 92, manualDefence: 76 },
    formation: { recommendation: 'FLUIDA_COMPLETA' }
  },
  liveEvolutionV600R11: { catalog: { unknownFields: [] } }
} as any;

const ready = buildPlayerGenerationFinalizerV4080R13(base);
assert.equal(ready.status, 'PRONTA');
assert.equal(ready.readyForUse, true);
assert.equal(ready.readyForSale, true);
assert.equal(ready.recommendedMode, 'FLUIDA_COMPLETA');

const weak = buildPlayerGenerationFinalizerV4080R13({
  ...base,
  parsed: { ...base.parsed, confidence: 49, evidence: { attributeCount: 5 } },
  recommendedSkills: ['Toque duplo','Toque duplo']
} as any);
assert.equal(weak.status, 'REVISAR_LEITURA');
assert.equal(weak.readyForUse, false);
assert.ok(weak.blockers.length >= 2);
assert.ok(weak.cautions.some((item:string) => item.includes('Top adicional')));

console.log(`Gerador Final r13 aprovado: leitura forte ${Math.round(ready.confidence)}/100 PRONTA; leitura fraca bloqueada com ${weak.blockers.length} bloqueios.`);
