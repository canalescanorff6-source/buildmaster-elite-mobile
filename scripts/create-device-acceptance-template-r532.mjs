import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const sourceSha = String(process.env.SOURCE_SHA ?? process.env.GITHUB_SHA ?? '').trim();
const apkSha256 = String(process.env.APK_SHA256 ?? '').trim().toLowerCase();
const version = String(process.env.BUILDMASTER_VERSION ?? '').trim();
const versionCode = Number(process.env.ANDROID_VERSION_CODE ?? NaN);
const releaseTag = String(process.env.RELEASE_TAG ?? '').trim();
const channel = String(process.env.RELEASE_CHANNEL ?? 'beta').trim();
const out = String(process.env.R532_ACCEPTANCE_TEMPLATE_OUT ?? 'dist-apk/device-acceptance-r532-template.json').trim();

if (!sourceSha) throw new Error('R532 template: SOURCE_SHA ausente.');
if (!/^[a-f0-9]{64}$/i.test(apkSha256)) throw new Error('R532 template: APK_SHA256 inválido.');
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('R532 template: BUILDMASTER_VERSION inválida.');
if (!Number.isSafeInteger(versionCode) || versionCode <= 0) throw new Error('R532 template: ANDROID_VERSION_CODE inválido.');
if (!releaseTag) throw new Error('R532 template: RELEASE_TAG ausente.');

const checks = Object.fromEntries([
  'appLaunches',
  'r521AppShell', 'r522HomeDashboard', 'r523ReaderOcr', 'r524ResultFicha', 'r525SkillsImpeto',
  'r526Tactics', 'r527Vault', 'r528ExportShare', 'r529AccountAdmin', 'r530FinalPolish',
  'exactEditionResolved', 'trainingExactBudget', 'finalSkillSetVisible', 'impetoDecisionVisible',
  'inactiveStyleFlagged', 'vaultSave', 'vaultReopen', 'sameDecisionAfterReopen',
  'formationUsesSavedBuild', 'benchAndSubstitutions', 'zero56RegressionChecked',
  'noDuplicateCardAfterCatalogResolution', 'noCrashDuringLargeVault', 'updateCheckWorks', 'noCrashFullFlow'
].map((key) => [key, false]));

const template = {
  schemaVersion: 2,
  project: 'BuildMaster Elite Tático',
  candidateChannel: channel,
  appPackage: 'com.buildmaster.elitetatico',
  sourceSha,
  apkSha256,
  version,
  versionCode,
  releaseTag,
  testedAt: null,
  device: { physicalDevice: true, platform: 'android', model: '', androidVersion: '' },
  cardsTested: 0,
  positionsTested: [],
  largeVaultCount: 0,
  checks,
  notes: ''
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
console.log(`R532 template gerado: ${out}`);
