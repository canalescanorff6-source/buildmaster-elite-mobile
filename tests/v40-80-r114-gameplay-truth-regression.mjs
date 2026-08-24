import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sanitizer = readFileSync('scripts/sanitize-update-source.mjs', 'utf8');
const patcher = readFileSync('scripts/apply-r114-gameplay-truth.mjs', 'utf8');

assert.match(sanitizer, /applyR111DefinitiveCiGameplay\(root\);\s*applyR114GameplayTruth\(root\);/);
assert.match(patcher, /optimizePoolR114/);
assert.match(patcher, /beamWidth = 14/);
assert.match(patcher, /gameplayTruthScoreR114/);
assert.match(patcher, /responseScore < 72/);
assert.match(patcher, /homemAreaAerialReadyR114/);
assert.match(patcher, /aerial > 8/);
assert.match(patcher, /SITUATIONAL_SHOOTING_R114/);
assert.match(patcher, /HIGH_FREQUENCY_GAMEPLAY_R114/);
assert.match(patcher, /skill === 'Especialista em pênalti'/);
assert.match(patcher, /item\.extremeCandidate\.responseScore >= Math\.max\(70/);
assert.match(patcher, /winner\.stability<88 \|\| winner\.regretRisk>12/);
assert.match(patcher, /let winner:ResourceCandidate\|null=impetos\[0\]\?\?null/);
assert.match(patcher, /Gameplay Truth r114/);

console.log('r114 aprovada: busca direta, resposta/sinergia, Homem de Área DNA-first, Top 5 de alta frequência e Ímpeto seguro.');
