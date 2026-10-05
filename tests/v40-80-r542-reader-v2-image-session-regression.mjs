import assert from 'node:assert/strict';
import fs from 'node:fs';

const sourcePath = 'src/modules/card-reader-v2/readerV2ImageSession.ts';
assert.equal(fs.existsSync(sourcePath), true, 'R542 imagem: readerV2ImageSession.ts precisa existir.');

const source = fs.readFileSync(sourcePath, 'utf8');

assert.match(source, /DEFAULT_MAX_SOURCE_DIMENSION\s*=\s*1800/, 'R542 imagem: fonte Android precisa ter limite padrão de 1800 px.');
assert.match(source, /DEFAULT_MAX_CROP_MEGAPIXELS\s*=\s*1\.2/, 'R542 imagem: crop OCR precisa ter teto padrão de 1.2 MP.');
assert.match(source, /URL\.createObjectURL\(/, 'R542 imagem: preview deve usar ObjectURL, sem base64 da imagem inteira.');
assert.match(source, /URL\.revokeObjectURL\(/, 'R542 imagem: ObjectURL precisa ser revogado no fechamento.');
assert.doesNotMatch(source, /\.toDataURL\s*\(/, 'R542 imagem: runtime V2 não pode materializar imagem/crop como data URL.');
assert.match(source, /createImageBitmap\(/, 'R542 imagem: a sessão precisa decodificar a fonte explicitamente.');
assert.match(source, /\.close\?\.\(\)|\.close\(\)/, 'R542 imagem: ImageBitmap precisa ser liberado deterministicamente.');
assert.match(source, /finally\s*\{[\s\S]{0,1200}canvas\.width\s*=\s*1[\s\S]{0,300}canvas\.height\s*=\s*1/, 'R542 imagem: canvas temporário precisa ser esvaziado no finally.');
assert.match(source, /withCrop\s*<|withCrop\s*\(/, 'R542 imagem: recorte temporário deve ser exposto somente por withCrop().');
assert.doesNotMatch(source, /export\s+(?:async\s+)?function\s+(?:crop|createCrop|renderCrop)\b/i, 'R542 imagem: não deve existir API pública que retenha crop fora de withCrop().');
assert.match(source, /Math\.min\(\s*1\s*,[\s\S]{0,180}maxSourceDimension/, 'R542 imagem: redimensionamento global nunca pode fazer upscale.');
assert.match(source, /maxCropMegapixels[\s\S]{0,700}(?:1_000_000|1000000)/, 'R542 imagem: cálculo de crop deve respeitar orçamento explícito em megapixels.');

console.log('R542 imagem aprovado: sessão limitada, sem base64 e com liberação determinística.');
