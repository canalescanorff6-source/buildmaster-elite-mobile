import process from 'node:process';

export const DEVICE_ACCEPTANCE_R532_SCHEMA_VERSION = 2;

const raw = String(process.env.R532_DEVICE_ACCEPTANCE_JSON ?? '').trim();
const sourceSha = String(process.env.SOURCE_SHA ?? '').trim();
const apkSha256 = String(process.env.APK_SHA256 ?? '').trim().toLowerCase();
const version = String(process.env.BUILDMASTER_VERSION ?? '').trim();
const versionCode = Number(process.env.ANDROID_VERSION_CODE ?? NaN);
const releaseTag = String(process.env.RELEASE_TAG ?? '').trim();
const releaseChannel = String(process.env.RELEASE_CHANNEL ?? '').trim();

if (!raw) throw new Error('R532: device_acceptance_json é obrigatório para validar aceitação física.');
if (!sourceSha) throw new Error('R532: SOURCE_SHA ausente.');
if (!/^[a-f0-9]{64}$/i.test(apkSha256)) throw new Error('R532: APK_SHA256 ausente ou inválido.');
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('R532: BUILDMASTER_VERSION inválida.');
if (!Number.isSafeInteger(versionCode) || versionCode <= 0) throw new Error('R532: ANDROID_VERSION_CODE inválido.');
if (!releaseTag) throw new Error('R532: RELEASE_TAG ausente.');

let receipt;
try { receipt = JSON.parse(raw); }
catch { throw new Error('R532: device_acceptance_json não é JSON válido.'); }

if (receipt && typeof receipt.apkSha256 === 'string') receipt.apkSha256 = receipt.apkSha256.toLowerCase();

const fail = [];
const req = (cond, msg) => { if (!cond) fail.push(msg); };

req(receipt?.schemaVersion===2, 'schemaVersion precisa ser 2');
req(receipt?.project === 'BuildMaster Elite Tático', 'project inválido');
req(receipt?.appPackage==='com.buildmaster.elitetatico', 'package Android inválido');
req(receipt?.sourceSha===sourceSha, `sourceSha não corresponde ao artefato (${sourceSha})`);
req(receipt?.apkSha256===apkSha256, 'apkSha256 não corresponde ao APK da release');
req(receipt?.version === version, `version precisa ser ${version}`);
req(Number(receipt?.versionCode)===versionCode, `versionCode precisa ser ${versionCode}`);
req(receipt?.releaseTag === releaseTag, `releaseTag precisa ser ${releaseTag}`);
if (releaseChannel) req(receipt?.candidateChannel === releaseChannel, `candidateChannel precisa ser ${releaseChannel}`);

req(receipt?.device?.physicalDevice===true, 'teste precisa ter sido feito em aparelho físico');
req(receipt?.device?.platform === 'android', 'plataforma precisa ser android');
req(String(receipt?.device?.model ?? '').trim().length >= 2, 'modelo do aparelho ausente');
req(String(receipt?.device?.androidVersion ?? '').trim().length >= 1, 'versão do Android ausente');

const testedAt = Date.parse(String(receipt?.testedAt ?? ''));
req(Number.isFinite(testedAt), 'testedAt inválido');
if (Number.isFinite(testedAt)) {
  const ageDays = (Date.now() - testedAt) / 86400000;
  req(ageDays >= -0.05, 'testedAt está no futuro');
  req(ageDays <= 7, 'recibo físico tem mais de 7 dias');
}

req(Number(receipt?.cardsTested)>=10, 'mínimo de 10 cartas reais testadas');
const positions = new Set(Array.isArray(receipt?.positionsTested) ? receipt.positionsTested : []);
for (const group of [['GK'], ['CB'], ['DMF','CMF'], ['AMF','SS'], ['CF']]) {
  req(group.some((position) => positions.has(position)), `faltou cobertura real de posição: ${group.join('/')}`);
}
req(Number(receipt?.largeVaultCount)>=225, 'Cofre precisa ter sido validado com pelo menos 225 fichas/cartas');

const checks = receipt?.checks ?? {};
for (const key of [
  'appLaunches',
  'r521AppShell',
  'r522HomeDashboard',
  'r523ReaderOcr',
  'r524ResultFicha',
  'r525SkillsImpeto',
  'r526Tactics',
  'r527Vault',
  'r528ExportShare',
  'r529AccountAdmin',
  'r530FinalPolish',
  'exactEditionResolved',
  'trainingExactBudget',
  'finalSkillSetVisible',
  'impetoDecisionVisible',
  'inactiveStyleFlagged',
  'vaultSave',
  'vaultReopen',
  'sameDecisionAfterReopen',
  'formationUsesSavedBuild',
  'benchAndSubstitutions',
  'zero56RegressionChecked',
  'noDuplicateCardAfterCatalogResolution',
  'noCrashDuringLargeVault',
  'updateCheckWorks',
  'noCrashFullFlow'
]) req(checks[key] === true, `check obrigatório não aprovado: ${key}`);

if (fail.length) throw new Error(`R532: aceitação física reprovada:\n- ${fail.join('\n- ')}`);
console.log(`R532 device acceptance APROVADA: ${receipt.cardsTested} cartas reais, ${receipt.largeVaultCount} no Cofre, aparelho ${receipt.device.model}, APK ${apkSha256.slice(0,12)}, source ${sourceSha.slice(0,12)}.`);
