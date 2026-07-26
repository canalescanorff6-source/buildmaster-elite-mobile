import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const cardVision = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
const ocr = fs.readFileSync(path.join(root, 'src/lib/ocr.ts'), 'utf8');
const precision = fs.readFileSync(path.join(root, 'src/modules/card-reader/highPrecisionOcr.ts'), 'utf8');
const processing = fs.readFileSync(path.join(root, 'src/modules/card-reader/imageProcessing.ts'), 'utf8');

assert.doesNotMatch(cardVision, /\bocrKindForZone\b/, 'Importação não utilizada ocrKindForZone voltou ao CardVisionApp.');
assert.match(ocr, /export type LocalEnhancementMode = 'adaptive' \| 'contrast' \| 'sharp' \| 'color' \| 'binary' \| 'inverted'/);
assert.match(precision, /readingMode: 'balanced' \| 'precision' \| 'fast'/);
assert.match(precision, /if \(mode !== 'precision'\)/);
assert.match(processing, /type PixelBuffer = Uint8ClampedArray<ArrayBufferLike>/);

console.log('v31.10 hotfix TypeScript do OCR aprovado.');
