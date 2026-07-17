import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APP_DATA_VERSION } from '../src/lib/dataSafety';
import { APP_RELEASE_VERSION, DEFAULT_UPDATE_MANIFEST_URL, isTrustedApkUrl, isTrustedManifestUrl, validateUpdateManifest } from '../src/lib/appUpdates';
import { decryptBackupPayload, encryptBackupPayload, isEncryptedBackupFile } from '../src/lib/backupCrypto';

async function main() {
  assert.equal(APP_RELEASE_VERSION, '27.12.0');
  assert.equal(APP_DATA_VERSION, '27.10.0');
  assert.equal(isTrustedManifestUrl(), true);
  assert.match(DEFAULT_UPDATE_MANIFEST_URL, /github\.com\/canalescanorff6-source\/buildmaster-elite-mobile\/releases\/download\/buildmaster-latest\/update-manifest\.json/);
  const apkUrl = 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-v27.12.0-1351000001-abcdef12.apk';
  assert.equal(isTrustedApkUrl(apkUrl), true);
  assert.equal(isTrustedApkUrl('https://github.com/outro/projeto/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-latest.apk'), false);
  const manifest = {
    appId: 'com.buildmaster.elitetatico' as const,
    version: '27.12.0', versionCode: 1351000001, buildId: 'abc', publishedAt: new Date().toISOString(), channel: 'stable' as const,
    updateType: 'apk' as const, apkUrl: 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-v27.12.0-1351000001-abcdef12.apk', notes: [], mandatory: true, minNativeVersion: '26.75.0', checksum: 'a'.repeat(64), sizeBytes: 123
  };
  assert.ok(validateUpdateManifest(manifest));
  assert.equal(validateUpdateManifest({ ...manifest, checksum: 'fraco' }), null);

  const encrypted = await encryptBackupPayload({ secret: 'cofre' }, 'SenhaBackup2026');
  assert.equal(isEncryptedBackupFile(encrypted), true);
  assert.deepEqual(await decryptBackupPayload(encrypted, 'SenhaBackup2026'), { secret: 'cofre' });
  await assert.rejects(() => decryptBackupPayload(encrypted, 'SenhaErrada2026'));

  const secureStorage = fs.readFileSync('src/lib/secureStorage.ts', 'utf8');
  const androidInstaller = fs.readFileSync('scripts/install-android-security-plugin.mjs', 'utf8');
  const license = fs.readFileSync('supabase/functions/license-session/index.ts', 'utf8');
  const admin = fs.readFileSync('supabase/functions/admin-users/index.ts', 'utf8');
  const migration = fs.readFileSync('supabase/migrations/202607160001_security_hardening_v2675.sql', 'utf8');
  const panel = fs.readFileSync('src/components/AccountAdminPanel.tsx', 'utf8');
  const updatePanel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');
  const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

  assert.match(secureStorage, /BuildMasterSecurity/);
  assert.match(androidInstaller, /AndroidKeyStore/);
  assert.match(androidInstaller, /SHA-256 do APK não confere/);
  assert.match(androidInstaller, /android:allowBackup=\"false\"/);
  assert.match(androidInstaller, /canalescanorff6-source\/buildmaster-elite-mobile/);
  assert.match(license, /UPDATE_REQUIRED|LEGACY_CLIENT_BLOCKED/);
  assert.match(license, /DEVICE_REPLAY_BLOCKED/);
  assert.match(license, /buildmaster_register_secure_device/);
  assert.match(admin, /aal2/);
  assert.match(admin, /buildmaster_take_admin_rate_limit/);
  assert.match(migration, /min_app_version text not null default '26\.75\.0'/);
  assert.match(migration, /user_offline_grace_hours integer not null default 4/);
  assert.match(migration, /revoke all on function public\.buildmaster_validate_license_and_register_device/);
  assert.match(migration, /buildmaster_register_secure_device/);
  assert.match(migration, /auth\.jwt\(\)->>'aal'.*aal2/s);
  assert.match(panel, /Confirmação em duas etapas obrigatória/);
  assert.match(updatePanel, /downloadVerifyAndInstallApk/);
  assert.doesNotMatch(updatePanel, /URL do manifesto/);
  assert.match(workflow, /install-android-security-plugin\.mjs/);
  assert.match(workflow, /mandatory': True/);
  console.log('✓ v26.75: bloqueio de APK antigo, MFA, Keystore, aparelho seguro, atualização verificada, backup AES-256 e rate limit validados.');
}

void main();
