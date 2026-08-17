import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');
const layout = read('src/app/layout.tsx');
const progress = read('src/components/ProgressBarsV4010.tsx');
const updater = read('src/components/UpdateCenterPanel.tsx');
const secure = read('src/lib/secureStorage.ts');
const nativeGenerator = read('scripts/install-android-security-plugin.mjs');
const readerCard = read('src/components/ReaderRecoveryAndProgressV3840.tsx');
const readerSource = read('src/components/ReaderImageSourceCardV4010.tsx');
const app = read('src/components/CardVisionApp.tsx');
const css = read('src/app/v40-progress.css');
const register = read('src/components/RegisterServiceWorker.tsx');

assert.equal(pkg.version, '40.70.0');
assert.equal(manifest.name, 'BuildMaster Elite Tático v40.70');
assert.equal(manifest.short_name, 'BuildMaster v40.70');
assert.ok(sw.includes('buildmaster-v40-70-live-catalog-ocr-1'));
assert.ok(register.includes('40.70.0-progress-runtime-1'));
assert.ok(layout.includes("import './v40-progress.css';"));
assert.ok(layout.indexOf("import './v40-progress.css';") > layout.indexOf("import './v38-stability-theme.css';"), 'A camada de progresso precisa ficar depois da proteção visual.');
assert.ok(layout.includes('bm-v4020-progress'));

for (const marker of ['UpdateTransferProgressV4010', 'ReaderProgressBarV4010', 'formatProgressBytes', 'formatRemainingTime', 'updateOverallPercent', 'faltam', 'estimativa']) {
  assert.ok(progress.includes(marker), `Componente de progresso sem ${marker}`);
}
for (const phase of ['refreshing-manifest', 'preparing-backup', 'awaiting-permission', 'connecting', 'downloading-system', 'downloading-http', 'copying', 'verifying', 'opening-installer', 'ready']) {
  assert.ok(secure.includes(`'${phase}'`), `Contrato nativo sem fase ${phase}`);
}
assert.ok(updater.includes('v4020-global-update-progress'));
assert.ok(updater.includes("onApkDownloadProgress"));
assert.ok(updater.includes('UPDATE_TARGET_KEY'));
assert.ok(updater.includes('setCompletedVersion'));
assert.ok(updater.includes("phase: 'refreshing-manifest'"));
assert.ok(updater.includes("phase: 'preparing-backup'"));
assert.ok(updater.includes("phase: 'awaiting-permission'"));
assert.ok(updater.includes("phase: 'connecting'"));
assert.ok(updater.includes('UpdateTransferProgressV4010'));

for (const nativeMarker of ['emitProgress("copying"', 'emitProgress("verifying"', 'emitProgress("opening-installer"', 'emitProgress("ready"', 'downloadedBytes', 'totalBytes']) {
  assert.ok(nativeGenerator.includes(nativeMarker), `Atualizador nativo sem ${nativeMarker}`);
}

assert.ok(readerCard.includes('ReaderProgressBarV4010'));
assert.ok(readerCard.includes('progress={progress}'));
assert.ok(app.includes('ReaderProgressSnapshotV4010'));
assert.ok(app.includes('ReaderImageSourceCardV4010'));
assert.ok(readerSource.includes('SmartCardCropPanel'));
assert.ok(readerSource.includes('onFile'));
assert.ok(app.split('\n').length <= 5000, 'CardVisionApp não pode ultrapassar o orçamento estrutural após a barra de progresso.');
assert.ok(app.includes('setReaderProgress'));
assert.ok(app.includes('reportReaderProgress'));
for (const label of ['Recebendo imagem', 'Preparando imagem', 'Mapeando a carta', 'Lendo os quadrados', 'Conferindo campos', 'Montando resultado', 'Ficha gerada', 'Leitura concluída']) {
  assert.ok(app.includes(label), `Pipeline visual da leitura sem etapa ${label}`);
}
assert.ok(css.includes('.v4020-progress-track'));
assert.ok(css.includes('.v4020-global-update-progress'));
assert.ok(css.includes('.v4020-reader-progress'));
assert.ok(css.includes('.update-download-progress{display:none!important}'));

assert.ok(String(pkg.scripts?.['test:all']).includes('npm run test:v4020'));
assert.ok(String(pkg.scripts?.['test:all']).endsWith('npm run test:v4070'));
console.log('v40.30 aprovada: download/validação/instalador e leitura de cartas possuem progresso visual, porcentagem e estimativa sem regressão do leitor v40.00.');
