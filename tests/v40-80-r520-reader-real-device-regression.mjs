import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');
const imageProcessing=read('src/modules/card-reader/imageProcessing.ts');
const manualReader=read('src/modules/card-reader/manualCalibrationFastReader.ts');
const publicActions=read('src/modules/card-reader/cardVisionReaderActionsR187.ts');
const legacyActions=read('src/modules/card-reader/cardVisionReaderActionsLegacyR187.ts');
const v2Actions=read('src/modules/card-reader-v2/cardVisionReaderActionsR542.ts');
const v2Bridge=read('src/modules/card-reader-v2/readerV2Bridge.ts');
const interaction=read('src/modules/card-reader/readerInteractionRuntimeR164.ts');
const readerRuntime=read('src/modules/card-reader/readerRuntimeR160.ts');
const ocr=read('src/lib/ocr.ts');
const worker=read('src/lib/ocrWorkerManager.ts');

assert.match(publicActions,/card-reader-v2\/cardVisionReaderActionsR542/,
  'R542/R520: caminho público do leitor precisa encaminhar para o Reader V2 sem apagar o fallback clássico.');

assert.match(imageProcessing,/createImageBitmap[\s\S]{0,2200}URL\.createObjectURL|URL\.createObjectURL[\s\S]{0,2200}createImageBitmap/,
  'R520 leitor clássico: Android precisa de fallback por HTMLImageElement/ObjectURL quando createImageBitmap falhar ou não existir.');
assert.match(imageProcessing,/revokeObjectURL[\s\S]{0,500}image\.src\s*=\s*['"]|image\.src\s*=\s*['"][\s\S]{0,500}revokeObjectURL/,
  'R520 leitor clássico: o fallback de imagem precisa liberar o recurso temporário sem manter a foto presa em memória.');

assert.match(manualReader,/failedMacros|macroFailures|unreadMacros/,
  'R520 leitor clássico: falhas dos quadrados precisam ser contabilizadas, não convertidas silenciosamente em sucesso.');
assert.match(manualReader,/Nenhum quadrado pôde ser lido|não conseguiu ler os quadrados|quadrados não produziram texto/i,
  'R520 leitor clássico: zero evidência OCR precisa falhar com mensagem recuperável.');

// O fallback clássico continua protegido pelo gate R520 original.
assert.match(legacyActions,/readerSessionGateR520[\s\S]{0,900}missingCriticalFields/,
  'R520 leitor clássico: o boundary precisa validar evidência crítica antes de aceitar a leitura.');
assert.match(legacyActions,/const gate = readerSessionGateR520\(capturedSession\)[\s\S]{0,1200}Leitura incompleta/,
  'R520 leitor clássico: sessão vazia precisa voltar ao Leitor com erro honesto.');
assert.match(legacyActions,/if \(!gate\.ok\)[\s\S]{0,1200}openMainSection\('leitor'[\s\S]{0,1000}return undefined/,
  'R520 leitor clássico: evidência insuficiente deve impedir a confirmação vazia no Resultado.');

// R542 substitui o boundary ativo por um fluxo ainda mais estrito: OCR encerra,
// abre conferência e só então o bridge autoriza o motor final.
const v2Analyze=v2Actions.match(/async function analyzeSelectedImage[\s\S]*?(?=\n\s*async function runAnalysis)/)?.[0]??'';
assert.match(v2Analyze,/setPreFinalConfirmation\(/,
  'R542/R520: OCR V2 precisa terminar em conferência, nunca promover resultado diretamente.');
assert.doesNotMatch(v2Analyze,/runAnalysis\s*\(/,
  'R542/R520: fim do OCR V2 não pode disparar ficha automaticamente.');
assert.match(v2Actions,/readerV2BridgeR542[\s\S]{0,1800}\.forward\(/,
  'R542/R520: confirmação V2 precisa atravessar bridge fail-closed antes do motor final.');
assert.match(v2Bridge,/ocrClosed|workerTerminated|worker_terminated|closed/i,
  'R542/R520: bridge deve exigir evidência de sessão OCR encerrada antes da análise.');

// R536/R538 — proteções do fallback clássico permanecem disponíveis.
assert.match(imageProcessing,/safeOcrSourceCache|repeatedOcrSourceCache/,
  'R536 leitor: os vários quadrados não podem decodificar o print original do zero a cada passagem.');
assert.match(imageProcessing,/prepareRepeatedOcrSource/,
  'R536 leitor: deve existir uma fonte OCR reduzida e reutilizável para Android.');
assert.match(imageProcessing,/maxCropOcrMegapixels[\s\S]{0,180}1\.8/,
  'R538 leitor: recortes Android precisam de teto explícito de 1.8 MP para conter ImageData/canvas/Tesseract.');
assert.match(imageProcessing,/cropImage[\s\S]{0,1800}prepareRepeatedOcrSource/,
  'R536 leitor: cropImage deve usar a cópia segura antes de decodificar o recorte.');
assert.match(ocr,/createZoneOriginPreview[\s\S]{0,500}isAndroid/i,
  'R536 leitor: Android não deve gerar várias prévias base64 decodificando o print grande durante OCR.');
assert.match(worker,/ocrReading[\s\S]{0,1000}terminateIdleWorker|terminateIdleWorker[\s\S]{0,1000}ocrReading/,
  'R536 leitor: o worker precisa permanecer durante a leitura ativa e ser encerrado rapidamente quando ela termina.');
assert.match(worker,/android[\s\S]{0,1400}(?:600|750|800|1000|1200)/i,
  'R536 leitor: Android precisa de janela curta de liberação do worker após o OCR, não 45–150 segundos.');

// R540 — fallback clássico continua seguro caso o feature gate seja revertido.
assert.match(readerRuntime,/loadImageSafetyRuntimeR540/,
  'R540 leitor: validação da imagem precisa ter loader leve independente do runtime OCR completo.');
assert.match(interaction,/isAndroidReaderRuntimeR540/,
  'R540 leitor: seleção de imagem precisa reconhecer o caminho Android de baixo pico de memória.');
assert.match(interaction,/loadImageSafetyRuntimeR540\(\)[\s\S]{0,900}loadBackgroundOcrRuntimeR160\(\)/,
  'R540 leitor: seleção Android deve validar e limpar checkpoint sem carregar os 18 módulos do OCR.');
const handleFile = interaction.match(/async function handleFile\(file: File\)[\s\S]*?\n  }\n\n  async function resumeInterruptedReading/)?.[0] ?? '';
assert.match(handleFile,/if \(isAndroidReaderRuntimeR540\(\)\)[\s\S]{0,900}return;/,
  'R540 leitor: Android deve encerrar o bootstrap leve antes do pré-aquecimento e dos previews pesados.');
assert.match(handleFile,/if \(isAndroidReaderRuntimeR540\(\)\)[\s\S]{0,1400}return;[\s\S]{0,1000}loadReaderRuntimeR160\(\)/,
  'R540 leitor: runtime OCR completo só pode ser carregado após o early-return Android da seleção.');
assert.doesNotMatch(handleFile,/loadReaderRuntimeR160\(\)[\s\S]{0,1000}if \(isAndroidReaderRuntimeR540\(\)\)/,
  'R540 leitor: não pode carregar o runtime pesado e só depois decidir pelo caminho Android leve.');

console.log('R520/R536/R538/R540/R542 leitor aprovado: fallback clássico protegido, V2 fail-closed e análise somente após OCR encerrado/conferência.');
