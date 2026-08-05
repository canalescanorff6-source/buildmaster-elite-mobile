import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const read = (file) => fs.readFileSync(file, 'utf8');
const exists = (file) => fs.existsSync(file) && fs.statSync(file).size > 0;

function pngSize(file) {
  const data = fs.readFileSync(file);
  assert.equal(data.toString('ascii', 1, 4), 'PNG', `${file} não é PNG`);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
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

const mark = read('src/components/BuildMasterMark.tsx');
assert.match(mark, /buildmaster-mark\.png/);
assert.match(mark, /<path d="M32 4 54 12v17/);
assert.match(read('src/components/PremiumBrand.tsx'), /Tático · Máximo desempenho/);
assert.match(read('src/components/CardVisionApp.tsx'), /bm-brand-splash-screen/);
assert.match(read('src/app/globals.css'), /buildmaster-splash\.webp/);
assert.match(read('public/sw.js'), /background-ocr-resume-1-branding-bm-1/);
assert.match(read('src/components/RegisterServiceWorker.tsx'), /background-ocr-resume-1-branding-bm-1/);
assert.match(read('.github/workflows/build-apk.yml'), /install-android-branding\.mjs/);
assert.match(read('.github/workflows/build-play-store.yml'), /install-android-branding\.mjs/);

// Simula o projeto Android limpo criado pelo Capacitor para validar a instalação real.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-branding-'));
fs.mkdirSync(path.join(temp, 'scripts'), { recursive: true });
fs.mkdirSync(path.join(temp, 'resources', 'android-branding'), { recursive: true });
fs.cpSync('scripts/install-android-branding.mjs', path.join(temp, 'scripts', 'install-android-branding.mjs'));
fs.cpSync('resources/android-branding/res', path.join(temp, 'resources', 'android-branding', 'res'), { recursive: true });
const fakeRes = path.join(temp, 'android', 'app', 'src', 'main', 'res');
fs.mkdirSync(path.join(fakeRes, 'values'), { recursive: true });
fs.writeFileSync(path.join(fakeRes, 'values', 'styles.xml'), '<?xml version="1.0" encoding="utf-8"?><resources><style name="AppTheme.NoActionBarLaunch"><item name="android:background">@drawable/splash</item></style></resources>');
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
fs.rmSync(temp, { recursive: true, force: true });

console.log('v38.40 identidade premium aprovada: ícone BM, adaptive icon, modo monocromático, splash e instalação Android verificadas.');
