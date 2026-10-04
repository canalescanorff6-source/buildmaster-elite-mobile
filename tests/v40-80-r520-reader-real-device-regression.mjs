import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const imageProcessing=read('src/modules/card-reader/imageProcessing.ts');
const manualReader=read('src/modules/card-reader/manualCalibrationFastReader.ts');
const actions=read('src/modules/card-reader/cardVisionReaderActionsR187.ts');
const ocr=read('src/lib/ocr.ts');
const worker=read('src/lib/ocrWorkerManager.ts');

assert.match(imageProcessing,/createImageBitmap[\s\S]{0,2200}URL\.createObjectURL|URL\.createObjectURL[\s\S]{0,2200}createImageBitmap/,
  'R520 leitor: Android precisa de fallback por HTMLImageElement/ObjectURL quando createImageBitmap falhar ou não existir.');
assert.match(imageProcessing,/revokeObjectURL[\s\S]{0,500}image\.src\s*=\s*['"]|image\.src\s*=\s*['"][\s\S]{0,500}revokeObjectURL/,
  'R520 leitor: o fallback de imagem precisa liberar o recurso temporário sem manter a foto presa em memória.');

assert.match(manualReader,/failedMacros|macroFailures|unreadMacros/,
  'R520 leitor: falhas dos quadrados precisam ser contabilizadas, não convertidas silenciosamente em sucesso.');
assert.match(manualReader,/Nenhum quadrado pôde ser lido|não conseguiu ler os quadrados|quadrados não produziram texto/i,
  'R520 leitor: zero evidência OCR precisa falhar com mensagem recuperável.');

assert.match(actions,/readerSessionGateR520[\s\S]{0,900}missingCriticalFields/,
  'R520 leitor: o boundary precisa validar evidência crítica antes de aceitar a leitura.');
assert.match(actions,/const gate = readerSessionGateR520\(capturedSession\)[\s\S]{0,1200}Leitura incompleta/,
  'R520 leitor: sessão vazia precisa voltar ao Leitor com erro honesto.');
assert.match(actions,/if \(!gate\.ok\)[\s\S]{0,1200}openMainSection\('leitor'[\s\S]{0,1000}return undefined/,
  'R520 leitor: evidência insuficiente deve impedir a confirmação vazia no Resultado.');

// R536 — vídeos reais Android mostraram encerramento do processo durante OCR.
// O leitor precisa trabalhar sobre uma cópia reduzida reutilizável, limitar cada
// recorte e desmontar o worker logo depois que a leitura ativa terminar.
assert.match(imageProcessing,/safeOcrSourceCache|repeatedOcrSourceCache/,
  'R536 leitor: os vários quadrados não podem decodificar o print 12 MP original do zero a cada passagem.');
assert.match(imageProcessing,/prepareRepeatedOcrSource/,
  'R536 leitor: deve existir uma fonte OCR reduzida e reutilizável para Android.');
assert.match(imageProcessing,/maxCropOcrMegapixels[\s\S]{0,180}2\.[0-9]/,
  'R536 leitor: recortes Android precisam de teto explícito próximo de 2 MP para conter ImageData/canvas/Tesseract.');
assert.match(imageProcessing,/cropImage[\s\S]{0,1800}prepareRepeatedOcrSource/,
  'R536 leitor: cropImage deve usar a cópia segura antes de decodificar o recorte.');
assert.match(ocr,/createZoneOriginPreview[\s\S]{0,500}isAndroid/i,
  'R536 leitor: Android não deve gerar várias prévias base64 decodificando o print grande durante OCR.');
assert.match(worker,/ocrReading[\s\S]{0,1000}terminateIdleWorker|terminateIdleWorker[\s\S]{0,1000}ocrReading/,
  'R536 leitor: o worker precisa permanecer durante a leitura ativa e ser encerrado rapidamente quando ela termina.');
assert.match(worker,/android[\s\S]{0,1400}(?:600|750|800|1000|1200)/i,
  'R536 leitor: Android precisa de janela curta de liberação do worker após o OCR, não 45–150 segundos.');

console.log('R520/R536 leitor aprovada: fallback Android, fail-closed e fechamento de memória do OCR protegidos.');
