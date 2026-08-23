import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sanitizer = readFileSync('scripts/sanitize-update-source.mjs', 'utf8');
const patcher = readFileSync('scripts/apply-r111-definitive-ci-gameplay.mjs', 'utf8');

assert.match(sanitizer, /applyR109ExtremeCompat\(root\);\s*applyR111DefinitiveCiGameplay\(root\);/);
assert.match(patcher, /repairTechnicalDnaPlanR111/);
assert.match(patcher, /technicalInvestment < creationInvestment/);
assert.match(patcher, /preservesPermanentCardDNA\(result, candidate\)/);
assert.match(patcher, /sem perseguir overall; o overall exibido não participa da distribuição dos pontos/);
assert.match(patcher, /BM_R111_MASTER_DNA_GUARDS/);
assert.match(patcher, /BM_R111_FINAL_ANTI_OVERALL/);

console.log('r111 estática aprovada: DNA técnico, anti-overall e Motor Mestre protegidos de forma permanente.');
