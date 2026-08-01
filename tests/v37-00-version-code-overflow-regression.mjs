import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

assert.match(workflow, /direct_epoch = 2_110_100_000/);
assert.match(workflow, /android_version_code_max = 2_147_483_647/);
assert.match(workflow, /version_code = max\(direct_epoch \+ run \* 10 \+ attempt, max_published_code \+ 1\)/);
assert.match(workflow, /versionCode \{code\} fora do intervalo aceito pelo Android/);
assert.doesNotMatch(workflow, /major \* 60_000_000 \+ minor \* 500_000/);

const lastPublishedLegacyCode = 2_110_001_431;
const simulatedRunNumber = 145;
const simulatedAttempt = 1;
const fixedCode = Math.max(
  2_110_100_000 + simulatedRunNumber * 10 + simulatedAttempt,
  lastPublishedLegacyCode + 1,
);

assert.ok(fixedCode > lastPublishedLegacyCode);
assert.ok(fixedCode <= 2_147_483_647);
assert.ok(37 * 60_000_000 > 2_147_483_647, 'A fórmula antiga precisa continuar detectada como overflow para v37.');

console.log('v37.00 versionCode monotônico aprovado sem overflow do inteiro Android.');
