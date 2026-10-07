import assert from 'node:assert/strict';
import fs from 'node:fs';

const reviewPath = 'src/modules/card-reader-v2/readerV2Review.ts';
const appPath = 'src/components/CardVisionApp.tsx';

assert.equal(fs.existsSync(reviewPath), true, 'R542 review: readerV2Review.ts precisa existir.');
const review = fs.readFileSync(reviewPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');
const reviewUi = fs.readFileSync('src/components/PreFinalCardReviewR548.tsx', 'utf8');

assert.match(review, /buildReaderV2ReviewDraft\s*\(/, 'R542 review: precisa existir builder puro do draft.');
assert.match(review, /assertReaderV2ReviewReady\s*\(/, 'R542 review: conferência precisa validar lifecycle antes de abrir.');
assert.match(review, /stage\s*!==\s*['"]ocrClosed['"]|stage\s*===\s*['"]ocrClosed['"]/, 'R542 review: somente o estágio ocrClosed pode liberar a conferência.');
assert.match(review, /workerReady/, 'R542 review: worker ativo precisa bloquear conferência.');
assert.match(review, /pendingRecognitions/, 'R542 review: reconhecimentos pendentes precisam bloquear conferência.');
assert.match(review, /toPreFinalConfirmationR542\s*\(/, 'R542 review: draft precisa adaptar para a tela pré-final existente.');
assert.match(review, /attributeValues\s*:\s*evidence\.attributeValues/, 'R548 RED: os 26 atributos estruturados não podem ser descartados ao abrir a conferência.');
assert.doesNotMatch(review, /readerV2OcrWorker|createReaderV2OcrWorkerSession|\.start\s*\(/, 'R542 review: conferência não pode criar/reiniciar worker OCR.');

assert.match(app, /preFinalConfirmation/, 'R542 review: a tela pré-final existente precisa continuar sendo reutilizada.');
assert.match(app, /<PreFinalCardReviewR548/, 'R542 review: shell precisa renderizar o componente de conferência.');
assert.match(reviewUi, /value=\{preFinalConfirmation\.playerName\}[\s\S]{0,500}onChange=/, 'R542 review: nome precisa continuar editável.');
assert.match(reviewUi, /value=\{preFinalConfirmation\.level\}[\s\S]{0,700}onChange=/, 'R542 review: nível precisa continuar editável.');
assert.match(reviewUi, /value=\{preFinalConfirmation\.points\}[\s\S]{0,500}onChange=/, 'R542 review: pontos precisam continuar editáveis.');

console.log('R542 review aprovado: pré-final reutilizada e OCR encerrado antes da conferência.');
