import assert from 'node:assert/strict';
import fs from 'node:fs';

const reviewPath = 'src/modules/card-reader-v2/readerV2Review.ts';
assert.ok(fs.existsSync(reviewPath), 'R542 review builder precisa existir.');
const review = fs.readFileSync(reviewPath, 'utf8');
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');

assert.match(review, /buildReaderV2ReviewDraft/);
assert.doesNotMatch(review, /createProductionAnalysisR138|@\/modules\/analysis|Tesseract|prewarm/i);
assert.match(app, /preFinalConfirmation/);
assert.match(app, /Nome do jogador/);
assert.match(app, /Pontos de progressão disponíveis/);
assert.match(app, /setPreFinalConfirmation/);
assert.match(review, /ocrClosed/);
console.log('R542 review GREEN: conferência reutiliza tela pré-final sem reabrir OCR.');
