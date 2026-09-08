import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const strictEnv = process.argv.includes('--strict-env');
const failures = [];
const warnings = [];
const checks = [];

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function check(condition, label) {
  checks.push({ label, ok: Boolean(condition) });
  if (!condition) failures.push(label);
}

function warn(condition, label) {
  if (!condition) warnings.push(label);
}

const pkg = JSON.parse(read('package.json'));
const capacitor = read('capacitor.config.ts');
const nextConfig = read('next.config.mjs');
const staticBuilder = read('scripts/build-static.mjs');
const directWorkflow = read('.github/workflows/build-apk.yml');
const playWorkflow = read('.github/workflows/build-play-store.yml');
const backgroundInstaller = read('scripts/install-background-ocr-plugin.mjs');
const securityInstaller = read('scripts/install-android-security-plugin.mjs');
const brandingInstaller = read('scripts/install-android-branding.mjs');
const vendorOcr = read('scripts/vendor-tesseract-assets.mjs');

check(pkg.dependencies?.['@capacitor/core'] === '^7.4.4', 'Capacitor Core 7.4.4 declarado');
check(pkg.dependencies?.['@capacitor/android'] === '^7.4.4', 'Capacitor Android 7.4.4 declarado');
check(pkg.devDependencies?.['@capacitor/cli'] === '^7.4.4', 'Capacitor CLI 7.4.4 declarado');
check(pkg.scripts?.['apk:build-web'] === 'node scripts/build-static.mjs', 'script apk:build-web usa build estático controlado');
check(pkg.scripts?.['apk:add-android'] === 'npx cap add android', 'script apk:add-android presente');
check(pkg.scripts?.['apk:sync'] === 'npx cap sync android', 'script apk:sync presente');

check(/appId:\s*'com\.buildmaster\.elitetatico'/.test(capacitor), 'appId Android canônico');
check(/webDir:\s*'out'/.test(capacitor), 'Capacitor usa webDir out');
check(/allowMixedContent:\s*false/.test(capacitor), 'mixed content bloqueado');
check(/webContentsDebuggingEnabled:\s*false/.test(capacitor), 'debug do WebView desligado em produção');
check(/loggingBehavior:\s*'production'/.test(capacitor), 'logging Android em modo produção');
check(/androidScheme:\s*'https'/.test(capacitor), 'scheme Android HTTPS');

check(/BUILDMASTER_ANDROID_STATIC/.test(nextConfig) && /output:\s*'export'/.test(nextConfig), 'Next export estático condicionado ao APK');
check(/BUILDMASTER_ANDROID_STATIC:\s*'1'/.test(staticBuilder), 'builder Android ativa export estático');
check(/src\/app\/api/.test(staticBuilder) && /middleware\.ts/.test(staticBuilder), 'builder remove superfícies server-only durante export');

for (const marker of [
  'npm run vendor:ocr',
  'npm run apk:build-web',
  'npx --no-install cap add android',
  'node scripts/install-android-security-plugin.mjs',
  'node scripts/install-match-recorder-plugin.mjs',
  'node scripts/install-native-vault-storage-plugin.mjs',
  'node scripts/install-background-ocr-plugin.mjs',
  'node scripts/install-android-branding.mjs',
  'npx --no-install cap sync android',
  ':app:compileReleaseJavaWithJavac',
  'assembleRelease',
  'apksigner',
  "package: name='com.buildmaster.elitetatico'",
]) check(directWorkflow.includes(marker), `workflow APK direto contém ${marker}`);

check(directWorkflow.indexOf('install-background-ocr-plugin.mjs') < directWorkflow.indexOf('cap sync android'), 'plugin OCR é instalado antes do cap sync');
check(directWorkflow.includes('FOREGROUND_SERVICE_DATA_SYNC'), 'workflow direto valida permissão dataSync do OCR');
check(directWorkflow.includes('BuildMasterBackgroundOcrService'), 'workflow direto valida serviço OCR');

check(!playWorkflow.includes('node scripts/install-background-ocr-plugin.mjs'), 'AAB Play não instala foreground OCR direto sem declaração de política');
check(playWorkflow.includes('BuildMasterBackgroundOcr é exclusivo do APK direto por enquanto'), 'workflow Play documenta diferença de foreground OCR');
check(playWorkflow.includes('targetSdkVersion = 36'), 'AAB Play fixa targetSdk 36');
check(playWorkflow.includes('bundleRelease'), 'AAB Play usa bundleRelease');

