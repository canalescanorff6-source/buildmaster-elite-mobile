import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APP_DATA_VERSION, createBackupEnvelope, validateBackupEnvelope } from '../src/lib/dataSafety';
import { APP_RELEASE_VERSION, compareVersions, evaluateUpdateManifest, validateUpdateManifest } from '../src/lib/appUpdates';

assert.equal(APP_DATA_VERSION, '26.75.0');
assert.equal(APP_RELEASE_VERSION, '26.78.0');
assert.equal(compareVersions('26.79.0', '26.78.0'), 1);
assert.equal(compareVersions('26.78.0', '26.78.0'), 0);
assert.equal(compareVersions('26.77.9', '26.78.0'), -1);

const backup = createBackupEnvelope({
  history: [{ id: 'player-1', result: { parsed: { playerName: 'Jogador Teste' } } }],
  folders: [{ id: 'titulares', name: 'Titulares' }],
  calibration: { matches: { 'player-1': [{ rating: 8 }] } }
}, '2026-07-14T00:00:00.000Z');
const checked = validateBackupEnvelope(backup);
assert.equal(checked.valid, true);
assert.ok(Array.isArray(checked.migrated?.sections.history));

const manifest = {
  appId: 'com.buildmaster.elitetatico',
  version: '26.79.0',
  versionCode: 1307900020,
  buildId: 'new-build',
  publishedAt: '2026-07-14T00:00:00.000Z',
  channel: 'stable',
  updateType: 'apk',
  apkUrl: 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-v26.79.0-1307900020-abcdef12.apk',
  checksum: 'a'.repeat(64),
  sizeBytes: 25_000_000,
  notes: ['Teste']
} as const;
assert.ok(validateUpdateManifest(manifest));
assert.equal(validateUpdateManifest({ ...manifest, apkUrl: 'javascript:alert(1)' }), null);
assert.equal(validateUpdateManifest({ ...manifest, checksum: 'invalido' }), null);
assert.equal(validateUpdateManifest({ ...manifest, versionCode: 0 }), null);
assert.equal(validateUpdateManifest({ ...manifest, publishedAt: 'data-invalida' }), null);
assert.equal(evaluateUpdateManifest(manifest, { versionName: '26.78.0', versionCode: 1307800010 }, 'old-build').available, true);
assert.equal(evaluateUpdateManifest({ ...manifest, version: '26.78.0', versionCode: 1307800010, buildId: 'old-build' }, { versionName: '26.78.0', versionCode: 1307800010 }, 'old-build').available, false);
assert.equal(evaluateUpdateManifest({ ...manifest, appId: 'outro.app' }, { versionName: '26.78.0', versionCode: 1307800010 }, 'old-build').valid, false);

const appSource = fs.readFileSync(path.join(process.cwd(), 'src/components/CardVisionApp.tsx'), 'utf8');
assert.match(appSource, /exportPlayersBackup/);
assert.match(appSource, /Jogadores treinados/);
assert.match(appSource, /UpdateCenterPanel/);

const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/build-apk.yml'), 'utf8');
assert.match(workflow, /update-manifest\.json/);
assert.match(workflow, /versionCode/);
assert.match(workflow, /APK_ASSET_NAME/);
assert.match(workflow, /hashlib\.sha256/);
assert.match(workflow, /Verificar release publicada de ponta a ponta/);
assert.doesNotMatch(appSource, /updateManifestUrl:/);
assert.match(appSource, /encryptBackupPayload/);

console.log('✓ Backup e motor de atualização definitiva v26.78 validados.');
