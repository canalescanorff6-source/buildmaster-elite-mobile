import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const installer = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');
const generatedPlugin = fs.readFileSync(
  'android/app/src/main/java/com/buildmaster/elitetatico/BuildMasterSecurityPlugin.java',
  'utf8',
);
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');

assert.equal(pkg.version, '27.35.0');

for (const [name, plugin] of [
  ['gerador', installer],
  ['plugin gerado', generatedPlugin],
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

  // As opções são normalizadas antes da Thread; por isso não são "effectively final".
  // O plugin deve copiar os valores validados para snapshots finais e usar apenas
  // esses snapshots dentro da lambda. Isso evita o erro real do javac/Gradle:
  // "local variables referenced from a lambda expression must be final or effectively final".
  assert.match(plugin, /final String downloadUrl = urlValue;/, `${name}: snapshot final da URL ausente`);
  assert.match(plugin, /final String checksumSha256 = expectedChecksum;/, `${name}: snapshot final do SHA ausente`);
  assert.match(plugin, /final long manifestVersionCode = expectedVersionCode\.longValue\(\);/, `${name}: snapshot final do versionCode ausente`);
  assert.match(plugin, /final Long manifestSizeBytes = expectedSize;/, `${name}: snapshot final do tamanho ausente`);
  assert.match(plugin, /final String manifestVersionName = expectedVersionName;/, `${name}: snapshot final da versão ausente`);

  for (const snapshotName of [
    'downloadUrl',
    'checksumSha256',
    'manifestVersionCode',
    'manifestSizeBytes',
    'manifestVersionName',
  ]) {
    const declarationIndex = plugin.indexOf(`final ${snapshotName === 'manifestVersionCode' ? 'long' : snapshotName === 'manifestSizeBytes' ? 'Long' : 'String'} ${snapshotName}`);
    const firstUseIndex = plugin.indexOf(snapshotName);
    assert.equal(firstUseIndex, declarationIndex + plugin.slice(declarationIndex).indexOf(snapshotName), `${name}: ${snapshotName} aparece antes da própria declaração`);
  }

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

assert.match(app, /compactHistoryForLocalFallback/);
assert.match(app, /if \(indexedSaved\)[\s\S]*removeAccountStorage\(HISTORY_KEY\)/);

// Reproduz o tipo entregue por JSONObject: 1384000571 cabe em Integer.
const versionCode = 1_384_000_571;
assert.equal(Number.isInteger(versionCode), true);
assert.ok(versionCode < 2_147_483_647);

console.log('✓ v27.35: ponte Number→long, snapshots finais da Thread e fallback compacto do Cofre validados.');
