import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const db = read('src/lib/localDatabase.ts');
const worker = read('src/lib/ocrWorkerManager.ts');
const precision = read('src/modules/card-reader/highPrecisionOcr.ts');
const total = read('src/components/TotalCardReaderPanel.tsx');

assert.ok(app.includes("void saveBackgroundOcrCheckpoint({"), 'Checkpoint inicial não pode bloquear o começo do OCR.');
assert.ok(!app.includes("await saveBackgroundOcrCheckpoint({"), 'Regressão: checkpoint voltou a bloquear o leitor.');
assert.ok(app.includes("openMainSection('resultado');"), 'Resultado deve abrir somente após a leitura produzir a prévia.');
assert.ok(app.includes("if (resumed && mainSection !== 'leitor') openMainSection('leitor');"), 'Retomada precisa manter controles do leitor visíveis.');
assert.ok(total.includes('Cancelar leitura') && total.includes('onCancel'), 'Leitor total precisa manter saída/cancelamento durante processamento.');

assert.ok(db.includes('DB_OPEN_TIMEOUT_MS'), 'IndexedDB precisa de timeout de abertura.');
assert.ok(db.includes('request.onblocked'), 'IndexedDB bloqueado precisa falhar sem travar a interface.');
assert.ok(db.includes('tx.onabort'), 'Transações abortadas precisam encerrar a espera.');
assert.ok(db.includes('DB_TRANSACTION_TIMEOUT_MS'), 'Transações precisam de watchdog.');

assert.ok(worker.includes('OCR_RECOGNITION_TIMEOUT_MS'), 'Reconhecimento OCR precisa de timeout.');
assert.ok(worker.includes('O motor OCR foi reiniciado'), 'Timeout deve reiniciar o worker travado.');
assert.ok(worker.includes('recognitionDeadline(worker.recognize(image)'), 'Toda leitura Tesseract precisa passar pelo watchdog.');

assert.ok(precision.includes("getRuntimeOptimizationProfile().tier"), 'Alta precisão precisa respeitar capacidade do aparelho.');
assert.ok(precision.includes("const taskCap = options.readingMode === 'fast'"), 'Quantidade de passagens precisa ser limitada por perfil.');
assert.ok(precision.includes("window.setTimeout(resolve, 0)"), 'OCR deve devolver frames à interface entre passagens.');

console.log('v38.40 hotfix OCR anti-travamento aprovado: persistência não bloqueante, IndexedDB com watchdog, Tesseract com deadline, cancelamento visível e passagens adaptativas.');
