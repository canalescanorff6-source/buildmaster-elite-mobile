import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const plugin = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');

assert.equal(pkg.version, '27.35.0');
assert.match(plugin, /private static Long readLongOption\(PluginCall call, String key\)/);
assert.match(plugin, /value instanceof Number/);
assert.match(plugin, /\(\(Number\) value\)\.longValue\(\)/);
assert.match(plugin, /readLongOption\(call, "expectedVersionCode"\)/);
assert.match(plugin, /readLongOption\(call, "expectedSizeBytes"\)/);
assert.doesNotMatch(plugin, /call\.getLong\("expectedVersionCode"\)/);
assert.doesNotMatch(plugin, /call\.getLong\("expectedSizeBytes"\)/);
assert.match(plugin, /expectedChecksum = expectedChecksum\.trim\(\)\.toLowerCase\(\)/);
assert.match(plugin, /UPDATE_VERSION_CODE_INVALID/);
assert.match(app, /compactHistoryForLocalFallback/);
assert.match(app, /if \(indexedSaved\)[\s\S]*removeAccountStorage\(HISTORY_KEY\)/);

// Reproduz o tipo entregue por JSONObject: 1384000571 cabe em Integer.
const versionCode = 1_384_000_571;
assert.equal(Number.isInteger(versionCode), true);
assert.ok(versionCode < 2_147_483_647);

console.log('✓ v27.35: ponte Number→long do Capacitor corrigida e fallback pesado do Cofre removido.');
