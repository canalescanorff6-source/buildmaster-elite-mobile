import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APP_DATA_VERSION, createBackupEnvelope, validateBackupEnvelope } from '../src/lib/dataSafety';
import { APP_RELEASE_VERSION, compareVersions, evaluateUpdateManifest, validateUpdateManifest } from '../src/lib/appUpdates';

assert.equal(APP_DATA_VERSION, '27.10.0');
assert.equal(APP_RELEASE_VERSION, '27.26.0');
assert.equal(compareVersions('27.1.0', '27.26.0'), -1);
assert.equal(compareVersions('27.26.0', '27.26.0'), 0);
assert.equal(compareVersions('26.99.9', '27.26.0'), -1);

const backup = createBackupEnvelope({
  history: [{ id: 'player-1', result: { parsed: { playerName: 'Jogador Teste' } } }],
  folders: [{ id: 'titulares', name: 'Titulares' }],
  calibration: { matches: { 'player-1': [{ rating: 8 }] } },
  evolution: { cardRegistry: [{ id: 'card-1' }], matchValidation: [{ id: 'match-1' }] }
}, '2026-07-14T00:00:00.000Z');
const checked = validateBackupEnvelope(backup);
assert.equal(checked.valid, true);
assert.ok(Array.isArray(checked.migrated?.sections.history));
assert.ok(checked.migrated?.sections.evolution);

const manifest = {
  appId: 'com.buildmaster.elitetatico',
  version: '27.26.0',
  versionCode: 1352300020,
  buildId: 'new-build',
  publishedAt: '2026-07-14T00:00:00.000Z',
  channel: 'stable',
  updateType: 'apk',
  apkUrl: 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-v27.26.0-1352300020-abcdef12.apk',
  checksum: 'a'.repeat(64),
  sizeBytes: 25_000_000,
  notes: ['Teste']
} as const;
assert.ok(validateUpdateManifest(manifest));
assert.equal(validateUpdateManifest({ ...manifest, apkUrl: 'javascript:alert(1)' }), null);
assert.equal(validateUpdateManifest({ ...manifest, checksum: 'invalido' }), null);
assert.equal(validateUpdateManifest({ ...manifest, versionCode: 0 }), null);
assert.equal(validateUpdateManifest({ ...manifest, publishedAt: 'data-invalida' }), null);
assert.equal(evaluateUpdateManifest(manifest, { versionName: '27.26.0', versionCode: 1350900010 }, 'old-build').available, true);
assert.equal(evaluateUpdateManifest({ ...manifest, version: '27.26.0', versionCode: 1350900010, buildId: 'old-build' }, { versionName: '27.26.0', versionCode: 1350900010 }, 'old-build').available, false);
assert.equal(evaluateUpdateManifest({ ...manifest, appId: 'outro.app' }, { versionName: '27.26.0', versionCode: 1350900010 }, 'old-build').valid, false);

const appSource = fs.readFileSync(path.join(process.cwd(), 'src/components/CardVisionApp.tsx'), 'utf8');
assert.match(appSource, /exportPlayersBackup/);
assert.match(appSource, /Jogadores treinados/);
assert.match(appSource, /UpdateCenterPanel/);

const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/build-apk.yml'), 'utf8');
assert.match(workflow, /update-manifest\.json/);
assert.match(workflow, /versionCode/);
assert.match(workflow, /APK_ASSET_NAME/);
assert.match(workflow, /hashlib\.sha256/);
assert.match(workflow, /Validar release imutável publicamente/);
assert.match(workflow, /Validar a ponte automática da v27\.00/);
assert.doesNotMatch(appSource, /updateManifestUrl:/);
assert.match(appSource, /encryptBackupPayload/);

console.log('✓ Backup e motor de atualização definitiva v27.26 validados.');
