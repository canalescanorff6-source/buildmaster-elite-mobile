import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const imageProcessing=read('src/modules/card-reader/imageProcessing.ts');
const manualReader=read('src/modules/card-reader/manualCalibrationFastReader.ts');
const actions=read('src/modules/card-reader/cardVisionReaderActionsR187.ts');

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

console.log('R520 leitor aprovada: decode Android possui fallback e OCR vazio falha fechado antes do Resultado.');
