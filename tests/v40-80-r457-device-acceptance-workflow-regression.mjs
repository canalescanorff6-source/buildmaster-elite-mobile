import assert from 'node:assert/strict';
import fs from 'node:fs';

const buildWorkflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const acceptanceWorkflow = fs.readFileSync('.github/workflows/device-acceptance-r532.yml', 'utf8');
const validator = fs.readFileSync('scripts/validate-device-acceptance-r532.mjs', 'utf8');

// R457 Stage 16 permanece válido como contrato histórico: o canal direto continua
// stable por padrão. A aceitação física embutida no build foi supersedida pelo
// gate pós-release R532, que valida o APK imutável exato em vez de um input opcional
// durante a compilação.
assert.ok(buildWorkflow.includes('default: stable'));
assert.ok(!/^\s*device_acceptance_json:/m.test(buildWorkflow));

assert.ok(acceptanceWorkflow.includes('name: Validar Aceitação Física R532'));
assert.ok(acceptanceWorkflow.includes('release_tag:'));
assert.ok(acceptanceWorkflow.includes('device_acceptance_json:'));
assert.ok(acceptanceWorkflow.includes('required: true'));
assert.ok(acceptanceWorkflow.includes('Checksum do APK diverge do manifesto.'));
assert.ok(acceptanceWorkflow.includes('Fixar validador no mesmo commit da release'));
assert.ok(acceptanceWorkflow.includes('git checkout --detach "$SOURCE_SHA"'));
assert.ok(acceptanceWorkflow.includes('run: npm run validate:r532:device'));

assert.ok(validator.includes('receipt?.sourceSha===sourceSha'));
assert.ok(validator.includes('receipt?.apkSha256===apkSha256'));
assert.ok(validator.includes('Number(receipt?.largeVaultCount)>=225'));
assert.ok(validator.includes('Number(receipt?.cardsTested)>=10'));
assert.ok(validator.includes('receipt?.device?.physicalDevice===true'));
assert.ok(validator.includes('zero56RegressionChecked'));
assert.ok(validator.includes('sameDecisionAfterReopen'));
assert.ok(validator.includes('noCrashFullFlow'));

console.log('R457 Stage 16 aprovada: stable direto preservado; R532 supersede o recibo embutido e valida pós-release o mesmo APK imutável, SHA, sourceSha e fluxo físico completo.');
