import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const strictEnv = process.argv.includes('--strict-env');
const failures = [];
const warnings = [];
const passes = [];
const read = (file) => fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : '';
const check = (condition, label) => condition ? passes.push(label) : failures.push(label);
const warn = (condition, label) => { if (!condition) warnings.push(label); };

const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const version = String(pkg.version || '').trim();
const notesPath = `play-store/listing/pt-BR/release-notes/${version}.txt`;
const direct = read('.github/workflows/build-apk.yml');
const play = read('.github/workflows/build-play-store.yml');
const directR182 = read('scripts/check-android-release-readiness-r182.mjs');
const backgroundInstaller = read('scripts/install-background-ocr-plugin.mjs');

check(/^\d+\.\d+\.\d+$/.test(version), 'package.json usa SemVer X.Y.Z');
check(read(notesPath).trim().length > 0, `release notes ${version} existem`);
check(!play.includes('40.70.0'), 'Play não fixa 40.70.0');
check(!play.includes('buildmaster-play-v40-30-'), 'Play não usa rótulo histórico v40-30');
check(play.includes('RELEASE_NOTES_FILE="play-store/listing/pt-BR/release-notes/${VERSION}.txt"'), 'Play deriva release notes da versão corrente');
check(play.includes('PLAY_RELEASE_NOTES_FILE=$RELEASE_NOTES_FILE'), 'Play propaga release notes dinamicamente');
check(play.includes('buildmaster-play-${{ env.BUILDMASTER_VERSION }}-${{ env.ANDROID_VERSION_CODE }}'), 'artefato Play usa versão/versionCode dinâmicos');
check(play.includes('npm run apk:preflight-native'), 'Play executa preflight nativo');
check(direct.includes('npm run apk:preflight-native'), 'APK direto executa preflight nativo');
check(direct.includes('node scripts/install-background-ocr-plugin.mjs'), 'APK direto instala proteção OCR foreground');
check(!play.includes('node scripts/install-background-ocr-plugin.mjs'), 'Play não instala foreground OCR sensível sem política específica');
check(play.includes('canal Play permanece sem BuildMasterBackgroundOcr/FOREGROUND_SERVICE_DATA_SYNC'), 'diferença de canal Play está documentada');
check(direct.includes('FOREGROUND_SERVICE_DATA_SYNC') && direct.includes('BuildMasterBackgroundOcrService'), 'APK direto valida permissão e serviço OCR');
check(backgroundInstaller.includes("if (!manifest.includes('android.permission.FOREGROUND_SERVICE_DATA_SYNC'))"), 'instalador OCR garante DATA_SYNC independentemente da ordem');
check(backgroundInstaller.includes("if (!manifest.includes('android.permission.POST_NOTIFICATIONS'))"), 'instalador OCR garante notificações independentemente');
check(directR182.includes('plugin OCR é instalado antes do cap sync'), 'doctor R182 direto continua preservado');

const cap = ['@capacitor/core', '@capacitor/android', '@capacitor/cli'];
const locked = cap.map((name) => lock.packages?.[`node_modules/${name}`]?.version).filter(Boolean);
check(locked.length === 3 && new Set(locked).size === 1, 'Capacitor core/android/cli sincronizados no lockfile');

const command = (cmd, args=['--version']) => {
  const result = spawnSync(cmd, args, { encoding: 'utf8' });
  return { ok: result.status === 0, text: `${result.stdout || ''}\n${result.stderr || ''}`.trim() };
};
const java = command('java', ['-version']);
const javaMajor = Number((java.text.match(/version\s+"(\d+)/) || [])[1] || 0);
const sdkmanager = command('sdkmanager');
const adb = command('adb');
const sdkEnv = Boolean(String(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '').trim());
const deps = fs.existsSync(path.join(root, 'node_modules/@capacitor/cli/package.json'));

if (strictEnv) {
  check(java.ok && javaMajor >= 21, 'Java 21+ disponível');
  check(sdkEnv, 'ANDROID_HOME/ANDROID_SDK_ROOT configurado');
  check(sdkmanager.ok, 'sdkmanager disponível');
  check(adb.ok, 'adb disponível');
  check(deps, 'Capacitor instalado');
} else {
  warn(java.ok && javaMajor >= 21, 'Java 21+ indisponível localmente');
  warn(sdkEnv, 'Android SDK não configurado localmente');
  warn(sdkmanager.ok, 'sdkmanager indisponível localmente');
  warn(adb.ok, 'adb indisponível localmente');
  warn(deps, 'node_modules/Capacitor indisponível localmente');
}

if (failures.length) {
  console.error(`R183 release convergence REPROVADA (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`R183 release convergence aprovada: ${passes.length} contratos${strictEnv ? ' + ambiente nativo' : ''}.`);
if (warnings.length) console.log(`Avisos de ambiente (${warnings.length}):\n- ${warnings.join('\n- ')}`);