check(backgroundInstaller.includes("if (!manifest.includes('android.permission.FOREGROUND_SERVICE'))"), 'instalador OCR garante FOREGROUND_SERVICE independentemente');
check(backgroundInstaller.includes("if (!manifest.includes('android.permission.FOREGROUND_SERVICE_DATA_SYNC'))"), 'instalador OCR garante FOREGROUND_SERVICE_DATA_SYNC independentemente');
check(backgroundInstaller.includes("if (!manifest.includes('android.permission.POST_NOTIFICATIONS'))"), 'instalador OCR declara notificações quando necessário');
check(backgroundInstaller.includes('android:foregroundServiceType="dataSync"'), 'serviço OCR declara foreground type dataSync no APK direto');
check(backgroundInstaller.includes('registerPlugin(BuildMasterBackgroundOcrPlugin.class);'), 'plugin OCR registra no MainActivity');

check(securityInstaller.includes('android:allowBackup="false"'), 'APK bloqueia backup Android do estado privado');
check(securityInstaller.includes('android:usesCleartextTraffic="false"'), 'APK bloqueia tráfego cleartext');
check(securityInstaller.includes('android.permission.INTERNET'), 'APK declara INTERNET');
check(securityInstaller.includes('android.permission.ACCESS_NETWORK_STATE'), 'APK declara ACCESS_NETWORK_STATE');
check(securityInstaller.includes('AndroidKeyStore'), 'plugin de segurança usa Android Keystore');

check(brandingInstaller.includes('mipmap-anydpi-v33/ic_launcher.xml'), 'branding Android inclui ícone adaptativo API moderna');
check(brandingInstaller.includes('buildmaster_native_splash'), 'branding Android inclui splash nativa');

check(vendorOcr.includes('4.0.0_best_int'), 'OCR Android usa traineddata português BEST');
check(vendorOcr.includes('public/tesseract/lang/por.traineddata'), 'traineddata português entra descompactado no APK');
check(directWorkflow.includes('out/tesseract/worker.min.js'), 'workflow valida worker OCR empacotado');
check(directWorkflow.includes('out/tesseract/lang/por.traineddata'), 'workflow valida idioma OCR empacotado');

const major = Number(process.versions.node.split('.')[0]);
const minor = Number(process.versions.node.split('.')[1]);
const nodeOk = major > 22 || (major === 22 && minor >= 16);
warn(nodeOk && major < 25, `Node local incompatível: ${process.versions.node}; esperado >=22.16 <25`);

const java = spawnSync('java', ['-version'], { encoding: 'utf8' });
const javaText = `${java.stdout ?? ''}${java.stderr ?? ''}`;
const javaOk = java.status === 0 && /version\s+"(?:2[1-9]|[3-9]\d)/.test(javaText);
warn(javaOk, 'Java 21+ não disponível localmente');

const depsOk = [
  'node_modules/@capacitor/cli/package.json',
  'node_modules/@capacitor/android/package.json',
  'node_modules/next/package.json',
  'node_modules/next/dist/bin/next',
].every((relative) => fs.existsSync(path.join(root, relative)));
warn(depsOk, 'dependências npm ainda não estão instaladas localmente');

const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
const sdkOk = Boolean(androidHome) && fs.existsSync(androidHome);
warn(sdkOk, 'Android SDK local não configurado (ANDROID_HOME/ANDROID_SDK_ROOT)');

if (strictEnv) {
  if (!nodeOk || major >= 25) failures.push('Node local compatível com .node-version/engines');
  if (!javaOk) failures.push('Java 21+ local');
  if (!depsOk) failures.push('dependências npm instaladas');
  if (!sdkOk) failures.push('Android SDK local configurado');
}

if (failures.length) {
  console.error('Prontidão Android R182 REPROVADA:');
  for (const item of failures) console.error(`- ${item}`);
  if (warnings.length) {
    console.error('Avisos de ambiente:');
    for (const item of warnings) console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log(`Prontidão Android R182 aprovada: ${checks.length} contratos de fonte/workflow.`);
if (warnings.length) {
  console.log('Ambiente local não está completo para gerar APK:');
  for (const item of warnings) console.log(`- ${item}`);
} else {
  console.log('Ambiente local também está pronto para build Android estrito.');
}
