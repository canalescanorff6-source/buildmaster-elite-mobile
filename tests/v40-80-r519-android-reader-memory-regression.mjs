import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

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

// R520 — o atualizador não pode parecer travado durante fila/conexão/verificação.
const branding = read('scripts/install-android-branding.mjs');
const updaterPatch = read('scripts/patch-android-update-progress-r520.mjs');
const updateProgressUi = read('src/components/ProgressBarsV4010.tsx');
assert.match(branding, /patch-android-update-progress-r520\.mjs/, 'R520: o build Android deve aplicar o patch de telemetria do atualizador.');
for (const phase of ['waiting-download', 'download-paused', 'verifying-checksum', 'verifying-package', 'verifying-signature', 'finalizing-file']) {
  assert.ok(updaterPatch.includes(phase), `R520: fase nativa ausente: ${phase}.`);
  assert.ok(updateProgressUi.includes(phase), `R520: UI não reconhece a fase ${phase}.`);
}
assert.match(updaterPatch, /verifiedBytes[\s\S]{0,700}emitProgress\("verifying-checksum"/, 'R520: SHA-256 precisa publicar progresso incremental por bytes.');
assert.match(updateProgressUi, /indeterminatePhases/, 'R520: etapas sem total conhecido precisam aparecer como atividade indeterminada, não barra congelada.');
assert.match(updateProgressUi, /<progress[\s\S]{0,180}v4020-progress-track/, 'R520: a barra deve trocar para progresso indeterminado durante espera/conexão.');
assert.match(updateProgressUi, /Tempo nesta etapa/, 'R520: o usuário deve enxergar que a etapa continua viva mesmo antes do primeiro byte.');
execFileSync(process.execPath,['tests/v40-80-r520-reader-real-device-regression.mjs'],{stdio:'inherit'});

console.log('R519/R520 aprovadas: leitor limita memória, falha fechado sem evidência e o atualizador expõe todas as etapas reais.');
