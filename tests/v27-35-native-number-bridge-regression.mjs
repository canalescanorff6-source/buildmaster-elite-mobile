import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const installerPath = path.join(root, 'scripts/install-android-security-plugin.mjs');
const installer = fs.readFileSync(installerPath, 'utf8');
const app = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');

assert.equal(pkg.version, '27.36.0');

// O diretório android é gerado pelo Capacitor no workflow e fica fora do Git.
// Para testar o Java produzido sem depender de arquivos gerados no repositório,
// executamos o instalador em um projeto Android mínimo temporário.
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-v2735-'));
try {
  const manifestDir = path.join(tempRoot, 'android/app/src/main');
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(
    path.join(manifestDir, 'AndroidManifest.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n  <application android:allowBackup="true" android:usesCleartextTraffic="true"></application>\n</manifest>\n`,
  );

  execFileSync(process.execPath, [installerPath], {
    cwd: tempRoot,
    stdio: 'pipe',
  });

  const generatedPlugin = fs.readFileSync(
    path.join(tempRoot, 'android/app/src/main/java/com/buildmaster/elitetatico/BuildMasterSecurityPlugin.java'),
    'utf8',
  );
  const generatedManifest = fs.readFileSync(path.join(manifestDir, 'AndroidManifest.xml'), 'utf8');

  for (const [name, plugin] of [
    ['gerador', installer],
    ['plugin gerado em ambiente limpo', generatedPlugin],
  ]) {
    assert.match(plugin, /private static Long readLongOption\(PluginCall call, String key\)/, `${name}: leitor Number→long ausente`);
    assert.match(plugin, /value instanceof Number/, `${name}: Number não reconhecido`);
    assert.match(plugin, /\(\(Number\) value\)\.longValue\(\)/, `${name}: conversão longValue ausente`);
    assert.match(plugin, /readLongOption\(call, "expectedVersionCode"\)/, `${name}: versionCode não usa ponte segura`);
    assert.match(plugin, /readLongOption\(call, "expectedSizeBytes"\)/, `${name}: tamanho não usa ponte segura`);
    assert.doesNotMatch(plugin, /call\.getLong\("expectedVersionCode"\)/, `${name}: getLong antigo reapareceu`);
    assert.doesNotMatch(plugin, /call\.getLong\("expectedSizeBytes"\)/, `${name}: getLong antigo reapareceu`);
    assert.match(plugin, /expectedChecksum = expectedChecksum\.trim\(\)\.toLowerCase\(\)/, `${name}: SHA-256 não é normalizado`);
    assert.match(plugin, /UPDATE_VERSION_CODE_INVALID/, `${name}: diagnóstico do versionCode ausente`);

    // As opções são normalizadas antes da Thread; o Java exige snapshots finais
    // para que a lambda não capture variáveis mutáveis.
    assert.match(plugin, /final String downloadUrl = urlValue;/, `${name}: snapshot final da URL ausente`);
    assert.match(plugin, /final String checksumSha256 = expectedChecksum;/, `${name}: snapshot final do SHA ausente`);
    assert.match(plugin, /final long manifestVersionCode = expectedVersionCode\.longValue\(\);/, `${name}: snapshot final do versionCode ausente`);
    assert.match(plugin, /final Long manifestSizeBytes = expectedSize;/, `${name}: snapshot final do tamanho ausente`);
    assert.match(plugin, /final String manifestVersionName = expectedVersionName;/, `${name}: snapshot final da versão ausente`);

    const lambdaStart = plugin.indexOf('new Thread(() -> {');
    const lambdaEnd = plugin.indexOf('        }).start();', lambdaStart);
    assert.ok(lambdaStart >= 0 && lambdaEnd > lambdaStart, `${name}: Thread do atualizador não localizada`);
    const lambdaBody = plugin.slice(lambdaStart, lambdaEnd);
    for (const mutableName of [
      'urlValue',
      'expectedChecksum',
      'expectedVersionCode',
      'expectedSize',
      'expectedVersionName',
      'expectedPackage',
    ]) {
      assert.equal(lambdaBody.includes(mutableName), false, `${name}: variável mutável ${mutableName} ainda é capturada pela lambda`);
    }
  }

  assert.match(generatedManifest, /android\.permission\.REQUEST_INSTALL_PACKAGES/);
  assert.match(generatedManifest, /androidx\.core\.content\.FileProvider/);
  assert.match(generatedManifest, /android:allowBackup="false"/);
  assert.match(generatedManifest, /android:usesCleartextTraffic="false"/);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

assert.match(app, /compactHistoryForLocalFallback/);
assert.match(app, /if \(indexedSaved\)[\s\S]*removeAccountStorage\(HISTORY_KEY\)/);

// Reproduz o tipo entregue por JSONObject: 1384000571 cabe em Integer.
const versionCode = 1_384_000_571;
assert.equal(Number.isInteger(versionCode), true);
assert.ok(versionCode < 2_147_483_647);

console.log('✓ v27.36: ponte Number→long, Java gerado em checkout limpo, snapshots finais e fallback compacto validados.');
