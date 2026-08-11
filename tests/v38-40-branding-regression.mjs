import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import zlib from 'node:zlib';

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file) && fs.statSync(file).size > 0;

function pngSize(file) {
  const data = fs.readFileSync(file);
  assert.equal(data.toString('ascii', 1, 4), 'PNG', `${file} não é PNG`);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function assertCompletePng(file) {
  const data = fs.readFileSync(file);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(data.length >= 33 && data.subarray(0, 8).equals(signature), `${file} não possui assinatura PNG completa`);
  let offset = 8;
  let sawIhdr = false;
  let sawIend = false;
  const idat = [];
  while (offset < data.length) {
    assert.ok(offset + 12 <= data.length, `${file} termina no meio de um bloco PNG`);
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    assert.ok(end <= data.length, `${file} está truncado no bloco ${type}`);
    if (type === 'IHDR') sawIhdr = true;
    if (type === 'IDAT') idat.push(data.subarray(offset + 8, offset + 8 + length));
    if (type === 'IEND') {
      sawIend = true;
      assert.equal(length, 0, `${file} possui IEND inválido`);
      assert.equal(end, data.length, `${file} possui dados extras após IEND`);
      break;
    }
    offset = end;
  }
  assert.ok(sawIhdr && sawIend && idat.length > 0, `${file} possui estrutura PNG incompleta`);
  assert.doesNotThrow(() => zlib.inflateSync(Buffer.concat(idat)), `${file} possui IDAT corrompido ou checksum incompleto`);
}

for (const [file, expected] of [
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/icon-maskable-192.png', 192],
  ['public/icons/icon-maskable-512.png', 512]
]) {
  assert.ok(exists(file), `Ícone público ausente: ${file}`);
  assert.deepEqual(pngSize(file), { width: expected, height: expected });
}

for (const file of [
  'public/assets/branding/buildmaster-app-icon.png',
  'public/assets/branding/buildmaster-mark.png',
  'public/assets/branding/buildmaster-splash.webp',
  'resources/branding/buildmaster-app-icon-1024.png',
  'resources/android-branding/res/mipmap-anydpi-v26/ic_launcher.xml',
  'resources/android-branding/res/mipmap-anydpi-v33/ic_launcher.xml',
  'resources/android-branding/res/drawable/buildmaster_native_splash.xml',
  'scripts/install-android-branding.mjs'
]) assert.ok(exists(file), `Identidade premium ausente: ${file}`);

const legacySplashResourceName = 'buildmaster_native_splash.png';
const legacySplashSourcePath = path.join('resources/android-branding/res/drawable-nodpi', legacySplashResourceName);

for (const file of fs.readdirSync('resources/android-branding/res/drawable-nodpi')
  .filter((name) => name.endsWith('.png') && name !== legacySplashResourceName)
  .map((name) => path.join('resources/android-branding/res/drawable-nodpi', name))) {
  assertCompletePng(file);
}
for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  for (const name of fs.readdirSync(path.join('resources/android-branding/res', `mipmap-${density}`)).filter((item) => item.endsWith('.png'))) {
    assertCompletePng(path.join('resources/android-branding/res', `mipmap-${density}`, name));
  }
}
assert.deepEqual(pngSize('resources/android-branding/res/drawable-nodpi/buildmaster_native_splash_image.png'), { width: 2732, height: 2732 });

