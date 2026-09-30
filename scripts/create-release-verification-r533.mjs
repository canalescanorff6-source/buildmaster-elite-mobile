import fs from 'node:fs';
import path from 'node:path';

const required = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`R533: ${name} ausente.`);
  return value;
};

const sourceSha = required('SOURCE_SHA').toLowerCase();
const apkSha256 = required('APK_SHA256').toLowerCase();
const version = required('BUILDMASTER_VERSION');
const versionCode = Number(required('ANDROID_VERSION_CODE'));
const releaseTag = required('RELEASE_TAG');
const channel = required('RELEASE_CHANNEL');
const deviceStatus = String(process.env.R533_DEVICE_STATUS || 'DEVICE_PENDING').trim();
const output = String(process.env.R533_RELEASE_VERIFICATION_OUT || 'dist-apk/release-verification-r533.json').trim();

if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('R533: SOURCE_SHA inválido.');
if (!/^[0-9a-f]{64}$/.test(apkSha256)) throw new Error('R533: APK_SHA256 inválido.');
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('R533: BUILDMASTER_VERSION inválida.');
if (!Number.isInteger(versionCode) || versionCode <= 0) throw new Error('R533: ANDROID_VERSION_CODE inválido.');
if (!['stable', 'beta'].includes(channel)) throw new Error('R533: RELEASE_CHANNEL inválido.');
if (!['DEVICE_PENDING', 'DEVICE_ACCEPTED'].includes(deviceStatus)) throw new Error('R533: R533_DEVICE_STATUS inválido.');

const receipt = {
  schemaVersion: 1,
  appPackage: 'com.buildmaster.elitetatico',
  sourceSha,
  apkSha256,
  version,
  versionCode,
  releaseTag,
  channel,
  buildStatus: 'BUILD_VERIFIED',
  deviceStatus,
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
console.log(`R533: ${receipt.buildStatus} / ${receipt.deviceStatus} -> ${output}`);
