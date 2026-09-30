import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const buildPath = '.github/workflows/build-apk.yml';
const acceptancePath = '.github/workflows/device-acceptance-r532.yml';
const buildWf = fs.readFileSync(buildPath, 'utf8');
const acceptanceWf = fs.readFileSync(acceptancePath, 'utf8');
const playWf = fs.readFileSync('.github/workflows/build-play-store.yml', 'utf8');

assert.equal(
  pkg.scripts['test:r533'],
  'node tests/v40-80-r533-release-ci-source-lock-regression.mjs',
  'R533 precisa ter regressão executável própria.'
);
assert.ok(pkg.scripts['ci:gate'].includes('npm run test:r533'), 'ci:gate precisa proteger R533.');
assert.equal(pkg.scripts['release:r533:verification'], 'node scripts/create-release-verification-r533.mjs');

assert.ok(
  buildWf.includes('export NEXT_PUBLIC_BUILDMASTER_BUILD_ID="$SOURCE_SHA"'),
  'Build Android precisa exportar no shell o SOURCE_SHA realmente compilado, inclusive em source_ref/rollback.'
);
assert.ok(
  !buildWf.includes('NEXT_PUBLIC_BUILDMASTER_BUILD_ID: ${{ github.sha }}') && !buildWf.includes('NEXT_PUBLIC_BUILDMASTER_BUILD_ID: ${{ env.SOURCE_SHA }}'),
  'github.sha do evento não pode identificar um source_ref diferente.'
);

assert.ok(buildWf.includes(`'buildId': f'{os.environ["SOURCE_SHA"]}-{os.environ["GITHUB_RUN_ATTEMPT"]}'`), 'Manifesto precisa identificar o sourceSha compilado no buildId.');
assert.ok(!buildWf.includes(`'buildId': f'{os.environ["GITHUB_SHA"]}-{os.environ["GITHUB_RUN_ATTEMPT"]}'`), 'Manifesto não pode identificar o evento quando source_ref compila outro commit.');

assert.ok(
  !buildWf.includes('device_acceptance_json:'),
  'Build não deve manter entrada legada R457; aceitação física R532 ocorre depois da release imutável.'
);
assert.ok(
  !buildWf.includes('validate:r457:device'),
  'Build não deve validar recibo R457 antes de existir o APK imutável R532.'
);

assert.ok(
  acceptanceWf.includes('git fetch --no-tags --depth=1 origin "$SOURCE_SHA"'),
  'Aceitação R532 precisa buscar o commit exato registrado no manifesto.'
);
assert.ok(
  acceptanceWf.includes('git checkout --detach "$SOURCE_SHA"'),
  'Aceitação R532 precisa executar o validator do mesmo sourceSha da release.'
);
assert.ok(
  acceptanceWf.indexOf('git checkout --detach "$SOURCE_SHA"') < acceptanceWf.indexOf('npm run validate:r532:device'),
  'Checkout do sourceSha deve acontecer antes da validação do recibo.'
);

assert.ok(buildWf.includes('npm run release:r533:verification'), 'Build precisa gerar recibo de estado R533.');
assert.ok(buildWf.includes('dist-apk/release-verification-r533.json'), 'Recibo R533 precisa ser publicado com a release.');
assert.ok(acceptanceWf.includes('DEVICE_ACCEPTED'), 'Aceitação física precisa produzir estado DEVICE_ACCEPTED.');
assert.ok(acceptanceWf.includes('release-verification-r533-accepted.json'), 'Aceitação precisa anexar recibo final R533.');


assert.ok(!playWf.includes('40.70.0'), 'Workflow Play não pode ficar travado em versão histórica 40.70.0.');
assert.ok(!playWf.includes('v40-30'), 'Nome do artefato Play não pode carregar versão histórica fixa.');
assert.ok(playWf.includes('SOURCE_SHA="$(git rev-parse HEAD)"'), 'Play precisa registrar o commit realmente compilado.');
assert.ok(playWf.includes('export NEXT_PUBLIC_BUILDMASTER_BUILD_ID="$SOURCE_SHA"'), 'Build web Play precisa embutir o sourceSha real.');
assert.ok(playWf.includes('npm run ci:gate'), 'Play precisa passar pelo mesmo gate funcional antes do AAB.');
assert.ok(playWf.includes('npm run ci:stabilize'), 'Play precisa provar convergência Zero-Red antes do build.');
assert.ok(playWf.includes('git diff --quiet'), 'Play deve falhar se a estabilização precisar alterar a fonte.');
assert.ok(playWf.includes('play-store/listing/pt-BR/release-notes/$BUILDMASTER_VERSION.txt'), 'Notas Play precisam acompanhar a versão atual do package.json.');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r533-'));
const verification = path.join(tmp, 'release-verification-r533.json');
execFileSync(process.execPath, ['scripts/create-release-verification-r533.mjs'], {
  env: {
    ...process.env, SOURCE_SHA: 'a'.repeat(40), APK_SHA256: 'b'.repeat(64), BUILDMASTER_VERSION: '40.80.0',
    ANDROID_VERSION_CODE: '2147000001', RELEASE_TAG: 'buildmaster-v40.80.0-2147000001-01', RELEASE_CHANNEL: 'stable',
    R533_RELEASE_VERIFICATION_OUT: verification, R533_DEVICE_STATUS: 'DEVICE_PENDING'
  }, stdio: 'pipe'
});
const receipt = JSON.parse(fs.readFileSync(verification, 'utf8'));
assert.equal(receipt.schemaVersion, 1);
assert.equal(receipt.buildStatus, 'BUILD_VERIFIED');
assert.equal(receipt.deviceStatus, 'DEVICE_PENDING');
assert.equal(receipt.sourceSha, 'a'.repeat(40));
assert.equal(receipt.apkSha256, 'b'.repeat(64));

const buildLines = buildWf.split(/\r?\n/);
for (let i = 0; i < buildLines.length - 1; i += 1) {
  const current = buildLines[i].trim();
  const next = buildLines[i + 1].trim();
  assert.ok(!(current.startsWith('uses:') && current === next), `Workflow não pode repetir chave uses consecutiva: linha ${i + 1}`);
}

console.log('R533 aprovada: release CI fica travado ao sourceSha real, remove gate R457 obsoleto e valida R532 com o validator do mesmo commit da release.');
