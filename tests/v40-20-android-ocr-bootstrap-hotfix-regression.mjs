import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const worker = read('src/lib/ocrWorkerManager.ts');
const interaction = read('src/modules/card-reader/readerInteractionRuntimeR164.ts');
const analysis = read('src/modules/card-reader/readerAnalysisRuntimeR163.ts');
const manual = read('src/modules/card-reader/manualCalibrationFastReader.ts');
const vendor = read('scripts/vendor-tesseract-assets.mjs');
const workflow = read('.github/workflows/build-apk.yml');
const playWorkflow = read('.github/workflows/build-play-store.yml');

assert.match(worker, /createWorker\(\['por'\]/, 'Android deve inicializar somente o idioma português no worker principal.');
assert.doesNotMatch(worker, /createWorker\(\['por', 'eng'\]/, 'POR+ENG reproduz o bloqueio real em loading language traineddata.');
assert.match(worker, /Math\.max\(180_000, getRuntimeOptimizationProfile\(\)\.ocrWorkerIdleMs\)/, 'Worker pré-aquecido precisa permanecer vivo durante a calibração.');
assert.match(interaction, /void ocrWorker\.prewarmOcrWorker\(\)\.catch\(\(\) => undefined\)/, 'Seleção do print deve pré-aquecer OCR sem bloquear a interface na autoridade R164.');
assert.match(analysis, /Carregando o leitor local em português/, 'Status técnico em inglês deve ser traduzido para o usuário na autoridade R163.');
assert.match(analysis, /10 \+ local \* 5/, 'Bootstrap não pode fazer a barra regredir de 10% para 3% na autoridade R163.');
assert.match(manual, /options\.onProgress\?\.\(0, total, 'Inicializando OCR local'\)/, 'Leitor manual deve registrar os 8 quadrados antes do bootstrap.');
assert.match(vendor, /4\.0\.0_best_int/, 'Modelo português BEST deve ser preservado para precisão.');
assert.match(vendor, /public\/tesseract\/lang\/por\.traineddata'/, 'traineddata deve entrar descompactado no APK.');
assert.doesNotMatch(vendor, /public\/tesseract\/lang\/por\.traineddata\.gz'/, 'WebView não deve descompactar traineddata em tempo de leitura.');
assert.doesNotMatch(workflow, /Idioma OCR inglês ausente/, 'Build não deve exigir asset inglês não usado.');
assert.match(playWorkflow, /npm run vendor:ocr/, 'AAB da Play Store também deve preparar os assets OCR locais antes do build.');
assert.match(playWorkflow, /out\/tesseract\/lang\/por\.traineddata/, 'AAB deve falhar cedo se o traineddata português não entrar no site estático.');
console.log('v40.30 r2 aprovada: bootstrap OCR Android usa POR local, pré-aquecimento e progresso monotônico sem bloqueio em traineddata.');
