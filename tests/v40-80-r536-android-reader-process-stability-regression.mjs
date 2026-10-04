import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path,'utf8');
const worker = read('src/lib/ocrWorkerManager.ts');
const processing = read('src/modules/card-reader/imageProcessing.ts');
const fileDigest = worker.match(/export async function fileDigest[\s\S]*?\n}/)?.[0] ?? '';

assert.match(worker,/DIGEST_CHUNK_BYTES\s*=\s*256\s*\*\s*1024/,'R536: a assinatura da imagem precisa trabalhar em blocos pequenos.');
assert.match(fileDigest,/file\.slice\(/,'R536: o digest deve ler a imagem por fatias.');
assert.doesNotMatch(fileDigest,/file\.arrayBuffer\(\)/,'R536: nunca carregar o arquivo inteiro em ArrayBuffer durante a pré-leitura.');
assert.match(fileDigest,/const subtle\s*=\s*typeof crypto[^;]*crypto\.subtle/,'R536: WebCrypto deve continuar sendo a autoridade criptográfica quando disponível.');
assert.match(fileDigest,/subtle\.digest\('SHA-256'/,'R536: manter SHA-256 criptográfico nos blocos e no fechamento do digest.');
assert.match(worker,/workerBlobURL:\s*false/,'R536: Android deve iniciar o worker pela URL local sem duplicar o script em Blob.');

const prewarm = worker.match(/export async function prewarmOcrWorker[\s\S]*?\n}/)?.[0] ?? '';
assert.match(prewarm,/isAndroidRuntime\(\)[\s\S]*?return/,'R536: no Android o prewarm não deve carregar WASM\/traineddata antes do primeiro recorte.');

assert.match(processing,/readImageDimensions/,'R536: o pipeline precisa descobrir dimensões sem decodificar o bitmap completo.');
assert.match(processing,/createImageBitmap\(file,[\s\S]{0,500}resizeWidth:\s*plan\.width[\s\S]{0,160}resizeHeight:\s*plan\.height/,'R536: o full-frame deve ser decodificado já reduzido.');
assert.match(processing,/createImageBitmap\(file,\s*cropX,\s*cropY,\s*cropW,\s*cropH,[\s\S]{0,500}resizeWidth:\s*plan\.width/,'R536: recortes devem usar decode direto da região, sem manter o print 12 MP inteiro em memória.');
const preprocess = processing.match(/export async function preprocessImage[\s\S]*?\n}/)?.[0] ?? '';
assert.match(preprocess,/preferredLongestSide:\s*1400/,'R536: o passe de identificação full-frame deve ficar em 1400 px para reduzir pico de memória no WebView.');
const crop = processing.match(/export async function cropImage[\s\S]*?\n}/)?.[0] ?? '';
assert.match(crop,/preferredLongestSide:\s*safeTarget,\s*minScale:\s*0\.25,\s*maxScale:\s*4\.2/,'R536: recortes maiores que 1900 px precisam poder reduzir antes de criar ImageData.');
assert.doesNotMatch(crop,/preferredLongestSide:\s*safeTarget,\s*minScale:\s*1,\s*maxScale:\s*4\.2/,'R536: minScale 1 bloquearia o downscale e restauraria o pico de memória nos recortes grandes.');

console.log('R536 aprovada: digest incremental, worker Android sem prewarm pesado e decode redimensionado\/recortado antes do OCR.');
