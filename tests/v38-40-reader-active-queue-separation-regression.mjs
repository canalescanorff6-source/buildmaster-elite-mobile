import assert from 'node:assert/strict';
import fs from 'node:fs';

const background = fs.readFileSync('src/lib/backgroundOcrV3840.ts', 'utf8');
const queue = fs.readFileSync('src/modules/card-reader/ocrQueue.ts', 'utf8');
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const ui = fs.readFileSync('src/components/ReaderRecoveryAndProgressV3840.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');

assert.match(background, /ACTIVE_JOB_STORE = 'backup-snapshots'/, 'Leitura ativa deve ficar fora da fila manual.');
assert.match(background, /LEGACY_ACTIVE_JOB_KEY = 'active-card-reading'/, 'Deve migrar o checkpoint legado.');
assert.match(background, /runtimeDelete\('ocr-queue', LEGACY_ACTIVE_JOB_KEY\)/, 'Checkpoint legado deve ser removido da fila.');
assert.match(queue, /function isRealOcrQueueJob/, 'Fila deve validar o formato dos itens.');
assert.match(queue, /job\.id\.startsWith\('ocr-job-'\)/, 'Checkpoint de background não pode aparecer como print da fila.');
assert.match(app, /Leitura interrompida encontrada/, 'A retomada deve ser explícita.');
assert.match(app, /resumeInterruptedReading/, 'Deve existir ação real de retomar.');
assert.match(app, /discardInterruptedReading/, 'Deve existir ação real de descartar.');
assert.match(app, /clearBackgroundOcrCheckpoint\(\)/, 'Cancelar/descartar deve limpar checkpoint.');
assert.doesNotMatch(app, /window\.setTimeout\(\(\) => \{ if \(active\) void analyzeSelectedImage\(restored, true\); \}, 80\)/, 'OCR não deve reiniciar sozinho na abertura.');
assert.match(app, /ReaderLiveProgressCardV3840/, 'Leitura ativa deve renderizar o componente de progresso.');
assert.match(ui, /reader-live-progress-card/, 'Leitura ativa deve ter tela de progresso visível.');
assert.match(css, /\.reader-live-progress-card/, 'Tela de progresso deve possuir layout próprio.');
console.log('✓ v38.40 r3: leitura ativa separada da fila, retomada explícita e cancelamento real.');
