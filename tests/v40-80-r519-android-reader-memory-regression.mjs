import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const actions = read('src/modules/card-reader/cardVisionReaderActionsR187.ts');
const interaction = read('src/modules/card-reader/readerInteractionRuntimeR164.ts');
const ocr = read('src/lib/ocr.ts');
const imageProcessing = read('src/modules/card-reader/imageProcessing.ts');

const analyzeSelectedImage = actions.match(/async function analyzeSelectedImage[\s\S]*?\n  async function analyzeTotalCardCaptures/)?.[0] ?? '';
assert.match(
  analyzeSelectedImage,
  /readerImageMemory\.releaseEnhanced\(\)[\s\S]{0,180}setEnhancedPreview\(null\)[\s\S]{0,900}loadReaderAnalysisRuntimeR163\(\)/,
  'R519: a cópia visual aprimorada deve ser liberada antes de iniciar o OCR pesado no Android.',
);

const handleFile = interaction.match(/async function handleFile\(file: File\)[\s\S]*?\n  async function resumeInterruptedReading/)?.[0] ?? '';
assert.doesNotMatch(
  handleFile,
  /enhanceImageLocally\(/,
  'R519: selecionar a imagem não pode materializar automaticamente uma segunda cópia full-frame antes do OCR.',
);

const enhanceImageLocally = ocr.match(/export async function enhanceImageLocally[\s\S]*?\n}/)?.[0] ?? '';
assert.match(
  enhanceImageLocally,
  /const maxDimension = 1600;[\s\S]{0,260}Math\.min\(1, maxDimension \/ Math\.max\(1, Math\.max\(bitmap\.width, bitmap\.height\)\)\)/,
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
  /finally[\s\S]{0,220}bitmap\.close\?\.\(\)[\s\S]{0,220}canvas\.width = 1;[\s\S]{0,120}canvas\.height = 1;/,
  'R519: o canvas full-frame deve liberar explicitamente o backing store ao terminar.',
);

const cropImage = imageProcessing.match(/export async function cropImage[\s\S]*?\n}/)?.[0] ?? '';
assert.match(
  cropImage,
  /finally[\s\S]{0,220}bitmap\.close\?\.\(\)[\s\S]{0,220}canvas\.width = 1;[\s\S]{0,120}canvas\.height = 1;/,
  'R519: cada recorte deve liberar bitmap/canvas antes do próximo quadrado para impedir acúmulo de memória.',
);

console.log('R519 aprovada: leitor Android reduz pico de memória antes e durante OCR sem alterar R119/R126/R128.');
