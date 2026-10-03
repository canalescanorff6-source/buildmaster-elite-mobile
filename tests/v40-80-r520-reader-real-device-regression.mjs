import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const imageProcessing=read('src/modules/card-reader/imageProcessing.ts');
const manualReader=read('src/modules/card-reader/manualCalibrationFastReader.ts');
const analysis=read('src/modules/card-reader/readerAnalysisRuntimeR163.ts');

assert.match(imageProcessing,/createImageBitmap[\s\S]{0,1800}URL\.createObjectURL|URL\.createObjectURL[\s\S]{0,1800}createImageBitmap/,
  'R520 leitor: Android precisa de fallback por HTMLImageElement/ObjectURL quando createImageBitmap falhar ou não existir.');
assert.match(imageProcessing,/releaseDecodedImage|revokeObjectURL|image\.src\s*=\s*['"]/,
  'R520 leitor: o fallback de imagem precisa liberar o recurso temporário sem manter a foto presa em memória.');

assert.match(manualReader,/failedMacros|macroFailures|unreadMacros/,
  'R520 leitor: falhas dos quadrados precisam ser contabilizadas, não convertidas silenciosamente em sucesso.');
assert.match(manualReader,/Nenhum quadrado pôde ser lido|não conseguiu ler os quadrados|quadrados não produziram texto/i,
  'R520 leitor: zero evidência OCR precisa falhar com mensagem recuperável.');

assert.match(analysis,/criticalMissing|missingCriticalFields/,
  'R520 leitor: a orquestração precisa validar evidência crítica antes de abrir Resultado.');
assert.match(analysis,/Leitura incompleta|leitura não foi concluída/i,
  'R520 leitor: o usuário precisa receber erro honesto quando OCR não produziu dados úteis.');
assert.match(analysis,/if\s*\([^\n]*(?:criticalMissing|missingCriticalFields)[\s\S]{0,1500}return;/,
  'R520 leitor: leitura crítica ausente deve encerrar no Leitor em vez de cair na confirmação vazia.');

console.log('R520 leitor aprovada: decode Android possui fallback e OCR vazio falha fechado antes do Resultado.');
