import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const worker = read('src/lib/ocrWorkerManager.ts');
const app = read('src/components/CardVisionApp.tsx');
const manual = read('src/modules/card-reader/manualCalibrationFastReader.ts');
const vendor = read('scripts/vendor-tesseract-assets.mjs');
const workflow = read('.github/workflows/build-apk.yml');

assert.match(worker, /createWorker\(\['por'\]/, 'Android deve inicializar somente o idioma português no worker principal.');
assert.doesNotMatch(worker, /createWorker\(\['por', 'eng'\]/, 'POR+ENG reproduz o bloqueio real em loading language traineddata.');
assert.match(worker, /Math\.max\(180_000, getRuntimeOptimizationProfile\(\)\.ocrWorkerIdleMs\)/, 'Worker pré-aquecido precisa permanecer vivo durante a calibração.');
assert.match(app, /void prewarmOcrWorker\(\)\.catch\(\(\) => undefined\)/, 'Seleção do print deve pré-aquecer OCR sem bloquear a interface.');
assert.match(app, /Carregando o leitor local em português/, 'Status técnico em inglês deve ser traduzido para o usuário.');
assert.match(app, /10 \+ local \* 5/, 'Bootstrap não pode fazer a barra regredir de 10% para 3%.');
assert.match(manual, /options\.onProgress\?\.\(0, plans\.length, 'Preparando OCR local'\)/, 'Leitor manual deve registrar total antes do bootstrap.');
assert.doesNotMatch(vendor, /eng\.traineddata\.gz/, 'Idioma inglês não usado não deve aumentar APK/update.');
assert.doesNotMatch(workflow, /Idioma OCR inglês ausente/, 'Build não deve exigir asset inglês não usado.');
console.log('v40.10 r2 aprovada: bootstrap OCR Android usa POR local, pré-aquecimento e progresso monotônico sem bloqueio em traineddata.');
