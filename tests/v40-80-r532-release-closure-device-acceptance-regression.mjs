import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const buildWf = fs.readFileSync('.github/workflows/build-apk.yml','utf8');
const acceptanceWfPath = '.github/workflows/device-acceptance-r532.yml';
const validatorPath = 'scripts/validate-device-acceptance-r532.mjs';
const templatePath = 'scripts/create-device-acceptance-template-r532.mjs';

assert.equal(pkg.scripts['validate:r532:device'], 'node scripts/validate-device-acceptance-r532.mjs');
assert.equal(pkg.scripts['acceptance:r532:template'], 'node scripts/create-device-acceptance-template-r532.mjs');
assert.equal(pkg.scripts['test:r532'], 'node tests/v40-80-r532-release-closure-device-acceptance-regression.mjs');
assert.ok(pkg.scripts['ci:gate'].includes('npm run test:r532'), 'ci:gate precisa proteger R532');

assert.ok(fs.existsSync(validatorPath), 'validator R532 precisa existir');
assert.ok(fs.existsSync(templatePath), 'gerador de template R532 precisa existir');
assert.ok(fs.existsSync(acceptanceWfPath), 'workflow separado de aceitação R532 precisa existir');
const validator = fs.readFileSync(validatorPath,'utf8');
const template = fs.readFileSync(templatePath,'utf8');
const acceptanceWf = fs.readFileSync(acceptanceWfPath,'utf8');

for (const contract of [
  'schemaVersion===2',
  "receipt?.appPackage==='com.buildmaster.elitetatico'",
  'receipt?.sourceSha===sourceSha',
  'receipt?.apkSha256===apkSha256',
  'Number(receipt?.versionCode)===versionCode',
  'receipt?.device?.physicalDevice===true',
  'Number(receipt?.cardsTested)>=10',
  'Number(receipt?.largeVaultCount)>=225',
  'r521AppShell', 'r522HomeDashboard', 'r523ReaderOcr', 'r524ResultFicha',
  'r525SkillsImpeto', 'r526Tactics', 'r527Vault', 'r528ExportShare',
  'r529AccountAdmin', 'r530FinalPolish', 'noCrashFullFlow'
]) assert.ok(validator.includes(contract), `contrato ausente no validator: ${contract}`);

for (const field of ['schemaVersion: 2','apkSha256','versionCode','r521AppShell','r530FinalPolish','noCrashFullFlow']) {
  assert.ok(template.includes(field), `template R532 não contém ${field}`);
}

assert.ok(buildWf.includes('Gerar template de aceitação física R532'), 'build precisa gerar template pós-APK');
assert.ok(buildWf.includes('device-acceptance-r532-template.json'), 'template precisa entrar nos artefatos de release');
assert.ok(buildWf.includes('MANIFESTO_PRODUCAO_V40.80.sha256'), 'release precisa anexar o manifesto de integridade atual');
assert.ok(!buildWf.includes('MANIFESTO_PRODUCAO_V34.00.sha256'), 'release não pode anexar manifesto de integridade obsoleto');
assert.ok(buildWf.includes("'sourceSha': os.environ['SOURCE_SHA']"), 'manifesto precisa expor sourceSha da release');

for (const contract of [
  'workflow_dispatch:', 'release_tag:', 'device_acceptance_json:',
  'gh release download', 'update-manifest-v*.json', 'ASSET_NAME',
  'sha256sum', 'npm run validate:r532:device', 'device-acceptance-r532-accepted.json'
]) assert.ok(acceptanceWf.includes(contract), `workflow R532 não contém ${contract}`);

console.log('R532 aprovada: closure valida recibo físico v2 contra a mesma release/APK e cobre R521-R530 sem criar autoridade funcional paralela.');
