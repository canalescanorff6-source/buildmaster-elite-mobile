import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const imageProcessing = read('src/modules/card-reader/imageProcessing.ts');
const readerAnalysis = read('src/modules/card-reader/readerAnalysisRuntimeR163.ts');

const repeatedSource = imageProcessing.match(/export async function prepareRepeatedOcrSource[\s\S]*?\n}/)?.[0] ?? '';
assert.match(
  repeatedSource,
  /preferredLongestSide:\s*2800/,
  'R538: Android não pode reduzir um print ~3283px para 1900px antes de recortar os quadrados; a fonte segura precisa preservar ~2800px de detalhe.',
);
assert.match(
  repeatedSource,
  /maxFullOcrMegapixels:\s*5(?:\.0)?/,
  'R538: a fonte reutilizável precisa permitir até 5 MP para preservar texto pequeno sem voltar ao full-frame irrestrito.',
);
assert.match(
  imageProcessing,
  /maxCropOcrMegapixels:\s*1\.8/,
  'R538: cada recorte Android deve permanecer abaixo de 1.8 MP para limitar ImageData + Tesseract.',
);
assert.match(
  imageProcessing,
  /export function releasePreparedOcrSource\(/,
  'R538: a cópia OCR reutilizável precisa ter liberação determinística ao fim da leitura.',
);

const largeTypedArrays = [...imageProcessing.matchAll(/new Uint8ClampedArray\((?:data\.length|data)\)/g)];
assert.ok(
  largeTypedArrays.length <= 1,
  `R538: enhancement ainda cria ${largeTypedArrays.length} buffers RGBA grandes; deve reutilizar ImageData e manter no máximo uma cópia temporária.`,
);

const finallyBlock = readerAnalysis.match(/finally\s*\{[\s\S]*?\n\s*}\n\s*}/)?.[0] ?? '';
assert.match(
  readerAnalysis,
  /const\s*\{[^}]*releaseOcrWorker[^}]*\}\s*=\s*ocrWorker/,
  'R538: runtime do leitor precisa receber releaseOcrWorker para liberar a memória WASM/Tesseract explicitamente.',
);
assert.match(
  finallyBlock,
  /delete document\.body\.dataset\.ocrReading;[\s\S]*await releaseOcrWorker\(\)/,
  'R538: o worker OCR deve ser encerrado no finally depois de desmarcar a sessão ativa.',
);
assert.match(
  finallyBlock,
  /releasePreparedOcrSource\(activeFile\)/,
  'R538: o Blob reduzido/cacheado deve ser removido no finally tanto em sucesso quanto em falha/cancelamento.',
);

console.log('R538 RED/green contract: detalhe preservado, buffers intermediários limitados e memória OCR liberada deterministicamente.');