const splashDrawable = read('resources/android-branding/res/drawable/buildmaster_native_splash.xml');
assert.match(splashDrawable, /@drawable\/buildmaster_native_splash_image/);
assert.doesNotMatch(
  splashDrawable,
  /@drawable\/buildmaster_native_splash(?:["'])/,
  'O drawable XML da splash não pode referenciar a si próprio.'
);
// O repositório pode ter sido atualizado por sobreposição e ainda conter o PNG
// legado. A instalação deve ignorá-lo e removê-lo do projeto Android, em vez de
// bloquear o diagnóstico antes que a limpeza automática seja executada.

const mark = read('src/components/BuildMasterMark.tsx');
assert.match(mark, /buildmaster-mark\.png/);
assert.match(mark, /<path d="M32 4 54 12v17/);
assert.match(read('src/components/PremiumBrand.tsx'), /Tático · Máximo desempenho/);
assert.match(read('src/components/CardVisionApp.tsx'), /bm-brand-splash-screen/);
assert.match(read('src/app/globals.css'), /buildmaster-splash\.webp/);
assert.match(read('public/sw.js'), /buildmaster-v40-10-progress-1/);
assert.match(read('src/components/RegisterServiceWorker.tsx'), /40\.10\.0-progress-runtime-1/);
assert.match(read('.github/workflows/build-apk.yml'), /install-android-branding\.mjs/);
assert.match(read('.github/workflows/build-play-store.yml'), /install-android-branding\.mjs/);
assert.match(read('scripts/install-android-branding.mjs'), /sourceLegacySelfReferencingSplash/);
assert.match(read('scripts/install-android-branding.mjs'), /filter\(source\)/);

const brandingValues = read('resources/android-branding/res/values/buildmaster_branding.xml');
assert.doesNotMatch(
  brandingValues,
  /name=["']ic_launcher_background["']/,
  'A identidade não pode redeclarar ic_launcher_background, já criado pelo template Android.'
);

// Simula o projeto Android limpo criado pelo Capacitor para validar a instalação real.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-branding-'));
fs.mkdirSync(path.join(temp, 'scripts'), { recursive: true });
fs.mkdirSync(path.join(temp, 'resources', 'android-branding'), { recursive: true });
fs.cpSync('scripts/install-android-branding.mjs', path.join(temp, 'scripts', 'install-android-branding.mjs'));
fs.cpSync('resources/android-branding/res', path.join(temp, 'resources', 'android-branding', 'res'), { recursive: true });
const tempLegacySource = path.join(temp, 'resources', 'android-branding', 'res', 'drawable-nodpi', legacySplashResourceName);
fs.copyFileSync(
  path.join(temp, 'resources', 'android-branding', 'res', 'drawable-nodpi', 'buildmaster_native_splash_image.png'),
  tempLegacySource
);
assert.ok(exists(tempLegacySource), 'A simulação precisa conter o PNG legado para validar a migração por sobreposição.');
const fakeRes = path.join(temp, 'android', 'app', 'src', 'main', 'res');
fs.mkdirSync(path.join(fakeRes, 'values'), { recursive: true });
fs.writeFileSync(path.join(fakeRes, 'values', 'styles.xml'), '<?xml version="1.0" encoding="utf-8"?><resources><style name="AppTheme.NoActionBarLaunch"><item name="android:background">@drawable/splash</item></style></resources>');
fs.writeFileSync(path.join(fakeRes, 'values', 'launch_background.xml'), '<?xml version="1.0" encoding="utf-8"?><resources><color name="ic_launcher_background">#FFFFFF</color></resources>');
const fakeManifest = path.join(temp, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
fs.mkdirSync(path.dirname(fakeManifest), { recursive: true });
fs.writeFileSync(fakeManifest, '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:icon="@mipmap/old_icon"></application></manifest>');
const install = spawnSync(process.execPath, ['scripts/install-android-branding.mjs'], { cwd: temp, encoding: 'utf8' });
assert.equal(install.status, 0, install.stderr || install.stdout);
assert.match(fs.readFileSync(fakeManifest, 'utf8'), /android:icon="@mipmap\/ic_launcher"/);
assert.match(fs.readFileSync(fakeManifest, 'utf8'), /android:roundIcon="@mipmap\/ic_launcher_round"/);
assert.match(fs.readFileSync(path.join(fakeRes, 'values', 'styles.xml'), 'utf8'), /@drawable\/buildmaster_native_splash/);
assert.ok(exists(path.join(fakeRes, 'mipmap-xxxhdpi', 'ic_launcher.png')));
assert.ok(exists(path.join(fakeRes, 'mipmap-anydpi-v33', 'ic_launcher.xml')));
assert.ok(exists(path.join(fakeRes, 'drawable-nodpi', 'buildmaster_native_splash_image.png')));
assert.ok(!exists(path.join(fakeRes, 'drawable-nodpi', 'buildmaster_native_splash.png')));
const installedSplashXml = fs.readFileSync(path.join(fakeRes, 'drawable', 'buildmaster_native_splash.xml'), 'utf8');
assert.match(installedSplashXml, /@drawable\/buildmaster_native_splash_image/);
assert.doesNotMatch(installedSplashXml, /@drawable\/buildmaster_native_splash(?:["'])/);
const installedValueXml = fs.readdirSync(path.join(fakeRes, 'values')).filter((name) => name.endsWith('.xml')).map((name) => fs.readFileSync(path.join(fakeRes, 'values', name), 'utf8')).join('\n');
assert.equal((installedValueXml.match(/name=["']ic_launcher_background["']/g) || []).length, 1, 'ic_launcher_background deve existir uma única vez após instalar a identidade.');
fs.rmSync(temp, { recursive: true, force: true });

console.log('v38.40 identidade premium aprovada: ícone BM, adaptive icon, modo monocromático, splash e instalação Android verificadas.');
