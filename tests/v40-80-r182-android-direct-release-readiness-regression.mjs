import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const direct = read('.github/workflows/build-apk.yml');
const play = read('.github/workflows/build-play-store.yml');
const securityInstaller = read('scripts/install-android-security-plugin.mjs');
const installer = read('scripts/install-background-ocr-plugin.mjs');
const nativeCheck = read('scripts/check-generated-native-java.mjs');
const readiness = read('scripts/check-android-release-readiness-r182.mjs');
const android10 = read('tests/v40-10-android-ocr-bootstrap-hotfix-regression.mjs');
const android20 = read('tests/v40-20-android-ocr-bootstrap-hotfix-regression.mjs');

assert.match(direct, /node scripts\/install-android-security-plugin\.mjs/, 'APK direto deve executar o instalador Android de segurança.');
assert.ok(direct.indexOf('install-android-security-plugin.mjs') < direct.indexOf('cap sync android'), 'Instalador de segurança deve rodar antes do cap sync.');
assert.match(securityInstaller, /NEXT_PUBLIC_BUILDMASTER_DISTRIBUTION \|\| 'direct'/, 'Instalador deve assumir canal direto quando o workflow legado não informa distribuição.');
assert.match(securityInstaller, /distribution !== 'play'/, 'Foreground OCR deve ser bloqueado no canal Play.');
assert.match(securityInstaller, /install-background-ocr-plugin\.mjs/, 'Canal direto deve delegar automaticamente para a proteção OCR R182.');
assert.match(play, /NEXT_PUBLIC_BUILDMASTER_DISTRIBUTION:\s*play/, 'Workflow Play deve identificar explicitamente a distribuição conservadora.');
assert.doesNotMatch(play, /node scripts\/install-background-ocr-plugin\.mjs/, 'AAB Play não deve instalar foreground OCR diretamente.');

assert.match(installer, /if \(!manifest\.includes\('android\.permission\.FOREGROUND_SERVICE'\)\)/, 'Permissão genérica deve ser garantida de forma independente.');
assert.match(installer, /if \(!manifest\.includes\('android\.permission\.FOREGROUND_SERVICE_DATA_SYNC'\)\)/, 'Permissão dataSync deve ser garantida mesmo quando outro plugin já adicionou FOREGROUND_SERVICE.');
assert.match(installer, /if \(!manifest\.includes\('android\.permission\.POST_NOTIFICATIONS'\)\)/, 'Instalador isolado deve declarar notificações.');
assert.match(installer, /android:foregroundServiceType="dataSync"/, 'Serviço nativo deve declarar o tipo dataSync no canal direto.');

for (const marker of [
  'install-native-vault-storage-plugin.mjs',
  'BuildMasterVaultStoragePlugin.java',
  'BuildMasterBackgroundOcrPlugin.java',
  'BuildMasterBackgroundOcrService.java',
  'FOREGROUND_SERVICE_DATA_SYNC',
]) assert.match(nativeCheck, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Checker Java nativo deve cobrir ${marker}`);
assert.doesNotMatch(nativeCheck, /execFileSync\(process\.execPath, \[path\.join\(root, 'scripts\/install-background-ocr-plugin\.mjs'\)/, 'Checker deve provar que o instalador de segurança já entrega OCR sem segunda instalação manual.');

for (const source of [android10, android20]) {
  assert.match(source, /readerInteractionRuntimeR164\.ts/, 'Pré-aquecimento OCR deve ser verificado na autoridade R164.');
  assert.match(source, /readerAnalysisRuntimeR163\.ts/, 'Progresso/status OCR deve ser verificado na autoridade R163.');
  assert.doesNotMatch(source, /const app = read\('src\/components\/CardVisionApp\.tsx'\)/, 'Regressão Android não deve voltar a prender OCR ao shell CardVision.');
}

assert.match(readiness, /--strict-env/, 'Doctor Android deve oferecer validação estrita do ambiente local.');
assert.match(readiness, /Android SDK local não configurado/, 'Doctor deve diagnosticar SDK ausente explicitamente.');
assert.match(readiness, /dependências npm ainda não estão instaladas/, 'Doctor deve diagnosticar dependências ausentes explicitamente.');

assert.equal(pkg.scripts['apk:readiness'], 'node scripts/check-android-release-readiness-r182.mjs');
assert.equal(pkg.scripts['test:r182'], 'node tests/v40-80-r182-android-direct-release-readiness-regression.mjs && npm run quality:native-java && npm run apk:readiness');
assert.match(pkg.scripts['test:v4080'] ?? '', /npm run test:r180 && npm run test:r181 && npm run test:r182 && npm run test:r183/);
assert.match(pkg.scripts['test:all'] ?? '', /npm run test:v4080\s*$/);

console.log('R182 aprovada: APK direto herda proteção OCR pelo instalador Android; Play continua conservador; doctor distingue fonte de toolchain local.');
