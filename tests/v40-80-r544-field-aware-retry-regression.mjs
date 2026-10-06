import assert from 'node:assert/strict';
import fs from 'node:fs';

const zones = fs.readFileSync('src/modules/card-reader-v2/readerV2Zones.ts', 'utf8');
const worker = fs.readFileSync('src/modules/card-reader-v2/readerV2TesseractWorker.ts', 'utf8');

assert.match(
  zones,
  /function retryRecognitionKey\(key: ReaderV2FieldKey\)[\s\S]*#retry/,
  'R544 RED: o Reader V2 precisa marcar explicitamente a segunda tentativa sem criar outro crop.',
);
assert.match(
  zones,
  /workerSession\.recognize\(crop, retryRecognitionKey\(zone\.key\)\)/,
  'R544 RED: o retry de campo crítico deve usar o perfil OCR alternativo no mesmo crop.',
);
assert.match(
  worker,
  /const retry = normalized\.endsWith\('#retry'\)/,
  'R544 RED: o backend Tesseract deve reconhecer o perfil #retry.',
);
assert.match(
  worker,
  /retry[\s\S]*tessedit_pageseg_mode:[\s\S]*'13'/,
  'R544 RED: a segunda tentativa deve usar segmentação alternativa leve para campos críticos.',
);
assert.doesNotMatch(
  zones,
  /getImageData|putImageData|createElement\(['"]canvas['"]\)/,
  'R544: retry não pode reintroduzir buffer RGBA ou segundo canvas no leitor de zonas.',
);

console.log('R544 aprovado: retry crítico usa perfil Tesseract alternativo no mesmo crop e sem novo buffer de imagem.');
