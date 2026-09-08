import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const direct = read('.github/workflows/build-apk.yml');
const play = read('.github/workflows/build-play-store.yml');
const installer = read('scripts/install-background-ocr-plugin.mjs');
const nativeCheck = read('scripts/check-generated-native-java.mjs');
const readiness = read('scripts/check-android-release-readiness-r182.mjs');
const android10 = read('tests/v40-10-android-ocr-bootstrap-hotfix-regression.mjs');
const android20 = read('tests/v40-20-android-ocr-bootstrap-hotfix-regression.mjs');

assert.equal((direct.match(/node scripts\/install-background-ocr-plugin\.mjs/g) ?? []).length, 1, 'APK direto deve instalar exatamente uma vez o plugin OCR de foreground.');
assert.ok(direct.indexOf('install-background-ocr-plugin.mjs') < direct.indexOf('cap sync android'), 'Plugin OCR deve ser instalado antes do cap sync.');
assert.match(direct, /FOREGROUND_SERVICE_DATA_SYNC/, 'Workflow direto deve validar a permissão específica dataSync.');
assert.match(direct, /BuildMasterBackgroundOcrService/, 'Workflow direto deve validar o serviço OCR gerado.');

assert.doesNotMatch(play, /node scripts\/install-background-ocr-plugin\.mjs/, 'AAB Play não deve receber foreground OCR direto sem enquadramento de política específico.');
assert.match(play, /BuildMasterBackgroundOcr é exclusivo do APK direto por enquanto/, 'Diferença de canal deve estar documentada no workflow Play.');
assert.match(play, /targetSdkVersion = 36/, 'Play deve continuar fixando targetSdk 36.');

assert.match(installer, /if \(!manifest\.includes\('android\.permission\.FOREGROUND_SERVICE'\)\)/, 'Permissão genérica deve ser garantida de forma independente.');
assert.match(installer, /if \(!manifest\.includes\('android\.permission\.FOREGROUND_SERVICE_DATA_SYNC'\)\)/, 'Permissão dataSync deve ser garantida mesmo quando outro plugin já adicionou FOREGROUND_SERVICE.');
assert.match(installer, /if \(!manifest\.includes\('android\.permission\.POST_NOTIFICATIONS'\)\)/, 'Instalador isolado deve declarar notificações.');
assert.match(installer, /android:foregroundServiceType="dataSync"/, 'Serviço nativo deve declarar o tipo dataSync no canal direto.');

for (const marker of [
  'install-native-vault-storage-plugin.mjs',
  'install-background-ocr-plugin.mjs',
  'BuildMasterVaultStoragePlugin.java',
  'BuildMasterBackgroundOcrPlugin.java',
  'BuildMasterBackgroundOcrService.java',
  'FOREGROUND_SERVICE_DATA_SYNC',
]) assert.match(nativeCheck, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Checker Java nativo deve cobrir ${marker}`);

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

console.log('R182 aprovada: APK direto instala e valida proteção OCR nativa; Play mantém política conservadora; doctor Android distingue fonte de toolchain local.');
