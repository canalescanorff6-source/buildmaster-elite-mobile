import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sanitizer = readFileSync('scripts/sanitize-update-source.mjs', 'utf8');
const patcher = readFileSync('scripts/apply-r115-card-signature.mjs', 'utf8');

assert.match(sanitizer, /applyR114GameplayTruth\(root\);\s*applyR115CardSignature\(root\);/);
assert.match(patcher, /10\. Habilidade especial/);
assert.match(patcher, /safe\.length === 10/);
assert.match(patcher, /zoneKeys: \['skills', 'specialSkill'\]/);
assert.match(patcher, /sourceTextWithRawPasses\(readings, \['skills', 'specialSkill'\]\)/);
assert.match(patcher, /specialSkillActivationScoreR115/);
assert.match(patcher, /cardIdentityFitR115/);
assert.match(patcher, /curva descendente\|blitz curler/);
assert.match(patcher, /candidate\.responseScore \* \.27/);
assert.match(patcher, /specialSkillComplementR115/);
assert.match(patcher, /withSpecialImpetoSupportR115/);
assert.match(patcher, /posição\/estilo não podem gerar receita clonada/);
assert.doesNotMatch(patcher, /maxOverall/);
assert.doesNotMatch(patcher, /\.overall/);

console.log('r115 aprovada: 10º quadrado especial, assinatura individual, especial como suporte, Top5 e Ímpeto por carta.');
