import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APP_DATA_VERSION, createBackupEnvelope, validateBackupEnvelope } from '../src/lib/dataSafety';
import { APP_RELEASE_VERSION, compareVersions, evaluateUpdateManifest, validateUpdateManifest } from '../src/lib/appUpdates';

assert.equal(APP_DATA_VERSION, '26.71.0');
assert.equal(APP_RELEASE_VERSION, '26.71.0');
assert.equal(compareVersions('26.71.1', '26.71.0'), 1);
assert.equal(compareVersions('26.71.0', '26.71.0'), 0);
assert.equal(compareVersions('26.70.9', '26.71.0'), -1);

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
  version: '26.71.0',
  buildId: 'new-build',
  publishedAt: '2026-07-14T00:00:00.000Z',
  channel: 'stable',
  updateType: 'apk',
  apkUrl: 'https://example.com/app.apk',
  notes: ['Teste']
};
assert.ok(validateUpdateManifest(manifest));
assert.equal(validateUpdateManifest({ ...manifest, apkUrl: 'javascript:alert(1)' }), null);
assert.equal(validateUpdateManifest({ ...manifest, publishedAt: 'data-invalida' }), null);
assert.equal(evaluateUpdateManifest(manifest, '26.71.0', 'old-build').available, true);
assert.equal(evaluateUpdateManifest({ ...manifest, version: '26.71.0', buildId: 'old-build' }, '26.71.0', 'old-build').available, false);
assert.equal(evaluateUpdateManifest({ ...manifest, appId: 'outro.app' }, '26.71.0', 'old-build').valid, false);

const appSource = fs.readFileSync(path.join(process.cwd(), 'src/components/CardVisionApp.tsx'), 'utf8');
assert.match(appSource, /exportPlayersBackup/);
assert.match(appSource, /Jogadores treinados/);
assert.match(appSource, /UpdateCenterPanel/);

const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/build-apk.yml'), 'utf8');
assert.match(workflow, /update-manifest\.json/);
assert.match(workflow, /buildmaster-latest/);
assert.match(workflow, /NEXT_PUBLIC_BUILDMASTER_BUILD_ID/);
assert.match(workflow, /hashlib\.sha256/);
assert.match(appSource, /buildmaster_update_manifest_url/);

console.log('✓ Backup dedicado e Central de Atualizações v26.71 validados.');
