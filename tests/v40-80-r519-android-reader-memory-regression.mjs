import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const ocr = read('src/lib/ocr.ts');
const imageProcessing = read('src/modules/card-reader/imageProcessing.ts');

const enhanceImageLocally = ocr.match(/export async function enhanceImageLocally[\s\S]*?\n}/)?.[0] ?? '';
assert.match(
  enhanceImageLocally,
  /const maxDimension = 1600;[\s\S]{0,320}Math\.min\(1, maxDimension \/ Math\.max\(1, Math\.max\(bitmap\.width, bitmap\.height\)\)\)/,
  'R519: a prévia aprimorada deve limitar o maior lado a 1600px e nunca ampliar o print original.',
);

const preprocessImage = imageProcessing.match(/export async function preprocessImage[\s\S]*?\n}/)?.[0] ?? '';
assert.match(
  preprocessImage,
  /workload: 'ocr-full',[\s\S]{0,180}preferredLongestSide: 1800,[\s\S]{0,180}maxScale: 1/,
  'R519: o passe OCR da tela completa deve ser limitado a 1800px e nunca fazer upscale.',
);
assert.match(
  preprocessImage,
  /finally[\s\S]{0,260}bitmap\.close\?\.\(\)[\s\S]{0,220}canvas\.width = 1;[\s\S]{0,120}canvas\.height = 1;/,
  'R519: o canvas full-frame deve liberar explicitamente o backing store ao terminar.',
);

const cropImage = imageProcessing.match(/export async function cropImage[\s\S]*?\n}/)?.[0] ?? '';
assert.match(
  cropImage,
  /finally[\s\S]{0,260}bitmap\.close\?\.\(\)[\s\S]{0,220}canvas\.width = 1;[\s\S]{0,120}canvas\.height = 1;/,
  'R519: cada recorte deve liberar bitmap/canvas antes do próximo quadrado para impedir acúmulo de memória.',
);

console.log('R519 aprovada: leitor Android limita buffers full-frame e libera canvases entre etapas sem alterar R119/R126/R128.');
