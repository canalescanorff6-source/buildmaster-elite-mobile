import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transformV3181R116 } from '../scripts/apply-r116-ten-zone-compat.mjs';

const sanitizer = readFileSync('scripts/sanitize-update-source.mjs', 'utf8');
const patcher = readFileSync('scripts/apply-r116-ten-zone-compat.mjs', 'utf8');

assert.match(sanitizer, /applyR115CardSignature\(root\);\s*applyR116TenZoneCompat\(root\);/);
assert.match(patcher, /Arraste os 10 quadrados/);
assert.match(patcher, /Restaurar os 10 quadrados/);
assert.match(patcher, /geometry\.zones\.length, 21/);
assert.match(patcher, /canonicalMacro\.length, 10/);
assert.match(patcher, /EFHUB_CANONICAL_MACRO_BOXES\.length, 10/);
assert.match(patcher, /defaults\.length, 10/);
assert.match(patcher, /ocr\.length, 21/);
assert.match(patcher, /specialSkill/);
assert.match(patcher, /r32 aprovada: regressões legadas alinhadas aos 10 quadrados/);


assert.match(patcher, /BM_R117_R116_IDEMPOTENT/);

const alreadyMigrated = `
assert.equal(defaults.length, 10);
assert.deepEqual(defaults.map((zone) => zone.shortLabel), [
  'Nome + estilo', 'Carta / foto', 'Bio + condição', 'Posições + overalls',
  'Boosters / ímpeto', '26 atributos', 'Modelo físico', 'Habilidades', 'Pontos distribuídos', 'Habilidade especial'
]);
assert.equal(ocr.length, 21, 'O mapa manual deve gerar as 21 subáreas internas do OCR, incluindo progressão e habilidade especial.');
assert.equal(skillZones.length, 7, 'Habilidades devem manter bloco, três linhas e três janelas.');
assert.equal(ocr.filter((zone) => zone.key === 'specialSkill').length, 1, 'A habilidade especial deve ter uma área OCR exclusiva.');
assert.equal(restored?.zones.length, 10);
assert.equal(malformed.length, 10);
`;

const twice = transformV3181R116(transformV3181R116(alreadyMigrated));
assert.equal(twice, transformV3181R116(alreadyMigrated), 'Aplicar a migração repetidamente precisa ser idempotente.');
assert.equal(
  (twice.match(/'Habilidade especial'/g) ?? []).length,
  1,
  'A lista visual não pode duplicar Habilidade especial quando sanitize:update-source roda mais de uma vez.'
);

const previouslyDuplicated = alreadyMigrated.replace(
  "'Pontos distribuídos', 'Habilidade especial'",
  "'Pontos distribuídos', 'Habilidade especial', 'Habilidade especial', 'Habilidade especial'"
);
const repaired = transformV3181R116(previouslyDuplicated);
assert.equal(
  (repaired.match(/'Habilidade especial'/g) ?? []).length,
  1,
  'A r117 também precisa reparar um arquivo já duplicado por execuções anteriores.'
);

console.log('r116/r117 aprovada: 10 áreas, 21 subáreas OCR e migração idempotente mesmo com sanitizer repetido.');
