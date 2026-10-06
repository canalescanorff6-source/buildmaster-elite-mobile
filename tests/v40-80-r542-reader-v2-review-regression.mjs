import assert from 'node:assert/strict';
import fs from 'node:fs';

const reviewPath = 'src/modules/card-reader-v2/readerV2Review.ts';
const appPath = 'src/components/CardVisionApp.tsx';

assert.equal(fs.existsSync(reviewPath), true, 'R542 review: readerV2Review.ts precisa existir.');
const review = fs.readFileSync(reviewPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');

assert.match(review, /buildReaderV2ReviewDraft\s*\(/, 'R542 review: precisa existir builder puro do draft.');
assert.match(review, /assertReaderV2ReviewReady\s*\(/, 'R542 review: conferência precisa validar lifecycle antes de abrir.');
assert.match(review, /stage\s*!==\s*['"]ocrClosed['"]|stage\s*===\s*['"]ocrClosed['"]/, 'R542 review: somente o estágio ocrClosed pode liberar a conferência.');
assert.match(review, /workerReady/, 'R542 review: worker ativo precisa bloquear conferência.');
assert.match(review, /pendingRecognitions/, 'R542 review: reconhecimentos pendentes precisam bloquear conferência.');
assert.match(review, /toPreFinalConfirmationR542\s*\(/, 'R542 review: draft precisa adaptar para a tela pré-final existente.');
assert.match(review, /mainPosition:\s*draft\.mainPosition/, 'R543-E: pré-final deve carregar a posição realmente detectada pelo OCR.');
assert.match(review, /uncertainKeys:\s*\[\.\.\.draft\.uncertainKeys\]/, 'R543-E: pré-final deve carregar a lista de campos incertos sem inventar correções.');
assert.doesNotMatch(review, /readerV2OcrWorker|createReaderV2OcrWorkerSession|\.start\s*\(/, 'R542 review: conferência não pode criar/reiniciar worker OCR.');

assert.match(app, /preFinalConfirmation/, 'R542 review: a tela pré-final existente precisa continuar sendo reutilizada.');
assert.match(app, /value=\{preFinalConfirmation\.playerName\}[\s\S]{0,500}onChange=/, 'R542 review: nome precisa continuar editável.');
assert.match(app, /value=\{preFinalConfirmation\.level\}[\s\S]{0,700}onChange=/, 'R542 review: nível precisa continuar editável.');
assert.match(app, /value=\{preFinalConfirmation\.points\}[\s\S]{0,500}onChange=/, 'R542 review: pontos precisam continuar editáveis.');
assert.match(app, /preFinalConfirmation\.mainPosition/, 'R543-E: posição lida deve ficar visível na conferência pré-final.');
assert.match(app, /preFinalConfirmation\.uncertainKeys/, 'R543-E: campos incertos precisam ficar visíveis antes da ficha.');
assert.match(app, /value=\{cardPositionOverride\}/, 'R543-E: posição deve ser confirmável pelo catálogo oficial já usado no app.');
assert.match(app, /uncertainKeys\.includes\(['\"]mainPosition['\"]\)[\s\S]{0,900}cardPositionOverride\s*===\s*['\"]AUTO['\"]/, 'R543-E: posição incerta não pode seguir para a ficha sem confirmação manual.');

console.log('R542/R543-E review aprovado: pré-final reutilizada, posição/incerteza explícitas e OCR encerrado antes da conferência.');
