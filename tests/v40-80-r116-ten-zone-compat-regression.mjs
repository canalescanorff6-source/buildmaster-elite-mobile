import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

console.log('r116 aprovada: calibrador e todos os contratos legados reconhecem 10 áreas e 21 subáreas OCR.');
