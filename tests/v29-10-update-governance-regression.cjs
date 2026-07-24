const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let ts;
try {
  ts = require('typescript');
} catch {
  ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
}

const sourcePath = path.join(process.cwd(), 'src/lib/appUpdates.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true
  },
  fileName: sourcePath,
  reportDiagnostics: true
});
const diagnostics = compiled.diagnostics || [];
assert.equal(diagnostics.filter((item) => item.category === ts.DiagnosticCategory.Error).length, 0, 'appUpdates.ts deve transpilar sem erro sintático');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-update-'));
const modulePath = path.join(temporary, 'appUpdates.cjs');
fs.writeFileSync(modulePath, compiled.outputText);
const {
  compareVersions,
  evaluateUpdateManifest,
  updateAudienceBucket,
  validateUpdateManifest
} = require(modulePath);

const checksum = 'a'.repeat(64);
const apkUrl = 'https://github.com/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-v29.11.0-1745500011-01/BuildMaster-Elite-Tatico-v29.11.0-174550001101-deadbeef.apk';

function manifest(overrides = {}) {
  return {
    schemaVersion: 3,
    appId: 'com.buildmaster.elitetatico',
    version: '29.11.0',
    versionCode: 1_745_500_011,
    buildId: 'release-29.11.0-test',
    publishedAt: '2026-07-24T20:00:00.000Z',
    channel: 'stable',
    updateType: 'apk',
    apkUrl,
    notes: ['Regressão v29.10'],
    checksum,
    sizeBytes: 40 * 1024 * 1024,
    releaseTag: 'buildmaster-v29.11.0-1745500011-01',
    assetName: 'BuildMaster-Elite-Tatico-v29.11.0-174550001101-deadbeef.apk',
    rolloutPercentage: 100,
    rolloutSalt: 'release-29.11.0',
    paused: false,
    ...overrides
  };
}

const valid = validateUpdateManifest(manifest());
assert.ok(valid, 'Manifesto schema 3 deve ser válido');
assert.equal(valid.rolloutPercentage, 100);
assert.equal(compareVersions('29.11.0', '29.10.9'), 1);

const stableInstall = evaluateUpdateManifest(manifest(), { versionName: '29.10.0', versionCode: 1_745_000_010 }, 'old-build', '', { preferredChannel: 'stable', audienceKey: 'device-a' });
assert.equal(stableInstall.available, true, 'Estável mais novo deve ficar disponível');

const beta = manifest({ channel: 'beta', buildId: 'beta-release' });
const stableUser = evaluateUpdateManifest(beta, { versionName: '29.10.0', versionCode: 1_745_000_010 }, 'old-build', '', { preferredChannel: 'stable', audienceKey: 'device-a' });
assert.equal(stableUser.available, false);
assert.match(stableUser.reason, /canal de testes/i);
const betaUser = evaluateUpdateManifest(beta, { versionName: '29.10.0', versionCode: 1_745_000_010 }, 'old-build', '', { preferredChannel: 'beta', audienceKey: 'device-a' });
assert.equal(betaUser.available, true, 'Usuário beta deve aceitar manifesto beta');

const paused = evaluateUpdateManifest(manifest({ paused: true }), { versionName: '29.10.0', versionCode: 1_745_000_010 }, 'old-build', '', { preferredChannel: 'stable', audienceKey: 'device-a' });
assert.equal(paused.available, false);
assert.match(paused.reason, /pausada/i);
const mandatoryPaused = evaluateUpdateManifest(manifest({ paused: true, mandatory: true }), { versionName: '29.10.0', versionCode: 1_745_000_010 }, 'old-build', '', { preferredChannel: 'stable', audienceKey: 'device-a' });
assert.equal(mandatoryPaused.available, true, 'Atualização obrigatória não é escondida pela pausa');
assert.equal(mandatoryPaused.mandatory, true);

const salt = 'rollout-regression';
let includedKey = '';
let excludedKey = '';
for (let index = 0; index < 10_000 && (!includedKey || !excludedKey); index += 1) {
  const key = `device-${index}`;
  const bucket = updateAudienceBucket(key, salt);
  if (bucket < 20 && !includedKey) includedKey = key;
  if (bucket >= 20 && !excludedKey) excludedKey = key;
}
assert.ok(includedKey && excludedKey, 'Teste deve localizar grupos de rollout');
const gradualManifest = manifest({ rolloutPercentage: 20, rolloutSalt: salt });
assert.equal(evaluateUpdateManifest(gradualManifest, { versionName: '29.10.0', versionCode: 1_745_000_010 }, 'old-build', '', { preferredChannel: 'stable', audienceKey: includedKey }).available, true);
const excluded = evaluateUpdateManifest(gradualManifest, { versionName: '29.10.0', versionCode: 1_745_000_010 }, 'old-build', '', { preferredChannel: 'stable', audienceKey: excludedKey });
assert.equal(excluded.available, false);
assert.match(excluded.reason, /fora da etapa atual/i);
assert.equal(updateAudienceBucket(includedKey, salt), updateAudienceBucket(includedKey, salt), 'Bucket deve ser determinístico');

const rollback = validateUpdateManifest(manifest({ rollbackFromVersion: '29.10.0', rollbackReason: 'Falha crítica confirmada' }));
assert.equal(rollback.rollbackFromVersion, '29.10.0');
assert.equal(rollback.rollbackReason, 'Falha crítica confirmada');

assert.equal(validateUpdateManifest(manifest({ rolloutPercentage: 101 })), null, 'Rollout acima de 100 deve ser rejeitado');
assert.equal(validateUpdateManifest(manifest({ schemaVersion: 4 })), null, 'Schema futuro desconhecido deve ser rejeitado');

fs.rmSync(temporary, { recursive: true, force: true });
console.log('✓ Canais estável e beta');
console.log('✓ Pausa e obrigatoriedade');
console.log('✓ Rollout determinístico');
console.log('✓ Metadados de rollback');
console.log('Bloco 13: motor de atualização definitiva aprovado.');
