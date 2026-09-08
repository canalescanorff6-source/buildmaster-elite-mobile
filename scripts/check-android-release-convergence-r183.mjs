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
const securityInstaller = read('scripts/install-android-security-plugin.mjs');
const playValidator = read('scripts/validate-play-store-release.mjs');

check(/^\d+\.\d+\.\d+$/.test(version), 'package.json usa SemVer X.Y.Z');
check(read(notesPath).trim().length > 0, `release notes ${version} existem`);
warn(!play.includes('40.70.0'), 'Workflow Play protegido ainda contém hardcode histórico 40.70.0; atualizar .github/workflows manualmente antes de publicar na Play.');
warn(!play.includes('buildmaster-play-v40-30-'), 'Workflow Play protegido ainda usa rótulo histórico v40-30.');
check(playValidator.includes('release-notes/${packageVersion}.txt'), 'Pré-voo Play deriva release notes da versão corrente independentemente do workflow protegido');
check(direct.includes('node scripts/install-android-security-plugin.mjs'), 'APK direto executa instalador Android de segurança');
check(direct.indexOf('install-android-security-plugin.mjs') < direct.indexOf('cap sync android'), 'Instalador Android direto roda antes do cap sync');
check(securityInstaller.includes("NEXT_PUBLIC_BUILDMASTER_DISTRIBUTION || 'direct'"), 'Instalador assume canal direto em workflow legado');
check(securityInstaller.includes("distribution !== 'play'") && securityInstaller.includes('install-background-ocr-plugin.mjs'), 'Instalador Android delega proteção OCR somente fora do Play');
check(play.includes('NEXT_PUBLIC_BUILDMASTER_DISTRIBUTION: play'), 'Play identifica distribuição conservadora');
check(!play.includes('node scripts/install-background-ocr-plugin.mjs'), 'Play não instala foreground OCR sensível diretamente');
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
