import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const imageProcessing=read('src/modules/card-reader/imageProcessing.ts');
const worker=read('src/lib/ocrWorkerManager.ts');
const repeatedSource=imageProcessing.match(/export async function prepareRepeatedOcrSource[\s\S]*?\n}/)?.[0]??'';

assert.match(repeatedSource,/preferredLongestSide:\s*2800/,
  'R538: Android não pode reduzir um print ~3283px para 1900px antes de recortar os quadrados; a fonte segura precisa preservar ~2800px de detalhe.');
assert.match(repeatedSource,/maxFullOcrMegapixels:\s*5(?:\.0)?/,
  'R538: a fonte reutilizável precisa permitir até 5 MP para preservar texto pequeno sem voltar ao full-frame irrestrito.');
assert.match(imageProcessing,/maxCropOcrMegapixels:\s*1\.8/,
  'R538: cada recorte Android deve permanecer abaixo de 1.8 MP para limitar ImageData + Tesseract.');
assert.match(imageProcessing,/export function releasePreparedOcrSource\(/,
  'R538: a cópia OCR reutilizável precisa ter uma operação explícita de liberação.');
assert.match(imageProcessing,/schedulePreparedOcrSourceRelease[\s\S]{0,1600}releasePreparedOcrSource/,
  'R538: a fonte reutilizável precisa ser descartada automaticamente assim que a sessão OCR deixar de estar ativa.');

const largeTypedArrays=[...imageProcessing.matchAll(/new Uint8ClampedArray\((?:data\.length|data)\)/g)];
assert.ok(largeTypedArrays.length<=1,
  `R538: enhancement ainda cria ${largeTypedArrays.length} buffers RGBA grandes; deve reutilizar ImageData e manter no máximo uma cópia temporária.`);
assert.match(worker,/ANDROID_IDLE_RELEASE_MS\s*=\s*(?:600|750|800|1000|1200)/,
  'R538: o Tesseract precisa continuar sendo desmontado em janela curta após o fim da leitura ativa.');
assert.match(worker,/pendingRecognitions\s*>\s*0\s*\|\|\s*\(android\s*&&\s*ocrReadingActive\(\)\)/,
  'R538: a proteção de memória não pode derrubar o worker entre dois quadrados enquanto a leitura ainda está ativa.');

console.log('R538 RED/GREEN: detalhe útil preservado, apenas um buffer RGBA temporário e recursos OCR liberados após a sessão.');
